import { Schema, model, models, Types, type Document, type Model } from "mongoose";

const COMMENT_STATUSES = ["pending", "approved", "spam", "rejected"] as const;
export type CommentStatusValue = (typeof COMMENT_STATUSES)[number];

export interface CommentDoc extends Document {
  postId: Types.ObjectId;
  parentId: Types.ObjectId | null;
  authorName: string;
  authorEmail: string;
  body: string;
  status: CommentStatusValue;
  isAdmin: boolean;
  authorUserId: Types.ObjectId | null;
  ipPrefix?: string | null;
  userAgent?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const CommentSchema = new Schema<CommentDoc>(
  {
    postId: { type: Schema.Types.ObjectId, ref: "BlogPost", required: true, index: true },
    parentId: { type: Schema.Types.ObjectId, ref: "Comment", default: null },
    authorName: { type: String, required: true, trim: true, maxlength: 80 },
    authorEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },
    body: { type: String, required: true, trim: true, maxlength: 2000 },
    status: {
      type: String,
      enum: COMMENT_STATUSES,
      default: "pending",
      required: true,
    },
    isAdmin: { type: Boolean, default: false },
    authorUserId: { type: Schema.Types.ObjectId, ref: "AdminUser", default: null },
    ipPrefix: { type: String, default: null, maxlength: 64 },
    userAgent: { type: String, default: null, maxlength: 512 },
  },
  { timestamps: true, versionKey: false, collection: "comments" },
);

CommentSchema.index({ postId: 1, status: 1, createdAt: -1 });
CommentSchema.index({ parentId: 1 }, { sparse: true });
CommentSchema.index({ authorEmail: 1 });

// Defensive sanitisation before save
CommentSchema.pre("save", function (next) {
  if (typeof this.body === "string") {
    this.body = this.body.replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, "").trim();
  }
  if (typeof this.authorName === "string") this.authorName = this.authorName.trim();
  if (typeof this.authorEmail === "string") {
    this.authorEmail = this.authorEmail.trim().toLowerCase();
  }
  next();
});

export const CommentModel: Model<CommentDoc> =
  (models.Comment as Model<CommentDoc> | undefined) ??
  model<CommentDoc>("Comment", CommentSchema);
