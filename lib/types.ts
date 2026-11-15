export type Profile = { id: string; display_name: string; role: "elderly" | "caregiver"; timezone: string; created_at: string };
export type Relationship = { id: string; elderly_id: string; caregiver_id: string; status: "pending" | "active" | "revoked"; can_manage_medications: boolean; created_at: string; updated_at: string };
export type Medication = { id: string; patient_id: string; name: string; dosage: string; instructions: string; scheduled_time: string; starts_on: string; ends_on: string | null; active: boolean; created_by: string; version: number; created_at: string; updated_at: string };
export type DoseLog = { id: string; medication_id: string; patient_id: string; scheduled_date: string; scheduled_time: string; medication_name: string; dosage: string; taken_at: string; recorded_by: string };
type Table<Row> = { Row: Row; Insert: Partial<Row>; Update: Partial<Row>; Relationships: [] };
export type Database = {
  public: {
    Tables: { profiles: Table<Profile>; caregiver_relationships: Table<Relationship>; medications: Table<Medication>; dose_logs: Table<DoseLog> };
    Views: Record<string, never>; Functions: Record<string, never>; Enums: Record<string, never>; CompositeTypes: Record<string, never>;
  };
};
export type CareState = {
  profile: Profile;
  people: Profile[];
  relationships: Relationship[];
  patient: Profile | null;
  medications: Medication[];
  doses: DoseLog[];
  today: string;
  fetchedAt: string;
};
export type ActionResult = { ok: boolean; message: string; fields?: Record<string, string[]> };
