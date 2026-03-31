import { query } from "@/lib/db";
import type { ProfileSnapshot } from "./types";

export async function getProfileSnapshotByPersonId(personId: number): Promise<ProfileSnapshot> {
  const person = (await query<any>(
    `SELECT * FROM person WHERE person_id = :person_id LIMIT 1`,
    { person_id: personId },
  ))[0] || null;

  const education = await query<any>(
    `SELECT * FROM person_education WHERE person_id = :person_id ORDER BY education_id ASC`,
    { person_id: personId },
  );

  const licenses = await query<any>(
    `SELECT * FROM person_license WHERE person_id = :person_id ORDER BY license_id ASC`,
    { person_id: personId },
  );

  const movements = await query<any>(
    `SELECT * FROM person_movement WHERE person_id = :person_id ORDER BY movement_id ASC`,
    { person_id: personId },
  );

  const trainings = await query<any>(
    `SELECT * FROM person_training WHERE person_id = :person_id ORDER BY training_id ASC`,
    { person_id: personId },
  );

  const decorations = await query<any>(
    `SELECT * FROM person_decoration WHERE person_id = :person_id ORDER BY person_decoration_id ASC`,
    { person_id: personId },
  );

  const penalties = await query<any>(
    `SELECT * FROM person_penalty WHERE person_id = :person_id ORDER BY penalty_id ASC`,
    { person_id: personId },
  );

  const researcher = (await query<any>(
    `SELECT * FROM person_researcher WHERE person_id = :person_id LIMIT 1`,
    { person_id: personId },
  ))[0] || null;

  const scholarOrders = await query<any>(
    `SELECT * FROM person_scholar_order WHERE person_id = :person_id ORDER BY person_scholar_order_id ASC`,
    { person_id: personId },
  );

  const departments = await query<any>(
    `SELECT person_id, department_id, relation_level, is_primary
     FROM person_department
     WHERE person_id = :person_id
     ORDER BY relation_level ASC`,
    { person_id: personId },
  );

  return {
    person,
    education,
    licenses,
    movements,
    trainings,
    decorations,
    penalties,
    researcher,
    scholarOrders,
    departments,
  };
}
