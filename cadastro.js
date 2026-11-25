(function () {
  'use strict';

  var DESTINO = 'login.html';

  var form = document.getElementById('form-cadastro');
  var campos = {
    nome: document.getElementById('nome'),
    email: document.getElementById('email'),
    senha: document.getElementById('senha'),
    confirmar: document.getElementById('confirmar')
  };
  var erros = {
    nome: document.getElementById('erro-nome'),
    email: document.getElementById('erro-email'),
    senha: document.getElementById('erro-senha'),
    confirmar: document.getElementById('erro-confirmar')
  };
  var listaRegras = document.getElementById('regras-senha');
  var botao = document.getElementById('cadastrar');
  var botaoTexto = botao.querySelector('.botao__texto');
  var status = document.getElementById('status');
  var olho = document.getElementById('olho');

  if (window.feather) window.feather.replace();

  Campos.olho(olho, [campos.senha, campos.confirmar]);
  Campos.capsLock(campos.senha, erros.senha);

  function erro(chave, texto, acao) {
    Campos.mostrar(campos[chave], erros[chave], 'erro', texto, acao);
  }


  function validarNome() {
    if (campos.nome.value.trim().length < 2) {
      erro('nome', 'Informe o nome completo.');
      return false;
    }
    Campos.limpar(campos.nome, erros.nome);
    return true;
  }

  function validarEmail() {
    var r = Auth.verificarEmail(campos.email.value);
    if (!r.ok) {
      erro('email', r.erro);
      Campos.estado(campos.email, 'erro');
      return false;
    }
    if (Auth.existeConta(campos.email.value)) {
      erro('email', 'Este e-mail já está cadastrado.', {
        texto: 'Entrar',
        aoClicar: function () { window.location.href = 'login.html'; }
      });
      Campos.estado(campos.email, 'erro');
      return false;
    }
    Campos.limpar(campos.email, erros.email);
    Campos.estado(campos.email, 'ok');
    return true;
  }

  function sugerirDominio() {
    var sugestao = Auth.sugerirEmail(campos.email.value);
    if (!sugestao) return;
    Campos.mostrar(campos.email, erros.email, 'dica', 'Você quis dizer ' + sugestao + '?', {
      texto: 'Corrigir',
      aoClicar: function () {
        campos.email.value = sugestao;
        validarEmail();
        campos.senha.focus();
      }
    });
  }

  function validarSenha() {
    if (!Auth.regrasSenha(campos.senha.value).ok) {
      erro('senha', 'A senha não atende a todos os requisitos.');
      return false;
    }
    Campos.limpar(campos.senha, erros.senha);
    return true;
  }

  function validarConfirmacao(avisarVazio) {
    var confirmar = campos.confirmar.value;
    if (!confirmar) {
      if (avisarVazio) { erro('confirmar', 'Repita a senha para confirmar.'); return false; }
      Campos.limpar(campos.confirmar, erros.confirmar);
      return false;
    }
    if (confirmar !== campos.senha.value) {
      erro('confirmar', 'As senhas não conferem.');
      return false;
    }
    Campos.mostrar(campos.confirmar, erros.confirmar, 'ok', 'As senhas conferem.');
    return true;
  }

  campos.nome.addEventListener('input', function () { Campos.limpar(campos.nome, erros.nome); });
  campos.nome.addEventListener('blur', function () { if (campos.nome.value) validarNome(); });

  campos.email.addEventListener('input', function () {
    Campos.limpar(campos.email, erros.email);
    Campos.estado(campos.email, '');
  });
  campos.email.addEventListener('blur', function () {
    if (!campos.email.value.trim()) return;
    if (validarEmail()) sugerirDominio();
  });

  campos.senha.addEventListener('input', function () {
    Campos.limpar(campos.senha, erros.senha);
    Campos.regras(listaRegras, Auth.regrasSenha(campos.senha.value));
    if (campos.confirmar.value) validarConfirmacao(false);   
  });

  campos.confirmar.addEventListener('input', function () {
    if (campos.confirmar.value) {

      if (campos.confirmar.value === campos.senha.value) validarConfirmacao(false);
      else Campos.limpar(campos.confirmar, erros.confirmar);
    } else {
      Campos.limpar(campos.confirmar, erros.confirmar);
    }
  });
  campos.confirmar.addEventListener('blur', function () {
    if (campos.confirmar.value) validarConfirmacao(false);
  });

  Campos.regras(listaRegras, Auth.regrasSenha(''));

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    status.textContent = '';
    status.classList.remove('status--erro');

    var ordem = [
      ['nome', validarNome()],
      ['email', validarEmail()],
      ['senha', validarSenha()],
      ['confirmar', validarConfirmacao(true)]
    ];
    var primeiro = ordem.filter(function (par) { return !par[1]; })[0];
    if (primeiro) {
      campos[primeiro[0]].focus();
      return;
    }

    botao.disabled = true;
    botaoTexto.textContent = 'Cadastrando…';

    Auth.criarConta({
      nome: campos.nome.value,
      email: campos.email.value,
      senha: campos.senha.value
    }).then(function (r) {
      if (r.ok) {
        Auth.lembrarCadastro(campos.email.value);
        status.textContent = 'Conta criada! Redirecionando para o login…';
        setTimeout(function () { window.location.href = DESTINO; }, 900);
        return;
      }

      botao.disabled = false;
      botaoTexto.textContent = 'Cadastrar';

      if (r.motivo === 'duplicado') {
        validarEmail();
        campos.email.focus();
      } else {
        status.classList.add('status--erro');
        status.textContent = r.motivo === 'cripto'
          ? 'Este navegador não permite proteger a senha. Abra o site por https ou localhost.'
          : 'Não foi possível salvar a conta neste navegador (armazenamento bloqueado?).';
      }
    }).catch(function () {
      botao.disabled = false;
      botaoTexto.textContent = 'Cadastrar';
      status.classList.add('status--erro');
      status.textContent = 'Algo deu errado ao criar a conta. Tente de novo.';
    });
  });
})();
