import { APP_CONFIG } from '../config.js';

let gisLoadedPromise = null;
let tokenClient = null;
let accessToken = null;
let tokenExpiresAt = 0;

function loadGisScript() {
  if (gisLoadedPromise) return gisLoadedPromise;
  gisLoadedPromise = new Promise((resolve, reject) => {
    if (window.google && window.google.accounts && window.google.accounts.oauth2) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Google Identity Services 로드 실패'));
    document.head.appendChild(script);
  });
  return gisLoadedPromise;
}

function ensureClient() {
  if (!APP_CONFIG.GOOGLE_OAUTH_CLIENT_ID) {
    throw new Error('GOOGLE_OAUTH_CLIENT_ID가 설정되지 않았습니다. src/config.js를 확인하세요.');
  }
  if (APP_CONFIG.GOOGLE_OAUTH_CLIENT_ID === 'YOUR_GOOGLE_OAUTH_CLIENT_ID') {
    throw new Error('GOOGLE_OAUTH_CLIENT_ID를 실제 값으로 변경하세요. Google Cloud Console에서 OAuth 2.0 클라이언트 ID를 확인하세요.');
  }
  if (!tokenClient) {
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: APP_CONFIG.GOOGLE_OAUTH_CLIENT_ID,
      scope: 'https://www.googleapis.com/auth/photoslibrary.readonly',
      callback: () => {},
    });
  }
  return tokenClient;
}

export async function getAccessToken({ prompt = 'consent' } = {}) {
  await loadGisScript();
  const now = Date.now();
  if (accessToken && tokenExpiresAt - now > 60_000) {
    return accessToken;
  }
  const client = ensureClient();
  console.log('OAuth 클라이언트 초기화됨:', { clientId: APP_CONFIG.GOOGLE_OAUTH_CLIENT_ID });
  const token = await new Promise((resolve, reject) => {
    try {
      client.callback = (resp) => {
        if (resp.error) {
          console.error('OAuth 응답 오류:', resp);
          reject(new Error(resp.error));
        } else {
          console.log('OAuth 토큰 발급 성공');
          resolve(resp.access_token);
        }
      };
      client.requestAccessToken({ prompt });
    } catch (e) {
      console.error('OAuth 요청 중 예외:', e);
      reject(e);
    }
  });
  accessToken = token;
  tokenExpiresAt = now + 55 * 60_000; // 보수적으로 55분
  return accessToken;
}

export async function listMediaItems({ pageSize = 50, pageToken = '' } = {}) {
  console.log('listMediaItems 호출 시작:', { pageSize, pageToken });
  
  try {
    // 최초 호출은 동의 화면을 강제로 띄워 범위를 확실히 부여
    console.log('토큰 요청 시작...');
    const token = await getAccessToken({ prompt: 'consent' });
    console.log('토큰 획득 성공, 길이:', token?.length || 0);
    
    const url = new URL('https://photoslibrary.googleapis.com/v1/mediaItems');
    url.searchParams.set('pageSize', String(Math.max(1, Math.min(pageSize, 100))));
    if (pageToken) url.searchParams.set('pageToken', pageToken);
    
    console.log('Photos API 호출 URL:', url.toString());
    
    const resp = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    console.log('Photos API 응답 상태:', resp.status, resp.statusText);
    
    if (!resp.ok) {
      // 401/403 등 인증/권한 문제는 토큰을 초기화하고 재동의 강제 후 1회 재시도
      if (resp.status === 401 || resp.status === 403) {
        console.log('인증/권한 오류, 토큰 재요청 시도...');
        accessToken = null; tokenExpiresAt = 0;
        const retryToken = await getAccessToken({ prompt: 'consent' });
        const retryResp = await fetch(url.toString(), { headers: { Authorization: `Bearer ${retryToken}` } });
        if (!retryResp.ok) {
          let msg = `Google Photos API 오류: ${retryResp.status}`;
          try { 
            const j = await retryResp.json(); 
            if (j.error?.message) msg += ` - ${j.error.message}`; 
            console.error('재시도 실패 응답:', j);
          } catch (_) {}
          throw new Error(msg);
        }
        console.log('재시도 성공');
        const retryData = await retryResp.json();
        console.log('재시도 데이터:', retryData);
        return retryData;
      }
      let msg = `Google Photos API 오류: ${resp.status}`;
      try { 
        const j = await resp.json(); 
        if (j.error?.message) msg += ` - ${j.error.message}`; 
        console.error('API 오류 응답:', j);
      } catch (_) {}
      throw new Error(msg);
    }
    
    const data = await resp.json();
    console.log('Photos API 성공 응답:', data);
    return data;
  } catch (error) {
    console.error('listMediaItems 전체 오류:', error);
    throw error;
  }
}

async function blobToBase64InlineData(blob) {
  const arrayBuffer = await blob.arrayBuffer();
  let binary = '';
  const bytes = new Uint8Array(arrayBuffer);
  for (let i = 0; i < bytes.byteLength; i += 1) binary += String.fromCharCode(bytes[i]);
  const data = btoa(binary);
  const mimeType = blob.type || 'image/jpeg';
  return { inlineData: { data, mimeType } };
}

export async function mediaItemsToInlineParts(mediaItems = []) {
  if (!mediaItems.length) return [];
  const token = await getAccessToken({ prompt: '' });
  const tasks = mediaItems.map(async (m) => {
    try {
      // baseUrl에 =d 파라미터로 원본 다운로드(가능한 경우)
      const downloadUrl = `${m.baseUrl}=d`;
      const resp = await fetch(downloadUrl, { headers: { Authorization: `Bearer ${token}` } });
      if (!resp.ok) throw new Error(`미디어 다운로드 실패: ${resp.status}`);
      const blob = await resp.blob();
      return await blobToBase64InlineData(blob);
    } catch (e) {
      console.warn('Google Photos 항목 변환 실패(무시):', m?.id || m, e?.message || e);
      return null;
    }
  });
  const parts = await Promise.all(tasks);
  return parts.filter(Boolean);
}

export const GooglePhotosService = {
  getAccessToken,
  listMediaItems,
  mediaItemsToInlineParts,
};


