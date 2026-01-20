import { CepResponse } from '../types';

export const fetchCepData = async (cep: string): Promise<CepResponse | null> => {
  const cleanCep = cep.replace(/\D/g, '');
  
  if (cleanCep.length !== 8) {
    return null;
  }

  try {
    // BrasilAPI v2 provides coordinates often
    const response = await fetch(`https://brasilapi.com.br/api/cep/v2/${cleanCep}`);
    if (!response.ok) {
      throw new Error('CEP not found');
    }
    const data: CepResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching CEP:", error);
    return null;
  }
};