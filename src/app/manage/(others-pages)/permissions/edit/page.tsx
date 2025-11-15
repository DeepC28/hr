
import React from "react";
import PageShell from "@/components/PageShell";
import FormComp from "@/components/form/pages/PermissionsEdit";

export default function Page() {
  return (
    <PageShell title="แก้ไข สิทธิ์ (Permissions)">
      <FormComp />
    </PageShell>
  );
}