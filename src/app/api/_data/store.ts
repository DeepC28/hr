// type AnyRow = { id: string | number } & Record<string, any>;
// const stores = new Map<string, AnyRow[]>();

// export function getStore(entity: string): AnyRow[] {
//   if (!stores.has(entity)) stores.set(entity, []);
//   return stores.get(entity)!;
// }

// export function setStore(entity: string, rows: AnyRow[]) {
//   stores.set(entity, rows);
// }