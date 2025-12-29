import { GoogleGenAI } from "@google/genai";
import { Order } from "../types";

export const getBusinessInsights = async (orders: Order[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const orderSummary = orders.map(o => ({
    total: o.total,
    items: o.items.map(i => i.name).join(", "),
    status: o.status,
    date: new Date(o.createdAt).toLocaleDateString()
  }));

  const prompt = `
    You are a professional business advisor for a printing and photography shop in Pakistan.
    Analyze the following recent orders and provide 3 short, actionable business insights:
    ${JSON.stringify(orderSummary.slice(0, 10))}
    
    Format the response as a bulleted list of 3 items. Keep it concise and professional.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("AI Insight Error:", error);
    return "Unable to generate insights at this moment. Please check your network connection and try again later.";
  }
};