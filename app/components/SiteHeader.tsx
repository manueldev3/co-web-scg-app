"use client";

import { Header } from "antd/es/layout/layout";
import Link from "next/link";
import { LoginOutlined } from "@ant-design/icons";
import { Menu } from "antd";

export default function SiteHeader() {
  return (
    <Header className="justify-between flex items-center p-4">
      <div className="flex items-center space-x-8">
        <span className="text-5xl font-bold text-[#BCBEC0]">SCG</span>
        <Menu
          className="min-w-2xl"
          theme="dark"
          mode="horizontal"
          defaultSelectedKeys={["1"]}
          items={[
            { key: "1", label: "Inicio" },
            // { key: "2", label: "Naves" },
            // { key: "3", label: "Comercio" },
          ]}
        />
      </div>
      <div className="flex items-center space-x-4">
        {/* <Button type="primary">Download APP</Button> */}
        <Link
          href="https://scg.manueldeveloper.com/app"
          className="flex space-x-2 items-center"
        >
          <LoginOutlined color="#82919E" />
          <span className="text-[#82919E] hover:text-[#BCBEC0] no-underline">
            INICIAR SESIÓN
          </span>
        </Link>
      </div>
    </Header>
  );
}
