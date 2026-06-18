// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, within } from "@testing-library/react";

import type { DetailSection, WikiDetail } from "../types";

// --- next/link mock -------------------------------------------------------
// next/link renders a plain anchor in tests so we can assert on `href` and on
// the back-to-listing control without pulling in the router runtime.
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

// --- registry mock --------------------------------------------------------
// The Detalle_Elemento page (Server Component) derives everything from the
// Registro_Categorias. We mock `getCategory` so we can drive the
// "no encontrado" branches (invalid/inactive category, missing element)
// without touching the real category adapters or the UEX client.
const getCategory = vi.fn();
vi.mock("../registry", () => ({
  getCategory: (id: string) => getCategory(id),
}));

import DetailView from "../[category]/[slug]/DetailView";
import WikiDetailPage from "../[category]/[slug]/page";

// --- section fixtures -----------------------------------------------------
// Helpers that build each Tipo_Bloque in the generalized `sections` shape.

function fieldsSection(
  overrides: Partial<Extract<DetailSection, { kind: "fields" }>> = {},
): Extract<DetailSection, { kind: "fields" }> {
  return {
    kind: "fields",
    label: "Ficha técnica",
    fields: [
      { label: "Capacidad de carga (SCU)", value: "0 SCU" },
      { label: "Tripulación", value: "Dato no disponible" },
      { label: "Tamaños de contenedor", value: ["1", "2", "4"] },
      { label: "Clasificaciones", value: ["Nave espacial", "Carga"] },
    ],
    ...overrides,
  };
}

function gallerySection(
  overrides: Partial<Extract<DetailSection, { kind: "gallery" }>> = {},
): Extract<DetailSection, { kind: "gallery" }> {
  return {
    kind: "gallery",
    mainImage: "https://cdn.example/aurora-main.jpg",
    images: [
      "https://cdn.example/aurora-1.jpg",
      "https://cdn.example/aurora-2.jpg",
    ],
    altBase: "Aurora MR",
    ...overrides,
  };
}

function pricesSection(
  overrides: Partial<Extract<DetailSection, { kind: "prices" }>> = {},
): Extract<DetailSection, { kind: "prices" }> {
  return {
    kind: "prices",
    operation: "buy",
    rows: [
      { locationName: "Port Olisar", price: 1_200_000 },
      { locationName: "Lorville", price: 1_250_000 },
    ],
    ...overrides,
  };
}

function linksSection(
  overrides: Partial<Extract<DetailSection, { kind: "links" }>> = {},
): Extract<DetailSection, { kind: "links" }> {
  return {
    kind: "links",
    links: [
      { type: "store", label: "Tienda", href: "https://store.example/aurora" },
      {
        type: "brochure",
        label: "Folleto",
        href: "https://brochure.example/aurora",
      },
    ],
    ...overrides,
  };
}

/** Builds a complete WikiDetail fixture in the generalized `sections` shape. */
function makeDetail(overrides: Partial<WikiDetail> = {}): WikiDetail {
  return {
    categoryId: "naves",
    title: "Aurora MR",
    subtitle: "Roberts Space Industries",
    sections: [fieldsSection()],
    ...overrides,
  };
}

beforeEach(() => {
  getCategory.mockReset();
});

afterEach(cleanup);

/**
 * Component tests for the Detalle_Elemento (task 7.2).
 *
 * Verifies the generalized section model: the header is preserved, sections
 * render in order, and each `kind` is dispatched to its sub-renderer
 * (Bloque_Galeria, Bloque_Precios, Bloque_Enlaces, Bloque_Grupo_Campos).
 *
 * These are example-based rendering assertions, not property-based tests.
 *
 * Validates: Requirements 1.3, 1.4, 1.5, 1.6, 1.7, 3.1, 3.5, 4.2, 4.3, 4.9,
 * 5.2, 5.3
 */
describe("DetailView — encabezado y navegación", () => {
  it("renders the title and subtitle (Req 1.6)", () => {
    render(<DetailView detail={makeDetail()} />);

    expect(screen.getByRole("heading", { name: "Aurora MR" })).toBeTruthy();
    expect(screen.getByText("Roberts Space Industries")).toBeTruthy();
  });

  it("offers a back-to-listing control linking to the category listing (Req 1.7)", () => {
    render(<DetailView detail={makeDetail({ categoryId: "naves" })} />);

    const back = screen.getByRole("link", { name: /volver al listado/i });
    expect(back.getAttribute("href")).toBe("/wiki/naves");
  });
});

describe("DetailView — orden y despacho por kind (Req 1.3, 1.4, 1.5)", () => {
  it("renders sections in the order they appear in the array (Req 1.3)", () => {
    const { container } = render(
      <DetailView
        detail={makeDetail({
          // Deliberately non-canonical order to prove the view honors the array.
          sections: [
            gallerySection(),
            fieldsSection(),
            pricesSection({ operation: "buy" }),
            linksSection(),
          ],
        })}
      />,
    );

    const headings = Array.from(container.querySelectorAll("h2")).map(
      (h) => h.textContent,
    );
    expect(headings).toEqual([
      "Galería",
      "Ficha técnica",
      "Comprar",
      "Enlaces oficiales",
    ]);
  });

  it("dispatches each kind to its matching sub-renderer (Req 1.4, 1.5)", () => {
    const { container } = render(
      <DetailView
        detail={makeDetail({
          sections: [
            gallerySection(),
            fieldsSection(),
            pricesSection(),
            linksSection(),
          ],
        })}
      />,
    );

    // gallery → <img>, fields → <dl>, prices → <table>, links → external <a>.
    expect(container.querySelector("img")).not.toBeNull();
    expect(container.querySelector("dl")).not.toBeNull();
    expect(container.querySelector("table")).not.toBeNull();
    expect(container.querySelector('a[target="_blank"]')).not.toBeNull();
  });

  it("renders only the sections provided, omitting the rest", () => {
    const { container } = render(
      <DetailView detail={makeDetail({ sections: [fieldsSection()] })} />,
    );

    expect(container.querySelector("dl")).not.toBeNull();
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("table")).toBeNull();
  });
});

describe("FieldsSection — Bloque_Grupo_Campos", () => {
  it("renders the group label and each field label/value", () => {
    render(<DetailView detail={makeDetail({ sections: [fieldsSection()] })} />);

    expect(screen.getByRole("heading", { name: "Ficha técnica" })).toBeTruthy();
    expect(screen.getByText("Capacidad de carga (SCU)")).toBeTruthy();
    // Zero formatted upstream is shown as-is, never the missing-data marker.
    expect(screen.getByText("0 SCU")).toBeTruthy();
    expect(screen.getByText("Tripulación")).toBeTruthy();
  });

  it("renders the missing-data marker value verbatim", () => {
    render(<DetailView detail={makeDetail({ sections: [fieldsSection()] })} />);

    expect(screen.getByText("Dato no disponible")).toBeTruthy();
  });

  it("renders array-valued fields (container sizes) as an ordered list", () => {
    const { container } = render(
      <DetailView
        detail={makeDetail({
          sections: [
            fieldsSection({
              fields: [
                { label: "Tamaños de contenedor", value: ["1", "2", "4", "8"] },
              ],
            }),
          ],
        })}
      />,
    );

    const list = container.querySelector("ol");
    expect(list).not.toBeNull();
    const items = within(list as HTMLElement).getAllByRole("listitem");
    expect(items.map((li) => li.textContent)).toEqual(["1", "2", "4", "8"]);
  });

  it("renders the active classifications inside the tech sheet", () => {
    render(
      <DetailView
        detail={makeDetail({
          sections: [
            fieldsSection({
              fields: [
                {
                  label: "Clasificaciones",
                  value: ["Nave espacial", "Carga", "Vehículo terrestre"],
                },
              ],
            }),
          ],
        })}
      />,
    );

    expect(screen.getByText("Nave espacial")).toBeTruthy();
    expect(screen.getByText("Carga")).toBeTruthy();
    expect(screen.getByText("Vehículo terrestre")).toBeTruthy();
  });
});

describe("GallerySection — Bloque_Galeria (Req 3.1, 3.5)", () => {
  it("renders the main image with alt derived from the ship name", () => {
    const { container } = render(
      <DetailView detail={makeDetail({ sections: [gallerySection()] })} />,
    );

    const main = container.querySelector(
      'img[src="https://cdn.example/aurora-main.jpg"]',
    ) as HTMLImageElement | null;
    expect(main).not.toBeNull();
    expect(main!.getAttribute("alt")).toBe("Aurora MR");
  });

  it("renders one img per additional image with alt derived from altBase", () => {
    const { container } = render(
      <DetailView detail={makeDetail({ sections: [gallerySection()] })} />,
    );

    const imgs = Array.from(
      container.querySelectorAll("img"),
    ) as HTMLImageElement[];
    // 1 main + 2 thumbnails.
    expect(imgs.length).toBe(3);
    const thumbAlts = imgs
      .map((img) => img.getAttribute("alt") ?? "")
      .filter((alt) => alt !== "Aurora MR");
    expect(thumbAlts).toEqual(["Aurora MR — imagen 1", "Aurora MR — imagen 2"]);
  });

  it("omits the main image when mainImage is null but renders thumbnails", () => {
    const { container } = render(
      <DetailView
        detail={makeDetail({
          sections: [
            gallerySection({
              mainImage: null,
              images: ["https://cdn.example/only-thumb.jpg"],
            }),
          ],
        })}
      />,
    );

    const imgs = Array.from(
      container.querySelectorAll("img"),
    ) as HTMLImageElement[];
    expect(imgs.length).toBe(1);
    expect(imgs[0].getAttribute("alt")).toBe("Aurora MR — imagen 1");
  });
});

describe("PricesSection — Bloque_Precios (Req 4.2, 4.3, 4.9)", () => {
  it("renders the 'Comprar' heading for a buy operation", () => {
    render(
      <DetailView
        detail={makeDetail({ sections: [pricesSection({ operation: "buy" })] })}
      />,
    );

    expect(screen.getByRole("heading", { name: "Comprar" })).toBeTruthy();
  });

  it("renders the 'Alquilar' heading for a rent operation", () => {
    render(
      <DetailView
        detail={makeDetail({
          sections: [pricesSection({ operation: "rent" })],
        })}
      />,
    );

    expect(screen.getByRole("heading", { name: "Alquilar" })).toBeTruthy();
  });

  it("renders one row per location with the amount in aUEC (Req 4.2, 4.9)", () => {
    const { container } = render(
      <DetailView
        detail={makeDetail({
          sections: [
            pricesSection({
              operation: "buy",
              rows: [
                { locationName: "Port Olisar", price: 1_200_000 },
                { locationName: "Lorville", price: 1_250_000 },
              ],
            }),
          ],
        })}
      />,
    );

    const bodyRows = container.querySelectorAll("tbody tr");
    expect(bodyRows.length).toBe(2);

    expect(screen.getByText("Port Olisar")).toBeTruthy();
    expect(screen.getByText("Lorville")).toBeTruthy();
    // Amount is expressed in aUEC, never real money.
    expect(
      screen.getByText(`${(1_200_000).toLocaleString("es")} aUEC`),
    ).toBeTruthy();
    expect(
      screen.getByText(`${(1_250_000).toLocaleString("es")} aUEC`),
    ).toBeTruthy();
  });
});

describe("LinksSection — Bloque_Enlaces (Req 5.2, 5.3)", () => {
  it("renders each link opening in a new tab with safe rel and a type label", () => {
    render(<DetailView detail={makeDetail({ sections: [linksSection()] })} />);

    const store = screen.getByRole("link", { name: "Tienda" });
    expect(store.getAttribute("href")).toBe("https://store.example/aurora");
    expect(store.getAttribute("target")).toBe("_blank");
    expect(store.getAttribute("rel")).toBe("noopener noreferrer");

    const brochure = screen.getByRole("link", { name: "Folleto" });
    expect(brochure.getAttribute("href")).toBe(
      "https://brochure.example/aurora",
    );
    expect(brochure.getAttribute("target")).toBe("_blank");
    expect(brochure.getAttribute("rel")).toBe("noopener noreferrer");
  });
});

describe("WikiDetailPage — estado 'no encontrado' (Req 7.1)", () => {
  const renderPage = async (category: string, slug: string) => {
    const ui = await WikiDetailPage({
      params: Promise.resolve({ category, slug }),
    });
    render(ui);
  };

  it("shows the not-found state when the category does not exist", async () => {
    getCategory.mockReturnValue(undefined);

    await renderPage("inexistente", "lo-que-sea");

    expect(getCategory).toHaveBeenCalledWith("inexistente");
    expect(
      screen.getByText("No se encontró el elemento solicitado"),
    ).toBeTruthy();
  });

  it("shows the not-found state when the category is inactive (coming_soon)", async () => {
    const loadDetail = vi.fn();
    getCategory.mockReturnValue({
      id: "armas",
      label: "Armas",
      status: "coming_soon",
      loadDetail,
    });

    await renderPage("armas", "lo-que-sea");

    expect(
      screen.getByText("No se encontró el elemento solicitado"),
    ).toBeTruthy();
    // An inactive category must not attempt to load any detail.
    expect(loadDetail).not.toHaveBeenCalled();
  });

  it("shows the not-found state when the element does not exist (loadDetail → null)", async () => {
    const loadDetail = vi.fn().mockResolvedValue(null);
    getCategory.mockReturnValue({
      id: "naves",
      label: "Naves",
      status: "active",
      loadDetail,
    });

    await renderPage("naves", "nave-inexistente");

    expect(loadDetail).toHaveBeenCalledWith("nave-inexistente");
    expect(
      screen.getByText("No se encontró el elemento solicitado"),
    ).toBeTruthy();
  });

  it("renders the detail (not the not-found state) for an existing element", async () => {
    const loadDetail = vi.fn().mockResolvedValue(makeDetail());
    getCategory.mockReturnValue({
      id: "naves",
      label: "Naves",
      status: "active",
      loadDetail,
    });

    await renderPage("naves", "aurora-mr");

    expect(loadDetail).toHaveBeenCalledWith("aurora-mr");
    expect(screen.getByRole("heading", { name: "Aurora MR" })).toBeTruthy();
    expect(
      screen.queryByText("No se encontró el elemento solicitado"),
    ).toBeNull();
  });
});
