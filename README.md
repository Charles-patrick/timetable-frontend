# Timetable System — Frontend

Next.js (App Router) + JavaScript/JSX + Tailwind CSS.
Talks to the `timetable-backend` Express API over HTTP.

---

## 1. Requirements

- Node.js v18 or higher
- npm
- The backend already running (see `timetable-backend/README.md`) — this frontend has nothing to show without it

---

## 2. What's included so far

```
timetable-frontend/
├─ app/
│  ├─ layout.jsx        → root layout, loads fonts + global styles
│  ├─ globals.css        → Tailwind + base styles
│  ├─ page.jsx            → public landing page
│  └─ login/page.jsx      → login form, calls the backend, redirects by role
├─ lib/
│  └─ api.js              → fetch wrapper (base URL, cookies, error handling)
├─ middleware.js           → redirects unauthenticated visits to /dashboard or /my-timetable
├─ tailwind.config.js       → design tokens (colors, fonts)
├─ .env.local.example
└─ package.json
```

More pages (`/dashboard`, `/courses`, `/lecturers`, `/timetable`, `/my-timetable`, etc.) get added here the same way, one feature at a time — same as the backend.

**Design direction:** a "registrar's chalkboard" palette (deep green + chalk white + amber accent) with a ruled timetable-grid motif, instead of a generic template look. Colors and fonts are defined as tokens in `tailwind.config.js` and `app/layout.jsx` so they're easy to adjust later.

---

## 3. Setup Instructions

### Step 1 — Install dependencies

```bash
cd timetable-frontend
npm install
```

### Step 2 — Create your `.env.local` file

```bash
cp .env.local.example .env.local
```

Open it and confirm it points at your backend:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

Change the port/URL here if your backend runs somewhere else.

### Step 3 — Start the backend first

In a separate terminal:
```bash
cd ../timetable-backend
npm run dev
```

Confirm it's up: `curl http://localhost:5000/api/v1/health`

### Step 4 — Start the frontend

```bash
npm run dev
```

Open http://localhost:3000 — you should see the landing page.

### Step 5 — Test login

Go to http://localhost:3000/login and sign in with the admin account you seeded on the backend (`npm run seed:admin`). A successful login redirects to `/dashboard` (admin) or `/my-timetable` (lecturer) — those pages don't exist yet, so you'll briefly see a 404 until we build them next. That's expected at this stage; it confirms the login → cookie → redirect flow is working end-to-end.

---

## 4. How auth works here

- On login, the backend sets **two cookies**: an `httpOnly` JWT (`token`) that does the real authorization on every API request, and a plain, readable `role` cookie used only by `middleware.js` to decide which pages to redirect to.
- `middleware.js` is a fast UX guard, not the security boundary — even if someone tampered with the `role` cookie, every actual backend request is still checked against the real `token` cookie, which JavaScript can never read or modify.
- `lib/api.js` sends `credentials: 'include'` on every request so the cookie goes along automatically — you never handle the token directly in frontend code.

---

## 5. Environment Variables Reference

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Full base URL of the backend API, including `/api/v1` |

---

## 6. Deployment Notes

- Deploy separately from the backend (e.g. Vercel).
- Set `NEXT_PUBLIC_API_URL` in your host's environment variables to the backend's real deployed URL.
- Make sure the backend's `FRONTEND_URL` env var is updated to match this frontend's real deployed URL — CORS will block requests otherwise.
- Both frontend and backend must be served over HTTPS in production for the auth cookies to work (`secure: true` cookies are rejected over plain HTTP).

---

## 7. Common Issues

| Problem | Fix |
|---|---|
| Login request fails with a network/CORS error | Check `NEXT_PUBLIC_API_URL` is correct and the backend is running; check the backend's `FRONTEND_URL` matches `http://localhost:3000` exactly |
| Login succeeds but redirect loops back to `/login` | The `role` cookie may not be getting set — check the backend response headers in devtools for `Set-Cookie`, and confirm both apps are on `http://localhost` (not `127.0.0.1` on one and `localhost` on the other — cookies are origin-specific) |
| Fonts fail to load during `npm run build` | Requires internet access to fonts.googleapis.com at build time — won't happen on a normal machine or on Vercel, only in fully offline/sandboxed environments |
