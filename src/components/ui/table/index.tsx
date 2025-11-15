// src/components/ui/table.tsx
import * as React from "react";

/* ========== <table> ========== */
export type TableProps = React.ComponentPropsWithoutRef<"table">;

export const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className = "", ...rest }, ref) => {
    return <table ref={ref} className={`min-w-full ${className}`} {...rest} />;
  }
);
Table.displayName = "Table";

/* ========== <thead> ========== */
export type TableHeaderProps = React.ComponentPropsWithoutRef<"thead">;

export const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  TableHeaderProps
>(({ className = "", ...rest }, ref) => {
  return <thead ref={ref} className={className} {...rest} />;
});
TableHeader.displayName = "TableHeader";

/* ========== <tbody> ========== */
export type TableBodyProps = React.ComponentPropsWithoutRef<"tbody">;

export const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  TableBodyProps
>(({ className = "", ...rest }, ref) => {
  return <tbody ref={ref} className={className} {...rest} />;
});
TableBody.displayName = "TableBody";

/* ========== <tr> ========== */
export type TableRowProps = React.ComponentPropsWithoutRef<"tr">;

export const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className = "", ...rest }, ref) => {
    return <tr ref={ref} className={className} {...rest} />;
  }
);
TableRow.displayName = "TableRow";

/* ========== <th>/<td> ========== */
/** รองรับทั้งโหมด header และ data cell พร้อมพร็อพมาตรฐานทั้งหมด (colSpan/rowSpan/…)
 *  - isHeader=false (หรือไม่ส่ง) => <td>
 *  - isHeader=true => <th>
 */
export type TableCellProps =
  | ({ isHeader?: false } & React.ComponentPropsWithoutRef<"td">)
  | ({ isHeader: true } & React.ComponentPropsWithoutRef<"th">);

export const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ isHeader, className = "", children, ...rest }, ref) => {
    const Comp = isHeader ? "th" : "td";
    // ให้ <th> มี scope="col" เป็นค่าเริ่มต้น (เปลี่ยน/ลบได้)
    const extra = isHeader ? { scope: (rest as any).scope ?? "col" } : {};
    return React.createElement(
      Comp,
      { ref, className, ...extra, ...(rest as any) },
      children
    );
  }
);
TableCell.displayName = "TableCell";

/* (ถ้าคุณอยาก import แบบ default ก็ export ค่าใดค่าหนึ่งเพิ่มได้)
   export default Table;
*/
