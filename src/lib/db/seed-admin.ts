/**
 * Idempotent admin-user seed. Re-run any time to create or update
 * the first admin.
 *
 *   npm run seed:admin -- --email you@example.com --password 'long-strong-password-12+'
 *
 * Or, for the very first bootstrap from a legacy deployment that
 * already had `ADMIN_PASSWORD_HASH` in its environment, accept that
 * hash verbatim:
 *
 *   ADMIN_PASSWORD_HASH='$2a$10$…' npm run seed:admin -- --email you@example.com
 *
 * Re-running with the same email updates the password hash, name,
 * and role. It does NOT bump `sessionVersion`, so any live session
 * cookie continues to work — a useful property when you only want to
 * fix the name or role.
 */

// `tsx` does not auto-load `.env`; Next.js does (for dev/build/start).
// The seed scripts are run outside Next.js, so we load env ourselves.
import "dotenv/config";

import bcrypt from "bcryptjs";
import { connect, disconnect, AdminUserModel } from "@/lib/db";

interface CliArgs {
  email?: string;
  password?: string;
  name?: string;
  role?: "owner" | "editor";
  hash?: string; // takes precedence over password; from ADMIN_PASSWORD_HASH
  help?: boolean;
}

function parseArgs(argv: string[]): CliArgs {
  const out: CliArgs = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--email" || a === "-e") out.email = argv[++i];
    else if (a === "--password" || a === "-p") out.password = argv[++i];
    else if (a === "--name" || a === "-n") out.name = argv[++i];
    else if (a === "--role" || a === "-r") out.role = argv[++i] as CliArgs["role"];
    else if (a === "--hash") out.hash = argv[++i];
    else if (a === "--help" || a === "-h") out.help = true;
  }
  return out;
}

function usage(): void {
  console.log(`Usage:
  npm run seed:admin -- --email <email> --password <password> [--name <name>] [--role owner|editor]
  ADMIN_PASSWORD_HASH='$2a$10$…' npm run seed:admin -- --email <email>

Options:
  --email,    -e   Admin email (required).
  --password, -p   Plaintext password (min 12 chars). Will be bcrypt-hashed.
  --name,     -n   Optional display name.
  --role,     -r   'owner' (default) or 'editor'.
  --hash         Pre-computed bcrypt hash (escape hatch from legacy env).
  --help,     -h   Show this help.

The script is idempotent: re-running with the same email updates the
password hash, name, and role. It does not change sessionVersion.
`);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.email) {
    usage();
    process.exit(args.help ? 0 : 1);
  }

  const email = args.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error("✗ Invalid email:", args.email);
    process.exit(1);
  }

  let passwordHash: string;
  if (args.hash) {
    passwordHash = args.hash;
  } else if (args.password) {
    if (args.password.length < 12) {
      console.error("✗ Password must be at least 12 characters.");
      process.exit(1);
    }
    passwordHash = await bcrypt.hash(args.password, 12);
  } else if (process.env.ADMIN_PASSWORD_HASH) {
    // One-time bootstrap from the legacy env-var setup. The store of
    // truth moves to the DB from this script onward; the env var
    // is no longer read at runtime.
    passwordHash = process.env.ADMIN_PASSWORD_HASH;
  } else {
    console.error(
      "✗ Provide --password <plaintext>, --hash <bcrypt>, or set ADMIN_PASSWORD_HASH in the environment.",
    );
    process.exit(1);
  }

  await connect();
  try {
    const update: Record<string, unknown> = { passwordHash };
    if (args.name !== undefined) update.name = args.name;
    if (args.role !== undefined) {
      if (args.role !== "owner" && args.role !== "editor") {
        console.error("✗ --role must be 'owner' or 'editor'.");
        process.exit(1);
      }
      update.role = args.role;
    }

    const existing = await AdminUserModel.findOne({ email });
    if (existing) {
      await AdminUserModel.updateOne({ _id: existing._id }, { $set: update });
      console.log(
        `✓ Admin user ${email} updated (id=${String(existing._id)}, sessionVersion unchanged).`,
      );
    } else {
      const created = await AdminUserModel.create({
        email,
        name: args.name ?? null,
        role: args.role ?? "owner",
        passwordHash,
        isActive: true,
        sessionVersion: 0,
        failedLoginCount: 0,
      });
      console.log(
        `✓ Admin user ${email} created (id=${String(created._id)}).`,
      );
    }
  } finally {
    await disconnect();
  }
}

main().catch((err) => {
  console.error("✗ seed:admin failed:", err);
  process.exit(1);
});
