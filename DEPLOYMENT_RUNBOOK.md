### PWA Audit & Deployment Report

**1. PWA Configuration (Fixed)**
- [x] **Environment Variables**: `.env.development` and `.env.production` created.
- [x] **Manifest**: Consolidated into `vite.config.ts` to resolve conflicts.
- [x] **Service Worker**: Removed manual `registerSW.ts`. Reconfigured `main.tsx` to use `virtual:pwa-register` from `vite-plugin-pwa`.
- [x] **Build Success**: `npm run build` passes with zero errors. SW and manifest are generated correctly.

**2. Current Status: READY FOR DEPLOYMENT**
- **Frontend**: Builds to `dist` folder.
- **Backend**: Configured to deploy to Cloud Run (service: `purpose-path-boost-api`).
- **Hosting**: `firebase.json` handles rewrites for SPA and API.

**3. Next Steps (Deployment Runbook)**

**Step A: Local Verification**
1. Fill secrets in `.env.production`.
2. Run `npm run preview` to test the production build locally at `http://localhost:4173`.
3. Open Chrome DevTools > Application > Service Workers to confirm SW is registered and running.

**Step B: Deploy Backend (Cloud Run)**
```bash
# Navigate to backend folder
cd backend 

# Deploy API service
gcloud run deploy purpose-path-boost-api \
  --source . \
  --region=asia-east1 \
  --platform=managed \
  --allow-unauthenticated
```

**Step C: Deploy Frontend (Firebase Hosting)**
```bash
# Navigate to project root
cd ..

# Deploy hosting only
firebase deploy --only hosting
```

**Step D: Final Sanity Check**
1. Open your hosted URL (e.g., `https://zhengrowth.com`).
2. Check for:
   - No blank screen.
   - "Install App" prompt appears (chrome/mobile).
   - API calls (e.g., booking/login) work correctly.
