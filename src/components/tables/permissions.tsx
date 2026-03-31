"use client";

import React, { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

type Role = {
  role_id: number;
  role_name: string;
  description: string | null;
  is_system: boolean;
};

type Permission = {
  permission_id: number;
  perm_key: string;
  description: string | null;
};

type MatrixResponse = {
  roles: Role[];
  permissions: Permission[];
  rolePermissions: { role_id: number; permission_id: number }[];
};

export default function PermissionsTable() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [assignedSet, setAssignedSet] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingKey, setTogglingKey] = useState<string | null>(null);

  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);

  const makeKey = (roleId: number, permId: number) => `${roleId}:${permId}`;

  const loadMatrix = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/permissions/matrix", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error("โหลดข้อมูลสิทธิ์ไม่สำเร็จ");
      }

      const data: MatrixResponse = await res.json();

      const rolesData =
        (data.roles ?? []).map((r) => ({
          ...r,
          is_system: !!r.is_system,
        })) || [];

      setRoles(rolesData);
      setPermissions(data.permissions ?? []);

      const s = new Set<string>();
      (data.rolePermissions ?? []).forEach((rp) => {
        s.add(makeKey(rp.role_id, rp.permission_id));
      });
      setAssignedSet(s);

      // ถ้ายังไม่เคยเลือก role ให้ default เป็นอันแรก
      if (!selectedRoleId && rolesData.length > 0) {
        setSelectedRoleId(rolesData[0].role_id);
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "ไม่สามารถโหลดข้อมูลได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatrix();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = async () => {
    await loadMatrix();
    Swal.fire({
      icon: "success",
      title: "รีโหลดข้อมูลแล้ว",
      timer: 1200,
      showConfirmButton: false,
    });
  };

  const handleToggle = async (roleId: number, permId: number) => {
    const key = makeKey(roleId, permId);
    if (togglingKey && togglingKey === key) return;

    const currentlyAssigned = assignedSet.has(key);
    const nextAssigned = !currentlyAssigned;

    // optimistic update
    setAssignedSet((prev) => {
      const copy = new Set(prev);
      if (nextAssigned) {
        copy.add(key);
      } else {
        copy.delete(key);
      }
      return copy;
    });
    setTogglingKey(key);

    try {
      const res = await fetch("/api/permissions/assign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role_id: roleId,
          permission_id: permId,
          assigned: nextAssigned,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const msg =
          data?.message ||
          "ไม่สามารถอัปเดตสิทธิ์ได้ กรุณาลองอีกครั้งภายหลัง";

        // revert
        setAssignedSet((prev) => {
          const copy = new Set(prev);
          if (nextAssigned) {
            copy.delete(key);
          } else {
            copy.add(key);
          }
          return copy;
        });

        throw new Error(msg);
      }
    } catch (err: any) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "อัปเดตสิทธิ์ไม่สำเร็จ",
        text: err?.message || "เกิดข้อผิดพลาดภายในระบบ",
      });
    } finally {
      setTogglingKey(null);
    }
  };

  const selectedRole = useMemo(
    () => roles.find((r) => r.role_id === selectedRoleId) || null,
    [roles, selectedRoleId],
  );

  const selectedRoleAssignedCount = useMemo(() => {
    if (!selectedRoleId) return 0;
    let count = 0;
    for (const perm of permissions) {
      if (assignedSet.has(makeKey(selectedRoleId, perm.permission_id))) {
        count += 1;
      }
    }
    return count;
  }, [permissions, assignedSet, selectedRoleId]);

  return (
    <div className="w-full overflow-auto">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-gray-400">
            การกำหนดสิทธิ์ตามบทบาท (Role-based Permissions)
          </div>
          <div className="text-sm text-gray-700 dark:text-gray-300">
            เลือกบทบาทก่อน จากนั้นดูได้ว่าบทบาทนั้นสามารถทำอะไรได้บ้างในระบบ HR
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 text-xs text-gray-500">
          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 active:scale-[0.98] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <span className="material-icons-outlined text-sm">refresh</span>
            รีโหลด
          </button>
          <span className="hidden sm:inline">
            สิทธิ์ทั้งหมด {permissions.length} รายการ
          </span>
        </div>
      </div>

      {/* Role Selector */}
      <div className="mt-4 flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-3 text-sm shadow-sm dark:border-gray-800 dark:bg-gray-900/60">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-200">
              เลือกบทบาทที่ต้องการดูสิทธิ์
            </label>
            <div className="flex items-center gap-2">
              <select
                className="w-full max-w-xs rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                value={selectedRoleId ?? ""}
                onChange={(e) =>
                  setSelectedRoleId(
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
              >
                {roles.length === 0 && (
                  <option value="">ยังไม่มีบทบาทในระบบ</option>
                )}
                {roles.length > 0 && !selectedRoleId && (
                  <option value="">-- เลือกบทบาท --</option>
                )}
                {roles.map((role) => (
                  <option key={role.role_id} value={role.role_id}>
                    {role.role_name}
                    {role.is_system ? " (System)" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedRole && (
            <div className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-200">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-gray-900 dark:text-gray-50">
                  {selectedRole.role_name}
                </span>
                {selectedRole.is_system && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-700 dark:bg-purple-900/40 dark:text-purple-200">
                    <span className="material-icons-outlined text-[12px]">
                      lock
                    </span>
                    System role
                  </span>
                )}
              </div>
              {selectedRole.description && (
                <p className="mt-1 text-[11px] text-gray-600 dark:text-gray-300">
                  {selectedRole.description}
                </p>
              )}
              <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                มีสิทธิ์ใช้งาน{" "}
                <span className="font-semibold text-gray-800 dark:text-gray-100">
                  {selectedRoleAssignedCount}
                </span>{" "}
                จากทั้งหมด {permissions.length} รายการ
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Permissions List */}
      <div className="mt-4 rounded-xl border border-gray-200 bg-white p-3 text-sm shadow-sm dark:border-gray-800 dark:bg-gray-900/60">
        {error && (
          <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-900/30 dark:text-red-200">
            {error}
          </div>
        )}

        {!selectedRole && !loading && (
          <div className="rounded-lg bg-gray-50 px-3 py-4 text-center text-sm text-gray-500 dark:bg-gray-800/80 dark:text-gray-300">
            กรุณาเลือกบทบาทด้านบนก่อน เพื่อดูว่าบทบาทนั้นสามารถทำอะไรได้บ้าง
          </div>
        )}

        {loading && (
          <div className="px-3 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
            กำลังโหลดข้อมูลสิทธิ์...
          </div>
        )}

        {!loading && selectedRole && (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-1 text-left">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  <th className="px-3 py-2 w-64">สิทธิ์</th>
                  <th className="px-3 py-2 w-64">รายละเอียด</th>
                  <th className="px-3 py-2 text-center w-32">สถานะ</th>
                  <th className="px-3 py-2 text-center w-32">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {permissions.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-3 py-6 text-center text-sm text-gray-500 dark:text-gray-400"
                    >
                      ยังไม่มีการกำหนดสิทธิ์ในระบบ
                    </td>
                  </tr>
                )}

                {permissions.map((perm) => {
                  const moduleName =
                    perm.perm_key.split(".")[0] || "ทั่วไป";
                  const actionName =
                    perm.perm_key.split(".").slice(1).join(".") ||
                    perm.perm_key;

                  const roleId = selectedRoleId!;
                  const key = makeKey(roleId, perm.permission_id);
                  const checked = assignedSet.has(key);
                  const disabled = togglingKey === key;

                  return (
                    <tr
                      key={perm.permission_id}
                      className="align-top rounded-lg bg-gray-50/80 dark:bg-gray-800/70 hover:bg-gray-100 dark:hover:bg-gray-700/80"
                    >
                      <td className="px-3 py-2 align-top">
                        <div className="text-xs font-mono text-gray-900 dark:text-gray-50">
                          {perm.perm_key}
                        </div>
                        <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-blue-100/80 px-2 py-0.5 text-[10px] text-blue-700 dark:bg-blue-900/40 dark:text-blue-200">
                          <span className="material-icons-outlined text-[12px]">
                            category
                          </span>
                          <span>{moduleName}</span>
                          <span className="opacity-60">/</span>
                          <span className="truncate max-w-[120px]">
                            {actionName}
                          </span>
                        </div>
                      </td>

                      <td className="px-3 py-2 max-w-xs align-top">
                        <p className="text-xs text-gray-700 dark:text-gray-200">
                          {perm.description && perm.description.trim() !== ""
                            ? perm.description
                            : "—"}
                        </p>
                      </td>

                      <td className="px-3 py-2 text-center align-middle">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ${
                            checked
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200"
                              : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                          }`}
                        >
                          <span className="material-icons-outlined text-[14px]">
                            {checked ? "check_circle" : "cancel"}
                          </span>
                          {checked ? "มีสิทธิ์" : "ไม่มีสิทธิ์"}
                        </span>
                      </td>

                      <td className="px-3 py-2 text-center align-middle">
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() =>
                            handleToggle(roleId, perm.permission_id)
                          }
                          className={`inline-flex items-center gap-1 rounded-lg px-3 py-1 text-[11px] font-medium transition
                            ${
                              checked
                                ? "bg-red-600 text-white hover:bg-red-700"
                                : "bg-emerald-600 text-white hover:bg-emerald-700"
                            }
                            ${disabled ? "opacity-60 cursor-wait" : ""}
                          `}
                        >
                          {disabled ? (
                            <span className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                          ) : checked ? (
                            <>
                              <span className="material-icons-outlined text-[14px]">
                                remove_circle
                              </span>
                              ยกเลิกสิทธิ์
                            </>
                          ) : (
                            <>
                              <span className="material-icons-outlined text-[14px]">
                                add_circle
                              </span>
                              ให้สิทธิ์
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-3 rounded-lg bg-gray-50 dark:bg-gray-800/80 px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
          <div className="font-medium mb-1">ข้อมูลอ้างอิง</div>
          <p>
            ข้อมูลชุดนี้มาจากตาราง{" "}
            <span className="font-mono">roles</span>,{" "}
            <span className="font-mono">permissions</span> และ{" "}
            <span className="font-mono">role_permissions</span> ในฐานข้อมูล{" "}
            <span className="font-mono">hr</span> โดยเป็นความสัมพันธ์
            many-to-many ระหว่างบทบาทกับสิทธิ์การใช้งาน
          </p>
        </div>
      </div>
    </div>
  );
}
