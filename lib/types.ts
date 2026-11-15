export type Profile = { id: string; display_name: string; role: "elderly" | "caregiver"; timezone: string; created_at: string };
export type Relationship = { id: string; elderly_id: string; caregiver_id: string; status: "pending" | "active" | "revoked"; caregiver_role: "primary" | "supporting" | "viewer"; can_view_health: boolean; can_manage_appointments: boolean; can_manage_contacts: boolean; can_manage_medications: boolean; created_at: string; updated_at: string };
export type Medication = { id: string; patient_id: string; name: string; dosage: string; instructions: string; scheduled_time: string; starts_on: string; ends_on: string | null; active: boolean; created_by: string; version: number; created_at: string; updated_at: string };
export type DoseLog = { id: string; medication_id: string; patient_id: string; scheduled_date: string; scheduled_time: string; scheduled_at: string; medication_name: string; dosage: string; taken_at: string; recorded_by: string };
export type Appointment = { id: string; patient_id: string; title: string; starts_at: string };
export type EmergencyContact = { id: string; patient_id: string; name: string; phone: string; is_primary: boolean };
export type CareSummary = { patient: Profile; completed: number; total: number; nextMedication: string | null; nextAppointment: string | null };
type Table<Row> = { Row: Row; Insert: Partial<Row>; Update: Partial<Row>; Relationships: [] };
export type Database = {
  public: {
    Tables: { notification_logs: Table<{ id: string; event_key: string; recipient_id: string; kind: "medication" | "appointment" | "sos" | "relationship"; status: "queued" | "sent" | "failed" }>; emergency_contacts: Table<EmergencyContact>; appointments: Table<Appointment>; profiles: Table<Profile>; caregiver_relationships: Table<Relationship>; medications: Table<Medication>; dose_logs: Table<DoseLog> };
    Views: { garden_eligible_dose_logs: Table<DoseLog> }; Functions: Record<string, never>; Enums: Record<string, never>; CompositeTypes: Record<string, never>;
  };
};
export type CareState = {
  summaries: CareSummary[];
  profile: Profile;
  people: Profile[];
  relationships: Relationship[];
  patient: Profile | null;
  medications: Medication[];
  doses: DoseLog[];
  gardenDoses: DoseLog[];
  appointments: Appointment[];
  contacts: EmergencyContact[];
  today: string;
  fetchedAt: string;
};
export type ActionResult = { ok: boolean; message: string; fields?: Record<string, string[]> };
