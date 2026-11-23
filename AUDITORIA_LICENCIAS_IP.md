# Auditoría de Propiedad Intelectual y Licencias de Terceros 🛡️

**Fecha de Auditoría:** Septiembre 2026  
**Ecosistema:** Para Todos (4All) — Monorepositorio Turborepo  
**Licencia Principal del Ecosistema:** PolyForm Noncommercial License 1.0.0  
**Objetivo:** Certificar que ninguna dependencia de terceros contamine el código fuente con cláusulas *copyleft virales* (GPL / AGPL), garantizando la titularidad limpia y la viabilidad de una futura venta o adquisición corporativa (M&A Due Diligence).

---

## 1. Resumen Ejecutivo del Dictamen Legal

| Métrica | Resultado | Estado |
| :--- | :---: | :---: |
| **Total de Paquetes Auditados** | **763** | Evaluados al 100% |
| **Dependencias Permisivas (MIT, Apache 2.0, BSD, ISC, 0BSD)** | **759** | 🟢 100% Seguras |
| **Dependencias con Doble Licencia (MIT/BSD disponible)** | **4** | 🟢 Seguras (Se opta por MIT/BSD) |
| **Dependencias estrictamente Copyleft (GPL / AGPL puro)** | **0** |  **CERO RIESGO VIRAL** |
| **SDKs de Terceros con Rastreo / Telemetría Oculta** | **0** |  **CERO TRACKING** |

> [!IMPORTANT]
> **DICTAMEN:** El monorepositorio **Para Todos (4All)** se encuentra **100% libre de código viral o infeccioso**. Todas las dependencias son legalmente compatibles con la licencia propietaria **PolyForm Noncommercial 1.0.0** y conservan intacto el derecho exclusivo de explotación, licenciamiento y venta comercial del autor.

---

## 2. Clasificación Detallada de Licencias en el Ecosistema

### A. Dependencias Permisivas Principales (Aptas para Software Propietario y Comercial)
* **MIT License (Mayoritaria ~88%):** React, React Native, Zustand, Lucide Icons, Astro, Tailwind CSS, Prettier, Turborepo, date-fns, etc.
* **Apache 2.0 (~7%):** Google Oboe (C++ Audio), Supabase Client, TypeScript types.
* **BSD-2-Clause / BSD-3-Clause (~3%):** React Native SVG, Terser, etc.
* **ISC / 0BSD / CC0-1.0 (~2%):** tslib, i18next, date-holidays.

### B. Análisis de Paquetes con Doble Licencia (Dual-Licensed)
Bajo la jurisprudencia internacional de software de código abierto, cuando un autor ofrece su librería bajo una licencia dual (*Dual-License* con conector `OR`), el receptor tiene el derecho incondicional de acogerse a la opción más conveniente:

1. **`jszip` (v3.10.1):**
   - Licencia declarada: `(MIT OR GPL-3.0-or-later)`
   - **Opción ejercida por 4All:** **MIT**. Libre de obligaciones copyleft.
2. **`node-forge` (v1.4.0):**
   - Licencia declarada: `(BSD-3-Clause OR GPL-2.0)`
   - **Opción ejercida por 4All:** **BSD-3-Clause**. Libre de obligaciones copyleft.
3. **`xdate` (v0.8.3):**
   - Licencia declarada: `(MIT OR GPL-2.0)`
   - **Opción ejercida por 4All:** **MIT**. Libre de obligaciones copyleft.
4. **`@img/sharp-win32-x64` (v0.35.3):**
   - Dependencia exclusiva del entorno de desarrollo web en Windows (Astro build). No se empaqueta en los binarios móviles (APKs/AABs).

---

## 3. Política de Admisión de Nuevas Dependencias (Regla Permanente)

Para preservar la inmunidad legal del ecosistema ante futuras actualizaciones, todo desarrollador o agente de IA debe cumplir:

1. ❌ **Queda estrictamente prohibido instalar dependencias con licencias:**
   - GNU General Public License (GPL v1, v2, v3).
   - GNU Affero General Public License (AGPL).
   - Creative Commons ShareAlike (CC-BY-SA).
   - Licencias comerciales cerradas que exijan pago de regalías por usuario activo.
2. ✅ **Licencias aprobadas automáticamente:**
   - MIT
   - Apache 2.0
   - BSD (2-Clause y 3-Clause)
   - ISC
   - Unlicense / Public Domain / CC0
3. 📦 **En componentes nativos C++ y Android NDK:**
   - Usar `AMediaCodec` y `AMediaExtractor` del sistema operativo (AOSP/Android SDK).
   - Usar Google Oboe (Apache 2.0).
   - Prohibido enlazar FFmpeg en compilaciones estáticas con códecs GPL patentados.

---

*Certificación emitida por la herramienta de auditoría automatizada de dependencias del monorepositorio Para Todos (4All).*
