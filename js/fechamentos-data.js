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

function normalizeFechamento(fechamento) {
  if (!fechamento) return null;

  const f = { ...fechamento };
  const today = new Date().toISOString().split('T')[0];

  if (!f.pagamento) {
    f.pagamento = { prazoPagamento: '', dataRecebimento: '' };
  } else {
    f.pagamento = {
      prazoPagamento: f.pagamento.prazoPagamento || f.pagamento.dataVencimento || '',
      dataRecebimento: f.pagamento.dataRecebimento || ''
    };
  }

  if (f.nfAnexo && !f.nf) {
    f.nf = {
      numero: '',
      dataEmissao: f.nfAnexo.dataAnexo || today,
      valor: f.valorTotal || 0,
      anexo: { nome: f.nfAnexo.nome, dataAnexo: f.nfAnexo.dataAnexo }
    };
  }
  delete f.nfAnexo;

  if (f.nf) {
    f.nf = {
      numero: f.nf.numero || '',
      dataEmissao: f.nf.dataEmissao || '',
      valor: f.nf.valor != null ? f.nf.valor : (f.valorTotal || 0),
      anexo: f.nf.anexo || null
    };
  }

  return f;
}

function getFechamentoById(id) {
  const fechamento = getAllFechamentos().find(f => f.id === id) || null;
  return normalizeFechamento(fechamento);
}

function saveFechamento(fechamento) {
  const stored = loadFechamentosFromStorage();
  const index = stored.findIndex(f => f.id === fechamento.id);
  const normalized = normalizeFechamento(fechamento);

  if (index >= 0) {
    stored[index] = normalized;
  } else {
    stored.push(normalized);
  }

  saveFechamentosToStorage(stored);
  return normalized;
}

function formatFechamentoStatus(status) {
  return FECHAMENTO_STATUS_LABELS[status] || status;
}

function getFechamentoStatusBadgeClass(status) {
  return `badge badge--${status}`;
}

function createSimulatedNFAnexo(nome) {
  return {
    nome,
    dataAnexo: new Date().toISOString().split('T')[0]
  };
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
  if (filters.solicitanteUserId) {
    events = events.filter(e => e.solicitanteUserId === filters.solicitanteUserId);
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

function buildNFData(nfInput, valorTotal, fechamentoId) {
  if (!nfInput) return null;

  const today = new Date().toISOString().split('T')[0];
  const anexo = nfInput.anexo
    ? {
        nome: nfInput.anexo.nome || `NF-${fechamentoId}.pdf`,
        dataAnexo: nfInput.anexo.dataAnexo || today
      }
    : null;

  if (!anexo && !nfInput.numero && !nfInput.dataEmissao) return null;

  return {
    numero: (nfInput.numero || '').trim(),
    dataEmissao: nfInput.dataEmissao || today,
    valor: parseFloat(nfInput.valor) || valorTotal || 0,
    anexo
  };
}

function createFechamento({ clienteId, eventIds, nf, pagamento, observacao }) {
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
  const fechamentoId = generateFechamentoId();
  const nfData = buildNFData(nf, valorTotal, fechamentoId);

  const fechamento = {
    id: `fec-${Date.now()}`,
    fechamentoId,
    clienteId,
    status: 'a_faturar',
    eventIds: events.map(e => e.id),
    valorTotal,
    nf: nfData,
    pagamento: {
      prazoPagamento: pagamento?.prazoPagamento || '',
      dataRecebimento: ''
    },
    observacao: (observacao || '').trim()
  };

  return saveFechamento(fechamento);
}

function attachFechamentoNF(id) {
  const fechamento = getFechamentoById(id);
  if (!fechamento) return null;

  const today = new Date().toISOString().split('T')[0];
  const nf = {
    numero: fechamento.nf?.numero || String(Math.floor(1000 + Math.random() * 9000)),
    dataEmissao: fechamento.nf?.dataEmissao || today,
    valor: fechamento.nf?.valor != null ? fechamento.nf.valor : fechamento.valorTotal,
    anexo: createSimulatedNFAnexo(`NF-${fechamento.fechamentoId}.pdf`)
  };

  return saveFechamento({ ...fechamento, nf });
}

function removeFechamentoNF(id) {
  const fechamento = getFechamentoById(id);
  if (!fechamento) return null;

  if (!fechamento.nf) return fechamento;

  return saveFechamento({
    ...fechamento,
    nf: { ...fechamento.nf, anexo: null }
  });
}

function renderNFAnexoContent(nf, { attachBtnId, removeBtnId } = {}) {
  const anexo = nf?.anexo;
  const docIcon = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
    </svg>
  `;

  if (anexo && anexo.nome) {
    return `
      <div class="file-attachment">
        <div class="file-attachment__icon">${docIcon}</div>
        <div class="file-attachment__info">
          <span class="file-attachment__name">${escapeHtml(anexo.nome)}</span>
          <span class="file-attachment__date">Anexado em ${formatDate(anexo.dataAnexo)}</span>
        </div>
        ${removeBtnId ? `<button type="button" class="btn btn--ghost btn--sm" id="${removeBtnId}">Remover</button>` : ''}
      </div>
    `;
  }

  return `
    <button type="button" class="btn btn--secondary" id="${attachBtnId || 'attachNF'}">
      ${docIcon}
      Anexar NF
    </button>
  `;
}

function renderNFFieldsHtml(nf, valorDefault, { idPrefix = '' } = {}) {
  const p = idPrefix;
  const numero = nf?.numero || '';
  const dataEmissao = nf?.dataEmissao || '';
  const valor = nf?.valor != null ? nf.valor : valorDefault;

  return `
    <div class="form-grid" style="margin-top: 16px;">
      <div class="form-group">
        <label class="form-label" for="${p}nfNumero">Número da NF</label>
        <input type="text" class="input" id="${p}nfNumero" value="${escapeHtml(numero)}" placeholder="Ex.: 12345">
      </div>
      <div class="form-group">
        <label class="form-label" for="${p}nfDataEmissao">Data de emissão</label>
        <input type="date" class="input" id="${p}nfDataEmissao" value="${escapeHtml(dataEmissao)}">
      </div>
      <div class="form-group">
        <label class="form-label" for="${p}nfValor">Valor da NF</label>
        <input type="number" class="input" id="${p}nfValor" step="0.01" min="0" value="${valor}">
      </div>
    </div>
  `;
}

function renderPagamentoFieldsHtml(pagamento, { idPrefix = '', showRecebimento = false } = {}) {
  const p = idPrefix;
  const prazoPagamento = pagamento?.prazoPagamento || '';
  const dataRecebimento = pagamento?.dataRecebimento || '';

  return `
    <div class="form-grid">
      <div class="form-group">
        <label class="form-label" for="${p}prazoPagamento">Prazo de pagamento</label>
        <input type="date" class="input" id="${p}prazoPagamento" value="${escapeHtml(prazoPagamento)}">
      </div>
      ${showRecebimento ? `
        <div class="form-group">
          <label class="form-label" for="${p}dataRecebimento">Data de recebimento</label>
          <input type="date" class="input" id="${p}dataRecebimento" value="${escapeHtml(dataRecebimento)}">
        </div>
      ` : ''}
    </div>
  `;
}

function updateFechamentoStatus(id, status) {
  if (!FECHAMENTO_STATUS_LABELS[status]) return null;

  const fechamento = getFechamentoById(id);
  if (!fechamento) return null;

  const today = new Date().toISOString().split('T')[0];
  const updates = { ...fechamento, status };

  if (status === 'recebido' && !fechamento.pagamento?.dataRecebimento) {
    updates.pagamento = {
      ...fechamento.pagamento,
      dataRecebimento: today
    };
  }

  if (status === 'faturado' && fechamento.nf && !fechamento.nf.dataEmissao) {
    updates.nf = { ...fechamento.nf, dataEmissao: today };
  }

  return saveFechamento(updates);
}

function updateFechamentoObservacao(id, observacao) {
  const fechamento = getFechamentoById(id);
  if (!fechamento) return null;

  return saveFechamento({ ...fechamento, observacao: (observacao || '').trim() });
}

function updateFechamentoNF(id, nfPartial) {
  const fechamento = getFechamentoById(id);
  if (!fechamento) return null;

  const nf = fechamento.nf
    ? { ...fechamento.nf, ...nfPartial }
    : nfPartial;

  return saveFechamento({ ...fechamento, nf });
}

function updateFechamentoPagamento(id, pagamentoPartial) {
  const fechamento = getFechamentoById(id);
  if (!fechamento) return null;

  return saveFechamento({
    ...fechamento,
    pagamento: { ...fechamento.pagamento, ...pagamentoPartial }
  });
}
