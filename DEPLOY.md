# DEPLOY.md

## Deployment Notes (Hostinger Static Website)

This project is built with **Vite** and deployed as a **static website** on Hostinger.

### Deployment target

The app is hosted inside this subdirectory:

```txt
/systeme_solaire_reactui_threejs/
```

So the production build must use the correct Vite `base` path.

---

## Important configuration

### Vite base path

In `vite.config.ts`:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/systeme_solaire_reactui_threejs/",
});
```

This ensures all built asset URLs are generated correctly for subdirectory hosting.

---

## Static assets

All static assets must live inside the `public/` folder.

### Required folders

```txt
public/
├── textures/
├── images/
├── audio/
├── sounds/     (if used separately)
├── musics/     (if used separately)
```

### Why

With Vite, files in `public/` are copied as-is into the production `dist/` folder.

Examples:

- `public/textures/2k_sun.jpg`
- `public/images/sky/2k_stars.jpg`
- `public/audio/sounds/mixkit-sci-fi-error-alert-898.wav`

---

## Asset path rule

Do **not** rely on fragile relative paths like:

```txt
./textures/2k_sun.jpg
```

Instead, use the shared helper:

```js
resolveAssetUrl(...)
```

The helper normalizes legacy paths and prefixes them with:

```js
import.meta.env.BASE_URL;
```

So these inputs:

- `./textures/2k_sun.jpg`
- `textures/2k_sun.jpg`
- `./images/sky/2k_stars.jpg`

become deployment-safe URLs such as:

```txt
/systeme_solaire_reactui_threejs/textures/2k_sun.jpg
/systeme_solaire_reactui_threejs/images/sky/2k_stars.jpg
```

External URLs are left unchanged.

---

## Build locally

Run:

```bash
npm run build
```

This generates the production output in:

```txt
dist/
```

---

## Preview locally

Always test the production build with:

```bash
npm run preview
```

Do **not** rely on opening `dist/index.html` directly in a generic local server if asset paths appear broken.

---

## Hostinger upload rule

Upload the **contents** of `dist/` into:

```txt
public_html/systeme_solaire_reactui_threejs/
```

### Correct structure on Hostinger

```txt
public_html/
├── index.php (or root landing page)
├── systeme_solaire_reactui_threejs/
│   ├── index.html
│   ├── assets/
│   ├── textures/
│   ├── images/
│   ├── audio/
│   └── ...
```

### Important

Do **not** upload the `dist` folder itself as:

```txt
public_html/systeme_solaire_reactui_threejs/dist/
```

Instead, upload the **files inside `dist/`** directly into the target folder.

---

## Final production URL

Preferred URL:

```txt
https://your-domain/systeme_solaire_reactui_threejs/
```

This should also work:

```txt
https://your-domain/systeme_solaire_reactui_threejs/index.html
```

---

## Quick deployment checklist

- [ ] `vite.config.ts` uses the correct `base`
- [ ] all static assets are inside `public/`
- [ ] asset URLs go through `resolveAssetUrl()` when needed
- [ ] `npm run build` passes
- [ ] `npm run preview` works locally
- [ ] upload **contents** of `dist/`, not the `dist` folder itself
- [ ] verify production URL after upload

---

## Common pitfalls

### 1. Blank page or MIME type errors

Usually caused by:

- wrong `base` path
- missing `assets/` folder
- uploading to the wrong directory

### 2. Textures/images not loading

Usually caused by:

- files not placed in `public/`
- URLs still resolving to `/images/...` instead of the subdirectory path
- missing upload of `textures/` or `images/`

### 3. Works locally, fails online

Usually caused by:

- using `npm run dev` assumptions instead of testing with `npm run preview`
- incorrect Hostinger folder structure
- stale files from an old upload

---

## Recommended deployment flow

```bash
npm run build
npm run preview
```

Then:

1. clear or replace the old files in Hostinger
2. upload the contents of `dist/`
3. test the production URL
4. hard refresh the browser if needed

---

## Suggested commit message for deployment fixes

```bash
git commit -m "Fix Hostinger deployment with Vite base path and public asset resolution"
```
