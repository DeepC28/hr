
import React from "react";
import PageShell from "@/components/PageShell";
import FormComp from "@/components/form/pages/UsersAdd";

export default function Page() {
  return (
    <PageShell title="เพิ่ม ผู้ใช้งาน">
      <FormComp />
    </PageShell>
  );
}