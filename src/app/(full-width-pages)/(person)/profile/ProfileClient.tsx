"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

import StatusBadge from "./components/StatusBadge";
import ProfileTabsHeader, { ProfileTabKey } from "./components/ProfileTabsHeader";

import BasicInfoTab from "./components/BasicInfoTab";
import AddressTab from "./components/AddressTab";
import WorkInfoTab from "./components/WorkInfoTab";
import EducationTab from "./components/EducationTab";
import LicensesTab from "./components/LicensesTab";
import MovementsTab from "./components/MovementsTab";
import TrainingsTab from "./components/TrainingsTab";
import DecorationsTab from "./components/DecorationsTab";
import PenaltiesTab from "./components/PenaltiesTab";
import ResearcherTab from "./components/ResearcherTab";
import ScholarOrdersTab from "./components/ScholarOrdersTab";
import DepartmentsTab from "./components/DepartmentsTab";

export type ProfileStatus = "none" | "pending" | "approved" | "rejected";

export type Option4 = {
  id: number;
  code: string;
  name_th: string;
  name_en: string | null;
};

export type LookupOptions = {
  prefixes: Option4[];
  genders: Option4[];
  nationalities: Option4[];
  universities: { id: number; code: string; name: string }[];

  staffTypes: Option4[];
  substaffTypes: Option4[];
  supportLevels: Option4[];
  timeContracts: Option4[];
  budgets: Option4[];
  adminPositions: Option4[];
  academicStandings: Option4[];
  movementTypes: Option4[];
  gradLevels: Option4[];
  countries: Option4[];

  researcherStatuses: Option4[];
  scholarOrderTypes: Option4[];
  departments: Option4[];
  decorations: Option4[];

  licenseTypes: Option4[];
  eduDegrees: Option4[];
  eduMajors: Option4[];
  eduInstitutions: Option4[];
};

export type PersonForm = {
  person_id: number | null;

  picture_url: string | null;

  prefix_id: number | null;
  first_name_th: string;
  last_name_th: string;
  first_name_en: string | null;
  last_name_en: string | null;
  status_text: string | null;

  citizen_id: string | null;
  telephone: string | null;
  email: string | null;
  birthday: string | null;

  gender_id: number | null;
  nationality_id: number | null;

  stafftype_id: number | null;
  substafftype_id: number | null;
  time_contract_id: number | null;
  contract_end_date: string | null;
  budget_id: number | null;
  admin_position_id: number | null;
  academicstanding_id: number | null;
  positionlevel_id: number | null;
  position_work: string | null;
  date_inwork: string | null;
  date_start_this_u: string | null;
  univ_id: number | null;

  income_amount: string | null;
  cost_of_living: string | null;

  home_no: string | null;
  moo: string | null;
  street: string | null;
  sub_district_id: string | null;
  zipcode: string | null;

  passport_no: string | null;
  passport_issued_date: string | null;
  passport_expiry_date: string | null;
};

export type EducationForm = {
  education_id: number | null;
  grad_lev_id: number | null;

  degree_id: number | null;
  major_id: number | null;
  institution_id: number | null;

  degree_name: string;
  major_name: string;
  university_name: string;

  country_id: number | null;
  grad_date: string | null;
};

export type LicenseForm = {
  license_id: number | null;
  license_type_id: number | null;

  license_name: string;
  issued_date: string | null;
  expiry_date: string | null;

  file_url: string;

  file_upload_url: string | null;
  file_upload_name: string | null;
};

export type MovementForm = {
  movement_id: number | null;
  movement_type_id: number | null;
  effective_date: string | null;
  remark: string;
};

export type TrainingForm = {
  training_id: number | null;
  title: string;
  provider: string;
  hours: string;
  days: string;
  location: string;
  country_id: number | null;
  start_date: string | null;
  end_date: string | null;

  file_url: string;

  file_upload_url: string | null;
  file_upload_name: string | null;
};

export type DecorationForm = {
  person_decoration_id: number | null;
  decoration_id: number | null;
  received_date: string | null;
};

export type PenaltyForm = {
  penalty_id: number | null;
  title: string;
  detail: string;
  decision_date: string | null;

  file_url: string;

  file_upload_url: string | null;
  file_upload_name: string | null;
};

export type ResearcherForm = {
  person_researcher_id: number | null;
  researcher_status_id: number | null;
};

export type ScholarOrderForm = {
  person_scholar_order_id: number | null;
  scholar_order_id: number | null;

  order_no: string;
  duration_years: string;
  duration_months: string;
  duration_days: string;

  order_date_start: string | null;
  order_date_end: string | null;
};

export type DepartmentForm = {
  department_id: number | null;
  relation_level: number;
  is_primary: boolean;
};

export type ProfileFormData = {
  person: PersonForm;
  education: EducationForm[];
  licenses: LicenseForm[];
  movements: MovementForm[];
  trainings: TrainingForm[];
  decorations: DecorationForm[];
  penalties: PenaltyForm[];
  researcher: ResearcherForm | null;
  scholarOrders: ScholarOrderForm[];
  departments: DepartmentForm[];
};

type ProfileApiResponse = {
  status?: ProfileStatus;
  user?: { user_id: number; username: string; email: string | null };
  person: Partial<PersonForm> | null;

  education?: EducationForm[];
  licenses?: LicenseForm[];
  movements?: MovementForm[];
  trainings?: TrainingForm[];
  decorations?: DecorationForm[];
  penalties?: PenaltyForm[];
  researcher?: ResearcherForm | null;
  scholarOrders?: ScholarOrderForm[];
  departments?: DepartmentForm[];

  has_pending_profile?: boolean;
  pending_profile?: any;
};

type ProfileClientProps = {
  loginEmail: string | null;
  loginUsername: string | null;
};

const emptyPerson = (): PersonForm => ({
  person_id: null,

  picture_url: null,

  prefix_id: null,
  first_name_th: "",
  last_name_th: "",
  first_name_en: "",
  last_name_en: "",
  status_text: null,

  citizen_id: "",
  telephone: "",
  email: "",
  birthday: null,

  gender_id: null,
  nationality_id: null,

  stafftype_id: null,
  substafftype_id: null,
  time_contract_id: null,
  contract_end_date: null,
  budget_id: null,
  admin_position_id: null,
  academicstanding_id: null,
  positionlevel_id: null,
  position_work: "",
  date_inwork: null,
  date_start_this_u: null,
  univ_id: null,

  income_amount: "",
  cost_of_living: "",

  home_no: "",
  moo: "",
  street: "",
  sub_district_id: "",
  zipcode: "",

  passport_no: "",
  passport_issued_date: null,
  passport_expiry_date: null,
});

function normalizeOptions(raw: any): LookupOptions {
  const safeArr = (v: any) => (Array.isArray(v) ? v : []);
  return {
    prefixes: safeArr(raw?.prefixes),
    genders: safeArr(raw?.genders),
    nationalities: safeArr(raw?.nationalities),
    universities: safeArr(raw?.universities),

    staffTypes: safeArr(raw?.staffTypes),
    substaffTypes: safeArr(raw?.substaffTypes),
    supportLevels: safeArr(raw?.supportLevels),
    timeContracts: safeArr(raw?.timeContracts),
    budgets: safeArr(raw?.budgets),
    adminPositions: safeArr(raw?.adminPositions),
    academicStandings: safeArr(raw?.academicStandings),
    movementTypes: safeArr(raw?.movementTypes),
    gradLevels: safeArr(raw?.gradLevels),
    countries: safeArr(raw?.countries),

    researcherStatuses: safeArr(raw?.researcherStatuses),
    scholarOrderTypes: safeArr(raw?.scholarOrderTypes),
    departments: safeArr(raw?.departments),
    decorations: safeArr(raw?.decorations),

    licenseTypes: safeArr(raw?.licenseTypes),
    eduDegrees: safeArr(raw?.eduDegrees),
    eduMajors: safeArr(raw?.eduMajors),
    eduInstitutions: safeArr(raw?.eduInstitutions),
  };
}

export default function ProfileClient({ loginEmail, loginUsername }: ProfileClientProps) {
  const [status, setStatus] = useState<ProfileStatus>("none");
  const [activeTab, setActiveTab] = useState<ProfileTabKey>("basic");

  const [form, setForm] = useState<ProfileFormData | null>(null);
  const [options, setOptions] = useState<LookupOptions | null>(null);

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [saving, setSaving] = useState(false);

  const canEdit = status !== "pending";

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoadingProfile(true);
        const res = await fetch("/api/profile/me", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        });

        const data: ProfileApiResponse = await res.json().catch(() => ({}) as any);

        if (!res.ok) {
          throw new Error((data as any)?.message || "ไม่สามารถโหลดข้อมูลโปรไฟล์ได้");
        }

        const person: PersonForm = {
          ...emptyPerson(),
          ...(data.person || {}),
        } as PersonForm;

        const normalized: ProfileFormData = {
          person,
          education: Array.isArray(data.education) ? data.education : [],
          licenses: Array.isArray(data.licenses) ? data.licenses : [],
          movements: Array.isArray(data.movements) ? data.movements : [],
          trainings: Array.isArray(data.trainings) ? data.trainings : [],
          decorations: Array.isArray(data.decorations) ? data.decorations : [],
          penalties: Array.isArray(data.penalties) ? data.penalties : [],
          researcher: data.researcher ?? null,
          scholarOrders: Array.isArray(data.scholarOrders) ? data.scholarOrders : [],
          departments: Array.isArray(data.departments) ? data.departments : [],
        };

        setForm(normalized);
        setStatus(data.status || "none");
      } catch (err: any) {
        console.error(err);
        Swal.fire("เกิดข้อผิดพลาด", err?.message || "ไม่สามารถโหลดข้อมูลโปรไฟล์ได้", "error");
      } finally {
        setLoadingProfile(false);
      }
    };

    const loadOptions = async () => {
      try {
        setLoadingOptions(true);
        const res = await fetch("/api/profile/options", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data?.message || "โหลดข้อมูลอ้างอิงไม่สำเร็จ");
        }

        setOptions(normalizeOptions(data));
      } catch (err: any) {
        console.error(err);
        Swal.fire("เกิดข้อผิดพลาด", err?.message || "โหลดข้อมูลอ้างอิงไม่สำเร็จ", "error");
      } finally {
        setLoadingOptions(false);
      }
    };

    loadProfile();
    loadOptions();
  }, []);

  const handleSubmitAll = async () => {
    if (!form) return;

    if (!canEdit) {
      Swal.fire(
        "ไม่สามารถแก้ไขได้",
        "ขณะนี้มีคำขอที่รอผู้ดูแลระบบอนุมัติอยู่ กรุณารอให้ดำเนินการเสร็จก่อน",
        "info",
      );
      return;
    }

    const hasPrimaryDept = Array.isArray(form.departments) && form.departments.some((d) => d.is_primary);

    if (!hasPrimaryDept) {
      Swal.fire(
        "กรุณาเลือกหน่วยงานหลัก",
        "โปรดติ๊กช่อง “เป็นหน่วยงานหลัก” อย่างน้อย 1 หน่วยงาน ก่อนส่งคำขอ",
        "warning",
      );
      return;
    }

    const confirm = await Swal.fire({
      title: "ยืนยันการส่งคำขอ?",
      text: "ระบบจะส่งข้อมูลจากทุกแท็บให้ผู้ดูแลระบบตรวจสอบ",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "ส่งคำขอ",
      cancelButtonText: "ยกเลิก",
    });

    if (!confirm.isConfirmed) return;

    try {
      setSaving(true);
      const res = await fetch("/api/profile/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || "ส่งคำขอไม่สำเร็จ");
      }

      setStatus("pending");
      Swal.fire("ส่งคำขอเรียบร้อย", "ข้อมูลของคุณถูกส่งให้ผู้ดูแลระบบตรวจสอบแล้ว", "success");
    } catch (err: any) {
      console.error(err);
      Swal.fire("เกิดข้อผิดพลาด", err?.message || "ส่งคำขอไม่สำเร็จ", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loadingProfile || loadingOptions || !form || !options) {
    return (
      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
        <p>กำลังโหลดข้อมูลโปรไฟล์และข้อมูลอ้างอิง...</p>
      </div>
    );
  }

  const personId = form.person.person_id;

  const updatePerson = (next: PersonForm) => setForm((prev) => (prev ? { ...prev, person: next } : prev));
  const updateEducation = (next: EducationForm[]) => setForm((prev) => (prev ? { ...prev, education: next } : prev));
  const updateLicenses = (next: LicenseForm[]) => setForm((prev) => (prev ? { ...prev, licenses: next } : prev));
  const updateMovements = (next: MovementForm[]) => setForm((prev) => (prev ? { ...prev, movements: next } : prev));
  const updateTrainings = (next: TrainingForm[]) => setForm((prev) => (prev ? { ...prev, trainings: next } : prev));
  const updateDecorations = (next: DecorationForm[]) => setForm((prev) => (prev ? { ...prev, decorations: next } : prev));
  const updatePenalties = (next: PenaltyForm[]) => setForm((prev) => (prev ? { ...prev, penalties: next } : prev));
  const updateResearcher = (next: ResearcherForm | null) => setForm((prev) => (prev ? { ...prev, researcher: next } : prev));
  const updateScholarOrders = (next: ScholarOrderForm[]) => setForm((prev) => (prev ? { ...prev, scholarOrders: next } : prev));
  const updateDepartments = (next: DepartmentForm[]) => setForm((prev) => (prev ? { ...prev, departments: next } : prev));

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">โปรไฟล์ผู้ใช้งาน</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            ข้อมูลที่คุณกรอกจะยังไม่มีผลทันที ต้องรอให้ผู้ดูแลระบบตรวจสอบและยืนยันก่อน
          </p>
          {!canEdit && (
            <p className="mt-1 text-xs text-yellow-700 dark:text-yellow-300">
              ขณะนี้มีคำขอที่รออนุมัติอยู่ คุณไม่สามารถแก้ไขข้อมูลได้จนกว่าผู้ดูแลระบบจะดำเนินการเสร็จ
            </p>
          )}
        </div>
        <StatusBadge status={status} />
      </div>

      <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
        {loginUsername && (
          <p>
            บัญชีผู้ใช้: <span className="break-all font-medium">{loginUsername}</span>
          </p>
        )}
        {loginEmail && (
          <p>
            อีเมลเข้าสู่ระบบ: <span className="break-all font-medium">{loginEmail}</span>
          </p>
        )}
      </div>

      <ProfileTabsHeader active={activeTab} onChange={setActiveTab} />

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        {activeTab === "basic" && <BasicInfoTab person={form.person} onChange={updatePerson} options={options} disabled={!canEdit} />}
        {activeTab === "address" && <AddressTab person={form.person} onChange={updatePerson} disabled={!canEdit} />}
        {activeTab === "work" && <WorkInfoTab person={form.person} onChange={updatePerson} options={options} disabled={!canEdit} />}
        {activeTab === "education" && <EducationTab items={form.education} onChange={updateEducation} options={options} disabled={!canEdit} />}

        {activeTab === "licenses" && (
          <LicensesTab
            personId={personId}
            items={form.licenses}
            onChange={updateLicenses}
            disabled={!canEdit}
            options={options}
          />
        )}

        {activeTab === "movements" && <MovementsTab items={form.movements} onChange={updateMovements} options={options} disabled={!canEdit} />}

        {activeTab === "trainings" && (
          <TrainingsTab
            personId={personId}
            items={form.trainings}
            onChange={updateTrainings}
            disabled={!canEdit}
            countries={options.countries ?? []}
          />
        )}

        {activeTab === "decorations" && <DecorationsTab items={form.decorations} onChange={updateDecorations} options={options} disabled={!canEdit} />}

        {activeTab === "penalties" && (
          <PenaltiesTab
            personId={personId}
            items={form.penalties}
            onChange={updatePenalties}
            disabled={!canEdit}
          />
        )}

        {activeTab === "researcher" && <ResearcherTab value={form.researcher} onChange={updateResearcher} options={options} disabled={!canEdit} />}

        {activeTab === "scholar-orders" && <ScholarOrdersTab items={form.scholarOrders} onChange={updateScholarOrders} options={options} disabled={!canEdit} />}

        {activeTab === "departments" && <DepartmentsTab items={form.departments} onChange={updateDepartments} options={options} disabled={!canEdit} />}
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="button"
          disabled={!canEdit || saving}
          onClick={handleSubmitAll}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-400"
        >
          {saving ? "กำลังส่งคำขอ..." : "บันทึก / ส่งคำขอให้ผู้ดูแลระบบ"}
        </button>
      </div>
    </div>
  );
}
