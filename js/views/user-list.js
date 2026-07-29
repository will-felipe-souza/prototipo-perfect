function renderUserList(container) {
  let searchQuery = '';
  let tipoFilter = '';
  let roleFilter = '';

  function render() {
    let users = getAllUsers();

    if (tipoFilter) {
      users = users.filter(u => getUserTipo(u) === tipoFilter);
    }

    if (roleFilter) {
      users = users.filter(u => u.role === roleFilter);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      users = users.filter(u =>
        (u.nome || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (getClientName(u.clienteId) || '').toLowerCase().includes(q)
      );
    }

    container.innerHTML = `
      <div class="filters">
        <input type="text" class="input input--search" id="searchInput"
          placeholder="Buscar por nome, e-mail ou cliente..."
          value="${escapeHtml(searchQuery)}">
        <select class="select" id="tipoFilter">
          <option value="">Todos os tipos</option>
          <option value="agencia" ${tipoFilter === 'agencia' ? 'selected' : ''}>Agência</option>
          <option value="cliente" ${tipoFilter === 'cliente' ? 'selected' : ''}>Cliente</option>
        </select>
        <select class="select" id="roleFilter">
          <option value="">Todas as roles</option>
          ${AGENCY_ROLES.map(role => `
            <option value="${role}" ${roleFilter === role ? 'selected' : ''}>${AGENCY_ROLE_LABELS[role]}</option>
          `).join('')}
        </select>
      </div>

      <div class="card">
        <div class="card__body" style="padding: 0;">
          ${users.length === 0 ? `
            <div class="empty-state">
              <div class="empty-state__title">Nenhum usuário encontrado</div>
              <div class="empty-state__text">Cadastre o primeiro usuário para começar.</div>
              <a href="#/usuarios/novo" class="btn btn--primary">Novo usuário</a>
            </div>
          ` : `
            <div class="table-wrapper">
              <table class="table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>E-mail</th>
                    <th>Tipo</th>
                    <th>Role / Cliente</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${users.map(u => {
                    const tipo = getUserTipo(u);
                    const roleOrClient = tipo === 'agencia'
                      ? formatUserRole(u)
                      : getClientName(u.clienteId);
                    return `
                      <tr data-href="#/usuarios/${u.id}">
                        <td><span class="table__link">${escapeHtml(u.nome)}</span></td>
                        <td>${escapeHtml(u.email)}</td>
                        <td><span class="badge badge--aberto">${formatUserTipo(u)}</span></td>
                        <td>${escapeHtml(roleOrClient)}</td>
                        <td>${u.ativo !== false ? '<span class="badge badge--concluido">Ativo</span>' : '<span class="badge badge--cancelado">Inativo</span>'}</td>
                      </tr>
                    `;
                  }).join('')}
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

    container.querySelector('#tipoFilter')?.addEventListener('change', (ev) => {
      tipoFilter = ev.target.value;
      render();
    });

    container.querySelector('#roleFilter')?.addEventListener('change', (ev) => {
      roleFilter = ev.target.value;
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
