// src/components/UsersTable.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

type UserLevel = "admin" | "user" | "other";

type PersonSummary = {
  full_name_th: string | null;
  citizen_id: string | null;
  telephone: string | null;
  stafftype_name_th: string | null;
  department_name_th: string | null;
  birthday: string | null;
};

type UserRow = {
  user_id: number;
  username: string;
  email: string | null;
  is_active: boolean;
  created_at: string | null;
  role_name: string | null;
  level: UserLevel;
  has_pending_profile: boolean;
  person?: PersonSummary | null;
};

type FilterMode = "all" | "pending" | "no_pending" | "admin" | "normal";

type ProfileChangeRow = {
  key: string;
  label: string;
  old_value: string;
  new_value: string;
};

type AttachmentSource = "pending" | "current";

type AttachmentItem = {
  label: string;
  url: string;
  section: string;
  index?: number;
  kind: "pdf" | "image" | "other";
  source: AttachmentSource; // ✅ เพิ่ม source เพื่อแยก "ไฟล์ในคำขอ" vs "ไฟล์ตัวอย่าง (ปัจจุบัน)"
};

type PendingProfileDetail = {
  approval_id: number;
  action: string;
  status: string;
  submitted_at: string | null;
  reason_note: string | null;
  changes: ProfileChangeRow[];
  attachments: AttachmentItem[];
};

function guessKindFromUrl(url: string): AttachmentItem["kind"] {
  const u = (url || "").toLowerCase();
  if (u.match(/\.(png|jpg|jpeg|gif|webp)($|\?)/)) return "image";
  if (u.match(/\.pdf($|\?)/)) return "pdf";
  return "other";
}

function safeUrl(u: string) {
  return (u || "").trim();
}

function formatDateDDMMYYYY(d?: string | null) {
  if (!d) return "-";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return String(d);
  const day = String(dt.getDate()).padStart(2, "0");
  const month = String(dt.getMonth() + 1).padStart(2, "0");
  const year = dt.getFullYear();
  return `${day}/${month}/${year}`;
}

function renderLevelBadge(level: UserLevel, hasPending: boolean) {
  const base = "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium";
  if (level === "admin") {
    return (
      <span className={`${base} bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/40 dark:text-fuchsia-100`}>
        ผู้ดูแลระบบ
        {hasPending && <span className="ml-2 inline-flex h-2 w-2 rounded-full bg-amber-500" />}
      </span>
    );
  }
  if (level === "user") {
    return (
      <span className={`${base} bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-100`}>
        ผู้ใช้งานทั่วไป
        {hasPending && <span className="ml-2 inline-flex h-2 w-2 rounded-full bg-amber-500" />}
      </span>
    );
  }
  return (
    <span className={`${base} bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-100`}>
      อื่น ๆ
      {hasPending && <span className="ml-2 inline-flex h-2 w-2 rounded-full bg-amber-500" />}
    </span>
  );
}

function renderActiveBadge(isActive: boolean) {
  const base = "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium";
  if (isActive) {
    return (
      <span className={`${base} bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-100`}>
        ใช้งานอยู่
      </span>
    );
  }
  return (
    <span className={`${base} bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-100`}>ถูกปิดการใช้งาน</span>
  );
}

export default function UsersTable() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number>(0);

  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // ✅ โหลด "ไฟล์ตัวอย่าง (ปัจจุบัน)" แยกจากไฟล์ในคำขอ
  const [loadingSampleFiles, setLoadingSampleFiles] = useState(false);
  const [sampleAttachments, setSampleAttachments] = useState<AttachmentItem[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [filter, setFilter] = useState<FilterMode>("all");
  const [qUser, setQUser] = useState("");

  const [pendingDetail, setPendingDetail] = useState<PendingProfileDetail | null>(null);

  const [diffModalOpen, setDiffModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<"changes" | "attachments">("changes");
  const [changeQuery, setChangeQuery] = useState("");

  // ✅ ใช้อ็อบเจ็กต์เดียวสำหรับ preview แต่รองรับทั้ง pending/current
  const [selectedAttachment, setSelectedAttachment] = useState<AttachmentItem | null>(null);

  const [approving, setApproving] = useState(false);

  const selectedUser = useMemo(() => {
    return users.find((u) => u.user_id === selectedUserId) || null;
  }, [users, selectedUserId]);

  async function loadUsers() {
    try {
      setLoadingUsers(true);
      setError(null);
      setSuccess(null);

      const res = await fetch("/api/admin/users", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = data.message || "ดึงข้อมูลผู้ใช้ไม่สำเร็จ";
        setError(msg);
        Swal.fire({ icon: "error", title: "โหลดรายชื่อผู้ใช้ไม่สำเร็จ", text: msg });
        return;
      }

      const rows: UserRow[] = Array.isArray(data.users) ? data.users : [];
      setUsers(rows);

      if (!selectedUserId && rows.length > 0) {
        setSelectedUserId(rows[0].user_id);
      } else if (selectedUserId) {
        const found = rows.some((u) => u.user_id === selectedUserId);
        if (!found && rows.length > 0) setSelectedUserId(rows[0].user_id);
        if (!found && rows.length === 0) setSelectedUserId(0);
      }
    } catch (e: any) {
      console.error(e);
      const msg = e?.message || "เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ใช้";
      setError(msg);
      Swal.fire({ icon: "error", title: "โหลดรายชื่อผู้ใช้ไม่สำเร็จ", text: msg });
    } finally {
      setLoadingUsers(false);
    }
  }

  // ✅ ดึงรายละเอียดคำขอ (รวมไฟล์แนบในคำขอ ถ้า API ส่งมา)
  async function loadPendingDetailForUser(userId: number) {
    try {
      setLoadingDetail(true);
      setPendingDetail(null);

      const res = await fetch(`/api/admin/profile-approval?user_id=${userId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data.message || "ไม่สามารถโหลดรายละเอียดคำขอโปรไฟล์ของผู้ใช้นี้ได้";
        setError((prev) => prev || msg);
        setPendingDetail(null);
        return;
      }

      const attachmentsRaw = Array.isArray(data.attachments) ? data.attachments : [];
      const pendingAttachments: AttachmentItem[] = attachmentsRaw
        .map((a: any) => {
          const url = String(a?.url ?? "").trim();
          return {
            label: String(a?.label ?? "ไฟล์แนบ"),
            url,
            section: String(a?.section ?? "other"),
            index: a?.index != null ? Number(a.index) : undefined,
            kind: (a?.kind as any) || guessKindFromUrl(url),
            source: "pending" as const,
          };
        })
        .filter((a: AttachmentItem) => safeUrl(a.url));

      const detail: PendingProfileDetail = {
        approval_id: Number(data?.approval?.approval_id || 0),
        action: String(data?.approval?.action || ""),
        status: String(data?.approval?.status || ""),
        submitted_at: data?.approval?.submitted_at ?? null,
        reason_note: data?.approval?.reason_note ?? null,
        changes: Array.isArray(data.changes) ? data.changes : [],
        attachments: pendingAttachments,
      };

      setPendingDetail(detail);

      // ✅ ถ้าไฟล์ในคำขอมี ก็เลือกตัวแรกเป็น preview ก่อน
      if (pendingAttachments.length > 0) {
        setSelectedAttachment(pendingAttachments[0]);
      }
    } catch (e: any) {
      console.error(e);
      setPendingDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  }

  // ✅ ดึงไฟล์ "ตัวอย่าง (ปัจจุบัน)" จากโปรไฟล์จริง (ไม่ใช่จาก approval)
  // NOTE: ฝั่ง API ควร map user_id -> person_id เองได้
  async function loadSampleAttachmentsForUser(userId: number) {
    try {
      setLoadingSampleFiles(true);
      setSampleAttachments([]);

      const res = await fetch(`/api/profile/attachments?user_id=${userId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        // ไม่ต้อง throw ให้หน้าแตก แค่ว่างไว้
        console.warn("loadSampleAttachmentsForUser failed:", data?.message || res.statusText);
        setSampleAttachments([]);
        return;
      }

      const raw = Array.isArray(data.attachments) ? data.attachments : [];
      const currentAttachments: AttachmentItem[] = raw
        .map((a: any) => {
          const url = String(a?.url ?? "").trim();
          return {
            label: String(a?.label ?? "ไฟล์ตัวอย่าง"),
            url,
            section: String(a?.section ?? "other"),
            index: a?.index != null ? Number(a.index) : undefined,
            kind: (a?.kind as any) || guessKindFromUrl(url),
            source: "current" as const,
          };
        })
        .filter((a: AttachmentItem) => safeUrl(a.url));

      setSampleAttachments(currentAttachments);

      // ✅ ถ้า "ไฟล์ในคำขอ" ไม่มี แต่ไฟล์ตัวอย่างมี → ให้เลือกตัวอย่างขึ้น preview
      setSelectedAttachment((prev) => {
        if (prev?.url) return prev;
        if (currentAttachments.length > 0) return currentAttachments[0];
        return null;
      });
    } catch (e: any) {
      console.error(e);
      setSampleAttachments([]);
    } finally {
      setLoadingSampleFiles(false);
    }
  }

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedUser) {
      setPendingDetail(null);
      setSampleAttachments([]);
      setSelectedAttachment(null);
      return;
    }

    // โหลดไฟล์ตัวอย่างของผู้ใช้นี้ไว้เสมอ (เพื่อให้แท็บไฟล์มีอะไรแสดงแน่ ๆ)
    loadSampleAttachmentsForUser(selectedUser.user_id);

    if (selectedUser.has_pending_profile) {
      loadPendingDetailForUser(selectedUser.user_id);
    } else {
      setPendingDetail(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUserId]);

  const totalPending = useMemo(() => users.filter((u) => u.has_pending_profile).length, [users]);
  const totalAdmin = useMemo(() => users.filter((u) => u.level === "admin").length, [users]);
  const totalActive = useMemo(() => users.filter((u) => u.is_active).length, [users]);

  const filteredUsers = useMemo(() => {
    const q = qUser.trim().toLowerCase();
    return users.filter((u) => {
      if (filter === "pending" && !u.has_pending_profile) return false;
      if (filter === "no_pending" && u.has_pending_profile) return false;
      if (filter === "admin" && u.level !== "admin") return false;
      if (filter === "normal" && u.level !== "user") return false;

      if (!q) return true;

      const name = (u.person?.full_name_th || "").toLowerCase();
      const username = (u.username || "").toLowerCase();
      const email = (u.email || "").toLowerCase();
      const cid = (u.person?.citizen_id || "").toLowerCase();
      const tel = (u.person?.telephone || "").toLowerCase();

      return name.includes(q) || username.includes(q) || email.includes(q) || cid.includes(q) || tel.includes(q);
    });
  }, [users, filter, qUser]);

  const groupedChanges = useMemo(() => {
    const list = pendingDetail?.changes ?? [];
    const q = changeQuery.trim().toLowerCase();

    const filtered = !q
      ? list
      : list.filter((c) => {
          const hay = `${c.key} ${c.label} ${c.old_value} ${c.new_value}`.toLowerCase();
          return hay.includes(q);
        });

    const groupName = (key: string) => {
      if (key.startsWith("person.")) return "ข้อมูลบุคคล";
      if (key.startsWith("users.")) return "ข้อมูลผู้ใช้";
      return "อื่น ๆ";
    };

    const map: Record<string, ProfileChangeRow[]> = {};
    for (const c of filtered) {
      const g = groupName(c.key);
      if (!map[g]) map[g] = [];
      map[g].push(c);
    }
    return map;
  }, [pendingDetail, changeQuery]);

  const changeGroupOrder = ["ข้อมูลบุคคล", "ข้อมูลผู้ใช้", "อื่น ๆ"];

  // ✅ รวมไฟล์ทั้ง 2 แหล่ง เพื่อให้ "มีแถบแล้วแต่ไม่แสดง" ไม่เกิดอีก
  const pendingAttachments = pendingDetail?.attachments ?? [];
  const currentAttachments = sampleAttachments;

  // ถ้ามี pending ให้เอา pending ขึ้นก่อน, แล้วค่อย current
  const allAttachmentsForList = useMemo(() => {
    return [...pendingAttachments, ...currentAttachments];
  }, [pendingAttachments, currentAttachments]);

  function renderSourceBadge(source: AttachmentSource) {
    const base = "rounded-full px-2 py-0.5 text-[11px] font-semibold";
    if (source === "pending") {
      return (
        <span className={`${base} bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-100`}>
          ในคำขอ
        </span>
      );
    }
    return (
      <span className={`${base} bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-100`}>
        ตัวอย่างปัจจุบัน
      </span>
    );
  }

  async function handleApproveProfile() {
    if (!selectedUser) return;

    if (!selectedUser.has_pending_profile) {
      const msg = "ผู้ใช้นี้ไม่มีคำขอข้อมูลโปรไฟล์ค้างอยู่";
      setError(msg);
      Swal.fire({ icon: "info", title: "ไม่มีคำขอโปรไฟล์", text: msg });
      return;
    }

    if (!pendingDetail?.approval_id) {
      const msg = "ไม่พบ approval_id ของคำขอนี้ (ลองกดรีเฟรชหรือเลือกผู้ใช้อีกครั้ง)";
      setError(msg);
      Swal.fire({ icon: "error", title: "อนุมัติไม่สำเร็จ", text: msg });
      return;
    }

    try {
      setApproving(true);
      setError(null);
      setSuccess(null);

      const res = await fetch("/api/admin/profile-approval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approval_id: pendingDetail.approval_id, decision: "approve" }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "อนุมัติคำขอไม่สำเร็จ");

      const msg = data.message || "อนุมัติข้อมูลโปรไฟล์ผู้ใช้เรียบร้อยแล้ว";
      setSuccess(msg);

      Swal.fire({
        icon: "success",
        title: "อนุมัติโปรไฟล์สำเร็จ",
        text: msg,
        timer: 1800,
        showConfirmButton: false,
      });

      setPendingDetail(null);
      setDiffModalOpen(false);

      await loadUsers();
      // หลังอนุมัติ โหลดไฟล์ตัวอย่างใหม่ เพื่อเห็นของใหม่
      if (selectedUser) await loadSampleAttachmentsForUser(selectedUser.user_id);
    } catch (e: any) {
      console.error(e);
      const msg = e?.message || "เกิดข้อผิดพลาดในการอนุมัติคำขอ";
      setError(msg);
      Swal.fire({ icon: "error", title: "อนุมัติไม่สำเร็จ", text: msg });
    } finally {
      setApproving(false);
    }
  }

  async function handleRejectProfile() {
    if (!selectedUser) return;

    if (!selectedUser.has_pending_profile) {
      const msg = "ผู้ใช้นี้ไม่มีคำขอข้อมูลโปรไฟล์ค้างอยู่";
      setError(msg);
      Swal.fire({ icon: "info", title: "ไม่มีคำขอโปรไฟล์", text: msg });
      return;
    }

    if (!pendingDetail?.approval_id) {
      const msg = "ไม่พบ approval_id ของคำขอนี้ (ลองกดรีเฟรชหรือเลือกผู้ใช้อีกครั้ง)";
      setError(msg);
      Swal.fire({ icon: "error", title: "ตีกลับไม่สำเร็จ", text: msg });
      return;
    }

    const result = await Swal.fire({
      title: "ตีกลับคำขอโปรไฟล์?",
      text: "กรุณาระบุเหตุผลที่ข้อมูลไม่ถูกต้อง หรือไม่ครบถ้วน",
      icon: "warning",
      input: "textarea",
      inputLabel: "เหตุผลการตีกลับ",
      inputPlaceholder: "ระบุเหตุผลที่ต้องการตีกลับคำขอนี้...",
      inputValidator: (value) => {
        if (!value || !value.trim()) return "กรุณาระบุเหตุผลสำหรับการตีกลับ";
        return null;
      },
      showCancelButton: true,
      confirmButtonText: "ตีกลับคำขอ",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#f43f5e",
    });

    if (!result.isConfirmed) return;
    const reason = String(result.value || "").trim();

    try {
      setApproving(true);
      setError(null);
      setSuccess(null);

      const res = await fetch("/api/admin/profile-approval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approval_id: pendingDetail.approval_id,
          decision: "reject",
          reason,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "ตีกลับคำขอไม่สำเร็จ");

      const msg = data.message || "ตีกลับคำขอข้อมูลโปรไฟล์ผู้ใช้เรียบร้อยแล้ว";
      setSuccess(msg);

      Swal.fire({
        icon: "success",
        title: "ตีกลับคำขอแล้ว",
        text: msg,
        timer: 1800,
        showConfirmButton: false,
      });

      setPendingDetail(null);
      setDiffModalOpen(false);
      await loadUsers();
    } catch (e: any) {
      console.error(e);
      const msg = e?.message || "เกิดข้อผิดพลาดในการตีกลับคำขอ";
      setError(msg);
      Swal.fire({ icon: "error", title: "ตีกลับไม่สำเร็จ", text: msg });
    } finally {
      setApproving(false);
    }
  }

  function handleOpenDiffModal() {
    if (!selectedUser) return;

    if (!selectedUser.has_pending_profile) {
      Swal.fire({ icon: "info", title: "ไม่มีคำขอโปรไฟล์", text: "ผู้ใช้นี้ไม่มีคำขอข้อมูลโปรไฟล์ที่รออนุมัติ" });
      return;
    }

    setDiffModalOpen(true);
    setModalTab("changes");
    setChangeQuery("");

    // ✅ เปิด modal แล้วโหลดทั้งสองฝั่งให้แน่นอน
    loadSampleAttachmentsForUser(selectedUser.user_id);
    if (!pendingDetail) loadPendingDetailForUser(selectedUser.user_id);
  }

  async function handleToggleActive(user: UserRow) {
    const target = user.is_active ? "ปิดการใช้งาน" : "เปิดการใช้งาน";
    const result = await Swal.fire({
      title: `${target} ผู้ใช้?`,
      text: `ผู้ใช้: ${user.person?.full_name_th || user.username}`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: target,
      cancelButtonText: "ยกเลิก",
    });

    if (!result.isConfirmed) return;

    try {
      setLoadingUsers(true);
      const res = await fetch("/api/admin/users/toggle-active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.user_id, is_active: !user.is_active }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "เปลี่ยนสถานะผู้ใช้ไม่สำเร็จ");

      setSuccess(data.message || "เปลี่ยนสถานะผู้ใช้สำเร็จ");
      await loadUsers();
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "เปลี่ยนสถานะผู้ใช้ไม่สำเร็จ");
      Swal.fire({ icon: "error", title: "ทำรายการไม่สำเร็จ", text: e?.message || "Error" });
    } finally {
      setLoadingUsers(false);
    }
  }

  async function handleDeleteUser(user: UserRow) {
    const result = await Swal.fire({
      title: "ลบผู้ใช้?",
      html: `<div style="text-align:left">
        <div>ผู้ใช้: <b>${user.person?.full_name_th || user.username}</b></div>
        <div style="margin-top:6px;color:#666">การลบอาจกระทบความสัมพันธ์ข้อมูล (แนะนำ “ปิดการใช้งาน” แทน)</div>
      </div>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ลบผู้ใช้",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#ef4444",
    });

    if (!result.isConfirmed) return;

    try {
      setLoadingUsers(true);
      const res = await fetch("/api/admin/users/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.user_id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "ลบผู้ใช้ไม่สำเร็จ");

      setSuccess(data.message || "ลบผู้ใช้สำเร็จ");
      await loadUsers();
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "ลบผู้ใช้ไม่สำเร็จ");
      Swal.fire({ icon: "error", title: "ลบไม่สำเร็จ", text: e?.message || "Error" });
    } finally {
      setLoadingUsers(false);
    }
  }

  return (
    <div className="w-full space-y-4">
      {/* ===== Header ===== */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-gray-400">ตาราง: ผู้ใช้งาน</div>
          <div className="text-sm text-gray-700 dark:text-gray-300">จัดการผู้ใช้งานและตรวจสอบคำขออัปเดตข้อมูลโปรไฟล์</div>
        </div>

        <div className="flex flex-wrap gap-2 text-[11px]">
          <div className="rounded-full bg-slate-100 px-3 py-1 text-slate-700 dark:bg-slate-800 dark:text-slate-100">
            ทั้งหมด <span className="font-semibold">{users.length}</span> ผู้ใช้
          </div>
          <div className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-100">
            ใช้งานอยู่ <span className="font-semibold">{totalActive}</span>
          </div>
          <div className="rounded-full bg-amber-100 px-3 py-1 text-amber-800 dark:bg-amber-900/40 dark:text-amber-100">
            รออนุมัติโปรไฟล์ <span className="font-semibold">{totalPending}</span>
          </div>
          <div className="rounded-full bg-fuchsia-100 px-3 py-1 text-fuchsia-800 dark:bg-fuchsia-900/40 dark:text-fuchsia-100">
            Admin <span className="font-semibold">{totalAdmin}</span>
          </div>
        </div>
      </div>

      {/* ===== Alerts ===== */}
      {error && (
        <div className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/40 dark:text-red-100">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-100">
          {success}
        </div>
      )}

      {/* ===== Filters ===== */}
      <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-800 dark:bg-gray-900/70">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-medium text-gray-600 dark:text-gray-300">ตัวกรอง</span>
            {(
              [
                ["all", "ทั้งหมด"],
                ["pending", "มีคำขอโปรไฟล์"],
                ["no_pending", "ไม่มีคำขอ"],
                ["admin", "เฉพาะ Admin"],
                ["normal", "ผู้ใช้ทั่วไป"],
              ] as [FilterMode, string][]
            ).map(([value, label]) => {
              const active = filter === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFilter(value)}
                  className={`rounded-full px-3 py-1 text-[11px] font-medium transition ${
                    active
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              value={qUser}
              onChange={(e) => setQUser(e.target.value)}
              placeholder="ค้นหาชื่อ/username/email/บัตร/โทร..."
              className="w-72 max-w-[78vw] rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 outline-none focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            />
            <button
              type="button"
              onClick={loadUsers}
              className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-black dark:bg-gray-200 dark:text-gray-900 dark:hover:bg-white"
            >
              รีเฟรช
            </button>
          </div>
        </div>
      </div>

      {/* ===== Main Layout ===== */}
      <div className="grid gap-4 lg:grid-cols-12">
        {/* ===== Left: User list ===== */}
        <div className="lg:col-span-5 rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900/70">
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-800">
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              รายชื่อผู้ใช้ <span className="text-xs text-gray-500">({filteredUsers.length})</span>
            </div>
            {loadingUsers && (
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span className="h-4 w-4 animate-spin rounded-full border border-gray-400 border-t-transparent" />
                กำลังโหลด...
              </div>
            )}
          </div>

          <div className="max-h-[72vh] overflow-auto">
            {filteredUsers.length === 0 ? (
              <div className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">ไม่พบข้อมูลผู้ใช้</div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredUsers.map((u) => {
                  const active = u.user_id === selectedUserId;
                  return (
                    <button
                      key={u.user_id}
                      type="button"
                      onClick={() => setSelectedUserId(u.user_id)}
                      className={`w-full px-4 py-3 text-left transition ${
                        active ? "bg-indigo-50 dark:bg-indigo-900/20" : "hover:bg-gray-50 dark:hover:bg-gray-800/60"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {u.person?.full_name_th || u.username}
                          </div>
                          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <span className="font-mono">{u.username}</span>
                            {u.email ? <span className="truncate">{u.email}</span> : null}
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {renderLevelBadge(u.level, u.has_pending_profile)}
                            {renderActiveBadge(u.is_active)}
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <div className="text-[11px] text-gray-500 dark:text-gray-400">สร้างเมื่อ</div>
                          <div className="text-xs font-medium text-gray-700 dark:text-gray-200">{formatDateDDMMYYYY(u.created_at)}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ===== Right: Detail ===== */}
        <div className="lg:col-span-7 space-y-4">
          {!selectedUser ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-700 shadow-sm dark:border-gray-800 dark:bg-gray-900/70 dark:text-gray-200">
              เลือกผู้ใช้ทางซ้ายเพื่อดูรายละเอียด
            </div>
          ) : (
            <>
              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900/70">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-base font-semibold text-gray-900 dark:text-gray-100">
                      {selectedUser.person?.full_name_th || selectedUser.username}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <span className="font-mono">{selectedUser.username}</span>
                      <span className="text-gray-400">•</span>
                      <span>{selectedUser.email || "-"}</span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {renderLevelBadge(selectedUser.level, selectedUser.has_pending_profile)}
                      {renderActiveBadge(selectedUser.is_active)}
                      {selectedUser.person?.department_name_th ? (
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                          {selectedUser.person.department_name_th}
                        </span>
                      ) : null}
                      {selectedUser.person?.stafftype_name_th ? (
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                          {selectedUser.person.stafftype_name_th}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(selectedUser)}
                      className={`rounded-lg px-3 py-2 text-xs font-semibold text-white shadow-sm ${
                        selectedUser.is_active ? "bg-zinc-700 hover:bg-zinc-800" : "bg-emerald-600 hover:bg-emerald-700"
                      }`}
                    >
                      {selectedUser.is_active ? "ปิดการใช้งาน" : "เปิดการใช้งาน"}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteUser(selectedUser)}
                      className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-rose-700"
                    >
                      ลบผู้ใช้
                    </button>

                    <button
                      type="button"
                      onClick={handleOpenDiffModal}
                      disabled={!selectedUser.has_pending_profile}
                      className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:bg-indigo-300"
                    >
                      ตรวจสอบคำขอโปรไฟล์
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-800 dark:bg-gray-950/30">
                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">เลขบัตรประชาชน</div>
                    <div className="mt-1 font-mono text-gray-900 dark:text-gray-100">{selectedUser.person?.citizen_id || "-"}</div>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-800 dark:bg-gray-950/30">
                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">เบอร์โทร</div>
                    <div className="mt-1 font-mono text-gray-900 dark:text-gray-100">{selectedUser.person?.telephone || "-"}</div>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-800 dark:bg-gray-950/30">
                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">วันเกิด</div>
                    <div className="mt-1 text-gray-900 dark:text-gray-100">{formatDateDDMMYYYY(selectedUser.person?.birthday || null)}</div>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-800 dark:bg-gray-950/30">
                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">สร้างบัญชีเมื่อ</div>
                    <div className="mt-1 text-gray-900 dark:text-gray-100">{formatDateDDMMYYYY(selectedUser.created_at)}</div>
                  </div>
                </div>
              </div>

              {/* ===== Pending Summary Card ===== */}
              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900/70">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">สถานะคำขอโปรไฟล์ล่าสุด</div>
                    <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                      {selectedUser.has_pending_profile ? (
                        <>
                          มีคำขอรออนุมัติ <span className="text-amber-700 dark:text-amber-200">(pending)</span>
                        </>
                      ) : (
                        <>ไม่มีคำขอรออนุมัติ</>
                      )}
                    </div>
                  </div>

                  {selectedUser.has_pending_profile ? (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={handleRejectProfile}
                        disabled={approving || !pendingDetail?.approval_id}
                        className="rounded-lg bg-rose-500 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-600 disabled:bg-rose-300"
                      >
                        {approving ? "กำลังดำเนินการ..." : "ตีกลับ"}
                      </button>
                      <button
                        type="button"
                        onClick={handleApproveProfile}
                        disabled={approving || !pendingDetail?.approval_id}
                        className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:bg-emerald-300"
                      >
                        {approving ? "กำลังดำเนินการ..." : "อนุมัติ"}
                      </button>
                    </div>
                  ) : null}
                </div>

                {selectedUser.has_pending_profile && (
                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-800 dark:bg-gray-950/30">
                      <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">ส่งคำขอ</div>
                      <div className="mt-1 text-gray-900 dark:text-gray-100">
                        {pendingDetail?.submitted_at ? formatDateDDMMYYYY(pendingDetail.submitted_at) : "-"}
                      </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-800 dark:bg-gray-950/30">
                      <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">รายการเปลี่ยนแปลง</div>
                      <div className="mt-1 text-gray-900 dark:text-gray-100">{pendingDetail?.changes?.length ?? 0}</div>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-800 dark:bg-gray-950/30">
                      <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">ไฟล์แนบ (คำขอ)</div>
                      <div className="mt-1 text-gray-900 dark:text-gray-100">{pendingDetail?.attachments?.length ?? 0}</div>
                    </div>
                  </div>
                )}

                {(loadingDetail || loadingSampleFiles) && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <span className="h-4 w-4 animate-spin rounded-full border border-gray-400 border-t-transparent" />
                    กำลังโหลดรายละเอียด/ไฟล์...
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ===== Diff Modal ===== */}
      {diffModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 md:p-6">
          <div className="h-[92vh] w-[96vw] overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900">
            <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-4 py-3 dark:border-gray-700">
              <div className="min-w-0">
                <div className="text-base font-semibold text-gray-900 dark:text-gray-100">ตรวจสอบการเปลี่ยนแปลงโปรไฟล์</div>
                <div className="mt-0.5 text-sm text-gray-600 dark:text-gray-300">
                  ผู้ใช้: <span className="font-semibold">{selectedUser.person?.full_name_th || selectedUser.username}</span>{" "}
                  <span className="text-gray-500 dark:text-gray-400">({selectedUser.username})</span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 dark:bg-gray-800">
                    ส่งคำขอ: {pendingDetail?.submitted_at ? formatDateDDMMYYYY(pendingDetail.submitted_at) : "-"}
                  </span>
                  {pendingDetail?.reason_note ? (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800 dark:bg-amber-900/30 dark:text-amber-100">
                      หมายเหตุ: {pendingDetail.reason_note}
                    </span>
                  ) : null}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setDiffModalOpen(false)}
                className="shrink-0 rounded-lg px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-4 py-2 dark:border-gray-700">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setModalTab("changes")}
                  className={`rounded-full px-3 py-1 text-sm font-medium ${
                    modalTab === "changes"
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  รายการเปลี่ยนแปลง <span className="ml-1 text-xs opacity-90">({pendingDetail?.changes?.length ?? 0})</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setModalTab("attachments");
                    // ✅ เข้าแท็บไฟล์แล้ว ถ้าไม่มีอะไร เลือกตัวแรกให้เลย
                    setSelectedAttachment((prev) => {
                      if (prev?.url) return prev;
                      if (pendingAttachments.length > 0) return pendingAttachments[0];
                      if (currentAttachments.length > 0) return currentAttachments[0];
                      return null;
                    });
                  }}
                  className={`rounded-full px-3 py-1 text-sm font-medium ${
                    modalTab === "attachments"
                      ? "bg-emerald-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  ไฟล์แนบ{" "}
                  <span className="ml-1 text-xs opacity-90">
                    ({(pendingDetail?.attachments?.length ?? 0) + (sampleAttachments?.length ?? 0)})
                  </span>
                </button>
              </div>

              {modalTab === "changes" && (
                <div className="flex items-center gap-2">
                  <input
                    value={changeQuery}
                    onChange={(e) => setChangeQuery(e.target.value)}
                    placeholder="ค้นหาในรายการเปลี่ยนแปลง..."
                    className="w-72 max-w-[70vw] rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 outline-none focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                  />
                </div>
              )}
            </div>

            <div className="h-[calc(92vh-120px)] overflow-auto px-4 py-4">
              {(loadingDetail || loadingSampleFiles) && (
                <div className="mb-4 flex items-center gap-2 text-gray-500 dark:text-gray-400">
                  <span className="h-4 w-4 animate-spin rounded-full border border-gray-400 border-t-transparent" />
                  กำลังโหลดรายละเอียด/ไฟล์...
                </div>
              )}

              {!loadingDetail && pendingDetail && modalTab === "changes" && (
                <>
                  {pendingDetail.changes.length === 0 ? (
                    <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-200">
                      ไม่มีรายการที่เปลี่ยนแปลง (ข้อมูลที่ส่งเหมือนเดิม)
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {changeGroupOrder
                        .filter((g) => groupedChanges[g]?.length)
                        .map((g) => (
                          <div
                            key={g}
                            className="rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900/60"
                          >
                            <div className="mb-2 flex items-center justify-between">
                              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{g}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{groupedChanges[g].length} รายการ</div>
                            </div>

                            <div className="grid gap-3 md:grid-cols-2">
                              {groupedChanges[g].map((c) => (
                                <div
                                  key={`${c.key}-${c.label}`}
                                  className="rounded-2xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-950/40"
                                >
                                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{c.label}</div>
                                  <div className="mt-0.5 text-[11px] font-mono text-gray-500 dark:text-gray-400">{c.key}</div>

                                  <div className="mt-3 grid gap-2 lg:grid-cols-2">
                                    <div className="rounded-xl border border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-900">
                                      <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">ค่าเดิม</div>
                                      <pre className="mt-1 whitespace-pre-wrap break-words text-sm text-gray-800 dark:text-gray-200">
                                        {c.old_value || "-"}
                                      </pre>
                                    </div>

                                    <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-2 dark:border-indigo-700/50 dark:bg-indigo-900/20">
                                      <div className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-200">ค่าที่ขอเปลี่ยน</div>
                                      <pre className="mt-1 whitespace-pre-wrap break-words text-sm text-indigo-800 dark:text-indigo-100">
                                        {c.new_value || "-"}
                                      </pre>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </>
              )}

              {modalTab === "attachments" && (
                <>
                  {allAttachmentsForList.length === 0 ? (
                    <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-200">
                      ยังไม่พบไฟล์แนบ (ทั้งในคำขอ และไฟล์ตัวอย่างปัจจุบัน)
                    </div>
                  ) : (
                    <div className="grid gap-4 lg:grid-cols-3">
                      <div className="lg:col-span-1 rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900/60">
                        <div className="mb-2 flex items-center justify-between">
                          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">รายการไฟล์</div>
                          <button
                            type="button"
                            onClick={() => {
                              if (!selectedUser) return;
                              loadSampleAttachmentsForUser(selectedUser.user_id);
                              if (selectedUser.has_pending_profile) loadPendingDetailForUser(selectedUser.user_id);
                            }}
                            className="rounded-lg bg-gray-900 px-2 py-1 text-[11px] font-semibold text-white hover:bg-black dark:bg-gray-200 dark:text-gray-900 dark:hover:bg-white"
                          >
                            รีเฟรชไฟล์
                          </button>
                        </div>

                        <div className="mb-3 flex flex-wrap gap-2 text-xs">
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800 dark:bg-amber-900/30 dark:text-amber-100">
                            ในคำขอ: {pendingAttachments.length}
                          </span>
                          <span className="rounded-full bg-sky-100 px-2 py-0.5 text-sky-800 dark:bg-sky-900/30 dark:text-sky-100">
                            ตัวอย่างปัจจุบัน: {currentAttachments.length}
                          </span>
                        </div>

                        <div className="space-y-2">
                          {allAttachmentsForList.map((a, idx) => {
                            const active = selectedAttachment?.url === a.url && selectedAttachment?.source === a.source && selectedAttachment?.section === a.section;
                            return (
                              <button
                                key={`${a.source}-${a.section}-${idx}-${a.url}`}
                                type="button"
                                onClick={() => setSelectedAttachment(a)}
                                className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                                  active
                                    ? "border-emerald-400 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/20"
                                    : "border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 hover:dark:bg-gray-800"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <div className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{a.label}</div>
                                    <div className="mt-0.5 break-all text-[11px] text-gray-500 dark:text-gray-400">{a.url}</div>
                                  </div>
                                  <div className="shrink-0">{renderSourceBadge(a.source)}</div>
                                </div>

                                <div className="mt-2 inline-flex flex-wrap items-center gap-2">
                                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                                    {a.kind.toUpperCase()}
                                  </span>
                                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                                    {a.section}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900/60">
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">พรีวิวไฟล์</div>
                            {selectedAttachment?.source ? renderSourceBadge(selectedAttachment.source) : null}
                          </div>

                          {selectedAttachment?.url && (
                            <a
                              href={safeUrl(selectedAttachment.url)}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                            >
                              เปิดไฟล์ในแท็บใหม่
                            </a>
                          )}
                        </div>

                        {!selectedAttachment?.url ? (
                          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-200">
                            เลือกไฟล์จากรายการด้านซ้ายเพื่อพรีวิว
                          </div>
                        ) : selectedAttachment.kind === "image" ? (
                          <div className="h-[68vh] overflow-auto rounded-xl border border-gray-200 bg-black/5 p-2 dark:border-gray-700 dark:bg-black/20">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={safeUrl(selectedAttachment.url)}
                              alt={selectedAttachment.label}
                              className="mx-auto max-h-[65vh] w-auto rounded-lg object-contain"
                            />
                          </div>
                        ) : selectedAttachment.kind === "pdf" ? (
                          <div className="h-[68vh] overflow-hidden rounded-xl border border-gray-200 bg-black/5 dark:border-gray-700 dark:bg-black/20">
                            <iframe src={safeUrl(selectedAttachment.url)} className="h-full w-full" />
                          </div>
                        ) : (
                          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-200">
                            ไฟล์ชนิดนี้พรีวิวในหน้าจอไม่ได้ ให้กด “เปิดไฟล์ในแท็บใหม่”
                            <div className="mt-2 break-all text-xs text-gray-500 dark:text-gray-400">{safeUrl(selectedAttachment.url)}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-4 py-3 text-sm dark:border-gray-700">
              <div className="text-xs text-gray-500 dark:text-gray-400">ตรวจสอบรายละเอียดให้ครบก่อนอนุมัติหรือทำการตีกลับ</div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDiffModalOpen(false)}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  ปิดหน้าต่าง
                </button>

                <button
                  type="button"
                  disabled={approving || !pendingDetail?.approval_id}
                  onClick={handleRejectProfile}
                  className="rounded-lg bg-rose-500 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-600 disabled:bg-rose-300"
                >
                  {approving ? "กำลังดำเนินการ..." : "ตีกลับโปรไฟล์"}
                </button>

                <button
                  type="button"
                  disabled={approving || !pendingDetail?.approval_id}
                  onClick={handleApproveProfile}
                  className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:bg-emerald-300"
                >
                  {approving ? "กำลังดำเนินการ..." : "อนุมัติโปรไฟล์"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
