# Start ASP.NET Core API and React Frontend
Write-Host "Starting ASP.NET Core Web API on http://localhost:5000..." -ForegroundColor Cyan
Start-Process dotnet -ArgumentList "run --project CombinedMaths.Api"

Write-Host "Starting Vite React Frontend on http://localhost:5173..." -ForegroundColor Green
npm run dev

