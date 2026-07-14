function renderFechamentoList(container) {
  const TAB_A_FECHAR = 0;
  const TAB_FECHAMENTOS = 1;

  let activeTab = sessionStorage.getItem('fechamentos_list_tab') === 'fechamentos'
    ? TAB_FECHAMENTOS
    : TAB_A_FECHAR;
  sessionStorage.removeItem('fechamentos_list_tab');

  let aFecharSearch = '';
  let aFecharClienteId = '';
  let fechamentosSearch = '';
  let fechamentosStatus = '';

  function renderAFecharPanel() {
    let events = getEventosSemFechamento(
      aFecharClienteId ? { clienteId: aFecharClienteId } : {}
    );

    if (aFecharSearch) {
      const q = aFecharSearch.toLowerCase();
      events = events.filter(e =>
        (e.eventoId || '').toLowerCase().includes(q) ||
        (getClientName(e.clienteId) || '').toLowerCase().includes(q) ||
        (e.solicitante || '').toLowerCase().includes(q) ||
        (e.produto || '').toLowerCase().includes(q)
      );
    }

    const clients = getAllClients();

    return `
      <div class="filters">
        <input type="text" class="input input--search" id="aFecharSearch"
          placeholder="Buscar por ID, cliente, solicitante ou produto..."
          value="${escapeHtml(aFecharSearch)}">
        <select class="select" id="aFecharCliente">
          <option value="">Todos os clientes</option>
          ${clients.map(c => `
            <option value="${c.id}" ${aFecharClienteId === c.id ? 'selected' : ''}>${escapeHtml(c.nome)}</option>
          `).join('')}
        </select>
      </div>

      <div class="card">
        <div class="card__body" style="padding: 0;">
          ${events.length === 0 ? `
            <div class="empty-state">
              <div class="empty-state__title">Nenhum evento a fechar</div>
              <div class="empty-state__text">
                ${aFecharSearch || aFecharClienteId
                  ? 'Tente ajustar os filtros.'
                  : 'Todos os eventos elegíveis já estão em um fechamento.'}
              </div>
            </div>
          ` : `
            <div class="table-wrapper">
              <table class="table">
                <thead>
                  <tr>
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
                      <td>${escapeHtml(e.eventoId)}</td>
                      <td>${escapeHtml(getClientName(e.clienteId))}</td>
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
    `;
  }

  function renderFechamentosPanel() {
    let fechamentos = getAllFechamentos();

    if (fechamentosStatus) {
      fechamentos = fechamentos.filter(f => f.status === fechamentosStatus);
    }

    if (fechamentosSearch) {
      const q = fechamentosSearch.toLowerCase();
      fechamentos = fechamentos.filter(f =>
        (f.fechamentoId || '').toLowerCase().includes(q) ||
        (getClientName(f.clienteId) || '').toLowerCase().includes(q)
      );
    }

    return `
      <div class="filters">
        <input type="text" class="input input--search" id="fechamentosSearch"
          placeholder="Buscar por ID ou cliente..."
          value="${escapeHtml(fechamentosSearch)}">
        <select class="select" id="fechamentosStatus">
          <option value="">Todos os status</option>
          ${Object.entries(FECHAMENTO_STATUS_LABELS).map(([val, label]) => `
            <option value="${val}" ${fechamentosStatus === val ? 'selected' : ''}>${label}</option>
          `).join('')}
        </select>
      </div>

      <div class="card">
        <div class="card__body" style="padding: 0;">
          ${fechamentos.length === 0 ? `
            <div class="empty-state">
              <div class="empty-state__title">Nenhum fechamento encontrado</div>
              <div class="empty-state__text">
                ${fechamentosSearch || fechamentosStatus
                  ? 'Tente ajustar os filtros.'
                  : 'Os fechamentos aparecerão aqui quando forem criados.'}
              </div>
            </div>
          ` : `
            <div class="table-wrapper">
              <table class="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Cliente</th>
                    <th>Status</th>
                    <th>Quantidade de eventos</th>
                    <th>Valor Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${fechamentos.map(f => `
                    <tr data-href="#/fechamentos/${f.id}">
                      <td><span class="table__link">${escapeHtml(f.fechamentoId)}</span></td>
                      <td>${escapeHtml(getClientName(f.clienteId))}</td>
                      <td><span class="${getFechamentoStatusBadgeClass(f.status)}">${formatFechamentoStatus(f.status)}</span></td>
                      <td>${(f.eventIds || []).length}</td>
                      <td>${formatCurrency(f.valorTotal)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>
      </div>
    `;
  }

  function render() {
    container.innerHTML = `
      <div class="tabs" id="fechamentoTabs">
        <button type="button" class="tab ${activeTab === TAB_A_FECHAR ? 'tab--active' : ''}" data-tab="${TAB_A_FECHAR}">A fechar</button>
        <button type="button" class="tab ${activeTab === TAB_FECHAMENTOS ? 'tab--active' : ''}" data-tab="${TAB_FECHAMENTOS}">Fechamentos</button>
      </div>

      <div class="tab-panel ${activeTab === TAB_A_FECHAR ? 'tab-panel--active' : ''}" data-panel="${TAB_A_FECHAR}">
        ${activeTab === TAB_A_FECHAR ? renderAFecharPanel() : ''}
      </div>
      <div class="tab-panel ${activeTab === TAB_FECHAMENTOS ? 'tab-panel--active' : ''}" data-panel="${TAB_FECHAMENTOS}">
        ${activeTab === TAB_FECHAMENTOS ? renderFechamentosPanel() : ''}
      </div>
    `;

    container.querySelectorAll('#fechamentoTabs .tab').forEach(tab => {
      tab.addEventListener('click', () => {
        activeTab = parseInt(tab.dataset.tab, 10);
        render();
      });
    });

    if (activeTab === TAB_A_FECHAR) {
      container.querySelector('#aFecharSearch')?.addEventListener('input', (ev) => {
        aFecharSearch = ev.target.value;
        render();
      });
      container.querySelector('#aFecharCliente')?.addEventListener('change', (ev) => {
        aFecharClienteId = ev.target.value;
        render();
      });
    }

    if (activeTab === TAB_FECHAMENTOS) {
      container.querySelector('#fechamentosSearch')?.addEventListener('input', (ev) => {
        fechamentosSearch = ev.target.value;
        render();
      });
      container.querySelector('#fechamentosStatus')?.addEventListener('change', (ev) => {
        fechamentosStatus = ev.target.value;
        render();
      });

      container.querySelectorAll('tr[data-href]').forEach(row => {
        row.addEventListener('click', () => {
          window.location.hash = row.dataset.href.replace('#', '');
        });
      });
    }
  }

  render();
}
