param (
    [Parameter(Mandatory = $true)]
    [string]$AppSlug,

    [Parameter(Mandatory = $false)]
    [string]$Version = "1.0.1",

    [Parameter(Mandatory = $false)]
    [string]$KeystoreDir = "",

    [Parameter(Mandatory = $false)]
    [string]$OutputDir = "",

    [Parameter(Mandatory = $false)]
    [string]$Architectures = "arm64-v8a,armeabi-v7a"
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$parentDir = Split-Path -Parent $repoRoot
if (-not $KeystoreDir) { $KeystoreDir = Join-Path $parentDir "4All_Keystores_PRIVADO" }
if (-not $OutputDir) { $OutputDir = Join-Path $parentDir "4All_Builds_APK" }

$appDir = Join-Path $repoRoot "apps\$AppSlug"
if (-not (Test-Path $appDir)) {
    Write-Host "[ERROR] App no encontrada: $appDir" -ForegroundColor Red
    exit 1
}

# Configure SDK & JDK paths dynamically (portable across PCs)
$androidHome = $env:ANDROID_HOME
if (-not $androidHome -or -not (Test-Path $androidHome)) { $androidHome = $env:ANDROID_SDK_ROOT }
if (-not $androidHome -or -not (Test-Path $androidHome)) {
    $androidHome = @("C:\Android\Sdk", "D:\Android\Sdk", "$env:LOCALAPPDATA\Android\Sdk") | Where-Object { Test-Path $_ } | Select-Object -First 1
}
if (-not $androidHome) {
    Write-Host "[ERROR] Android SDK no encontrado. Configura ANDROID_HOME." -ForegroundColor Red
    exit 1
}

$javaHome = $env:JAVA_HOME
if (-not $javaHome -or -not (Test-Path $javaHome)) {
    $javaHome = @("C:\Java\jdk-21", "C:\Program Files\Java\jdk-21") | Where-Object { Test-Path $_ } | Select-Object -First 1
}
if (-not $javaHome) {
    Write-Host "[ERROR] JDK 21 no encontrado. Configura JAVA_HOME." -ForegroundColor Red
    exit 1
}

$env:ANDROID_HOME = $androidHome
$env:ANDROID_SDK_ROOT = $androidHome
$env:JAVA_HOME = $javaHome
$env:Path = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:Path"

# Load signing credentials from .env.signing
$envSigningFile = Join-Path $KeystoreDir ".env.signing"
if (-not (Test-Path $envSigningFile)) {
    Write-Host "[ERROR] No se encontro $envSigningFile. Ejecuta scripts\generate-keystores.ps1 primero." -ForegroundColor Red
    exit 1
}

$varPrefix = ($AppSlug -replace '-', '_').ToUpper()
$creds = @{}
Get-Content $envSigningFile | ForEach-Object {
    if ($_ -match "^([A-Z0-9_]+)=(.+)$") {
        $creds[$matches[1]] = $matches[2].Trim()
    }
}

$ksPath = $creds["${varPrefix}_KEYSTORE_PATH"]
$ksAlias = $creds["${varPrefix}_KEY_ALIAS"]
$ksStorePass = $creds["${varPrefix}_STORE_PASSWORD"]
$ksKeyPass = $creds["${varPrefix}_KEY_PASSWORD"]

if ($ksPath -and -not (Test-Path $ksPath)) {
    $fallbackKs = Join-Path $KeystoreDir (Split-Path -Leaf $ksPath)
    if (Test-Path $fallbackKs) { $ksPath = $fallbackKs }
}
if (-not $ksPath -or -not (Test-Path $ksPath)) {
    Write-Host "[ERROR] Keystore no encontrado para ${AppSlug}: $ksPath" -ForegroundColor Red
    exit 1
}

$env:RELEASE_KEYSTORE_PATH = $ksPath
$env:RELEASE_KEY_ALIAS = $ksAlias
$env:RELEASE_STORE_PASSWORD = $ksStorePass
$env:RELEASE_KEY_PASSWORD = $ksKeyPass

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " [4ALL BUILD] Compilando APK firmado: $AppSlug v$Version" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

Push-Location $appDir
try {
    # 1. Expo Prebuild Android (call root hoisted expo CLI directly)
    if (-not (Test-Path (Join-Path $appDir "android"))) {
        Write-Host "-> Ejecutando expo prebuild --platform android..." -ForegroundColor Yellow
        $expoCli = Join-Path $repoRoot "node_modules\expo\bin\cli"
        node "$expoCli" prebuild --platform android --no-install
        if ($LASTEXITCODE -ne 0) { throw "expo prebuild fallo para $AppSlug" }
    }

    # 2. Ensure signingConfigs.release exists and buildTypes.release uses it in android/app/build.gradle
    $buildGradlePath = Join-Path $appDir "android\app\build.gradle"
    $gradleContent = Get-Content $buildGradlePath -Raw
    if ($gradleContent -notmatch "RELEASE_KEYSTORE_PATH") {
        Write-Host "-> Inyectando configuracion de firma release en build.gradle..." -ForegroundColor Yellow
        $releaseSigningSnippet = @"
        release {
            def ksPath = System.getenv("RELEASE_KEYSTORE_PATH")
            if (ksPath && file(ksPath).exists()) {
                storeFile file(ksPath)
                storePassword System.getenv("RELEASE_STORE_PASSWORD")
                keyAlias System.getenv("RELEASE_KEY_ALIAS")
                keyPassword System.getenv("RELEASE_KEY_PASSWORD")
            }
        }
"@
        $gradleContent = $gradleContent -replace "signingConfigs\s*\{", "signingConfigs {`n$releaseSigningSnippet"
    }
    # Fix any accidental signingConfig inside signingConfigs.release block
    $gradleContent = $gradleContent -replace "(?m)^(\s*release\s*\{)signingConfig signingConfigs\.release", '$1'
    # Replace signingConfig signingConfigs.debug inside buildTypes.release ONLY
    $gradleContent = [regex]::Replace(
        $gradleContent,
        "(buildTypes\s*\{[\s\S]*?release\s*\{[\s\S]*?)signingConfig\s+signingConfigs\.debug",
        '$1signingConfig signingConfigs.release'
    )
    Set-Content -Path $buildGradlePath -Value $gradleContent -Encoding UTF8
    # Rewrite without UTF-8 BOM (Groovy fails on BOM)
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($buildGradlePath, $gradleContent.TrimStart([char]0xFEFF), $utf8NoBom)

    # 3. Ensure local.properties points to the detected Android SDK
    $localProps = Join-Path $appDir "android\local.properties"
    $escapedSdk = ($androidHome -replace '\\', '\\') -replace ':', '\:'
    "sdk.dir=$escapedSdk" | Out-File -FilePath $localProps -Encoding ASCII

    # 4. Run Gradle assembleRelease
    Push-Location (Join-Path $appDir "android")
    try {
        Write-Host "-> Compilando con Gradle assembleRelease (ABIs: $Architectures)..." -ForegroundColor Yellow
        .\gradlew.bat assembleRelease --no-daemon "-PreactNativeArchitectures=$Architectures"
        if ($LASTEXITCODE -ne 0) { throw "gradlew assembleRelease fallo para $AppSlug" }
    } finally {
        Pop-Location
    }

    # 5. Copy signed APK to centralized output directory
    $builtApk = Join-Path $appDir "android\app\build\outputs\apk\release\app-release.apk"
    if (-not (Test-Path $builtApk)) {
        throw "No se encontro el APK generado en $builtApk"
    }

    $versionDir = Join-Path $OutputDir "v$Version"
    New-Item -ItemType Directory -Force -Path $versionDir | Out-Null
    $finalApk = Join-Path $versionDir "$AppSlug-v$Version.apk"
    Copy-Item -Path $builtApk -Destination $finalApk -Force

    # 6. Compute SHA-256 and update versions.json
    $hash = (Get-FileHash -Path $finalApk -Algorithm SHA256).Hash.ToLower()
    $sizeMb = [math]::Round((Get-Item $finalApk).Length / 1MB, 2)

    $versionsPath = Join-Path $repoRoot "apps\web\public\versions.json"
    if (Test-Path $versionsPath) {
        $vJson = Get-Content $versionsPath -Raw | ConvertFrom-Json
        if ($vJson.apps.PSObject.Properties.Name -contains $AppSlug) {
            $vJson.apps.$AppSlug.sha256 = $hash
            $vJson.apps.$AppSlug.version = $Version
            $vJson.updatedAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
            $utf8NoBomJson = New-Object System.Text.UTF8Encoding $false
            [System.IO.File]::WriteAllText($versionsPath, ($vJson | ConvertTo-Json -Depth 5), $utf8NoBomJson)
        }
    }

    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host " [OK] APK FIRMADO LISTO: $finalApk" -ForegroundColor Green
    Write-Host " -> Peso:    $sizeMb MB" -ForegroundColor White
    Write-Host " -> SHA-256: $hash" -ForegroundColor White
    Write-Host "============================================================" -ForegroundColor Green
} finally {
    Pop-Location
}
