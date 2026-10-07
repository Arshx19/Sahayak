# SAHAYAK Frontend

React + Vite + JavaScript (JSX) + Tailwind CSS v4 + React Router.

## Run

```bash
npm install
cp .env.example .env
npm run dev
```

Build: `npm run build` · Preview: `npm run preview`

## Layout

- `src/pages` – route pages
- `src/components` – reusable UI
- `src/data` – translations + mock schemes/grievances/profile
- `src/services/api.js` – the only place that talks to data (mock now, FastAPI later)
- `src/utils/translations.js` – `getTranslation(language, key)`

## Connecting FastAPI

Set `VITE_API_BASE_URL` in `.env`. In `src/services/api.js`, swap each mock body
for the `request()` helper, e.g. `checkEligibility = (d) => request('/eligibility/check', { method: 'POST', body: JSON.stringify(d) })`.
Pages and components do not change.

> Note: SPA deep links (e.g. `/schemes/pm-kisan`) work in `npm run dev`; in production, configure the host to fall back to `index.html`.
