<#
.SYNOPSIS
    Starts Sevelr in development mode (Dashboard + Local Agent).
#>
[CmdletBinding()]
param()

Write-Host "Starting Sevelr in development mode..." -ForegroundColor Cyan
# Start Python or Node development backend & Vite dev server
npm run dev
