# bit10086.me

Personal homepage for Yubo Wang. The site is a static Vite + TypeScript project deployed with GitHub Pages. Its content is intentionally identity-first: a short introduction, current interests, education, and a few external links rather than a project-heavy portfolio.

## Local development

```powershell
npm install
npm run dev
```

Open `http://127.0.0.1:5173`.

## Production build

```powershell
npm run build
npm run preview
```

The deployable output is written to `dist/`.

## GitHub Pages

Pushes to `main` run `.github/workflows/deploy.yml`, build the Vite site with Node.js 22, and deploy `dist/` to GitHub Pages. The custom domain is declared in `public/CNAME` as `bit10086.me`.

The site intentionally omits the phone number from the source resume. Add a downloadable CV only after reviewing which personal details should be public.
