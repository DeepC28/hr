"use client";

import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

type Role = {
  role_id: number;
  role_name: string;
  description: string | null;
};

export default function RolesTable() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // modal state (สร้างใหม่)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // modal ดูรายละเอียด
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  const loadRoles = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/roles", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error("โหลดข้อมูล roles ไม่สำเร็จ");
      }

      const data = await res.json();
      setRoles(data.roles ?? []);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "ไม่สามารถโหลดข้อมูลได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- Create ----------
  const openCreateModal = () => {
    setNewRoleName("");
    setNewRoleDescription("");
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    if (submitting) return;
    setIsCreateModalOpen(false);
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newRoleName.trim()) {
      Swal.fire({
        icon: "warning",
        title: "กรุณากรอกชื่อบทบาท",
        text: "ชื่อบทบาทห้ามเว้นว่าง",
      });
      return;
    }

    try {
      setSubmitting(true);

      const res = await fetch("/api/roles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role_name: newRoleName.trim(),
          description:
            newRoleDescription.trim() !== ""
              ? newRoleDescription.trim()
              : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const msg =
          data?.message || "ไม่สามารถเพิ่มบทบาทใหม่ได้ กรุณาลองอีกครั้ง";
        throw new Error(msg);
      }

      const newRole: Role = await res.json();

      setRoles((prev) => [...prev, newRole]);
      setIsCreateModalOpen(false);

      Swal.fire({
        icon: "success",
        title: "เพิ่มบทบาทสำเร็จ",
        text: `สร้างบทบาท "${newRole.role_name}" เรียบร้อยแล้ว`,
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err: any) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "เพิ่มบทบาทไม่สำเร็จ",
        text: err?.message || "เกิดข้อผิดพลาดภายในระบบ",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- Refresh ----------
  const handleRefresh = async () => {
    await loadRoles();
    Swal.fire({
      icon: "success",
      title: "รีโหลดข้อมูลแล้ว",
      timer: 1200,
      showConfirmButton: false,
    });
  };

  // ---------- Detail ----------
  const handleViewDetails = (role: Role) => {
    setSelectedRole(role);
    setIsDetailModalOpen(true);
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedRole(null);
  };

  // ---------- Delete ----------
  const handleDeleteRole = async (role: Role) => {
    const confirmResult = await Swal.fire({
      icon: "warning",
      title: "ยืนยันการลบบทบาท?",
      html: `คุณต้องการลบบทบาท <b>${role.role_name}</b> หรือไม่?<br/><span class="text-xs text-gray-500">หากมีการใช้งานบทบาทนี้อยู่ในระบบ อาจลบไม่สำเร็จ</span>`,
      showCancelButton: true,
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#dc2626",
    });

    if (!confirmResult.isConfirmed) return;

    try {
      const res = await fetch("/api/roles", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role_id: role.role_id }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const msg =
          data?.message || "ไม่สามารถลบบทบาทได้ กรุณาลองอีกครั้งภายหลัง";
        throw new Error(msg);
      }

      setRoles((prev) =>
        prev.filter((item) => item.role_id !== role.role_id),
      );

      Swal.fire({
        icon: "success",
        title: "ลบบทบาทเรียบร้อยแล้ว",
        text: `ลบบทบาท "${role.role_name}" ออกจากระบบแล้ว`,
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err: any) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "ลบบทบาทไม่สำเร็จ",
        text: err?.message || "เกิดข้อผิดพลาดภายในระบบ",
      });
    }
  };

  return (
    <>
      <div className="w-full overflow-auto">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-gray-400">
              ตาราง: roles
            </div>
            <div className="text-sm text-gray-700 dark:text-gray-300">
              บทบาทการใช้งานในระบบ HR (กำหนดสิทธิ์การเข้าถึงแต่ละส่วนของระบบ)
            </div>
          </div>

          {/* เครื่องมือหลัก */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 active:scale-[0.98] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              <span className="material-icons-outlined text-sm">refresh</span>
              รีโหลด
            </button>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-emerald-700 active:scale-[0.98]"
            >
              <span className="material-icons-outlined text-sm">add</span>
              เพิ่มบทบาทใหม่
            </button>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 p-3 text-sm shadow-sm">
          {error && (
            <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-900/30 dark:text-red-200">
              {error}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-1 text-left">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">ชื่อบทบาท</th>
                  <th className="px-3 py-2">คำอธิบาย</th>
                  <th className="px-3 py-2 text-right">เครื่องมือ</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-3 py-6 text-center text-sm text-gray-500 dark:text-gray-400"
                    >
                      กำลังโหลดข้อมูลบทบาท...
                    </td>
                  </tr>
                )}

                {!loading && roles.length === 0 && !error && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-3 py-6 text-center text-sm text-gray-500 dark:text-gray-400"
                    >
                      ยังไม่มีการกำหนดบทบาทในระบบ
                    </td>
                  </tr>
                )}

                {!loading &&
                  roles.map((role) => (
                    <tr
                      key={role.role_id}
                      className="align-top rounded-lg bg-gray-50/80 dark:bg-gray-800/70 hover:bg-gray-100 dark:hover:bg-gray-700/80"
                    >
                      <td className="px-3 py-2 text-xs text-gray-500">
                        {role.role_id}
                      </td>
                      <td className="px-3 py-2">
                        <div className="font-medium text-gray-900 dark:text-gray-50">
                          {role.role_name}
                        </div>
                      </td>
                      <td className="px-3 py-2 max-w-xl">
                        <p className="text-xs text-gray-700 dark:text-gray-200">
                          {role.description && role.description.trim() !== ""
                            ? role.description
                            : "—"}
                        </p>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleViewDetails(role)}
                            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                          >
                            <span className="material-icons-outlined text-xs">
                              visibility
                            </span>
                            รายละเอียด
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteRole(role)}
                            className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-2 py-1 text-[11px] font-medium text-white hover:bg-red-700"
                          >
                            <span className="material-icons-outlined text-xs">
                              delete
                            </span>
                            ลบ
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 rounded-lg bg-gray-50 dark:bg-gray-800/80 px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
            <div className="font-medium mb-1">ข้อมูลอ้างอิง</div>
            <p>
              ข้อมูลชุดนี้มาจากตาราง{" "}
              <span className="font-mono">roles</span> ในฐานข้อมูล{" "}
              <span className="font-mono">hr</span> (คอลัมน์{" "}
              <span className="font-mono">role_id</span>,{" "}
              <span className="font-mono">role_name</span>,{" "}
              <span className="font-mono">description</span>).
            </p>
          </div>
        </div>
      </div>

      {/* Modal เพิ่มบทบาท */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl dark:bg-gray-900">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                เพิ่มบทบาทใหม่
              </h2>
              <button
                type="button"
                onClick={closeCreateModal}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
              >
                <span className="material-icons-outlined text-base">close</span>
              </button>
            </div>

            <form className="mt-4 space-y-4" onSubmit={handleCreateRole}>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                  ชื่อบทบาท <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                  placeholder="เช่น System Admin, HR Manager, Staff"
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                  คำอธิบายบทบาท
                </label>
                <textarea
                  value={newRoleDescription}
                  onChange={(e) => setNewRoleDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                  placeholder="อธิบายหน้าที่ / ขอบเขตสิทธิ์ของบทบาทนี้"
                  disabled={submitting}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  disabled={submitting}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-emerald-700 disabled:opacity-70"
                >
                  {submitting && (
                    <span className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                  )}
                  บันทึกบทบาท
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal ดูรายละเอียด */}
      {isDetailModalOpen && selectedRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl dark:bg-gray-900">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                รายละเอียดบทบาท
              </h2>
              <button
                type="button"
                onClick={closeDetailModal}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
              >
                <span className="material-icons-outlined text-base">close</span>
              </button>
            </div>

            <div className="mt-4 space-y-3 text-sm">
              <div>
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  รหัสบทบาท (role_id)
                </div>
                <div className="mt-0.5 rounded-md bg-gray-50 px-2 py-1 font-mono text-xs text-gray-800 dark:bg-gray-800 dark:text-gray-100">
                  {selectedRole.role_id}
                </div>
              </div>

              <div>
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  ชื่อบทบาท
                </div>
                <div className="mt-0.5 rounded-md bg-gray-50 px-2 py-1 text-gray-900 dark:bg-gray-800 dark:text-gray-100">
                  {selectedRole.role_name}
                </div>
              </div>

              <div>
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  คำอธิบาย
                </div>
                <div className="mt-0.5 rounded-md bg-gray-50 px-2 py-2 text-xs text-gray-800 dark:bg-gray-800 dark:text-gray-100">
                  {selectedRole.description &&
                  selectedRole.description.trim() !== ""
                    ? selectedRole.description
                    : "—"}
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={closeDetailModal}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
