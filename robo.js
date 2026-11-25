
(function () {
  'use strict';

  var robo = document.querySelector('.robo');
  if (!robo) return;

  var espera = 0, fim = 0;

  window.addEventListener('tema:mudou', function () {
    clearTimeout(espera);
    clearTimeout(fim);
    robo.classList.remove('is-reage');
    espera = setTimeout(function () {
      void robo.offsetWidth; 
      robo.classList.add('is-reage');
      fim = setTimeout(function () { robo.classList.remove('is-reage'); }, 1000);
    }, 350);
  });
})();
