
import React from "react";
import PageShell from "@/components/PageShell";
import FormComp from "@/components/form/pages/UserRolesAdd";

export default function Page() {
  return (
    <PageShell title="เพิ่ม กำหนดบทบาทให้ผู้ใช้">
      <FormComp />
    </PageShell>
  );
}