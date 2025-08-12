
import React, { createContext, useReducer, useContext } from 'react';
import { PromptService } from '../prompts/promptService.js';

export const AppContext = createContext();

import { APP_CONFIG } from '../config.js';

const initialState = {
  apiKey: APP_CONFIG?.GOOGLE_API_KEY || '',
  isKeyValidated: false,
  availableModels: [],
  selectedModel: '',
  address: '',
  latlon: '',
  images: [],
  imagePreviews: [],
  imageUrls: [],
  googlePhotosItems: [],
  reports: [],
  isLoading: false,
  error: null,
  isAddressFinderOpen: false,
  copySuccess: '',
  promptUrl: '',
  basePrompt: PromptService.DefaultPrompt,
  fieldMemo: '',
};

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'VALIDATE_KEY_SUCCESS':
      return {
        ...state,
        isKeyValidated: true,
        availableModels: action.payload,
        selectedModel: action.payload.find((m) => m.includes('flash')) || action.payload[0],
        error: null,
        isLoading: false,
      };
    case 'SET_IMAGES':
      return { ...state, images: action.payload.files, imagePreviews: action.payload.previews };
    case 'ADD_IMAGE_URLS': {
      const newUrls = (action.payload || []).filter(Boolean);
      const merged = Array.from(new Set([...(state.imageUrls || []), ...newUrls]));
      return { ...state, imageUrls: merged };
    }
    case 'CLEAR_IMAGE_URLS':
      return { ...state, imageUrls: [] };
    case 'SET_GOOGLE_PHOTOS_ITEMS':
      return { ...state, googlePhotosItems: Array.isArray(action.payload) ? action.payload : [] };
    case 'CLEAR_GOOGLE_PHOTOS_ITEMS':
      return { ...state, googlePhotosItems: [] };
    case 'GENERATE_REPORT_SUCCESS':
      const newReport = action.payload;
      const otherReports = state.reports.filter((r) => r.model !== newReport.model);
      const sortedReports = [...otherReports, newReport].sort((a, b) => a.model.localeCompare(b.model));
      return { ...state, reports: sortedReports, error: null, isLoading: false };
    case 'SET_BASE_PROMPT':
      return { ...state, basePrompt: action.payload, error: null, isLoading: false };
    case 'RESET_REPORTS_FOR_MODEL':
        return { ...state, reports: state.reports.filter(r => r.model !== action.payload) };
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const value = { state, dispatch };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within a AppProvider');
  }
  return context;
}
