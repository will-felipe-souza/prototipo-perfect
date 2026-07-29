function renderUserForm(container, editUser, options = {}) {
  const isEdit = !!editUser;
  const clients = getAllClients();
  const presetClienteId = options.presetClienteId || options.clienteId || '';

  const user = editUser || {
    nome: '',
    email: '',
    ativo: true,
    clienteId: presetClienteId || null,
    role: presetClienteId ? null : 'atendimento'
  };

  let tipo = user.clienteId ? 'cliente' : 'agencia';

  function render() {
    container.innerHTML = `
      <div class="card">
        <div class="card__body">
          <form id="userForm">
            <div class="section-title">Dados gerais</div>
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label form-label--required">Nome</label>
                <input type="text" class="input" name="nome" value="${escapeHtml(user.nome)}" required>
              </div>
              <div class="form-group">
                <label class="form-label form-label--required">E-mail</label>
                <input type="email" class="input" name="email" value="${escapeHtml(user.email)}" required>
              </div>
              <div class="form-group">
                <label class="form-label">Status</label>
                <select class="select" name="ativo">
                  <option value="true" ${user.ativo !== false ? 'selected' : ''}>Ativo</option>
                  <option value="false" ${user.ativo === false ? 'selected' : ''}>Inativo</option>
                </select>
              </div>
            </div>

            <div class="section-title" style="margin-top: 24px;">Tipo e vínculo</div>
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label form-label--required">Tipo</label>
                <select class="select" name="tipo" id="tipoSelect">
                  <option value="agencia" ${tipo === 'agencia' ? 'selected' : ''}>Agência</option>
                  <option value="cliente" ${tipo === 'cliente' ? 'selected' : ''}>Cliente</option>
                </select>
              </div>
              <div class="form-group" id="roleField" style="${tipo === 'agencia' ? '' : 'display:none;'}">
                <label class="form-label form-label--required">Role</label>
                <select class="select" name="role" id="roleSelect">
                  ${AGENCY_ROLES.map(role => `
                    <option value="${role}" ${user.role === role ? 'selected' : ''}>${AGENCY_ROLE_LABELS[role]}</option>
                  `).join('')}
                </select>
              </div>
              <div class="form-group" id="clienteField" style="${tipo === 'cliente' ? '' : 'display:none;'}">
                <label class="form-label form-label--required">Cliente</label>
                <select class="select" name="clienteId" id="clienteSelect">
                  <option value="">Selecione...</option>
                  ${clients.map(c => `
                    <option value="${c.id}" ${user.clienteId === c.id ? 'selected' : ''}>${escapeHtml(c.nome)}</option>
                  `).join('')}
                </select>
              </div>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn btn--primary">${isEdit ? 'Salvar alterações' : 'Criar usuário'}</button>
              <a href="${isEdit ? `#/usuarios/${editUser.id}` : '#/usuarios'}" class="btn btn--ghost">Cancelar</a>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  function bindEvents() {
    container.querySelector('#tipoSelect')?.addEventListener('change', (e) => {
      tipo = e.target.value;
      const roleField = container.querySelector('#roleField');
      const clienteField = container.querySelector('#clienteField');
      if (roleField) roleField.style.display = tipo === 'agencia' ? '' : 'none';
      if (clienteField) clienteField.style.display = tipo === 'cliente' ? '' : 'none';
    });

    container.querySelector('#userForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      handleSubmit();
    });
  }

  function handleSubmit() {
    const form = container.querySelector('#userForm');
    const data = new FormData(form);
    const selectedTipo = data.get('tipo');

    const newUser = {
      id: isEdit ? editUser.id : `usr-${Date.now()}`,
      nome: (data.get('nome') || '').trim(),
      email: (data.get('email') || '').trim(),
      ativo: data.get('ativo') === 'true',
      clienteId: selectedTipo === 'cliente' ? (data.get('clienteId') || null) : null,
      role: selectedTipo === 'agencia' ? data.get('role') : null
    };

    const errors = validateUser(newUser, isEdit ? editUser.id : null);
    if (errors.length) {
      showToast(errors[0]);
      return;
    }

    saveUser(newUser);
    showToast(isEdit ? 'Usuário atualizado!' : 'Usuário criado!');
    window.location.hash = `/usuarios/${newUser.id}`;
  }

  render();
  bindEvents();
}
