import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

const elderly = "11111111-1111-4111-8111-111111111111";
const caregiver = "22222222-2222-4222-8222-222222222222";
const stranger = "33333333-3333-4333-8333-333333333333";
const anotherElder = "44444444-4444-4444-8444-444444444444";
const medication = "55555555-5555-4555-8555-555555555555";
let db: PGlite;
async function asUser(id: string) {
  await db.exec("set local role authenticated");
  await db.query("select set_config('request.jwt.claim.sub', $1, true)", [id]);
}
async function rejected(sql: string, expectedCode?: string) {
  await db.exec("savepoint expected_failure");
  let error: unknown;
  try { await db.exec(sql); } catch (cause) { error = cause; }
  await db.exec("rollback to savepoint expected_failure; release savepoint expected_failure");
  expect(error, "Database must reject unauthorized or invalid SQL").toBeTruthy();
  if (expectedCode) expect((error as { code: string }).code).toBe(expectedCode);
}
async function approve() {
  await asUser(elderly);
  await db.exec("update public.caregiver_relationships set status = 'active'");
}
async function count(table: string) {
  return Number((await db.query<{ n: number }>(`select count(*) as n from public.${table}`)).rows[0].n);
}

beforeAll(async () => {
  db = new PGlite();
  // Supabase supplies these auth objects. The actual migration is run unchanged below.
  await db.exec(`create role anon; create role authenticated; create schema auth;
    create table auth.users (id uuid primary key, raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth to authenticated;
    grant execute on function auth.uid() to authenticated;`);
  await db.exec(await readFile("supabase/migrations/202611150001_carequest.sql", "utf8"));
  for (const [id, role] of [[elderly, "elderly"], [caregiver, "caregiver"], [stranger, "caregiver"], [anotherElder, "elderly"]]) {
    await db.query("insert into auth.users(id, raw_user_meta_data) values ($1, $2)", [id, JSON.stringify({ role, display_name: "Test member", timezone: "UTC" })]);
  }
  await db.query("insert into public.caregiver_relationships (elderly_id, caregiver_id) values ($1, $2)", [elderly, caregiver]);
  await db.query("insert into public.medications (id, patient_id, name, dosage, scheduled_time, starts_on, created_by) values ($1, $2, 'Test medicine', '1 tablet', '08:00', current_date, $3)", [medication, elderly, caregiver]);
  await db.query("insert into public.appointments(patient_id, title, starts_at) values ($1, 'Check-up', now())", [elderly]);
  await db.query("insert into public.emergency_contacts(patient_id, name, phone) values ($1, 'Test contact', '+15550102024')", [elderly]);
  await db.query("insert into public.wellness_check_ins(patient_id, mood) values ($1, 4)", [elderly]);
  await db.query("insert into public.sos_events(patient_id) values ($1)", [elderly]);
  await db.query("insert into public.notification_logs(recipient_id, kind) values ($1, 'medication')", [elderly]);
}, 60000);
beforeEach(async () => { await db.exec("begin"); });
afterEach(async () => { await db.exec("rollback"); });
afterAll(async () => { await db.close(); });

describe("PostgreSQL migration and Row Level Security", () => {
  it("enables RLS on every application table and denies anonymous reads", async () => {
    const tables = await db.query<{ relrowsecurity: boolean }>("select relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r'");
    expect(tables.rows).toHaveLength(9);
    expect(tables.rows.every((r) => r.relrowsecurity)).toBe(true);
    await db.exec("set local role anon");
    await rejected("select * from public.medications", "42501");
  });
  it("does not let pending caregivers read health records or approve themselves", async () => {
    await asUser(caregiver);
    expect(await count("medications")).toBe(0);
    const update = await db.query("update public.caregiver_relationships set status='active' returning id");
    expect(update.rows).toHaveLength(0);
    await rejected(`insert into public.medications(patient_id,name,dosage,scheduled_time,starts_on) values ('${elderly}','Unauthorized','1','09:00',current_date)`, "42501");
  });
  it("prevents role escalation, forged consent, and patient reassignment", async () => {
    await asUser(caregiver);
    await rejected("update public.profiles set role='elderly'", "42501");
    await rejected(`insert into public.caregiver_relationships(elderly_id,caregiver_id,status) values ('${anotherElder}','${caregiver}','active')`, "42501");
    await rejected(`update public.caregiver_relationships set elderly_id='${anotherElder}'`, "42501");
    await approve(); await asUser(caregiver);
    await rejected(`update public.medications set patient_id='${anotherElder}'`, "42501");
  });
  it("allows approved caregivers to add and edit, with version conflict detection", async () => {
    await approve(); await asUser(caregiver);
    expect(await count("medications")).toBe(1);
    await db.query("insert into public.medications(patient_id,name,dosage,scheduled_time,starts_on) values ($1,'Second medicine','2 tablets','12:00',current_date)", [elderly]);
    const updated = await db.query<{ version: number }>("update public.medications set dosage='Updated dosage' where id=$1 and version=1 returning version", [medication]);
    expect(updated.rows[0].version).toBe(2);
    const conflict = await db.query("update public.medications set dosage='Stale edit' where id=$1 and version=1 returning id", [medication]);
    expect(conflict.rows).toHaveLength(0);
    await rejected("delete from public.medications", "42501");
  });
  it("records a durable dose visible to the caregiver and prevents duplicates", async () => {
    await approve(); await asUser(elderly);
    await db.query("insert into public.dose_logs(medication_id,patient_id,scheduled_date) values ($1,$2,current_date)", [medication, elderly]);
    const log = await db.query<{ medication_name: string; dosage: string; recorded_by: string }>("select * from public.dose_logs");
    expect(log.rows[0]).toMatchObject({ medication_name: "Test medicine", dosage: "1 tablet", recorded_by: elderly });
    await rejected(`insert into public.dose_logs(medication_id,patient_id,scheduled_date) values ('${medication}','${elderly}',current_date)`, "23505");
    await rejected("delete from public.dose_logs", "42501");
    await rejected("update public.dose_logs set taken_at=now()", "42501");
    await asUser(caregiver);
    expect(await count("dose_logs")).toBe(1);
    await db.exec("update public.medications set dosage='Changed later', active=false");
    expect((await db.query<{ dosage: string }>("select dosage from public.dose_logs")).rows[0].dosage).toBe("1 tablet");
    await asUser(stranger);
    expect(await count("dose_logs")).toBe(0);
  });
  it("rejects caregiver confirmations, future logs, spoofed timestamps and cross-patient logs", async () => {
    await approve(); await asUser(caregiver);
    await rejected(`insert into public.dose_logs(medication_id,patient_id,scheduled_date) values ('${medication}','${elderly}',current_date)`, "42501");
    await asUser(elderly);
    await rejected(`insert into public.dose_logs(medication_id,patient_id,scheduled_date) values ('${medication}','${elderly}',current_date+1)`, "23514");
    await rejected(`insert into public.dose_logs(medication_id,patient_id,scheduled_date,taken_at) values ('${medication}','${elderly}',current_date,now())`, "42501");
    await asUser(anotherElder);
    await rejected(`insert into public.dose_logs(medication_id,patient_id,scheduled_date) values ('${medication}','${anotherElder}',current_date)`, "23514");
  });
  it("denies confirmations for archived medications and prescription edits by elderly users", async () => {
    await approve(); await asUser(caregiver); await db.exec("update public.medications set active=false");
    await asUser(elderly);
    await rejected(`insert into public.dose_logs(medication_id,patient_id,scheduled_date) values ('${medication}','${elderly}',current_date)`, "23514");
    expect((await db.query("update public.medications set dosage='Unauthorized' returning id")).rows).toHaveLength(0);
  });
  it("revokes caregiver reads and writes immediately, including other health tables", async () => {
    await approve(); await asUser(caregiver);
    for (const table of ["medications", "appointments", "emergency_contacts", "wellness_check_ins", "sos_events"]) expect(await count(table)).toBe(1);
    await asUser(elderly); await db.exec("update public.caregiver_relationships set status='revoked'");
    await asUser(caregiver);
    for (const table of ["medications", "appointments", "emergency_contacts", "wellness_check_ins", "sos_events"]) expect(await count(table)).toBe(0);
    expect((await db.query("update public.medications set dosage='Unauthorized' returning id")).rows).toHaveLength(0);
    expect(await count("profiles")).toBe(1);
  });
  it("limits view-only caregivers and prevents forged notifications and SOS ownership", async () => {
    await approve(); await db.exec("update public.caregiver_relationships set can_manage_medications=false");
    await asUser(caregiver);
    expect(await count("medications")).toBe(1);
    expect((await db.query("update public.medications set dosage='Unauthorized' returning id")).rows).toHaveLength(0);
    expect(await count("notification_logs")).toBe(0);
    await rejected(`insert into public.notification_logs(recipient_id,kind) values ('${elderly}','sos')`, "42501");
    await rejected(`insert into public.sos_events(patient_id) values ('${elderly}')`, "42501");
    await rejected(`update public.sos_events set patient_id='${caregiver}'`, "42501");
  });
});
