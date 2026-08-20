<#
.SYNOPSIS
    Publishes a self-contained, single-file Windows executable for Sevelr.
#>
[CmdletBinding()]
param (
    [string]$OutputPath = "./dist/win-x64"
)

$ErrorActionPreference = "Stop"
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Publishing Sevelr Windows Executable" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

dotnet publish src/Sevelr/Sevelr.csproj `
    -c Release `
    -r win-x64 `
    --self-contained true `
    -p:PublishSingleFile=true `
    -p:IncludeNativeLibrariesForSelfExtract=true `
    -p:EnableCompressionInSingleFile=true `
    -o $OutputPath

Write-Host "`n[✓] Published to $OutputPath/sevelr.exe" -ForegroundColor Green
