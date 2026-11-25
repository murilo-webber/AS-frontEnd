(function () {
  'use strict';

  var abajures = document.querySelectorAll('.abajur');
  if (!abajures.length || !window.Tema) return;

  function sincronizar() {
    var claro = window.Tema.atual() === 'light';
    abajures.forEach(function (abajur) {
      abajur.setAttribute('aria-pressed', claro ? 'true' : 'false');
    });
  }

  abajures.forEach(function (abajur) {
    abajur.addEventListener('click', function () {
      var r = abajur.getBoundingClientRect();
      window.Tema.alternar({ x: r.left + r.width / 2, y: r.top + r.height * 0.42 });

      abajur.classList.remove('is-click');
      void abajur.offsetWidth;
      abajur.classList.add('is-click');
    });

    abajur.addEventListener('animationend', function (ev) {
      if (ev.target === abajur.querySelector('.abajur__svg')) abajur.classList.remove('is-click');
    });
  });

  window.addEventListener('tema:mudou', sincronizar);
  sincronizar();
})();
