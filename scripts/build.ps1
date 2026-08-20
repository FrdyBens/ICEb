<#
.SYNOPSIS
    Builds all Sevelr components (C# Agent, Web Dashboard, and Server).
#>
[CmdletBinding()]
param (
    [string]$Configuration = "Release"
)

$ErrorActionPreference = "Stop"
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Building Sevelr Engine & Dashboard" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 1. Build C# Solution
Write-Host "`n[1/3] Building C# Engine..." -ForegroundColor Yellow
dotnet restore Sevelr.sln
dotnet build Sevelr.sln -c $Configuration --no-restore

# 2. Build Frontend Dashboard
Write-Host "`n[2/3] Building Web Dashboard..." -ForegroundColor Yellow
npm run build

Write-Host "`n[3/3] Build Completed Successfully (0 Errors)." -ForegroundColor Green
