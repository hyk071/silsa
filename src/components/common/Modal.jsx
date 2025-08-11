
import React from 'react';

export function Modal({ title, message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm space-y-4">
        <h3 className="text-xl font-bold">{title}</h3>
        <p className="text-gray-600">{message}</p>
        <div className="flex justify-end gap-3">
          {onCancel && <button onClick={onCancel} className="px-4 py-2 bg-gray-300 rounded-md">취소</button>}
          <button onClick={onConfirm} className="px-4 py-2 bg-indigo-600 text-white rounded-md">확인</button>
        </div>
      </div>
    </div>
  );
}


