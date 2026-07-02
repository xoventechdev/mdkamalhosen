import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!host || !user || !pass) {
    return NextResponse.json({
      ok: false,
      error: "SMTP not configured (missing SMTP_HOST/SMTP_USER/SMTP_PASSWORD).",
    });
  }

  try {
    const transport = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
    await transport.verify();
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      error: err instanceof Error ? err.message : "SMTP verify failed.",
    });
  }
}