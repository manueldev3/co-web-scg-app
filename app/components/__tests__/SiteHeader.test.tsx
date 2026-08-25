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
    // Drawer renders its children only when open (matches AntD's default
    // lazy behaviour), so the mobile menu does not duplicate the desktop one
    // while the drawer is closed.
    Drawer: ({
      open = false,
      children,
    }: {
      open?: boolean;
      children?: React.ReactNode;
    }) => (open ? React.createElement("div", null, children) : null),
    Button: ({
      icon,
      children,
      onClick,
      ...rest
    }: {
      icon?: React.ReactNode;
      children?: React.ReactNode;
      onClick?: () => void;
      [key: string]: unknown;
    }) =>
      React.createElement(
        "button",
        { type: "button", onClick, ...rest },
        icon,
        children,
      ),
  };
});

import SiteHeader from "../SiteHeader";

const toolsMenu = (container: HTMLElement): HTMLElement =>
  container.querySelector('li[data-menu-key="2"]') as HTMLElement;

const wikiMenu = (container: HTMLElement): HTMLElement =>
  container.querySelector('li[data-menu-key="3"]') as HTMLElement;

const inicioMenu = (container: HTMLElement): HTMLElement =>
  container.querySelector('li[data-menu-key="1"]') as HTMLElement;

// Top-level menu keys, in DOM order, of the (single) desktop navigation.
const topLevelKeys = (container: HTMLElement): string[] => {
  const nav = container.querySelector(
    '[data-testid="site-menu"]',
  ) as HTMLElement;
  const list = nav.querySelector(":scope > ul") as HTMLElement;
  return Array.from(list.querySelectorAll(":scope > li")).map(
    (li) => (li as HTMLElement).getAttribute("data-menu-key") ?? "",
  );
};

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

/**
 * Component tests for the Wiki navigation entry (Requirements 1.1–1.6).
 *
 * The Wiki entry is a top-level menu item (key "3", label "Wiki") that
 * navigates to /wiki and is selected whenever the active path lives under
 * /wiki. It coexists with the existing "Inicio" and "Herramientas para
 * cargadores" entries without reordering them.
 */
describe("SiteHeader — Wiki navigation entry", () => {
  it("shows a 'Wiki' entry in the main navigation (Req 1.1, 1.5)", () => {
    const { container } = render(<SiteHeader />);
    const wiki = wikiMenu(container);
    expect(wiki).not.toBeNull();
    expect(within(wiki).getByText("Wiki")).toBeTruthy();
  });

  it("navigates to /wiki when the 'Wiki' entry is selected (Req 1.2)", () => {
    render(<SiteHeader />);
    fireEvent.click(screen.getByText("Wiki"));
    expect(push).toHaveBeenCalledWith("/wiki");
    expect(push).toHaveBeenCalledTimes(1);
  });

  it("keeps the existing entries 'Inicio' and 'Herramientas para cargadores' in order (Req 1.4)", () => {
    const { container } = render(<SiteHeader />);
    // Existing entries are still present.
    expect(within(inicioMenu(container)).getByText("Inicio")).toBeTruthy();
    expect(
      within(toolsMenu(container)).getByText("Herramientas para cargadores"),
    ).toBeTruthy();
    // Order is preserved: Inicio (1), Herramientas (2), Wiki (3), Guías (4), Sobre nosotros (5), Contacto (6).
    expect(topLevelKeys(container)).toEqual(["1", "2", "3", "4", "5", "6"]);
  });

  it("marks the Wiki entry as selected on /wiki (Req 1.3)", () => {
    mockPathname = "/wiki";
    const { container } = render(<SiteHeader />);
    expect(wikiMenu(container).getAttribute("data-selected")).toBe("true");
    const wikiLabel = within(wikiMenu(container)).getByText("Wiki");
    expect(wikiLabel.getAttribute("data-selected")).toBe("true");
  });

  it("marks the Wiki entry as selected on a nested wiki path like /wiki/naves (Req 1.3)", () => {
    mockPathname = "/wiki/naves";
    const { container } = render(<SiteHeader />);
    expect(wikiMenu(container).getAttribute("data-selected")).toBe("true");
  });

  it("does not mark the Wiki entry as selected on the home path '/' (Req 1.3)", () => {
    mockPathname = "/";
    const { container } = render(<SiteHeader />);
    expect(wikiMenu(container).getAttribute("data-selected")).toBe("false");
    // Inicio is the selected entry on '/'.
    expect(inicioMenu(container).getAttribute("data-selected")).toBe("true");
  });

  it("exposes exactly one Wiki entry while the drawer is closed (Req 1.5)", () => {
    render(<SiteHeader />);
    expect(screen.getAllByText("Wiki")).toHaveLength(1);
  });

  it("shows the Wiki entry inside the drawer when it is opened (Req 1.6)", () => {
    render(<SiteHeader />);
    // Only the desktop menu's Wiki entry is present before opening the drawer.
    expect(screen.getAllByText("Wiki")).toHaveLength(1);
    // Open the mobile drawer via the hamburger trigger.
    fireEvent.click(screen.getByLabelText("Abrir menú"));
    // Now both the desktop and the drawer navigations expose a Wiki entry.
    expect(screen.getAllByText("Wiki")).toHaveLength(2);
  });

  it("navigates to /wiki from the drawer entry too (Req 1.2, 1.6)", () => {
    render(<SiteHeader />);
    fireEvent.click(screen.getByLabelText("Abrir menú"));
    const wikiEntries = screen.getAllByText("Wiki");
    // Click the drawer entry (the second one mounted).
    fireEvent.click(wikiEntries[wikiEntries.length - 1]);
    expect(push).toHaveBeenCalledWith("/wiki");
  });
});
