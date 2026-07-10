function renderClientList(container) {
  let searchQuery = '';

  function render() {
    let clients = getAllClients();

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      clients = clients.filter(c =>
        (c.nome || '').toLowerCase().includes(q)
      );
    }

    container.innerHTML = `
      <div class="filters">
        <input type="text" class="input input--search" id="searchInput"
          placeholder="Buscar por nome..."
          value="${escapeHtml(searchQuery)}">
      </div>

      <div class="card">
        <div class="card__body" style="padding: 0;">
          ${clients.length === 0 ? `
            <div class="empty-state">
              <div class="empty-state__title">Nenhum cliente encontrado</div>
              <div class="empty-state__text">Cadastre o primeiro cliente para começar.</div>
              <a href="#/clientes/novo" class="btn btn--primary">Novo cliente</a>
            </div>
          ` : `
            <div class="table-wrapper">
              <table class="table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Fee</th>
                    <th>Impostos</th>
                    <th>Produtos</th>
                  </tr>
                </thead>
                <tbody>
                  ${clients.map(c => `
                    <tr data-href="#/clientes/${c.id}">
                      <td><span class="table__link">${escapeHtml(c.nome)}</span></td>
                      <td>${c.feeTipo === 'percentual' ? `${c.feeValor}%` : formatCurrency(c.feeValor)}</td>
                      <td>${c.impostosPercentual}%</td>
                      <td>${(c.produtos || []).length} produto(s)</td>
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

    container.querySelectorAll('tr[data-href]').forEach(row => {
      row.addEventListener('click', () => {
        window.location.hash = row.dataset.href.replace('#', '');
      });
    });
  }

  render();
}
