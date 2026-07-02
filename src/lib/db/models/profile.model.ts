import { Schema, model, models, Types, type Model } from "mongoose";

export interface ProfileDoc {
  name: string;
  role: string;
  tagline: string;
  location: string;
  relocate: boolean;
  lookingToNewOpportunity: boolean;
  email: string;
  phone?: string | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  whatsapp?: string | null;
  summary: string;
  mission: string;
  philosophy: string;
  values: string[];
  availability: string;
  avatarUrl?: string | null;
  cvPdfUrl?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const ProfileSchema = new Schema<ProfileDoc>(
  {
    name: { type: String, required: true },
    role: { type: String, required: true },
    tagline: { type: String, required: true },
    location: { type: String, required: true },
    relocate: { type: Boolean, default: true },
    lookingToNewOpportunity: { type: Boolean, default: true },
    email: { type: String, required: true },
    phone: String,
    linkedinUrl: String,
    githubUrl: String,
    whatsapp: String,
    summary: { type: String, required: true },
    mission: { type: String, required: true },
    philosophy: { type: String, required: true },
    values: { type: [String], default: [] },
    availability: { type: String, default: "open" },
    avatarUrl: String,
    cvPdfUrl: String,
  },
  { timestamps: true, versionKey: false, collection: "profile" },
);

export const ProfileModel: Model<ProfileDoc> =
  (models.Profile as Model<ProfileDoc> | undefined) ??
  model<ProfileDoc>("Profile", ProfileSchema);

/**
 * The singleton profile row carries a fixed ObjectId so the rest of the
 * codebase can use `ProfileModel.findById(PROFILE_ID)` and so admin actions
 * can mutate it without a round-trip to discover the id.
 */
export const PROFILE_ID = new Types.ObjectId("507f1f77bcf86cd799439011");
