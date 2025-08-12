import React, { useEffect, useState } from 'react';
import { GooglePhotosService } from '../services/googlePhotos.js';
import { useAppContext } from '../context/AppContext.jsx';

export function GooglePhotosPicker({ onClose }) {
  const { dispatch } = useAppContext();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [nextPageToken, setNextPageToken] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());

  const load = async (pageToken = '') => {
    console.log('Google Photos 로드 시작:', { pageToken });
    setLoading(true);
    setError('');
    try {
      const data = await GooglePhotosService.listMediaItems({ pageSize: 50, pageToken });
      console.log('로드 성공, 데이터:', data);
      setItems((prev) => (pageToken ? [...prev, ...(data.mediaItems || [])] : (data.mediaItems || [])));
      setNextPageToken(data.nextPageToken || '');
    } catch (e) {
      console.error('Google Photos 로드 실패:', e);
      setError(e.message || 'Google Photos 불러오기 실패');
    } finally {
      setLoading(false);
    }
  };

  const debugAuth = async () => {
    try {
      console.log('디버그: 인증 상태 확인 시작');
      const token = await GooglePhotosService.getAccessToken({ prompt: '' });
      console.log('디버그: 토큰 확인됨, 길이:', token?.length || 0);
      setError('토큰 확인됨. 이제 사진 불러오기를 시도해보세요.');
    } catch (e) {
      console.error('디버그: 인증 실패:', e);
      setError(`인증 실패: ${e.message}`);
    }
  };

  useEffect(() => { setLoading(false); }, []);

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const confirmSelection = async () => {
    try {
      const selected = items.filter((m) => selectedIds.has(m.id));
      if (selected.length === 0) { onClose?.(); return; }
      dispatch({ type: 'SET_GOOGLE_PHOTOS_ITEMS', payload: selected });
      onClose?.();
    } catch (e) {
      setError(e.message || '선택 처리 실패');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Google Photos에서 선택</h3>
          <button onClick={onClose} className="btn-secondary">닫기</button>
        </div>
        {error && (
          <div className="p-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded space-y-2">
            <div>{error}</div>
            <div className="flex gap-2">
              <button type="button" className="btn-secondary" onClick={() => GooglePhotosService.getAccessToken({ prompt: 'consent' }).then(() => load('')).catch((e)=>setError(e.message||'권한 재요청 실패'))}>권한 다시 요청</button>
              <button type="button" className="btn-secondary" onClick={() => load('')}>다시 시도</button>
            </div>
          </div>
        )}

        {!loading && items.length === 0 && !error && (
          <div className="p-3 bg-gray-50 border rounded text-sm flex items-center justify-between">
            <div>Google Photos에서 사진을 불러오려면 아래 버튼을 눌러 로그인/권한을 허용하세요.</div>
            <div className="flex gap-2">
              <button type="button" className="btn-secondary" onClick={debugAuth}>인증 상태 확인</button>
              <button type="button" className="btn-primary" onClick={() => load('')}>사진 불러오기</button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-[60vh] overflow-auto">
          {items.map((m) => (
            <button key={m.id} type="button" onClick={() => toggleSelect(m.id)} className={`relative border rounded overflow-hidden ${selectedIds.has(m.id) ? 'ring-2 ring-brand-600' : ''}`}>
              <img src={`${m.baseUrl}=w256-h256`} alt={m.filename || m.id} className="w-full h-28 object-cover" />
              {selectedIds.has(m.id) && <span className="absolute top-1 right-1 bg-brand-600 text-white text-xs px-1.5 py-0.5 rounded">선택</span>}
            </button>
          ))}
          {loading && <div className="col-span-full text-center py-6 text-gray-500">불러오는 중...</div>}
        </div>
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">선택: {selectedIds.size}개</div>
          <div className="flex gap-2">
            {nextPageToken && <button type="button" className="btn-secondary" onClick={() => load(nextPageToken)}>더 불러오기</button>}
            <button type="button" className="btn-primary" onClick={confirmSelection}>추가</button>
          </div>
        </div>
      </div>
    </div>
  );
}


