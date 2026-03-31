import { query } from "@/lib/db";
import type { ProfileStatus } from "./types";
import { getProfileSnapshotByPersonId } from "./getProfileSnapshot";

function safeJsonParse(v: any) {
  try {
    if (typeof v === "string") return JSON.parse(v);
    return v ?? null;
  } catch {
    return null;
  }
}

export async function getProfileForUser(userId: number) {
  const user = (await query<any>(
    `SELECT user_id, username, email, person_id FROM users WHERE user_id = :user_id LIMIT 1`,
    { user_id: userId },
  ))[0] || null;

  if (!user) {
    return {
      status: "none" as ProfileStatus,
      user: null,
      person: null,
      education: [],
      licenses: [],
      movements: [],
      trainings: [],
      decorations: [],
      penalties: [],
      researcher: null,
      scholarOrders: [],
      departments: [],
      has_pending_profile: false,
      pending_profile: null,
    };
  }

  const personId = user.person_id ? Number(user.person_id) : null;

  // หา pending ล่าสุด (ถ้ามี)
  let pending = null as any;
  if (personId) {
    pending = (await query<any>(
      `SELECT approval_id, status, proposed_data, submitted_at
       FROM approval_request
       WHERE target_table = 'person_profile'
         AND target_pk_name = 'person_id'
         AND target_pk_value = :pk
         AND status = 'pending'
       ORDER BY submitted_at DESC
       LIMIT 1`,
      { pk: String(personId) },
    ))[0] || null;
  }

  // หา status ล่าสุด (approved/rejected)
  let last = null as any;
  if (personId) {
    last = (await query<any>(
      `SELECT approval_id, status, submitted_at
       FROM approval_request
       WHERE target_table = 'person_profile'
         AND target_pk_name = 'person_id'
         AND target_pk_value = :pk
       ORDER BY submitted_at DESC
       LIMIT 1`,
      { pk: String(personId) },
    ))[0] || null;
  }

  let status: ProfileStatus = "none";
  if (pending) status = "pending";
  else if (last?.status === "approved") status = "approved";
  else if (last?.status === "rejected") status = "rejected";
  else status = personId ? "approved" : "none";

  if (!personId) {
    return {
      status,
      user: { user_id: user.user_id, username: user.username, email: user.email },
      person: null,
      education: [],
      licenses: [],
      movements: [],
      trainings: [],
      decorations: [],
      penalties: [],
      researcher: null,
      scholarOrders: [],
      departments: [],
      has_pending_profile: !!pending,
      pending_profile: pending ? safeJsonParse(pending.proposed_data) : null,
    };
  }

  const snapshot = await getProfileSnapshotByPersonId(personId);

  return {
    status,
    user: { user_id: user.user_id, username: user.username, email: user.email },
    person: snapshot.person,
    education: snapshot.education,
    licenses: snapshot.licenses,
    movements: snapshot.movements,
    trainings: snapshot.trainings,
    decorations: snapshot.decorations,
    penalties: snapshot.penalties,
    researcher: snapshot.researcher,
    scholarOrders: snapshot.scholarOrders,
    departments: snapshot.departments,
    has_pending_profile: !!pending,
    pending_profile: pending ? safeJsonParse(pending.proposed_data) : null,
  };
}
