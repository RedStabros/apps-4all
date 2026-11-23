# Plan de Widgets (Post-Desarrollo)

Este documento guarda la arquitectura para implementar widgets nativos en las apps del ecosistema "Para Todos" una vez que finalicemos el desarrollo y pasemos a las compilaciones de producción (EAS Build), abandonando Expo Go.

## ¿Por qué posponerlo?
Expo Go no admite la inyección de código nativo (Kotlin/Swift) en tiempo de ejecución. Añadir widgets ahora rompería el flujo de prueba rápido (Hot Reloading en el celular).

## Arquitectura de Android Widget
- **Librería a usar:** `react-native-android-widget`.
- **Implementación:** Se debe crear una carpeta `widget/` en cada app (ej. `apps/festivos-4all/widget`).
- **Estado Offline:** El widget no hará solicitudes HTTP. Consumirá directamente el `AsyncStorage` de la app principal usando los "Shared Preferences" de Android para leer la configuración del usuario (ej. qué países sigue).
- **Actualización:** Se registrará una "Headless Task" en `index.js` que se despierte a las 00:01 AM cada día para recalcular el "Próximo festivo" usando la librería matemática `date-holidays` y repintar el widget.

## Arquitectura de iOS Widget (Futuro)
- Requerirá una Mac o EAS Build de Expo.
- Se recomienda usar **Expo Config Plugins** (como `react-native-widget-extension`) para escribir una "Widget Extension" nativa en Swift que lea de `NSUserDefaults` (App Groups) para comunicarse con el `AsyncStorage` de React Native.
