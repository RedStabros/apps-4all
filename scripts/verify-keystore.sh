#!/usr/bin/env bash
# ==============================================================================
# Script de Verificación Criptográfica de Firmas APK/AAB para CI/CD (Bash)
# ==============================================================================
set -euo pipefail

APK_PATH="${1:-}"
EXPECTED_SHA256="${2:-}"

echo -e "\n======================================================="
echo -e "🛡️  AUDITORÍA CRIPTOGRÁFICA DE FIRMAS - ECOSISTEMA 4ALL"
echo -e "=======================================================\n"

if [ -z "$APK_PATH" ]; then
    echo "Buscando APKs de release en el repositorio..."
    APK_PATH=$(find . -type f -name "*release*.apk" ! -path "*/node_modules/*" | head -n 1 || true)
    if [ -z "$APK_PATH" ]; then
        echo "ℹ️ No se detectó un APK compilado actualmente en el repositorio."
        echo "Uso: ./scripts/verify-keystore.sh <ruta-al-apk> [sha256-esperado]"
        exit 0
    fi
fi

if [ ! -f "$APK_PATH" ]; then
    echo "❌ Error: El archivo APK '$APK_PATH' no existe."
    exit 1
fi

# Detectar apksigner
APKSIGNER_BIN="apksigner"
if ! command -v apksigner &> /dev/null; then
    if [ -n "${ANDROID_HOME:-}" ] && [ -d "$ANDROID_HOME/build-tools" ]; then
        LATEST_BUILD_TOOLS=$(ls -d "$ANDROID_HOME/build-tools/"* | sort -V | tail -n 1)
        if [ -f "$LATEST_BUILD_TOOLS/apksigner" ]; then
            APKSIGNER_BIN="$LATEST_BUILD_TOOLS/apksigner"
        fi
    fi
fi

echo "Inspeccionando certificados y esquemas de firma para: $APK_PATH..."
SIGNER_OUTPUT=$("$APKSIGNER_BIN" verify --verbose --print-certs "$APK_PATH" 2>&1)

if echo "$SIGNER_OUTPUT" | grep -Eq "(Android Debug|androiddebugkey)"; then
    echo "🚨 ALERTA CRÍTICA: El APK fue firmado con DEBUG.KEYSTORE."
    echo "⛔ ESTE BINARIO NO ES APTO PARA PRODUCCIÓN NI PARA GOOGLE PLAY."
    exit 1
fi

if echo "$SIGNER_OUTPUT" | grep -q "Verifies"; then
    echo "✅ Integridad de Firma Verificada: APK firmado correctamente."
    SHA256_FINGERPRINT=$(echo "$SIGNER_OUTPUT" | grep "Signer #1 certificate SHA-256 digest:" | awk '{print $NF}' || true)
    if [ -n "$SHA256_FINGERPRINT" ]; then
        echo "🔑 SHA-256 Fingerprint del Certificado: $SHA256_FINGERPRINT"
        if [ -n "$EXPECTED_SHA256" ]; then
            if [ "$SHA256_FINGERPRINT" = "$EXPECTED_SHA256" ]; then
                echo "🎯 COINCIDENCIA EXACTA con la huella esperada de producción."
            else
                echo "⚠️ La huella digital no coincide con la huella esperada de producción."
                exit 1
            fi
        fi
    fi
    echo -e "\n🎉 VALIDACIÓN EXITOSA: Binario seguro y listo para distribución."
    exit 0
else
    echo "❌ Error: El APK no tiene una firma válida."
    echo "$SIGNER_OUTPUT"
    exit 1
fi
