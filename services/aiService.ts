
import { GoogleGenAI } from "@google/genai";
import { Order } from "../types";

export const getBusinessInsights = async (orders: Order[]) => {
  // Fix: Initialize GoogleGenAI strictly using the environment variable and named parameters
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Prepare a brief summary of the orders for the AI to analyze
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
    // Fix: Call generateContent directly on ai.models as per the latest SDK guidelines
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    // Fix: Access response.text as a property, not a method
    return response.text;
  } catch (error) {
    console.error("AI Insight Error:", error);
    return "Unable to generate insights at this moment. Please check your network connection and try again later.";
  }
};
