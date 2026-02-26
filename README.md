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
