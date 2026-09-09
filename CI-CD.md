# CI/CD — Flujo completo hasta GitHub Pages

Documento de referencia del proceso de integración y despliegue continuo del
proyecto **Ejemplo-1** (sitio estático sobre Cristiano Ronaldo).

- **Repositorio:** <https://github.com/estebangarciaojeda-ui/Ejemplo-1> · rama `main` · público
- **Sitio publicado:** <https://estebangarciaojeda-ui.github.io/Ejemplo-1/>
- **Dashboard de observabilidad:** <https://estebangarciaojeda-ui.github.io/Ejemplo-1/observabilidad.html>
- **Workflow:** [`.github/workflows/ci.yml`](.github/workflows/ci.yml)
- **Pruebas:** [`tests/basic-checks.mjs`](tests/basic-checks.mjs)

---

## 0. Explicación en lenguaje llano: qué se hace y por qué

Esta sección cuenta, sin tecnicismos, **qué ocurre exactamente** desde que cambias
algo en el sitio hasta que ese cambio se ve publicado en internet. Las secciones
siguientes (1–8) son la versión detallada.

### 0.1 La idea de fondo

El proyecto es una web hecha **solo con archivos** (HTML, CSS, JavaScript e
imágenes). No hay base de datos ni programa que "se ejecute en un servidor": basta
con copiar esos archivos a un sitio que los sirva.

Lo que se ha montado es una **cinta transportadora automática** (un *pipeline*) que
hace ese trabajo sola y con una red de seguridad:

> Cada vez que subes un cambio, una máquina de GitHub **revisa** que el sitio no
> esté roto y, **solo si pasa la revisión**, lo **copia** a GitHub Pages, que es
> quien lo publica en una dirección web pública.

Si la revisión falla, **no se publica nada**: la web sigue mostrando la última
versión que sí estaba bien. A esto se le llama *CI/CD*:

- **CI (Integración Continua):** cada cambio se comprueba automáticamente.
- **CD (Despliegue Continuo):** si la comprobación pasa, el cambio se publica solo.

### 0.2 Qué haces tú (a mano)

1. Editas los archivos dentro de `paginaCristianoRonaldo/` (por ejemplo, cambias un
   texto de `index.html` o añades una foto a `assets/`).
2. Guardas ese cambio en el historial del proyecto: `git add -A && git commit -m "..."`.
3. Lo envías a GitHub: `git push`.

Y ya está. A partir de aquí no tocas nada más; lo demás es automático.

### 0.3 Qué hace la máquina (automático), paso a paso

En cuanto GitHub recibe tu `push` a la rama `main`, arranca solo el workflow
[`.github/workflows/ci.yml`](.github/workflows/ci.yml). Hace lo siguiente, en orden:

**Fase 1 — Revisar (CI). Job `pruebas`.**

1. GitHub **arranca una máquina virtual limpia** (Ubuntu) y **descarga tu código** en ella.
2. **Instala Node.js 22** (hace falta para ejecutar la revisión).
3. **Ejecuta el script `tests/basic-checks.mjs`**, que comprueba **31 cosas
   concretas**. En lenguaje llano, verifica que:
   - los archivos imprescindibles existen (`index.html`, `styles.css`, `script.js`,
     `observabilidad.*`);
   - el JavaScript **no tiene errores de sintaxis** (equivale a `node --check`);
   - la página está bien estructurada: **un solo** `<h1>` y las zonas semánticas
     `<header>`, `<nav>`, `<main>`, `<footer>`;
   - **no hay dos elementos con el mismo `id`**;
   - **todos los enlaces internos** (`href="#algo"`) apuntan a una sección que existe;
   - **todas las imágenes tienen texto alternativo** (`alt`), por accesibilidad;
   - **todos los recursos que la página pide** (hojas de estilo, scripts, fotos)
     **están realmente en el repositorio**;
   - el módulo de observabilidad **cumple su contrato**: expone
     `window.CR7Observability.getSnapshot()`, usa una clave de `localStorage` que
     empieza por `cr7-observability`, y no arrastra el bug ya corregido.
4. Si **una sola** de esas comprobaciones falla → **la cinta se detiene aquí**. No
   se publica nada, el run sale en rojo indicando qué ha fallado, y **la web
   pública no cambia**.

**Fase 2 — Publicar (CD). Job `desplegar`.** *(solo si la Fase 1 fue verde y el cambio está en `main`)*

5. GitHub arranca **otra máquina limpia** y vuelve a descargar el código.
6. **Empaqueta únicamente la carpeta `paginaCristianoRonaldo/`** en un archivo
   comprimido (el "artefacto"). Todo lo demás —este documento, la carpeta `tests/`,
   la configuración— **se queda fuera**: no forma parte de la web.
7. **Entrega ese paquete a GitHub Pages**, que lo descomprime y lo **publica en los
   servidores de GitHub** con dirección `https://` y certificado automático.
8. Escribe en el registro del run la **dirección final** de la web.

### 0.4 El resultado

Al cabo de **1–2 minutos**, tu cambio está visible para cualquiera en:

**<https://estebangarciaojeda-ui.github.io/Ejemplo-1/>**

(y el panel de observabilidad en `…/Ejemplo-1/observabilidad.html`).

### 0.5 Por qué está montado así

| Decisión | Motivo |
| --- | --- |
| La Fase 2 **no se ejecuta** si la Fase 1 falla (`needs: pruebas`) | Nada roto llega a producción. |
| Todo parte de una **máquina limpia** cada vez | Es reproducible: no depende de cómo esté configurado tu ordenador. |
| Se publica **solo `paginaCristianoRonaldo/`** | La web no expone documentación interna ni scripts de prueba. |
| Lo alojan **GitHub Actions + GitHub Pages** | Cero servidores que mantener: nosotros solo aportamos los archivos y las reglas. |
| Cada publicación queda ligada a un **`commit`** | Es trazable y se puede revertir con `git revert`. |

---

## 1. Visión general

Todo el ciclo es **sin servidor de aplicaciones y sin dependencias externas**: se
publica HTML/CSS/JS estático. GitHub aporta las tres piezas del pipeline.

| Pieza | Rol en el pipeline | Dónde se configura |
| --- | --- | --- |
| **Repositorio Git (GitHub)** | Fuente de la verdad. Cada `push` a `main` dispara el pipeline. | El propio repo + `.gitignore` |
| **GitHub Actions** | Motor de CI/CD. Ejecuta las pruebas y, si pasan, construye y despliega. | `.github/workflows/ci.yml` |
| **GitHub Pages** | Hosting estático. Recibe un artefacto de Actions y lo sirve por HTTPS. | Ajuste único en *Settings → Pages* + pasos del workflow |

### Diagrama del flujo

```mermaid
flowchart TD
    A[Desarrollo local<br/>edición de archivos] --> B[git commit]
    B --> C[git push a main]
    C --> D{GitHub recibe el push}
    D -->|dispara| E[Workflow ci.yml]

    subgraph GHA [GitHub Actions]
        E --> F[Job: pruebas<br/>ubuntu-latest + Node 22]
        F --> F1[checkout]
        F1 --> F2[setup-node]
        F2 --> F3[node tests/basic-checks.mjs<br/>31 comprobaciones]
        F3 --> G{¿exit code 0?}
        G -->|no| H[❌ Pipeline detenido<br/>no se despliega]
        G -->|sí| I[Job: desplegar<br/>needs: pruebas]
        I --> I1[checkout]
        I1 --> I2[configure-pages]
        I2 --> I3[upload-pages-artifact<br/>path: paginaCristianoRonaldo/]
        I3 --> I4[deploy-pages<br/>vía OIDC]
    end

    I4 --> J[(GitHub Pages<br/>CDN + HTTPS)]
    J --> K[🌐 estebangarciaojeda-ui.github.io/Ejemplo-1/]
    H -.->|corregir y volver a empujar| A
```

### Resumen en una frase

> `push` a `main` → **Actions** ejecuta 31 pruebas → si **todas pasan**, empaqueta la
> carpeta `paginaCristianoRonaldo/` y la entrega a **Pages** → la web queda online en
> `https://estebangarciaojeda-ui.github.io/Ejemplo-1/`.

---

## 2. El repositorio

### 2.1 Estructura relevante para CI/CD

```
Ejemplo-1/
├── .github/
│   └── workflows/
│       └── ci.yml                 # definición del pipeline
├── tests/
│   └── basic-checks.mjs           # pruebas (Node puro, sin dependencias)
├── paginaCristianoRonaldo/        # ← ESTO es lo que se publica en Pages
│   ├── index.html
│   ├── styles.css
│   ├── script.js
│   ├── observabilidad.html
│   ├── observabilidad.css
│   ├── observabilidad.js
│   ├── assets/                    # 9 imágenes JPEG
│   ├── .nojekyll                  # desactiva el procesado Jekyll de Pages
│   ├── AUDITORIA.md
│   └── OBSERVABILIDAD_GUIA.md
├── .gitignore
└── CI-CD.md                       # este documento
```

Punto clave: **el sitio vive en una subcarpeta** (`paginaCristianoRonaldo/`), no en
la raíz. El workflow publica solo esa carpeta, así que la documentación (`*.md`,
`tests/`, `.github/`) queda versionada pero **no** se sube a la web.

### 2.2 Ramas y disparo

| Evento en el repo | Qué ocurre |
| --- | --- |
| `push` a `main` | Se ejecutan **pruebas + despliegue**. |
| `pull_request` hacia `main` | Se ejecutan **solo las pruebas** (no se publica). |
| Ejecución manual (*Actions → Run workflow*) | `workflow_dispatch`: pruebas + despliegue. |

### 2.3 Convención de commits

Mensaje corto en imperativo + cuerpo opcional. Los commits generados con asistencia
llevan el *trailer* `Co-Authored-By:`.

Historial hasta la puesta en marcha del pipeline:

| Commit | Contenido |
| --- | --- |
| `214ea2b` | Commit inicial: sitio + observabilidad. |
| `d538e0e` | Alta del pipeline: `ci.yml` + `tests/basic-checks.mjs` + `.nojekyll`. |
| `6194ca0` | Commit vacío para relanzar el despliegue tras activar Pages. |
| `170b936` / `ccca3c0` | `CI-CD.md`: documentación del flujo. |
| *(posterior)* | Limpieza de avisos: acciones a versión con Node 24, `node-version` a `22`, se quita `enablement: true`. |

---

## 3. GitHub Actions (detalle)

Todo el comportamiento está en un único archivo declarativo:
[`.github/workflows/ci.yml`](.github/workflows/ci.yml).

### 3.1 Cabecera: disparadores, permisos y concurrencia

```yaml
name: CI y despliegue a GitHub Pages

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read      # leer el código en el checkout
  pages: write        # crear/actualizar el sitio de Pages
  id-token: write     # obtener un token OIDC para deploy-pages

concurrency:
  group: pages
  cancel-in-progress: false
```

| Bloque | Por qué está así |
| --- | --- |
| `on.push.branches: [main]` | Solo `main` publica. Ramas de trabajo no tocan producción. |
| `on.pull_request` | Un PR ejecuta las pruebas como *quality gate* antes de fusionar, sin desplegar. |
| `on.workflow_dispatch` | Permite relanzar el pipeline a mano desde la pestaña *Actions*. |
| `permissions` | Se concede al `GITHUB_TOKEN` **solo lo mínimo**. `pages: write` + `id-token: write` son obligatorios para publicar en Pages con el método moderno. |
| `concurrency.group: pages` | Si llegan dos push seguidos, los despliegues se **serializan**. |
| `cancel-in-progress: false` | No se aborta un despliegue a medias (dejaría Pages en estado incoherente). |

### 3.2 Job 1 — `pruebas` (fase CI)

```yaml
jobs:
  pruebas:
    name: Pruebas básicas
    runs-on: ubuntu-latest
    steps:
      - name: Descargar el código
        uses: actions/checkout@v5

      - name: Preparar Node.js
        uses: actions/setup-node@v5
        with:
          node-version: '22'

      - name: Ejecutar comprobaciones (sintaxis JS, estructura, accesibilidad, enlaces)
        run: node tests/basic-checks.mjs
```

| Paso | Acción | Resultado |
| --- | --- | --- |
| 1 | `actions/checkout@v5` | Clona el repo en el runner efímero. |
| 2 | `actions/setup-node@v5` (Node 22) | Deja `node` disponible en el `PATH`. |
| 3 | `node tests/basic-checks.mjs` | Ejecuta las pruebas. **Exit `0`** → job en verde. **Exit `1`** → job en rojo y el pipeline se para (el job de despliegue tiene `needs: pruebas`). |

#### Qué valida `tests/basic-checks.mjs` (31 comprobaciones, sin dependencias)

| Grupo | Comprobaciones |
| --- | --- |
| **Archivos obligatorios** | Existen `index.html`, `styles.css`, `script.js`, `observabilidad.html`, `observabilidad.css`, `observabilidad.js`. |
| **Sintaxis JavaScript** | `node --check` sobre **todos** los `.js` de la carpeta del sitio (`script.js`, `observabilidad.js`). |
| **`index.html` — estructura** | Existen los *landmarks* `<header>`, `<nav>`, `<main>`, `<footer>`; hay **exactamente un** `<h1>`. |
| **`index.html` — IDs** | Todos los `id` son únicos (sin duplicados). |
| **`index.html` — enlaces internos** | Cada `href="#ancla"` apunta a un `id` existente. |
| **`index.html` — ARIA** | Cada `aria-controls` y `aria-labelledby` referencia un `id` existente. |
| **`index.html` — imágenes** | Toda `<img>` tiene `alt` no vacío (excepto el visor dinámico `#visor-imagen`). |
| **`index.html` — recursos** | Cada `src`/`href`/`data-imagen` local (`.css`, `.js`, imágenes) apunta a un archivo que existe en disco. |
| **`index.html` — scripts** | `script.js` y `observabilidad.js` están enlazados. |
| **`observabilidad.html`** | IDs únicos; existen los botones `#btn-actualizar`, `#btn-demo`, `#btn-descargar`, `#btn-limpiar`; sin rutas absolutas `"/…"` (romperían bajo `/Ejemplo-1/`). |
| **`observabilidad.js` — contrato** | Expone `getSnapshot()`; publica `window.CR7Observability`; la clave de `localStorage` empieza por `cr7-observability`; no queda la variable `elemento` (bug ya corregido). |

Salida esperada (cola):

```
--------------------------------------------------
RESULTADO: OK — 31 comprobaciones, 0 fallos
```

### 3.3 Job 2 — `desplegar` (fase CD)

```yaml
  desplegar:
    name: Publicar en GitHub Pages
    needs: pruebas
    if: github.ref == 'refs/heads/main' && github.event_name != 'pull_request'
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v5

      - name: Configurar GitHub Pages
        uses: actions/configure-pages@v6

      - name: Empaquetar el sitio (carpeta paginaCristianoRonaldo)
        uses: actions/upload-pages-artifact@v5
        with:
          path: paginaCristianoRonaldo

      - name: Desplegar
        id: deployment
        uses: actions/deploy-pages@v5

      - name: Mostrar la URL publicada
        run: echo "Sitio publicado en ${{ steps.deployment.outputs.page_url }}"
```

| Elemento | Explicación |
| --- | --- |
| `needs: pruebas` | Este job **no arranca** si `pruebas` no ha terminado en verde. Es la puerta de calidad. |
| `if: github.ref == 'refs/heads/main' && github.event_name != 'pull_request'` | Doble seguro: solo publica en `main` y nunca desde un PR. |
| `environment: github-pages` | Vincula el job al *environment* `github-pages`. GitHub añade automáticamente una regla que restringe el despliegue a la rama por defecto. La URL final aparece en la pestaña *Environments* del repo. |

Pasos:

| # | Paso | Qué hace | Por qué |
| --- | --- | --- | --- |
| 1 | `actions/checkout@v5` | Vuelve a clonar el repo (job independiente = runner nuevo). | Necesita los archivos para empaquetarlos. |
| 2 | `actions/configure-pages@v6` | Lee la configuración de Pages del repo y expone metadatos (URL base, etc.). **Sin `enablement: true`**: no intenta crear el sitio (Pages ya está activado a mano). | Evita el error `Resource not accessible by integration` que daba el intento de creación por API. |
| 3 | `actions/upload-pages-artifact@v5` (`path: paginaCristianoRonaldo`) | Empaqueta esa carpeta en un artefacto `.tar.gz` llamado **`github-pages`** con los permisos que espera el servicio de Pages. | Es el "paquete" que Pages va a servir. Solo la subcarpeta → la web no incluye `tests/`, `.md`, etc. |
| 4 | `actions/deploy-pages@v5` (`id: deployment`) | Pide un **token OIDC** (de ahí `id-token: write`), le dice al servicio de Pages "publica el artefacto `github-pages` de este run" y espera a que termine. Expone `outputs.page_url`. | Es el despliegue real. Sin servidores propios: Pages descarga el artefacto y lo sirve. |
| 5 | `echo …page_url` | Deja la URL en el log del run. | Trazabilidad. |

### 3.4 Acciones de terceros utilizadas

| Acción | Versión | Función |
| --- | --- | --- |
| `actions/checkout` | `v5` | Clonar el repositorio en el runner. |
| `actions/setup-node` | `v5` | Instalar Node.js 22. |
| `actions/configure-pages` | `v6` | Leer la configuración de Pages y exponerla. |
| `actions/upload-pages-artifact` | `v5` | Crear el artefacto `github-pages` con el contenido del sitio. |
| `actions/deploy-pages` | `v5` | Publicar ese artefacto en el servicio de GitHub Pages. |

> Todas están **ancladas a una versión mayor** y en una versión que se ejecuta
> sobre **Node.js 24** (las `@v4`/`@v3`/`@v5-de-configure` anteriores corrían sobre
> Node 20, ya retirado por GitHub, y generaban un aviso en cada run). Para máxima
> reproducibilidad se pueden fijar a un SHA concreto.

### 3.5 Matriz de fallos y comportamiento

| Dónde falla | Efecto | Qué revisar |
| --- | --- | --- |
| `node --check` (sintaxis) | Job `pruebas` en rojo; **no se despliega**. La web sigue con la versión anterior. | Log del paso 3; corregir el `.js` y volver a empujar. |
| Comprobación estructural (ID duplicado, `alt` ausente, recurso inexistente, ancla rota…) | Igual que arriba: pipeline detenido. | La línea `FALLO …` del log dice exactamente qué. |
| `configure-pages` (paso 2 del deploy) | Job `desplegar` en rojo; los pasos siguientes quedan `skipped`. | Que **Pages esté activado** con *Source: GitHub Actions* (ver §4.1). |
| `deploy-pages` (paso 4) | Deploy en rojo. | Estado del servicio de Pages; permisos `pages: write` / `id-token: write`; reglas del *environment* `github-pages`. |
| Todo verde | Web actualizada en 1–2 min. | — |

Historial real:

- **`d538e0e`** — el job `desplegar` **falló en `configure-pages`** porque Pages
  nunca se había activado en el repo (`Get Pages site failed: Not Found`).
- **`6194ca0`** (run `34370294450`) — tras poner *Source = GitHub Actions* (§4.1),
  **ambos jobs pasaron** y la web quedó publicada. Aun así, mientras estuvo
  `enablement: true`, cada run dejaba en las anotaciones el error
  `Create Pages site failed: Resource not accessible by integration` (intento de
  crear por API un sitio que ya existía).
- **Limpieza posterior** — se quitó `enablement: true` (ya no hay intento de
  creación → sin ese error) y se subieron las acciones a versiones sobre Node 24
  (sin el aviso `Node.js 20 is deprecated`). Runs sin errores ni avisos.

---

## 4. GitHub Pages

### 4.1 Configuración única (manual, una sola vez)

**Settings → Pages → Build and deployment → Source: `GitHub Actions`.**

- No hay que elegir rama ni carpeta: la fuente es el artefacto que sube el workflow.
- **Hay que hacerlo a mano una vez.** Se probó a automatizarlo con
  `actions/configure-pages` + `enablement: true`, pero el `GITHUB_TOKEN` del
  workflow **no tiene permiso para crear el sitio de Pages** por API: devuelve
  `Resource not accessible by integration`. Por eso el workflow **ya no** usa
  `enablement: true` y da por hecho que este ajuste está puesto.
- Una vez configurado, no hay que volver a tocarlo: cada `push` a `main` republica.

### 4.2 Cómo publica Pages

1. `deploy-pages` notifica al servicio de Pages con el ID del artefacto `github-pages`.
2. Pages **descarga y descomprime** el `.tar.gz`.
3. Publica su contenido en la CDN de GitHub, con **HTTPS** y certificado automático.
4. `index.html` de la raíz del artefacto (= `paginaCristianoRonaldo/index.html`) es
   la portada.

### 4.3 URLs resultantes

| Recurso | URL |
| --- | --- |
| Portada | `https://estebangarciaojeda-ui.github.io/Ejemplo-1/` |
| Observabilidad | `https://estebangarciaojeda-ui.github.io/Ejemplo-1/observabilidad.html` |
| Un asset | `https://estebangarciaojeda-ui.github.io/Ejemplo-1/assets/cr7-juventus-2019.jpg` |

Patrón de *project page*: `https://<usuario>.github.io/<repositorio>/`.

### 4.4 Detalles que hacen que funcione en subruta

| Archivo / decisión | Motivo |
| --- | --- |
| Rutas **relativas** en el HTML (`styles.css`, `assets/…`, `observabilidad.js`) | La web cuelga de `/Ejemplo-1/`, no de `/`. Una ruta absoluta `"/styles.css"` daría 404. La prueba de `observabilidad.html` verifica que no haya rutas `"/…"`. |
| `paginaCristianoRonaldo/.nojekyll` | Desactiva el procesado Jekyll: los archivos se sirven **tal cual** (Jekyll ignoraría, por ejemplo, carpetas que empiezan por `_`). |
| Favicon como `data:` URI | No depende de ninguna ruta. |

### 4.5 Caché y propagación

- Primer despliegue tras activar Pages: hasta ~1–2 min en estar disponible.
- Actualizaciones posteriores: normalmente < 1 min.
- La CDN cachea; un `Ctrl/Cmd + Shift + R` fuerza recarga si ves contenido viejo.

---

## 5. Secuencia extremo a extremo

```text
 1. Editas archivos en paginaCristianoRonaldo/ (o tests/, o el workflow).
 2. node tests/basic-checks.mjs         (opcional, recomendado: probar en local)
 3. git add -A
 4. git commit -m "..."
 5. git push                            (a main)
 6. GitHub detecta el push y lanza el workflow "CI y despliegue a GitHub Pages".
 7. Job "pruebas":
      - checkout  →  setup-node (Node 22)  →  node tests/basic-checks.mjs
      - si exit != 0  →  ⛔ FIN. La web NO cambia. Vuelves al paso 1.
 8. Job "desplegar"  (solo si el paso 7 fue verde y es push a main):
      - checkout
      - configure-pages
      - upload-pages-artifact  (empaqueta paginaCristianoRonaldo/ → artefacto "github-pages")
      - deploy-pages           (Pages descarga y publica el artefacto vía OIDC)
 9. Pages sirve el contenido por HTTPS en la CDN de GitHub.
10. Web disponible/actualizada en:
      https://estebangarciaojeda-ui.github.io/Ejemplo-1/
```

---

## 6. Ejecutar las pruebas en local

Mismo comando que en CI (solo requiere Node ≥ 18):

```bash
node tests/basic-checks.mjs
echo "exit: $?"        # 0 = OK, 1 = alguna comprobación falló
```

Servir el sitio localmente para revisarlo antes de publicar:

```bash
cd paginaCristianoRonaldo
python -m http.server 8137
#  → http://localhost:8137/
```

---

## 7. Operación

### 7.1 Ver y relanzar ejecuciones

- **Historial:** pestaña **Actions** del repo.
- **Relanzar sin nuevo commit:** abrir el run → *Re-run jobs* / *Re-run failed jobs*.
- **Lanzar a mano:** *Actions → CI y despliegue a GitHub Pages → Run workflow*
  (usa `workflow_dispatch`).

### 7.2 Rollback

El despliegue publica siempre el estado de `main`. Para volver atrás:

```bash
git revert <commit-problemático>
git push
```

El pipeline se ejecuta de nuevo y republica la versión corregida. (Cada despliegue
histórico también queda listado en *Settings → Environments → github-pages*.)

### 7.3 Cómo extender el pipeline

| Objetivo | Cómo |
| --- | --- |
| Añadir un *linter* de HTML/CSS | Nuevo paso en el job `pruebas` (p. ej. `npx html-validate` / `npx stylelint`) tras `setup-node`. Añadir `package.json` si se quieren dependencias fijadas. |
| Comprobar enlaces rotos externos | Paso adicional con una herramienta tipo `lychee` o un script propio. |
| Ejecutar en varias versiones de Node | `strategy.matrix.node-version: [18, 20, 22]` en el job `pruebas`. |
| Entorno de *preview* por PR | Segundo job condicionado a `github.event_name == 'pull_request'` que publique en otro hosting (Pages solo admite un sitio por repo). |
| Cachear dependencias | `actions/setup-node` con `cache: npm` (cuando haya `package-lock.json`). |

---

## 8. Referencia rápida

| Concepto | Valor |
| --- | --- |
| Repo | `estebangarciaojeda-ui/Ejemplo-1` (público, rama `main`) |
| Workflow | `.github/workflows/ci.yml` |
| Pruebas | `tests/basic-checks.mjs` — 31 comprobaciones, sin dependencias |
| Runner | `ubuntu-latest` |
| Node (pruebas) | `22` |
| Acciones | `checkout@v5`, `setup-node@v5`, `configure-pages@v6`, `upload-pages-artifact@v5`, `deploy-pages@v5` |
| Carpeta publicada | `paginaCristianoRonaldo/` |
| Disparadores | `push`→`main`, `pull_request`→`main`, `workflow_dispatch` |
| Puerta de calidad | `desplegar` tiene `needs: pruebas` |
| Permisos del token | `contents: read`, `pages: write`, `id-token: write` |
| Config manual única | *Settings → Pages → Source: GitHub Actions* |
| URL pública | <https://estebangarciaojeda-ui.github.io/Ejemplo-1/> |
