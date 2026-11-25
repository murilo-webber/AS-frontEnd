const formCliente = document.getElementById('form-cliente');
const campoNome = document.getElementById('nome-cliente');
const campoPrioridade = document.getElementById('prioridade');
const mensagemErro = document.getElementById('mensagem-erro');

const listaPendentes = document.getElementById('lista-pendentes');
const listaConcluidos = document.getElementById('lista-concluidos');
const vazioPendentes = document.querySelector('#vazio-pendentes');
const vazioConcluidos = document.querySelector('#vazio-concluidos');

const contadorPendentes = document.getElementById('contador-pendentes');
const contadorConcluidos = document.getElementById('contador-concluidos');

const estilosPrioridade = {
  alta:  { rotulo: 'Alta',  card: 'border-red-500 bg-red-50 dark:bg-red-950/40',        selo: 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-200' },
  media: { rotulo: 'Média', card: 'border-yellow-400 bg-yellow-50 dark:bg-yellow-950/40', selo: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/60 dark:text-yellow-200' },
  baixa: { rotulo: 'Baixa', card: 'border-green-500 bg-green-50 dark:bg-green-950/40',   selo: 'bg-green-100 text-green-800 dark:bg-green-900/60 dark:text-green-200' }
};

function mostrarErro(texto) {
  mensagemErro.textContent = texto;
  mensagemErro.classList.remove('hidden');
  campoNome.style.borderColor = '#dc2626';
  campoNome.focus();
}

function limparErro() {
  mensagemErro.classList.add('hidden');
  campoNome.style.borderColor = '';
}

function atualizarInterface() {
  const pendentes = listaPendentes.children.length;
  const concluidos = listaConcluidos.children.length;

  contadorPendentes.textContent = pendentes;
  contadorConcluidos.textContent = concluidos;

  if (pendentes === 0) {
    vazioPendentes.classList.remove('hidden');
  } else {
    vazioPendentes.classList.add('hidden');
  }

  if (concluidos === 0) {
    vazioConcluidos.classList.remove('hidden');
  } else {
    vazioConcluidos.classList.add('hidden');
  }
}

function criarBotao(texto, classes, aoClicar) {
  const botao = document.createElement('button');
  botao.type = 'button';
  botao.textContent = texto;
  botao.classList.add(...classes.split(' '));
  botao.addEventListener('click', aoClicar);
  return botao;
}

function criarInfo(nome, chave) {
  const estilo = estilosPrioridade[chave];

  const info = document.createElement('div');
  info.className = 'flex min-w-0 flex-col items-start gap-1';

  const titulo = document.createElement('span');
  titulo.className = 'break-words font-bold';
  titulo.textContent = nome; 

  const selo = document.createElement('span');
  selo.className = `rounded-full px-2.5 py-0.5 text-xs font-bold ${estilo.selo}`;
  selo.textContent = `Prioridade ${estilo.rotulo}`;

  info.appendChild(titulo);
  info.appendChild(selo);
  return info;
}

function criarCartaoPendente(nome, chave) {
  const estilo = estilosPrioridade[chave];

  const item = document.createElement('li');
  item.className = `flex flex-col gap-3 rounded-xl border-l-4 p-4 sm:flex-row sm:items-center sm:justify-between ${estilo.card}`;
  item.dataset.nome = nome;
  item.dataset.prioridade = chave;

  const botoes = document.createElement('div');
  botoes.className = 'flex shrink-0 gap-2';

  const btnConcluir = criarBotao(
    'Concluir',
    'rounded-lg bg-indigo-700 px-3 py-1.5 text-sm font-bold text-white hover:bg-indigo-800 dark:bg-indigo-600 dark:hover:bg-indigo-500',
    () => concluirCliente(item)
  );
  const btnExcluir = criarBotao(
    'Excluir',
    'rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-bold text-slate-700 hover:border-slate-400 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:bg-slate-700',
    () => excluirCliente(item)
  );

  botoes.appendChild(btnConcluir);
  botoes.appendChild(btnExcluir);

  item.appendChild(criarInfo(nome, chave));
  item.appendChild(botoes);
  return item;
}

function criarCartaoConcluido(nome, chave, data, hora) {
  const estilo = estilosPrioridade[chave];

  const item = document.createElement('li');
  item.className = `rounded-xl border-l-4 p-4 ${estilo.card}`;

  const registro = document.createElement('p');
  registro.className = 'mt-2 text-sm text-slate-600 dark:text-slate-300';
  registro.textContent = `Concluído em ${data} às ${hora}`;

  item.appendChild(criarInfo(nome, chave));
  item.appendChild(registro);
  return item;
}


function cadastrarCliente(evento) {
  evento.preventDefault();

  const nome = campoNome.value.trim();
  if (nome === '') {
    mostrarErro('Informe o nome do cliente antes de cadastrar.');
    return;
  }

  limparErro();
  listaPendentes.appendChild(criarCartaoPendente(nome, campoPrioridade.value));
  formCliente.reset();
  campoPrioridade.value = 'media';
  campoNome.focus();
  atualizarInterface();
}

function excluirCliente(item) {
  item.remove(); 
  atualizarInterface();
}

function concluirCliente(item) {
  const agora = new Date();
  const data = agora.toLocaleDateString('pt-BR');
  const hora = agora.toLocaleTimeString('pt-BR');

  const registro = criarCartaoConcluido(item.dataset.nome, item.dataset.prioridade, data, hora);

  item.remove();                         
  listaConcluidos.appendChild(registro); 
  atualizarInterface();
}

formCliente.addEventListener('submit', cadastrarCliente);
campoNome.addEventListener('input', limparErro);

atualizarInterface();
