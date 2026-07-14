function renderEventForm(container, editEvent) {
  const isEdit = !!editEvent;
  const clients = getAllClients();

  const event = editEvent || {
    eventoId: '',
    tipoEvento: '',
    status: 'aberto',
    clienteId: '',
    atendimento: '',
    solicitante: '',
    produto: '',
    dataSolicitacao: new Date().toISOString().split('T')[0],
    nomeEvento: '',
    data: '',
    horario: '',
    nomeRestaurante: '',
    valorPorPessoa: '',
    numeroParticipantes: '',
    cidade: '',
    estado: '',
    endereco: '',
    contatoRestauranteNome: '',
    contatoRestauranteTelefone: '',
    medico: '',
    telefoneMedico: '',
    emailMedico: '',
    feeMedico: '',
    feeTipoEvento: '',
    feeValorEvento: '',
    impostosPercentualEvento: '',
    extras: []
  };

  let activeTab = 0;
  const tabs = ['Geral', 'Restaurante', 'Médico', 'Extras', 'Financeiro'];
  const tabFields = {
    0: ['tipoEvento', 'clienteId', 'dataSolicitacao', 'nomeEvento'],
    1: ['contatoRestauranteNome', 'contatoRestauranteTelefone', 'nomeRestaurante', 'endereco'],
    2: ['medico', 'feeMedico'],
    3: [],
    4: []
  };

  const fieldTab = {
    tipoEvento: 0, clienteId: 0, dataSolicitacao: 0, nomeEvento: 0,
    contatoRestauranteNome: 1, contatoRestauranteTelefone: 1, nomeRestaurante: 1, endereco: 1,
    medico: 2, feeMedico: 2
  };

  if (!isEdit && event.tipoEvento) {
    event.eventoId = generateEventoId(event.tipoEvento);
  }

  function getSolicitantesForCliente(clienteId) {
    const client = getClientById(clienteId);
    return client ? (client.solicitantes || []) : [];
  }

  function renderSolicitanteSelectHtml() {
    const solicitantes = getSolicitantesForCliente(event.clienteId);

    if (!event.clienteId) {
      return `
        <select class="select" name="solicitante" id="solicitante" disabled>
          <option value="">Selecione um cliente primeiro</option>
        </select>
      `;
    }

    if (solicitantes.length === 0) {
      return `
        <select class="select" name="solicitante" id="solicitante" disabled>
          <option value="">Nenhum solicitante cadastrado</option>
        </select>
        <span class="form-hint">Cadastre solicitantes no cliente selecionado.</span>
      `;
    }

    const currentInList = solicitantes.includes(event.solicitante);
    const legacyOption = event.solicitante && !currentInList
      ? `<option value="${escapeHtml(event.solicitante)}" selected>${escapeHtml(event.solicitante)}</option>`
      : '';

    return `
      <select class="select" name="solicitante" id="solicitante">
        <option value="">Selecione...</option>
        ${legacyOption}
        ${solicitantes.map(s => `
          <option value="${escapeHtml(s)}" ${event.solicitante === s ? 'selected' : ''}>${escapeHtml(s)}</option>
        `).join('')}
      </select>
    `;
  }

  function updateSolicitanteSelect() {
    const field = container.querySelector('#solicitanteField');
    if (field) field.innerHTML = renderSolicitanteSelectHtml();
  }

  function getProdutosForCliente(clienteId) {
    const client = getClientById(clienteId);
    return client ? (client.produtos || []) : [];
  }

  function renderProdutoSelectHtml() {
    const produtos = getProdutosForCliente(event.clienteId);

    if (!event.clienteId) {
      return `
        <select class="select" name="produto" id="produto" disabled>
          <option value="">Selecione um cliente primeiro</option>
        </select>
      `;
    }

    if (produtos.length === 0) {
      return `
        <select class="select" name="produto" id="produto" disabled>
          <option value="">Nenhum produto cadastrado</option>
        </select>
        <span class="form-hint">Cadastre produtos no cliente selecionado.</span>
      `;
    }

    const currentInList = produtos.includes(event.produto);
    const legacyOption = event.produto && !currentInList
      ? `<option value="${escapeHtml(event.produto)}" selected>${escapeHtml(event.produto)}</option>`
      : '';

    return `
      <select class="select" name="produto" id="produto">
        <option value="">Selecione...</option>
        ${legacyOption}
        ${produtos.map(p => `
          <option value="${escapeHtml(p)}" ${event.produto === p ? 'selected' : ''}>${escapeHtml(p)}</option>
        `).join('')}
      </select>
    `;
  }

  function updateProdutoSelect() {
    const field = container.querySelector('#produtoField');
    if (field) field.innerHTML = renderProdutoSelectHtml();
  }

  function updateClienteDependentFields() {
    const solicitantes = getSolicitantesForCliente(event.clienteId);
    const produtos = getProdutosForCliente(event.clienteId);

    if (event.solicitante && !solicitantes.includes(event.solicitante)) {
      event.solicitante = '';
    }
    if (event.produto && !produtos.includes(event.produto)) {
      event.produto = '';
    }

    applyClientFeeDefaults(true);
    updateSolicitanteSelect();
    updateProdutoSelect();
  }

  function applyClientFeeDefaults(force) {
    const client = getClientById(event.clienteId);
    if (!client) return;

    const empty = (v) => v === undefined || v === null || v === '';
    if (force || empty(event.feeTipoEvento)) event.feeTipoEvento = client.feeTipo || 'fixo';
    if (force || empty(event.feeValorEvento)) event.feeValorEvento = client.feeValor;
    if (force || empty(event.impostosPercentualEvento)) event.impostosPercentualEvento = client.impostosPercentual;
  }

  function getFeeValorLabel() {
    return event.feeTipoEvento === 'percentual' ? 'Fee (%)' : 'Fee (R$)';
  }

  function getFinancialSummary() {
    return calculateValorFinal(event, event.clienteId);
  }

  function getExtraDisplayValues(ex) {
    const quantidade = ex.quantidade != null && ex.quantidade !== '' ? ex.quantidade : 1;
    const valorUnitario = ex.valorUnitario != null && ex.valorUnitario !== ''
      ? ex.valorUnitario
      : (ex.valor || 0);
    const total = (parseFloat(quantidade) || 0) * (parseFloat(valorUnitario) || 0) || parseFloat(ex.valor) || 0;
    return {
      tipo: ex.tipo || '',
      descricao: ex.descricao || '',
      quantidade,
      valorUnitario,
      total
    };
  }

  function renderExtraRow(ex, i) {
    const { tipo, descricao, quantidade, valorUnitario, total } = getExtraDisplayValues(ex);
    return `
      <div class="extra-item" data-index="${i}">
        <div class="extra-item__actions">
          <button type="button" class="btn btn--ghost btn--sm remove-extra" data-index="${i}">Remover</button>
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Extra</label>
            <input type="text" class="input" name="extra_tipo_${i}" value="${escapeHtml(tipo)}">
          </div>
          <div class="form-group">
            <label class="form-label">Descrição</label>
            <input type="text" class="input" name="extra_desc_${i}" value="${escapeHtml(descricao)}">
          </div>
          <div class="form-group">
            <label class="form-label">Quantidade</label>
            <input type="number" class="input calc-trigger extra-calc" name="extra_qtd_${i}" value="${quantidade}" min="0" step="1">
          </div>
          <div class="form-group">
            <label class="form-label">Valor unitário (R$)</label>
            <input type="number" class="input calc-trigger extra-calc" name="extra_valorUnitario_${i}" value="${valorUnitario}" min="0" step="0.01">
          </div>
          <div class="form-group">
            <label class="form-label">Total (R$)</label>
            <input type="text" class="input computed-field" name="extra_total_${i}" value="${formatCurrency(total)}" readonly>
          </div>
        </div>
      </div>
    `;
  }

  function updateExtraRowTotals() {
    const form = container.querySelector('#eventForm');
    if (!form) return;

    let i = 0;
    while (form.querySelector(`[name="extra_qtd_${i}"]`)) {
      const quantidade = parseFloat(form.querySelector(`[name="extra_qtd_${i}"]`).value) || 0;
      const valorUnitario = parseFloat(form.querySelector(`[name="extra_valorUnitario_${i}"]`).value) || 0;
      const totalEl = form.querySelector(`[name="extra_total_${i}"]`);
      if (totalEl) totalEl.value = formatCurrency(quantidade * valorUnitario);
      i++;
    }
  }

  function renderFinancialSummary() {
    const fin = getFinancialSummary();
    return `
      <div class="section-title">Custos do evento</div>
      <div class="financial-summary" id="financialCosts">
        <div class="financial-summary__row"><span>Valor restaurante</span><span id="finValorRestaurante">${formatCurrency(fin.valorEvento)}</span></div>
        <div class="financial-summary__row"><span>Fee do médico</span><span id="finFeeMedico">${formatCurrency(fin.feeMedico)}</span></div>
        <div class="financial-summary__row"><span>Extras</span><span id="finExtras">${formatCurrency(fin.somaExtras)}</span></div>
        <div class="financial-summary__row"><span>Subtotal</span><span id="finSubtotal">${formatCurrency(fin.subtotal)}</span></div>
      </div>

      <div class="section-title" style="margin-top: 24px;">Fee e impostos</div>
      <p class="form-hint" style="margin-bottom: 12px;">Pré-preenchidos do cliente; podem ser ajustados neste evento.</p>
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Tipo de fee</label>
          <select class="select calc-trigger" name="feeTipoEvento" id="feeTipoEvento">
            ${Object.entries(FEE_TIPO_LABELS).map(([val, label]) => `
              <option value="${val}" ${event.feeTipoEvento === val ? 'selected' : ''}>${label}</option>
            `).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" id="feeValorEventoLabel">${getFeeValorLabel()}</label>
          <input type="number" class="input calc-trigger" name="feeValorEvento" id="feeValorEvento" value="${event.feeValorEvento}" min="0" step="0.01">
        </div>
        <div class="form-group">
          <label class="form-label">Impostos (%)</label>
          <input type="number" class="input calc-trigger" name="impostosPercentualEvento" id="impostosPercentualEvento" value="${event.impostosPercentualEvento}" min="0" max="100" step="0.01">
        </div>
      </div>

      <div class="section-title" style="margin-top: 24px;">Valor final</div>
      <div class="financial-summary" id="financialTotals">
        <div class="financial-summary__row"><span>Fee Perfect</span><span id="finFeePerfect">${formatCurrency(fin.feeCliente)}</span></div>
        <div class="financial-summary__row"><span>Custo total</span><span id="finCustoTotal">${formatCurrency(fin.base)}</span></div>
        <div class="financial-summary__row"><span>Impostos (<span id="finImpostosPct">${fin.impostosPct}</span>%)</span><span id="finImpostos">${formatCurrency(fin.impostos)}</span></div>
        <div class="financial-summary__row financial-summary__row--total"><span>Valor Final (Budget)</span><span id="finBudget">${formatCurrency(fin.valorFinal)}</span></div>
      </div>
    `;
  }

  function renderRequiredHint() {
    if (!event.clienteId) return '';
    const extra = getRequiredFieldsForClient(event.clienteId);
    if (!extra.length) return '';
    return `<p class="form-hint" id="clientRequiredHint" style="margin-bottom: 16px;">Campos obrigatórios deste cliente: ${extra.map(getFieldLabel).join(', ')}</p>`;
  }

  function render() {
    if (!isEdit && event.tipoEvento && !event.eventoId) {
      event.eventoId = generateEventoId(event.tipoEvento);
    }
    if (event.clienteId) applyClientFeeDefaults(false);

    const fin = getFinancialSummary();

    container.innerHTML = `
      <div class="card">
        <div class="card__body">
          <div class="tabs" id="formTabs">
            ${tabs.map((tab, i) => `
              <button type="button" class="tab ${i === activeTab ? 'tab--active' : ''}" data-tab="${i}">${tab}</button>
            `).join('')}
          </div>

          <form id="eventForm" novalidate>
            ${renderRequiredHint()}

            <div class="tab-panel ${activeTab === 0 ? 'tab-panel--active' : ''}">
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label form-label--required">Tipo de evento</label>
                  <select class="select" name="tipoEvento" id="tipoEvento">
                    <option value="">Selecione...</option>
                    ${Object.entries(TIPO_EVENTO_LABELS).map(([val, label]) => `
                      <option value="${val}" ${event.tipoEvento === val ? 'selected' : ''}>${label}</option>
                    `).join('')}
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">ID</label>
                  <input type="text" class="input computed-field" name="eventoId" value="${escapeHtml(event.eventoId)}" readonly>
                </div>
                <div class="form-group">
                  <label class="form-label form-label--required">Status</label>
                  <select class="select" name="status">
                    ${Object.entries(STATUS_LABELS).map(([val, label]) => `
                      <option value="${val}" ${event.status === val ? 'selected' : ''}>${label}</option>
                    `).join('')}
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label form-label--required">Cliente</label>
                  <select class="select" name="clienteId" id="clienteId">
                    <option value="">Selecione...</option>
                    ${clients.map(c => `
                      <option value="${c.id}" ${event.clienteId === c.id ? 'selected' : ''}>${escapeHtml(c.nome)}</option>
                    `).join('')}
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Solicitante</label>
                  <div id="solicitanteField">${renderSolicitanteSelectHtml()}</div>
                </div>
                <div class="form-group">
                  <label class="form-label">Produto</label>
                  <div id="produtoField">${renderProdutoSelectHtml()}</div>
                </div>
                <div class="form-group">
                  <label class="form-label">Atendimento</label>
                  <input type="text" class="input" name="atendimento" value="${escapeHtml(event.atendimento)}">
                </div>
                <div class="form-group">
                  <label class="form-label form-label--required">Data solicitação</label>
                  <input type="date" class="input" name="dataSolicitacao" value="${event.dataSolicitacao || ''}">
                </div>
                <div class="form-group">
                  <label class="form-label">Data do evento</label>
                  <input type="date" class="input" name="data" value="${event.data || ''}">
                </div>
                <div class="form-group">
                  <label class="form-label">Horário</label>
                  <input type="time" class="input" name="horario" value="${event.horario || ''}">
                </div>
                <div class="form-group form-group--full">
                  <label class="form-label">Nome do evento</label>
                  <input type="text" class="input" name="nomeEvento" value="${escapeHtml(event.nomeEvento)}">
                </div>
              </div>
            </div>

            <div class="tab-panel ${activeTab === 1 ? 'tab-panel--active' : ''}">
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Nome do restaurante</label>
                  <input type="text" class="input" name="nomeRestaurante" value="${escapeHtml(event.nomeRestaurante)}">
                </div>
                <div class="form-group">
                  <label class="form-label">Valor por pessoa (R$)</label>
                  <input type="number" class="input calc-trigger" name="valorPorPessoa" value="${event.valorPorPessoa}" min="0" step="0.01">
                </div>
                <div class="form-group">
                  <label class="form-label">Participantes</label>
                  <input type="number" class="input calc-trigger" name="numeroParticipantes" value="${event.numeroParticipantes}" min="0">
                </div>
                <div class="form-group">
                  <label class="form-label">Valor restaurante (calculado)</label>
                  <input type="text" class="input computed-field" id="valorEventoCalculado" value="${formatCurrency(fin.valorEvento)}" readonly>
                </div>
                <div class="form-group">
                  <label class="form-label">Cidade</label>
                  <input type="text" class="input" name="cidade" value="${escapeHtml(event.cidade)}">
                </div>
                <div class="form-group">
                  <label class="form-label">Estado</label>
                  <input type="text" class="input" name="estado" value="${escapeHtml(event.estado)}" maxlength="2" placeholder="Ex.: MG">
                </div>
                <div class="form-group form-group--full">
                  <label class="form-label">Endereço</label>
                  <input type="text" class="input" name="endereco" value="${escapeHtml(event.endereco)}">
                </div>
                <div class="form-group">
                  <label class="form-label form-label--required">Contato restaurante (nome)</label>
                  <input type="text" class="input" name="contatoRestauranteNome" value="${escapeHtml(event.contatoRestauranteNome)}">
                </div>
                <div class="form-group">
                  <label class="form-label form-label--required">Contato restaurante (telefone)</label>
                  <input type="tel" class="input" name="contatoRestauranteTelefone" value="${escapeHtml(event.contatoRestauranteTelefone)}">
                </div>
              </div>
            </div>

            <div class="tab-panel ${activeTab === 2 ? 'tab-panel--active' : ''}">
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Médico</label>
                  <input type="text" class="input" name="medico" value="${escapeHtml(event.medico)}">
                </div>
                <div class="form-group">
                  <label class="form-label">Telefone</label>
                  <input type="tel" class="input" name="telefoneMedico" value="${escapeHtml(event.telefoneMedico)}">
                </div>
                <div class="form-group">
                  <label class="form-label">E-mail</label>
                  <input type="email" class="input" name="emailMedico" value="${escapeHtml(event.emailMedico)}">
                </div>
                <div class="form-group">
                  <label class="form-label">Fee do médico (R$)</label>
                  <input type="number" class="input calc-trigger" name="feeMedico" value="${event.feeMedico}" min="0" step="0.01">
                </div>
              </div>
            </div>

            <div class="tab-panel ${activeTab === 3 ? 'tab-panel--active' : ''}">
              <div id="extrasList">
                ${(event.extras || []).map((ex, i) => renderExtraRow(ex, i)).join('')}
              </div>
              <button type="button" class="btn btn--secondary" id="addExtra" style="margin-top: 8px;">+ Adicionar extra</button>
            </div>

            <div class="tab-panel ${activeTab === 4 ? 'tab-panel--active' : ''}">
              <div id="financialSummary">${renderFinancialSummary()}</div>
            </div>

            <div class="form-actions">
              ${activeTab > 0 ? '<button type="button" class="btn btn--secondary" id="prevTab">Anterior</button>' : ''}
              ${activeTab < tabs.length - 1
                ? '<button type="button" class="btn btn--primary" id="nextTab">Próximo</button>'
                : `<button type="submit" class="btn btn--primary">${isEdit ? 'Salvar alterações' : 'Criar evento'}</button>`
              }
              <a href="#/eventos" class="btn btn--ghost">Cancelar</a>
            </div>
          </form>
        </div>
      </div>
    `;

    bindEvents();
  }

  function syncFormToEvent() {
    const form = container.querySelector('#eventForm');
    if (!form) return;
    const data = new FormData(form);

    const extras = [];
    let i = 0;
    while (form.querySelector(`[name="extra_tipo_${i}"]`)) {
      const quantidade = parseFloat(data.get(`extra_qtd_${i}`)) || 0;
      const valorUnitario = parseFloat(data.get(`extra_valorUnitario_${i}`)) || 0;
      extras.push({
        id: (event.extras && event.extras[i] && event.extras[i].id) || `ext-${Date.now()}-${i}`,
        tipo: data.get(`extra_tipo_${i}`),
        descricao: data.get(`extra_desc_${i}`),
        quantidade,
        valorUnitario,
        valor: quantidade * valorUnitario
      });
      i++;
    }

    const tipoEvento = data.get('tipoEvento');
    let eventoId = data.get('eventoId');
    if (!isEdit && tipoEvento && (!eventoId || event.tipoEvento !== tipoEvento)) {
      eventoId = generateEventoId(tipoEvento);
    }

    Object.assign(event, {
      eventoId,
      tipoEvento,
      status: data.get('status'),
      clienteId: data.get('clienteId'),
      atendimento: data.get('atendimento'),
      solicitante: data.get('solicitante'),
      produto: data.get('produto'),
      dataSolicitacao: data.get('dataSolicitacao'),
      nomeEvento: data.get('nomeEvento'),
      data: data.get('data'),
      horario: data.get('horario'),
      nomeRestaurante: data.get('nomeRestaurante'),
      valorPorPessoa: data.get('valorPorPessoa'),
      numeroParticipantes: data.get('numeroParticipantes'),
      cidade: data.get('cidade'),
      estado: data.get('estado'),
      endereco: data.get('endereco'),
      contatoRestauranteNome: data.get('contatoRestauranteNome'),
      contatoRestauranteTelefone: data.get('contatoRestauranteTelefone'),
      medico: data.get('medico'),
      telefoneMedico: data.get('telefoneMedico'),
      emailMedico: data.get('emailMedico'),
      feeMedico: data.get('feeMedico'),
      feeTipoEvento: data.get('feeTipoEvento') || event.feeTipoEvento,
      feeValorEvento: data.get('feeValorEvento') !== null ? data.get('feeValorEvento') : event.feeValorEvento,
      impostosPercentualEvento: data.get('impostosPercentualEvento') !== null ? data.get('impostosPercentualEvento') : event.impostosPercentualEvento,
      extras
    });
  }

  function updateFinancialDisplay() {
    updateExtraRowTotals();
    syncFormToEvent();
    const fin = getFinancialSummary();
    const valorEventoEl = container.querySelector('#valorEventoCalculado');
    if (valorEventoEl) valorEventoEl.value = formatCurrency(fin.valorEvento);

    const setText = (id, value) => {
      const el = container.querySelector(id);
      if (el) el.textContent = value;
    };
    setText('#finValorRestaurante', formatCurrency(fin.valorEvento));
    setText('#finFeeMedico', formatCurrency(fin.feeMedico));
    setText('#finExtras', formatCurrency(fin.somaExtras));
    setText('#finSubtotal', formatCurrency(fin.subtotal));
    setText('#finFeePerfect', formatCurrency(fin.feeCliente));
    setText('#finCustoTotal', formatCurrency(fin.base));
    setText('#finImpostosPct', String(fin.impostosPct));
    setText('#finImpostos', formatCurrency(fin.impostos));
    setText('#finBudget', formatCurrency(fin.valorFinal));

    const feeLabel = container.querySelector('#feeValorEventoLabel');
    if (feeLabel) feeLabel.textContent = getFeeValorLabel();
  }

  function bindEvents() {
    container.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        syncFormToEvent();
        activeTab = parseInt(tab.dataset.tab, 10);
        render();
      });
    });

    container.querySelector('#prevTab')?.addEventListener('click', () => {
      syncFormToEvent();
      activeTab--;
      render();
    });

    container.querySelector('#nextTab')?.addEventListener('click', () => {
      syncFormToEvent();
      const result = validateEventFields(event, tabFields[activeTab]);
      if (!result.valid) return;
      activeTab++;
      render();
    });

    container.querySelector('#tipoEvento')?.addEventListener('change', () => {
      syncFormToEvent();
      if (!isEdit && event.tipoEvento) {
        event.eventoId = generateEventoId(event.tipoEvento);
        const idField = container.querySelector('[name="eventoId"]');
        if (idField) idField.value = event.eventoId;
      }
    });

    container.querySelector('#clienteId')?.addEventListener('change', () => {
      syncFormToEvent();
      updateClienteDependentFields();
      render();
    });

    container.querySelector('#feeTipoEvento')?.addEventListener('change', () => {
      syncFormToEvent();
      const label = container.querySelector('#feeValorEventoLabel');
      if (label) label.textContent = getFeeValorLabel();
      updateFinancialDisplay();
    });

    container.querySelectorAll('.calc-trigger').forEach(el => {
      el.addEventListener('input', updateFinancialDisplay);
    });

    container.querySelector('#addExtra')?.addEventListener('click', () => {
      syncFormToEvent();
      event.extras = event.extras || [];
      event.extras.push({ id: `ext-${Date.now()}`, tipo: '', descricao: '', quantidade: 1, valorUnitario: 0, valor: 0 });
      render();
    });

    container.querySelectorAll('.remove-extra').forEach(btn => {
      btn.addEventListener('click', () => {
        syncFormToEvent();
        event.extras.splice(parseInt(btn.dataset.index, 10), 1);
        render();
      });
    });

    container.querySelector('#eventForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      syncFormToEvent();
      const result = validateEventFields(event);
      if (!result.valid) {
        if (result.firstInvalidField && fieldTab[result.firstInvalidField] !== undefined) {
          activeTab = fieldTab[result.firstInvalidField];
          render();
        }
        return;
      }
      handleSubmit();
    });
  }

  function handleSubmit() {
    syncFormToEvent();
    const fin = calculateValorFinal(event, event.clienteId);

    const newEvent = {
      id: isEdit ? editEvent.id : `evt-${Date.now()}`,
      eventoId: event.eventoId,
      tipoEvento: event.tipoEvento,
      status: event.status,
      clienteId: event.clienteId,
      atendimento: event.atendimento,
      solicitante: event.solicitante,
      produto: event.produto,
      dataSolicitacao: event.dataSolicitacao,
      nomeEvento: event.nomeEvento,
      data: event.data,
      horario: event.horario,
      nomeRestaurante: event.nomeRestaurante,
      valorPorPessoa: parseFloat(event.valorPorPessoa) || 0,
      numeroParticipantes: parseInt(event.numeroParticipantes, 10) || 0,
      cidade: event.cidade,
      estado: event.estado,
      endereco: event.endereco,
      contatoRestauranteNome: event.contatoRestauranteNome,
      contatoRestauranteTelefone: event.contatoRestauranteTelefone,
      medico: event.medico,
      telefoneMedico: event.telefoneMedico,
      emailMedico: event.emailMedico,
      feeMedico: parseFloat(event.feeMedico) || 0,
      feeTipoEvento: event.feeTipoEvento || 'fixo',
      feeValorEvento: parseFloat(event.feeValorEvento) || 0,
      impostosPercentualEvento: parseFloat(event.impostosPercentualEvento) || 0,
      extras: event.extras || [],
      ...fin
    };

    saveEvent(newEvent);
    showToast(isEdit ? 'Evento atualizado!' : 'Evento criado!');
    window.location.hash = `/eventos/${newEvent.id}`;
  }

  render();
}
