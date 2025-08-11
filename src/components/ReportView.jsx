
import React from 'react';
import { useAppContext } from '../context/AppContext';

export function ReportView() {
  const { state, dispatch } = useAppContext();
  const { reports, copySuccess } = state;

  const copyToClipboard = (textToCopy, modelName) => {
    const textArea = document.createElement('textarea');
    textArea.value = textToCopy;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      dispatch({ type: 'SET_FIELD', field: 'copySuccess', value: modelName });
      setTimeout(() => dispatch({ type: 'SET_FIELD', field: 'copySuccess', value: '' }), 2000);
    } catch (err) { 
      console.error('복사 실패:', err);
      dispatch({ type: 'SET_ERROR', payload: '텍스트 복사에 실패했습니다.' });
    }
    document.body.removeChild(textArea);
  };

  if (reports.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {reports.map((r, index) => (
        <div key={index} className="card p-4 flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-bold text-gray-800">{r.model}</h3>
            <button onClick={() => copyToClipboard(r.text, r.model)} className="btn-secondary text-sm">
              {copySuccess === r.model ? '복사 완료!' : '복사하기'}
            </button>
          </div>
          <div className="bg-gray-50 p-4 rounded-md h-full whitespace-pre-wrap font-['Noto Sans KR'] text-sm overflow-y-auto">
            {r.text}
          </div>
        </div>
      ))}
    </div>
  );
}


