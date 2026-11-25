(function () {
  'use strict';

  var DESTINO = 'index.html';

  var form = document.getElementById('form-login');
  var campoEmail = document.getElementById('email');
  var campoSenha = document.getElementById('senha');
  var erroEmail = document.getElementById('erro-email');
  var erroSenha = document.getElementById('erro-senha');
  var botao = document.getElementById('entrar');
  var botaoTexto = botao.querySelector('.botao__texto');
  var status = document.getElementById('status');
  var olho = document.getElementById('olho');

  if (window.feather) window.feather.replace();

  Campos.olho(olho, [campoSenha]);
  Campos.capsLock(campoSenha, erroSenha);

  var recente = Auth.lerCadastroRecente();
  if (recente) {
    campoEmail.value = recente;
    Campos.estado(campoEmail, 'ok');
    status.textContent = 'Conta criada! Agora entre com o seu e-mail e a senha.';
    campoSenha.focus();
  }

  function validarEmail() {
    var r = Auth.verificarEmail(campoEmail.value);
    if (!r.ok) {
      Campos.mostrar(campoEmail, erroEmail, 'erro', r.erro);
      Campos.estado(campoEmail, 'erro');
      return false;
    }
    Campos.limpar(campoEmail, erroEmail);
    Campos.estado(campoEmail, 'ok');
    return true;
  }

  function sugerirDominio() {
    var sugestao = Auth.sugerirEmail(campoEmail.value);
    if (!sugestao) return;
    Campos.mostrar(campoEmail, erroEmail, 'dica', 'Você quis dizer ' + sugestao + '?', {
      texto: 'Corrigir',
      aoClicar: function () {
        campoEmail.value = sugestao;
        Campos.limpar(campoEmail, erroEmail);
        Campos.estado(campoEmail, 'ok');
        campoSenha.focus();
      }
    });
  }

  campoEmail.addEventListener('input', function () {
    Campos.limpar(campoEmail, erroEmail);
    Campos.estado(campoEmail, '');
    status.textContent = '';
  });

  campoEmail.addEventListener('blur', function () {
    if (!campoEmail.value.trim()) return;
    if (validarEmail()) sugerirDominio();
  });

  campoSenha.addEventListener('input', function () {
    Campos.limpar(campoSenha, erroSenha);
    status.textContent = '';
  });

  function liberarBotao() {
    botao.disabled = false;
    botaoTexto.textContent = 'Entrar';
  }

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    status.textContent = '';
    status.classList.remove('status--erro');

    var primeiroInvalido = null;

    if (!validarEmail()) primeiroInvalido = campoEmail;

    if (!campoSenha.value) {
      Campos.mostrar(campoSenha, erroSenha, 'erro', 'Informe a senha.');
      primeiroInvalido = primeiroInvalido || campoSenha;
    } else {
      Campos.limpar(campoSenha, erroSenha);
    }

    if (primeiroInvalido) {
      primeiroInvalido.focus();
      return;
    }

    botao.disabled = true;
    botaoTexto.textContent = 'Verificando…';

    Auth.entrar(campoEmail.value, campoSenha.value).then(function (r) {
      if (r.ok) {
        Auth.iniciarSessao(r.conta.email);
        botaoTexto.textContent = 'Entrando…';
        status.textContent = 'Tudo certo! Entrando…';
        setTimeout(function () { window.location.href = DESTINO; }, 600);
        return;
      }

      liberarBotao();

      if (r.motivo === 'sem-conta') {
        Campos.mostrar(campoEmail, erroEmail, 'erro', 'Não encontramos uma conta com este e-mail.', {
          texto: 'Criar conta',
          aoClicar: function () { window.location.href = 'cadastro.html'; }
        });
        Campos.estado(campoEmail, 'erro');
        campoEmail.focus();
      } else if (r.motivo === 'senha') {
        Campos.mostrar(campoSenha, erroSenha, 'erro', 'Senha incorreta. Tente novamente.');
        campoSenha.focus();
        campoSenha.select();
      } else {
        status.classList.add('status--erro');
        status.textContent = r.motivo === 'cripto'
          ? 'Este navegador não permite verificar a senha com segurança. Abra o site por https ou localhost.'
          : 'Não foi possível verificar a conta neste navegador.';
      }
    }).catch(function () {
      liberarBotao();
      status.classList.add('status--erro');
      status.textContent = 'Algo deu errado ao verificar a conta. Tente de novo.';
    });
  });

})();
