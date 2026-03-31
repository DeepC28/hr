// src/app/(full-width-pages)/(person)/profile/types.ts

export type ProfileStatus = "none" | "pending" | "approved" | "rejected";

export type TabId =
  | "general"
  | "address"
  | "employment"
  | "education"
  | "licenses"
  | "movements"
  | "trainings"
  | "decorations"
  | "passports"
  | "penalties"
  | "researcher"
  | "scholar-orders"
  | "departments";

// ===== person (ข้อมูลบุคคลหลัก) =====
export type PersonData = {
  person_id: number;
  first_name_th: string;
  last_name_th: string;
  first_name_en: string | null;
  last_name_en: string | null;
  citizen_id: string | null;
  telephone: string | null;
  email: string | null;
  birthday: string | null; // yyyy-mm-dd

  prefix_name_th: string | null;
  gender_name: string | null;
  nationality_name: string | null;
};

// ===== work summary (การจ้างงานหลัก) =====
export type WorkSummary = {
  person_id: number;
  position_work: string | null;
  staff_type_name: string | null;
  substaff_type_name: string | null;
  admin_position_name: string | null;
  time_contract_name: string | null;
  support_level_name: string | null;
  date_inwork: string | null; // yyyy-mm-dd
  date_start_this_u: string | null; // yyyy-mm-dd
  employee_code: string | null; // map จาก rate_number

  department_path: string | null;
  main_department_name: string | null;
};

// ===== education (หลายแถว) =====
export type EducationSummary = {
  id: number;
  grad_level_name: string | null;
  degree_name: string | null;
  major: string | null;
  university_name: string | null;
  country_name: string | null;
  graduate_year: string | null; // YYYY ที่ parse จาก grad_date
};

// ===== address summary =====
export type AddressSummary = {
  full_address: string | null;
  postcode: string | null;
};

// ===== licenses (หลายแถว) =====
export type LicenseItem = {
  license_id: number;
  license_name: string | null;
  file_url: string | null;
  issued_date: string | null; // yyyy-mm-dd
  expiry_date: string | null; // yyyy-mm-dd
};

// ===== movements (หลายแถว) =====
export type MovementItem = {
  movement_id: number;
  movement_type_name: string | null;
  movement_type_code: string | null;
  effective_date: string | null; // yyyy-mm-dd
  remark: string | null;
};

// ===== trainings (หลายแถว) =====
export type TrainingItem = {
  training_id: number | null;
  title: string;
  provider: string;
  hours: string;
  days: string;               // ✅
  location: string;           // ✅
  start_date: string | null;
  end_date: string | null;
  country_id: number | null;  // ✅
  file_url: string;
};




// ===== decorations (หลายแถว) =====
export type DecorationItem = {
  person_decoration_id: number;
  decoration_name: string | null;
  received_date: string | null;
};

// ===== passports (หลายแถว) =====
export type PassportItem = {
  passport_id: number;
  passport_no: string | null;
  issued_date: string | null;
  expiry_date: string | null;
};

// ===== penalties (หลายแถว) =====
export type PenaltyItem = {
  penalty_id: number;
  title: string | null;
  detail: string | null;
  decision_date: string | null;
  file_url: string | null;
};

// ===== researcher (หลายแถว) =====
export type ResearcherItem = {
  person_researcher_id: number;
  status_name: string | null;
  status_code: string | null;
};

// ===== scholar orders (หลายแถว) =====
export type ScholarOrderItem = {
  person_scholar_order_id: number;
  scholar_order_name: string | null;
  scholar_order_code: string | null;
  order_date_start: string | null;
  order_date_end: string | null;
};

// ===== departments (หลายแถว) =====
export type DepartmentRel = {
  department_id: number;
  relation_level: number;
  is_primary: boolean;
  department_name: string | null;
  department_code: string | null;
  department_path: string | null;
};

export type ProfileData = {
  status: ProfileStatus;
  person: PersonData | null;
  work: WorkSummary | null;
  education: EducationSummary[];
  address: AddressSummary | null;

  licenses: LicenseItem[];
  movements: MovementItem[];
  trainings: TrainingItem[];
  decorations: DecorationItem[];
  passports: PassportItem[];
  penalties: PenaltyItem[];
  researcher: ResearcherItem[];
  scholarOrders: ScholarOrderItem[];
  departments: DepartmentRel[];
};
