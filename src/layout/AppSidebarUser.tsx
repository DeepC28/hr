"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import { UserCircleIcon, HorizontaLDots } from "../icons/index";

export type IconLike =
  | string
  | React.ReactElement<any, any>
  | React.ComponentType<any>;

function cx(...args: Array<string | undefined | false>) {
  return args.filter(Boolean).join(" ");
}

export function IconRenderer({
  icon,
  className,
  alt = "",
  size = 20,
}: {
  icon: IconLike;
  className?: string;
  alt?: string;
  size?: number;
}) {
  if (typeof icon === "string") {
    return (
      <span
        aria-label={alt}
        className={cx("inline-block align-middle bg-current", className)}
        style={{
          width: size,
          height: size,
          WebkitMaskImage: `url(${icon})`,
          maskImage: `url(${icon})`,
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskSize: "contain",
          maskSize: "contain",
          WebkitMaskPosition: "center",
          maskPosition: "center",
        }}
      />
    );
  }

  if (React.isValidElement<any>(icon)) {
    const el = icon as React.ReactElement<any, any>;
    const mergedClass = cx((el.props as any)?.className, className);
    const mergedStyle: React.CSSProperties = {
      ...(el.props as any)?.style,
      width: size,
      height: size,
      color: "currentColor",
    };
    return React.cloneElement(el as any, {
      className: mergedClass,
      style: mergedStyle,
    } as any);
  }

  if (typeof icon === "function") {
    const Comp = icon as React.ComponentType<any>;
    return (
      <Comp
        className={className}
        style={{ width: size, height: size, color: "currentColor" }}
      />
    );
  }

  return null;
}

type NavItem = {
  name: string;
  icon: IconLike;
  path?: string;
};

const mainItems: NavItem[] = [
  {
    icon: UserCircleIcon,
    name: "ข้อมูลผู้ใช้",
    path: "/manage/profile",
  },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();

  const isActive = useCallback((path: string) => path === pathname, [pathname]);

  const renderMenuItems = (items: NavItem[]) => (
    <ul className="flex flex-col gap-4">
      {items.map((nav) => (
        <li key={nav.name}>
          {nav.path && (
            <Link
              href={nav.path}
              className={`menu-item group ${
                isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
              }`}
            >
              <span
                className={`${
                  isActive(nav.path)
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                }`}
              >
                <IconRenderer icon={nav.icon} size={20} />
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="menu-item-text">{nav.name}</span>
              )}
            </Link>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={`fixed flex flex-col top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link href="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <Image
                className="dark:hidden"
                src="/images/logo/logo.svg"
                alt="Logo"
                width={150}
                height={40}
              />
              <Image
                className="hidden dark:block"
                src="/images/logo/logo-dark.svg"
                alt="Logo"
                width={150}
                height={40}
              />
            </>
          ) : (
            <Image
              src="/images/logo/logo-icon.svg"
              alt="Logo"
              width={32}
              height={32}
            />
          )}
        </Link>
      </div>

      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <section>
            <h2
              className={`mb-3 text-xs uppercase flex leading-[20px] text-gray-400 ${
                !isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "justify-start"
              }`}
            >
              {isExpanded || isHovered || isMobileOpen ? (
                "เมนูหลัก"
              ) : (
                <IconRenderer icon={HorizontaLDots} size={18} />
              )}
            </h2>
            {renderMenuItems(mainItems)}
          </section>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
