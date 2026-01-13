# ZhenGrowth Cloud Run Deployment Script
# PowerShell script for manual deployment

param(
    [string]$ProjectId = "",
    [string]$Region = "asia-east1",
    [string]$ServiceName = "zhengrowth-app"
)

# Colors for output
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Info { Write-Host $args -ForegroundColor Cyan }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }
function Write-Error { Write-Host $args -ForegroundColor Red }

Write-Info "======================================"
Write-Info "ZhenGrowth Cloud Run Deployment"
Write-Info "======================================"
Write-Host ""

# Check if gcloud is installed
if (!(Get-Command gcloud -ErrorAction SilentlyContinue)) {
    Write-Error "Error: gcloud CLI is not installed."
    Write-Info "Install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
}

# Get Project ID if not provided
if ([string]::IsNullOrEmpty($ProjectId)) {
    $ProjectId = Read-Host "Enter your GCP Project ID"
}

Write-Info "Configuration:"
Write-Host "  Project ID: $ProjectId"
Write-Host "  Region: $Region"
Write-Host "  Service Name: $ServiceName"
Write-Host ""

# Confirm deployment
$confirm = Read-Host "Continue with deployment? (yes/no)"
if ($confirm -ne "yes") {
    Write-Warning "Deployment cancelled."
    exit 0
}

Write-Info "Step 1: Building application..."
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Error "Build failed!"
    exit 1
}
Write-Success "✓ Build completed"

Write-Info "Step 2: Authenticating with Google Cloud..."
gcloud config set project $ProjectId
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to set project!"
    exit 1
}
Write-Success "✓ Authenticated"

Write-Info "Step 3: Creating Artifact Registry repository (if not exists)..."
gcloud artifacts repositories create zhengrowth `
    --repository-format=docker `
    --location=$Region `
    --description="ZhenGrowth Docker images" `
    2>$null
Write-Success "✓ Repository ready"

Write-Info "Step 4: Configuring Docker authentication..."
gcloud auth configure-docker "$Region-docker.pkg.dev"
if ($LASTEXITCODE -ne 0) {
    Write-Error "Docker authentication failed!"
    exit 1
}
Write-Success "✓ Docker configured"

Write-Info "Step 5: Building Docker image..."
$ImageTag = "$Region-docker.pkg.dev/$ProjectId/zhengrowth/$ServiceName`:latest"
docker build -t $ImageTag .
if ($LASTEXITCODE -ne 0) {
    Write-Error "Docker build failed!"
    exit 1
}
Write-Success "✓ Image built"

Write-Info "Step 6: Pushing image to Artifact Registry..."
docker push $ImageTag
if ($LASTEXITCODE -ne 0) {
    Write-Error "Docker push failed!"
    exit 1
}
Write-Success "✓ Image pushed"

Write-Info "Step 7: Deploying to Cloud Run..."
gcloud run deploy $ServiceName `
    --image $ImageTag `
    --region $Region `
    --platform managed `
    --allow-unauthenticated `
    --port 8080 `
    --memory 512Mi `
    --cpu 1 `
    --min-instances 0 `
    --max-instances 10 `
    --set-env-vars "NODE_ENV=production"

if ($LASTEXITCODE -ne 0) {
    Write-Error "Deployment failed!"
    exit 1
}
Write-Success "✓ Deployed successfully"

Write-Info "Step 8: Getting service URL..."
$ServiceUrl = gcloud run services describe $ServiceName `
    --region $Region `
    --format 'value(status.url)'

Write-Host ""
Write-Success "======================================"
Write-Success "Deployment Complete!"
Write-Success "======================================"
Write-Host ""
Write-Info "Service URL: $ServiceUrl"
Write-Host ""
Write-Info "Next steps:"
Write-Host "  1. Visit the URL above to test your deployment"
Write-Host "  2. Configure custom domain in Cloud Run console"
Write-Host "  3. Update Firebase Hosting to proxy to Cloud Run"
Write-Host ""
