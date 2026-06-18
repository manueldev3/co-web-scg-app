// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  within,
} from "@testing-library/react";

// --- next/link mock -------------------------------------------------------
// next/link renders a plain anchor in tests; avoids needing the App Router
// context and lets us assert on real `href` attributes.
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

// --- @ant-design/icons mock ----------------------------------------------
// Icons are inert in tests; render identifiable spans. The Buscador_Wiki uses
// SearchOutlined; CategoryCards resolves a per-category icon client-side
// (RocketOutlined for "naves", AppstoreOutlined as the default fallback used by
// the "coming_soon" sample category). We expose each as a tagged span so the
// landing can assert that every category card shows an icon (Req 2.2).
vi.mock("@ant-design/icons", () => ({
  SearchOutlined: () =>
    React.createElement("span", { "data-testid": "search-icon" }),
  RocketOutlined: () =>
    React.createElement("span", { "data-testid": "icon-naves" }),
  AppstoreOutlined: () =>
    React.createElement("span", { "data-testid": "icon-default" }),
}));

// --- antd mock ------------------------------------------------------------
// Ant Design's Tooltip renders its title inside an rc-trigger popup that does
// NOT open under jsdom (it needs real layout measurement). The behaviour under
// test (Req 2.6) is that the disabled category card is wrapped by a tooltip
// announcing "Próximamente" — i.e. SiteHeader/landing *configuration* — not Ant
// Design's popup engine. So we expose the tooltip title as a data attribute on
// a wrapper element. Likewise, Ant Design's Input relies on browser APIs jsdom
// lacks; we render a plain controlled <input> forwarding value/onChange so the
// search interaction (Req 2.4, 6.5) runs deterministically.
vi.mock("antd", () => ({
  Tooltip: ({
    title,
    children,
  }: {
    title?: React.ReactNode;
    children?: React.ReactNode;
  }) =>
    React.createElement(
      "div",
      {
        "data-testid": "tooltip",
        "data-title": typeof title === "string" ? title : "",
      },
      children,
    ),
  Input: ({
    value,
    onChange,
    placeholder,
    "aria-label": ariaLabel,
  }: {
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    "aria-label"?: string;
    [key: string]: unknown;
  }) =>
    React.createElement("input", {
      value: value ?? "",
      onChange,
      placeholder,
      "aria-label": ariaLabel,
    }),
}));

// --- registry mock --------------------------------------------------------
// The landing is generic: it derives its cards from the Registro_Categorias.
// We provide a controlled registry with one active category ("naves") and one
// "coming_soon" category ("armas") so we can exercise BOTH branches (linkable
// active card vs. disabled card with tooltip) without hitting the network. The
// selectors mirror the real pure implementations operating on this fake list.
// Icons are NO LONGER part of the registry: CategoryCards resolves them
// client-side from the category id (see the @ant-design/icons mock above).
vi.mock("../registry", () => {
  const cats = [
    {
      id: "naves",
      label: "Naves",
      status: "active",
      description: "Naves de Star Citizen.",
      loadItems: async () => [
        {
          id: 1,
          categoryId: "naves",
          name: "Aurora MR",
          slug: "aurora-mr",
          subtitle: "RSI",
        },
      ],
      loadDetail: async () => null,
    },
    {
      id: "armas",
      label: "Armas",
      status: "coming_soon",
      description: "Armas (próximamente).",
      loadItems: async () => [],
      loadDetail: async () => null,
    },
  ];
  return {
    WIKI_CATEGORIES: cats,
    getCategory: (id: string) => cats.find((c) => c.id === id),
    getActiveCategories: (list: typeof cats) =>
      list.filter((c) => c.status === "active"),
    getLandingEntries: (list: typeof cats) =>
      list.map((c) => ({
        id: c.id,
        label: c.label,
        status: c.status,
        navigable: c.status === "active",
      })),
  };
});

import WikiLandingPage from "../page";
import WikiSearch from "../WikiSearch";
import type { WikiSearchResult } from "../types";

afterEach(cleanup);

/**
 * Component tests for the Wiki_Landing and the Buscador_Wiki (task 7.3).
 * Validates: Requirements 2.2, 2.3, 2.4, 2.6, 6.5
 *
 * These are example-based rendering assertions, not property-based tests.
 *
 * `WikiLandingPage` is an async Server Component, so we resolve it (awaiting the
 * returned tree) and then render the produced element with Testing Library.
 */
describe("Wiki_Landing — category cards + search presence", () => {
  const renderLanding = async (q?: string) => {
    const ui = await WikiLandingPage({
      searchParams: Promise.resolve(q === undefined ? {} : { q }),
    });
    return render(ui);
  };

  it("renders exactly one card per category, showing each label and icon (Req 2.2)", async () => {
    const { container } = await renderLanding();

    // One <li> per category entry derived from the registry (naves + armas).
    const cards = container.querySelectorAll("li");
    expect(cards).toHaveLength(2);

    // Each category's visible name and icon are present. "naves" uses the
    // RocketOutlined icon; the "coming_soon" sample falls back to the default.
    expect(screen.getByText("Naves")).toBeTruthy();
    expect(screen.getByText("Armas")).toBeTruthy();
    expect(screen.getByTestId("icon-naves")).toBeTruthy();
    expect(screen.getByTestId("icon-default")).toBeTruthy();
  });

  it("renders an active category as a link to its Listado_Categoria (Req 2.3)", async () => {
    await renderLanding();

    const link = screen.getByText("Naves").closest("a");
    expect(link).not.toBeNull();
    expect(link?.getAttribute("href")).toBe("/wiki/naves");
  });

  it("renders a coming_soon category disabled, with a tooltip and no navigation link (Req 2.6)", async () => {
    await renderLanding();

    // The disabled category is NOT wrapped in a navigation link.
    expect(screen.getByText("Armas").closest("a")).toBeNull();

    // It is wrapped by a tooltip announcing "Próximamente".
    const tooltip = screen.getByTestId("tooltip");
    expect(tooltip.getAttribute("data-title")).toBe("Próximamente");

    // The card itself is marked disabled and surfaces the "Próximamente" badge.
    const card = within(tooltip).getByText("Armas").closest("[aria-disabled]");
    expect(card).not.toBeNull();
    expect(card?.getAttribute("aria-disabled")).toBe("true");
    expect(within(tooltip).getByText("Próximamente")).toBeTruthy();
  });

  it("shows the Buscador_Wiki on the landing page itself (Req 2.4)", async () => {
    await renderLanding();

    // The search input rendered by <WikiSearch /> is present on the landing.
    expect(screen.getByLabelText("Buscar en la wiki")).toBeTruthy();
  });
});

describe("Buscador_Wiki — results and empty/no-results states", () => {
  const items: WikiSearchResult[] = [
    {
      name: "Aurora MR",
      categoryId: "naves",
      categoryLabel: "Naves",
      slug: "aurora-mr",
      href: "/wiki/naves/aurora-mr",
    },
    {
      name: "Cutlass Black",
      categoryId: "naves",
      categoryLabel: "Naves",
      slug: "cutlass-black",
      href: "/wiki/naves/cutlass-black",
    },
  ];

  it("renders the search field", () => {
    render(<WikiSearch items={items} />);
    expect(screen.getByLabelText("Buscar en la wiki")).toBeTruthy();
  });

  it("shows no results while the search field is empty (Req 6.6)", () => {
    render(<WikiSearch items={items} />);
    // No result links and no "no results" message while the query is empty.
    expect(screen.queryByText("Aurora MR")).toBeNull();
    expect(screen.queryByText("Cutlass Black")).toBeNull();
    expect(screen.queryByText("Sin resultados")).toBeNull();
  });

  it("lists matching results with name + category, linking to the detail (Req 6.3, 6.4)", () => {
    render(<WikiSearch items={items} />);

    fireEvent.change(screen.getByLabelText("Buscar en la wiki"), {
      target: { value: "aurora" },
    });

    const result = screen.getByText("Aurora MR");
    expect(result).toBeTruthy();
    // Category label shown alongside the result name.
    expect(screen.getByText("Naves")).toBeTruthy();
    // Result links to the element detail at /wiki/{categoryId}/{slug}.
    expect(result.closest("a")?.getAttribute("href")).toBe(
      "/wiki/naves/aurora-mr",
    );
    // The non-matching item is excluded.
    expect(screen.queryByText("Cutlass Black")).toBeNull();
  });

  it("matches case-insensitively (Req 6.2)", () => {
    render(<WikiSearch items={items} />);

    fireEvent.change(screen.getByLabelText("Buscar en la wiki"), {
      target: { value: "CUTLASS" },
    });

    expect(screen.getByText("Cutlass Black")).toBeTruthy();
    expect(screen.queryByText("Aurora MR")).toBeNull();
  });

  it("shows the 'sin resultados' message when nothing matches (Req 6.5)", () => {
    render(<WikiSearch items={items} />);

    fireEvent.change(screen.getByLabelText("Buscar en la wiki"), {
      target: { value: "no-such-ship" },
    });

    expect(screen.getByText("Sin resultados")).toBeTruthy();
    expect(screen.queryByText("Aurora MR")).toBeNull();
    expect(screen.queryByText("Cutlass Black")).toBeNull();
  });

  it("preloads results from initialQuery (the ?q= text from the Home)", () => {
    render(<WikiSearch items={items} initialQuery="cutlass" />);

    // Results appear immediately without any typing.
    expect(screen.getByText("Cutlass Black")).toBeTruthy();
    expect(screen.queryByText("Aurora MR")).toBeNull();
  });
});
