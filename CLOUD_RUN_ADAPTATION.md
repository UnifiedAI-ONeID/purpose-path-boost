# Cloud Run Adaptation & Environment Parity

## Goal

Ensure the backend/runtime environment is **fully adapted to Cloud Run** with:
- Clean containerization
- Correct environment variables & secrets
- Smooth integration with Firebase Hosting + Firestore + Auth
- Staging / production parity
- Minimal code changes from the existing backend.

Assume:
- Region: <REGION> (e.g. asia-east1)
- Project: <GCP_PROJECT_ID>
- Service name: <CLOUD_RUN_SERVICE_NAME> (e.g. zhengrowth-api)

## 1. Decision on What Runs on Cloud Run

- **To Be Deployed to Cloud Run**: All existing backend API routes currently running as Supabase Edge Functions. This includes business logic, payment integrations, and sensitive operations.
- **To Remain on Firebase/Frontend**: The core PWA will continue to be served by Firebase Hosting. Firebase Auth and Firestore will remain the primary services for authentication and data storage.

## 2. Dockerization for Cloud Run

A `Dockerfile` will be created at the backend's root directory to containerize the application. It will use a lightweight Node.js image, install dependencies, copy the source code, and define the start command. The application server will be configured to listen on `0.0.0.0` and respect the `PORT` environment variable provided by Cloud Run.

## 3. Environment Variables & Secret Parity

All backend environment variables, especially secrets, will be migrated from Supabase to Google Secret Manager. The Cloud Run service will be configured to securely access these secrets. Frontend-safe variables (prefixed with `VITE_`) will remain part of the frontend build process.

**Secret Inventory (to be migrated to Secret Manager):**
- `CAL_COM_API_KEY`
- `GOOGLE_AI_API_KEY`
- `RESEND_API_KEY`
- `SUPABASE_URL` (if still needed for any data access)
- `SUPABASE_ANON_KEY` (if still needed)
- `SUPABASE_SERVICE_ROLE_KEY` (if still needed)
- `METRICS_SALT`
- `MASTER_KEY`
- Any other JWT secrets or encryption keys.

## 4. URLs, Routing & Integration with Firebase Hosting

Firebase Hosting will be configured to act as a proxy for the Cloud Run service. This simplifies CORS and provides a clean API for the frontend.

In `firebase.json`:
```json
{
  "hosting": {
    "rewrites": [
      {
        "source": "/api/**",
        "run": {
          "serviceId": "<CLOUD_RUN_SERVICE_NAME>",
          "region": "<REGION>"
        }
      },
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```
The frontend will make API calls to relative paths like `/api/v1/users`, and Firebase Hosting will securely route them to the Cloud Run backend.

## 5. Cloud Run Deployment Config

The deployment will use the following configuration:
- **Region**: A specified GCP region (e.g., `asia-east1`).
- **CPU & Memory**: Start with 1 vCPU and 512MB RAM, adjustable based on performance.
- **Concurrency**: Set to a reasonable default like 80.
- **Instances**: Min 0 (for cost-effectiveness) and Max 10 (to prevent runaway costs).
- **Authentication**: Allow unauthenticated invocations for public-facing API endpoints, controlled via the Firebase Hosting proxy.

## 6. CI/CD Pipeline for Cloud Run

A GitHub Actions workflow will be created to automate the build and deployment process. On a push to the `main` branch, the workflow will:
1. Authenticate with Google Cloud.
2. Build the Docker image.
3. Push the image to Google Artifact Registry.
4. Deploy the new image to the Cloud Run service.

## 7. Staging vs. Production Services

Two distinct Cloud Run services will be created:
- `<CLOUD_RUN_SERVICE_NAME>-staging`
- `<CLOUD_RUN_SERVICE_NAME>-prod`

These will be connected to corresponding Firebase environments and deployed from `develop` and `main` branches, respectively, ensuring a safe testing and release process.

## 8. Observability, Logging & Health

- **Logging**: The backend will use structured JSON logging to `stdout`, which will be automatically collected by Cloud Logging.
- **Monitoring**: Basic alerts will be configured in Google Cloud Monitoring for high error rates and latency.
- **Health Checks**: A `/healthz` endpoint will be added to the backend to report its status.

## Checklist – Environment Adapted to Cloud Run

- [ ] Dockerfile build succeeds and image runs locally.
- [ ] Cloud Run service deployed and reachable.
- [ ] All required secrets are configured on Cloud Run via Secret Manager.
- [ ] Frontend successfully talks to the Cloud Run API via the Firebase Hosting proxy.
- [ ] Staging and production services are created and configured.
- [ ] Basic logging is confirmed to be working in Cloud Logging.
- [ ] No secrets are present in the repository or Docker image.
