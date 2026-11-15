import type { Profile, Relationship } from "./types";

export function accessiblePatients(profile: Profile, people: Profile[], relationships: Relationship[]) {
  if (profile.role === "elderly") return [profile];
  return people.filter(person => person.role === "elderly" && relationships.some(relation =>
    relation.caregiver_id === profile.id && relation.elderly_id === person.id && relation.status === "active" && relation.can_view_health));
}
export function canManageResource(profile: Profile, patientId: string, relationships: Relationship[], resource: "medications" | "appointments" | "contacts") {
  return relationships.some(relation => relation.caregiver_id === profile.id && relation.elderly_id === patientId &&
    relation.status === "active" && relation.can_view_health && relation.caregiver_role !== "viewer" && relation[`can_manage_${resource}`]);
}
