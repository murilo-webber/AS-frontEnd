(function () {
  'use strict';

  var ICONES = { erro: 'alert-circle', ok: 'check-circle', dica: 'info' };

  function icone(nome) {
    return window.feather && window.feather.icons[nome]
      ? window.feather.icons[nome].toSvg({ 'class': 'msg__icone', width: 15, height: 15 })
      : '';
  }

  function limpar(input, caixa) {
    caixa.textContent = '';
    caixa.className = 'campo__erro';
    delete caixa.dataset.caps;
    if (input) input.removeAttribute('aria-invalid');
  }

  function mostrar(input, caixa, tipo, texto, acao) {
    limpar(input, caixa);
    caixa.classList.add('campo__erro--' + tipo);
    caixa.insertAdjacentHTML('afterbegin', icone(ICONES[tipo]));
    var span = document.createElement('span');
    span.textContent = texto;
    caixa.appendChild(span);

    if (acao) {
      var botao = document.createElement('button');
      botao.type = 'button';
      botao.className = 'link link--forte msg__acao';
      botao.textContent = acao.texto;
      botao.addEventListener('click', acao.aoClicar);
      caixa.appendChild(botao);
    }
    if (input && tipo === 'erro') input.setAttribute('aria-invalid', 'true');
  }

  function estado(input, valor) {
    var entrada = input.closest('.entrada');
    if (!entrada) return;
    if (valor) entrada.setAttribute('data-estado', valor); else entrada.removeAttribute('data-estado');
  }

  function regras(lista, resultado) {
    Array.prototype.forEach.call(lista.querySelectorAll('[data-regra]'), function (item) {
      item.classList.toggle('ok', !!resultado[item.getAttribute('data-regra')]);
    });
  }

  function olho(botao, inputs) {
    botao.addEventListener('click', function () {
      var mostrarSenha = inputs[0].type === 'password';
      inputs.forEach(function (campo) { campo.type = mostrarSenha ? 'text' : 'password'; });
      botao.setAttribute('aria-pressed', mostrarSenha ? 'true' : 'false');
      botao.setAttribute('aria-label', mostrarSenha ? 'Ocultar senha' : 'Mostrar senha');
    });
  }

  function capsLock(input, caixa) {
    function conferir(ev) {
      if (!ev.getModifierState) return;
      var ligado = ev.getModifierState('CapsLock');
      if (ligado && !caixa.textContent) {
        mostrar(input, caixa, 'dica', 'O Caps Lock está ligado.');
        caixa.dataset.caps = '1';
      } else if (!ligado && caixa.dataset.caps) {
        limpar(input, caixa);
      }
    }
    input.addEventListener('keydown', conferir);
    input.addEventListener('keyup', conferir);
    input.addEventListener('blur', function () {
      if (caixa.dataset.caps) limpar(input, caixa);
    });
  }

  window.Campos = { mostrar: mostrar, limpar: limpar, estado: estado, regras: regras, olho: olho, capsLock: capsLock };
})();
