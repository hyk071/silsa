
import React from 'react';
import { useAppContext } from '../context/AppContext';
import { AddressFinder } from './AddressFinder';
import { PromptService } from '../prompts/promptService.js';

export function ReportForm() {
  const { state, dispatch } = useAppContext();
  const { 
    selectedModel, availableModels, address, latlon, fieldMemo, 
    promptUrl, basePrompt, imagePreviews, isAddressFinderOpen 
  } = state;

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const previewUrls = files.map((file) => URL.createObjectURL(file));
    dispatch({ type: 'SET_IMAGES', payload: { files, previews: previewUrls } });
  };

  const loadPromptTemplate = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const text = await PromptService.fetchPromptTemplate(promptUrl);
      dispatch({ type: 'SET_BASE_PROMPT', payload: text });
    } catch (e) {
      dispatch({ type: 'SET_ERROR', payload: e.message });
    }
  };

  return (
    <>
      {isAddressFinderOpen && (
        <AddressFinder
          onClose={() => dispatch({ type: 'SET_FIELD', field: 'isAddressFinderOpen', value: false })}
          onSelect={(selectedAddr, selectedLonLat) => {
            dispatch({ type: 'SET_FIELD', field: 'address', value: selectedAddr });
            dispatch({ type: 'SET_FIELD', field: 'latlon', value: selectedLonLat });
            dispatch({ type: 'SET_FIELD', field: 'isAddressFinderOpen', value: false });
          }}
        />
      )}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4 p-6 bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-100">
          <div className="p-2 bg-green-50 text-green-700 rounded-md text-center text-sm border border-green-100">✓ API 키가 확인되었습니다.</div>

          <div>
            <label htmlFor="model-select" className="section-title">AI 모델 선택</label>
            <select
              id="model-select"
              value={selectedModel}
              onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'selectedModel', value: e.target.value })}
              className="input bg-white"
            >
              {availableModels.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="address" className="section-title">주소</label>
            <div className="flex gap-2">
              <input type="text" id="address" value={address} onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'address', value: e.target.value })} className="input" />
              <button onClick={() => dispatch({ type: 'SET_FIELD', field: 'isAddressFinderOpen', value: true })} className="btn-secondary text-sm">찾기</button>
            </div>
          </div>

          <div>
            <label htmlFor="latlon" className="section-title">위도, 경도</label>
            <input type="text" id="latlon" value={latlon} onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'latlon', value: e.target.value })} className="input" />
          </div>

          <div>
            <label htmlFor="field-memo" className="section-title">현장 메모(선택)</label>
            <textarea id="field-memo" value={fieldMemo} onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'fieldMemo', value: e.target.value })} className="input h-28" placeholder="현장에서 기록한 특이사항, 민원 내용, 추가 관찰 등을 입력" />
          </div>

          <div className="space-y-2">
            <label htmlFor="prompt-url" className="section-title">프롬프트 템플릿 URL(선택)</label>
            <div className="flex gap-2">
              <input type="url" id="prompt-url" value={promptUrl} onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'promptUrl', value: e.target.value })} className="input" placeholder="https://... (raw 텍스트)" />
              <button onClick={loadPromptTemplate} className="btn-secondary text-indigo-700">불러오기</button>
            </div>
            <details className="text-xs text-gray-500">
              <summary>현재 프롬프트 미리보기</summary>
              <pre className="whitespace-pre-wrap bg-white border rounded p-2 max-h-40 overflow-auto">{basePrompt}</pre>
            </details>
          </div>
        </div>

        <div className="space-y-4 p-6 bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-1">현장/지도 사진 (여러 개 선택 가능)</label>
          <input type="file" id="images" multiple accept="image/png, image/jpeg" onChange={handleImageChange} className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:font-medium file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100" />
          {imagePreviews.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2 max-h-48 overflow-y-auto p-2 bg-white rounded-md border">
              {imagePreviews.map((src, i) => (
                <img key={i} src={src} alt={`preview ${i}`} className="w-full h-20 object-cover rounded-md" />
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 text-sm p-8 border-2 border-dashed rounded-md">이미지를 선택해주세요.</div>
          )}
        </div>
      </div>
    </>
  );
}


