// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  within,
} from "@testing-library/react";

// --- next/navigation mock -------------------------------------------------
const push = vi.fn();
const replace = vi.fn();
let mockPathname = "/";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace }),
  usePathname: () => mockPathname,
}));

// next/link renders a plain anchor in tests (the "INICIAR SESIÓN" link).
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string | { pathname?: string };
    children: React.ReactNode;
    [key: string]: unknown;
  }) =>
    React.createElement(
      "a",
      { href: typeof href === "string" ? href : "#", ...rest },
      children,
    ),
}));

// Ant Design's horizontal Menu renders submenu children inside hover-triggered
// popups (rc-trigger), which do not open under jsdom because they depend on real
// layout measurement. The behaviour under test in Requirements 1.1–1.4 is
// SiteHeader's *menu configuration* — the items tree, the onClick navigation
// wiring, and the selected keys — not Ant Design's popup engine. So we render
// the real `items`/`defaultSelectedKeys` the component passes to <Menu> via a
// lightweight stand-in that mounts the whole (nested) items tree eagerly.
//
// Limitation: this verifies the configuration SiteHeader declares, not Ant
// Design's runtime popup rendering (that is Ant Design's own concern).
type MockMenuItem = {
  key: string;
  label?: React.ReactNode;
  onClick?: () => void;
  children?: MockMenuItem[];
};

vi.mock("antd", () => {
  const renderItems = (
    items: MockMenuItem[],
    selectedKeys: string[],
  ): React.ReactElement =>
    React.createElement(
      "ul",
      null,
      items.map((item) =>
        React.createElement(
          "li",
          {
            key: item.key,
            "data-menu-key": item.key,
            "data-selected": selectedKeys.includes(item.key) ? "true" : "false",
          },
          React.createElement(
            "button",
            {
              type: "button",
              "data-menu-key": item.key,
              "data-selected": selectedKeys.includes(item.key)
                ? "true"
                : "false",
              onClick: item.onClick,
            },
            item.label,
          ),
          item.children ? renderItems(item.children, selectedKeys) : null,
        ),
      ),
    );

  return {
    Menu: ({
      items = [],
      defaultSelectedKeys = [],
    }: {
      items?: MockMenuItem[];
      defaultSelectedKeys?: string[];
    }) =>
      React.createElement(
        "nav",
        { "data-testid": "site-menu" },
        renderItems(items, defaultSelectedKeys),
      ),
  };
});

import SiteHeader from "../SiteHeader";

const toolsMenu = (container: HTMLElement): HTMLElement =>
  container.querySelector('li[data-menu-key="2"]') as HTMLElement;

beforeEach(() => {
  push.mockClear();
  replace.mockClear();
  mockPathname = "/";
});

afterEach(cleanup);

/**
 * Component tests for Site_Navigation (SiteHeader).
 *
 * The former "Data" and "Herramientas" menus are merged into a single
 * "Herramientas para cargadores" menu (key "2") holding Mercancía, Mejor Ruta,
 * and Organizador de carga.
 */
describe("SiteHeader — Herramientas para cargadores menu", () => {
  it("shows the single 'Herramientas para cargadores' menu with all three tools", () => {
    const { container } = render(<SiteHeader />);
    const tools = toolsMenu(container);
    expect(tools).not.toBeNull();
    expect(within(tools).getByText("Mercancía")).toBeTruthy();
    expect(within(tools).getByText("Mejor Ruta")).toBeTruthy();
    expect(within(tools).getByText("Organizador de carga")).toBeTruthy();
    // The old separate "Data" / "Herramientas" labels no longer exist.
    expect(screen.queryByText("Data")).toBeNull();
    expect(screen.getByText("Herramientas para cargadores")).toBeTruthy();
  });

  it("navigates to /mejor-ruta when the item is selected", () => {
    render(<SiteHeader />);
    fireEvent.click(screen.getByText("Mejor Ruta"));
    expect(push).toHaveBeenCalledWith("/mejor-ruta");
    expect(push).toHaveBeenCalledTimes(1);
  });

  it("navigates to /organizador-de-carga from the merged menu", () => {
    render(<SiteHeader />);
    fireEvent.click(screen.getByText("Organizador de carga"));
    expect(push).toHaveBeenCalledWith("/organizador-de-carga");
  });

  it("renders the tools menu and the Mejor Ruta item selected on /mejor-ruta", () => {
    mockPathname = "/mejor-ruta";
    const { container } = render(<SiteHeader />);
    expect(toolsMenu(container).getAttribute("data-selected")).toBe("true");
    const mejorRuta = within(toolsMenu(container)).getByText("Mejor Ruta");
    expect(mejorRuta.getAttribute("data-selected")).toBe("true");
  });

  it("renders the tools menu selected on /organizador-de-carga", () => {
    mockPathname = "/organizador-de-carga";
    const { container } = render(<SiteHeader />);
    expect(toolsMenu(container).getAttribute("data-selected")).toBe("true");
    const organizer = within(toolsMenu(container)).getByText(
      "Organizador de carga",
    );
    expect(organizer.getAttribute("data-selected")).toBe("true");
  });

  it("exposes exactly one entry per tool across the whole navigation", () => {
    render(<SiteHeader />);
    expect(screen.getAllByText("Mejor Ruta")).toHaveLength(1);
    expect(screen.getAllByText("Mercancía")).toHaveLength(1);
    expect(screen.getAllByText("Organizador de carga")).toHaveLength(1);
  });
});
