# Cloud Run Deployment Guide

Complete guide for deploying ZhenGrowth to Google Cloud Run.

## Prerequisites

- Google Cloud Platform account
- GCP Project with billing enabled
- gcloud CLI installed ([Download](https://cloud.google.com/sdk/docs/install))
- Docker installed ([Download](https://docs.docker.com/get-docker/))
- Node.js 20+ and npm installed

## Quick Deploy (Automated)

### Option 1: PowerShell Script (Windows)

```powershell
.\deploy-cloud-run.ps1 -ProjectId "your-project-id"
```

### Option 2: Manual Steps

```bash
# 1. Build the application
npm run build

# 2. Set your GCP project
export PROJECT_ID="your-project-id"
export REGION="asia-east1"
export SERVICE_NAME="zhengrowth-app"

gcloud config set project $PROJECT_ID

# 3. Create Artifact Registry repository
gcloud artifacts repositories create zhengrowth \
  --repository-format=docker \
  --location=$REGION \
  --description="ZhenGrowth Docker images"

# 4. Configure Docker authentication
gcloud auth configure-docker $REGION-docker.pkg.dev

# 5. Build and push Docker image
docker build -t $REGION-docker.pkg.dev/$PROJECT_ID/zhengrowth/$SERVICE_NAME:latest .
docker push $REGION-docker.pkg.dev/$PROJECT_ID/zhengrowth/$SERVICE_NAME:latest

# 6. Deploy to Cloud Run
gcloud run deploy $SERVICE_NAME \
  --image $REGION-docker.pkg.dev/$PROJECT_ID/zhengrowth/$SERVICE_NAME:latest \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --set-env-vars "NODE_ENV=production"
```

## GitHub Actions (Recommended for CI/CD)

### Setup Secrets

In your GitHub repository, go to Settings > Secrets and Variables > Actions, and add:

1. **GCP_PROJECT_ID**: Your Google Cloud Project ID
2. **GCP_SA_KEY**: Service Account JSON key (see below)
3. **Firebase & Supabase Environment Variables**:
   - VITE_FIREBASE_API_KEY
   - VITE_FIREBASE_APP_ID
   - VITE_FIREBASE_AUTH_DOMAIN
   - VITE_FIREBASE_MESSAGING_SENDER_ID
   - VITE_FIREBASE_PROJECT_ID
   - VITE_FIREBASE_STORAGE_BUCKET
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_PUBLISHABLE_KEY

### Create Service Account

```bash
# Create service account
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions"

# Grant necessary roles
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

# Create and download key
gcloud iam service-accounts keys create github-actions-key.json \
  --iam-account=github-actions@$PROJECT_ID.iam.gserviceaccount.com
```

Copy the contents of `github-actions-key.json` and paste it into the `GCP_SA_KEY` secret.

### Trigger Deployment

The workflow automatically deploys when you push to `main` branch:

```bash
git add .
git commit -m "Deploy to Cloud Run"
git push origin main
```

Or trigger manually from GitHub Actions tab.

## Configuration

### Environment Variables

The application uses the following environment variables (set during build):

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=

# Supabase Configuration
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=

# Optional
VITE_POSTHOG_KEY=         # PostHog analytics
VITE_REGION=global        # or 'china' for CN build
```

### Resource Limits

Current configuration:
- **Memory**: 512Mi (adjust based on traffic)
- **CPU**: 1 vCPU
- **Min Instances**: 0 (scales to zero when idle)
- **Max Instances**: 10
- **Port**: 8080

Adjust in the deployment command or workflow file as needed.

## Custom Domain Setup

1. **Map your domain in Cloud Run**:
   ```bash
   gcloud run domain-mappings create \
     --service $SERVICE_NAME \
     --domain zhengrowth.com \
     --region $REGION
   ```

2. **Update DNS records** as instructed by Cloud Run

3. **SSL Certificate** is automatically provisioned by Google

## Monitoring & Logs

### View Logs
```bash
gcloud run services logs read $SERVICE_NAME \
  --region $REGION \
  --limit 50
```

### Real-time Logs
```bash
gcloud run services logs tail $SERVICE_NAME \
  --region $REGION
```

### Cloud Console
Visit: https://console.cloud.google.com/run

## Troubleshooting

### Build Fails

Check build logs:
```bash
npm run build
```

Common issues:
- Missing environment variables
- TypeScript errors
- Dependency issues

### Deployment Fails

1. Check service account permissions
2. Verify Artifact Registry repository exists
3. Ensure billing is enabled
4. Check region availability

### Container Errors

View container logs:
```bash
gcloud run services logs read $SERVICE_NAME --region $REGION
```

### Port Issues

Ensure:
- Dockerfile exposes port 8080
- nginx.conf listens on port 8080
- Cloud Run deployment uses `--port 8080`

## Cost Optimization

Cloud Run pricing is based on:
- **CPU & Memory allocation time**
- **Requests**
- **Network egress**

Tips:
- Use `--min-instances 0` to scale to zero when idle
- Reduce `--memory` if 512Mi is too much
- Use Cloud CDN for static assets
- Monitor usage in Cloud Console

## Integration with Firebase Hosting

To serve the app via Firebase Hosting domain:

1. **Update firebase.json**:
```json
{
  "hosting": {
    "rewrites": [
      {
        "source": "**",
        "run": {
          "serviceId": "zhengrowth-app",
          "region": "asia-east1"
        }
      }
    ]
  }
}
```

2. **Deploy**:
```bash
firebase deploy --only hosting
```

## Rollback

If you need to rollback to a previous version:

```bash
# List revisions
gcloud run revisions list --service $SERVICE_NAME --region $REGION

# Route traffic to a specific revision
gcloud run services update-traffic $SERVICE_NAME \
  --to-revisions REVISION_NAME=100 \
  --region $REGION
```

## Support

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Docker Documentation](https://docs.docker.com/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

## Checklist

Before deploying to production:

- [ ] Build completes without errors
- [ ] All environment variables are set
- [ ] Firebase/Supabase credentials are valid
- [ ] Docker image builds successfully
- [ ] Service account has correct permissions
- [ ] Billing is enabled on GCP project
- [ ] Custom domain is configured (optional)
- [ ] SSL certificate is provisioned
- [ ] Monitoring is set up
- [ ] Backup strategy is in place
