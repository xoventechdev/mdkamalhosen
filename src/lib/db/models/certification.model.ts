import { Schema, model, models, type Model } from "mongoose";

export interface CertificationDoc {
  name: string;
  issuer: string;
  year?: number | null;
  credentialUrl?: string | null;
  sortOrder: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const CertificationSchema = new Schema<CertificationDoc>(
  {
    name: { type: String, required: true },
    issuer: { type: String, required: true },
    year: Number,
    credentialUrl: String,
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true, versionKey: false, collection: "certifications" },
);

CertificationSchema.index({ name: 1, issuer: 1 }, { unique: true });
CertificationSchema.index({ sortOrder: 1 });

export const CertificationModel: Model<CertificationDoc> =
  (models.Certification as Model<CertificationDoc> | undefined) ??
  model<CertificationDoc>("Certification", CertificationSchema);
