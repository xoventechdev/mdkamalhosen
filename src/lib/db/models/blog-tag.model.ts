import { Schema, model, models, type Model } from "mongoose";

export interface BlogTagDoc {
  name: string;
  slug: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const BlogTagSchema = new Schema<BlogTagDoc>(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
  },
  { timestamps: true, versionKey: false, collection: "blog_tags" },
);

// `unique: true` on the field declarations above already creates the indexes.

export const BlogTagModel: Model<BlogTagDoc> =
  (models.BlogTag as Model<BlogTagDoc> | undefined) ??
  model<BlogTagDoc>("BlogTag", BlogTagSchema);
