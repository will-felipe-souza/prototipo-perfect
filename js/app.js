const ROUTES = {
  '/': { title: 'Dashboard', render: renderHome },
  '/eventos': { title: 'Eventos', render: renderEventList, action: { label: 'Novo evento', href: '#/eventos/novo' } },
  '/eventos/novo': { title: 'Novo Evento', render: (c) => renderEventForm(c) },
  '/clientes': { title: 'Clientes', render: renderClientList, action: { label: 'Novo cliente', href: '#/clientes/novo' } },
  '/clientes/novo': { title: 'Novo Cliente', render: (c) => renderClientForm(c) },
  '/usuarios': { title: 'Usuários', render: renderUserList, action: { label: 'Novo usuário', href: '#/usuarios/novo' } },
  '/usuarios/novo': { title: 'Novo Usuário', render: (c, params) => renderUserForm(c, null, params) },
  '/fechamentos': { title: 'Fechamento', render: renderFechamentoList, action: { label: 'Novo fechamento', href: '#/fechamentos/novo' } },
  '/fechamentos/novo': { title: 'Novo Fechamento', render: (c) => renderFechamentoForm(c) }
};

function parseRoute() {
  const hash = window.location.hash.slice(1) || '/';
  const [pathPart, queryPart] = hash.split('?');
  const parts = pathPart.split('/').filter(Boolean);
  const query = {};

  if (queryPart) {
    queryPart.split('&').forEach(pair => {
      const [key, value] = pair.split('=');
      if (key) query[decodeURIComponent(key)] = decodeURIComponent(value || '');
    });
  }

  if (parts.length === 0) return { path: '/', params: {}, query };

  if (parts[0] === 'eventos') {
    if (parts.length === 1) return { path: '/eventos', params: {}, query };
    if (parts[1] === 'novo') return { path: '/eventos/novo', params: {}, query };
    if (parts[2] === 'editar') return { path: '/eventos/editar', params: { id: parts[1] }, query };
    if (parts.length === 2) return { path: '/eventos/detail', params: { id: parts[1] }, query };
  }

  if (parts[0] === 'clientes') {
    if (parts.length === 1) return { path: '/clientes', params: {}, query };
    if (parts[1] === 'novo') return { path: '/clientes/novo', params: {}, query };
    if (parts[2] === 'editar') return { path: '/clientes/editar', params: { id: parts[1] }, query };
    if (parts.length === 2) return { path: '/clientes/detail', params: { id: parts[1] }, query };
  }

  if (parts[0] === 'usuarios') {
    if (parts.length === 1) return { path: '/usuarios', params: {}, query };
    if (parts[1] === 'novo') return { path: '/usuarios/novo', params: {}, query };
    if (parts[2] === 'editar') return { path: '/usuarios/editar', params: { id: parts[1] }, query };
    if (parts.length === 2) return { path: '/usuarios/detail', params: { id: parts[1] }, query };
  }

  if (parts[0] === 'fechamentos') {
    if (parts.length === 1) return { path: '/fechamentos', params: {}, query };
    if (parts[1] === 'novo') return { path: '/fechamentos/novo', params: {}, query };
    if (parts.length === 2) return { path: '/fechamentos/detail', params: { id: parts[1] }, query };
  }

  return { path: '/', params: {}, query };
}

function updateSidebarActive(path) {
  document.querySelectorAll('.nav-item[data-route]').forEach(item => {
    const route = item.dataset.route;
    let active = false;

    if (route === '/') active = path === '/';
    else if (route === '/eventos') active = path.startsWith('/eventos');
    else if (route === '/clientes') active = path.startsWith('/clientes');
    else if (route === '/usuarios') active = path.startsWith('/usuarios');
    else if (route === '/fechamentos') active = path.startsWith('/fechamentos');

    item.classList.toggle('nav-item--active', active);
  });
}

function updateHeader(route) {
  const titleEl = document.getElementById('pageTitle');
  const actionsEl = document.getElementById('headerActions');

  if (route.path === '/eventos/detail') {
    const event = getEventById(route.params.id);
    titleEl.textContent = event ? event.eventoId : 'Evento';
    actionsEl.innerHTML = `<a href="#/eventos/novo" class="btn btn--primary">Novo evento</a>`;
    return;
  }

  if (route.path === '/eventos/editar') {
    titleEl.textContent = 'Editar Evento';
    actionsEl.innerHTML = '';
    return;
  }

  if (route.path === '/clientes/detail') {
    const client = getClientById(route.params.id);
    titleEl.textContent = client ? client.nome : 'Cliente';
    actionsEl.innerHTML = `<a href="#/clientes/novo" class="btn btn--primary">Novo cliente</a>`;
    return;
  }

  if (route.path === '/clientes/editar') {
    titleEl.textContent = 'Editar Cliente';
    actionsEl.innerHTML = '';
    return;
  }

  if (route.path === '/usuarios/detail') {
    const user = getUserById(route.params.id);
    titleEl.textContent = user ? user.nome : 'Usuário';
    actionsEl.innerHTML = `<a href="#/usuarios/novo" class="btn btn--primary">Novo usuário</a>`;
    return;
  }

  if (route.path === '/usuarios/editar') {
    titleEl.textContent = 'Editar Usuário';
    actionsEl.innerHTML = '';
    return;
  }

  if (route.path === '/fechamentos/detail') {
    const fechamento = getFechamentoById(route.params.id);
    titleEl.textContent = fechamento ? fechamento.fechamentoId : 'Fechamento';
    actionsEl.innerHTML = `<a href="#/fechamentos/novo" class="btn btn--primary">Novo fechamento</a>`;
    return;
  }

  const config = ROUTES[route.path] || ROUTES['/'];
  titleEl.textContent = config.title;

  if (config.action) {
    actionsEl.innerHTML = `<a href="${config.action.href}" class="btn btn--primary">${config.action.label}</a>`;
  } else if (route.path === '/') {
    actionsEl.innerHTML = `<a href="#/eventos/novo" class="btn btn--primary">Novo evento</a>`;
  } else {
    actionsEl.innerHTML = '';
  }
}

function render() {
  const route = parseRoute();
  const container = document.getElementById('appContent');

  updateSidebarActive(route.path);
  updateHeader(route);

  if (route.path === '/eventos/detail') {
    renderEventDetail(container, route.params.id);
    return;
  }

  if (route.path === '/eventos/editar') {
    const event = getEventById(route.params.id);
    if (event && isStoredEvent(event.id)) {
      renderEventForm(container, event);
    } else {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__title">Edição não disponível</div>
          <div class="empty-state__text">Apenas eventos criados por você podem ser editados.</div>
          <a href="#/eventos/${route.params.id}" class="btn btn--secondary">Ver evento</a>
        </div>
      `;
    }
    return;
  }

  if (route.path === '/clientes/detail') {
    renderClientDetail(container, route.params.id);
    return;
  }

  if (route.path === '/clientes/editar') {
    const client = getClientById(route.params.id);
    if (client && isStoredClient(client.id)) {
      renderClientForm(container, client);
    } else {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__title">Edição não disponível</div>
          <div class="empty-state__text">Apenas clientes criados por você podem ser editados.</div>
          <a href="#/clientes/${route.params.id}" class="btn btn--secondary">Ver cliente</a>
        </div>
      `;
    }
    return;
  }

  if (route.path === '/usuarios/detail') {
    renderUserDetail(container, route.params.id);
    return;
  }

  if (route.path === '/usuarios/editar') {
    const user = getUserById(route.params.id);
    if (user && isStoredUser(user.id)) {
      renderUserForm(container, user);
    } else {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__title">Edição não disponível</div>
          <div class="empty-state__text">Apenas usuários criados por você podem ser editados.</div>
          <a href="#/usuarios/${route.params.id}" class="btn btn--secondary">Ver usuário</a>
        </div>
      `;
    }
    return;
  }

  if (route.path === '/fechamentos/detail') {
    renderFechamentoDetail(container, route.params.id);
    return;
  }

  const config = ROUTES[route.path] || ROUTES['/'];
  if (config.render.length > 1) {
    config.render(container, route.params, route.query);
  } else {
    config.render(container);
  }
}

function initSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const toggle = document.getElementById('menuToggle');

  function closeSidebar() {
    sidebar.classList.remove('sidebar--open');
    overlay.classList.remove('sidebar-overlay--visible');
  }

  toggle.addEventListener('click', () => {
    sidebar.classList.toggle('sidebar--open');
    overlay.classList.toggle('sidebar-overlay--visible');
  });

  overlay.addEventListener('click', closeSidebar);

  document.querySelectorAll('.nav-item[data-route]').forEach(item => {
    item.addEventListener('click', () => {
      if (window.innerWidth <= 768) closeSidebar();
    });
  });
}

function init() {
  initSidebar();
  window.addEventListener('hashchange', render);

  if (!window.location.hash) {
    window.location.hash = '/';
  } else {
    render();
  }
}

document.addEventListener('DOMContentLoaded', init);
