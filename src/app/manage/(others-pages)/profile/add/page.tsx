
import React from "react";
import PageShell from "@/components/PageShell";
import FormComp from "@/components/form/pages/ProfileAdd";

export default function Page() {
  return (
    <PageShell title="เพิ่ม ข้อมูลผู้ใช้">
      <FormComp />
    </PageShell>
  );
}