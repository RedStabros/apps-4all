<#
.SYNOPSIS
  Compila en lote los APKs de produccion firmados (ARM-only: arm64-v8a + armeabi-v7a)
  del ecosistema 4All en D:\APP_development\4All_Builds_APK\v<Version>\
#>
param(
    [string[]]$Apps = @(
        "reproductor-4all",
        "apuntes-4all",
        "seguridad-4all",
        "pdf-4all",
        "docs-4all",
        "notas-voz-4all",
        "qr-4all",
        "zip-4all",
        "fotos-ligeras-4all",
        "lupa-4all",
        "enfoque-4all",
        "cuentas-4all",
        "medidas-4all",
        "azar-4all",
        "festivos-4all"
    ),
    [string]$Version = "1.0.0",
    [string]$Architectures = "arm64-v8a,armeabi-v7a",
    [switch]$SkipExisting,
    [switch]$CleanIntermediates
)

$ErrorActionPreference = "Continue"
$BuildScript = Join-Path $PSScriptRoot "build-apk.ps1"
$OutDir = "D:\APP_development\4All_Builds_APK\v$Version"
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
$ReportPath = Join-Path $OutDir "BUILD_REPORT.txt"

$Results = @()
$StartTime = Get-Date
$idx = 0
$total = $Apps.Count

"=== 4ALL BATCH BUILD v$Version ($Architectures) - Inicio: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') ===" | Out-File -FilePath $ReportPath -Encoding UTF8

foreach ($slug in $Apps) {
    $idx++
    $apkPath = Join-Path $OutDir "$slug-v$Version.apk"
    if ($SkipExisting -and (Test-Path $apkPath)) {
        $sizeMB = [math]::Round((Get-Item $apkPath).Length / 1MB, 2)
        Write-Host "[$idx/$total] [SKIP] $slug ya existe ($sizeMB MB)" -ForegroundColor Yellow
        $Results += [PSCustomObject]@{ App = $slug; Status = "SKIPPED"; SizeMB = $sizeMB; Minutes = 0 }
        "[$idx/$total] SKIPPED | $slug | $sizeMB MB" | Out-File -FilePath $ReportPath -Append -Encoding UTF8
        continue
    }

    Write-Host "`n==========================================" -ForegroundColor Cyan
    Write-Host "[$idx/$total] Compilando $slug v$Version ($Architectures) ..." -ForegroundColor Cyan
    Write-Host "==========================================" -ForegroundColor Cyan

    $appStart = Get-Date
    & powershell -ExecutionPolicy Bypass -File $BuildScript -AppSlug $slug -Version $Version -Architectures $Architectures
    $appMin = [math]::Round(((Get-Date) - $appStart).TotalMinutes, 1)

    if ($LASTEXITCODE -eq 0 -and (Test-Path $apkPath)) {
        $sizeMB = [math]::Round((Get-Item $apkPath).Length / 1MB, 2)
        $sha = (Get-FileHash -Path $apkPath -Algorithm SHA256).Hash.ToLower()
        $Results += [PSCustomObject]@{ App = $slug; Status = "OK"; SizeMB = $sizeMB; Minutes = $appMin }
        "[$idx/$total] OK      | $slug | $sizeMB MB | ${appMin}m | $sha" | Out-File -FilePath $ReportPath -Append -Encoding UTF8

        if ($CleanIntermediates) {
            $androidBuild = "d:\APP_development\Apps_4all\apps\$slug\android\app\build"
            if (Test-Path $androidBuild) {
                Remove-Item -Recurse -Force $androidBuild -ErrorAction SilentlyContinue
            }
        }
    } else {
        Write-Host "[$idx/$total] [ERROR] Fallo la compilacion de $slug (${appMin}m)" -ForegroundColor Red
        $Results += [PSCustomObject]@{ App = $slug; Status = "FAILED"; SizeMB = 0; Minutes = $appMin }
        "[$idx/$total] FAILED  | $slug | 0 MB | ${appMin}m" | Out-File -FilePath $ReportPath -Append -Encoding UTF8
    }
}

$Elapsed = [math]::Round(((Get-Date) - $StartTime).TotalMinutes, 1)
Write-Host "`n==========================================" -ForegroundColor Green
Write-Host "RESUMEN DE COMPILACION ($Elapsed min) -> $OutDir" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
$Results | Format-Table -AutoSize
"`n=== FIN ($Elapsed min) ===" | Out-File -FilePath $ReportPath -Append -Encoding UTF8
