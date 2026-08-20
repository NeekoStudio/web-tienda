/* =========================================================================
   Neeko Studio — Conversor de moneda para la sección de precios
   -------------------------------------------------------------------------
   Detecta el país del visitante y muestra, debajo de cada plan, el precio
   aproximado en su moneda. Los cobros se siguen haciendo en euros.

   Uso: <script src="conversor-moneda.js" defer></script>  antes de </body>
   No necesita ninguna clave de API. Si la API falla, usa tipos de reserva.
   ========================================================================= */
(function () {
  'use strict';

  var API = 'https://open.er-api.com/v6/latest/EUR';
  var CACHE_KEY = 'neeko_fx_v1';
  var CACHE_HORAS = 12;

  /* --- Tipos de reserva (1 EUR = X). Solo se usan si la API no responde.
         Actualizados el 19/08/2026. --------------------------------------- */
  var RESERVA = {
    USD: 1.1576, MXN: 19.75, COP: 3628.93, ARS: 1729.6, CLP: 1059.31,
    PEN: 3.8964, BRL: 6.0307, UYU: 46.549, BOB: 13.432, PYG: 6977.5,
    DOP: 68.052, GTQ: 8.8334, CRC: 520.35, HNL: 31.043, NIO: 42.608,
    VES: 896.03, GBP: 0.8554, CAD: 1.6079, CHF: 0.9405, JPY: 184.75
  };

  /* --- País -> moneda. Solo países cuya moneda NO es el euro. ------------- */
  var MONEDA_POR_PAIS = {
    US: 'USD', PR: 'USD', EC: 'USD', SV: 'USD', PA: 'USD',
    MX: 'MXN', CO: 'COP', AR: 'ARS', CL: 'CLP', PE: 'PEN', BR: 'BRL',
    UY: 'UYU', BO: 'BOB', PY: 'PYG', DO: 'DOP', GT: 'GTQ', CR: 'CRC',
    HN: 'HNL', NI: 'NIO', VE: 'VES',
    GB: 'GBP', CA: 'CAD', CH: 'CHF', JP: 'JPY'
  };

  /* --- Zona horaria -> país. Es lo que mejor delata dónde está la persona,
         mejor que el idioma del navegador. --------------------------------- */
  var PAIS_POR_ZONA = {
    'America/Mexico_City': 'MX', 'America/Cancun': 'MX', 'America/Merida': 'MX',
    'America/Monterrey': 'MX', 'America/Chihuahua': 'MX', 'America/Hermosillo': 'MX',
    'America/Tijuana': 'MX', 'America/Mazatlan': 'MX', 'America/Matamoros': 'MX',
    'America/Bogota': 'CO',
    'America/Argentina/Buenos_Aires': 'AR', 'America/Argentina/Cordoba': 'AR',
    'America/Argentina/Mendoza': 'AR', 'America/Argentina/Salta': 'AR',
    'America/Argentina/Tucuman': 'AR', 'America/Buenos_Aires': 'AR',
    'America/Santiago': 'CL', 'Pacific/Easter': 'CL',
    'America/Lima': 'PE', 'America/La_Paz': 'BO', 'America/Asuncion': 'PY',
    'America/Montevideo': 'UY', 'America/Caracas': 'VE',
    'America/Guayaquil': 'EC', 'America/Panama': 'PA', 'America/Costa_Rica': 'CR',
    'America/Guatemala': 'GT', 'America/Tegucigalpa': 'HN', 'America/Managua': 'NI',
    'America/El_Salvador': 'SV', 'America/Santo_Domingo': 'DO',
    'America/Puerto_Rico': 'PR', 'America/Havana': 'CU',
    'America/Sao_Paulo': 'BR', 'America/Bahia': 'BR', 'America/Fortaleza': 'BR',
    'America/Recife': 'BR', 'America/Manaus': 'BR', 'America/Belem': 'BR',
    'America/New_York': 'US', 'America/Chicago': 'US', 'America/Denver': 'US',
    'America/Los_Angeles': 'US', 'America/Phoenix': 'US', 'America/Anchorage': 'US',
    'America/Detroit': 'US', 'America/Indiana/Indianapolis': 'US', 'Pacific/Honolulu': 'US',
    'America/Toronto': 'CA', 'America/Vancouver': 'CA', 'America/Edmonton': 'CA',
    'America/Winnipeg': 'CA', 'America/Halifax': 'CA',
    'Europe/London': 'GB', 'Europe/Zurich': 'CH', 'Asia/Tokyo': 'JP'
  };

  var TEXTOS = {
    es: {
      etiqueta: 'Ver precios en',
      nota: 'Cambio orientativo de hoy. El cobro se hace siempre en euros; tu banco convierte al pagar.',
      euro: 'Euro (€)',
      soloEuros: 'Precios en euros'
    },
    en: {
      etiqueta: 'Show prices in',
      nota: "Today's approximate rate. Payment is always charged in euros; your bank converts it.",
      euro: 'Euro (€)',
      soloEuros: 'Prices in euros'
    }
  };

  var NOMBRE_MONEDA = {
    USD: 'US Dollar (USD)', MXN: 'Peso mexicano (MXN)', COP: 'Peso colombiano (COP)',
    ARS: 'Peso argentino (ARS)', CLP: 'Peso chileno (CLP)', PEN: 'Sol peruano (PEN)',
    BRL: 'Real brasileño (BRL)', UYU: 'Peso uruguayo (UYU)', BOB: 'Boliviano (BOB)',
    PYG: 'Guaraní (PYG)', DOP: 'Peso dominicano (DOP)', GTQ: 'Quetzal (GTQ)',
    CRC: 'Colón (CRC)', HNL: 'Lempira (HNL)', NIO: 'Córdoba (NIO)',
    VES: 'Bolívar (VES)', GBP: 'Libra (GBP)', CAD: 'Dólar canadiense (CAD)',
    CHF: 'Franco suizo (CHF)', JPY: 'Yen (JPY)'
  };

  var tipos = null;
  var monedaActual = null;

  /* ---------------------------------------------------------------- utils */
  function idioma() {
    var l = (document.documentElement.lang || 'es').slice(0, 2).toLowerCase();
    return TEXTOS[l] ? l : 'es';
  }

  function t(clave) { return TEXTOS[idioma()][clave]; }

  function leerCache() {
    try {
      var crudo = localStorage.getItem(CACHE_KEY);
      if (!crudo) return null;
      var d = JSON.parse(crudo);
      if (!d || !d.rates || !d.ts) return null;
      if (Date.now() - d.ts > CACHE_HORAS * 3600 * 1000) return null;
      return d.rates;
    } catch (e) { return null; }
  }

  function guardarCache(rates) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), rates: rates }));
    } catch (e) { /* modo incógnito o storage lleno: da igual */ }
  }

  function detectarPais() {
    try {
      var tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz && PAIS_POR_ZONA[tz]) return PAIS_POR_ZONA[tz];
    } catch (e) { /* seguimos con el idioma */ }
    var idiomas = navigator.languages || [navigator.language || ''];
    for (var i = 0; i < idiomas.length; i++) {
      var m = /[-_]([A-Za-z]{2})$/.exec(idiomas[i] || '');
      if (m) {
        var pais = m[1].toUpperCase();
        if (MONEDA_POR_PAIS[pais]) return pais;
      }
    }
    return null;
  }

  function monedaDetectada() {
    var pais = detectarPais();
    return pais ? (MONEDA_POR_PAIS[pais] || null) : null;
  }

  /* Redondeo legible: 3,47 USD / 65 MXN / 13.700 COP / 6.400 ARS */
  function formatear(valor, codigo) {
    var dec = 2;
    if (valor >= 10) dec = 0;
    if (valor >= 1000) { valor = Math.round(valor / 100) * 100; dec = 0; }
    if (valor >= 100000) { valor = Math.round(valor / 1000) * 1000; dec = 0; }
    var loc = idioma() === 'en' ? 'en-US' : 'es-ES';
    var n;
    try {
      n = new Intl.NumberFormat(loc, {
        minimumFractionDigits: dec, maximumFractionDigits: dec
      }).format(valor);
    } catch (e) {
      n = valor.toFixed(dec);
    }
    return '≈ ' + n + ' ' + codigo;
  }

  function euros(el) {
    var txt = (el.textContent || '').replace(/[^0-9,.]/g, '').replace(',', '.');
    var v = parseFloat(txt);
    return isNaN(v) ? null : v;
  }

  /* ------------------------------------------------------------- pintado */
  function estilos() {
    if (document.getElementById('neekoFxCss')) return;
    var s = document.createElement('style');
    s.id = 'neekoFxCss';
    s.textContent = [
      '.price-local{font-size:.78rem;line-height:1.2;opacity:.75;margin-top:2px;',
      'font-variant-numeric:tabular-nums;white-space:nowrap}',
      '.fx-bar{display:flex;align-items:center;justify-content:center;gap:8px;',
      'flex-wrap:wrap;margin-top:14px;font-size:.82rem;color:var(--muted,#b8b0c9)}',
      '.fx-bar select{background:var(--surface,#1c1922);color:var(--text,#f2f0f6);',
      'border:1px solid var(--card-border,#423c50);border-radius:8px;padding:5px 9px;',
      'font-size:.82rem;font-family:inherit;cursor:pointer;max-width:220px}',
      '.fx-bar select:focus{outline:2px solid var(--fuchsia,#ef4d8f);outline-offset:1px}',
      '.fx-nota{width:100%;text-align:center;font-size:.72rem;opacity:.7;margin-top:6px}'
    ].join('');
    document.head.appendChild(s);
  }

  function pintarPrecios() {
    var planes = document.querySelectorAll('#plansRow .plan');
    for (var i = 0; i < planes.length; i++) {
      var plan = planes[i];
      var precioEl = plan.querySelector('.price');
      if (!precioEl) continue;
      var linea = plan.querySelector('.price-local');
      if (!monedaActual || !tipos || !tipos[monedaActual]) {
        if (linea) linea.remove();
        continue;
      }
      var eur = euros(precioEl);
      if (eur === null) continue;
      if (!linea) {
        linea = document.createElement('div');
        linea.className = 'price-local';
        var per = plan.querySelector('.per');
        if (per && per.parentNode) per.parentNode.insertBefore(linea, per.nextSibling);
        else precioEl.parentNode.insertBefore(linea, precioEl.nextSibling);
      }
      linea.textContent = formatear(eur * tipos[monedaActual], monedaActual);
    }
  }

  function pintarBarra() {
    var fila = document.getElementById('plansRow');
    if (!fila || !fila.parentNode) return;

    var barra = document.getElementById('fxBar');
    if (!barra) {
      barra = document.createElement('div');
      barra.className = 'fx-bar';
      barra.id = 'fxBar';
      barra.innerHTML =
        '<span id="fxLabel"></span>' +
        '<select id="fxSelect" aria-label="Moneda / Currency"></select>' +
        '<span class="fx-nota" id="fxNota"></span>';
      fila.parentNode.insertBefore(barra, fila.nextSibling);
      barra.querySelector('#fxSelect').addEventListener('change', function (e) {
        monedaActual = e.target.value || null;
        try { localStorage.setItem('neeko_fx_moneda', monedaActual || 'EUR'); } catch (err) {}
        pintarPrecios();
        pintarBarra();
      });
    }

    var sel = barra.querySelector('#fxSelect');
    var codigos = Object.keys(NOMBRE_MONEDA).filter(function (c) {
      return tipos && tipos[c];
    }).sort(function (a, b) {
      return NOMBRE_MONEDA[a].localeCompare(NOMBRE_MONEDA[b], 'es');
    });
    var html = '<option value="">' + TEXTOS[idioma()].euro + '</option>';
    for (var i = 0; i < codigos.length; i++) {
      html += '<option value="' + codigos[i] + '">' + NOMBRE_MONEDA[codigos[i]] + '</option>';
    }
    sel.innerHTML = html;
    sel.value = monedaActual || '';

    barra.querySelector('#fxLabel').textContent = t('etiqueta');
    barra.querySelector('#fxNota').textContent = monedaActual ? t('nota') : '';
  }

  function pintar() { pintarBarra(); pintarPrecios(); }

  /* ------------------------------------------------------------- arranque */
  function arrancar() {
    if (!document.getElementById('plansRow')) return;
    estilos();

    var guardada = null;
    try { guardada = localStorage.getItem('neeko_fx_moneda'); } catch (e) {}
    if (guardada === 'EUR') monedaActual = null;
    else if (guardada && NOMBRE_MONEDA[guardada]) monedaActual = guardada;
    else monedaActual = monedaDetectada();

    tipos = leerCache() || RESERVA;
    pintar();

    if (!leerCache() && typeof fetch === 'function') {
      fetch(API, { cache: 'no-store' })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) {
          if (d && d.result === 'success' && d.rates) {
            tipos = d.rates;
            guardarCache(d.rates);
            pintar();
          }
        })
        .catch(function () { /* nos quedamos con los tipos de reserva */ });
    }

    /* Si cambia el idioma de la web, repintamos textos */
    try {
      new MutationObserver(pintar).observe(document.documentElement, {
        attributes: true, attributeFilter: ['lang']
      });
    } catch (e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', arrancar);
  } else {
    arrancar();
  }
})();
