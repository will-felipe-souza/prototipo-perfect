function renderFechamentoForm(container) {
  let clienteId = '';
  let solicitanteUserId = '';
  let produto = '';
  let selectedIds = new Set();
  let nf = null;
  let prazoPagamento = '';
  let observacao = '';

  function uniqueSorted(values) {
    return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
  }

  function getEligibleForClient() {
    if (!clienteId) return [];
    return getEventosSemFechamento({ clienteId });
  }

  function getFilteredEvents() {
    return getEventosSemFechamento({
      clienteId: clienteId || undefined,
      solicitanteUserId: solicitanteUserId || undefined,
      produto: produto || undefined
    });
  }

  function pruneSelection(events) {
    const visibleIds = new Set(events.map(e => e.id));
    selectedIds = new Set([...selectedIds].filter(id => visibleIds.has(id)));
  }

  function selectedTotal(events) {
    return events
      .filter(e => selectedIds.has(e.id))
      .reduce((sum, e) => sum + (e.valorFinal || 0), 0);
  }

  function syncNFValor(total) {
    if (nf && nf.valor == null) nf.valor = total;
  }

  function render() {
    const clients = getAllClients();
    const eligible = getEligibleForClient();
    const solicitanteMap = new Map();
    eligible.forEach(e => {
      if (e.solicitanteUserId) {
        solicitanteMap.set(e.solicitanteUserId, getUserName(e.solicitanteUserId));
      }
    });
    const solicitantes = [...solicitanteMap.entries()]
      .map(([id, nome]) => ({ id, nome }))
      .sort((a, b) => a.nome.localeCompare(b.nome));
    const produtos = uniqueSorted(eligible.map(e => e.produto));
    const events = clienteId ? getFilteredEvents() : [];
    pruneSelection(events);

    const selectedCount = selectedIds.size;
    const total = selectedTotal(events);
    syncNFValor(total);
    const canSave = !!clienteId && selectedCount > 0;

    container.innerHTML = `
      <div class="card">
        <div class="card__body">
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label form-label--required">Cliente</label>
              <select class="select" id="clienteSelect">
                <option value="">Selecione...</option>
                ${clients.map(c => `
                  <option value="${c.id}" ${clienteId === c.id ? 'selected' : ''}>${escapeHtml(c.nome)}</option>
                `).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Solicitante</label>
              <select class="select" id="solicitanteSelect" ${!clienteId ? 'disabled' : ''}>
                <option value="">Todos</option>
                ${solicitantes.map(s => `
                  <option value="${escapeHtml(s.id)}" ${solicitanteUserId === s.id ? 'selected' : ''}>${escapeHtml(s.nome)}</option>
                `).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Produto</label>
              <select class="select" id="produtoSelect" ${!clienteId ? 'disabled' : ''}>
                <option value="">Todos</option>
                ${produtos.map(p => `
                  <option value="${escapeHtml(p)}" ${produto === p ? 'selected' : ''}>${escapeHtml(p)}</option>
                `).join('')}
              </select>
            </div>
          </div>

          ${!clienteId ? `
            <div class="empty-state" style="padding: 32px 16px;">
              <div class="empty-state__title">Selecione um cliente</div>
              <div class="empty-state__text">Os eventos sem fechamento desse cliente aparecerão aqui.</div>
            </div>
          ` : events.length === 0 ? `
            <div class="empty-state" style="padding: 32px 16px;">
              <div class="empty-state__title">Nenhum evento disponível</div>
              <div class="empty-state__text">Não há eventos elegíveis para este cliente com os filtros atuais.</div>
            </div>
          ` : `
            <div class="table-wrapper" style="margin-top: 8px;">
              <table class="table">
                <thead>
                  <tr>
                    <th style="width: 40px;"></th>
                    <th>ID</th>
                    <th>Cliente</th>
                    <th>Solicitante</th>
                    <th>Produto</th>
                    <th>Status</th>
                    <th>Data</th>
                    <th>Budget</th>
                  </tr>
                </thead>
                <tbody>
                  ${events.map(e => `
                    <tr>
                      <td>
                        <div class="checkbox-group">
                          <input type="checkbox" class="event-check" value="${e.id}"
                            ${selectedIds.has(e.id) ? 'checked' : ''}>
                        </div>
                      </td>
                      <td>${escapeHtml(e.eventoId)}</td>
                      <td>${escapeHtml(getClientName(e.clienteId))}</td>
                      <td>${escapeHtml(getSolicitanteNome(e))}</td>
                      <td>${escapeHtml(e.produto || '—')}</td>
                      <td><span class="${getStatusBadgeClass(e.status)}">${formatStatus(e.status)}</span></td>
                      <td>${formatDate(e.data)}</td>
                      <td>${formatCurrency(e.valorFinal)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `}

          <div class="financial-summary" style="margin-top: 20px; max-width: 320px;">
            <div class="financial-summary__row">
              <span>Eventos selecionados</span>
              <span>${selectedCount}</span>
            </div>
            <div class="financial-summary__row financial-summary__row--total">
              <span>Valor total</span>
              <span>${formatCurrency(total)}</span>
            </div>
          </div>

          <div style="margin-top: 24px;">
            <div class="card__header" style="padding: 0; margin-bottom: 12px;">Nota Fiscal</div>
            ${renderNFAnexoContent(nf, { attachBtnId: 'attachNF', removeBtnId: 'removeNF' })}
            ${nf ? renderNFFieldsHtml(nf, total, { idPrefix: 'form' }) : ''}
          </div>

          <div style="margin-top: 24px;">
            <div class="card__header" style="padding: 0; margin-bottom: 12px;">Pagamento</div>
            ${renderPagamentoFieldsHtml({ prazoPagamento }, { idPrefix: 'form' })}
          </div>

          <div class="form-group" style="margin-top: 24px;">
            <label class="form-label" for="observacaoInput">Observações</label>
            <textarea class="textarea" id="observacaoInput" rows="4"
              placeholder="Anotações do financeiro sobre este fechamento...">${escapeHtml(observacao)}</textarea>
          </div>

          <div class="form-actions">
            <a href="#/fechamentos" class="btn btn--secondary">Cancelar</a>
            <button type="button" class="btn btn--primary" id="saveFechamento" ${canSave ? '' : 'disabled'}>
              Criar fechamento
            </button>
          </div>
        </div>
      </div>
    `;

    container.querySelector('#clienteSelect')?.addEventListener('change', (ev) => {
      clienteId = ev.target.value;
      solicitanteUserId = '';
      produto = '';
      selectedIds = new Set();
      render();
    });

    container.querySelector('#solicitanteSelect')?.addEventListener('change', (ev) => {
      solicitanteUserId = ev.target.value;
      render();
    });

    container.querySelector('#produtoSelect')?.addEventListener('change', (ev) => {
      produto = ev.target.value;
      render();
    });

    container.querySelectorAll('.event-check').forEach(cb => {
      cb.addEventListener('change', () => {
        if (cb.checked) selectedIds.add(cb.value);
        else selectedIds.delete(cb.value);
        render();
      });
    });

    container.querySelector('#attachNF')?.addEventListener('click', () => {
      const today = new Date().toISOString().split('T')[0];
      nf = {
        numero: String(Math.floor(1000 + Math.random() * 9000)),
        dataEmissao: today,
        valor: total,
        anexo: createSimulatedNFAnexo('NF-simulacao.pdf')
      };
      if (typeof showToast === 'function') {
        showToast('NF anexada (simulação)');
      }
      render();
    });

    container.querySelector('#removeNF')?.addEventListener('click', () => {
      if (nf) nf = { ...nf, anexo: null };
      render();
    });

    container.querySelector('#formnfNumero')?.addEventListener('input', (ev) => {
      if (nf) nf.numero = ev.target.value;
    });

    container.querySelector('#formnfDataEmissao')?.addEventListener('change', (ev) => {
      if (nf) nf.dataEmissao = ev.target.value;
    });

    container.querySelector('#formnfValor')?.addEventListener('input', (ev) => {
      if (nf) nf.valor = parseFloat(ev.target.value) || 0;
    });

    container.querySelector('#formprazoPagamento')?.addEventListener('change', (ev) => {
      prazoPagamento = ev.target.value;
    });

    container.querySelector('#observacaoInput')?.addEventListener('input', (ev) => {
      observacao = ev.target.value;
    });

    container.querySelector('#saveFechamento')?.addEventListener('click', () => {
      if (!clienteId || selectedIds.size === 0) return;

      const nfNumero = container.querySelector('#formnfNumero');
      const nfDataEmissao = container.querySelector('#formnfDataEmissao');
      const nfValor = container.querySelector('#formnfValor');
      const prazoEl = container.querySelector('#formprazoPagamento');

      if (nf && nf.anexo) {
        nf.numero = nfNumero?.value || nf.numero || '';
        nf.dataEmissao = nfDataEmissao?.value || nf.dataEmissao || '';
        nf.valor = parseFloat(nfValor?.value) || total;
      }

      const created = createFechamento({
        clienteId,
        eventIds: [...selectedIds],
        nf: nf?.anexo || nf?.numero || nf?.dataEmissao ? nf : null,
        pagamento: {
          prazoPagamento: prazoEl?.value || prazoPagamento
        },
        observacao
      });

      if (!created) return;

      if (typeof showToast === 'function') {
        showToast('Fechamento criado!');
      }

      sessionStorage.setItem('fechamentos_list_tab', 'fechamentos');
      window.location.hash = `/fechamentos/${created.id}`;
    });
  }

  render();
}
