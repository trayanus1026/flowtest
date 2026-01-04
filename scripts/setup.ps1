# PowerShell setup script for Invoice Reconciliation API

Write-Host "Setting up Invoice Reconciliation API..." -ForegroundColor Green

# Check if PostgreSQL is accessible (basic check)
try {
    $pgTest = Test-NetConnection -ComputerName localhost -Port 5432 -WarningAction SilentlyContinue
    if (-not $pgTest.TcpTestSucceeded) {
        Write-Host "Warning: Cannot connect to PostgreSQL on port 5432. Please ensure PostgreSQL is running." -ForegroundColor Yellow
    }
} catch {
    Write-Host "Warning: Could not check PostgreSQL connection." -ForegroundColor Yellow
}

# Install Node.js dependencies
Write-Host "Installing Node.js dependencies..." -ForegroundColor Cyan
npm install

# Generate Drizzle migrations
Write-Host "Generating Drizzle migrations..." -ForegroundColor Cyan
npm run db:generate

# Run migrations
Write-Host "Running database migrations..." -ForegroundColor Cyan
npm run db:migrate

# Set up RLS policies (requires psql)
Write-Host "Setting up RLS policies..." -ForegroundColor Cyan
Write-Host "Please run manually: psql invoice_reconciliation -f src/database/rls-setup.sql" -ForegroundColor Yellow

# Setup Python environment
Write-Host "Setting up Python environment..." -ForegroundColor Cyan
Set-Location python
if (-not (Test-Path "venv")) {
    python -m venv venv
}
& .\venv\Scripts\Activate.ps1
pip install -r requirements.txt
Set-Location ..

Write-Host "Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "To start the NestJS server: npm run start:dev" -ForegroundColor Cyan
Write-Host "To start the Python server: cd python; python -m app.main" -ForegroundColor Cyan
Write-Host ""
Write-Host "Don't forget to:" -ForegroundColor Yellow
Write-Host "1. Copy .env.example to .env and configure it" -ForegroundColor Yellow
Write-Host "2. Set up your JWT_SECRET" -ForegroundColor Yellow
Write-Host "3. (Optional) Add OPENAI_API_KEY for AI explanations" -ForegroundColor Yellow

