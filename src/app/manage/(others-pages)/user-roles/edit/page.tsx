
import React from "react";
import PageShell from "@/components/PageShell";
import FormComp from "@/components/form/pages/UserRolesEdit";

export default function Page() {
  return (
    <PageShell title="แก้ไข กำหนดบทบาทให้ผู้ใช้">
      <FormComp />
    </PageShell>
  );
}