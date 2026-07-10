const STORAGE_KEY = 'perfect_mkt_events';

const STATUS_LABELS = {
  aberto: 'Aberto',
  em_andamento: 'Em andamento',
  aguardando_aprovacao: 'Aguardando aprovação',
  concluido: 'Concluído',
  cancelado: 'Cancelado'
};

const TIPO_EVENTO_LABELS = {
  estande: 'Estande',
  incentivo: 'Incentivo',
  evento: 'Evento',
  meet: 'Meet'
};

const TIPO_EVENTO_SIGLAS = {
  estande: 'EST',
  incentivo: 'INC',
  evento: 'EVT',
  meet: 'MEE'
};

const GLOBAL_REQUIRED_FIELDS = [
  'tipoEvento', 'clienteId', 'dataSolicitacao',
  'contatoRestauranteNome', 'contatoRestauranteTelefone'
];

function loadFromLocalStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToLocalStorage(events) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

function getAllEvents() {
  const stored = loadFromLocalStorage();
  const mockIds = new Set(MOCK_EVENTS.map(e => e.id));
  const uniqueStored = stored.filter(e => !mockIds.has(e.id));
  return [...MOCK_EVENTS, ...uniqueStored].sort(
    (a, b) => new Date(b.data) - new Date(a.data)
  );
}

function getEventById(id) {
  return getAllEvents().find(e => e.id === id) || null;
}

function generateEventoId(tipoEvento) {
  const sigla = TIPO_EVENTO_SIGLAS[tipoEvento] || 'EVT';
  const year = new Date().getFullYear();
  const prefix = `${sigla}-${year}-`;
  const all = getAllEvents();
  const numbers = all
    .map(e => e.eventoId)
    .filter(p => p && p.startsWith(prefix))
    .map(p => parseInt(p.replace(prefix, ''), 10))
    .filter(n => !isNaN(n));
  const next = numbers.length ? Math.max(...numbers) + 1 : 1;
  return `${prefix}${String(next).padStart(3, '0')}`;
}

function saveEvent(event) {
  const stored = loadFromLocalStorage();
  const index = stored.findIndex(e => e.id === event.id);

  if (index >= 0) {
    stored[index] = event;
  } else {
    stored.push(event);
  }

  saveToLocalStorage(stored);
  return event;
}

function isStoredEvent(id) {
  return loadFromLocalStorage().some(e => e.id === id);
}

function calculateValorEvento(data) {
  const participantes = parseFloat(data.numeroParticipantes) || 0;
  const valorPessoa = parseFloat(data.valorPorPessoa) || 0;
  return participantes * valorPessoa;
}

function calculateExtraTotal(extra) {
  const quantidade = parseFloat(extra.quantidade) || 0;
  const valorUnitario = parseFloat(extra.valorUnitario) || 0;
  return quantidade * valorUnitario;
}

function calculateValorFinal(eventData, clienteId) {
  const valorEvento = calculateValorEvento(eventData);
  const extras = eventData.extras || [];
  const somaExtras = extras.reduce(
    (sum, e) => sum + (parseFloat(e.valor) || calculateExtraTotal(e) || 0),
    0
  );
  const feeMedico = parseFloat(eventData.feeMedico) || 0;
  const subtotal = valorEvento + somaExtras + feeMedico;

  const client = getClientById(clienteId);
  let feeCliente = 0;
  if (client) {
    if (client.feeTipo === 'percentual') {
      feeCliente = subtotal * ((parseFloat(client.feeValor) || 0) / 100);
    } else {
      feeCliente = parseFloat(client.feeValor) || 0;
    }
  }

  const base = subtotal + feeCliente;
  const impostosPct = client ? (parseFloat(client.impostosPercentual) || 0) : 0;
  const impostos = base * (impostosPct / 100);
  const valorFinal = base + impostos;

  return {
    valorEvento,
    somaExtras,
    feeMedico,
    subtotal,
    feeCliente,
    base,
    impostos,
    impostosPct,
    valorFinal
  };
}

function enrichEventFinancials(event) {
  const calc = calculateValorFinal(event, event.clienteId);
  return { ...event, ...calc };
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0);
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function formatStatus(status) {
  return STATUS_LABELS[status] || status;
}

function formatTipoEvento(tipo) {
  return TIPO_EVENTO_LABELS[tipo] || tipo;
}

function getStatusBadgeClass(status) {
  return `badge badge--${status}`;
}

function formatNomeEventoCidade(event) {
  const nome = event.nomeEvento || '—';
  const cidade = event.cidade || '';
  return cidade ? `${nome} - ${cidade}` : nome;
}

function getEventStats() {
  const events = getAllEvents().map(enrichEventFinancials);
  const active = events.filter(e => e.status !== 'cancelado');

  return {
    total: events.length,
    emAndamento: events.filter(e => e.status === 'em_andamento').length,
    aguardando: events.filter(e => e.status === 'aguardando_aprovacao').length,
    concluidos: events.filter(e => e.status === 'concluido').length,
    abertos: events.filter(e => e.status === 'aberto').length,
    budgetTotal: active.reduce((sum, e) => sum + (e.valorFinal || 0), 0),
    impostosTotal: active.reduce((sum, e) => sum + (e.impostos || 0), 0),
    feeTotal: active.reduce((sum, e) => sum + (e.feeCliente || 0), 0)
  };
}

function escapeHtml(str) {
  if (str === undefined || str === null) return '';
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}

function showToast(message) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.remove(), 3000);
}

function getFieldLabel(fieldName) {
  const labels = {
    tipoEvento: 'Tipo de evento',
    clienteId: 'Cliente',
    dataSolicitacao: 'Data solicitação',
    contatoRestauranteNome: 'Nome do contato do restaurante',
    contatoRestauranteTelefone: 'Telefone do contato do restaurante',
    nomeEvento: 'Nome do evento',
    nomeRestaurante: 'Nome do restaurante',
    medico: 'Médico',
    feeMedico: 'Fee do médico',
    endereco: 'Endereço'
  };
  return labels[fieldName] || fieldName;
}

function validateEventFields(event, activeTabFields) {
  const required = [...GLOBAL_REQUIRED_FIELDS];
  if (event.clienteId) {
    required.push(...getRequiredFieldsForClient(event.clienteId));
  }

  const form = document.querySelector('#eventForm');
  if (!form) return { valid: true, firstInvalidField: null };

  const toCheck = activeTabFields
    ? required.filter(f => activeTabFields.includes(f))
    : required;

  let valid = true;
  let firstInvalidField = null;

  toCheck.forEach(name => {
    const field = form.querySelector(`[name="${name}"]`);
    if (!field) return;
    const value = field.type === 'checkbox' ? field.checked : field.value.trim();
    if (!value) {
      field.classList.add('input--error');
      valid = false;
      if (!firstInvalidField) firstInvalidField = name;
    } else {
      field.classList.remove('input--error');
    }
  });

  if (!valid) {
    showToast('Preencha os campos obrigatórios antes de continuar.');
  }

  return { valid, firstInvalidField };
}
