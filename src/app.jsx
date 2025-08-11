import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppProvider, useAppContext } from './context/AppContext';
import { PromptService } from './prompts/promptService.js';
import { GenerativeApi } from './services/generativeApi.js';
import { Modal } from './components/common/Modal';
import { ApiKeyValidator } from './components/ApiKeyValidator';
import { ReportForm } from './components/ReportForm';
import { ReportView } from './components/ReportView';

function App() {
  const { state, dispatch } = useAppContext();
  const { 
    isKeyValidated, isLoading, error, reports, selectedModel, 
    address, latlon, images, basePrompt, fieldMemo
  } = state;

  const [showConfirmModal, setShowConfirmModal] = React.useState(false);

  const handleGenerateReport = async () => {
    const hasAnyContext = Boolean(
      (address && address.trim()) ||
      (latlon && latlon.trim()) ||
      (images && images.length > 0) ||
      (fieldMemo && fieldMemo.trim())
    );
    if (!isKeyValidated || !hasAnyContext) {
      dispatch({ type: 'SET_ERROR', payload: '최소 하나 이상의 정보(주소/좌표/이미지/현장 메모)를 입력하고 API 키를 확인해주세요.' });
      return;
    }

    if (reports.some((r) => r.model === selectedModel)) {
        setShowConfirmModal(true);
    } else {
        proceedToGenerate();
    }
  };

  const proceedToGenerate = async () => {
    setShowConfirmModal(false);
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'RESET_REPORTS_FOR_MODEL', payload: selectedModel });

    try {
      const prompt = PromptService.buildPromptWithContext(basePrompt, { address, latlon, fieldMemo });
      const text = await GenerativeApi.generateContent({ apiKey: state.apiKey, model: selectedModel, prompt, images });
      const newReport = { model: selectedModel, text };
      dispatch({ type: 'GENERATE_REPORT_SUCCESS', payload: newReport });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: `보고서 생성 오류: ${err.message}` });
    } 
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-6">
      {showConfirmModal && (
          <Modal 
            title="재실행 확인"
            message={`'${selectedModel}' 모델로 이미 분석한 결과가 있습니다. 다시 실행하여 결과를 덮어쓰시겠습니까?`}
            onConfirm={proceedToGenerate}
            onCancel={() => setShowConfirmModal(false)}
          />
      )}
      <header className="max-w-6xl mx-auto mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-600 text-white grid place-items-center text-lg font-bold shadow-card">TS</div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900">교통안전진단 AI 보고서 생성기</h1>
              <p className="text-gray-500 text-sm">모듈화 v4 · 교통안전 전문가용 리포트 자동화</p>
            </div>
          </div>
          <span className="chip">Vite + React</span>
        </div>
      </header>

      <div className="w-full max-w-6xl mx-auto card p-6 md:p-8 space-y-6">

        {!isKeyValidated ? (
          <ApiKeyValidator />
        ) : (
          <ReportForm />
        )}

        {isKeyValidated && (
          <button onClick={handleGenerateReport} disabled={isLoading} className="btn-primary w-full h-12 text-base">
            {isLoading ? <div className="loader !w-6 !h-6 !border-2"></div> : `'${selectedModel}' 모델로 분석 시작`}
          </button>
        )}

        {error && <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 whitespace-pre-wrap" onClick={() => dispatch({ type: 'SET_ERROR', payload: null })}>{error}</div>}

        <ReportView />
      </div>
    </div>
  );
}

function AppWrapper() {
    return (
        <AppProvider>
            <App />
        </AppProvider>
    )
}

const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);
root.render(<AppWrapper />);