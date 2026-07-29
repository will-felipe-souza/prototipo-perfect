function renderUserDetail(container, userId) {
  const user = getUserById(userId);

  if (!user) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__title">Usuário não encontrado</div>
        <a href="#/usuarios" class="btn btn--secondary">Voltar</a>
      </div>
    `;
    return;
  }

  const canEdit = isStoredUser(user.id);
  const tipo = getUserTipo(user);
  const eventsAsSolicitante = getAllEvents().filter(e => e.solicitanteUserId === user.id);
  const eventsAsAtendimento = getAllEvents().filter(e => e.atendimentoUserId === user.id);

  container.innerHTML = `
    <div class="detail-header">
      <div class="detail-header__info">
        <span class="detail-header__protocolo">${escapeHtml(user.nome)}</span>
        <span class="badge badge--aberto">${formatUserTipo(user)}</span>
        ${user.ativo !== false
          ? '<span class="badge badge--concluido">Ativo</span>'
          : '<span class="badge badge--cancelado">Inativo</span>'}
      </div>
      <div style="display:flex;gap:8px;">
        ${canEdit ? `<a href="#/usuarios/${user.id}/editar" class="btn btn--primary">Editar</a>` : ''}
        <a href="#/usuarios" class="btn btn--secondary">Voltar</a>
      </div>
    </div>

    <div class="detail-grid">
      <div class="card">
        <div class="card__header">Dados gerais</div>
        <div class="card__body" style="display:flex;flex-direction:column;gap:16px;">
          <div class="detail-item"><span class="detail-item__label">Nome</span><span class="detail-item__value">${escapeHtml(user.nome)}</span></div>
          <div class="detail-item"><span class="detail-item__label">E-mail</span><span class="detail-item__value">${escapeHtml(user.email)}</span></div>
          <div class="detail-item"><span class="detail-item__label">Tipo</span><span class="detail-item__value">${formatUserTipo(user)}</span></div>
          ${tipo === 'agencia'
            ? `<div class="detail-item"><span class="detail-item__label">Role</span><span class="detail-item__value">${formatUserRole(user)}</span></div>`
            : `<div class="detail-item"><span class="detail-item__label">Cliente</span><span class="detail-item__value"><a href="#/clientes/${user.clienteId}" class="table__link">${escapeHtml(getClientName(user.clienteId))}</a></span></div>`
          }
        </div>
      </div>

      ${tipo === 'cliente' ? `
        <div class="card">
          <div class="card__header">Eventos como solicitante (${eventsAsSolicitante.length})</div>
          <div class="card__body" style="padding: 0;">
            ${eventsAsSolicitante.length === 0
              ? '<div class="empty-state" style="padding: 24px;"><div class="empty-state__text">Nenhum evento vinculado.</div></div>'
              : renderEventTable(eventsAsSolicitante)}
          </div>
        </div>
      ` : `
        <div class="card">
          <div class="card__header">Eventos como atendimento (${eventsAsAtendimento.length})</div>
          <div class="card__body" style="padding: 0;">
            ${eventsAsAtendimento.length === 0
              ? '<div class="empty-state" style="padding: 24px;"><div class="empty-state__text">Nenhum evento vinculado.</div></div>'
              : renderEventTable(eventsAsAtendimento)}
          </div>
        </div>
      `}
    </div>
  `;

  container.querySelectorAll('tr[data-href]').forEach(row => {
    row.addEventListener('click', () => {
      window.location.hash = row.dataset.href.replace('#', '');
    });
  });
}

function renderEventTable(events) {
  return `
    <div class="table-wrapper">
      <table class="table">
        <thead><tr><th>ID</th><th>Nome Evento</th><th>Data</th><th>Status</th><th>Budget</th></tr></thead>
        <tbody>
          ${events.map(e => {
            const fin = enrichEventFinancials(e);
            return `<tr data-href="#/eventos/${e.id}">
              <td><span class="table__link">${escapeHtml(e.eventoId)}</span></td>
              <td>${escapeHtml(e.nomeEvento)}</td>
              <td>${formatDate(e.data)}</td>
              <td><span class="${getStatusBadgeClass(e.status)}">${formatStatus(e.status)}</span></td>
              <td>${formatCurrency(fin.valorFinal)}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}
