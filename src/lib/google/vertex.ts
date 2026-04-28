import { VertexAI } from '@google-cloud/vertexai';

// Zorg dat GOOGLE_CLOUD_PROJECT in je .env.local staat of als active project is ingesteld in je terminal
const project = process.env.GOOGLE_CLOUD_PROJECT || 'weerzone-gemini';
// We gebruiken europe-west4 (Eemshaven, NL) voor de laagste latency en datasoevereiniteit
const location = process.env.GOOGLE_CLOUD_LOCATION || 'europe-west4'; 

const vertexAI = new VertexAI({ project, location });

/**
 * Gemini 1.5 Pro: Voor diepgaande redeneringen en het schrijven van complexe dossiers.
 * Perfect voor Piet's narratief, Reed's waarschuwingen en Steve's B2B beslisbomen.
 */
export const getGeminiPro = () => {
  return vertexAI.getGenerativeModel({
    model: 'gemini-1.5-pro',
    generationConfig: {
      maxOutputTokens: 2048,
      temperature: 0.4,
    },
  });
};

/**
 * Gemini 1.5 Flash: Voor razendsnelle, deterministische taken.
 * Perfect voor het structureren van JSON, snelle waarschuwingstriage of sentiment-analyse.
 */
export const getGeminiFlash = () => {
  return vertexAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
      temperature: 0.1, // Laag voor stabiele output
    },
  });
};
