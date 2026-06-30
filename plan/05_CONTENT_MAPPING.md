# 05 — Content Mapping

How the source files (`ai-context/*.md` + extracted CV text) populate the database seed
(`prisma/seed.ts`). Re-runnable, idempotent (`upsert` on natural keys). CV wins for facts;
ai-context wins for tone, philosophy, design rules, content rules.

## profile (single row, id=1)

| Field | Source |
| --- | --- |
| name | CV → "Md Kamal Hosen" |
| role | CV → "Building Management System (BMS) Engineer"; site header uses "Building Management System Engineer" |
| tagline | plan → "Building Management System Engineer commissioning HVAC plants and shipping the software that runs them." |
| location | CV → "Riyadh, Saudi Arabia" |
| relocate | ai-context FAQ → true |
| email | CV → mdkamalhosennn@gmail.com |
| phone | CV → +966 58 347 1377 |
| linkedin_url | CV → linkedin.com/in/mdkamalhosennn |
| github_url | owner to provide |
| whatsapp | owner to provide (or duplicate phone) |
| summary | CV → professional summary paragraph (dedicated, follower of writing rules) |
| mission | `01_PROFILE.md` → "To become an internationally recognized Building Automation Engineer while combining software engineering and AI to build smarter buildings." |
| philosophy | `05_SOFTWARE.md` → first two lines + examples list |
| values | action-verb phrased, derived from `07_WRITING_STYLE.md` verbs |
| availability | open |
| avatar_url | leave null; owner uploads later |
| cv_pdf_url | `/cv/kamal-hosen-cv.pdf` (file provided by owner) |

## experiences (4 rows, ordered timeline)

| company | role | country/city | dates | bullets (action verb) | stack | marquee |
| --- | --- | --- | --- | --- | --- | --- |
| GLSAN Contracting Company | BMS Engineer | Riyadh, Saudi Arabia | Sep 2025 – Present (current) | Lead testing, commissioning, optimisation of BMS networks at KAFD · Develop logic programming, system configurations, graphics using Honeywell Alerton and Niagara 4 · Perform functional testing of HVAC systems, validate control sequences · Diagnose complex BMS integration faults, improve system performance · Collaborate with consultants, contractors, vendors | Honeywell Alerton, Niagara 4, BACnet, Modbus, HVAC | King Abdullah Financial District (KAFD) |
| Stark Security Services | BMS Testing & Commissioning Engineer | Doha, Qatar | Nov 2023 – Aug 2025 | Programmed and commissioned Honeywell BMS systems (DDC logic + HVAC control strategies) · Integrated third-party equipment via BACnet, Modbus, M-Bus · Executed commissioning procedures, troubleshooting, system validation · Prepared commissioning reports, test documentation, as-built records | Honeywell, DDC, BACnet, Modbus, M-Bus | — |
| Stark Security Services | BMS Operator | Doha, Qatar | Jul 2020 – Oct 2023 | Monitored HVAC, lighting, energy management systems through central BMS · Responded to system alarms, coordinated with maintenance teams · Performed system inspections, supported energy optimisation initiatives | BMS, HVAC, Energy Management | — |
| Hassanesco | BMS Technician | Doha, Qatar | Jul 2019 – Jul 2020 | Installed and configured sensors, actuators, DDC controllers · Supported commissioning teams during system testing and deployment · Performed preventive maintenance, documented system updates | DDC, Sensors/Actuators | — |

## education (2 rows)

| degree | institution | years | status |
| --- | --- | --- | --- |
| Bachelor of Arts | Bangladesh Open University | start 2024 – end 2027 | ongoing |
| Diploma in Electrical Engineering | Bangladesh Youth Technical Training | end 2016 | completed |

## certifications (6 rows)

| name | issuer | year |
| --- | --- | --- |
| Niagara 4 BACnet Driver | Tridium University | (year null, owner edits) |
| Commissioning a JACE | Tridium University | (year null) |
| BACnet Engineering | Honeywell Buildings University | (year null) |
| Honeywell VFD Training | Honeywell Buildings University | (year null) |
| Networking Fundamentals | Honeywell Buildings University | (year null) |
| Cyber Security in BAS Systems | Honeywell Buildings University | (year null) |

## skill_groups + skills

Groups synced from `03_SKILLS.md`:

### BMS
Honeywell Alerton · Tridium Niagara 4 · DDC Controllers · BACnet (IP/MSTP) · Modbus (RTU/TCP) · M-Bus · HVAC Control Logic · Functional Testing · Energy Optimisation · System Fault Analysis · Network Debugging · Graphics

### Programming
Java · JavaScript · Python · Node.js · React · Next.js · PHP · MySQL · SQLite · MongoDB · Prisma

### IoT
ESP8266 · MQTT · REST API · Sensor integration

### AI Tools
ChatGPT · Claude · Gemini · Cursor · GitHub Copilot

### Cloud / Backend (added — not in ai-context, found in CV competencies + dev list)
Firebase · Supabase · Linux · Git · GitHub

Each row level 3–5 placeholder (owner tunes via admin later). `platform` filled where natural
(e.g., Honeywell Alerton for BACnet Engineering on Honeywell platform).

## projects (seed)

Seed only what is both factual and anonymizable. Owner expands later via admin.

| slug | title | category | year | excerpt | key fields |
| --- | --- | --- | --- | --- | --- |
| kafd-bms-commissioning | KAFD District — BMS Commissioning | bms | 2025 | "Commissioning BMS networks across the King Abdullah Financial District." | problem: anonymous; role: "BMS Engineer"; stack: Honeywell Alerton, Niagara 4, BACnet, Modbus; outcome: site reliability (metrics owner supplies); lessons: placeholder |
| red-palace | Red Palace — BMS Integration | bms | (owner) | "BMS commissioning and graphics deliverables for a heritage commercial site." | anonymized |
| resume-builder | Resume Builder | software | (owner) | "A web tool to generate role-targeted resumes from structured data." | role: solo dev; stack: Next.js, Prisma, Supabase |
| attendance-system | Attendance System | software | (owner) | "Time-and-attendance tracking built for small engineering teams." | |
| iot-dashboard | IoT Dashboard | iot | (owner) | "Real-time MQTT dashboard for ESP8266 sensor networks." | stack: Node.js, MQTT, ESP8266 |
| smart-home-android | Smart Home — Android App | android | (owner) | "Home automation companion app for BMS systems." | stack: Android, REST |
| 100k-downloads-android | (Android app — pending owner title) | android | (owner) | "Published on Google Play with 100,000+ downloads." | owner supplies title + privacy-safe outcome |

Featured 3 on home: `kafd-bms-commissioning`, `resume-builder`, `100k-downloads-android`
(owner swaps easily from admin).

## blog_posts (seed)

Seed 2–3 starter drafts to demonstrate the blog works; owner finishes them.

| slug | title | tags | body_md source |
| --- | --- | --- | --- |
| bacnet-vs-modbus-brief | BACnet vs Modbus: A Short Reference | [bms, protocols] | generated skeleton with code-block sample frame |
| commissioning-niagara-4-site | Commissioning a Niagara 4 Site — Checklist | [bms, niagara] | placeholder with anonymized checklist headings |
| how-i-use-ai-in-engineering | How I Use AI in My Engineering Workflow | [ai, workflow] | expanded from `08_FAQ.md` AI section |

Status: `draft`. Owner edits in admin, switches status to `published`, instant revalidate.

## messages

Empty at seed. Contact form inserts rows on public submission.

## out of scope for seed

- Activity log (grows naturally).
- Project screenshots (owner uploads anonymized via admin → Supabase Storage).
- Avatar / cover images.
- Salary, IDs, employer-confidential data — never seeded (per `09_CONTENT_RULES.md`).