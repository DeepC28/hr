import React, { ReactNode, forwardRef } from "react";

// ใช้ native attributes ของ <button> ให้ครบ แล้วป้องกันชื่อชนกับ size/color
export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "size" | "color"> {
  size?: "sm" | "md";
  variant?: "primary" | "outline";
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  /** alias ของ native `type` เพื่อให้โค้ดเดิมที่ใช้ htmlType ทำงานได้ */
  htmlType?: NonNullable<
    React.ButtonHTMLAttributes<HTMLButtonElement>["type"]
  >;
  /** แสดงสถานะโหลด (จะ disable ปุ่มให้อัตโนมัติ) */
  loading?: boolean;
  className?: string;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    children,
    size = "md",
    variant = "primary",
    startIcon,
    endIcon,
    className = "",
    disabled,
    loading = false,
    htmlType,
    type, // native type
    ...rest
  },
  ref
) {
  // ตัดสินใจชนิดของปุ่ม: ให้ htmlType มาก่อน จากนั้นค่อย type และสุดท้าย default เป็น 'button'
  const resolvedType =
    htmlType ?? (type as ButtonProps["htmlType"]) ?? "button";

  const sizeClasses =
    size === "sm" ? "px-4 py-3 text-sm" : "px-5 py-3.5 text-sm";

  const variantClasses =
    variant === "outline"
      ? "bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/[0.03] dark:hover:text-gray-300"
      : "bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600 disabled:bg-brand-300";

  return (
    <button
      ref={ref}
      type={resolvedType}
      className={`inline-flex items-center justify-center font-medium gap-2 rounded-lg transition ${sizeClasses} ${variantClasses} ${
        disabled || loading ? "cursor-not-allowed opacity-50" : ""
      } ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {startIcon && <span className="flex items-center">{startIcon}</span>}
      {children}
      {endIcon && <span className="flex items-center">{endIcon}</span>}
    </button>
  );
});

export default Button;
