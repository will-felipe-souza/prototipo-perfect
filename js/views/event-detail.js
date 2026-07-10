function renderEventDetail(container, eventId) {
  const raw = getEventById(eventId);

  if (!raw) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__title">Evento não encontrado</div>
        <a href="#/eventos" class="btn btn--secondary">Voltar</a>
      </div>
    `;
    return;
  }

  const event = enrichEventFinancials(raw);
  const canEdit = isStoredEvent(event.id);
  const client = getClientById(event.clienteId);

  function detailItem(label, value) {
    const display = value !== undefined && value !== null && value !== ''
      ? (typeof value === 'boolean' ? (value ? 'Sim' : 'Não') : escapeHtml(String(value)))
      : '<span class="detail-item__value--empty">Não informado</span>';
    return `
      <div class="detail-item">
        <span class="detail-item__label">${label}</span>
        <span class="detail-item__value">${display}</span>
      </div>
    `;
  }

  container.innerHTML = `
    <div class="detail-header">
      <div class="detail-header__info">
        <span class="detail-header__protocolo">${escapeHtml(event.eventoId)}</span>
        <span class="badge badge--aberto">${formatTipoEvento(event.tipoEvento)}</span>
        <span class="${getStatusBadgeClass(event.status)}">${formatStatus(event.status)}</span>
      </div>
      <div style="display:flex;gap:8px;">
        ${canEdit ? `<a href="#/eventos/${event.id}/editar" class="btn btn--primary">Editar</a>` : ''}
        <a href="#/eventos" class="btn btn--secondary">Voltar</a>
      </div>
    </div>

    <div class="detail-grid">
      <div class="card">
        <div class="card__header">Geral</div>
        <div class="card__body" style="display:flex;flex-direction:column;gap:16px;">
          ${detailItem('ID', event.eventoId)}
          ${detailItem('Tipo', formatTipoEvento(event.tipoEvento))}
          ${detailItem('Cliente', client ? client.nome : '—')}
          ${detailItem('Atendimento', event.atendimento)}
          ${detailItem('Solicitante', event.solicitante)}
          ${detailItem('Produto', event.produto)}
          ${detailItem('Data solicitação', formatDate(event.dataSolicitacao))}
          ${detailItem('Nome do evento', event.nomeEvento)}
        </div>
      </div>

      <div class="card">
        <div class="card__header">Evento & Restaurante</div>
        <div class="card__body" style="display:flex;flex-direction:column;gap:16px;">
          ${detailItem('Data', formatDate(event.data))}
          ${detailItem('Horário', event.horario)}
          ${detailItem('Restaurante', event.nomeRestaurante)}
          ${detailItem('Valor por pessoa', formatCurrency(event.valorPorPessoa))}
          ${detailItem('Participantes', event.numeroParticipantes)}
          ${detailItem('Cidade', event.cidade)}
          ${detailItem('Estado', event.estado)}
          ${detailItem('Endereço', event.endereco)}
          ${detailItem('Contato restaurante', `${event.contatoRestauranteNome || ''} — ${event.contatoRestauranteTelefone || ''}`)}
        </div>
      </div>

      <div class="card">
        <div class="card__header">Médico</div>
        <div class="card__body" style="display:flex;flex-direction:column;gap:16px;">
          ${detailItem('Nome', event.medico)}
          ${detailItem('Telefone', event.telefoneMedico)}
          ${detailItem('E-mail', event.emailMedico)}
          ${detailItem('Fee do médico', formatCurrency(event.feeMedico))}
        </div>
      </div>

      <div class="card">
        <div class="card__header">Extras (${(event.extras || []).length})</div>
        <div class="card__body">
          ${(event.extras || []).length === 0
            ? '<span class="detail-item__value--empty">Nenhum extra lançado</span>'
            : `<div class="table-wrapper"><table class="table"><thead><tr><th>Extra</th><th>Descrição</th><th>Quantidade</th><th>Valor unitário</th><th>Total</th></tr></thead><tbody>
                ${event.extras.map(ex => {
                  const qtd = ex.quantidade != null ? ex.quantidade : 1;
                  const unit = ex.valorUnitario != null ? ex.valorUnitario : ex.valor;
                  const total = ex.valor != null ? ex.valor : calculateExtraTotal(ex);
                  return `<tr>
                    <td>${escapeHtml(ex.tipo)}</td>
                    <td>${escapeHtml(ex.descricao)}</td>
                    <td>${escapeHtml(qtd)}</td>
                    <td>${formatCurrency(unit)}</td>
                    <td>${formatCurrency(total)}</td>
                  </tr>`;
                }).join('')}
              </tbody></table></div>`
          }
        </div>
      </div>

      <div class="card" style="grid-column: 1 / -1;">
        <div class="card__header">Resumo financeiro (Budget)</div>
        <div class="card__body">
          <div class="financial-summary">
            <div class="financial-summary__row"><span>Valor evento</span><span>${formatCurrency(event.valorEvento)}</span></div>
            <div class="financial-summary__row"><span>Extras</span><span>${formatCurrency(event.somaExtras)}</span></div>
            <div class="financial-summary__row"><span>Fee médico</span><span>${formatCurrency(event.feeMedico)}</span></div>
            <div class="financial-summary__row"><span>Subtotal</span><span>${formatCurrency(event.subtotal)}</span></div>
            <div class="financial-summary__row"><span>Fee Perfect${client ? ` (${client.feeTipo === 'percentual' ? client.feeValor + '%' : formatCurrency(client.feeValor)})` : ''}</span><span>${formatCurrency(event.feeCliente)}</span></div>
            <div class="financial-summary__row"><span>Impostos (${event.impostosPct}%)</span><span>${formatCurrency(event.impostos)}</span></div>
            <div class="financial-summary__row financial-summary__row--total"><span>Valor Final (Budget)</span><span>${formatCurrency(event.valorFinal)}</span></div>
          </div>
        </div>
      </div>
    </div>
  `;
}
