import { ImageResponse } from "next/og";
import { type NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title") ?? "SCG - Guía de Star Citizen";
  const subtitle = searchParams.get("subtitle") ?? "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#061220",
          padding: "60px",
        }}
      >
        <h1 style={{ color: "#9ED0FA", fontSize: 56, textAlign: "center" }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ color: "#BCBEC0", fontSize: 28, marginTop: 16 }}>
            {subtitle}
          </p>
        )}
        <p style={{ color: "#82919E", fontSize: 20, marginTop: 40 }}>
          scg-app.com
        </p>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control":
          "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
      },
    },
  );
}
