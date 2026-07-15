# bit10086.me

Academic homepage for Yubo Wang. The site is a static Vite + TypeScript project deployed with GitHub Pages. It presents selected research and publications first, followed by education, open questions, and collaboration links in English and Chinese.

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

The language switch is implemented client-side and remembers the visitor's preference in `localStorage`.

The site intentionally omits the phone number and address from the source resume. Add a downloadable CV only after producing and reviewing a public-safe version.
