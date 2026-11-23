param (
    [Parameter(Mandatory = $false)]
    [string]$OutputDir = "D:\APP_development\4All_Keystores_PRIVADO"
)

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " [4ALL DEVOPS] Generador de 15 Keystores de Produccion" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

# Verificar keytool
$keytool = Get-Command "keytool" -ErrorAction SilentlyContinue
if (-not $keytool) {
    Write-Host "[ERROR] 'keytool' no encontrado en PATH. Verifica tu instalacion de JDK." -ForegroundColor Red
    exit 1
}

# Verificar que OutputDir este FUERA del repositorio Git
$repoPath = (Resolve-Path "d:\APP_development\Apps_4all").Path
if ($OutputDir.StartsWith($repoPath, [System.StringComparison]::OrdinalIgnoreCase)) {
    Write-Host "[BLOQUEADO] El directorio de keystores NO puede estar dentro del repositorio Git." -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

$apps = @(
    "apuntes-4all",
    "azar-4all",
    "cuentas-4all",
    "docs-4all",
    "enfoque-4all",
    "festivos-4all",
    "fotos-ligeras-4all",
    "lupa-4all",
    "medidas-4all",
    "notas-voz-4all",
    "pdf-4all",
    "qr-4all",
    "reproductor-4all",
    "seguridad-4all",
    "zip-4all"
)

function New-StrongPassword {
    $bytes = New-Object byte[] 24
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    return [Convert]::ToBase64String($bytes) -replace '[+/=]', ''
}

$envLines = @("# ARCHIVO PRIVADO DE FIRMAS 4ALL - NUNCA SUBIR A GIT")
$shaLines = @("# HUELLAS DIGITALES SHA-256 OFICIALES - PARA TODOS (4ALL)", "")

foreach ($app in $apps) {
    $ksPath = Join-Path $OutputDir "$app-release.keystore"
    $alias = "$app-key"

    if (Test-Path $ksPath) {
        Write-Host "[SKIP] Ya existe: $ksPath" -ForegroundColor Yellow
        continue
    }

    $storePass = New-StrongPassword
    $keyPass = $storePass
    $dname = "CN=Mauricio Saldarriaga, OU=RedStabros, O=Para Todos 4All, L=Bogota, C=CO"

    & $keytool.Source -genkeypair -v `
        -storetype PKCS12 `
        -keystore $ksPath `
        -alias $alias `
        -keyalg RSA `
        -keysize 4096 `
        -validity 10000 `
        -storepass $storePass `
        -keypass $keyPass `
        -dname $dname 2>&1 | Out-Null

    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Fallo generando keystore para $app" -ForegroundColor Red
        exit 1
    }

    # Extraer SHA-256
    $certInfo = & $keytool.Source -list -v -keystore $ksPath -alias $alias -storepass $storePass 2>&1
    $sha256Line = ($certInfo | Select-String -Pattern "SHA256:").ToString().Trim()

    $varPrefix = ($app -replace '-', '_').ToUpper()
    $envLines += ""
    $envLines += "${varPrefix}_KEYSTORE_PATH=$ksPath"
    $envLines += "${varPrefix}_KEY_ALIAS=$alias"
    $envLines += "${varPrefix}_STORE_PASSWORD=$storePass"
    $envLines += "${varPrefix}_KEY_PASSWORD=$keyPass"

    $shaLines += "$app | $sha256Line"
    Write-Host "[OK] $app -> Keystore PKCS12 (RSA 4096, 27 anos) generado" -ForegroundColor Green
}

$envFile = Join-Path $OutputDir ".env.signing"
$shaFile = Join-Path $OutputDir "SHA256_FINGERPRINTS.txt"

$envLines | Out-File -FilePath $envFile -Encoding utf8
$shaLines | Out-File -FilePath $shaFile -Encoding utf8

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host " COMPLETADO! Respalda INMEDIATAMENTE en USB cifrada + gestor:" -ForegroundColor Green
Write-Host " -> Carpeta: $OutputDir" -ForegroundColor White
Write-Host " -> Claves:  $envFile" -ForegroundColor White
Write-Host " -> SHA256:  $shaFile" -ForegroundColor White
Write-Host "============================================================" -ForegroundColor Green

