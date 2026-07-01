import { Schema, model, models, type Model } from "mongoose";

export interface ExperienceDoc {
  company: string;
  role: string;
  country: string;
  city?: string | null;
  startDate: Date;
  endDate?: Date | null;
  current: boolean;
  bullets: string[];
  stack: string[];
  marqueeProject?: string | null;
  sortOrder: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const ExperienceSchema = new Schema<ExperienceDoc>(
  {
    company: { type: String, required: true },
    role: { type: String, required: true },
    country: { type: String, required: true },
    city: String,
    startDate: { type: Date, required: true },
    endDate: Date,
    current: { type: Boolean, default: false },
    bullets: { type: [String], default: [] },
    stack: { type: [String], default: [] },
    marqueeProject: String,
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true, versionKey: false, collection: "experiences" },
);

ExperienceSchema.index({ company: 1, role: 1, startDate: 1 }, { unique: true });
ExperienceSchema.index({ sortOrder: 1, startDate: -1 });

export const ExperienceModel: Model<ExperienceDoc> =
  (models.Experience as Model<ExperienceDoc> | undefined) ??
  model<ExperienceDoc>("Experience", ExperienceSchema);
