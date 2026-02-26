# Photo Portfolio React (Next.js) 📸✨

A modern **photography portfolio + member area** built with **Next.js (App Router)**, **TypeScript**, **Tailwind**, and **Prisma/MySQL**.  
Designed with a sleek **glass/soft-neon UI** and an admin experience for managing galleries, photos, and page content.

> This repo is the foundation for a portfolio site that can evolve into a community-style platform (member profiles, sharing, messaging, etc.).

---

## Features

### Public site

- **SEO-friendly pages** (clean routing, metadata-ready structure)
- **Homepage hero / carousel** for featured work
- **Gallery pages** with modern layout + lightbox-style viewing
- Optional **blog/content pages** (markdown-based or page builder approach)

### Member + Admin

- **Email/password authentication** (no social login required)
- **Admin dashboard** for:
  - Managing galleries (create/edit/publish)
  - Uploading and ordering photos
  - Optional media library workflows (reuse images across galleries)
- **Page builder/editor** support (e.g., TinyMCE integration)

### UI / DX

- **GlassCard / glassmorphism** components as a consistent design language
- Tailwind-driven design system (easy theme iteration)
- Prisma-powered DB access with a clean server component pattern

---

## Tech Stack

- **Next.js** (App Router) + **React** + **TypeScript**
- **Tailwind CSS**
- **Prisma ORM**
- **MySQL** (local or hosted)
- Optional:
  - **TinyMCE** (rich text editor for page builder)
  - S3-compatible object storage (e.g., **Cloudflare R2**) for photo storage

---

## Getting Started

### Prerequisites

- Node.js **18+** (Node **20+** recommended)
- MySQL **8+**
- Package manager: `npm`, `pnpm`, or `yarn`

### 1) Clone & install

```bash
git clone <your-repo-url>
cd photo-portfolio-react
npm install
```

## Getting Started

### 2) Configure environment variables

Create a `.env` file in the project root:

```bash
# Database
DATABASE_URL="mysql://USER:PASSWORD@HOST:3306/DATABASE"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
AUTH_SECRET="replace-with-a-long-random-secret"

# TinyMCE (optional)
TINYMCE_API_KEY="your_tinymce_key"

# Storage (optional - S3/R2 style)
S3_ENDPOINT="https://<account-or-provider-endpoint>"
S3_ACCESS_KEY_ID="..."
S3_SECRET_ACCESS_KEY="..."
S3_BUCKET="..."
S3_PUBLIC_BASE_URL="https://<your-public-cdn-or-bucket-url>"
```

### 3) Set up the database

```bash
npx prisma generate
npx prisma migrate dev
```

### 4) Run the app

```bash
npm run dev
Open: http://localhost:3000
```

## Scripts

# Typical scripts you’ll see in package.json:

```bash
npm run dev       # Start dev server
npm run build     # Production build
npm run start     # Run production server
npm run lint      # Lint code
```

## Project Structure (high-level)

```Plain text

.
├─ app/                 # Next.js App Router routes
│  ├─ (public)/         # Public pages (home, galleries, etc.)
│  ├─ admin/            # Admin routes (protected)
│  ├─ api/              # API routes (uploads, delete, auth helpers, etc.)
│  └─ ...
├─ components/          # Reusable UI components (GlassCard, carousel, tables)
├─ lib/                 # Helpers (db, auth utilities, storage client)
├─ prisma/              # Prisma schema + migrations
├─ public/              # Static assets (fallback images, icons, etc.)
└─ README.md
```

## Authentication Notes

This project is designed for **credentials (email/password)** authentication.

Admin-only navigation/routes should be protected so they:

- show only when authenticated
- remain inaccessible via direct URL when logged out

If your auth implementation uses a specific library (e.g. NextAuth, BetterAuth, custom sessions), document the exact env vars and setup here.

## Photo Storage

You can run this project in two common ways:

**Option A: Local storage (simple)**

- Store images in public/ (good for early prototyping)

- Fast and easy, but not ideal for scaling

**Option B: Object storage (recommended)**

- Store originals in an S3-compatible provider (e.g., Cloudflare R2)

- Save only metadata + object keys in MySQL

- Serve via a public base URL (or signed URLs)

Keep originals private if needed; generate public-sized versions for galleries.

## Deployment

You can deploy to:

- Vercel (easy for Next.js)

- Docker (recommended for self-hosting)

- Any Node hosting provider

Make sure you configure:

- DATABASE_URL for production

- NEXT_PUBLIC_APP_URL

- AUTH_SECRET

- storage variables (if using R2/S3)

- any analytics scripts (GA) in the appropriate layout/head

## Roadmap Ideas

- Auto cover generation (use first/latest photo if no cover is set)

- Upload progress UI + background processing

- “Pick from Media Library” button to reuse existing images

- Delete photo API route + confirm modal

- Enhanced gallery UX (keyboard nav, swipe, EXIF overlays)

- Member profile showcases (/profile/[username])

## Contributing

- Fork the repo

- Create a feature branch: git checkout -b feature/my-change

- Commit: git commit -m "Add: thing"

- Push: git push origin feature/my-change

- Open a PR

## Acknowledgements

- Built on top of a modern Next.js/Tailwind stack

- UI/admin foundation influenced by TailAdmin-style patterns (where applicable)
