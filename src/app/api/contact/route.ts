import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  email: z.string().email("Valid email is required").max(200),
  subject: z.string().max(200).optional().or(z.literal("")),
  message: z.string().min(1, "Message is required").max(10_000),
  website: z.string().max(0).optional(), // honeypot — must remain empty
});

export async function POST(request: NextRequest) {
  const json = (await request.json().catch(() => null)) as unknown;
  const parsed = schema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const data = parsed.data;
  if (data.website && data.website.length > 0) {
    // honeypot triggered — pretend success to the bot
    return NextResponse.json({ ok: true });
  }

  const ipPrefix = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const trimmedIp = ipPrefix ? ipPrefix.slice(0, 24) : null;

  await prisma.message.create({
    data: {
      name: data.name,
      email: data.email,
      subject: data.subject?.trim() ? data.subject.trim() : null,
      message: data.message,
      ipPrefix: trimmedIp,
    },
  });

  // Optional SMTP forward — wired in Phase 3 when env is available.
  return NextResponse.json({ ok: true });
}