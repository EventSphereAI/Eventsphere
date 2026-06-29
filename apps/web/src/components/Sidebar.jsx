"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";

import { sidebarConfig } from "@/config/sidebar";
import { useAuth } from "@/context/AuthContext";

export default function Sidebar({
  open,
  setOpen,
}) {
  const pathname = usePathname();

  const { user, tenant, logout } = useAuth();

  const sections = sidebarConfig[user?.role] || [];

  return (
    <>
  {open && (
    <div
      onClick={() => setOpen(false)}
      className="fixed inset-0 bg-black/40 z-40 md:hidden"
    />
  )}

  <aside
    className={`
      fixed
      md:relative
      top-0
      left-0
      h-screen
      w-[280px]
      bg-white
      border-r
      border-border
      flex
      flex-col
      z-50
      transform
      transition-transform
      duration-300

      ${
        open
          ? "translate-x-0"
          : "-translate-x-full md:translate-x-0"
      }
    `}
  >

      {/* ========================= */}
      {/* Logo */}
      {/* ========================= */}

      <div className="px-7 py-7 border-b border-border">

        <Image
          src="/logo-full.png"
          alt="EventSphere"
          width={180}
          height={55}
          priority
          className="object-contain"
        />

        <p className="mt-4 text-xs text-muted font-medium uppercase tracking-wider">
          {tenant?.name || "Organization"}
        </p>

      </div>

      {/* ========================= */}
      {/* Navigation */}
      {/* ========================= */}

      <div className="flex-1 overflow-y-auto px-5 py-6">

        {sections.map((section) => (

          <div
            key={section.section}
            className="mb-8"
          >

            <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">

              {section.section}

            </p>

            <div className="space-y-1">

              {section.items.map((item) => {

                const Icon = item.icon;

                const active =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/");

                return (

                  <Link
    key={item.href}
    href={item.href}
    onClick={() => setOpen(false)}
                    className={`
                      flex
                      items-center
                      gap-3
                      rounded-xl
                      px-4
                      py-3
                      transition-all
                      duration-200

                      ${
                        active
                          ? "bg-gradient-to-r from-cyan-50 to-green-50 text-primary font-semibold shadow-soft"
                          : "text-gray-600 hover:bg-secondary hover:text-text"
                      }
                    `}
                  >

                    <Icon size={20} />

                    <span>

                      {item.title}

                    </span>

                  </Link>

                );

              })}

            </div>

          </div>

        ))}

      </div>

      {/* ========================= */}
      {/* Bottom */}
      {/* ========================= */}

      <div className="border-t border-border p-5">

        <div className="flex items-center gap-3 mb-5">

          <div className="w-11 h-11 rounded-full bg-gradient-to-r from-primary to-success flex items-center justify-center text-white font-bold">

            {user?.email?.charAt(0).toUpperCase()}

          </div>

          <div>

            <p className="font-semibold text-sm text-text">

              {user?.name || user?.email}

            </p>

            <p className="text-xs capitalize text-muted">

              {user?.role?.replaceAll("_", " ")}

            </p>

          </div>

        </div>

        <button
          onClick={logout}
          className="
            w-full
            flex
            items-center
            gap-3
            rounded-xl
            px-4
            py-3
            text-red-600
            hover:bg-red-50
            transition
          "
        >

          <LogOut size={18} />

          Logout

        </button>

      </div>

    </aside>
    </>
  );
}