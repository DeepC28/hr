
import React from "react";
import PageShell from "@/components/PageShell";
import FormComp from "@/components/form/pages/UniversityAdd";

export default function Page() {
  return (
    <PageShell title="เพิ่ม มหาวิทยาลัย">
      <FormComp />
    </PageShell>
  );
}