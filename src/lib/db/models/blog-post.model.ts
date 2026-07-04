import { Schema, model, models, Types, type Model } from "mongoose";

const BLOG_STATUSES = ["draft", "published"] as const;
export type BlogStatusValue = (typeof BLOG_STATUSES)[number];

export interface BlogPostDoc {
  slug: string;
  title: string;
  excerpt?: string | null;
  coverUrl?: string | null;
  bodyMd: string;
  status: BlogStatusValue;
  publishedAt?: Date | null;
  readingMinutes: number;
  metaDescription?: string | null;
  /**
   * Embedded array of BlogTag ObjectIds — MongoDB-style denormalised
   * relation. The Prisma M2M join is gone; queries load tags via
   * `BlogTagModel.find({ _id: { $in: tagIds } })`.
   */
  tagIds: Types.ObjectId[];
  /**
   * Per-post toggle for the public comments section. Defaults to true
   * so existing posts opt-in. Admins can flip this from the blog
   * editor or via the `setPostCommentsEnabled` server action.
   */
  commentsEnabled: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const BlogPostSchema = new Schema<BlogPostDoc>(
  {
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    excerpt: String,
    coverUrl: String,
    bodyMd: { type: String, default: "" },
    status: { type: String, enum: BLOG_STATUSES, default: "draft" },
    publishedAt: Date,
    readingMinutes: { type: Number, default: 1 },
    metaDescription: String,
    tagIds: { type: [Types.ObjectId], default: [] },
    commentsEnabled: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false, collection: "blog_posts" },
);

BlogPostSchema.index({ status: 1, publishedAt: -1 });
BlogPostSchema.index({ updatedAt: -1 });
BlogPostSchema.index({ tagIds: 1 });

export const BlogPostModel: Model<BlogPostDoc> =
  (models.BlogPost as Model<BlogPostDoc> | undefined) ??
  model<BlogPostDoc>("BlogPost", BlogPostSchema);
