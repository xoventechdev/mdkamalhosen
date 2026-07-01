import { Schema, model, models, Types, type Model } from "mongoose";

export interface SkillGroupDoc {
  name: string;
  sortOrder: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const SkillGroupSchema = new Schema<SkillGroupDoc>(
  {
    name: { type: String, required: true, unique: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true, versionKey: false, collection: "skill_groups" },
);

// `unique: true` on `name` above already creates the unique index.

export const SkillGroupModel: Model<SkillGroupDoc> =
  (models.SkillGroup as Model<SkillGroupDoc> | undefined) ??
  model<SkillGroupDoc>("SkillGroup", SkillGroupSchema);

/** Shape used by the public read path (`getSkillGroups`). */
export type SkillGroupWithSkills = {
  _id: Types.ObjectId;
  name: string;
  sortOrder: number;
  skills: Array<{
    _id: Types.ObjectId;
    name: string;
    platform: string | null;
    years: number | null;
    level: number;
    sortOrder: number;
  }>;
};
