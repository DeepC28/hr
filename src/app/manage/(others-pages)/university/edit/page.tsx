
import React from "react";
import PageShell from "@/components/PageShell";
import FormComp from "@/components/form/pages/UniversityEdit";

export default function Page() {
  return (
    <PageShell title="แก้ไข มหาวิทยาลัย">
      <FormComp />
    </PageShell>
  );
}