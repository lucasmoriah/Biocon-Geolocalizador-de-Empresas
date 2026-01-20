export interface LocationEntry {
  id: string;
  name: string;
  companyType: string;
  description: string;
  cep: string;
  latitude: number | string;
  longitude: number | string;
  isAutoFilled?: boolean;
  radius: number; // Radius in Kilometers
}

export interface CepResponse {
  cep: string;
  state: string;
  city: string;
  neighborhood: string;
  street: string;
  location?: {
    coordinates?: {
      longitude: string;
      latitude: string;
    }
  }
}