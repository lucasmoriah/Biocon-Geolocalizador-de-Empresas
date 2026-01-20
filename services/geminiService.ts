import { GoogleGenAI, Type } from "@google/genai";
import { LocationEntry } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateMockLocations = async (count: number = 5): Promise<LocationEntry[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate ${count} realistic Brazilian companies with valid addresses and approximate coordinates. The coordinates must be within Brazil.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Company name" },
              description: { type: Type.STRING, description: "Short business description or location type" },
              cep: { type: Type.STRING, description: "Valid Brazilian CEP (Zip code)" },
              latitude: { type: Type.NUMBER, description: "Latitude coordinate" },
              longitude: { type: Type.NUMBER, description: "Longitude coordinate" },
            },
            required: ["name", "description", "cep", "latitude", "longitude"]
          }
        }
      }
    });

    const rawData = response.text;
    if (!rawData) return [];

    const parsedData = JSON.parse(rawData);
    
    // Map to our internal structure with IDs
    return parsedData.map((item: any) => ({
      id: crypto.randomUUID(),
      name: item.name,
      description: item.description,
      cep: item.cep,
      latitude: item.latitude,
      longitude: item.longitude,
      isAutoFilled: true
    }));

  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw new Error("Failed to generate mock data via AI.");
  }
};