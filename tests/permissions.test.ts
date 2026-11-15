import { expect, it } from "vitest";
import { accessiblePatients, canManageResource } from "../lib/permissions";
import type { Profile, Relationship } from "../lib/types";
const caregiver = { id: "caregiver", role: "caregiver" } as Profile;
const first = { id: "first", role: "elderly" } as Profile;
const second = { id: "second", role: "elderly" } as Profile;
const relation = { elderly_id: first.id, caregiver_id: caregiver.id, status: "active", can_view_health: true, caregiver_role: "supporting", can_manage_medications: true, can_manage_appointments: false, can_manage_contacts: false } as Relationship;
it("allows only approved profile switches, even if other profiles are supplied", () => {
  expect(accessiblePatients(caregiver, [first, second], [relation])).toEqual([first]);
  for (const status of ["pending", "revoked"] as const) expect(accessiblePatients(caregiver, [first], [{ ...relation, status }])).toEqual([]);
  expect(accessiblePatients(caregiver, [first], [{ ...relation, caregiver_id: "someone-else" }])).toEqual([]);
  expect(accessiblePatients(first, [first, second], [relation])).toEqual([first]);
});
it("separates resource permissions and denies viewer or cross-profile writes", () => {
  expect(canManageResource(caregiver, first.id, [relation], "medications")).toBe(true);
  expect(canManageResource(caregiver, first.id, [relation], "appointments")).toBe(false);
  expect(canManageResource(caregiver, second.id, [relation], "medications")).toBe(false);
  expect(canManageResource(caregiver, first.id, [{ ...relation, caregiver_role: "viewer" }], "medications")).toBe(false);
});
