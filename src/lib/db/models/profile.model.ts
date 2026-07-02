import { Schema, model, models, Types, type Model } from "mongoose";

export interface ProfileHighlight {
  text: string;
  jobSeekingOnly: boolean;
}

export interface ProfileStat {
  value: string;
  label: string;
  color?: string;
}

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
  // Marketing
  highlights: ProfileHighlight[];
  preferredLocations: string[];
  // Site-wide metadata
  siteTitle?: string;
  siteDescription?: string;
  siteKeywords: string[];
  twitterHandle?: string;
  // Stats grid
  stats: ProfileStat[];
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
    // Marketing — `highlights` items carry a `jobSeekingOnly` flag so the home
    // marquee can hide job-seeking copy when the admin flips off
    // `lookingToNewOpportunity`. `_id: false` keeps the array shape clean
    // (no internal Mongoose ObjectId).
    highlights: {
      type: [
        new Schema<ProfileHighlight>(
          {
            text: { type: String, required: true, maxlength: 80 },
            jobSeekingOnly: { type: Boolean, default: false },
          },
          { _id: false },
        ),
      ],
      default: [],
    },
    preferredLocations: { type: [String], default: [] },
    // Site-wide metadata — these override the static defaults in
    // src/app/layout.tsx when set. All optional so legacy profile rows
    // keep validating without them.
    siteTitle: { type: String, maxlength: 120 },
    siteDescription: { type: String, maxlength: 500 },
    siteKeywords: { type: [String], default: [] },
    twitterHandle: { type: String, maxlength: 40 },
    // Stats grid — admin-editable list shown on the home page.
    stats: {
      type: [
        new Schema<ProfileStat>(
          {
            value: { type: String, required: true, maxlength: 40 },
            label: { type: String, required: true, maxlength: 120 },
            color: { type: String, maxlength: 60 },
          },
          { _id: false },
        ),
      ],
      default: [],
    },
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
