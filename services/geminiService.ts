import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { BillItem } from "../types";

// Always use process.env.GEMINI_API_KEY directly as a named parameter
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface ScannedMedicine {
  name: string;
  batchNumber: string;
  category: string;
  basePrice: number;
  gstRate: number;
  mrp: number;
  expMonth: string;
  expYear: string;
}

export const scanMedicineImage = async (base64Image: string): Promise<ScannedMedicine | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite-latest",
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Image.split(',')[1] || base64Image,
              },
            },
            {
              text: "Extract medicine details. Provide name, batch number, category, base price, GST rate, MRP, expiry month (MM) and year (YYYY). Be fast.",
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            batchNumber: { type: Type.STRING },
            category: { type: Type.STRING },
            basePrice: { type: Type.NUMBER },
            gstRate: { type: Type.NUMBER },
            mrp: { type: Type.NUMBER },
            expMonth: { type: Type.STRING },
            expYear: { type: Type.STRING },
          },
          required: ["name", "batchNumber", "category", "basePrice", "gstRate", "mrp", "expMonth", "expYear"],
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as ScannedMedicine;
    }
    return null;
  } catch (error) {
    console.error("AI Scan Error:", error);
    return null;
  }
};

export const extractMedicineData = async (base64Image: string): Promise<Partial<BillItem>> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Image.split(',')[1] || base64Image, mimeType: 'image/jpeg' } },
        { text: 'Extract medicine info: name, batch number, category, base price (per strip), GST%, MRP (per strip), units per strip (number of tablets in 1 strip), expiry (YYYY-MM-DD). JSON only.' }
      ]
    },
    config: {
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          batchNumber: { type: Type.STRING },
          category: { type: Type.STRING },
          basePrice: { type: Type.NUMBER },
          gstRate: { type: Type.NUMBER },
          mrp: { type: Type.NUMBER },
          unitsPerPackage: { type: Type.NUMBER },
          expiryDate: { type: Type.STRING },
        },
        required: ["name", "batchNumber", "category", "basePrice", "gstRate", "mrp", "unitsPerPackage", "expiryDate"]
      }
    }
  });

  try {
    const data = JSON.parse(response.text || '{}');
    return {
      ...data,
      costPrice: data.basePrice * (1 + (data.gstRate || 0) / 100)
    };
  } catch (e) {
    console.error("Failed to parse AI response", e);
    return {};
  }
};

export const extractBillData = async (base64Image: string): Promise<BillItem[]> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Image.split(',')[1] || base64Image, mimeType: 'image/jpeg' } },
        { text: 'Extract all bill items: name, batch number, quantity (number of strips), units per strip (tablets per strip), base price (per strip), GST%, MRP (per strip), category, expiry (YYYY-MM-DD). JSON array.' }
      ]
    },
    config: {
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            batchNumber: { type: Type.STRING },
            quantity: { type: Type.NUMBER },
            unitsPerPackage: { type: Type.NUMBER },
            basePrice: { type: Type.NUMBER },
            gstRate: { type: Type.NUMBER },
            mrp: { type: Type.NUMBER },
            category: { type: Type.STRING },
            expiryDate: { type: Type.STRING, description: 'Format: YYYY-MM-DD' },
          },
          required: ["name", "batchNumber", "quantity", "unitsPerPackage", "basePrice", "gstRate", "mrp", "category", "expiryDate"]
        }
      }
    }
  });

  try {
    const items = JSON.parse(response.text || '[]');
    return items.map((item: any) => ({
      ...item,
      costPrice: item.basePrice * (1 + (item.gstRate || 0) / 100)
    }));
  } catch (e) {
    console.error("Failed to parse AI response", e);
    return [];
  }
};
