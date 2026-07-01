import { Schema, model, models, Types, type Model } from "mongoose";

export interface SkillDoc {
  groupId: Types.ObjectId;
  name: string;
  platform?: string | null;
  years?: number | null;
  level: number;
  sortOrder: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const SkillSchema = new Schema<SkillDoc>(
  {
    groupId: { type: Schema.Types.ObjectId, required: true, ref: "SkillGroup" },
    name: { type: String, required: true },
    platform: String,
    years: Number,
    level: { type: Number, default: 3, min: 1, max: 5 },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true, versionKey: false, collection: "skills" },
);

SkillSchema.index({ groupId: 1, name: 1 });
SkillSchema.index({ groupId: 1, sortOrder: 1 });

export const SkillModel: Model<SkillDoc> =
  (models.Skill as Model<SkillDoc> | undefined) ??
  model<SkillDoc>("Skill", SkillSchema);
