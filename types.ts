export type EntityType = 'aterros' | 'clientes' | 'tecnicos';

// Lista de Estados do Brasil
export const ESTADOS_BRASIL = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

// Interface usada para renderizar no Mapa
export interface LocationEntry {
  id: string;
  name: string;
  description?: string;
  cep: string;
  estado?: string;
  latitude: number | string;
  longitude: number | string;
  radius: number;
  companyType?: string;
  entityType: EntityType;
  isAutoFilled?: boolean;
}

// Interface principal do Banco de Dados / Tabela
export interface UnifiedEntry {
    id: string;
    type: EntityType;
    nome: string; 
    detalhe: string; 
    contato: string; 
    cep: string;
    estado: string;
    latitude: number | string;
    longitude: number | string;
    radius: number;
}

export interface CepResponse {
  cep: string;
  state: string;
  city: string;
  neighborhood: string;
  street: string;
  service: string;
  location?: {
    type: string;
    coordinates: {
      longitude: string;
      latitude: string;
    };
  };
}
