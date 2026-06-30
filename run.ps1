# Start both backend and frontend
Write-Host "=== Starting 360 News Report ===" -ForegroundColor Cyan

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
if ([string]::IsNullOrEmpty($ScriptDir)) { $ScriptDir = Get-Location }

# Start backend
$backend = Start-Process -FilePath "$ScriptDir\venv\Scripts\python.exe" -ArgumentList "-m uvicorn app.main:app --host 127.0.0.1 --port 8765 --reload" -WorkingDirectory "$ScriptDir\backend" -PassThru -NoNewWindow
Write-Host "Backend starting on http://127.0.0.1:8765" -ForegroundColor Green

Start-Sleep -Seconds 2

# Start frontend
$frontend = Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm run dev" -WorkingDirectory "$ScriptDir\frontend" -PassThru -NoNewWindow
Write-Host "Frontend starting on http://localhost:5173" -ForegroundColor Green

Write-Host ""
Write-Host "Admin login: admin / admin123" -ForegroundColor Yellow
Write-Host "Press any key to stop both servers..." -ForegroundColor Cyan

$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Stop-Process -Id $backend.Id -Force
Stop-Process -Id $frontend.Id -Force
Write-Host "Servers stopped." -ForegroundColor Red
