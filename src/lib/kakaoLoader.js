let kakaoReadyPromise = null;

export function loadKakaoSDK(appKey) {
  if (typeof window !== 'undefined' && window.kakao?.maps?.services) {
    return Promise.resolve(window.kakao);
  }
  if (kakaoReadyPromise) return kakaoReadyPromise;

  kakaoReadyPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById('kakao-maps-sdk');
    if (existing) {
      if (window.kakao?.maps?.load) {
        window.kakao.maps.load(() => resolve(window.kakao));
      } else {
        resolve(window.kakao);
      }
      return;
    }
    const script = document.createElement('script');
    script.id = 'kakao-maps-sdk';
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?autoload=false&appkey=${appKey}&libraries=services`;
    script.async = true;
    script.onerror = () => reject(new Error('Kakao SDK 로드 실패'));
    script.onload = () => {
      if (!window.kakao || !window.kakao.maps?.load) {
        reject(new Error('Kakao SDK가 올바르게 초기화되지 않았습니다'));
        return;
      }
      window.kakao.maps.load(() => resolve(window.kakao));
    };
    document.head.appendChild(script);
  });

  return kakaoReadyPromise;
}


