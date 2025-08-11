
import React from 'react';
import { useAppContext } from '../context/AppContext';
import { GenerativeApi } from '../services/generativeApi.js';

export function ApiKeyValidator() {
  const { state, dispatch } = useAppContext();
  const { apiKey, isLoading } = state;

  const validateAndFetchModels = async () => {
    if (!apiKey.trim()) {
      dispatch({ type: 'SET_ERROR', payload: 'Google API 키를 입력해주세요.' });
      return;
    }
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const visionModels = await GenerativeApi.fetchModels(apiKey);
      dispatch({ type: 'VALIDATE_KEY_SUCCESS', payload: visionModels });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: `API 키 확인 실패: ${err.message}` });
    }
  };

  return (
    <div className="space-y-4 p-6 bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-100">
      <label htmlFor="api-key" className="section-title">Google API Key</label>
      <div className="flex items-center gap-2">
        <input
          type="password"
          id="api-key"
          value={apiKey}
          onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'apiKey', value: e.target.value })}
          className="input"
          placeholder="AI Studio에서 발급받은 API 키를 입력"
        />
        <button onClick={() => dispatch({ type: 'SET_FIELD', field: 'apiKey', value: '' })} className="btn-secondary">초기화</button>
        <button onClick={validateAndFetchModels} disabled={isLoading} className="btn-primary">
          {isLoading ? '확인 중...' : '키 확인'}
        </button>
      </div>
    </div>
  );
}


