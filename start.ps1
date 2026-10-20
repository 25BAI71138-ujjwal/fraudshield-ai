# Dhanrakshak AI - PowerShell launcher
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "Starting Dhanrakshak AI (Backend API + React Frontend)" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Detect Local Wi-Fi / Ethernet IPv4 address
$localIp = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { 
    $_.InterfaceAlias -notmatch 'Loopback|vEthernet|WSL' -and $_.IPAddress -notlike '169.254*' 
} | Select-Object -First 1 -ExpandProperty IPAddress)

if (-not $localIp) {
    $localIp = "127.0.0.1"
}

# Start Backend on 0.0.0.0:8000 (accessible on local network)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptDir\backend'; .\venv\Scripts\Activate.ps1; uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
Start-Sleep -Seconds 2

# Start Frontend Vite dev server (listening on 0.0.0.0)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptDir\frontend'; npm.cmd run dev -- --host 0.0.0.0"

Write-Host "Dhanrakshak AI is live!" -ForegroundColor Green
Write-Host "----------------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "Laptop Localhost:  http://localhost:5173" -ForegroundColor Green
Write-Host "Mobile Phone URL:  http://${localIp}:5173" -ForegroundColor Yellow
Write-Host "Backend API Docs:  http://${localIp}:8000/docs" -ForegroundColor Cyan
Write-Host "----------------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "Ensure your Android phone and laptop are on the same Wi-Fi network." -ForegroundColor Gray
