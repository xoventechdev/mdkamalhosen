import { Schema, model, models, type Model } from "mongoose";

/**
 * Database-backed admin user. Replaces the old env-var allow-list
 * (ADMIN_EMAIL + ADMIN_PASSWORD_HASH) so the owner can recover access
 * via the forgot-password flow, rotate credentials, and (in future)
 * have more than one admin.
 *
 * Security notes:
 *   - `email` is stored lowercased and uniquely indexed.
 *   - `passwordHash` is a bcrypt hash; we never store the plaintext.
 *   - `sessionVersion` is incremented whenever an admin's credentials
 *     change. The session cookie payload carries the version it was
 *     signed at, and `requireAdmin()` / middleware reject cookies whose
 *     version does not match — that is the "log out everywhere" lever.
 *   - `failedLoginCount` + `lockedUntil` implement a simple lockout:
 *     five consecutive failures lock the account for 15 minutes.
 */

export const ADMIN_ROLES = ["owner", "editor"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export interface AdminUserDoc {
  email: string;
  name?: string | null;
  role: AdminRole;
  passwordHash: string;
  isActive: boolean;
  sessionVersion: number;
  lastLoginAt?: Date | null;
  failedLoginCount: number;
  lockedUntil?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const AdminUserSchema = new Schema<AdminUserDoc>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    name: { type: String, default: null, maxlength: 120 },
    role: { type: String, enum: ADMIN_ROLES, default: "owner", required: true },
    passwordHash: { type: String, required: true, maxlength: 200 },
    isActive: { type: Boolean, default: true, required: true },
    sessionVersion: { type: Number, default: 0, required: true, min: 0 },
    lastLoginAt: { type: Date, default: null },
    failedLoginCount: { type: Number, default: 0, required: true, min: 0 },
    lockedUntil: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false, collection: "admin_users" },
);

export const AdminUserModel: Model<AdminUserDoc> =
  (models.AdminUser as Model<AdminUserDoc> | undefined) ??
  model<AdminUserDoc>("AdminUser", AdminUserSchema);
