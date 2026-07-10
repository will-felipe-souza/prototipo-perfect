function renderClientDetail(container, clientId) {
  const client = getClientById(clientId);

  if (!client) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__title">Cliente não encontrado</div>
        <a href="#/clientes" class="btn btn--secondary">Voltar</a>
      </div>
    `;
    return;
  }

  const canEdit = isStoredClient(client.id);
  const events = getAllEvents().filter(e => e.clienteId === client.id);

  container.innerHTML = `
    <div class="detail-header">
      <div class="detail-header__info">
        <span class="detail-header__protocolo">${escapeHtml(client.nome)}</span>
      </div>
      <div style="display:flex;gap:8px;">
        ${canEdit ? `<a href="#/clientes/${client.id}/editar" class="btn btn--primary">Editar</a>` : ''}
        <a href="#/clientes" class="btn btn--secondary">Voltar</a>
      </div>
    </div>

    <div class="detail-grid">
      <div class="card">
        <div class="card__header">Dados gerais</div>
        <div class="card__body" style="display:flex;flex-direction:column;gap:16px;">
          <div class="detail-item"><span class="detail-item__label">Nome</span><span class="detail-item__value">${escapeHtml(client.nome)}</span></div>
          <div class="detail-item"><span class="detail-item__label">Fee</span><span class="detail-item__value">${client.feeTipo === 'percentual' ? `${client.feeValor}%` : formatCurrency(client.feeValor)}</span></div>
          <div class="detail-item"><span class="detail-item__label">Impostos</span><span class="detail-item__value">${client.impostosPercentual}%</span></div>
        </div>
      </div>

      <div class="card">
        <div class="card__header">Solicitantes (${(client.solicitantes || []).length})</div>
        <div class="card__body">
          ${(client.solicitantes || []).length === 0
            ? '<span class="detail-item__value--empty">Nenhum solicitante cadastrado</span>'
            : `<ul class="product-list">${client.solicitantes.map(s => `<li>${escapeHtml(s)}</li>`).join('')}</ul>`
          }
        </div>
      </div>

      <div class="card">
        <div class="card__header">Produtos (${(client.produtos || []).length})</div>
        <div class="card__body">
          ${(client.produtos || []).length === 0
            ? '<span class="detail-item__value--empty">Nenhum produto cadastrado</span>'
            : `<ul class="product-list">${client.produtos.map(p => `<li>${escapeHtml(p)}</li>`).join('')}</ul>`
          }
        </div>
      </div>

      <div class="card">
        <div class="card__header">Campos obrigatórios nos eventos</div>
        <div class="card__body">
          ${(client.camposObrigatorios || []).length === 0
            ? '<span class="detail-item__value--empty">Nenhuma regra extra</span>'
            : client.camposObrigatorios.map(f => `<span class="badge badge--aberto" style="margin: 2px;">${getFieldLabel(f)}</span>`).join(' ')
          }
        </div>
      </div>

      <div class="card" style="grid-column: 1 / -1;">
        <div class="card__header">Eventos deste cliente (${events.length})</div>
        <div class="card__body" style="padding: 0;">
          ${events.length === 0 ? '<div class="empty-state" style="padding: 24px;"><div class="empty-state__text">Nenhum evento vinculado.</div></div>' : `
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
          `}
        </div>
      </div>
    </div>
  `;

  container.querySelectorAll('tr[data-href]').forEach(row => {
    row.addEventListener('click', () => {
      window.location.hash = row.dataset.href.replace('#', '');
    });
  });
}
