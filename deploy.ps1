
$ErrorActionPreference = "Stop"

$image = "opstrack:latest"
$container = "opstrack-app"

Write-Host "Building OpsTrack Docker image..."
docker build -t $image .
if ($LASTEXITCODE -ne 0) {
    throw "Docker image build failed"
}

Write-Host "Removing existing OpsTrack container if present..."
docker rm -f $container 2>$null

Write-Host "Deploying new OpsTrack container..."
docker run -d `
    --name $container `
    --restart unless-stopped `
    -p 8082:8080 `
    $image

if ($LASTEXITCODE -ne 0) {
    throw "Docker deployment failed"
}

Write-Host "OpsTrack deployment completed."
