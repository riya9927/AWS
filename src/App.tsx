import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Save, Trash2, Languages, Mic, MicOff, RefreshCw, ArrowRight } from 'lucide-react';
import { api } from './api';
import { Voice, SavedPhrase } from './types';

const SUPPORTED_LANGUAGES = [
  { code: 'en-US', name: 'English' },
  { code: 'ja-JP', name: 'Japanese' },
  { code: 'es-ES', name: 'Spanish' }
];

function App() {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [fromLanguage, setFromLanguage] = useState<string>('');
  const [toLanguage, setToLanguage] = useState<string>('');
  const [inputText, setInputText] = useState<string>('');
  const [translatedText, setTranslatedText] = useState<string>('');
  const [savedPhrases, setSavedPhrases] = useState<SavedPhrase[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [transcription, setTranscription] = useState<string>('');
  const [pronunciationScore, setPronunciationScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string>('');
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    loadVoices();
    loadSavedPhrases();
    initializeSpeechRecognition();
  }, []);

  const initializeSpeechRecognition = () => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setTranscription(transcript);
        setInputText(transcript);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  };

  const loadVoices = async () => {
    try {
      const voicesList = await api.getVoices();
      setVoices(voicesList);
    } catch (error) {
      console.error('Failed to load voices:', error);
    }
  };

  const loadSavedPhrases = async () => {
    try {
      const phrases = await api.getSavedPhrases();
      setSavedPhrases(phrases);
    } catch (error) {
      console.error('Failed to load saved phrases:', error);
    }
  };

  const handleFromLanguageChange = (languageCode: string) => {
    setFromLanguage(languageCode);
    if (recognitionRef.current) {
      recognitionRef.current.lang = languageCode;
    }
    setPronunciationScore(null);
    setFeedback('');
    setTranscription('');
  };

  const handleToLanguageChange = (languageCode: string) => {
    setToLanguage(languageCode);
    const availableVoices = voices.filter(voice => voice.LanguageCode === languageCode);
    if (availableVoices.length > 0) {
      setSelectedVoice(availableVoices[0].Id);
    }
  };

  const handleTranslate = async () => {
    if (!inputText || !fromLanguage || !toLanguage) return;
    
    setIsTranslating(true);
    try {
      const translated = await api.translateText(inputText, fromLanguage, toLanguage);
      setTranslatedText(translated);
    } catch (error) {
      console.error('Failed to translate text:', error);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSpeak = async (text: string, languageCode: string) => {
    if (!text || !selectedVoice || !languageCode) return;
    
    setIsLoading(true);
    try {
      const audioUrl = await api.synthesizeSpeech(text, selectedVoice, languageCode);
      const audio = new Audio(audioUrl);
      audio.play();
    } catch (error) {
      console.error('Failed to synthesize speech:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRecording = () => {
    if (!isRecording && recognitionRef.current) {
      recognitionRef.current.start();
      setIsRecording(true);
      setPronunciationScore(null);
      setFeedback('');
      setTranscription('');
    } else if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const handleSave = async () => {
    if (!translatedText || !selectedVoice || !toLanguage) return;
    
    try {
      await api.savePhrase(translatedText, selectedVoice, toLanguage);
      await loadSavedPhrases();
      setInputText('');
      setTranslatedText('');
      setPronunciationScore(null);
      setFeedback('');
      setTranscription('');
    } catch (error) {
      console.error('Failed to save phrase:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deletePhrase(id);
      await loadSavedPhrases();
    } catch (error) {
      console.error('Failed to delete phrase:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2 mb-8">
          <Languages className="w-8 h-8 text-indigo-600" />
          <h1 className="text-3xl font-bold text-gray-800">Language Translator & Learning</h1>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Language
              </label>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                value={fromLanguage}
                onChange={(e) => handleFromLanguageChange(e.target.value)}
              >
                <option value="">Select source language</option>
                {SUPPORTED_LANGUAGES.map((language) => (
                  <option key={language.code} value={language.code}>
                    {language.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To Language
              </label>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                value={toLanguage}
                onChange={(e) => handleToLanguageChange(e.target.value)}
              >
                <option value="">Select target language</option>
                {SUPPORTED_LANGUAGES.map((language) => (
                  <option key={language.code} value={language.code}>
                    {language.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Enter Text
              </label>
              <button
                className={`flex items-center gap-2 px-3 py-1 rounded-md ${
                  !fromLanguage
                    ? 'bg-gray-300 cursor-not-allowed'
                    : isRecording
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-green-600 hover:bg-green-700'
                } text-white text-sm`}
                onClick={toggleRecording}
                disabled={!fromLanguage}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                {isRecording ? 'Stop' : 'Speak'}
              </button>
            </div>
            <textarea
              className="w-full rounded-md border border-gray-300 px-3 py-2 h-32"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Enter text to translate..."
            />
            <div className="flex justify-end mt-2">
              <button
                className={`flex items-center gap-2 px-4 py-2 rounded-md ${
                  isLoading || !fromLanguage
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                } text-white`}
                onClick={() => handleSpeak(inputText, fromLanguage)}
                disabled={isLoading || !fromLanguage || !inputText}
              >
                <Volume2 className="w-5 h-5" />
                Listen
              </button>
            </div>
          </div>

          <div className="flex justify-center mb-6">
            <button
              className={`flex items-center gap-2 px-6 py-3 rounded-md ${
                !fromLanguage || !toLanguage || !inputText || isTranslating
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white font-medium`}
              onClick={handleTranslate}
              disabled={!fromLanguage || !toLanguage || !inputText || isTranslating}
            >
              {isTranslating ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <ArrowRight className="w-5 h-5" />
              )}
              Translate
            </button>
          </div>

          {translatedText && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Translation
              </label>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-800">{translatedText}</p>
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    className={`flex items-center gap-2 px-4 py-2 rounded-md ${
                      isLoading || !toLanguage
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-700'
                    } text-white`}
                    onClick={() => handleSpeak(translatedText, toLanguage)}
                    disabled={isLoading || !toLanguage}
                  >
                    <Volume2 className="w-5 h-5" />
                    Listen
                  </button>
                  <button
                    className="flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={handleSave}
                  >
                    <Save className="w-5 h-5" />
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Saved Phrases</h2>
          <div className="space-y-4">
            {savedPhrases.map((phrase) => (
              <div
                key={phrase.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="text-gray-800">{phrase.text}</p>
                  <p className="text-sm text-gray-500">
                    {SUPPORTED_LANGUAGES.find(lang => lang.code === phrase.languageCode)?.name || phrase.languageCode}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-md"
                    onClick={() => handleSpeak(phrase.text, phrase.languageCode)}
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                  <button
                    className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                    onClick={() => handleDelete(phrase.id)}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
            {savedPhrases.length === 0 && (
              <p className="text-gray-500 text-center py-4">No saved phrases yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;