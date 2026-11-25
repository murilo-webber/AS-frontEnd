
(function () {
  'use strict';

  var canvas = document.getElementById('chuva');
  if (!canvas || !canvas.getContext) return;

  var ctx = canvas.getContext('2d');
  var reduzMovimento = window.matchMedia('(prefers-reduced-motion: reduce)');

  var VENTO = 0.10; 
  var CAMADAS = [
    { v: [520, 700],   c: [8, 14],  e: 1,   a: 0.26, p: 0.45, z: [0, 0.12] },
    { v: [760, 980],   c: [14, 22], e: 1.3, a: 0.42, p: 0.35, z: [0.10, 0.50] },
    { v: [1100, 1400], c: [22, 36], e: 1.8, a: 0.58, p: 0.20, z: [0.40, 0.95] }
  ];

  var largura = 0, altura = 0, dpr = 1, chaoY = 0;
  var gotas = [], ondas = [];
  var cor = '238,234,225';
  var rodando = false, ultimo = 0, quadro = 0, timerResize = 0;

  function entre(faixa) { return faixa[0] + Math.random() * (faixa[1] - faixa[0]); }

  function lerCor() {
    var v = getComputedStyle(document.documentElement).getPropertyValue('--chuva');
    if (v && v.trim()) cor = v.replace(/\s+/g, '');
  }

  function medirChao() {
    var cena = document.querySelector('.cena');
    if (cena && window.innerWidth > 900) {
      var r = cena.getBoundingClientRect();
      chaoY = r.bottom - r.height * 0.026;
    } else {
      chaoY = altura * 0.90;
    }
    chaoY = Math.min(Math.max(chaoY, altura * 0.35), altura * 0.95);
  }

  function alvoDoChao(camada) {
    var z = CAMADAS[camada].z;
    return chaoY + (altura - 6 - chaoY) * entre(z);
  }

  function novaGota(camada, espalhar) {
    var c = CAMADAS[camada];
    var comp = entre(c.c);
    return {
      camada: camada,
      x: Math.random() * (largura + altura * VENTO) - altura * VENTO,
      y: espalhar ? Math.random() * altura : -comp - Math.random() * altura * 0.3,
      v: entre(c.v),
      c: comp,
      alvo: alvoDoChao(camada)
    };
  }

  function recriar() {
    var total = Math.round(Math.min(Math.max((largura * altura) / 12000, 70), 210));
    gotas = [];
    CAMADAS.forEach(function (c, i) {
      var n = Math.round(total * c.p);
      for (var k = 0; k < n; k++) gotas.push(novaGota(i, true));
    });
    ondas = [];
  }

  function ajustar() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    largura = window.innerWidth;
    altura = window.innerHeight;
    canvas.width = Math.round(largura * dpr);
    canvas.height = Math.round(altura * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    medirChao();
    recriar();
    if (!rodando) desenhar();
  }

  function atualizar(dt) {
    for (var i = 0; i < gotas.length; i++) {
      var g = gotas[i];
      g.y += g.v * dt;
      g.x += g.v * VENTO * dt;
      if (g.y >= g.alvo) {
        if (Math.random() < 0.45 && ondas.length < 90 && g.x > 0 && g.x < largura) {
          ondas.push({ x: g.x, y: g.alvo, r: 1, max: 9 + Math.random() * 18 + g.camada * 4, a: 0.30 + g.camada * 0.1 });
        }
        var nova = novaGota(g.camada, false);
        g.x = nova.x; g.y = nova.y; g.v = nova.v; g.c = nova.c; g.alvo = nova.alvo;
      }
    }
    for (var j = ondas.length - 1; j >= 0; j--) {
      var o = ondas[j];
      o.r += 26 * dt;
      if (o.r >= o.max) ondas.splice(j, 1);
    }
  }

  function desenhar() {
    ctx.clearRect(0, 0, largura, altura);
    ctx.lineCap = 'round';

    for (var c = 0; c < CAMADAS.length; c++) {
      ctx.beginPath();
      for (var i = 0; i < gotas.length; i++) {
        var g = gotas[i];
        if (g.camada !== c) continue;
        ctx.moveTo(g.x, g.y);
        ctx.lineTo(g.x - g.c * VENTO, g.y - g.c);
      }
      ctx.strokeStyle = 'rgba(' + cor + ',' + CAMADAS[c].a + ')';
      ctx.lineWidth = CAMADAS[c].e;
      ctx.stroke();
    }

    ctx.lineWidth = 1;
    for (var j = 0; j < ondas.length; j++) {
      var o = ondas[j];
      var vida = 1 - o.r / o.max;
      ctx.strokeStyle = 'rgba(' + cor + ',' + (o.a * vida).toFixed(3) + ')';
      ctx.beginPath();
      var raio = Math.max(o.r, 0.1);
      ctx.ellipse(o.x, o.y, raio, raio * 0.32, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function passo(agora) {
    if (!rodando) return;

    quadro = requestAnimationFrame(passo);

    var dt = Math.min(Math.max((agora - ultimo) / 1000, 0), 0.05);
    ultimo = agora;
    atualizar(dt);
    desenhar();
  }

  function iniciar() {
    if (rodando || reduzMovimento.matches) return;
    rodando = true;
    ultimo = performance.now();
    quadro = requestAnimationFrame(passo);
  }

  function parar() {
    rodando = false;
    cancelAnimationFrame(quadro);
  }

  function aoMudarMovimento() {
    if (reduzMovimento.matches) { parar(); desenhar(); } else { iniciar(); }
  }

  window.addEventListener('resize', function () {
    clearTimeout(timerResize);
    timerResize = setTimeout(ajustar, 150);
  });

  window.addEventListener('tema:mudou', function () {
    lerCor();
    if (!rodando) desenhar();
  });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { parar(); } else if (!reduzMovimento.matches) { iniciar(); }
  });

  if (reduzMovimento.addEventListener) reduzMovimento.addEventListener('change', aoMudarMovimento);

  lerCor();
  ajustar();
  iniciar();
})();
