import { Schema, model, models, type Model } from "mongoose";

export interface MessageDoc {
  name: string;
  email: string;
  subject?: string | null;
  message: string;
  ipPrefix?: string | null;
  readAt?: Date | null;
  archived: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const MessageSchema = new Schema<MessageDoc>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    subject: String,
    message: { type: String, required: true },
    ipPrefix: String,
    readAt: Date,
    archived: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false, collection: "messages" },
);

MessageSchema.index({ readAt: 1, archived: 1 });
MessageSchema.index({ createdAt: -1 });

export const MessageModel: Model<MessageDoc> =
  (models.Message as Model<MessageDoc> | undefined) ??
  model<MessageDoc>("Message", MessageSchema);
