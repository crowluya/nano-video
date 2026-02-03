import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Not implemented" },
    {
      status: 501,
    }
  );
}
