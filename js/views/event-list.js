function renderEventList(container) {
  let searchQuery = '';
  let statusFilter = '';

  function render() {
    let events = getAllEvents().map(enrichEventFinancials);

    if (statusFilter) {
      events = events.filter(e => e.status === statusFilter);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      events = events.filter(e =>
        (e.eventoId || '').toLowerCase().includes(q) ||
        (getClientName(e.clienteId) || '').toLowerCase().includes(q) ||
        (e.solicitante || '').toLowerCase().includes(q) ||
        (e.nomeEvento || '').toLowerCase().includes(q) ||
        (e.cidade || '').toLowerCase().includes(q) ||
        (e.estado || '').toLowerCase().includes(q) ||
        (e.atendimento || '').toLowerCase().includes(q)
      );
    }

    container.innerHTML = `
      <div class="filters">
        <input type="text" class="input input--search" id="searchInput"
          placeholder="Buscar por ID, cliente, solicitante, evento, cidade ou estado..."
          value="${escapeHtml(searchQuery)}">
        <select class="select" id="statusFilter">
          <option value="">Todos os status</option>
          ${Object.entries(STATUS_LABELS).map(([val, label]) => `
            <option value="${val}" ${statusFilter === val ? 'selected' : ''}>${label}</option>
          `).join('')}
        </select>
      </div>

      <div class="card">
        <div class="card__body" style="padding: 0;">
          ${events.length === 0 ? `
            <div class="empty-state">
              <div class="empty-state__title">Nenhum evento encontrado</div>
              <div class="empty-state__text">
                ${searchQuery || statusFilter ? 'Tente ajustar os filtros.' : 'Crie um novo evento para começar.'}
              </div>
              ${!searchQuery && !statusFilter ? '<a href="#/eventos/novo" class="btn btn--primary">Criar evento</a>' : ''}
            </div>
          ` : `
            <div class="table-wrapper">
              <table class="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Atendimento</th>
                    <th>Solicitante</th>
                    <th>Data Solicitação</th>
                    <th>Nome Evento - Cidade</th>
                    <th>Data evento</th>
                    <th>Status</th>
                    <th>Budget</th>
                  </tr>
                </thead>
                <tbody>
                  ${events.map(e => `
                    <tr data-href="#/eventos/${e.id}">
                      <td><span class="table__link">${escapeHtml(e.eventoId)}</span></td>
                      <td>${escapeHtml(e.atendimento)}</td>
                      <td>${escapeHtml(e.solicitante)}</td>
                      <td>${formatDate(e.dataSolicitacao)}</td>
                      <td>${escapeHtml(formatNomeEventoCidade(e))}</td>
                      <td>${formatDate(e.data)}</td>
                      <td><span class="${getStatusBadgeClass(e.status)}">${formatStatus(e.status)}</span></td>
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

    container.querySelector('#searchInput')?.addEventListener('input', (ev) => {
      searchQuery = ev.target.value;
      render();
    });

    container.querySelector('#statusFilter')?.addEventListener('change', (ev) => {
      statusFilter = ev.target.value;
      render();
    });

    container.querySelectorAll('tr[data-href]').forEach(row => {
      row.addEventListener('click', () => {
        window.location.hash = row.dataset.href.replace('#', '');
      });
    });
  }

  render();
}
