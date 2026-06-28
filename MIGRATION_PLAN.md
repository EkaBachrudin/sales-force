# Rencana Migrasi: Next.js → React + Vite

Migrasi menyeluruh project `sales-force-fe` (Next.js) ke `sales-force-fe-react` (React + Vite), beserta seluruh konfigurasi Docker, Nginx, dan CI/CD.

---

## Status Saat Ini

### `sales-force-fe-react` (Vite) — Fondasi SUDAH termigrasi

Komponen, hooks, lib, contexts, dan providers berikut sudah dipindahkan dengan pola transformasi:

- `next/link` → `react-router-dom`
- `usePathname()` → `useLocation().pathname`
- `useRouter().push()` → `useNavigate()`
- hapus directive `'use client'`

**Sudah ada:**

| Area | File |
|---|---|
| Components (29 file) | `src/components/**` (layout, dashboard, ui, analytics, users, settings, subscriptions, pwa) |
| Hooks (9 file) | `src/hooks/useDashboard.ts`, `useLeads.ts`, `usePipeline.ts`, `useProperties.ts`, `useAnalytics.ts`, `useUsers.ts`, `useSubscriptions.ts`, `useDebounce.ts`, `usePWAInstall.ts` |
| Lib | `src/lib/api.ts` (pakai `VITE_API_URL`), `types.ts`, `utils.ts`, `mockData.ts`, `types/auth.ts` |
| Context/Provider | `src/contexts/AuthContext.tsx`, `src/providers/QueryProvider.tsx` (pakai `import.meta.env`) |
| Services | `src/services/propertyService.ts` |
| Public Assets | `public/manifest.json`, `icon-192.png`, `icon-512.png`, `sforce-logo.webp`, `sforce-icon.webp`, `favicon.svg` |
| Styling | `src/index.css` (globals.css sudah termigrasi) |
| Entry | `src/main.tsx` (font via `@fontsource-variable`), `index.html` (PWA meta) |
| Config | `vite.config.ts` (PWA via `vite-plugin-pwa`, alias `@`, proxy `/api` → `localhost:4000`), `.env.example` |

### Yang BELUM ada (yang harus dikerjakan)

- `src/pages/` — 10 route halaman belum dikonversi dari `app/*/page.tsx`
- `App.tsx` — masih placeholder, belum ada router
- Endpoint `/api/submit-interest` — **KEPUTUSAN: tidak dimigrasi**, code fetch di-comment
- `lib/security/` — tidak perlu dipindah (hanya dipakai submit-interest)
- `google-sheets-script.gs` — perlu disalin sebagai dokumentasi
- `Dockerfile` Vite (SPA + nginx)
- Update 5 file docker-compose
- Update 3 file nginx conf.d + nginx.conf
- Update GitHub Actions workflow
- Update root `.env.example` dan `Makefile`

---

## Keputusan Arsitektur

1. **Endpoint `/api/submit-interest`**: TIDAK dimigrasi. Pada halaman `/features`, blok `fetch('/api/submit-interest')` di-comment dengan catatan TODO. `lib/security/` tidak dipindahkan.
2. **Nama folder**: Tetap `sales-force-fe-react`. Semua konfigurasi Docker/Nginx/CI menargetkan path `./sales-force-fe-react`.

---

## Pola Transformasi (Cheat Sheet)

| Next.js | React + Vite |
|---|---|
| `'use client'` | (hapus) |
| `import Link from 'next/link'` | `import { Link } from 'react-router-dom'` |
| `<Link href="/x">` | `<Link to="/x">` |
| `import { usePathname } from 'next/navigation'` | `import { useLocation } from 'react-router-dom'` |
| `const pathname = usePathname()` | `const { pathname } = useLocation()` |
| `import { useRouter } from 'next/navigation'` | `import { useNavigate } from 'react-router-dom'` |
| `const router = useRouter(); router.push('/x')` | `const navigate = useNavigate(); navigate('/x')` |
| `import { redirect } from 'next/navigation'; redirect('/x')` | `<Navigate to="/x" replace />` |
| `import { Geist } from 'next/font/google'` | `import '@fontsource-variable/geist'` (di `main.tsx`) |
| `process.env.NEXT_PUBLIC_API_URL` | `import.meta.env.VITE_API_URL` |
| `app/x/page.tsx` (file-based routing) | `src/pages/X.tsx` + route di `App.tsx` |
| `export const metadata` (layout.tsx) | `<title>` di `index.html` / `<DocumentTitle />` |
| `app/api/route.ts` (server route) | Tidak ada — pindah ke backend atau dihapus |

---

## Fase 1 — Routing & Konversi 10 Pages

### 1.1 Buat `src/App.tsx` dengan router

Struktur route:

```
/                     → <Navigate to="/dashboard" />
/login                → LoginPage          (public)
/features             → FeaturesPage        (public)
/dashboard            → DashboardPage       (protected)
/leads                → LeadsPage           (protected)
/pipeline             → PipelinePage        (protected)
/analytics            → AnalyticsPage       (protected)
/properties           → PropertiesPage      (protected)
/users                → UsersPage           (protected, roles: Admin|Supervisor)
/subscriptions        → SubscriptionsPage   (protected, roles: Admin)
/settings             → SettingsPage        (protected)
*                     → <Navigate to="/dashboard" />
```

- Tambahkan layout route yang membungkus halaman protected dengan `DashboardLayout`.
- Sertakan `<DocumentTitle />` dan `<PWAInstallPrompt />` di root.

### 1.2 Buat `src/components/ProtectedRoute.tsx`

Komponen role-gate untuk menggantikan pengecekan role inline di `/users` dan `/subscriptions`:

- Cek `isLoading` dari `useAuth()` → tampilkan loading spinner
- Cek `isAuthenticated` → redirect ke `/login` jika belum login
- Cek `roles` prop → redirect ke `/dashboard` jika role tidak diizinkan

### 1.3 Konversi 10 halaman

| Route | Sumber Next.js | Catatan |
|---|---|---|
| `/` | `app/page.tsx` | Hanya `redirect('/dashboard')` → `<Navigate to="/dashboard" replace />` |
| `/login` | `app/login/page.tsx` (134L) | `api.login`, `fetchUser`, `InstallPWABanner` |
| `/features` | `app/features/page.tsx` (1129L) | **Comment blok `fetch('/api/submit-interest')` + TODO**. `next/link` → `react-router-dom` |
| `/dashboard` | `app/dashboard/page.tsx` | `MetricsCard`, `RemindersSection`, `NewLeadModal` |
| `/leads` | `app/leads/page.tsx` (596L) | Filter, pagination, `LeadDetailPanel`, `EditLeadModal` |
| `/pipeline` | `app/pipeline/page.tsx` (250L) | `KanbanBoard`, `transformPipelineLeadToLead` |
| `/analytics` | `app/analytics/page.tsx` (203L) | Charts, range 1/3/6/12/24 bulan |
| `/properties` | `app/properties/page.tsx` (418L) | CRUD dengan `PropertyModal` inline |
| `/users` | `app/users/page.tsx` (496L) | Role-gate `['Admin','Supervisor']` → pakai `<ProtectedRoute>` |
| `/settings` | `app/settings/page.tsx` (128L) | `ChangePasswordModal`, redirect ke `/login` |
| `/subscriptions` | `app/subscriptions/page.tsx` (526L) | Role-gate `['Admin']` → pakai `<ProtectedRoute>` |

---

## Fase 2 — Entry Point & Provider Tree

Update `src/main.tsx` dengan urutan provider sesuai `layout.tsx` Next.js:

```tsx
<StrictMode>
  <BrowserRouter>
    <AuthProvider>
      <QueryProvider>
        <App />
      </QueryProvider>
    </AuthProvider>
  </BrowserRouter>
</StrictMode>
```

Verifikasi:
- `<DocumentTitle />` dan `<PWAInstallPrompt />` dirender di root `App.tsx`
- `globals.css` nextjs vs `index.css` react hanya beda font variable & komentar — sudah OK

---

## Fase 3 — Static Assets

- Salin `public/features/*.png` (screenshot halaman features) dari Next.js ke Vite — verifikasi sudah ada.
- Salin `google-sheets-script.gs` ke root `sales-force-fe-react/` sebagai dokumentasi setup Google Sheets (meskipun endpoint tidak aktif).

---

## Fase 4 — Dockerfile Vite (SPA + Nginx)

Ganti Dockerfile Next.js (`node server.js` standalone SSR) dengan multi-stage Vite:

```dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Stage 2: Development
FROM node:20-alpine AS development
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=development
EXPOSE 3000
CMD ["npm", "run", "dev"]

# Stage 3: Builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Stage 4: Production (nginx serve static SPA)
FROM nginx:alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Buat `nginx.conf` internal kontainer FE dengan **SPA fallback**:

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /assets/* {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## Fase 5 — Docker Compose (5 file)

Semua menargetkan path `./sales-force-fe-react`:

### `docker-compose.yml` (base)
- `build.context: ./sales-force-fe-react`
- `build.args: VITE_API_URL=${VITE_API_URL:-http://localhost:4000}`
- healthcheck: `wget http://localhost` (port 80 internal nginx)
- hapus `NEXT_PUBLIC_API_URL`, ganti dengan `VITE_API_URL`

### `docker-compose.dev.yml`
- `volumes: ./sales-force-fe-react:/app` + `/app/node_modules`
- `command: npm run dev`
- `ports: ${FRONTEND_PORT:-3000}:3000`

### `docker-compose.prod.yml`
- env `VITE_API_URL` (bukan `NEXT_PUBLIC_API_URL`)

### `docker-compose.local-prod.yml`
- (tidak ada perubahan selain path induk)

### `docker-compose.registry.yml`
- env `VITE_API_URL=${VITE_API_URL}`

---

## Fase 6 — Nginx Config (3 conf.d + nginx.conf)

Karena frontend sekarang **SPA statis** (bukan SSR Next.js):

### Perubahan di semua file conf.d (`default.conf`, `production.conf`, `local-prod.conf`):

- **Hapus** blok `/_next/static` (tidak relevan di Vite)
- **Tambah** blok `/assets/*` untuk cache asset hasil build Vite (hashed)
- `location /` → tetap proxy ke `frontend` (nginx internal kontainer FE), SPA fallback ditangani oleh nginx internal
- Pertahankan blok `/api` → backend, `/health` → backend

### Contoh blok `location /assets`:

```nginx
location /assets {
    proxy_pass http://frontend;
    proxy_cache_valid 200 60m;
    add_header Cache-Control "public, immutable";
}
```

### `nginx.conf` (main)
- Tidak ada perubahan struktural (upstream `frontend:80` alih-alih `:3000` bila perlu)

---

## Fase 7 — CI/CD & Root Config

### `.github/workflows/deploy.yml`
- Step "Build and push Frontend": `context: ./sales-force-fe-react`
- `build-args: VITE_API_URL=${{ vars.VITE_API_URL }}` (ganti `NEXT_PUBLIC_API_URL`)

### Root `.env.example`
- `NEXT_PUBLIC_API_URL` → `VITE_API_URL`

### `Makefile`
- Target `install`: `cd sales-force-fe-react && npm install`

### `DEPLOYMENT.md`
- Update struktur folder: `sales-force-fe/ (Next.js)` → `sales-force-fe-react/ (React + Vite)`
- Update catatan port (FE production: nginx port 80)

---

## Fase 8 — Verifikasi

1. **Build lokal**:
   ```bash
   cd sales-force-fe-react
   npm run lint && npm run build
   ```
2. **Dev server**: `npm run dev` — test semua route, auth flow, dan PWA
3. **Docker dev**: `make dev` — verifikasi hot reload + proxy API
4. **Docker prod lokal**: `make local-prod-build && make local-prod` — verifikasi nginx + SPA fallback (refresh deep link harus tidak 404)
5. Smoke test setiap fitur: login, dashboard, leads CRUD, pipeline kanban, analytics charts, properties CRUD, users (role-gate), subscriptions (role-gate), settings ganti password.

---

## Catatan Tambahan

- **`lib/types/auth.ts`**: Ada inkonsistensi tipe role (`'admin'|'manager'|'sales'`) vs UI yang pakai (`'Admin'|'Supervisor'|'Sales'`) — sudah ada di source Next.js, dipertahankan apa adanya saat migrasi.
- **`middleware.ts` Next.js**: No-op (auth sepenuhnya client-side via `AuthContext`) — SPA Vite tidak butuh middleware.
- **Env var di runtime**: Vite inlines `VITE_*` saat build. Untuk runtime config (ubah tanpa rebuild), perlu strategi terpisah (mis. inject via nginx atau file `config.js` di `public/`). Untuk saat ini, pakai build-time arg saja.
- **PWA**: `next-pwa` sudah diganti `vite-plugin-pwa` (sudah dikonfigurasi di `vite.config.ts`).
- **Fonts**: `next/font/google` sudah diganti `@fontsource-variable/geist` + `geist-mono` (sudah di `main.tsx`).
