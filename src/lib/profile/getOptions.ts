import { query } from "@/lib/db";

export async function getProfileOptions() {
  const toOpt4 = (idCol: string) => (rows: any[]) =>
    rows.map((r) => ({
      id: Number(r[idCol]),
      code: r.code,
      name_th: r.name_th,
      name_en: r.name_en ?? null,
    }));

  const prefixes = toOpt4("prefix_id")(await query(`SELECT prefix_id, code, name_th, name_en FROM prefix_name ORDER BY prefix_id ASC`));
  const genders = toOpt4("gender_id")(await query(`SELECT gender_id, code, name_th, name_en FROM gender ORDER BY gender_id ASC`));
  const nationalities = toOpt4("nationality_id")(await query(`SELECT nationality_id, code, name_th, name_en FROM nationality ORDER BY nationality_id ASC`));

  const universities = (await query(`SELECT univ_id, code, name FROM university ORDER BY univ_id ASC`)).map((r: any) => ({
    id: Number(r.univ_id),
    code: r.code,
    name: r.name,
  }));

  const staffTypes = toOpt4("stafftype_id")(await query(`SELECT stafftype_id, code, name_th, name_en FROM staff_type ORDER BY stafftype_id ASC`));
  const substaffTypes = toOpt4("substafftype_id")(await query(`SELECT substafftype_id, code, name_th, name_en FROM substaff_type ORDER BY substafftype_id ASC`));
  const supportLevels = toOpt4("positionlevel_id")(await query(`SELECT positionlevel_id, code, name_th, name_en FROM support_level ORDER BY positionlevel_id ASC`));
  const timeContracts = toOpt4("time_contract_id")(await query(`SELECT time_contract_id, code, name_th, name_en FROM time_contract ORDER BY time_contract_id ASC`));
  const budgets = toOpt4("budget_id")(await query(`SELECT budget_id, code, name_th, name_en FROM budget ORDER BY budget_id ASC`));
  const adminPositions = toOpt4("admin_position_id")(await query(`SELECT admin_position_id, code, name_th, name_en FROM admin_position ORDER BY admin_position_id ASC`));
  const academicStandings = toOpt4("academicstanding_id")(await query(`SELECT academicstanding_id, code, name_th, name_en FROM academic_standing ORDER BY academicstanding_id ASC`));
  const movementTypes = toOpt4("movement_type_id")(await query(`SELECT movement_type_id, code, name_th, name_en FROM movement_type ORDER BY movement_type_id ASC`));
  const gradLevels = toOpt4("grad_lev_id")(await query(`SELECT grad_lev_id, code, name_th, name_en FROM grad_level ORDER BY grad_lev_id ASC`));
  const countries = toOpt4("country_id")(await query(`SELECT country_id, code, name_th, name_en FROM country ORDER BY country_id ASC`));

  const researcherStatuses = toOpt4("researcher_status_id")(await query(`SELECT researcher_status_id, code, name_th, name_en FROM researcher_status ORDER BY researcher_status_id ASC`));
  const scholarOrderTypes = toOpt4("scholar_order_id")(await query(`SELECT scholar_order_id, code, name_th, name_en FROM scholar_order_type ORDER BY scholar_order_id ASC`));
  const departments = toOpt4("department_id")(await query(`SELECT department_id, code, name_th, name_en FROM department ORDER BY department_id ASC`));
  const decorations = toOpt4("decoration_id")(await query(`SELECT decoration_id, code, name_th, name_en FROM decoration ORDER BY decoration_id ASC`));

  const licenseTypes = toOpt4("license_type_id")(await query(`SELECT license_type_id, code, name_th, name_en FROM license_type ORDER BY license_type_id ASC`));
  const eduDegrees = toOpt4("degree_id")(await query(`SELECT degree_id, code, name_th, name_en FROM edu_degree WHERE is_active=1 ORDER BY sort_order ASC, degree_id ASC`));
  const eduMajors = toOpt4("major_id")(await query(`SELECT major_id, code, name_th, name_en FROM edu_major WHERE is_active=1 ORDER BY sort_order ASC, major_id ASC`));
  const eduInstitutions = toOpt4("institution_id")(await query(`SELECT institution_id, code, name_th, name_en FROM edu_institution WHERE is_active=1 ORDER BY sort_order ASC, institution_id ASC`));

  return {
    prefixes,
    genders,
    nationalities,
    universities,

    staffTypes,
    substaffTypes,
    supportLevels,
    timeContracts,
    budgets,
    adminPositions,
    academicStandings,
    movementTypes,
    gradLevels,
    countries,

    researcherStatuses,
    scholarOrderTypes,
    departments,
    decorations,

    licenseTypes,
    eduDegrees,
    eduMajors,
    eduInstitutions,
  };
}
