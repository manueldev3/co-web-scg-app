"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "antd";
import {
  BookOutlined,
  AppstoreOutlined,
  LogoutOutlined,
  HomeOutlined,
} from "@ant-design/icons";
import { useAuth } from "@/lib/firebase/auth-context";
import AdminGuard from "../components/AdminGuard";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: <HomeOutlined /> },
  { href: "/admin/guias", label: "Guías", icon: <BookOutlined /> },
  { href: "/admin/categorias", label: "Categorías", icon: <AppstoreOutlined /> },
];

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, signOut } = useAuth();
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <AdminGuard>
      <div className="min-h-screen bg-[#040d16] flex">
        {/* Sidebar */}
        <aside className="w-64 shrink-0 border-r border-[#1e4a6e] bg-[#0a1929] flex flex-col">
          {/* Brand */}
          <div className="p-4 border-b border-[#1e4a6e]">
            <Link href="/admin" className="no-underline">
              <h1 className="text-lg font-bold text-[#9ED0FA]">SCG Admin</h1>
            </Link>
            <p className="text-xs text-gray-400 mt-0.5 truncate">
              {user?.email}
            </p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm no-underline transition-colors ${
                  isActive(item.href)
                    ? "bg-[#143A52] text-[#9ED0FA] font-medium"
                    : "text-gray-300 hover:bg-[#0f2c3e] hover:text-white"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-3 border-t border-[#1e4a6e] space-y-2">
            <Link
              href="/"
              className="flex items-center gap-2 px-3 py-2 text-xs text-gray-400 no-underline hover:text-white transition-colors"
            >
              ← Volver al sitio
            </Link>
            <Button
              type="text"
              icon={<LogoutOutlined />}
              onClick={signOut}
              className="w-full text-left text-gray-400! hover:text-red-400!"
              size="small"
            >
              Cerrar sesión
            </Button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </AdminGuard>
  );
}
