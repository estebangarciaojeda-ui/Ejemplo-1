/* =====================================================================
   Pruebas básicas del sitio estático — sin dependencias externas.
   Uso:  node tests/basic-checks.mjs
   Sale con código 1 si alguna comprobación falla.
   ===================================================================== */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SITIO = join(RAIZ, 'paginaCristianoRonaldo');

let fallos = 0;
let hechas = 0;
const ok = (m) => { hechas++; console.log(`  ok    ${m}`); };
const fallo = (m) => { hechas++; fallos++; console.log(`  FALLO ${m}`); };

function seccion(t) { console.log(`\n== ${t} ==`); }

/* ---------- 1. Archivos obligatorios ---------- */
seccion('Archivos obligatorios');
const obligatorios = [
  'index.html', 'styles.css', 'script.js',
  'observabilidad.html', 'observabilidad.css', 'observabilidad.js',
];
for (const f of obligatorios) {
  existsSync(join(SITIO, f)) ? ok(f) : fallo(`falta ${f}`);
}

/* ---------- 2. Sintaxis de JavaScript (node --check) ---------- */
seccion('Sintaxis JavaScript (node --check)');
for (const f of readdirSync(SITIO).filter((n) => n.endsWith('.js'))) {
  try {
    execFileSync(process.execPath, ['--check', join(SITIO, f)], { stdio: 'pipe' });
    ok(f);
  } catch (e) {
    fallo(`${f}: ${String(e.stderr || e.message).split('\n')[0]}`);
  }
}

/* ---------- Utilidades de HTML ---------- */
const leer = (f) => readFileSync(join(SITIO, f), 'utf8');
const todos = (re, s) => [...s.matchAll(re)].map((m) => m[1]);

/* ---------- 3. Comprobaciones sobre index.html ---------- */
seccion('index.html — estructura y accesibilidad');
{
  const html = leer('index.html');

  // Landmarks
  for (const tag of ['header', 'nav', 'main', 'footer']) {
    new RegExp(`<${tag}[\\s>]`).test(html) ? ok(`<${tag}> presente`) : fallo(`falta <${tag}>`);
  }

  // Un único <h1>
  const h1 = (html.match(/<h1[\s>]/g) || []).length;
  h1 === 1 ? ok('exactamente un <h1>') : fallo(`hay ${h1} <h1> (debe ser 1)`);

  // IDs únicos
  const ids = todos(/\sid="([^"]+)"/g, html);
  const dup = ids.filter((v, i) => ids.indexOf(v) !== i);
  dup.length === 0 ? ok(`${ids.length} ids, todos únicos`) : fallo(`ids duplicados: ${[...new Set(dup)].join(', ')}`);

  // Anclas internas -> id existente
  const anclas = todos(/href="#([^"]+)"/g, html).filter((a) => a && a !== '');
  const rotas = anclas.filter((a) => !ids.includes(a));
  rotas.length === 0 ? ok(`${anclas.length} anclas internas resuelven`) : fallo(`anclas sin destino: ${rotas.join(', ')}`);

  // aria-controls / aria-labelledby -> id existente
  for (const attr of ['aria-controls', 'aria-labelledby']) {
    const refs = todos(new RegExp(`${attr}="([^"]+)"`, 'g'), html)
      .flatMap((v) => v.split(/\s+/));
    const mal = refs.filter((r) => !ids.includes(r));
    mal.length === 0 ? ok(`${attr}: ${refs.length} referencias válidas`) : fallo(`${attr} sin destino: ${mal.join(', ')}`);
  }

  // Toda <img> con alt no vacío (salvo el visor dinámico id="visor-imagen")
  const imgs = [...html.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);
  let imgMal = 0;
  for (const img of imgs) {
    if (/id="visor-imagen"/.test(img)) continue;
    const alt = (img.match(/\salt="([^"]*)"/) || [null, null])[1];
    if (alt === null || alt.trim() === '') { imgMal++; console.log(`        sin alt: ${img.slice(0, 80)}…`); }
  }
  imgMal === 0 ? ok(`${imgs.length} <img>, todas con alt descriptivo`) : fallo(`${imgMal} <img> sin alt`);

  // Recursos locales referenciados existen
  const recursos = [
    ...todos(/(?:src|href)="((?!https?:|data:|#|mailto:)[^"]+\.(?:css|js|jpg|jpeg|png|svg|webp))"/g, html),
    ...todos(/data-imagen="([^"]+)"/g, html),
  ];
  let recMal = 0;
  for (const r of [...new Set(recursos)]) {
    if (!existsSync(join(SITIO, r))) { recMal++; console.log(`        no existe: ${r}`); }
  }
  recMal === 0 ? ok(`${new Set(recursos).size} recursos locales existen`) : fallo(`${recMal} recursos no encontrados`);

  // El sitio carga sus scripts
  /<script[^>]+src="script\.js"/.test(html) ? ok('script.js enlazado') : fallo('script.js no enlazado');
  /<script[^>]+src="observabilidad\.js"/.test(html) ? ok('observabilidad.js enlazado') : fallo('observabilidad.js no enlazado');
}

/* ---------- 4. Comprobaciones sobre observabilidad.html ---------- */
seccion('observabilidad.html — estructura');
{
  const html = leer('observabilidad.html');
  const ids = todos(/\sid="([^"]+)"/g, html);
  const dup = ids.filter((v, i) => ids.indexOf(v) !== i);
  dup.length === 0 ? ok(`${ids.length} ids, todos únicos`) : fallo(`ids duplicados: ${[...new Set(dup)].join(', ')}`);

  for (const b of ['btn-actualizar', 'btn-demo', 'btn-descargar', 'btn-limpiar']) {
    ids.includes(b) ? ok(`botón #${b}`) : fallo(`falta botón #${b}`);
  }
  /no-absolute/.test('') /* noop */;
  !/(href|src)="\/[^/]/.test(html) ? ok('sin rutas absolutas (compatibles con Pages en subruta)') : fallo('hay rutas absolutas "/…"');
}

/* ---------- 5. Contrato de observabilidad.js ---------- */
seccion('observabilidad.js — contrato');
{
  const js = leer('observabilidad.js');
  /getSnapshot\s*:/.test(js) ? ok('expone getSnapshot()') : fallo('no expone getSnapshot()');
  /global\.CR7Observability\s*=/.test(js) ? ok('publica window.CR7Observability') : fallo('no publica window.CR7Observability');
  /['"]cr7-observability/.test(js) ? ok('clave localStorage con prefijo cr7-observability') : fallo('clave localStorage sin el prefijo pedido');
  /\belemento\b/.test(js) ? fallo("referencia a variable 'elemento' (bug conocido)") : ok("sin referencias a 'elemento'");
}

/* ---------- Resultado ---------- */
console.log(`\n${'-'.repeat(50)}`);
if (fallos === 0) {
  console.log(`RESULTADO: OK — ${hechas} comprobaciones, 0 fallos`);
  process.exit(0);
} else {
  console.log(`RESULTADO: FALLA — ${fallos} de ${hechas} comprobaciones han fallado`);
  process.exit(1);
}
