(function () {
  'use strict';

  var CHAVE_CONTAS = 'contas';          
  var CHAVE_SESSAO = 'sessao-ativa';    
  var CHAVE_RECENTE = 'conta-recente';  
  var ITERACOES = 150000;

  function normalizarEmail(valor) {
    return String(valor == null ? '' : valor).trim().toLowerCase();
  }

  var RE_LOCAL = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+$/;
  var RE_ROTULO = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
  var RE_TLD = /^(?:[a-z]{2,}|xn--[a-z0-9-]{2,})$/;

  function verificarEmail(valor) {
    var email = normalizarEmail(valor);
    if (!email) return { ok: false, erro: 'Informe o e-mail.' };
    if (/\s/.test(email)) return { ok: false, erro: 'O e-mail não pode ter espaços.' };

    var partes = email.split('@');
    if (partes.length === 1) return { ok: false, erro: 'Falta o @ no e-mail, como nome@exemplo.com.' };
    if (partes.length > 2) return { ok: false, erro: 'O e-mail deve ter um único @.' };

    var local = partes[0];
    var dominio = partes[1];
    if (!local) return { ok: false, erro: 'Falta o nome antes do @.' };
    if (!dominio) return { ok: false, erro: 'Falta o domínio depois do @, como gmail.com.' };
    if (dominio.indexOf('.') === -1) return { ok: false, erro: 'O domínio precisa ter um ponto, como exemplo.com.' };

    var localOk = local.length <= 64 && RE_LOCAL.test(local) &&
      local.charAt(0) !== '.' && local.charAt(local.length - 1) !== '.' && local.indexOf('..') === -1;
    var rotulos = dominio.split('.');
    var dominioOk = email.length <= 254 && rotulos.every(function (r) { return RE_ROTULO.test(r); }) &&
      RE_TLD.test(rotulos[rotulos.length - 1]);

    if (!localOk || !dominioOk) {
      return { ok: false, erro: 'Informe um e-mail válido, como nome@exemplo.com.' };
    }
    return { ok: true, erro: '' };
  }

  var DOMINIOS_COMUNS = [
    'gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'yahoo.com.br', 'icloud.com',
    'live.com', 'msn.com', 'uol.com.br', 'bol.com.br', 'terra.com.br', 'protonmail.com', 'proton.me'
  ];

  function distancia(a, b) {
    var anterior = [], atual, i, j;
    for (j = 0; j <= b.length; j++) anterior[j] = j;
    for (i = 1; i <= a.length; i++) {
      atual = [i];
      for (j = 1; j <= b.length; j++) {
        atual[j] = Math.min(
          anterior[j] + 1,
          atual[j - 1] + 1,
          anterior[j - 1] + (a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1)
        );
      }
      anterior = atual;
    }
    return anterior[b.length];
  }

  function sugerirEmail(valor) {
    var email = normalizarEmail(valor);
    if (!verificarEmail(email).ok) return '';
    var arroba = email.lastIndexOf('@');
    var dominio = email.slice(arroba + 1);
    if (DOMINIOS_COMUNS.indexOf(dominio) !== -1) return '';
    var melhor = '', menor = 3;
    DOMINIOS_COMUNS.forEach(function (candidato) {
      var d = distancia(dominio, candidato);
      if (d < menor) { menor = d; melhor = candidato; }
    });
    return melhor ? email.slice(0, arroba + 1) + melhor : '';
  }

  function regrasSenha(senha) {
    var s = String(senha == null ? '' : senha);
    var r = {
      tamanho: s.length >= 8,
      letra: /[A-Za-zÀ-ÖØ-öø-ÿ]/.test(s),
      numero: /[0-9]/.test(s)
    };
    r.ok = r.tamanho && r.letra && r.numero;
    return r;
  }

  function lerContas() {
    try {
      var texto = localStorage.getItem(CHAVE_CONTAS);
      var dados = texto ? JSON.parse(texto) : {};
      return dados && typeof dados === 'object' && !Array.isArray(dados) ? dados : {};
    } catch (e) {
      return {};
    }
  }

  function gravarContas(contas) {
    try {
      localStorage.setItem(CHAVE_CONTAS, JSON.stringify(contas));
      return true;
    } catch (e) {
      return false;
    }
  }

  function tem(contas, email) {
    return Object.prototype.hasOwnProperty.call(contas, email);
  }

  function existeConta(email) {
    return tem(lerContas(), normalizarEmail(email));
  }

  function temCripto() {
    return !!(window.crypto && window.crypto.subtle && window.crypto.getRandomValues && window.TextEncoder);
  }

  function paraBase64(buffer) {
    var bytes = new Uint8Array(buffer), texto = '';
    for (var i = 0; i < bytes.length; i++) texto += String.fromCharCode(bytes[i]);
    return btoa(texto);
  }

  function deBase64(texto) {
    var bin = atob(texto), bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }

  function derivar(senha, sal, iteracoes) {
    var crypto = window.crypto.subtle;
    return crypto.importKey('raw', new TextEncoder().encode(senha), 'PBKDF2', false, ['deriveBits'])
      .then(function (chave) {
        return crypto.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: sal, iterations: iteracoes }, chave, 256);
      })
      .then(paraBase64);
  }

  function iguais(a, b) {
    if (a.length !== b.length) return false;
    var dif = 0;
    for (var i = 0; i < a.length; i++) dif |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return dif === 0;
  }

  function criarConta(dados) {
    var email = normalizarEmail(dados.email);
    if (!temCripto()) return Promise.resolve({ ok: false, motivo: 'cripto' });

    var contas = lerContas();
    if (tem(contas, email)) return Promise.resolve({ ok: false, motivo: 'duplicado' });

    var sal = window.crypto.getRandomValues(new Uint8Array(16));
    return derivar(String(dados.senha), sal, ITERACOES).then(function (hash) {

      var atuais = lerContas();
      if (tem(atuais, email)) return { ok: false, motivo: 'duplicado' };
      atuais[email] = {
        nome: String(dados.nome).trim(),
        email: email,
        sal: paraBase64(sal),
        hash: hash,
        iteracoes: ITERACOES,
        criadoEm: new Date().toISOString()
      };
      return gravarContas(atuais) ? { ok: true } : { ok: false, motivo: 'armazenamento' };
    });
  }

  function entrar(emailBruto, senha) {
    var email = normalizarEmail(emailBruto);
    if (!temCripto()) return Promise.resolve({ ok: false, motivo: 'cripto' });

    var contas = lerContas();
    if (!tem(contas, email)) return Promise.resolve({ ok: false, motivo: 'sem-conta' });

    var conta = contas[email];
    var sal, iteracoes;
    try {
      sal = deBase64(String(conta.sal));
      iteracoes = Number(conta.iteracoes) || ITERACOES;
    } catch (e) {
      return Promise.resolve({ ok: false, motivo: 'senha' }); 
    }
    return derivar(String(senha), sal, iteracoes).then(function (hash) {
      return iguais(hash, String(conta.hash))
        ? { ok: true, conta: { nome: conta.nome, email: conta.email } }
        : { ok: false, motivo: 'senha' };
    });
  }


  function iniciarSessao(email) {
    try { sessionStorage.setItem(CHAVE_SESSAO, normalizarEmail(email)); } catch (e) { }
  }

  function sairDaSessao() {
    try { sessionStorage.removeItem(CHAVE_SESSAO); } catch (e) { }
  }

  function lembrarCadastro(email) {
    try { sessionStorage.setItem(CHAVE_RECENTE, normalizarEmail(email)); } catch (e) { }
  }

  function lerCadastroRecente() {
    try {
      var email = sessionStorage.getItem(CHAVE_RECENTE) || '';
      sessionStorage.removeItem(CHAVE_RECENTE);
      return email;
    } catch (e) {
      return '';
    }
  }

  window.Auth = {
    verificarEmail: verificarEmail,
    sugerirEmail: sugerirEmail,
    regrasSenha: regrasSenha,
    existeConta: existeConta,
    criarConta: criarConta,
    entrar: entrar,
    iniciarSessao: iniciarSessao,
    sairDaSessao: sairDaSessao,
    lembrarCadastro: lembrarCadastro,
    lerCadastroRecente: lerCadastroRecente
  };
})();
