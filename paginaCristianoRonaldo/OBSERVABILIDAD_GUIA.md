# Observabilidad Local — Guía de Pruebas

## Descripción general

El sistema de observabilidad de CR7 captura eventos, errores y métricas del sitio **completamente en el navegador**, sin servidor ni envío de datos externos.

Los datos se almacenan en `localStorage` bajo la clave `cr7-observability-data` y son accesibles mediante la API pública:

```javascript
window.CR7Observability.getSnapshot()  // Obtiene el snapshot actual
window.CR7Observability.export()        // Exporta JSON
window.CR7Observability.clearData()     // Limpia el almacenamiento
window.CR7Observability.generateDemo()  // Genera un evento de demo
```

## Archivos creados

- **observabilidad.js** — Motor de captura de eventos (9,4 KB)
- **observabilidad.html** — Dashboard interactivo (6,2 KB)
- **observabilidad.css** — Estilos semánticos y responsive (4,8 KB)

## Qué se captura

### Performance API
- Tiempos de navegación (navigationStart, loadEventEnd, etc.)
- Métricas de recursos (duración, tamaño, tipo)
- Timing de DOMContentLoaded y load

### Errores
- Excepciones no capturadas (`window.error`)
- Promesas rechazadas (`unhandledrejection`)
- Errores de carga de recursos (img, script, link fallidos)

### Interacciones
- Clicks en enlaces (`<a>`), botones (`<button>`), inputs, elementos con `role="button"`
- Cambios en inputs y selects
- Captura de texto y atributos accesibles

### Estado del navegador
- Cambios de visibilidad de la pestaña (Page Visibility API)
- Conexión (en línea / offline)
- Viewport (ancho, alto, DPR)
- Capacidades de APIs (Service Worker, Geolocation, Crypto, etc.)

## Cómo probar

### 1. Abrir el sitio principal

El sitio automáticamente carga `observabilidad.js` y comienza a registrar eventos. No hay cambios visibles en la página.

```bash
# En la carpeta paginaCristianoRonaldo:
python -m http.server 8000
# Luego: http://localhost:8000/
```

### 2. Activar eventos en la página principal

- **Navega** entre secciones (Inicio, Biografía, Trayectoria, etc.)
- **Abre/cierra** el menú móvil (< 760 px)
- **Expande** las etapas de trayectoria
- **Filtra** por país
- **Amplía** imágenes de la galería
- **Cambia pestaña** de tu navegador (observa el cambio de visibilidad)

### 3. Abrir el dashboard

En la misma pestaña o en otra, abre:

```
http://localhost:8000/observabilidad.html
```

El dashboard mostrará en **tiempo real** (se actualiza cada 2 segundos):

- **Resumen**: tiempo de sesión, estado de conexión, contadores
- **Entorno**: User-Agent, viewport, conexión, APIs disponibles
- **Performance**: tiempos de carga desde Performance API
- **Recursos**: imágenes, CSS, JavaScript cargados (primeros 50)
- **Errores**: cualquier excepción no capturada
- **Recursos fallidos**: imágenes/scripts que no cargaron
- **Interacciones**: últimos 20 clicks, cambios de input
- **Visibilidad**: cambios de estado de la pestaña

### 4. Pruebas interactivas

En el dashboard hay 4 botones:

#### **🔄 Actualizar**
Refresca el dashboard (se actualiza automáticamente cada 2 s de todas formas).

#### **⚡ Evento demo**
Genera manualmente un evento de click ficticio para verificar que la captura funciona. Aparecerá en la sección "Últimas interacciones".

#### **⬇️ Descargar JSON**
Descarga un archivo `.json` con el snapshot completo. Incluye:
- Tiempos de performance
- Todos los errores capturados
- Todas las interacciones
- Datos del entorno

El archivo se llama `cr7-observability-YYYY-MM-DD.json`.

#### **🗑️ Limpiar datos**
Vacía todo el localStorage de observabilidad. **No se puede deshacer**. El sitio seguirá capturando eventos desde cero.

### 5. Pruebas especiales

#### Simular un error
En la consola del navegador, ejecuta:

```javascript
throw new Error('Prueba de error manual')
```

El error debería aparecer en la sección **Errores capturados** al actualizar el dashboard.

#### Simular un recurso fallido
En la consola:

```javascript
var img = new Image()
img.onerror = function() { console.log('Recurso fallido capturado') }
img.src = 'http://localhost:8000/no-existe.png'
```

#### Probar sin conexión
1. Abre DevTools (F12)
2. Ve a la pestaña **Network**
3. Marca la casilla **Offline**
4. Recarga la página o navega

El indicador de conexión en el dashboard cambiará a **Sin conexión** (amarillo).

#### Probar visibilidad
Con el dashboard abierto:
1. Abre otra pestaña
2. Vuelve a la pestaña del sitio CR7
3. El dashboard registrará dos eventos en "Cambios de visibilidad": oculta → visible

### 6. Inspeccionar localStorage

En la consola del navegador:

```javascript
// Ver todo el almacenamiento
JSON.parse(localStorage.getItem('cr7-observability-data'))

// Ver solo errores
JSON.parse(localStorage.getItem('cr7-observability-data')).errors

// Ver solo interacciones
JSON.parse(localStorage.getItem('cr7-observability-data')).interactions

// Ver entorno
JSON.parse(localStorage.getItem('cr7-observability-data')).environment
```

### 7. Probar en dispositivos

#### Desktop (1440 px)
- Todos los controles visible
- Tabla de datos sin scroll horizontal

#### Tablet (768 px)
- Grid de estado en 2 columnas
- Botones apilados en 2 columnas

#### Móvil (375 px)
- Botones en 1 columna
- Tablas en 1 columna (font-size reducido)
- Estado cards en 1 columna

## Estructura de datos en localStorage

```json
{
  "startTime": 1725790123456,
  "navigation": {
    "type": 0,
    "redirectCount": 0,
    "timing": { /* objeto con navigationStart, loadEventEnd, etc */ }
  },
  "errors": [
    {
      "type": "error",
      "timestamp": 1725790150000,
      "message": "Elemento no encontrado",
      "source": "observabilidad.js",
      "lineno": 42,
      "colno": 15
    }
  ],
  "resources": [
    {
      "timestamp": 1725790150000,
      "type": "img",
      "src": "http://localhost:8000/no-existe.png",
      "status": "failed"
    }
  ],
  "interactions": [
    {
      "timestamp": 1725790152000,
      "type": "click",
      "element": "a",
      "text": "Ver su trayectoria",
      "url": "#trayectoria"
    }
  ],
  "pageVisibility": [
    {
      "timestamp": 1725790155000,
      "state": "hidden"
    }
  ],
  "environment": {
    "userAgent": "Mozilla/5.0 ...",
    "language": "es-ES",
    "viewport": { "width": 1440, "height": 900, "dpr": 1 },
    "onLine": true,
    "connection": { "effectiveType": "4g", "downlink": 5.45, "rtt": 30 },
    "storage": { "localStorage": true, "sessionStorage": true, "indexedDB": true },
    "apis": { "performance": true, "serviceWorker": false, "geolocation": true, ... }
  },
  "resourceMetrics": [
    { "name": "styles.css", "type": "stylesheet", "duration": 15, "size": 21769 }
  ],
  "metadata": {
    "version": "1.0",
    "capturedAt": 1725790200000
  }
}
```

## Limitaciones y notas

- **Max eventos**: se mantienen los últimos 500 eventos de cada tipo para no saturar localStorage (~2–5 MB típicamente)
- **sin servidor**: todo está en el navegador; si limpias localStorage o cambias de navegador, los datos se pierden
- **compatible**: fallback graceful si localStorage no está disponible (no captura, pero no rompe)
- **performance**: la captura es mínima (~<1 ms por evento); `queryPerformance()` solo se ejecuta una vez al cargar

## Validación

Los archivos JavaScript se han validado con `node --check`:

```
✓ script.js — sintaxis correcta
✓ observabilidad.js — sintaxis correcta
```

No hay errores sintácticos ni dependencias externas.

## Accesibilidad

- Semántico: `<table>`, `<section>`, `<header>`, `<details>`, etc.
- ARIA: `role="group"`, `aria-label` en controles
- Focus visible: contorno verde de 3 px en botones
- Colores accesibles: contraste mínimo 4.5:1
- Responsive: Mobile (375 px) → Tablet (768 px) → Desktop (1440 px)

## Seguridad

- **Sin envío de datos**: todo queda en el dispositivo del usuario
- **localStorage**: isolado por origen (https://dominio.com ≠ https://otro.com)
- **CORS no aplica**: no hay peticiones HTTP a servidores externos
- **Sanitización**: el dashboard escapa HTML en eventos para evitar XSS
