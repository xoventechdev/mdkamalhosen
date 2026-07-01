import { Schema, model, models, type Model } from "mongoose";

export interface EducationDoc {
  degree: string;
  institution: string;
  startYear: number;
  endYear?: number | null;
  status: string;
  sortOrder: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const EducationSchema = new Schema<EducationDoc>(
  {
    degree: { type: String, required: true },
    institution: { type: String, required: true },
    startYear: { type: Number, required: true },
    endYear: Number,
    status: { type: String, default: "completed" },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true, versionKey: false, collection: "education" },
);

EducationSchema.index(
  { degree: 1, institution: 1, startYear: 1 },
  { unique: true },
);
EducationSchema.index({ sortOrder: 1 });

export const EducationModel: Model<EducationDoc> =
  (models.Education as Model<EducationDoc> | undefined) ??
  model<EducationDoc>("Education", EducationSchema);
