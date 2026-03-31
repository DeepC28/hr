import { exec, query, pool } from "@/lib/db";
import { getProfileSnapshotByPersonId } from "./getProfileSnapshot";

export async function submitProfileRequest(userId: number, payload: any) {
  const personId = Number(payload?.person?.person_id || 0);
  if (!personId) {
    throw new Error("ไม่พบ person_id ใน payload");
  }

  // กันส่งซ้ำถ้ามี pending อยู่
  const hasPending = (await query<any>(
    `SELECT approval_id
     FROM approval_request
     WHERE target_table='person_profile'
       AND target_pk_name='person_id'
       AND target_pk_value=:pk
       AND status='pending'
     LIMIT 1`,
    { pk: String(personId) },
  ))[0];

  if (hasPending) {
    const e: any = new Error("มีคำขอที่รออนุมัติอยู่แล้ว");
    e.statusCode = 409;
    throw e;
  }

  const currentSnapshot = await getProfileSnapshotByPersonId(personId);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const proposed = JSON.stringify(payload);
    const snapshot = JSON.stringify(currentSnapshot);

    const res = await conn.execute(
      `INSERT INTO approval_request
        (target_table, target_pk_name, target_pk_value, action,
         proposed_data, current_snapshot, reason_note, status, submitted_by)
       VALUES
        ('person_profile', 'person_id', ?, 'update',
         ?, ?, NULL, 'pending', ?)`,
      [String(personId), proposed, snapshot, userId],
    );

    const approvalId = (res as any)[0]?.insertId;

    await conn.execute(
      `INSERT INTO approval_request_log (approval_id, old_status, new_status, actor_user_id, note)
       VALUES (?, NULL, 'pending', ?, 'submit profile request')`,
      [approvalId, userId],
    );

    await conn.commit();
    return { approval_id: approvalId };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
