### PWA Health & Runtime Audit

**1. Service Worker Registration**
- [x] `vite-plugin-pwa` auto-injection is configured.
- [x] `src/main.tsx` updated to use `virtual:pwa-register` for explicit control over updates.
- [ ] **Testing**: Needs to be verified in a build preview to ensure the SW actually claims clients and caches assets.

**2. Blank Screen Prevention**
- [x] Env vars added (`.env` files created). This was the most likely cause of the blank screen (Firebase initialization failure).
- [x] Manifest conflict resolved (consolidated into `vite.config.ts`).
- [x] `index.html` mount point verified.
- [x] Console logs added to `main.tsx` for debugging.

**3. Deployment Readiness**
- [x] `firebase.json` rewrites are correct.
- [x] `vite.config.ts` output directory (`dist`) matches `firebase.json`.

**Next Steps (User Action Required):**
1. **Fill Secrets**: You MUST edit `.env.development` and `.env.production` with your actual Firebase config keys. I left placeholders.
2. **Build & Preview**: Run `npm run build` and `npm run preview` locally to confirm the app boots without errors.
3. **Deploy**: Once verified, run `firebase deploy --only hosting`.
