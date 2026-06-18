"use client";

import { useState } from "react";
import { Header } from "antd/es/layout/layout";
import { MenuOutlined } from "@ant-design/icons";
import { Button, Drawer, Menu } from "antd";
import type { MenuProps } from "antd";
import { usePathname, useRouter } from "next/navigation";

export default function SiteHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const activePath = (path: string): boolean => {
    return pathname === `/${path}`;
  };

  // Navigate and (on the mobile drawer) close it afterwards.
  const go = (path: string, replace = false) => {
    if (replace) {
      router.replace(path);
    } else {
      router.push(path);
    }
    setOpen(false);
  };

  const selectedKeys = pathname.startsWith("/wiki")
    ? ["3"]
    : activePath("")
      ? ["1"]
      : activePath("mercancia")
        ? ["2", "2-1"]
        : activePath("mejor-ruta")
          ? ["2", "2-2"]
          : activePath("organizador-de-carga")
            ? ["2", "2-3"]
            : ["1"];

  const items: MenuProps["items"] = [
    {
      key: "1",
      label: "Inicio",
      onClick: () => go("/", true),
    },
    {
      key: "2",
      label: "Herramientas para cargadores",
      children: [
        {
          key: "2-1",
          label: "Mercancía",
          onClick: () => go("/mercancia"),
        },
        {
          key: "2-2",
          label: "Mejor Ruta",
          onClick: () => go("/mejor-ruta"),
        },
        {
          key: "2-3",
          label: "Organizador de carga",
          onClick: () => go("/organizador-de-carga"),
        },
      ],
    },
    {
      key: "3",
      label: "Wiki",
      onClick: () => go("/wiki"),
    },
  ];

  return (
    <Header className="sticky top-0 z-50 justify-between flex items-center p-4">
      <div className="flex items-center space-x-8">
        <span className="text-5xl font-bold text-[#BCBEC0]">SCG</span>

        {/*
          Breakpoint switch — only ONE navigation shows at a time:
          >= lg (1024px: tablet landscape / desktop) → horizontal menu.
          Wrapped in a plain div so Ant Design's own menu CSS can't override
          the Tailwind visibility utilities.
        */}
        <div className="hidden lg:block">
          <Menu
            className="lg:min-w-2xl"
            theme="dark"
            mode="horizontal"
            selectedKeys={selectedKeys}
            defaultSelectedKeys={selectedKeys}
            items={items}
            style={{ borderBottom: "none", background: "transparent" }}
          />
        </div>
      </div>

      {/* < lg (tablet portrait and phones) → hamburger trigger. */}
      <div className="lg:hidden">
        <Button
          type="text"
          aria-label="Abrir menú"
          className="text-[#BCBEC0]!"
          icon={<MenuOutlined className="text-2xl" />}
          onClick={() => setOpen(true)}
        />
      </div>

      {/* Navigation drawer opened by the hamburger. */}
      <Drawer
        title={<span className="text-2xl font-bold text-[#BCBEC0]">SCG</span>}
        placement="left"
        open={open}
        onClose={() => setOpen(false)}
        styles={{ body: { padding: 0 } }}
      >
        <Menu
          mode="inline"
          theme="dark"
          selectedKeys={selectedKeys}
          defaultSelectedKeys={selectedKeys}
          defaultOpenKeys={["2"]}
          items={items}
          style={{ borderInlineEnd: "none" }}
        />
      </Drawer>
    </Header>
  );
}
