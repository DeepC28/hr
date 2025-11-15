
import React from "react";
import PageShell from "@/components/PageShell";
import FormComp from "@/components/form/pages/PermissionsAdd";

export default function Page() {
  return (
    <PageShell title="เพิ่ม สิทธิ์ (Permissions)">
      <FormComp />
    </PageShell>
  );
}