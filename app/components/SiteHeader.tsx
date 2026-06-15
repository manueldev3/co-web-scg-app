"use client";

import { useEffect, useState } from "react";
import { Header } from "antd/es/layout/layout";
import Link from "next/link";
import { LoginOutlined } from "@ant-design/icons";
import { Menu } from "antd";
import { usePathname, useRouter } from "next/navigation";

export default function SiteHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth > 768);
    };

    // Set initial value
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const activePath = (path: string): boolean => {
    return pathname === `/${path}`;
  };

  return (
    <Header className="sticky top-0 z-50 justify-between flex items-center p-4">
      <div className="flex items-center space-x-8">
        <span className="text-5xl font-bold text-[#BCBEC0]">SCG</span>
        <Menu
          className="invisible lg:visible lg:min-w-2xl"
          theme="dark"
          mode="horizontal"
          defaultSelectedKeys={
            activePath("")
              ? ["1"]
              : activePath("mercancia")
                ? ["2", "2-1"]
                : activePath("mejor-ruta")
                  ? ["2", "2-2"]
                  : activePath("organizador-de-carga")
                    ? ["2", "2-3"]
                    : ["1"]
          }
          items={[
            {
              key: "1",
              label: "Inicio",
              onClick: () => router.replace("/"),
            },
            {
              key: "2",
              label: "Herramientas para cargadores",
              children: [
                {
                  key: "2-1",
                  label: "Mercancía",
                  onClick: () => router.push("/mercancia"),
                },
                {
                  key: "2-2",
                  label: "Mejor Ruta",
                  onClick: () => router.push("/mejor-ruta"),
                },
                {
                  key: "2-3",
                  label: "Organizador de carga",
                  onClick: () => router.push("/organizador-de-carga"),
                },
              ],
            },
          ]}
        />
      </div>
      <div className="flex items-center space-x-4">
        <Link
          href="https://scg.manueldeveloper.com/app"
          className="flex space-x-2 items-center"
        >
          <LoginOutlined color="#82919E" />
          {isDesktop && (
            <span className="text-[#82919E] hover:text-[#BCBEC0] no-underline">
              INICIAR SESIÓN
            </span>
          )}
        </Link>
      </div>
    </Header>
  );
}
