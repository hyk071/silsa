import React, { useState, useEffect, useRef } from 'react';
import { APP_CONFIG } from '../config.js';
import { loadKakaoSDK } from '../lib/kakaoLoader.js';

export function AddressFinder({ onSelect, onClose }) {
  const [keyword, setKeyword] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const mapContainer = useRef(null);

  useEffect(() => {
    loadKakaoSDK(APP_CONFIG.KAKAO_MAPS_APP_KEY).catch(() => {
      setError('카카오 SDK 로드 실패. 허용 도메인(포트 포함)을 카카오 개발자 콘솔에 등록했는지 확인하세요.');
    });
  }, []);

  useEffect(() => {
    if (!result || !mapContainer.current) return;
    const { y: lat, x: lon } = result;
    const draw = () => {
      const coords = new kakao.maps.LatLng(lat, lon);
      const options = { center: coords, level: 3 };
      const map = new kakao.maps.Map(mapContainer.current, options);
      const marker = new kakao.maps.Marker({ position: coords });
      marker.setMap(map);
      map.relayout();
    };
    if (kakao.maps.load) kakao.maps.load(draw); else draw();
  }, [result]);

  const searchAddress = () => {
    setError('');
    if (!keyword.trim()) {
      setError('검색할 주소를 입력하세요.');
      return;
    }
    loadKakaoSDK(APP_CONFIG.KAKAO_MAPS_APP_KEY)
      .then((kakao) => {
        const geocoder = new kakao.maps.services.Geocoder();
        geocoder.addressSearch(keyword, (results, status) => {
          if (status === kakao.maps.services.Status.OK) {
            setResult(results[0]);
          } else {
            setResult(null);
            setError('검색 결과가 없습니다. 주소를 다시 확인해주세요.');
          }
        });
      })
      .catch(() => {
        setError('카카오 지도 SDK가 로드되지 않았습니다. 카카오 콘솔의 허용 도메인에 현재 접속 주소를 추가하세요.');
      });
  };

  const handleSelect = () => {
    if (result) {
      onSelect(result.address.address_name, `${result.y}, ${result.x}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl space-y-4">
        <h3 className="text-xl font-bold">주소 검색 및 위치 확인</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchAddress()}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="도로명 또는 지번 주소를 입력하세요"
          />
          <button onClick={searchAddress} className="px-4 py-2 bg-blue-600 text-white rounded-md shrink-0">검색</button>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div ref={mapContainer} className="w-full h-64 border rounded-md bg-gray-200">
          {!result && (
            <div className="h-full flex items-center justify-center text-gray-500">
              주소를 검색하면 여기에 지도가 표시됩니다.
            </div>
          )}
        </div>
        {result && (
          <div className="p-3 bg-gray-100 rounded-md text-sm space-y-1">
            <p><strong>도로명:</strong> {result.road_address ? result.road_address.address_name : '없음'}</p>
            <p><strong>지번:</strong> {result.address.address_name}</p>
            <p><strong>위도/경도:</strong> {result.y}, {result.x}</p>
          </div>
        )}
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded-md">닫기</button>
          <button onClick={handleSelect} disabled={!result} className="px-4 py-2 bg-indigo-600 text-white rounded-md disabled:bg-indigo-300">이 위치 사용하기</button>
        </div>
      </div>
    </div>
  );
}

