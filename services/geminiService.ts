
import { GoogleGenAI, Type } from "@google/genai";
import { BillItem } from "../types";

// Always use process.env.API_KEY directly as a named parameter
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const extractMedicineData = async (base64Image: string): Promise<Partial<BillItem>> => {
  const response = await ai.models.generateContent({
    // Using gemini-3-flash-preview for efficient multimodal data extraction
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
        { text: 'Extract medicine information from this image. Provide the name, category, cost price (approx per strip), MRP (Maximum Retail Price per strip), Units per strip (e.g. 10), and Expiry Date (YYYY-MM-DD). Return as JSON.' }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          category: { type: Type.STRING },
          costPrice: { type: Type.NUMBER },
          mrp: { type: Type.NUMBER },
          unitsPerPackage: { type: Type.NUMBER },
          expiryDate: { type: Type.STRING },
        },
        required: ["name", "category", "costPrice", "mrp", "unitsPerPackage", "expiryDate"]
      }
    }
  });

  try {
    return JSON.parse(response.text || '{}');
  } catch (e) {
    console.error("Failed to parse AI response", e);
    return {};
  }
};

export const extractBillData = async (base64Image: string): Promise<BillItem[]> => {
  const response = await ai.models.generateContent({
    // Using gemini-3-flash-preview for complex multimodal analysis of billing documents
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
        { text: 'Analyze this medical agency bill. Extract all items listed, including medicine name, quantity (number of strips/boxes), cost price per strip, MRP per strip, units per strip (e.g. 10), category, and expiration date (YYYY-MM-DD). Return an array of items in JSON format.' }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            quantity: { type: Type.NUMBER },
            unitsPerPackage: { type: Type.NUMBER },
            costPrice: { type: Type.NUMBER },
            mrp: { type: Type.NUMBER },
            category: { type: Type.STRING },
            expiryDate: { type: Type.STRING, description: 'Format: YYYY-MM-DD' },
          },
          required: ["name", "quantity", "unitsPerPackage", "costPrice", "mrp", "category", "expiryDate"]
        }
      }
    }
  });

  try {
    return JSON.parse(response.text || '[]');
  } catch (e) {
    console.error("Failed to parse AI response", e);
    return [];
  }
};
