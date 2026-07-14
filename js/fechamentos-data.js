const FECHAMENTOS_STORAGE_KEY = 'perfect_mkt_fechamentos';

const FECHAMENTO_STATUS_LABELS = {
  a_faturar: 'A faturar',
  faturado: 'Faturado',
  recebido: 'Recebido'
};

function loadFechamentosFromStorage() {
  try {
    const raw = localStorage.getItem(FECHAMENTOS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveFechamentosToStorage(fechamentos) {
  localStorage.setItem(FECHAMENTOS_STORAGE_KEY, JSON.stringify(fechamentos));
}

function getAllFechamentos() {
  return loadFechamentosFromStorage().sort((a, b) => {
    const idA = a.fechamentoId || '';
    const idB = b.fechamentoId || '';
    return idB.localeCompare(idA);
  });
}

function getFechamentoById(id) {
  return getAllFechamentos().find(f => f.id === id) || null;
}

function saveFechamento(fechamento) {
  const stored = loadFechamentosFromStorage();
  const index = stored.findIndex(f => f.id === fechamento.id);

  if (index >= 0) {
    stored[index] = fechamento;
  } else {
    stored.push(fechamento);
  }

  saveFechamentosToStorage(stored);
  return fechamento;
}

function formatFechamentoStatus(status) {
  return FECHAMENTO_STATUS_LABELS[status] || status;
}

function getFechamentoStatusBadgeClass(status) {
  return `badge badge--${status}`;
}

function getAssignedEventIds() {
  const ids = new Set();
  getAllFechamentos().forEach(f => {
    (f.eventIds || []).forEach(id => ids.add(id));
  });
  return ids;
}

function getEventosSemFechamento(filters = {}) {
  const assigned = getAssignedEventIds();
  let events = getAllEvents()
    .filter(e => e.status !== 'cancelado' && !assigned.has(e.id))
    .map(enrichEventFinancials);

  if (filters.clienteId) {
    events = events.filter(e => e.clienteId === filters.clienteId);
  }
  if (filters.solicitante) {
    events = events.filter(e => (e.solicitante || '') === filters.solicitante);
  }
  if (filters.produto) {
    events = events.filter(e => (e.produto || '') === filters.produto);
  }

  return events;
}

function generateFechamentoId() {
  const year = new Date().getFullYear();
  const prefix = `FEC-${year}-`;
  const all = getAllFechamentos();
  const numbers = all
    .map(f => f.fechamentoId)
    .filter(p => p && p.startsWith(prefix))
    .map(p => parseInt(p.replace(prefix, ''), 10))
    .filter(n => !isNaN(n));
  const next = numbers.length ? Math.max(...numbers) + 1 : 1;
  return `${prefix}${String(next).padStart(3, '0')}`;
}

function createFechamento({ clienteId, eventIds }) {
  const assigned = getAssignedEventIds();
  const uniqueIds = [...new Set(eventIds || [])];
  const events = uniqueIds
    .map(id => {
      const event = getEventById(id);
      if (!event || event.status === 'cancelado') return null;
      if (event.clienteId !== clienteId) return null;
      if (assigned.has(event.id)) return null;
      return enrichEventFinancials(event);
    })
    .filter(Boolean);

  if (events.length === 0) return null;

  const valorTotal = events.reduce((sum, e) => sum + (e.valorFinal || 0), 0);

  const fechamento = {
    id: `fec-${Date.now()}`,
    fechamentoId: generateFechamentoId(),
    clienteId,
    status: 'a_faturar',
    eventIds: events.map(e => e.id),
    valorTotal
  };

  return saveFechamento(fechamento);
}

function updateFechamentoStatus(id, status) {
  if (!FECHAMENTO_STATUS_LABELS[status]) return null;

  const fechamento = getFechamentoById(id);
  if (!fechamento) return null;

  return saveFechamento({ ...fechamento, status });
}
