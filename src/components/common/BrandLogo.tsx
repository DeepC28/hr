import Image from "next/image";
import Link from "next/link";
import React from "react";

export default function BrandLogo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" aria-label="Home" className={`flex items-center ${className}`}>
      {/* เปลี่ยน path ให้ตรงโฟลเดอร์โลโก้ของคุณได้ */}
      <Image
        width={154}
        height={32}
        className="dark:hidden"
        src="/images/logo/logo.svg"
        alt="Logo"
        priority
      />
      <Image
        width={154}
        height={32}
        className="hidden dark:block"
        src="/images/logo/logo-dark.svg"
        alt="Logo"
        priority
      />
    </Link>
  );
}
