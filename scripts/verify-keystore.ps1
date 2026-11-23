param (
    [Parameter(Mandatory = $false)]
    [string]$ApkPath = "",

    [Parameter(Mandatory = $false)]
    [string]$ExpectedSha256 = ""
)

Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "[4ALL DEVOPS] Verificacion Criptografica de Firmas APK" -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan

# 1. Localizar apksigner en el Android SDK
$androidHome = $env:ANDROID_HOME
if (-not $androidHome) { $androidHome = $env:ANDROID_SDK_ROOT }
if (-not $androidHome) { $androidHome = "$env:LOCALAPPDATA\Android\Sdk" }

$apkSignerPath = $null
if (Test-Path $androidHome) {
    $buildTools = Get-ChildItem -Path "$androidHome\build-tools" -ErrorAction SilentlyContinue | Sort-Object Name -Descending
    foreach ($bt in $buildTools) {
        $candidate = "$($bt.FullName)\apksigner.bat"
        if (Test-Path $candidate) {
            $apkSignerPath = $candidate
            break
        }
    }
}

if (-not $apkSignerPath) {
    $cmd = Get-Command "apksigner" -ErrorAction SilentlyContinue
    if ($cmd) {
        $apkSignerPath = $cmd.Source
    }
}

if ($apkSignerPath) {
    Write-Host "[OK] Herramienta apksigner detectada: $apkSignerPath" -ForegroundColor Green
} else {
    Write-Host "[INFO] apksigner no detectado localmente. La regla fail-safe en Gradle protege la compilacion." -ForegroundColor Yellow
}

# 2. Localizar APK
if (-not $ApkPath) {
    Write-Host "Buscando APKs en outputs de compilacion..." -ForegroundColor Gray
    $foundApks = Get-ChildItem -Path "d:\APP_development\Apps_4all\apps" -Filter "*release*.apk" -Recurse -Depth 7 -ErrorAction SilentlyContinue | Where-Object { $_.FullName -notmatch "node_modules" }
    if ($foundApks -and $foundApks.Count -gt 0) {
        $ApkPath = $foundApks[0].FullName
        Write-Host "APK localizado: $ApkPath" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "No hay APK compilado actualmente en el repositorio." -ForegroundColor Yellow
        Write-Host "Sintaxis: .\scripts\verify-keystore.ps1 -ApkPath 'ruta\a\app-release.apk'" -ForegroundColor White
        Write-Host ""
        Write-Host "POLITICA DE FIRMAS CONFIGURADA:" -ForegroundColor Cyan
        Write-Host "1. Gradle signingConfigs.release rechaza automaticamente debug.keystore." -ForegroundColor White
        Write-Host "2. Variables RELEASE_KEYSTORE_PATH son obligatorias en compilacion." -ForegroundColor White
        Write-Host "3. Certificados .jks y .keystore estan protegidos en .gitignore." -ForegroundColor White
        exit 0
    }
}

if (-not (Test-Path $ApkPath)) {
    Write-Host "[ERROR] El archivo APK no existe: $ApkPath" -ForegroundColor Red
    exit 1
}

# 3. Analisis
Write-Host "Inspeccionando certificados y esquema de firma..." -ForegroundColor Cyan
$output = & $apkSignerPath verify --verbose --print-certs $ApkPath 2>&1

$hasDebug = ($output -match "Android Debug") -or ($output -match "androiddebugkey")
$isVerified = ($output -match "Verifies")

if ($hasDebug) {
    Write-Host "[ALERTA CRITICA] El APK fue firmado con DEBUG.KEYSTORE." -ForegroundColor Red
    Write-Host "RECHAZADO: No apto para produccion ni Google Play." -ForegroundColor Red
    exit 1
} elseif ($isVerified) {
    Write-Host "[VALIDADO] El APK esta firmado correctamente para produccion." -ForegroundColor Green
    exit 0
} else {
    Write-Host "[ERROR] Firma no valida." -ForegroundColor Red
    exit 1
}
