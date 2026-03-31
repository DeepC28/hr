export type ProfileStatus = "none" | "pending" | "approved" | "rejected";

export type PersonRow = any;

export type ProfileSnapshot = {
  person: any;
  education: any[];
  licenses: any[];
  movements: any[];
  trainings: any[];
  decorations: any[];
  penalties: any[];
  researcher: any | null;
  scholarOrders: any[];
  departments: any[];
};
