function renderHome(container) {
  const stats = getEventStats();
  const recent = getAllEvents().map(enrichEventFinancials).slice(0, 5);

  function statCard(label, value, currency) {
    return `
      <div class="stat-card">
        <div class="stat-card__label">${label}</div>
        <div class="stat-card__value ${currency ? 'stat-card__value--currency' : ''}">${value}</div>
      </div>
    `;
  }

  container.innerHTML = `
    <div class="stats-grid">
      ${statCard('Total de eventos', stats.total)}
      ${statCard('Em andamento', stats.emAndamento)}
      ${statCard('Aguardando aprovação', stats.aguardando)}
      ${statCard('Concluídos', stats.concluidos)}
      ${statCard('Budget total', formatCurrency(stats.budgetTotal), true)}
    </div>

    <div class="card">
      <div class="card__header">Últimos eventos</div>
      <div class="card__body" style="padding: 0;">
        ${recent.length === 0 ? `
          <div class="empty-state">
            <div class="empty-state__title">Nenhum evento</div>
            <a href="#/eventos/novo" class="btn btn--primary">Criar evento</a>
          </div>
        ` : `
          <div class="table-wrapper">
            <table class="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Atendimento</th>
                  <th>Nome Evento - Cidade</th>
                  <th>Status</th>
                  <th>Budget</th>
                </tr>
              </thead>
              <tbody>
                ${recent.map(e => `
                  <tr data-href="#/eventos/${e.id}">
                    <td><span class="table__link">${escapeHtml(e.eventoId)}</span></td>
                    <td>${escapeHtml(e.atendimento)}</td>
                    <td>${escapeHtml(formatNomeEventoCidade(e))}</td>
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

  container.querySelectorAll('tr[data-href]').forEach(row => {
    row.addEventListener('click', () => {
      window.location.hash = row.dataset.href.replace('#', '');
    });
  });
}
