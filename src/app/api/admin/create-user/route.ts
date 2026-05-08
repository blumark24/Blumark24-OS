export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {

    const body = await req.json();

    return NextResponse.json({
      success: true,
      body
    });

  } catch (error: any) {

    console.error("[CREATE_USER_FATAL]", error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Unknown error"
      },
      { status: 500 }
    );
  }
}
