function renderClientForm(container, editClient) {
  const isEdit = !!editClient;
  const client = editClient || {
    nome: '',
    feeTipo: 'fixo',
    feeValor: '',
    impostosPercentual: 15,
    produtos: [],
    solicitantes: [],
    camposObrigatorios: []
  };

  let produtos = [...(client.produtos || [])];
  let solicitantes = [...(client.solicitantes || [])];

  function render() {
    container.innerHTML = `
      <div class="card">
        <div class="card__body">
          <form id="clientForm">
            <div class="section-title">Dados gerais</div>
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label form-label--required">Nome</label>
                <input type="text" class="input" name="nome" value="${escapeHtml(client.nome)}" required>
              </div>
              <div class="form-group">
                <label class="form-label form-label--required">Tipo de fee</label>
                <select class="select" name="feeTipo" id="feeTipo">
                  ${Object.entries(FEE_TIPO_LABELS).map(([val, label]) => `
                    <option value="${val}" ${client.feeTipo === val ? 'selected' : ''}>${label}</option>
                  `).join('')}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label form-label--required" id="feeValorLabel">${client.feeTipo === 'percentual' ? 'Fee (%)' : 'Fee (R$)'}</label>
                <input type="number" class="input" name="feeValor" value="${client.feeValor}" min="0" step="0.01" required>
              </div>
              <div class="form-group">
                <label class="form-label form-label--required">Impostos (%)</label>
                <input type="number" class="input" name="impostosPercentual" value="${client.impostosPercentual}" min="0" max="100" step="0.01" required>
              </div>
            </div>

            <div class="section-title" style="margin-top: 24px;">Solicitantes</div>
            <p class="form-hint" style="margin-bottom: 12px;">Pessoas que solicitam eventos para este cliente.</p>
            <div id="solicitantesList">
              ${solicitantes.map((s, i) => `
                <div class="extra-row" data-index="${i}">
                  <input type="text" class="input" name="solicitante_${i}" value="${escapeHtml(s)}" placeholder="Nome do solicitante">
                  <button type="button" class="btn btn--ghost btn--sm remove-solicitante" data-index="${i}">Remover</button>
                </div>
              `).join('')}
            </div>
            <button type="button" class="btn btn--secondary" id="addSolicitante" style="margin-top: 8px;">+ Adicionar solicitante</button>

            <div class="section-title" style="margin-top: 24px;">Produtos</div>
            <div id="produtosList">
              ${produtos.map((p, i) => `
                <div class="extra-row" data-index="${i}">
                  <input type="text" class="input" name="produto_${i}" value="${escapeHtml(p)}" placeholder="Nome do produto">
                  <button type="button" class="btn btn--ghost btn--sm remove-produto" data-index="${i}">Remover</button>
                </div>
              `).join('')}
            </div>
            <button type="button" class="btn btn--secondary" id="addProduto" style="margin-top: 8px;">+ Adicionar produto</button>

            <div class="section-title" style="margin-top: 24px;">Campos obrigatórios nos eventos</div>
            <div class="checkbox-grid">
              ${CAMPO_OBRIGATORIO_OPTIONS.map(opt => `
                <label class="checkbox-group">
                  <input type="checkbox" name="camposObrigatorios" value="${opt.value}"
                    ${(client.camposObrigatorios || []).includes(opt.value) ? 'checked' : ''}>
                  ${opt.label}
                </label>
              `).join('')}
            </div>

            <div class="form-actions">
              <button type="submit" class="btn btn--primary">${isEdit ? 'Salvar alterações' : 'Criar cliente'}</button>
              <a href="#/clientes" class="btn btn--ghost">Cancelar</a>
            </div>
          </form>
        </div>
      </div>
    `;

    bindEvents();
  }

  function bindEvents() {
    container.querySelector('#feeTipo')?.addEventListener('change', (e) => {
      const label = container.querySelector('#feeValorLabel');
      label.textContent = e.target.value === 'percentual' ? 'Fee (%)' : 'Fee (R$)';
    });

    container.querySelector('#addSolicitante')?.addEventListener('click', () => {
      syncSolicitantes();
      solicitantes.push('');
      render();
    });

    container.querySelectorAll('.remove-solicitante').forEach(btn => {
      btn.addEventListener('click', () => {
        syncSolicitantes();
        solicitantes.splice(parseInt(btn.dataset.index, 10), 1);
        render();
      });
    });

    container.querySelector('#addProduto')?.addEventListener('click', () => {
      syncProdutos();
      produtos.push('');
      render();
    });

    container.querySelectorAll('.remove-produto').forEach(btn => {
      btn.addEventListener('click', () => {
        syncProdutos();
        produtos.splice(parseInt(btn.dataset.index, 10), 1);
        render();
      });
    });

    container.querySelector('#clientForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      handleSubmit();
    });
  }

  function syncSolicitantes() {
    solicitantes = solicitantes.map((_, i) => {
      const input = container.querySelector(`[name="solicitante_${i}"]`);
      return input ? input.value.trim() : '';
    }).filter(Boolean);
  }

  function syncProdutos() {
    produtos = produtos.map((_, i) => {
      const input = container.querySelector(`[name="produto_${i}"]`);
      return input ? input.value.trim() : '';
    }).filter(Boolean);
  }

  function handleSubmit() {
    syncSolicitantes();
    syncProdutos();
    const form = container.querySelector('#clientForm');
    const data = new FormData(form);
    const camposObrigatorios = [...form.querySelectorAll('[name="camposObrigatorios"]:checked')].map(cb => cb.value);

    const newClient = {
      id: isEdit ? editClient.id : `cli-${Date.now()}`,
      nome: data.get('nome'),
      feeTipo: data.get('feeTipo'),
      feeValor: parseFloat(data.get('feeValor')) || 0,
      impostosPercentual: parseFloat(data.get('impostosPercentual')) || 0,
      produtos,
      solicitantes,
      camposObrigatorios
    };

    saveClient(newClient);
    showToast(isEdit ? 'Cliente atualizado!' : 'Cliente criado!');
    window.location.hash = `/clientes/${newClient.id}`;
  }

  render();
}
