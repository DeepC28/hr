"use client";

import type { ProfileStatus } from "../ProfileClient";

export default function StatusBadge({ status }: { status: ProfileStatus }) {
  const base =
    "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border";

  if (status === "pending") {
    return (
      <span className={`${base} border-yellow-300 bg-yellow-50 text-yellow-800 dark:border-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-200`}>
        รออนุมัติ
      </span>
    );
  }

  if (status === "rejected") {
    return (
      <span className={`${base} border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-200`}>
        ถูกปฏิเสธ
      </span>
    );
  }

  if (status === "approved") {
    return (
      <span className={`${base} border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-900/20 dark:text-green-200`}>
        อนุมัติแล้ว
      </span>
    );
  }

  return (
    <span className={`${base} border-gray-200 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200`}>
      ยังไม่มีสถานะ
    </span>
  );
}
