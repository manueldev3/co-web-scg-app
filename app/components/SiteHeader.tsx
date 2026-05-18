"use client";

import { useEffect, useState } from "react";
import { Header } from "antd/es/layout/layout";
import Link from "next/link";
import { LoginOutlined } from "@ant-design/icons";
import { Menu } from "antd";

export default function SiteHeader() {
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

  return (
    <Header className="justify-between flex items-center p-4">
      <div className="flex items-center space-x-8">
        <span className="text-5xl font-bold text-[#BCBEC0]">SCG</span>
        <Menu
          className="invisible lg:visible lg:min-w-2xl"
          theme="dark"
          mode="horizontal"
          defaultSelectedKeys={["1"]}
          items={[{ key: "1", label: "Inicio" }]}
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
