import { query } from "@/lib/db";

export async function getSubdistricts() {
  // ระวังตารางใหญ่ แต่ฝั่ง UI จำกัดแสดงผล 50 อยู่แล้ว
  const items = await query<any>(
    `SELECT sub_district_id, name_th, district_name_th, province_name_th, zipcode
     FROM address_codebook
     ORDER BY name_th ASC`,
  );

  return items.map((s) => ({
    sub_district_id: String(s.sub_district_id),
    name_th: s.name_th,
    district_name_th: s.district_name_th ?? null,
    province_name_th: s.province_name_th ?? null,
    zipcode: s.zipcode ?? null,
  }));
}
