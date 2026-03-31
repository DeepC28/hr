// src/app/verified-email/page.tsx
import Link from "next/link";

type VerifiedEmailPageProps = {
  searchParams: {
    status?: string;
  };
};

export default function VerifiedEmailPage({ searchParams }: VerifiedEmailPageProps) {
  const status = searchParams.status || "unknown";

  let title = "สถานะการยืนยันอีเมล";
  let message = "ไม่พบข้อมูลสถานะการยืนยันอีเมล";
  let isSuccess = false;

  switch (status) {
    case "success":
      title = "ยืนยันอีเมลสำเร็จแล้ว";
      message = "บัญชีของคุณถูกเปิดใช้งานเรียบร้อยแล้ว สามารถเข้าสู่ระบบได้เลย";
      isSuccess = true;
      break;
    case "invalid":
      title = "ลิงก์ยืนยันไม่ถูกต้อง";
      message = "ไม่พบ token ยืนยันหรืออาจถูกใช้ไปแล้ว กรุณาลองขอยืนยันอีเมลใหม่จากระบบ";
      break;
    case "expired":
      title = "ลิงก์ยืนยันหมดอายุ";
      message = "ลิงก์ยืนยันอีเมลนี้หมดอายุแล้ว กรุณาลองขอยืนยันอีเมลใหม่จากระบบ";
      break;
    case "missing":
      title = "ไม่พบข้อมูลยืนยัน";
      message = "ไม่พบ token สำหรับการยืนยันอีเมล กรุณาลองจากลิงก์ในอีเมลอีกครั้ง";
      break;
    case "error":
      title = "เกิดข้อผิดพลาด";
      message = "เกิดข้อผิดพลาดระหว่างการยืนยันอีเมล กรุณาลองใหม่ภายหลัง";
      break;
    default:
      title = "สถานะการยืนยันอีเมล";
      message = "ไม่พบข้อมูลสถานะการยืนยันอีเมล";
      break;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md rounded-lg bg-white dark:bg-gray-800 shadow p-6 text-center">
        <h1 className="text-2xl font-semibold mb-3 text-gray-900 dark:text-white">
          {title}
        </h1>
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-6">
          {message}
        </p>

        <div className="flex flex-col gap-3 items-center">
          {/* ปุ่มไปหน้า Sign In */}
          <Link
            href="/signin"
            className="inline-flex items-center justify-center rounded bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-sm font-medium transition"
          >
            ไปหน้าเข้าสู่ระบบ
          </Link>

          {/* กรณีไม่ success อาจบอก hint เล็กน้อย */}
          {!isSuccess && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              หากพบปัญหาในการเข้าสู่ระบบ กรุณาติดต่อผู้ดูแลระบบ
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
