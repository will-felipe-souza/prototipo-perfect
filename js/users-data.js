const USERS_STORAGE_KEY = 'perfect_mkt_users';

const AGENCY_ROLES = ['admin', 'financeiro', 'atendimento', 'produtor'];

const AGENCY_ROLE_LABELS = {
  admin: 'Admin',
  financeiro: 'Financeiro',
  atendimento: 'Atendimento',
  produtor: 'Produtor'
};

const USER_TIPO_LABELS = {
  agencia: 'Agência',
  cliente: 'Cliente'
};

function loadUsersFromStorage() {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveUsersToStorage(users) {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

function getAllUsers() {
  const stored = loadUsersFromStorage();
  const mockIds = new Set(MOCK_USERS.map(u => u.id));
  const uniqueStored = stored.filter(u => !mockIds.has(u.id));
  return [...MOCK_USERS, ...uniqueStored].sort((a, b) => a.nome.localeCompare(b.nome));
}

function getUserById(id) {
  if (!id) return null;
  return getAllUsers().find(u => u.id === id) || null;
}

function getUserTipo(user) {
  if (!user) return null;
  return user.clienteId ? 'cliente' : 'agencia';
}

function getAgencyUsers() {
  return getAllUsers().filter(u => !u.clienteId && u.ativo !== false);
}

function getUsersByClienteId(clienteId) {
  if (!clienteId) return [];
  return getAllUsers().filter(u => u.clienteId === clienteId && u.ativo !== false);
}

function getUsersByRole(role) {
  return getAllUsers().filter(u => u.role === role && u.ativo !== false);
}

function saveUser(user) {
  const stored = loadUsersFromStorage();
  const index = stored.findIndex(u => u.id === user.id);

  if (index >= 0) {
    stored[index] = user;
  } else {
    stored.push(user);
  }

  saveUsersToStorage(stored);
  return user;
}

function isStoredUser(id) {
  return loadUsersFromStorage().some(u => u.id === id);
}

function getUserName(userId) {
  const user = getUserById(userId);
  return user ? user.nome : '—';
}

function getSolicitanteNome(event) {
  if (!event) return '—';
  if (event.solicitanteUserId) {
    return getUserName(event.solicitanteUserId);
  }
  return event.solicitante || '—';
}

function getAtendimentoNome(event) {
  if (!event) return '—';
  if (event.atendimentoUserId) {
    return getUserName(event.atendimentoUserId);
  }
  return event.atendimento || '—';
}

function isEmailTaken(email, excludeId) {
  const normalized = (email || '').trim().toLowerCase();
  if (!normalized) return false;
  return getAllUsers().some(u =>
    u.id !== excludeId && (u.email || '').trim().toLowerCase() === normalized
  );
}

function validateUser(user, excludeId) {
  const errors = [];
  const nome = (user.nome || '').trim();
  const email = (user.email || '').trim();
  const tipo = user.clienteId ? 'cliente' : 'agencia';

  if (!nome) errors.push('Nome é obrigatório.');
  if (!email) errors.push('E-mail é obrigatório.');
  if (email && isEmailTaken(email, excludeId)) errors.push('Este e-mail já está em uso.');

  if (tipo === 'cliente') {
    if (!user.clienteId) errors.push('Cliente é obrigatório para usuários do tipo Cliente.');
    if (user.role) errors.push('Usuários do tipo Cliente não possuem role.');
  } else {
    if (user.clienteId) errors.push('Usuários da agência não podem ter cliente vinculado.');
    if (!user.role || !AGENCY_ROLES.includes(user.role)) {
      errors.push('Selecione uma role válida para usuários da agência.');
    }
  }

  return errors;
}

function formatUserTipo(user) {
  const tipo = getUserTipo(user);
  return tipo ? USER_TIPO_LABELS[tipo] : '—';
}

function formatUserRole(user) {
  if (!user || !user.role) return '—';
  return AGENCY_ROLE_LABELS[user.role] || user.role;
}
