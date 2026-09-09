/* =====================================================================
   Observabilidad — Captura y almacenamiento local de eventos
   Sin backend, sin servicios externos. localStorage + Performance API.
   ===================================================================== */

(function (global) {
  'use strict';

  var STORAGE_KEY = 'cr7-observability-data';
  var MAX_EVENTS = 500;

  /* --------- Inicialización de almacenamiento --------- */
  function getStorage() {
    try {
      var data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : createEmptyStorage();
    } catch (e) {
      console.warn('localStorage inaccesible:', e);
      return createEmptyStorage();
    }
  }

  function createEmptyStorage() {
    return {
      startTime: Date.now(),
      navigation: {},
      errors: [],
      resources: [],
      interactions: [],
      pageVisibility: [],
      environment: {},
      metadata: { version: '1.0', capturedAt: Date.now() }
    };
  }

  function saveStorage(data) {
    try {
      data.metadata.capturedAt = Date.now();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('No se pudo guardar en localStorage:', e);
    }
  }

  /* --------- Captura de Performance --------- */
  function capturePerformance(storage) {
    if (!window.performance) return;

    if (window.performance.navigation) {
      storage.navigation.type = window.performance.navigation.type;
      storage.navigation.redirectCount = window.performance.navigation.redirectCount;
    }

    if (window.performance.timing) {
      var t = window.performance.timing;
      storage.navigation.timing = {
        navigationStart: t.navigationStart,
        unloadEventStart: t.unloadEventStart,
        unloadEventEnd: t.unloadEventEnd,
        redirectStart: t.redirectStart,
        redirectEnd: t.redirectEnd,
        fetchStart: t.fetchStart,
        domainLookupStart: t.domainLookupStart,
        domainLookupEnd: t.domainLookupEnd,
        connectStart: t.connectStart,
        connectEnd: t.connectEnd,
        requestStart: t.requestStart,
        responseStart: t.responseStart,
        responseEnd: t.responseEnd,
        domLoading: t.domLoading,
        domInteractive: t.domInteractive,
        domContentLoadedEventStart: t.domContentLoadedEventStart,
        domContentLoadedEventEnd: t.domContentLoadedEventEnd,
        loadEventStart: t.loadEventStart,
        loadEventEnd: t.loadEventEnd
      };
    }

    if (window.performance.getEntriesByType) {
      var resources = window.performance.getEntriesByType('resource');
      storage.resourceMetrics = resources.slice(0, 50).map(function (r) {
        return {
          name: r.name,
          type: r.initiatorType,
          duration: Math.round(r.duration),
          size: r.transferSize || 0
        };
      });
    }
  }

  /* --------- Captura de Errores --------- */
  function setupErrorHandling(storage) {
    window.addEventListener('error', function (evento) {
      storage.errors.push({
        type: 'error',
        timestamp: Date.now(),
        message: evento.message,
        source: evento.filename,
        lineno: evento.lineno,
        colno: evento.colno
      });
      trimArray(storage.errors, MAX_EVENTS);
      saveStorage(storage);
    });

    window.addEventListener('unhandledrejection', function (evento) {
      storage.errors.push({
        type: 'unhandledRejection',
        timestamp: Date.now(),
        reason: String(evento.reason)
      });
      trimArray(storage.errors, MAX_EVENTS);
      saveStorage(storage);
    });
  }

  /* --------- Captura de Recursos --------- */
  function setupResourceTracking(storage) {
    document.addEventListener('error', function (evento) {
      var target = evento.target;
      if (target.tagName === 'IMG' || target.tagName === 'SCRIPT' || target.tagName === 'LINK') {
        storage.resources.push({
          timestamp: Date.now(),
          type: target.tagName.toLowerCase(),
          src: target.src || target.href,
          status: 'failed'
        });
        trimArray(storage.resources, 200);
        saveStorage(storage);
      }
    }, true);
  }

  /* --------- Captura de Interacciones --------- */
  function setupInteractionTracking(storage) {
    document.addEventListener('click', function (evento) {
      var target = evento.target;
      var element = target.closest('a, button, input, [role="button"]');
      if (element) {
        var text = element.textContent || element.value || element.getAttribute('aria-label') || '';
        storage.interactions.push({
          timestamp: Date.now(),
          type: 'click',
          element: element.tagName.toLowerCase(),
          text: text.substring(0, 100),
          url: element.href || element.getAttribute('data-action') || ''
        });
        trimArray(storage.interactions, MAX_EVENTS);
        saveStorage(storage);
      }
    });

    document.addEventListener('change', function (evento) {
      if (evento.target.tagName === 'INPUT' || evento.target.tagName === 'SELECT') {
        storage.interactions.push({
          timestamp: Date.now(),
          type: 'change',
          element: evento.target.tagName.toLowerCase(),
          value: evento.target.value ? evento.target.value.substring(0, 50) : ''
        });
        trimArray(storage.interactions, MAX_EVENTS);
        saveStorage(storage);
      }
    });
  }

  /* --------- Captura de Visibilidad --------- */
  function setupVisibilityTracking(storage) {
    if (!document.visibilityState) return;

    document.addEventListener('visibilitychange', function () {
      storage.pageVisibility.push({
        timestamp: Date.now(),
        state: document.visibilityState
      });
      trimArray(storage.pageVisibility, 100);
      saveStorage(storage);
    });
  }

  /* --------- Captura de Entorno --------- */
  function captureEnvironment(storage) {
    storage.environment.userAgent = navigator.userAgent;
    storage.environment.language = navigator.language;
    storage.environment.viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
      dpr: window.devicePixelRatio
    };
    storage.environment.timezone = new Date().getTimezoneOffset();
    storage.environment.onLine = navigator.onLine;

    if (navigator.connection) {
      storage.environment.connection = {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt,
        saveData: navigator.connection.saveData
      };
    }

    storage.environment.storage = {
      localStorage: !!window.localStorage,
      sessionStorage: !!window.sessionStorage,
      indexedDB: !!window.indexedDB
    };

    storage.environment.apis = {
      performance: !!window.performance,
      serviceWorker: !!navigator.serviceWorker,
      geolocation: !!navigator.geolocation,
      clipboard: !!navigator.clipboard,
      crypto: !!window.crypto,
      requestIdleCallback: !!window.requestIdleCallback,
      intersectionObserver: !!window.IntersectionObserver
    };
  }

  /* --------- Utilidades --------- */
  function trimArray(arr, maxLength) {
    while (arr.length > maxLength) {
      arr.shift();
    }
  }

  function generateDemoEvent(storage) {
    storage.interactions.push({
      timestamp: Date.now(),
      type: 'demo',
      element: 'button',
      text: 'Evento de demostración generado manualmente',
      demo: true
    });
    trimArray(storage.interactions, MAX_EVENTS);
    saveStorage(storage);
  }

  /* --------- API Pública --------- */
  var CR7Observability = {
    init: function () {
      var storage = getStorage();
      capturePerformance(storage);
      captureEnvironment(storage);
      saveStorage(storage);

      setupErrorHandling(storage);
      setupResourceTracking(storage);
      setupInteractionTracking(storage);
      setupVisibilityTracking(storage);

      window.addEventListener('resize', function () {
        storage.environment.viewport = {
          width: window.innerWidth,
          height: window.innerHeight,
          dpr: window.devicePixelRatio
        };
        saveStorage(storage);
      });

      window.addEventListener('online', function () {
        storage.environment.onLine = true;
        saveStorage(storage);
      });

      window.addEventListener('offline', function () {
        storage.environment.onLine = false;
        saveStorage(storage);
      });
    },

    getSnapshot: function () {
      return getStorage();
    },

    clearData: function () {
      try {
        localStorage.removeItem(STORAGE_KEY);
        return true;
      } catch (e) {
        return false;
      }
    },

    generateDemo: function () {
      var storage = getStorage();
      generateDemoEvent(storage);
    },

    export: function () {
      var data = getStorage();
      return JSON.stringify(data, null, 2);
    }
  };

  global.CR7Observability = CR7Observability;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      CR7Observability.init();
    });
  } else {
    CR7Observability.init();
  }
})(window);
