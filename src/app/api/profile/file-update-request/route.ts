// src/app/api/profile/attachments/route.ts
import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2/promise";
import { withConn } from "@/lib/mysql";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const runtime = "nodejs";

type AttachmentItem = {
  label: string;
  url: string;
  section: string;
  index?: number;
  kind: "pdf" | "image" | "other";
  meta?: any;
};

function guessKindFromUrl(url: string): AttachmentItem["kind"] {
  const u = (url || "").toLowerCase();
  if (u.match(/\.(png|jpg|jpeg|gif|webp)$/)) return "image";
  if (u.match(/\.pdf($|\?)/)) return "pdf";
  return "other";
}

function uniqAttachments(list: AttachmentItem[]) {
  const m = new Map<string, AttachmentItem>();
  for (const a of list) {
    const key = `${a.section}::${a.url}`;
    if (!m.has(key)) m.set(key, a);
  }
  return Array.from(m.values());
}

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const userId = Number((session.user as any)?.user_id ?? (session.user as any)?.id ?? 0);
  if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  return withConn(async (conn) => {
    const [uRows] = await conn.query<RowDataPacket[]>(
      `SELECT user_id, person_id, username FROM users WHERE user_id=? LIMIT 1`,
      [userId],
    );
    if (!uRows?.length) return NextResponse.json({ attachments: [] });

    const personId = uRows[0].person_id != null ? Number(uRows[0].person_id) : null;

    const out: AttachmentItem[] = [];

    if (personId) {
      const [pRows] = await conn.query<RowDataPacket[]>(
        `SELECT person_id, picture_url FROM person WHERE person_id=? LIMIT 1`,
        [personId],
      );
      if (pRows?.length) {
        const pic = String(pRows[0].picture_url || "").trim();
        if (pic) out.push({ label: "รูปโปรไฟล์", url: pic, section: "person.picture_url", kind: guessKindFromUrl(pic) });
      }

      const [licRows] = await conn.query<RowDataPacket[]>(
        `SELECT license_id, license_name, file_url, file_upload_url FROM person_license WHERE person_id=? ORDER BY license_id DESC`,
        [personId],
      );
      for (const r of licRows || []) {
        const id = Number(r.license_id);
        const name = String(r.license_name || `License #${id}`);
        const url1 = String(r.file_url || "").trim();
        const url2 = String(r.file_upload_url || "").trim();
        if (url1) out.push({ label: `ใบอนุญาต: ${name}`, url: url1, section: `license:${id}`, kind: guessKindFromUrl(url1), meta: { license_id: id } });
        if (url2) out.push({ label: `ใบอนุญาต: ${name} (upload)`, url: url2, section: `license_upload:${id}`, kind: guessKindFromUrl(url2), meta: { license_id: id } });
      }

      const [trRows] = await conn.query<RowDataPacket[]>(
        `SELECT training_id, title, file_url, file_upload_url FROM person_training WHERE person_id=? ORDER BY training_id DESC`,
        [personId],
      );
      for (const r of trRows || []) {
        const id = Number(r.training_id);
        const title = String(r.title || `Training #${id}`);
        const url1 = String(r.file_url || "").trim();
        const url2 = String(r.file_upload_url || "").trim();
        if (url1) out.push({ label: `อบรม: ${title}`, url: url1, section: `training:${id}`, kind: guessKindFromUrl(url1), meta: { training_id: id } });
        if (url2) out.push({ label: `อบรม: ${title} (upload)`, url: url2, section: `training_upload:${id}`, kind: guessKindFromUrl(url2), meta: { training_id: id } });
      }

      const [pnRows] = await conn.query<RowDataPacket[]>(
        `SELECT penalty_id, title, file_url, file_upload_url FROM person_penalty WHERE person_id=? ORDER BY penalty_id DESC`,
        [personId],
      );
      for (const r of pnRows || []) {
        const id = Number(r.penalty_id);
        const title = String(r.title || `Penalty #${id}`);
        const url1 = String(r.file_url || "").trim();
        const url2 = String(r.file_upload_url || "").trim();
        if (url1) out.push({ label: `โทษ/วินัย: ${title}`, url: url1, section: `penalty:${id}`, kind: guessKindFromUrl(url1), meta: { penalty_id: id } });
        if (url2) out.push({ label: `โทษ/วินัย: ${title} (upload)`, url: url2, section: `penalty_upload:${id}`, kind: guessKindFromUrl(url2), meta: { penalty_id: id } });
      }
    }

    return NextResponse.json({ attachments: uniqAttachments(out) });
  });
}
