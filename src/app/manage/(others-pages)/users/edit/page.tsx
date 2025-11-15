
import React from "react";
import PageShell from "@/components/PageShell";
import FormComp from "@/components/form/pages/UsersEdit";

export default function Page() {
  return (
    <PageShell title="แก้ไข ผู้ใช้งาน">
      <FormComp />
    </PageShell>
  );
}