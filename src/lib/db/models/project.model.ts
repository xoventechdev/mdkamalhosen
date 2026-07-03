import { Schema, model, models, type Model } from "mongoose";

const PROJECT_CATEGORIES = ["bms", "software", "iot", "android"] as const;
export type ProjectCategoryValue = (typeof PROJECT_CATEGORIES)[number];

const PROJECT_STATUSES = ["draft", "published"] as const;
export type ProjectStatusValue = (typeof PROJECT_STATUSES)[number];

export interface ProjectLinks {
  live?: string;
  github?: string;
  pdf?: string;
}

export interface ProjectDoc {
  slug: string;
  title: string;
  category: ProjectCategoryValue;
  /**
   * Free-form year label. Examples: "2024", "2024 - 2026",
   * "2025 - Present". Stored as a string so the public surface
   * prints whatever the admin entered.
   */
  year: string;
  clientType?: string | null;
  excerpt: string;
  coverUrl?: string | null;
  problem?: string | null;
  role?: string | null;
  techStack: string[];
  challenges?: string | null;
  solution?: string | null;
  outcome?: string | null;
  lessons?: string | null;
  galleryImages: string[];
  links?: ProjectLinks | null;
  featured: boolean;
  status: ProjectStatusValue;
  sortOrder: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const ProjectSchema = new Schema<ProjectDoc>(
  {
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    category: {
      type: String,
      enum: PROJECT_CATEGORIES,
      default: "bms",
    },
    year: { type: String, required: true },
    clientType: String,
    excerpt: { type: String, required: true },
    coverUrl: String,
    problem: String,
    role: String,
    techStack: { type: [String], default: [] },
    challenges: String,
    solution: String,
    outcome: String,
    lessons: String,
    galleryImages: { type: [String], default: [] },
    links: { type: Schema.Types.Mixed, default: null },
    featured: { type: Boolean, default: false },
    status: { type: String, enum: PROJECT_STATUSES, default: "draft" },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true, versionKey: false, collection: "projects" },
);

ProjectSchema.index({ status: 1, sortOrder: 1, createdAt: -1 });
ProjectSchema.index({ status: 1, featured: 1, sortOrder: 1 });

export const ProjectModel: Model<ProjectDoc> =
  (models.Project as Model<ProjectDoc> | undefined) ??
  model<ProjectDoc>("Project", ProjectSchema);
