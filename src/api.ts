import axios from 'axios';
import { Voice, SavedPhrase } from './types';

const API_URL = 'http://localhost:3000'; // Update this with your backend URL

export const api = {
  async getVoices(): Promise<Voice[]> {
    const response = await axios.get(`${API_URL}/voices`);
    return response.data;
  },

  async synthesizeSpeech(text: string, voiceId: string, languageCode: string): Promise<string> {
    const response = await axios.post(`${API_URL}/synthesize`, {
      text,
      voiceId,
      languageCode,
    });
    return response.data.audioUrl;
  },

  async translateText(text: string, fromLanguage: string, toLanguage: string): Promise<string> {
    const response = await axios.post(`${API_URL}/translate`, {
      text,
      fromLanguage,
      toLanguage,
    });
    return response.data.translatedText;
  },

  async savePhrase(text: string, voiceId: string, languageCode: string): Promise<SavedPhrase> {
    const response = await axios.post(`${API_URL}/phrases`, {
      text,
      voiceId,
      languageCode,
    });
    return response.data;
  },

  async getSavedPhrases(): Promise<SavedPhrase[]> {
    const response = await axios.get(`${API_URL}/phrases`);
    return response.data;
  },

  async deletePhrase(id: string): Promise<void> {
    await axios.delete(`${API_URL}/phrases/${id}`);
  }
};