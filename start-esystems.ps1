Param(
  [switch]$NoKill
)

Write-Host "Starting E-Systems Management Hub (Windows)..."
Write-Host "========================================="

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendPath = Join-Path $root 'backend'
$frontendPath = Join-Path $root 'frontend'

function Get-NpmPath {
  $npmCmd = (Get-Command npm.cmd -ErrorAction SilentlyContinue)
  if ($npmCmd) { return $npmCmd.Source }
  $npmExe = (Get-Command npm -ErrorAction SilentlyContinue)
  if ($npmExe) { return $npmExe.Source }
  throw "npm not found in PATH. Please install Node.js from https://nodejs.org and reopen PowerShell."
}

function Install-DependenciesIfMissing {
  param([string]$Path)
  $nodeModules = Join-Path $Path 'node_modules'
  if (-not (Test-Path $nodeModules)) {
    Write-Host "Installing dependencies in $Path ..."
    $npm = Get-NpmPath
    Push-Location $Path
    try {
      & $npm install | Out-Host
    } finally {
      Pop-Location
    }
  }
}

function Stop-ByPort {
  param([int]$Port)
  try {
    $conns = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    if ($conns) {
      ($conns | Select-Object -ExpandProperty OwningProcess -Unique) | ForEach-Object {
        try { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue } catch {}
      }
    } else {
      # Fallback via netstat for older systems
      $processIds = (netstat -ano | Select-String ":$Port" | ForEach-Object { $_.ToString().Trim().Split()[-1] }) | Sort-Object -Unique
      foreach ($processId in $processIds) {
        try { Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue } catch {}
      }
    }
  } catch {}
}

if (-not $NoKill) {
  Write-Host "Checking for existing processes on ports 3001 and 5001..."
  Stop-ByPort -Port 3001
  Stop-ByPort -Port 5001
  Start-Sleep -Seconds 2
}

Install-DependenciesIfMissing -Path $backendPath
Install-DependenciesIfMissing -Path $frontendPath

Write-Host "Starting E-Systems backend (backend dir, loads .env) on port 5001..."
Start-Process -FilePath "powershell" -ArgumentList @(
  "-NoExit",
  "-Command",
  "`$env:ESYSTEMS_MODE='true'; `$env:PORT='5001'; Set-Location '$backendPath'; npx nodemon server.js"
) -WorkingDirectory $backendPath

Start-Sleep -Seconds 4

Write-Host "Starting E-Systems frontend (main frontend with E-Systems theme) on port 3001..."
Start-Process -FilePath "powershell" -ArgumentList @(
  "-NoExit",
  "-Command",
  "`$env:REACT_APP_BRAND='esystems'; `$env:REACT_APP_API_URL='http://localhost:5001/api'; `$env:PORT='3001'; Set-Location '$frontendPath'; npm start"
) -WorkingDirectory $frontendPath

Write-Host ""
Write-Host "E-Systems Management Hub is starting up..."
Write-Host "========================================="
Write-Host "Backend (API): http://localhost:5001"
Write-Host "Frontend: http://localhost:3001"
Write-Host ""
Write-Host "Two PowerShell windows were opened: one for backend and one for frontend. Press Ctrl+C in each to stop."


