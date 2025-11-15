import React, { forwardRef } from "react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** แสดงสถานะสำเร็จ */
  success?: boolean;
  /** แสดงสถานะผิดพลาด */
  error?: boolean;
  /** ข้อความช่วยเหลือใต้ช่อง */
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      type = "text",
      className = "",
      disabled = false,
      success = false,
      error = false,
      hint,
      ...rest
    },
    ref
  ) => {
    // สร้างคลาสพื้นฐาน
    let inputClasses =
      "h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-none focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800";

    // สถานะต่าง ๆ
    if (disabled) {
      inputClasses +=
        " text-gray-500 border-gray-300 cursor-not-allowed dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700";
    } else if (error) {
      inputClasses +=
        " text-error-800 border-error-500 focus:ring-error-500/10 dark:text-error-400 dark:border-error-500";
    } else if (success) {
      inputClasses +=
        " text-success-600 border-success-400 focus:ring-success-500/10 focus:border-success-300 dark:text-success-400 dark:border-success-500";
    } else {
      inputClasses +=
        " bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800";
    }

    if (className) inputClasses += ` ${className}`;

    return (
      <div className="relative">
        <input
          ref={ref}
          type={type}
          disabled={disabled}
          aria-invalid={error || undefined}
          className={inputClasses}
          {...rest} // รองรับ value, defaultValue, onChange, min, max, step, name, id, placeholder ฯลฯ
        />

        {hint && (
          <p
            className={`mt-1.5 text-xs ${
              error
                ? "text-error-500"
                : success
                ? "text-success-500"
                : "text-gray-500"
            }`}
          >
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
