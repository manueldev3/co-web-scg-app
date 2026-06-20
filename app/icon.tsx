import { ImageResponse } from "next/og";

// Convenio de icono de Next.js (App Router): este archivo genera el favicon de
// la app. Next inyecta el <link rel="icon"> correspondiente en el <head>.
// Doc consultada: node_modules/next/dist/docs/.../14-metadata-and-og-images.md
// (sección "Favicons" / "Generated images" con ImageResponse de `next/og`).

// Tamaño y formato del icono generado.
export const size = {
  width: 64,
  height: 64,
};
export const contentType = "image/png";

// Genera el favicon "SCG": texto claro en negrita sobre el azul oscuro de la
// marca (mismos tokens que el header/footer del sitio: fondo #0F2C3E, texto
// #BCBEC0).
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0F2C3E",
          color: "#BCBEC0",
          fontSize: 28,
          fontWeight: 700,
          letterSpacing: -1,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        }}
      >
        SCG
      </div>
    ),
    {
      ...size,
    },
  );
}
