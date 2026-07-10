const MOCK_CLIENTS = [
  {
    id: 'cli-001',
    nome: 'Momentafarma',
    feeTipo: 'fixo',
    feeValor: 3000,
    impostosPercentual: 15,
    produtos: ['Momenta 10mg', 'Momenta 20mg'],
    solicitantes: ['Harle da Costa', 'Carlos Tadeu'],
    camposObrigatorios: ['medico', 'nomeRestaurante', 'feeMedico']
  },
  {
    id: 'cli-002',
    nome: 'Pharma Brasil',
    feeTipo: 'percentual',
    feeValor: 12,
    impostosPercentual: 18,
    produtos: ['PharmaX', 'PharmaY'],
    solicitantes: ['Fernanda Lima', 'Roberto Mendes'],
    camposObrigatorios: ['medico', 'nomeEvento']
  },
  {
    id: 'cli-003',
    nome: 'Labfarma',
    feeTipo: 'fixo',
    feeValor: 2800,
    impostosPercentual: 15,
    produtos: ['LabMed 5mg'],
    solicitantes: ['Patricia Souza'],
    camposObrigatorios: ['nomeRestaurante']
  },
  {
    id: 'cli-004',
    nome: 'Biotech',
    feeTipo: 'fixo',
    feeValor: 3500,
    impostosPercentual: 17,
    produtos: ['BioCell', 'BioVita'],
    solicitantes: ['Lucas Ferreira', 'Marcos Vieira'],
    camposObrigatorios: ['medico', 'nomeRestaurante', 'nomeEvento']
  },
  {
    id: 'cli-005',
    nome: 'Farma SC',
    feeTipo: 'fixo',
    feeValor: 2000,
    impostosPercentual: 12,
    produtos: ['FarmaSC Plus'],
    solicitantes: ['Mariana Costa'],
    camposObrigatorios: []
  }
];
