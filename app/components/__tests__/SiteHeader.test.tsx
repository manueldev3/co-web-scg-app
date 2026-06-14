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

const dataMenu = (container: HTMLElement): HTMLElement =>
  container.querySelector('li[data-menu-key="2"]') as HTMLElement;
const herramientasMenu = (container: HTMLElement): HTMLElement =>
  container.querySelector('li[data-menu-key="3"]') as HTMLElement;

beforeEach(() => {
  push.mockClear();
  replace.mockClear();
  mockPathname = "/";
});

afterEach(cleanup);

/**
 * Component tests for Site_Navigation (SiteHeader) — the Data menu entry.
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4
 */
describe("SiteHeader — Mejor Ruta in the Data menu", () => {
  it("shows 'Mejor Ruta' alongside 'Mercancía' under the Data menu (Req 1.1)", () => {
    const { container } = render(<SiteHeader />);
    const data = dataMenu(container);
    expect(data).not.toBeNull();
    expect(within(data).getByText("Mejor Ruta")).toBeTruthy();
    // Mercancía remains present in the same Data submenu.
    expect(within(data).getByText("Mercancía")).toBeTruthy();
  });

  it("navigates to /mejor-ruta when the item is selected (Req 1.2)", () => {
    render(<SiteHeader />);
    fireEvent.click(screen.getByText("Mejor Ruta"));
    expect(push).toHaveBeenCalledWith("/mejor-ruta");
    expect(push).toHaveBeenCalledTimes(1);
  });

  it("renders the Data menu and the Mejor Ruta item selected on /mejor-ruta (Req 1.3)", () => {
    mockPathname = "/mejor-ruta";
    const { container } = render(<SiteHeader />);
    // The Data submenu is in its selected state.
    expect(dataMenu(container).getAttribute("data-selected")).toBe("true");
    // The Mejor Ruta item itself is rendered selected.
    const mejorRuta = within(dataMenu(container)).getByText("Mejor Ruta");
    expect(mejorRuta.getAttribute("data-selected")).toBe("true");
  });

  it("keeps 'Mejor Ruta' under Data and never under Herramientas (Req 1.4)", () => {
    const { container } = render(<SiteHeader />);
    // Present under Data...
    expect(
      within(dataMenu(container)).queryByText("Mejor Ruta"),
    ).not.toBeNull();
    // ...and absent from Herramientas, which only offers the cargo organizer.
    const herramientas = herramientasMenu(container);
    expect(within(herramientas).queryByText("Mejor Ruta")).toBeNull();
    expect(within(herramientas).getByText("Organizador de carga")).toBeTruthy();
    // Exactly one "Mejor Ruta" entry exists across the whole navigation.
    expect(screen.getAllByText("Mejor Ruta")).toHaveLength(1);
  });
});
