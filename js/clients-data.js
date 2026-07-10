const CLIENTS_STORAGE_KEY = 'perfect_mkt_clientes';

const FEE_TIPO_LABELS = {
  fixo: 'Valor fixo (R$)',
  percentual: 'Percentual (%)'
};

const CAMPO_OBRIGATORIO_OPTIONS = [
  { value: 'nomeEvento', label: 'Nome do evento' },
  { value: 'nomeRestaurante', label: 'Nome do restaurante' },
  { value: 'medico', label: 'Médico' },
  { value: 'feeMedico', label: 'Fee do médico' },
  { value: 'endereco', label: 'Endereço' }
];

function loadClientsFromStorage() {
  try {
    const raw = localStorage.getItem(CLIENTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveClientsToStorage(clients) {
  localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(clients));
}

function getAllClients() {
  const stored = loadClientsFromStorage();
  const mockIds = new Set(MOCK_CLIENTS.map(c => c.id));
  const uniqueStored = stored.filter(c => !mockIds.has(c.id));
  return [...MOCK_CLIENTS, ...uniqueStored].sort((a, b) => a.nome.localeCompare(b.nome));
}

function getClientById(id) {
  return getAllClients().find(c => c.id === id) || null;
}

function saveClient(client) {
  const stored = loadClientsFromStorage();
  const index = stored.findIndex(c => c.id === client.id);

  if (index >= 0) {
    stored[index] = client;
  } else {
    stored.push(client);
  }

  saveClientsToStorage(stored);
  return client;
}

function isStoredClient(id) {
  return loadClientsFromStorage().some(c => c.id === id);
}

function getClientName(clientId) {
  const client = getClientById(clientId);
  return client ? client.nome : '—';
}

function getRequiredFieldsForClient(clientId) {
  const client = getClientById(clientId);
  return client ? (client.camposObrigatorios || []) : [];
}
