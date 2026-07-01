import { Schema, model, models, Types, type Model } from "mongoose";

/**
 * One-time, short-lived password-reset tokens.
 *
 * The plaintext token is only ever present in the email we send and in
 * the URL the recipient clicks. We persist only its sha256 hash so a
 * database leak (or a query-log leak) does not yield usable tokens.
 *
 * Mongo's TTL monitor reaps expired rows automatically via the
 * `expires` index on `expiresAt` — see index declaration below.
 */

export interface PasswordResetTokenDoc {
  userId: Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  usedAt?: Date | null;
  createdAt?: Date;
}

const PasswordResetTokenSchema = new Schema<PasswordResetTokenDoc>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "AdminUser",
      required: true,
    },
    tokenHash: { type: String, required: true, maxlength: 200 },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false, collection: "password_reset_tokens" },
);

// TTL: Mongo deletes the document `expiresAt` seconds after that field's
// value. We always set expiresAt to (now + 1h), so docs disappear within
// the hour after they expire. This is the only reaper we need.
PasswordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
// Lookup-by-hash is the hot path on the reset route.
PasswordResetTokenSchema.index({ tokenHash: 1 });
// Per-user listing for audit / debug.
PasswordResetTokenSchema.index({ userId: 1, createdAt: -1 });

export const PasswordResetTokenModel: Model<PasswordResetTokenDoc> =
  (models.PasswordResetToken as Model<PasswordResetTokenDoc> | undefined) ??
  model<PasswordResetTokenDoc>(
    "PasswordResetToken",
    PasswordResetTokenSchema,
  );
