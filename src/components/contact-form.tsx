"use client";

import * as React from "react";
import { Mail, Loader2, CheckCircle2 } from "lucide-react";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface ContactFormState {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const initialState: ContactFormState = {
  name: "",
  email: "",
  subject: "",
  message: "",
};

function validate(values: ContactFormState): Partial<Record<keyof ContactFormState, string>> {
  const errors: Partial<Record<keyof ContactFormState, string>> = {};
  if (!values.name.trim()) errors.name = "Please share your name.";
  if (!values.email.trim()) errors.email = "Email is required.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email))
    errors.email = "That doesn't look like a valid email.";
  if (!values.message.trim()) errors.message = "Tell me what you want to talk about.";
  else if (values.message.trim().length < 10)
    errors.message = "Message needs a bit more detail (10+ characters).";
  return errors;
}

export function ContactForm() {
  const [values, setValues] = React.useState<ContactFormState>(initialState);
  const [errors, setErrors] = React.useState<
    Partial<Record<keyof ContactFormState, string>>
  >({});
  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  function update<K extends keyof ContactFormState>(key: K, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const v = validate(values);
    if (Object.keys(v).length > 0) {
      setErrors(v);
      toast.error("Please fix the highlighted fields.");
      return;
    }
    setSubmitting(true);
    try {
      const form = e.currentTarget;
      const formData = new FormData(form);
      const payload: Record<string, string> = {};
      formData.forEach((value, key) => {
        if (typeof value === "string") payload[key] = value;
      });
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Request failed");
      setSubmitted(true);
      toast.success("Message sent — I usually reply within a day or two.");
      setValues(initialState);
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Try emailing me directly.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="glass-card flex flex-col items-center gap-3 p-10 text-center">
        <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
        <h3 className="text-lg font-semibold">Message received</h3>
        <p className="max-w-sm text-sm text-muted-foreground">
          I&apos;ll get back to you from{" "}
          <span className="font-mono text-foreground">mdkamalhosennn@gmail.com</span>{" "}
          within a day or two.
        </p>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-md glass-chip px-4 text-sm font-medium hover:bg-card"
        >
          Send another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="glass-card p-6 sm:p-8" noValidate>
      <div className="space-y-4">
        <Field label="Name" htmlFor="name" required error={errors.name}>
          <Input
            id="name"
            name="name"
            autoComplete="name"
            value={values.name}
            onChange={(e) => update("name", e.target.value)}
            aria-invalid={Boolean(errors.name)}
            placeholder="Your name"
          />
        </Field>
        <Field label="Email" htmlFor="email" required error={errors.email}>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={(e) => update("email", e.target.value)}
            aria-invalid={Boolean(errors.email)}
            placeholder="you@company.com"
          />
        </Field>
        <Field
          label="Subject"
          htmlFor="subject"
          hint="Optional — tell me what this is about."
        >
          <Input
            id="subject"
            name="subject"
            value={values.subject}
            onChange={(e) => update("subject", e.target.value)}
            placeholder="BMS commissioning, software, AI…"
          />
        </Field>
        <Field label="Message" htmlFor="message" required error={errors.message}>
          <Textarea
            id="message"
            name="message"
            rows={5}
            value={values.message}
            onChange={(e) => update("message", e.target.value)}
            aria-invalid={Boolean(errors.message)}
            placeholder="What can I help you with?"
          />
        </Field>

        {/* Honeypot */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          className="hidden"
          aria-hidden="true"
        />

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-accent px-6 text-sm font-medium text-accent-foreground transition-all hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Sending…
            </>
          ) : (
            <>
              <Mail className="h-4 w-4" aria-hidden="true" />
              Send message
            </>
          )}
        </button>
      </div>
    </form>
  );
}