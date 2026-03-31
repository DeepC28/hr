"use client";

import React, { useState } from "react";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

type Role = {
  role_id: number;
  role_name: string;
  description: string | null;
  is_system: boolean;
};

type PersonInfo = {
  citizen_id: string | null;
  telephone: string | null;
  birthday: string | null;
  stafftype_name_th: string | null;
  department_name_th: string | null;
};

type UserInfo = {
  user_id: number;
  username: string;
  email: string | null;
  is_active: boolean;
  full_name_th: string | null;
  person?: PersonInfo | null;
};

type SearchResponse = {
  user: UserInfo;
  roles: Role[];
  userRoleIds: number[]; // ใช้ตัวแรกเป็น default role
};

export default function UserRolesTable() {
  const [query, setQuery] = useState("");
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [saving, setSaving] = useState(false);

  const [user, setUser] = useState<UserInfo | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [initialRoleId, setInitialRoleId] = useState<number | null>(null); // role ก่อนแก้
  const [error, setError] = useState<string | null>(null);

  const formatThaiDate = (dateStr?: string | null) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!query.trim()) {
      Swal.fire({
        icon: "warning",
        title: "กรุณากรอกคำค้นหา",
        text: "สามารถค้นหาด้วยชื่อ, username หรือ email",
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }

    try {
      setLoadingSearch(true);
      setError(null);
      setUser(null);
      setRoles([]);
      setSelectedRoleId(null);
      setInitialRoleId(null);

      const res = await fetch(
        `/api/user-roles?query=${encodeURIComponent(query.trim())}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const msg =
          data?.message || "ไม่สามารถค้นหาผู้ใช้ได้ กรุณาลองอีกครั้ง";
        setError(msg);

        if (res.status === 404) {
          Swal.fire({
            icon: "info",
            title: "ไม่พบผู้ใช้",
            text: "ไม่มีผู้ใช้ที่ตรงกับคำค้นหานี้",
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "เกิดข้อผิดพลาด",
            text: msg,
          });
        }
        return;
      }

      const payload = data as SearchResponse;
      setUser(payload.user);
      setRoles(payload.roles);

      const firstRoleId = payload.userRoleIds?.[0] ?? null;
      setSelectedRoleId(firstRoleId);
      setInitialRoleId(firstRoleId);
    } catch (err: any) {
      console.error(err);
      const msg = err?.message || "เกิดข้อผิดพลาดภายในระบบ";
      setError(msg);
      Swal.fire({
        icon: "error",
        title: "ค้นหาไม่สำเร็จ",
        text: msg,
      });
    } finally {
      setLoadingSearch(false);
    }
  };

  // helper หา role จาก id
  const findRoleById = (id: number | null | undefined) =>
    roles.find((r) => r.role_id === id) || null;

  // ช่วยเช็คว่า role นั้นคือ admin ไหม (เทียบชื่อ)
  const isAdminRoleId = (id: number | null | undefined) => {
    if (!id) return false;
    const role = findRoleById(id);
    if (!role) return false;
    return role.role_name.toLowerCase() === "admin";
  };

  const handleSave = async () => {
    if (!user) return;

    const roleIds =
      selectedRoleId && Number.isFinite(selectedRoleId)
        ? [selectedRoleId]
        : [];

    const wasAdmin = isAdminRoleId(initialRoleId);
    const willAdmin = isAdminRoleId(selectedRoleId);

    // ถ้าไม่มีการเปลี่ยน role เลย ไม่ต้องยิง API
    if (initialRoleId === selectedRoleId) {
      Swal.fire({
        icon: "info",
        title: "ไม่มีการเปลี่ยนแปลง",
        text: "บทบาทของผู้ใช้ยังคงเหมือนเดิม",
        timer: 1500,
        showConfirmButton: false,
      });
      return;
    }

    // ยืนยันก่อนเปลี่ยนเป็น admin
    if (!wasAdmin && willAdmin) {
      const targetRole = findRoleById(selectedRoleId);
      const result = await Swal.fire({
        icon: "warning",
        title: "ยืนยันการเปลี่ยนเป็น Admin?",
        html: `คุณกำลังเปลี่ยนบทบาทของผู้ใช้ <b>${user.username}</b> ให้เป็น <b>${targetRole?.role_name || "admin"}</b><br/>ผู้ใช้นี้จะมีสิทธิ์เข้าถึงส่วนสำคัญของระบบ HR`,
        showCancelButton: true,
        confirmButtonText: "ใช่, เปลี่ยนเป็น Admin",
        cancelButtonText: "ยกเลิก",
        confirmButtonColor: "#16a34a",
      });

      if (!result.isConfirmed) {
        return;
      }
    }

    // ยืนยันก่อนถอด admin (เปลี่ยนจาก admin → role อื่น หรือไม่มี role)
    if (wasAdmin && !willAdmin) {
      const oldRole = findRoleById(initialRoleId);
      const newRole = findRoleById(selectedRoleId);
      const result = await Swal.fire({
        icon: "warning",
        title: "ยืนยันการถอดสิทธิ์ Admin?",
        html: `
          คุณกำลังเปลี่ยนบทบาทของผู้ใช้ <b>${user.username}</b><br/>
          จาก <b>${oldRole?.role_name || "admin"}</b> 
          ไปเป็น <b>${newRole?.role_name || "ไม่มีบทบาท"}</b><br/><br/>
          ผู้ใช้นี้จะ <b>ไม่สามารถ</b> จัดการส่วนที่ต้องใช้สิทธิ์ Admin ได้อีกต่อไป
        `,
        showCancelButton: true,
        confirmButtonText: "ใช่, เปลี่ยนบทบาท",
        cancelButtonText: "ยกเลิก",
        confirmButtonColor: "#dc2626",
      });

      if (!result.isConfirmed) {
        return;
      }
    }

    try {
      setSaving(true);

      const res = await fetch("/api/user-roles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user.user_id,
          role_ids: roleIds,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const msg =
          data?.message ||
          "ไม่สามารถบันทึกการกำหนดบทบาทให้ผู้ใช้ได้ กรุณาลองใหม่อีกครั้ง";
        throw new Error(msg);
      }

      // อัปเดต initialRoleId ให้ตรงกับค่าที่เพิ่งบันทึก
      setInitialRoleId(selectedRoleId ?? null);

      Swal.fire({
        icon: "success",
        title: "บันทึกสำเร็จ",
        text: "อัปเดตบทบาทหลักให้ผู้ใช้เรียบร้อยแล้ว",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err: any) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "บันทึกไม่สำเร็จ",
        text: err?.message || "เกิดข้อผิดพลาดภายในระบบ",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full overflow-auto">
      {/* หัวข้อ */}
      <div className="flex flex-col gap-1">
        <div className="text-xs font-medium uppercase tracking-wide text-gray-400">
          ตาราง: กำหนดบทบาทให้ผู้ใช้
        </div>
        <div className="text-sm text-gray-700 dark:text-gray-300">
          ค้นหาผู้ใช้ด้วย <span className="font-mono">ชื่อ</span>,{" "}
          <span className="font-mono">username</span> หรือ{" "}
          <span className="font-mono">email</span> จากนั้นเลือก{" "}
          <span className="font-semibold">บทบาทหลัก (Role)</span> ให้ผู้ใช้
        </div>
      </div>

      {/* กล่องค้นหา */}
      <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4 text-sm shadow-sm dark:border-gray-800 dark:bg-gray-900/60">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="text-xs font-medium text-gray-700 dark:text-gray-200">
            ค้นหาผู้ใช้
          </div>
          <div className="text-[11px] text-gray-500 dark:text-gray-400">
            รองรับ: ชื่อ, username, email, หรือ &quot;ชื่อ สกุล&quot;
          </div>
        </div>

        <form
          onSubmit={handleSearch}
          className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]"
        >
          {/* INPUT */}
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
              <span className="material-icons-outlined text-base text-gray-400">
                search
              </span>
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-11 w-full rounded-lg border border-gray-300 bg-white pl-20 pr-3 text-sm text-gray-900 shadow-sm outline-none ring-0 transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
              placeholder={
                query
                  ? ""
                  : 'เช่น "สมชาย ใจดี", admin, user@example.com'
              }
              autoComplete="off"
              disabled={loadingSearch}
            />
          </div>

          {/* BUTTON */}
          <button
            type="submit"
            disabled={loadingSearch}
            className="inline-flex h-11 items-center justify-center gap-1 rounded-lg bg-emerald-600 px-4 text-xs font-medium text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-70"
          >
            {loadingSearch && (
              <span className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
            )}
            <span className="material-icons-outlined text-sm">
              person_search
            </span>
            ค้นหาผู้ใช้
          </button>
        </form>

        {error && (
          <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-900/30 dark:text-red-200">
            {error}
          </div>
        )}
      </div>

      {/* แสดงข้อมูลผู้ใช้ + บทบาท */}
      {user && (
        <div className="mt-4 space-y-4">
          {/* ข้อมูลผู้ใช้ */}
          <div className="rounded-xl border border-gray-200 bg-white p-3 text-sm shadow-sm dark:border-gray-800 dark:bg-gray-900/60">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  ข้อมูลผู้ใช้
                </div>
                <div className="text-sm text-gray-900 dark:text-gray-50">
                  {user.full_name_th ? (
                    <span className="font-medium">{user.full_name_th}</span>
                  ) : (
                    <span className="font-medium">{user.username}</span>
                  )}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-300">
                  Username:{" "}
                  <span className="font-mono text-gray-900 dark:text-gray-100">
                    {user.username}
                  </span>
                  {user.email && (
                    <>
                      {" "}
                      · Email:{" "}
                      <span className="font-mono text-gray-900 dark:text-gray-100">
                        {user.email}
                      </span>
                    </>
                  )}
                </div>

                {/* ข้อมูล person เพิ่มเติม */}
                {user.person && (
                  <div className="mt-1 space-y-0.5 text-xs text-gray-600 dark:text-gray-300">
                    {(user.person.citizen_id || user.person.telephone) && (
                      <div>
                        {user.person.citizen_id && (
                          <>
                            เลขบัตรประชาชน:{" "}
                            <span className="font-mono">
                              {user.person.citizen_id}
                            </span>
                          </>
                        )}
                        {user.person.citizen_id && user.person.telephone && (
                          <span> · </span>
                        )}
                        {user.person.telephone && (
                          <>
                            เบอร์โทร:{" "}
                            <span className="font-mono">
                              {user.person.telephone}
                            </span>
                          </>
                        )}
                      </div>
                    )}

                    {(user.person.birthday ||
                      user.person.stafftype_name_th ||
                      user.person.department_name_th) && (
                      <div>
                        {user.person.birthday && (
                          <>
                            วันเกิด:{" "}
                            <span>
                              {formatThaiDate(user.person.birthday)}
                            </span>
                          </>
                        )}
                        {user.person.birthday &&
                          (user.person.stafftype_name_th ||
                            user.person.department_name_th) && (
                            <span> · </span>
                          )}

                        {user.person.stafftype_name_th && (
                          <>
                            ประเภทบุคลากร:{" "}
                            <span>{user.person.stafftype_name_th}</span>
                          </>
                        )}
                        {user.person.stafftype_name_th &&
                          user.person.department_name_th && <span> · </span>}

                        {user.person.department_name_th && (
                          <>
                            หน่วยงานหลัก:{" "}
                            <span>{user.person.department_name_th}</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-1 flex flex-col items-end gap-1 text-xs sm:mt-0">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ${
                    user.is_active
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200"
                      : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                  }`}
                >
                  <span className="material-icons-outlined text-[14px]">
                    {user.is_active ? "check_circle" : "pause_circle"}
                  </span>
                  {user.is_active ? "Active" : "Inactive"}
                </span>
                <span className="text-[11px] text-gray-500 dark:text-gray-400">
                  บทบาทหลักปัจจุบัน:{" "}
                  {selectedRoleId
                    ? roles.find((r) => r.role_id === selectedRoleId)
                        ?.role_name || "—"
                    : "ยังไม่ได้กำหนด"}
                </span>
              </div>
            </div>
          </div>

          {/* เลือกบทบาทหลัก (radio) */}
          <div className="rounded-xl border border-gray-200 bg-white p-3 text-sm shadow-sm dark:border-gray-800 dark:bg-gray-900/60">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                เลือกบทบาทหลักให้ผู้ใช้ (เลือกได้ 1 บทบาท)
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                บทบาททั้งหมด {roles.length} รายการ
              </div>
            </div>

            {roles.length === 0 ? (
              <div className="mt-3 rounded-lg bg-gray-50 px-3 py-3 text-center text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-300">
                ยังไม่มีการสร้างบทบาทในระบบ
              </div>
            ) : (
              <>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  {roles.map((role) => {
                    const checked = selectedRoleId === role.role_id;
                    return (
                      <label
                        key={role.role_id}
                        className={`flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2 text-xs shadow-sm transition ${
                          checked
                            ? "border-emerald-500 bg-emerald-50 dark:border-emerald-500/80 dark:bg-emerald-900/20"
                            : "border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800"
                        }`}
                      >
                        <input
                          type="radio"
                          name="user-role"
                          className="mt-0.5 h-4 w-4 border-gray-300 text-emerald-600 focus:ring-emerald-500 dark:border-gray-600 dark:bg-gray-900"
                          checked={checked}
                          onChange={() => setSelectedRoleId(role.role_id)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                              {role.role_name}
                            </span>
                            {role.is_system && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-[10px] text-purple-700 dark:bg-purple-900/40 dark:text-purple-200">
                                <span className="material-icons-outlined text-[12px]">
                                  lock
                                </span>
                                System
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-[11px] text-gray-600 dark:text-gray-300">
                            {role.description && role.description.trim() !== ""
                              ? role.description
                              : "—"}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-[11px] text-gray-500 dark:text-gray-400">
                    การเปลี่ยนแปลงนี้จะมีผลกับสิทธิ์การเข้าถึงของผู้ใช้ในระบบ
                    หลังจากที่ผู้ใช้ login ใหม่ (หรือ session ถูก refresh)
                  </div>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={handleSave}
                    className="inline-flex h-10 items-center justify-center gap-1 rounded-lg bg-emerald-600 px-4 text-xs font-medium text-white shadow-sm hover:bg-emerald-700 disabled:opacity-70"
                  >
                    {saving && (
                      <span className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                    )}
                    <span className="material-icons-outlined text-sm">
                      save
                    </span>
                    บันทึกบทบาทหลัก
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500 dark:bg-gray-800/80 dark:text-gray-400">
            <div className="mb-1 font-medium">ข้อมูลอ้างอิง</div>
            <p>
              ใช้ตาราง <span className="font-mono">users</span>,{" "}
              <span className="font-mono">person</span>,{" "}
              <span className="font-mono">staff_type</span>,{" "}
              <span className="font-mono">department</span>,{" "}
              <span className="font-mono">roles</span> และ{" "}
              <span className="font-mono">user_roles</span> ในฐานข้อมูล{" "}
              <span className="font-mono">hr</span> สำหรับเชื่อมผู้ใช้กับบทบาทหลัก
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
