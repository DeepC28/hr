"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
// import SidebarWidget from "./SidebarWidget";
import {
  BoxCubeIcon,
  ChevronDownIcon,
  GridIcon,
  HorizontaLDots,
  UserIcon,
  TableIcon,
  UserCircleIcon,
  PlugInIcon,
} from "../icons/index";

/** -----------------------------------------
 * IconRenderer
 * ----------------------------------------*/
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
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

/** ========= เมนูแบบใหม่ =========
 * 1) เมนูหลัก: “บุคคล” เป็นลิงก์เดียวไป /person (รายละเอียดย่อยอยู่ใน /person/[id] เป็นแท็บ)
 * 2) ผู้ดูแลระบบ: รวม reference เป็นหน้าเดียว /refs และฟิลด์เสริมเป็น /custom-fields
 * 3) เมนูระบบ: รวมงานสิทธิ์เป็น “การกำหนดสิทธิ์”
 */

// 1) เมนูหลัก
const mainItems: NavItem[] = [
  {
    icon: UserCircleIcon,
    name: "ข้อมูลผู้ใช้",
    path: "/manage/profile",
  },
  {
    icon: UserIcon,
    name: "บุคคล",
    path: "/manage/person", // ไม่มี subItems แล้ว
  },
];

// 2) ผู้ดูแลระบบ (มาสเตอร์)
const adminItems: NavItem[] = [
  {
    icon: GridIcon,
    name: "โครงสร้างองค์กร",
    subItems: [
      { name: "หน่วยงาน", path: "/manage/department" },
      { name: "มหาวิทยาลัย", path: "/manage/university" },
    ],
  },
  {
    icon: TableIcon,
    name: "ข้อมูลอ้างอิง (ทั้งหมด)",
    subItems: [{ name: "จัดการข้อมูลอ้างอิง", path: "/manage/refs" }],
  },
  {
    icon: PlugInIcon,
    name: "ฟิลด์เสริม",
    subItems: [{ name: "ตั้งค่า/กำกับค่า", path: "/manage/custom-fields" }],
  },
];

// 3) เมนูระบบ
const systemItems: NavItem[] = [
  {
    icon: UserIcon,
    name: "ผู้ใช้งาน",
    path: "/manage/users",
  },
  {
    icon: BoxCubeIcon,
    name: "การกำหนดสิทธิ์",
    subItems: [
      { name: "บทบาท (Roles)", path: "/manage/roles" },
      { name: "สิทธิ์ (Permissions)", path: "/manage/permissions" },
      { name: "มอบบทบาทให้ผู้ใช้", path: "/manage/user-roles" },
    ],
  },
];

type MenuType = "main" | "admin" | "system";

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: MenuType;
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback((path: string) => path === pathname, [pathname]);

  useEffect(() => {
    let submenuMatched = false;
    (["main", "admin", "system"] as const).forEach((menuType) => {
      const items =
        menuType === "main"
          ? mainItems
          : menuType === "admin"
          ? adminItems
          : systemItems;

      items.forEach((nav, index) => {
        nav.subItems?.forEach((subItem) => {
          if (isActive(subItem.path)) {
            setOpenSubmenu({ type: menuType, index });
            submenuMatched = true;
          }
        });
      });
    });
    if (!submenuMatched) setOpenSubmenu(null);
  }, [pathname, isActive]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prev) => ({
          ...prev,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: MenuType) => {
    setOpenSubmenu((prev) =>
      prev && prev.type === menuType && prev.index === index
        ? null
        : { type: menuType, index }
    );
  };

  const renderMenuItems = (items: NavItem[], menuType: MenuType) => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group ${
                openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-active"
                  : "menu-item-inactive"
              } cursor-pointer ${
                !isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
              }`}
            >
              <span
                className={`${
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                }`}
              >
                <IconRenderer icon={nav.icon} size={20} />
              </span>

              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="menu-item-text">{nav.name}</span>
              )}

              {(isExpanded || isHovered || isMobileOpen) && (
                <IconRenderer
                  icon={ChevronDownIcon}
                  size={20}
                  className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                    openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                      ? "rotate-180 text-brand-500" 
                      : ""
                  }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
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
            )
          )}

          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType &&
                  openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      href={subItem.path}
                      className={`menu-dropdown-item ${
                        isActive(subItem.path)
                          ? "menu-dropdown-item-active"
                          : "menu-dropdown-item-inactive"
                      }`}
                    >
                      {subItem.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
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
          <div className="flex flex-col gap-6">
            {/* เมนูหลัก */}
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
              {renderMenuItems(mainItems, "main")}
            </section>

            {/* มาสเตอร์ (ผู้ดูแลระบบ) */}
            <section>
              <h2
                className={`mb-3 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "ผู้ดูแลระบบ (มาสเตอร์)"
                ) : (
                  <IconRenderer icon={HorizontaLDots} size={18} />
                )}
              </h2>
              {renderMenuItems(adminItems, "admin")}
            </section>

            {/* เมนูระบบ */}
            <section>
              <h2
                className={`mb-3 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "เมนูระบบ"
                ) : (
                  <IconRenderer icon={HorizontaLDots} size={18} />
                )}
              </h2>
              {renderMenuItems(systemItems, "system")}
            </section>
          </div>
        </nav>

        {/* {isExpanded || isHovered || isMobileOpen ? <SidebarWidget /> : null} */}
      </div>
    </aside>
  );
};

export default AppSidebar;
