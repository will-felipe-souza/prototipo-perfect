function renderFechamentoDetail(container, fechamentoId) {
  const fechamento = getFechamentoById(fechamentoId);

  if (!fechamento) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__title">Fechamento não encontrado</div>
        <a href="#/fechamentos" class="btn btn--secondary">Voltar</a>
      </div>
    `;
    return;
  }

  const events = (fechamento.eventIds || [])
    .map(id => {
      const event = getEventById(id);
      return event ? enrichEventFinancials(event) : null;
    })
    .filter(Boolean);

  container.innerHTML = `
    <div class="detail-header">
      <div class="detail-header__info">
        <span class="detail-header__protocolo">${escapeHtml(fechamento.fechamentoId)}</span>
        <span class="${getFechamentoStatusBadgeClass(fechamento.status)}">${formatFechamentoStatus(fechamento.status)}</span>
      </div>
      <div style="display:flex;gap:8px;">
        <a href="#/fechamentos" class="btn btn--secondary" id="voltarFechamentos">Voltar</a>
      </div>
    </div>

    <div class="detail-grid">
      <div class="card">
        <div class="card__header">Dados do fechamento</div>
        <div class="card__body" style="display:flex;flex-direction:column;gap:16px;">
          <div class="detail-item">
            <span class="detail-item__label">ID</span>
            <span class="detail-item__value">${escapeHtml(fechamento.fechamentoId)}</span>
          </div>
          <div class="detail-item">
            <span class="detail-item__label">Cliente</span>
            <span class="detail-item__value">${escapeHtml(getClientName(fechamento.clienteId))}</span>
          </div>
          <div class="detail-item">
            <span class="detail-item__label">Status</span>
            <span class="detail-item__value">
              <select class="select" id="fechamentoStatusSelect" style="min-width: 160px;">
                ${Object.entries(FECHAMENTO_STATUS_LABELS).map(([val, label]) => `
                  <option value="${val}" ${fechamento.status === val ? 'selected' : ''}>${label}</option>
                `).join('')}
              </select>
            </span>
          </div>
          <div class="detail-item">
            <span class="detail-item__label">Quantidade de eventos</span>
            <span class="detail-item__value">${(fechamento.eventIds || []).length}</span>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card__header">Resumo financeiro</div>
        <div class="card__body">
          <div class="financial-summary">
            <div class="financial-summary__row">
              <span>Eventos no fechamento</span>
              <span>${events.length}</span>
            </div>
            <div class="financial-summary__row financial-summary__row--total">
              <span>Valor Total</span>
              <span>${formatCurrency(fechamento.valorTotal)}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="card" style="grid-column: 1 / -1;">
        <div class="card__header">Eventos (${events.length})</div>
        <div class="card__body" style="padding: 0;">
          ${events.length === 0 ? `
            <div class="empty-state" style="padding: 24px;">
              <div class="empty-state__text">Nenhum evento vinculado.</div>
            </div>
          ` : `
            <div class="table-wrapper">
              <table class="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Solicitante</th>
                    <th>Produto</th>
                    <th>Status</th>
                    <th>Data</th>
                    <th>Budget</th>
                  </tr>
                </thead>
                <tbody>
                  ${events.map(e => `
                    <tr data-href="#/eventos/${e.id}">
                      <td><span class="table__link">${escapeHtml(e.eventoId)}</span></td>
                      <td>${escapeHtml(e.solicitante || '—')}</td>
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
        </div>
      </div>
    </div>
  `;

  container.querySelector('#voltarFechamentos')?.addEventListener('click', () => {
    sessionStorage.setItem('fechamentos_list_tab', 'fechamentos');
  });

  container.querySelector('#fechamentoStatusSelect')?.addEventListener('change', (ev) => {
    const updated = updateFechamentoStatus(fechamento.id, ev.target.value);
    if (!updated) return;

    if (typeof showToast === 'function') {
      showToast('Status atualizado!');
    }

    renderFechamentoDetail(container, fechamento.id);
  });

  container.querySelectorAll('tr[data-href]').forEach(row => {
    row.addEventListener('click', () => {
      window.location.hash = row.dataset.href.replace('#', '');
    });
  });
}
