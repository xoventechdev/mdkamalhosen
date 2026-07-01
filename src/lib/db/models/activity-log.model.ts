import { Schema, model, models, type Model } from "mongoose";

export interface ActivityLogDoc {
  userEmail: string;
  action: string;
  entity: string;
  entityId?: string | null;
  meta?: unknown;
  createdAt?: Date;
  updatedAt?: Date;
}

const ActivityLogSchema = new Schema<ActivityLogDoc>(
  {
    userEmail: { type: String, required: true },
    action: { type: String, required: true },
    entity: { type: String, required: true },
    entityId: String,
    meta: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: true, versionKey: false, collection: "activity_log" },
);

ActivityLogSchema.index({ createdAt: -1 });

export const ActivityLogModel: Model<ActivityLogDoc> =
  (models.ActivityLog as Model<ActivityLogDoc> | undefined) ??
  model<ActivityLogDoc>("ActivityLog", ActivityLogSchema);
