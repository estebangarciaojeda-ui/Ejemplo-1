/* =====================================================================
   Cristiano Ronaldo — JavaScript de la página
   JavaScript vanilla, sin librerías ni peticiones externas.

   Módulos:
   1. anioActual()        — año dinámico del pie
   2. menuResponsive()    — menú desplegable en móvil
   3. navegacionActiva()  — resalta el enlace de la sección visible
   4. trayectoria()       — filtros + tarjetas desplegables
   5. contadores()        — animación de las cifras de estadísticas
   6. visorGaleria()      — ampliar imágenes con teclado y ratón
   ===================================================================== */

(function () {
  'use strict';

  // ¿El usuario prefiere menos movimiento en pantalla? Se consulta como función
  // para que refleje también los cambios hechos con la página ya abierta.
  var mqMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)');
  function prefiereMenosMovimiento() {
    return mqMovimiento.matches;
  }

  /* ---------- 1. Año actual en el pie ---------- */
  function anioActual() {
    var salida = document.getElementById('anio-actual');
    if (!salida) return;
    salida.textContent = String(new Date().getFullYear());
  }

  /* ---------- 2. Menú responsive ---------- */
  function menuResponsive() {
    var boton = document.getElementById('menu-boton');
    var menu = document.getElementById('menu-principal');
    if (!boton || !menu) return;

    function cerrar() {
      menu.classList.remove('navegacion--abierta');
      boton.setAttribute('aria-expanded', 'false');
    }

    boton.addEventListener('click', function () {
      var abierto = boton.getAttribute('aria-expanded') === 'true';
      boton.setAttribute('aria-expanded', String(!abierto));
      menu.classList.toggle('navegacion--abierta', !abierto);
    });

    // Al pulsar un enlace del menú, se cierra (útil en pantallas pequeñas)
    menu.addEventListener('click', function (evento) {
      if (evento.target.closest('a')) cerrar();
    });

    // Escape cierra el menú y devuelve el foco al botón
    document.addEventListener('keydown', function (evento) {
      if (evento.key === 'Escape' && boton.getAttribute('aria-expanded') === 'true') {
        cerrar();
        boton.focus();
      }
    });

    // Si se agranda la ventana, el menú vuelve a su estado normal
    window.addEventListener('resize', function () {
      if (window.innerWidth > 760) cerrar();
    });
  }

  /* ---------- 3. Enlace activo según la sección visible ---------- */
  function navegacionActiva() {
    var enlaces = Array.prototype.slice.call(
      document.querySelectorAll('.navegacion__lista a[href^="#"]')
    );
    if (enlaces.length === 0 || !('IntersectionObserver' in window)) return;

    // Relaciona cada sección con su enlace correspondiente
    var mapa = new Map();
    enlaces.forEach(function (enlace) {
      var seccion = document.querySelector(enlace.getAttribute('href'));
      if (seccion) mapa.set(seccion, enlace);
    });

    function marcar(enlaceActivo) {
      enlaces.forEach(function (enlace) {
        if (enlace === enlaceActivo) {
          enlace.setAttribute('aria-current', 'true');
        } else {
          enlace.removeAttribute('aria-current');
        }
      });
    }

    var observador = new IntersectionObserver(function (entradas) {
      // Se queda con la sección visible más cercana a la parte superior
      var visibles = entradas.filter(function (entrada) {
        return entrada.isIntersecting;
      });
      if (visibles.length === 0) return;

      visibles.sort(function (a, b) {
        return a.boundingClientRect.top - b.boundingClientRect.top;
      });
      marcar(mapa.get(visibles[0].target));
    }, {
      rootMargin: '-45% 0px -45% 0px',
      threshold: 0
    });

    mapa.forEach(function (_enlace, seccion) {
      observador.observe(seccion);
    });
  }

  /* ---------- 4. Trayectoria: filtros y tarjetas desplegables ---------- */
  function trayectoria() {
    var lista = document.getElementById('linea-tiempo');
    if (!lista) return;

    var hitos = Array.prototype.slice.call(lista.querySelectorAll('.hito'));
    var botonesFiltro = Array.prototype.slice.call(document.querySelectorAll('.filtro'));
    var resultado = document.getElementById('filtros-resultado');

    // --- 4a. Desplegar y plegar cada etapa ---
    lista.addEventListener('click', function (evento) {
      var boton = evento.target.closest('.hito__boton');
      if (!boton) return;

      var detalle = document.getElementById(boton.getAttribute('aria-controls'));
      if (!detalle) return;

      var abierto = boton.getAttribute('aria-expanded') === 'true';
      boton.setAttribute('aria-expanded', String(!abierto));
      detalle.hidden = abierto;

      var hito = boton.closest('.hito');
      if (hito) hito.classList.toggle('hito--abierto', !abierto);
    });

    // --- 4b. Filtrar por etapa ---
    function aplicarFiltro(valor) {
      var visibles = 0;

      hitos.forEach(function (hito) {
        var coincide = valor === 'todos' || hito.dataset.etapa === valor;
        hito.hidden = !coincide;
        if (coincide) visibles += 1;
      });

      botonesFiltro.forEach(function (boton) {
        var activo = boton.dataset.filtro === valor;
        boton.classList.toggle('filtro--activo', activo);
        boton.setAttribute('aria-pressed', String(activo));
      });

      if (resultado) {
        resultado.textContent = visibles === 0
          ? 'No hay etapas para este filtro.'
          : 'Mostrando ' + visibles + (visibles === 1 ? ' etapa' : ' etapas') +
            ' de ' + hitos.length + '.';
      }
    }

    botonesFiltro.forEach(function (boton) {
      boton.addEventListener('click', function () {
        aplicarFiltro(boton.dataset.filtro);
      });
    });

    aplicarFiltro('todos');
  }

  /* ---------- 5. Contadores animados de estadísticas ---------- */
  function contadores() {
    var numeros = Array.prototype.slice.call(document.querySelectorAll('[data-contador]'));
    if (numeros.length === 0) return;

    function escribir(elemento, valor) {
      var sufijo = elemento.dataset.sufijo || '';
      elemento.textContent = valor.toLocaleString('es-ES') + sufijo;
    }

    function animar(elemento) {
      var destino = Number(elemento.dataset.contador);
      if (!isFinite(destino)) return;

      // El valor final ya está escrito en el HTML. Si no hay animación,
      // se deja tal cual (lo reafirmamos por si acaso) y no se toca nada más.
      if (prefiereMenosMovimiento()) {
        escribir(elemento, destino);
        return;
      }

      // Durante el recuento se oculta a la tecnología de asistencia para no
      // anunciar cifras intermedias; el valor semántico estable se restaura
      // al terminar la animación.
      elemento.setAttribute('aria-hidden', 'true');

      var duracion = 1200; // milisegundos
      var inicio = null;

      function paso(marca) {
        if (inicio === null) inicio = marca;
        var avance = Math.min((marca - inicio) / duracion, 1);
        // Suavizado: rápido al principio y lento al final
        var suave = 1 - Math.pow(1 - avance, 3);
        escribir(elemento, Math.round(destino * suave));
        if (avance < 1) {
          window.requestAnimationFrame(paso);
        } else {
          escribir(elemento, destino);
          elemento.removeAttribute('aria-hidden');
        }
      }

      window.requestAnimationFrame(paso);
    }

    if (!('IntersectionObserver' in window)) {
      numeros.forEach(function (elemento) {
        escribir(elemento, Number(elemento.dataset.contador));
      });
      return;
    }

    var observador = new IntersectionObserver(function (entradas, observadorActual) {
      entradas.forEach(function (entrada) {
        if (!entrada.isIntersecting) return;
        animar(entrada.target);
        observadorActual.unobserve(entrada.target); // se anima una sola vez
      });
    }, { threshold: 0.4 });

    numeros.forEach(function (elemento) {
      observador.observe(elemento);
    });
  }

  /* ---------- 6. Visor de la galería ---------- */
  function visorGaleria() {
    var visor = document.getElementById('visor');
    var imagen = document.getElementById('visor-imagen');
    var pie = document.getElementById('visor-pie');
    var cerrarBoton = document.getElementById('visor-cerrar');
    var galeria = document.getElementById('galeria-lista');
    if (!visor || !imagen || !pie || !cerrarBoton || !galeria) return;

    var ultimoBoton = null;

    function abrir(boton) {
      var miniatura = boton.querySelector('img');

      imagen.src = boton.dataset.imagen;
      imagen.alt = miniatura ? miniatura.alt : '';
      pie.textContent = boton.dataset.pie || '';

      visor.hidden = false;
      document.body.classList.add('sin-scroll');
      ultimoBoton = boton;
      cerrarBoton.focus();
    }

    function cerrar() {
      visor.hidden = true;
      document.body.classList.remove('sin-scroll');
      imagen.removeAttribute('src'); // evita que el navegador recargue la página como imagen
      imagen.alt = '';

      // Devuelve el foco a la miniatura desde la que se abrió
      if (ultimoBoton) {
        ultimoBoton.focus();
        ultimoBoton = null;
      }
    }

    galeria.addEventListener('click', function (evento) {
      var boton = evento.target.closest('.galeria__boton');
      if (boton) abrir(boton);
    });

    visor.addEventListener('click', function (evento) {
      // Cierra al pulsar el fondo oscuro o el botón de cerrar
      if (evento.target.closest('[data-cerrar-visor]')) cerrar();
    });

    document.addEventListener('keydown', function (evento) {
      if (visor.hidden) return;

      if (evento.key === 'Escape') {
        cerrar();
        return;
      }

      // Mantiene el foco dentro del visor mientras está abierto
      if (evento.key === 'Tab') {
        evento.preventDefault();
        cerrarBoton.focus();
      }
    });
  }

  /* ---------- Arranque ---------- */
  function iniciar() {
    anioActual();
    menuResponsive();
    navegacionActiva();
    trayectoria();
    contadores();
    visorGaleria();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
