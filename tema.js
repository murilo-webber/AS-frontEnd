(function () {
  'use strict';

  var CHAVE = 'tema';
  var PADRAO = 'dark';
  var COR_BARRA = { dark: '#1b1713', light: '#f7f1e5' };
  var raiz = document.documentElement;

  function lerSalvo() {
    try {
      var salvo = localStorage.getItem(CHAVE);
      if (salvo === 'dark' || salvo === 'light') return salvo;
    } catch (e) { }
    return PADRAO;
  }

  function salvar(tema) {
    try { localStorage.setItem(CHAVE, tema); } catch (e) {  }
  }

  var estado = lerSalvo();

  function aplicar(tema) {
    raiz.setAttribute('data-theme', tema);
    raiz.style.colorScheme = tema;
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', COR_BARRA[tema]);
    window.dispatchEvent(new CustomEvent('tema:mudou', { detail: { tema: tema } }));
  }

  function reduzMovimento() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function definir(tema, origem) {
    if (tema !== 'dark' && tema !== 'light') return;
    if (tema === estado && raiz.getAttribute('data-theme') === tema) return;
    estado = tema;
    salvar(tema);

    if (!document.startViewTransition || reduzMovimento()) {
      aplicar(tema);
      return;
    }

    var x = origem && typeof origem.x === 'number' ? origem.x : window.innerWidth / 2;
    var y = origem && typeof origem.y === 'number' ? origem.y : window.innerHeight / 2;
    var raio = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    var transicao = document.startViewTransition(function () { aplicar(tema); });
    transicao.ready.then(function () {
      raiz.animate(
        { clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + raio + 'px at ' + x + 'px ' + y + 'px)'] },
        { duration: 800, easing: 'cubic-bezier(.4, 0, .2, 1)', pseudoElement: '::view-transition-new(root)' }
      );
    }).catch(function () { });
  }

  function alternar(origem) {
    definir(estado === 'dark' ? 'light' : 'dark', origem);
    return estado;
  }

  raiz.setAttribute('data-theme', estado);
  raiz.style.colorScheme = estado;

  window.addEventListener('storage', function (ev) {
    if (ev.key === CHAVE && (ev.newValue === 'dark' || ev.newValue === 'light') && ev.newValue !== estado) {
      estado = ev.newValue;
      aplicar(estado);
    }
  });

  window.Tema = {
    atual: function () { return estado; },
    definir: definir,
    alternar: alternar
  };
})();
