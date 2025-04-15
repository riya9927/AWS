export interface Voice {
  Id: string;
  LanguageCode: string;
  LanguageName: string;
  Name: string;
}

export interface SavedPhrase {
  id: string;
  text: string;
  languageCode: string;
  voiceId: string;
}

export interface PronunciationResult {
  accuracy: number;
  mistakes: string[];
}