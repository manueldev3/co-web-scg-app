import { NextResponse } from "next/server";

export async function GET() {
  try {
    const result = await fetch("https://api.uexcorp.space/2.0/commodities", {
      headers: {
        Authorization: `Bearer ${process.env.UEX_API_TOKEN}`,
        Accept: "application/json",
      },
    });

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
