import { Schema, model, models, Types, type Model } from "mongoose";
import { AI_PROVIDER_IDS, type AiProviderId } from "@/lib/schemas";

/**
 * Singleton collection for AI provider settings.
 *
 * There is at most one document (id = AI_SETTINGS_ID). The encrypted key
 * never leaves the server — clients only ever see a masked preview.
 *
 * Provider + model + key + enabled flag live here so the admin can swap
 * providers without redeploying. The settings page loads the masked
 * preview via a server component and passes it as a prop to the
 * client form; the plaintext key is read only by server actions.
 *
 * The provider enum is shared with the form schema in src/lib/schemas.ts
 * (`AI_PROVIDER_IDS`). We re-import it here so there's a single source
 * of truth for the list of supported providers.
 */

export interface AiSettingsDoc {
  provider: AiProviderId;
  model: string;
  /** AES-256-GCM hex blob in the form `iv:tag:ciphertext`. */
  encryptedKey: string;
  /** UI-only preview (first 4 chars + mask). Never the plaintext. */
  keyMask: string;
  enabled: boolean;
  updatedBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const AiSettingsSchema = new Schema<AiSettingsDoc>(
  {
    provider: { type: String, enum: AI_PROVIDER_IDS, required: true },
    model: { type: String, required: true, maxlength: 200 },
    encryptedKey: { type: String, required: true, maxlength: 4000 },
    keyMask: { type: String, required: true, maxlength: 64 },
    enabled: { type: Boolean, default: true, required: true },
    updatedBy: { type: String, default: null, maxlength: 254 },
  },
  { timestamps: true, versionKey: false, collection: "ai_settings" },
);

export const AiSettingsModel: Model<AiSettingsDoc> =
  (models.AiSettings as Model<AiSettingsDoc> | undefined) ??
  model<AiSettingsDoc>("AiSettings", AiSettingsSchema);

/**
 * Fixed ObjectId so callers can do
 *   `AiSettingsModel.findById(AI_SETTINGS_ID).lean()`
 * without first discovering the id. Mirrors PROFILE_ID.
 */
export const AI_SETTINGS_ID = new Types.ObjectId("507f1f77bcf86cd7994390a1");