import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const commodityName = searchParams.get("commodity_name");

  if (!commodityName) {
    return NextResponse.json({ status: "error", data: [] }, { status: 400 });
  }

  try {
    const result = await fetch(
      `https://api.uexcorp.space/2.0/commodities_prices?commodity_name=${encodeURIComponent(commodityName)}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.UEX_API_TOKEN}`,
          Accept: "application/json",
        },
      },
    );

    if (!result.ok) {
      return NextResponse.json(
        { status: "error", data: [] },
        { status: result.status },
      );
    }

    const data = await result.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ status: "error", data: [] }, { status: 500 });
  }
}
