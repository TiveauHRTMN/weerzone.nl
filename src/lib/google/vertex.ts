import { GoogleGenerativeAI, type GenerationConfig, type GenerativeModel } from "@google/generative-ai";

type ModelOptions = {
  model: string;
  generationConfig?: GenerationConfig;
  systemInstruction?: string;
};

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY ontbreekt");
  }
  return new GoogleGenerativeAI(apiKey);
}

function createModel(options: ModelOptions): GenerativeModel {
  return getClient().getGenerativeModel({
    model: options.model,
    generationConfig: options.generationConfig,
    systemInstruction: options.systemInstruction,
  });
}

export const getGeminiPro = () => {
  return createModel({
    model: "gemini-1.5-pro",
    generationConfig: {
      maxOutputTokens: 2048,
      temperature: 0.4,
    },
  });
};

export const getGeminiFlash = () => {
  return createModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      temperature: 0.1,
    },
  });
};
