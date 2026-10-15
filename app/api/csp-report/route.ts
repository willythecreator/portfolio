import { NextResponse } from "next/server";

const MAX_BODY_BYTES = 8192;

export async function POST(request: Request) {
  try {
    const buf = await request.arrayBuffer();
    if (buf.byteLength > MAX_BODY_BYTES) {
      return new NextResponse(null, { status: 413 });
    }
    const body = new TextDecoder().decode(buf);
    // Structure: { "csp-report": { ... } } (Chrome) or [{ ... }] (Firefox)
    const parsed: unknown = JSON.parse(body);
    console.warn("[csp-report]", JSON.stringify(parsed).slice(0, 2000));
  } catch {
    // Ignore malformed reports
  }
  return new NextResponse(null, { status: 204 });
}
