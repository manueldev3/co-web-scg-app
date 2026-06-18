// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

// --- next/navigation mock -------------------------------------------------
// HomeWikiSection navigates imperatively with useRouter().push on submit.
const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

// next/link renders a plain anchor in tests; avoids needing the App Router
// context for the "Explorar la wiki" shortcut link.
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

// Ant Design icons are decorative; stub the ones used by HomeWikiSection and by
// the Home page (for the coexistence render) with a lightweight span.
vi.mock("@ant-design/icons", () => {
  const Icon = () => React.createElement("span", { "aria-hidden": "true" });
  return {
    BookOutlined: Icon,
    LineChartOutlined: Icon,
    NodeIndexOutlined: Icon,
    ContainerOutlined: Icon,
    RocketOutlined: Icon,
    SafetyCertificateOutlined: Icon,
    ThunderboltOutlined: Icon,
  };
});

// Ant Design's Input.Search relies on rc-input + popups that need real layout
// measurement and do not behave under jsdom. The behaviour under test
// (Req 7.3, 7.4) is HomeWikiSection's own wiring: the controlled value, the
// onChange that tracks the typed text, and the onSearch that triggers
// navigation. So we render a faithful stand-in: a text input wired to the same
// `value`/`onChange`, plus a submit button that invokes `onSearch` with the
// current value. The page hero/tools use <Button> (with optional href), so we
// provide a minimal Button too. This verifies the configuration HomeWikiSection
// declares, not Ant Design's own input internals.
vi.mock("antd", () => ({
  Input: {
    Search: ({
      value,
      onChange,
      onSearch,
      placeholder,
      enterButton,
    }: {
      value?: string;
      onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
      onSearch?: (value: string) => void;
      placeholder?: string;
      enterButton?: React.ReactNode;
    }) =>
      React.createElement(
        "div",
        null,
        React.createElement("input", {
          type: "text",
          "aria-label": "Buscar en la wiki",
          placeholder,
          value,
          onChange,
        }),
        React.createElement(
          "button",
          {
            type: "button",
            onClick: () => onSearch?.(value ?? ""),
          },
          typeof enterButton === "string" ? enterButton : "Buscar",
        ),
      ),
  },
  Button: ({
    href,
    children,
    onClick,
  }: {
    href?: string;
    children?: React.ReactNode;
    onClick?: () => void;
    [key: string]: unknown;
  }) =>
    href
      ? React.createElement("a", { href }, children)
      : React.createElement("button", { type: "button", onClick }, children),
}));

import HomeWikiSection from "../HomeWikiSection";

beforeEach(() => {
  push.mockClear();
});

afterEach(cleanup);

/**
 * Component tests for the Home_Wiki_Section (HomeWikiSection).
 * Validates: Requirements 7.1, 7.2, 7.3, 7.5
 *
 * Req 7.4 (navigation carries the typed text) is exercised here too, because
 * it shares the same search control as Req 7.3 and is what proves the search
 * field "dirige a la persona usuaria hacia la wiki" with the entered text.
 */
describe("HomeWikiSection — content and search wiring", () => {
  it("renders a title and a description identifying the wiki (Req 7.2)", () => {
    render(<HomeWikiSection />);

    // Title: identifies the section as the universe wiki.
    const title = screen.getByRole("heading", { name: "Wiki del universo" });
    expect(title).toBeTruthy();

    // Description: references it as a space of reference information about the
    // Star Citizen universe.
    const description = screen.getByText(/universo de Star Citizen/i);
    expect(description).toBeTruthy();
  });

  it("includes a search field that points users toward the wiki (Req 7.3)", () => {
    render(<HomeWikiSection />);

    const input = screen.getByLabelText("Buscar en la wiki");
    expect(input).toBeTruthy();
    expect(input.getAttribute("placeholder")).toBe(
      "Busca una nave en la wiki...",
    );
    // A submit affordance to launch the search.
    expect(screen.getByText("Buscar")).toBeTruthy();
  });

  it("navigates to the wiki carrying the typed search text (Req 7.4)", () => {
    render(<HomeWikiSection />);

    const input = screen.getByLabelText(
      "Buscar en la wiki",
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "aurora" } });
    fireEvent.click(screen.getByText("Buscar"));

    expect(push).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith("/wiki?q=aurora");
  });

  it("encodes search text with spaces and symbols when navigating (Req 7.4)", () => {
    render(<HomeWikiSection />);

    const input = screen.getByLabelText(
      "Buscar en la wiki",
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "anvil aurora & co" } });
    fireEvent.click(screen.getByText("Buscar"));

    // buildWikiSearchHref encodes the text into the `q` param; the route stays
    // /wiki so the text travels intact to the wiki.
    expect(push).toHaveBeenCalledWith(
      `/wiki?q=${encodeURIComponent("anvil aurora & co")}`,
    );
  });

  it("provides a direct shortcut link to the Wiki_Landing at /wiki (Req 7.5)", () => {
    render(<HomeWikiSection />);

    const link = screen.getByText("Explorar la wiki").closest("a");
    expect(link).not.toBeNull();
    expect(link?.getAttribute("href")).toBe("/wiki");
  });
});

/**
 * Page-level coexistence test (Req 7.1).
 *
 * The Home_Wiki_Section is *added* to app/page.tsx without removing or altering
 * the existing hero (with video), the tools sections, or the closing content.
 * We render the real Home page (mocking only the YouTube background, which
 * needs a browser, and the shared antd/icons/link stand-ins) and assert that
 * the hero and the tools sections still render alongside the new wiki section.
 *
 * The Global_Footer (Req 7.1's "footer") lives in the root layout, not in
 * page.tsx, so it is structurally untouched by this change and is covered by
 * SiteFooter's own tests.
 */
vi.mock("../YoutubeVideoBackground", () => ({
  default: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", { "data-testid": "hero-video" }, children),
}));

import Home from "../../page";

describe("Home page — wiki section coexists with existing content (Req 7.1)", () => {
  it("keeps the hero, the tools sections and adds the wiki section", () => {
    render(<Home />);

    // Hero (with video background) is preserved.
    expect(screen.getByTestId("hero-video")).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Comercio Lucrativo" }),
    ).toBeTruthy();

    // Tools sections are preserved.
    expect(
      screen.getByRole("heading", { name: "Herramientas para cargadores" }),
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Mercancía" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Mejor Ruta" })).toBeTruthy();

    // The new wiki section is present alongside them.
    expect(
      screen.getByRole("heading", { name: "Wiki del universo" }),
    ).toBeTruthy();
    expect(screen.getByText("Explorar la wiki").closest("a")).toBeTruthy();
  });
});
