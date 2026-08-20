<#
.SYNOPSIS
    Packages the complete Sevelr Windows distribution (Binaries, Templates, Server, Dashboard).
#>
[CmdletBinding()]
param (
    [string]$DistRoot = "./dist/Sevelr_Package"
)

$ErrorActionPreference = "Stop"
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Packaging Sevelr Windows Installer" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if (Test-Path $DistRoot) { Remove-Item -Recurse -Force $DistRoot }
New-Item -ItemType Directory -Path "$DistRoot/bin" -Force | Out-Null
New-Item -ItemType Directory -Path "$DistRoot/templates" -Force | Out-Null
New-Item -ItemType Directory -Path "$DistRoot/dashboard" -Force | Out-Null
New-Item -ItemType Directory -Path "$DistRoot/server" -Force | Out-Null

# 1. Publish binary
& "$PSScriptRoot/publish.ps1" -OutputPath "$DistRoot/bin"

# 2. Copy templates
Copy-Item -Path "./templates/*" -Destination "$DistRoot/templates/" -Recurse

# 3. Copy built dashboard
npm run build
Copy-Item -Path "./dist/*" -Destination "$DistRoot/dashboard/" -Recurse -Exclude "win-x64","Sevelr_Package"

# 4. Copy server
Copy-Item -Path "./server/*" -Destination "$DistRoot/server/" -Recurse

Write-Host "`n[✓] Sevelr Windows package created at: $DistRoot" -ForegroundColor Green
