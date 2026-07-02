// `tsx` does not auto-load `.env`; Next.js does (for dev/build/start).
// The seed scripts are run outside Next.js, so we load env ourselves.
import "dotenv/config";

import { Types } from "mongoose";
import {
  connect,
  disconnect,
  ProfileModel,
  ExperienceModel,
  EducationModel,
  CertificationModel,
  SkillGroupModel,
  SkillModel,
  ProjectModel,
  BlogPostModel,
  BlogTagModel,
} from "@/lib/db";

const PROFILE_ID = new Types.ObjectId("507f1f77bcf86cd799439011");

// ---------------------------------------------------------------------------
// Idempotent seed loader. Re-run any time: uses upsert keyed on natural keys.
// Mirrors plan/05_CONTENT_MAPPING.md. CV facts win over ai-context where they
// disagree. Never seeds confidential/private data (plan/09_SECURITY_PRIVACY.md).
//
// All primary keys are ObjectId strings (MongoDB). The Profile singleton has
// the fixed id above so the rest of the codebase can keep using
// `ProfileModel.findById(PROFILE_ID)` lookups unchanged.
// ---------------------------------------------------------------------------

async function seedProfile() {
  await ProfileModel.findByIdAndUpdate(
    PROFILE_ID,
    {
      $set: {
        name: "Md Kamal Hosen",
        role: "Building Management System Engineer",
        tagline:
          "Building Management System Engineer commissioning HVAC plants and shipping the software that runs them.",
        location: "Riyadh, Saudi Arabia",
        relocate: true,
        lookingToNewOpportunity: true,
        email: "mdkamalhosennn@gmail.com",
        phone: "+966 58 347 1377",
        linkedinUrl: "https://linkedin.com/in/mdkamalhosennn",
        githubUrl: null,
        whatsapp: "+966 58 347 1377",
        summary:
          "Building Management System (BMS) Engineer with over 5 years of international experience in HVAC automation, smart building technologies, and large-scale system commissioning. Combines a background in electrical engineering with computer science and software development skills to bridge IT and OT environments in modern smart buildings. Experienced in Honeywell Alerton and Tridium Niagara 4 platforms with strong expertise in BACnet and Modbus integrations. Proven ability to commission complex BMS networks, optimise energy performance, and deliver reliable automation solutions at King Abdullah Financial District (KAFD).",
        mission:
          "To become an internationally recognised Building Automation Engineer while combining software engineering and AI to build smarter buildings.",
        values: [
          "Commission with proof",
          "Document before deploying",
          "Automate repetitive engineering",
          "Anonymise confidential data",
          "Bridge IT and OT",
        ],
        availability: "open",
        avatarUrl: "/avatars/placeholder.svg",
        cvPdfUrl: "/cv/kamal-hosen-cv.pdf",
        // Marketing
        highlights: [
          { text: "5+ years international", jobSeekingOnly: false },
          { text: "Honeywell Alerton", jobSeekingOnly: false },
          { text: "Niagara 4 certified", jobSeekingOnly: false },
          { text: "KAFD commissioning", jobSeekingOnly: false },
          { text: "100K+ app downloads", jobSeekingOnly: false },
          { text: "Open to relocation anywhere", jobSeekingOnly: true },
          { text: "BACnet · Modbus · M-Bus", jobSeekingOnly: false },
          { text: "DDC controllers", jobSeekingOnly: false },
          { text: "Graphics", jobSeekingOnly: false },
        ],
        preferredLocations: ["UK / EU"],
        // Site-wide metadata
        siteTitle: "Md Kamal Hosen — Building Management System Engineer",
        siteDescription:
          "BMS Engineer commissioning HVAC plants and shipping the software that runs them. Honeywell Alerton, Niagara 4, BACnet, Modbus, IoT, and AI-assisted engineering workflow.",
        siteKeywords: [
          "Building Management System",
          "BMS Engineer",
          "Honeywell Alerton",
          "Niagara 4",
          "BACnet",
          "Modbus",
          "HVAC automation",
          "Smart buildings",
          "Md Kamal Hosen",
        ],
        twitterHandle: "@mdkamalhosennn",
        // Stats grid
        stats: [
          { value: "5+", label: "Years international", color: "text-accent" },
          { value: "KAFD", label: "District commissioned", color: "text-cat-bms" },
          { value: "100K+", label: "App downloads", color: "text-cat-android" },
          { value: "6", label: "Honeywell + Tridium certs", color: "text-cat-software" },
        ],
      },
    },
    { upsert: true },
  );
}

const experiences: Array<{
  company: string;
  role: string;
  country: string;
  city: string;
  startDate: string;
  endDate: string | null;
  current: boolean;
  bullets: string[];
  stack: string[];
  marqueeProject: string | null;
  sortOrder: number;
}> = [
  {
    company: "GLSAN Contracting Company",
    role: "BMS Engineer",
    country: "Saudi Arabia",
    city: "Riyadh",
    startDate: "2025-09-01",
    endDate: null,
    current: true,
    bullets: [
      "Lead testing, commissioning, and optimisation of BMS networks at the King Abdullah Financial District (KAFD).",
      "Develop logic programming, system configurations, and graphics using Honeywell Alerton and Niagara 4.",
      "Perform functional testing of HVAC systems and validate control sequences.",
      "Diagnose complex BMS integration faults and improve system performance.",
      "Collaborate with consultants, contractors, and vendors to ensure project delivery.",
    ],
    stack: ["Honeywell Alerton", "Niagara 4", "BACnet", "Modbus", "HVAC", "Graphics"],
    marqueeProject: "King Abdullah Financial District (KAFD)",
    sortOrder: 0,
  },
  {
    company: "Stark Security Services",
    role: "BMS Testing & Commissioning Engineer",
    country: "Qatar",
    city: "Doha",
    startDate: "2023-11-01",
    endDate: "2025-08-31",
    current: false,
    bullets: [
      "Programmed and commissioned Honeywell BMS systems including DDC logic and HVAC control strategies.",
      "Integrated third-party equipment through BACnet, Modbus, and M-Bus protocols.",
      "Executed commissioning procedures, troubleshooting, and system validation.",
      "Prepared commissioning reports, test documentation, and as-built records.",
    ],
    stack: ["Honeywell", "DDC", "BACnet", "Modbus", "M-Bus", "Commissioning"],
    marqueeProject: null,
    sortOrder: 1,
  },
  {
    company: "Stark Security Services",
    role: "BMS Operator",
    country: "Qatar",
    city: "Doha",
    startDate: "2020-07-01",
    endDate: "2023-10-31",
    current: false,
    bullets: [
      "Monitored HVAC, lighting, and energy management systems through central BMS platforms.",
      "Responded to system alarms and coordinated with maintenance teams for issue resolution.",
      "Performed system inspections and supported energy optimisation initiatives.",
    ],
    stack: ["BMS", "HVAC", "Energy Management"],
    marqueeProject: null,
    sortOrder: 2,
  },
  {
    company: "Hassanesco",
    role: "BMS Technician",
    country: "Qatar",
    city: "Doha",
    startDate: "2019-07-01",
    endDate: "2020-07-31",
    current: false,
    bullets: [
      "Installed and configured sensors, actuators, and DDC controllers.",
      "Supported commissioning teams during system testing and deployment.",
      "Performed preventive maintenance and documented system updates.",
    ],
    stack: ["DDC", "Sensors", "Actuators"],
    marqueeProject: null,
    sortOrder: 3,
  },
];

async function seedExperiences() {
  for (const exp of experiences) {
    await ExperienceModel.findOneAndUpdate(
      {
        company: exp.company,
        role: exp.role,
        startDate: new Date(exp.startDate),
      },
      {
        $set: {
          country: exp.country,
          city: exp.city,
          endDate: exp.endDate ? new Date(exp.endDate) : null,
          current: exp.current,
          bullets: exp.bullets,
          stack: exp.stack,
          marqueeProject: exp.marqueeProject,
          sortOrder: exp.sortOrder,
        },
      },
      { upsert: true },
    );
  }
}

const education = [
  {
    degree: "Bachelor of Arts",
    institution: "Bangladesh Open University",
    startYear: 2024,
    endYear: 2027,
    status: "ongoing",
    sortOrder: 0,
  },
  {
    degree: "Diploma in Electrical Engineering",
    institution: "Bangladesh Youth Technical Training",
    startYear: 2015,
    endYear: 2016,
    status: "completed",
    sortOrder: 1,
  },
];

async function seedEducation() {
  for (const e of education) {
    await EducationModel.findOneAndUpdate(
      { degree: e.degree, institution: e.institution, startYear: e.startYear },
      { $set: { endYear: e.endYear ?? null, status: e.status, sortOrder: e.sortOrder } },
      { upsert: true },
    );
  }
}

const certifications: Array<{ name: string; issuer: string; year: number | null; sortOrder: number }> = [
  { name: "Niagara 4 BACnet Driver", issuer: "Tridium University", year: null, sortOrder: 0 },
  { name: "Commissioning a JACE", issuer: "Tridium University", year: null, sortOrder: 1 },
  { name: "BACnet Engineering", issuer: "Honeywell Buildings University", year: null, sortOrder: 2 },
  { name: "Honeywell VFD Training", issuer: "Honeywell Buildings University", year: null, sortOrder: 3 },
  { name: "Networking Fundamentals", issuer: "Honeywell Buildings University", year: null, sortOrder: 4 },
  { name: "Cyber Security in BAS Systems", issuer: "Honeywell Buildings University", year: null, sortOrder: 5 },
];

async function seedCertifications() {
  for (const c of certifications) {
    await CertificationModel.findOneAndUpdate(
      { name: c.name, issuer: c.issuer },
      { $set: { year: c.year, sortOrder: c.sortOrder } },
      { upsert: true },
    );
  }
}

const skillGroups: Array<{
  name: string;
  skills: Array<{ name: string; platform?: string | null; years?: number | null; level?: number }>;
}> = [
  {
    name: "Building Automation",
    skills: [
      { name: "Honeywell Alerton", platform: "Alerton", level: 5, years: 5 },
      { name: "Tridium Niagara 4", platform: "Niagara 4", level: 5, years: 5 },
      { name: "DDC Controllers", level: 5, years: 5 },
      { name: "BACnet (IP/MSTP)", level: 5, years: 5 },
      { name: "Modbus (RTU/TCP)", level: 4, years: 4 },
      { name: "M-Bus", level: 3, years: 2 },
      { name: "HVAC Control Logic", level: 5, years: 5 },
      { name: "Functional Testing", level: 5, years: 5 },
      { name: "Energy Optimisation", level: 4, years: 3 },
      { name: "System Fault Analysis", level: 5, years: 5 },
      { name: "Network Debugging", level: 4, years: 5 },
      { name: "Graphics", level: 4, years: 4 },
    ],
  },
  {
    name: "Programming",
    skills: [
      { name: "Java", level: 4, years: 3 },
      { name: "JavaScript", level: 4, years: 4 },
      { name: "Python", level: 3, years: 2 },
      { name: "Node.js", level: 4, years: 3 },
      { name: "React", level: 4, years: 3 },
      { name: "Next.js", level: 4, years: 3 },
      { name: "PHP", level: 3, years: 2 },
      { name: "MySQL", level: 3, years: 3 },
      { name: "SQLite", level: 3, years: 2 },
      { name: "MongoDB", level: 3, years: 2 },
      { name: "Prisma", level: 4, years: 2 },
    ],
  },
  {
    name: "IoT",
    skills: [
      { name: "ESP8266", level: 3, years: 2 },
      { name: "MQTT", level: 3, years: 2 },
      { name: "REST API", level: 4, years: 3 },
      { name: "Sensor integration", level: 3, years: 2 },
    ],
  },
  {
    name: "AI Tools",
    skills: [
      { name: "ChatGPT", level: 5, years: 2 },
      { name: "Claude", level: 5, years: 2 },
      { name: "Gemini", level: 4, years: 1 },
      { name: "Cursor", level: 4, years: 1 },
      { name: "GitHub Copilot", level: 4, years: 1 },
    ],
  },
  {
    name: "Cloud & Tooling",
    skills: [
      { name: "Firebase", level: 3, years: 2 },
      { name: "Supabase", level: 4, years: 1 },
      { name: "Linux", level: 3, years: 3 },
      { name: "Git", level: 4, years: 4 },
      { name: "GitHub", level: 4, years: 4 },
    ],
  },
];

async function seedSkills() {
  for (let gi = 0; gi < skillGroups.length; gi++) {
    const group = skillGroups[gi];
    if (!group) continue;
    const groupDoc = await SkillGroupModel.findOneAndUpdate(
      { name: group.name },
      { $set: { sortOrder: gi }, $setOnInsert: { name: group.name } },
      { upsert: true, new: true },
    );
    if (!groupDoc) continue;
    for (let si = 0; si < group.skills.length; si++) {
      const skill = group.skills[si];
      if (!skill) continue;
      const existing = await SkillModel.findOne({
        groupId: groupDoc._id,
        name: skill.name,
      }).lean();
      if (existing) continue;
      await SkillModel.create({
        groupId: groupDoc._id,
        name: skill.name,
        platform: skill.platform ?? null,
        years: skill.years ?? null,
        level: skill.level ?? 3,
        sortOrder: si,
      });
    }
  }
}

type ProjectSeed = {
  slug: string;
  title: string;
  category: "bms" | "software" | "iot" | "android";
  year: number;
  clientType: string;
  excerpt: string;
  problem: string;
  role: string;
  techStack: string[];
  challenges: string;
  solution: string;
  outcome: string;
  lessons: string;
  featured: boolean;
  status: "draft" | "published";
  sortOrder: number;
};

const projects: ProjectSeed[] = [
  {
    slug: "kafd-bms-commissioning",
    title: "KAFD District — BMS Commissioning",
    category: "bms",
    year: 2025,
    clientType: "Commercial district (anonymised)",
    excerpt:
      "Commissioning BMS networks across the King Abdullah Financial District.",
    problem:
      "(Owner to expand) Multiple building blocks requiring unified BMS commissioning, integration validation, and HVAC control optimisation.",
    role: "BMS Engineer, GLSAN Contracting Company",
    techStack: ["Honeywell Alerton", "Niagara 4", "BACnet", "Modbus", "HVAC"],
    challenges:
      "(Owner to expand) Coordinating across vendors and consultants while validating control sequences on live infrastructure.",
    solution:
      "(Owner to expand) Logic programming, graphics development, functional testing, and fault diagnosis across the district.",
    outcome:
      "(Owner to expand) Improved system reliability and energy performance metrics.",
    lessons: "(Owner to expand)",
    featured: true,
    status: "published",
    sortOrder: 0,
  },
  {
    slug: "red-palace-bms",
    title: "Red Palace — BMS Integration",
    category: "bms",
    year: 2024,
    clientType: "Heritage commercial site (anonymised)",
    excerpt:
      "BMS commissioning and graphics deliverables for a heritage commercial site.",
    problem: "(Owner to expand)",
    role: "BMS Testing & Commissioning Engineer",
    techStack: ["Honeywell", "BACnet", "Modbus", "M-Bus"],
    challenges: "(Owner to expand)",
    solution: "(Owner to expand)",
    outcome: "(Owner to expand)",
    lessons: "(Owner to expand)",
    featured: false,
    status: "draft",
    sortOrder: 1,
  },
  {
    slug: "resume-builder",
    title: "Resume Builder",
    category: "software",
    year: 2024,
    clientType: "Personal project",
    excerpt:
      "A web tool to generate role-targeted resumes from structured data.",
    problem:
      "Tailoring a CV to each job description manually is slow and error-prone.",
    role: "Solo developer",
    techStack: ["Next.js", "TypeScript", "Prisma", "Supabase"],
    challenges:
      "Composing structured content into multiple CV formats and clean exports.",
    solution:
      "A schema-driven resume editor that renders role-targeted output from one source of truth.",
    outcome: "(Owner to expand)",
    lessons:
      "Schema design pays back twice — once for input UX, once for output formats.",
    featured: true,
    status: "published",
    sortOrder: 2,
  },
  {
    slug: "attendance-system",
    title: "Attendance System",
    category: "software",
    year: 2023,
    clientType: "Personal project",
    excerpt:
      "Time-and-attendance tracking built for small engineering teams.",
    problem: "(Owner to expand)",
    role: "Solo developer",
    techStack: ["Node.js", "MySQL", "React"],
    challenges: "(Owner to expand)",
    solution: "(Owner to expand)",
    outcome: "(Owner to expand)",
    lessons: "(Owner to expand)",
    featured: false,
    status: "draft",
    sortOrder: 3,
  },
  {
    slug: "iot-dashboard",
    title: "IoT Dashboard",
    category: "iot",
    year: 2023,
    clientType: "Personal project",
    excerpt:
      "Real-time MQTT dashboard for ESP8266 sensor networks.",
    problem: "(Owner to expand)",
    role: "Solo developer",
    techStack: ["Node.js", "MQTT", "ESP8266"],
    challenges: "(Owner to expand)",
    solution: "(Owner to expand)",
    outcome: "(Owner to expand)",
    lessons: "(Owner to expand)",
    featured: false,
    status: "draft",
    sortOrder: 4,
  },
  {
    slug: "android-100k-downloads",
    title: "Android App — 100K+ Downloads",
    category: "android",
    year: 2022,
    clientType: "Google Play",
    excerpt:
      "Published Android application with over 100,000 downloads.",
    problem: "(Owner to expand title + specifics)",
    role: "Solo developer",
    techStack: ["Android", "Java", "REST"],
    challenges: "(Owner to expand)",
    solution: "(Owner to expand)",
    outcome:
      "100,000+ installs on Google Play. (Owner to supply additional anonymised metrics.)",
    lessons: "(Owner to expand)",
    featured: true,
    status: "draft",
    sortOrder: 5,
  },
];

async function seedProjects() {
  for (const p of projects) {
    await ProjectModel.findOneAndUpdate(
      { slug: p.slug },
      { $set: { ...p } },
      { upsert: true },
    );
  }
}

const blogTags = [
  { name: "BMS", slug: "bms" },
  { name: "Protocols", slug: "protocols" },
  { name: "Niagara", slug: "niagara" },
  { name: "Commissioning", slug: "commissioning" },
  { name: "AI", slug: "ai" },
  { name: "Workflow", slug: "workflow" },
];

const blogPosts: Array<{
  slug: string;
  title: string;
  excerpt: string;
  bodyMd: string;
  status: "draft" | "published";
  tags: string[];
}> = [
  {
    slug: "bacnet-vs-modbus-brief",
    title: "BACnet vs Modbus: A Short Reference",
    excerpt:
      "A practical comparison of BACnet and Modbus for building automation engineers.",
    bodyMd: `# BACnet vs Modbus\n\nA quick reference for commissioning engineers.\n\n## TL;DR\n\nBACnet is object-oriented and built for buildings. Modbus is register-oriented and built for industrial PLCs. Both talk over IP and serial. On most sites you use both.\n\n## Protocol shape\n\n|  | BACnet | Modbus |\n|---|---|---|\n| Unit | Object (analog-input, binary-output...) | Register (coil, holding) |\n| Address | device-instance + object-identifier | slave-id + register address |\n| Transport | IP, MSTP, ARCNET | RTU, TCP |\n| Discovery | who-is / i-am | none |\n\n## Where I use each\n\n- BACnet/IP for supervisor-to-controller traffic on Niagara 4 sites.\n- BACnet MSTP for controller-to-controller on serial loops.\n- Modbus RTU for third-party power meters, chillers, and VFDs that only expose registers.\n- Modbus TCP for newer equipment exposing registers over Ethernet.\n\n## Lesson\n\nIf a device only speaks Modbus, map its registers into BACnet objects at the supervisor — your operator UI gets a single coherent view.`,
    status: "draft",
    tags: ["BMS", "Protocols"],
  },
  {
    slug: "commissioning-niagara-4-site-checklist",
    title: "Commissioning a Niagara 4 Site — Checklist",
    excerpt:
      "An anonymised commissioning checklist for a Tridium Niagara 4 deployment.",
    bodyMd: `# Commissioning a Niagara 4 Site\n\nA working checklist. Anonymised — strip out any client-identifying data before adapting.\n\n## Pre-commissioning\n\n- Network diagram approved\n- Controller IPs assigned, no duplicates\n- Supervisor licensed and reachable\n- BACnet device instances unique across the network\n\n## Network bring-up\n\n- Ping each JACE from the supervisor.\n- Confirm MSTP loop wiring, baud, max_info_frames.\n- Walk the BACnet who-is; expect an i-am from every controller.\n\n## Point verification\n\n- For each controller, verify each input against a hand meter.\n- For each output, command and observe the actuator.\n- Record deviations in the commissioning sheet.\n\n## Sequences of operation\n\n- Verify schedule, setpoint, interlocks, alarms.\n- Force each alarm and confirm the supervisor reports it.\n\n## Handover\n\n- As-built graphics published.\n- Anonymised trend logs exporting.\n- Operator training delivered.`,
    status: "draft",
    tags: ["BMS", "Niagara", "Commissioning"],
  },
  {
    slug: "how-i-use-ai-in-engineering",
    title: "How I Use AI in My Engineering Workflow",
    excerpt:
      "AI is built into my workflow — not bolted on. Here is where it actually helps and where it doesn't.",
    bodyMd: `# How I Use AI in My Engineering Workflow\n\nAI is integrated into my day-to-day engineering practice across five areas: planning, documentation, coding, problem-solving, and research.\n\n## Where it actually helps\n\n- **Planning** — turning a vague brief into a sequenced work breakdown.\n- **Documentation** — first drafts of commissioning reports and SOPs.\n- **Coding** — boilerplate and refactors where the spec is clear.\n- **Problem-solving** — second opinion on BMS integration faults.\n- **Research** — faster onboarding on new protocols and equipment.\n\n## Where it doesn't\n\n- Anything that needs ground truth from the site. The model does not stand in front of the panel. I verify against the actual controller, the actual wiring, the actual trend log.\n\n## Rule I follow\n\nIf I would not defend the work in front of a consultant, I do not ship it. AI is a tool; the engineer signs the work.`,
    status: "draft",
    tags: ["AI", "Workflow"],
  },
];

async function seedBlog() {
  for (const t of blogTags) {
    await BlogTagModel.findOneAndUpdate(
      { slug: t.slug },
      { $set: { name: t.name }, $setOnInsert: { slug: t.slug } },
      { upsert: true },
    );
  }
  // Build a name → id map so each post can embed tagIds.
  const allTagDocs = await BlogTagModel.find({}).select({ _id: 1, name: 1 }).lean();
  const tagIdByName = new Map(
    allTagDocs.map((t) => [t.name as string, t._id]),
  );

  for (const post of blogPosts) {
    const existing = await BlogPostModel.findOne({ slug: post.slug }).lean();
    if (existing) continue;
    const tagIds = post.tags
      .map((name) => tagIdByName.get(name))
      .filter((id): id is Types.ObjectId => Boolean(id));
    await BlogPostModel.create({
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      bodyMd: post.bodyMd,
      status: post.status,
      publishedAt: post.status === "published" ? new Date() : null,
      tagIds,
    });
  }
}

async function main() {
  await connect();
  console.log("→ seeding profile…");
  await seedProfile();
  console.log("→ seeding experiences…");
  await seedExperiences();
  console.log("→ seeding education…");
  await seedEducation();
  console.log("→ seeding certifications…");
  await seedCertifications();
  console.log("→ seeding skills…");
  await seedSkills();
  console.log("→ seeding projects…");
  await seedProjects();
  console.log("→ seeding blog…");
  await seedBlog();
  console.log("✓ done");
  await disconnect();
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  });