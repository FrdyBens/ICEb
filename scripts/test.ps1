<#
.SYNOPSIS
    Runs all unit, integration, and security tests for Sevelr.
#>
[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Running Sevelr Test Suite" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 1. C# Tests
Write-Host "`n[1/2] Running C# xUnit Test Suite..." -ForegroundColor Yellow
dotnet test tests/Sevelr.Tests/Sevelr.Tests.csproj --verbosity normal

# 2. Python Server Tests
if (Get-Command pytest -ErrorAction SilentlyContinue) {
    Write-Host "`n[2/2] Running Python API & Security Tests..." -ForegroundColor Yellow
    pytest server/tests/
} else {
    Write-Host "`n[2/2] Running Python Server Validation..." -ForegroundColor Yellow
    python3 -m unittest discover -s server/tests -p "test_*.py"
}

Write-Host "`n[✓] All Sevelr Tests Passed." -ForegroundColor Green
