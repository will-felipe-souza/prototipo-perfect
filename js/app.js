const ROUTES = {
  '/': { title: 'Dashboard', render: renderHome },
  '/eventos': { title: 'Eventos', render: renderEventList, action: { label: 'Novo evento', href: '#/eventos/novo' } },
  '/eventos/novo': { title: 'Novo Evento', render: (c) => renderEventForm(c) },
  '/clientes': { title: 'Clientes', render: renderClientList, action: { label: 'Novo cliente', href: '#/clientes/novo' } },
  '/clientes/novo': { title: 'Novo Cliente', render: (c) => renderClientForm(c) }
};

function parseRoute() {
  const hash = window.location.hash.slice(1) || '/';
  const parts = hash.split('/').filter(Boolean);

  if (parts.length === 0) return { path: '/', params: {} };

  if (parts[0] === 'eventos') {
    if (parts.length === 1) return { path: '/eventos', params: {} };
    if (parts[1] === 'novo') return { path: '/eventos/novo', params: {} };
    if (parts[2] === 'editar') return { path: '/eventos/editar', params: { id: parts[1] } };
    if (parts.length === 2) return { path: '/eventos/detail', params: { id: parts[1] } };
  }

  if (parts[0] === 'clientes') {
    if (parts.length === 1) return { path: '/clientes', params: {} };
    if (parts[1] === 'novo') return { path: '/clientes/novo', params: {} };
    if (parts[2] === 'editar') return { path: '/clientes/editar', params: { id: parts[1] } };
    if (parts.length === 2) return { path: '/clientes/detail', params: { id: parts[1] } };
  }

  return { path: '/', params: {} };
}

function updateSidebarActive(path) {
  document.querySelectorAll('.nav-item[data-route]').forEach(item => {
    const route = item.dataset.route;
    let active = false;

    if (route === '/') active = path === '/';
    else if (route === '/eventos') active = path.startsWith('/eventos');
    else if (route === '/clientes') active = path.startsWith('/clientes');

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

  const config = ROUTES[route.path] || ROUTES['/'];
  config.render(container);
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
