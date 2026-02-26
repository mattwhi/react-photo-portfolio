# Photo Portfolio (React + Next.js) — Starter

This is a **React** photo-portfolio starter built with **Next.js (React)**, Tailwind (glass/pastel theme), Prisma, and a simple admin area.

## 1) Prereqs

- Node.js **20.9+** (recommended)  
- A package manager: npm / pnpm / yarn

## 2) Install & run

```bash
# 1) install deps
npm install

# 2) create your env file
cp .env.example .env

# 3) create db + tables
npx prisma migrate dev --name init

# 4) seed admin user + sample galleries/photos
npm run seed

# 5) start dev server
npm run dev
```

Open: http://localhost:3000

## 3) Admin login

Go to: http://localhost:3000/admin/login

Default seed credentials come from your `.env`:
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

## 4) Upload photos (starter = local storage)

Admin upload saves images to:
- `public/uploads/<gallerySlug>/...`

Photo URLs are stored as `/uploads/<gallerySlug>/<filename>`.

**Production note:** if you deploy to serverless platforms, local disk uploads won’t persist.
The next step is switching uploads to Cloudflare R2 / S3 using presigned URLs.

## 5) What to edit first

- `app/page.tsx` (homepage gallery list)
- `app/g/[slug]/page.tsx` (gallery page + carousel)
- `components/PhotoCarousel.tsx` (carousel behavior)
- `app/admin/*` (admin UI)

## 6) “Starting React” in 60 seconds

- React apps are built from **components** (functions returning UI).
- State lives in components (`useState`) and UI updates when state changes.
- Next.js gives you routing (`app/` folder), server-side rendering, and API routes.

Happy building 🤝
