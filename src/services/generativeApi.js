async function fileToGenerativePart(file) {
  const base64EncodedDataPromise = new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.readAsDataURL(file);
  });
  return { inlineData: { data: await base64EncodedDataPromise, mimeType: file.type } };
}

async function urlToGenerativePart(url) {
  // Google Drive 공유 URL의 직접 파일 URL 변환(가능한 경우) 처리
  // - 공유 링크 예: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
  // - 직접 다운로드: https://drive.google.com/uc?export=view&id=FILE_ID 또는 export=download
  let fetchUrl = url;
  try {
    const driveMatch = url.match(/https?:\/\/drive\.google\.com\/file\/d\/([^/]+)\//);
    if (driveMatch && driveMatch[1]) {
      fetchUrl = `https://drive.google.com/uc?export=download&id=${driveMatch[1]}`;
    }
    const openMatch = url.match(/https?:\/\/drive\.google\.com\/open\?id=([^&]+)/);
    if (openMatch && openMatch[1]) {
      fetchUrl = `https://drive.google.com/uc?export=download&id=${openMatch[1]}`;
    }
  } catch (_) {}

  const resp = await fetch(fetchUrl);
  if (!resp.ok) throw new Error(`이미지 URL 로드 실패: ${resp.status}`);
  const blob = await resp.blob();
  const arrayBuffer = await blob.arrayBuffer();
  // base64 인코딩
  let binary = '';
  const bytes = new Uint8Array(arrayBuffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64Data = btoa(binary);
  const mimeType = blob.type || 'image/jpeg';
  return { inlineData: { data: base64Data, mimeType } };
}

async function safeUrlToGenerativePart(url) {
  try {
    return await urlToGenerativePart(url);
  } catch (e) {
    console.warn('이미지 URL 변환 실패(무시):', url, e?.message || e);
    return null;
  }
}

async function fetchModels(apiKey) {
  if (!apiKey) throw new Error('API 키가 비어 있습니다.');
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || 'API 키가 유효하지 않습니다.');
  if (!data.models) throw new Error('API 응답에서 모델 목록을 찾을 수 없습니다.');
  const visionModels = data.models
    .filter((m) => m.supportedGenerationMethods.includes('generateContent') && (m.name.includes('vision') || m.name.includes('flash') || m.name.includes('pro')) && !m.name.includes('text') && !m.name.includes('embedding'))
    .map((m) => m.name.replace('models/', ''));
  if (visionModels.length === 0) throw new Error('사용 가능한 비전 모델을 찾을 수 없습니다.');
  return visionModels;
}

async function generateContent({ apiKey, model, prompt, images, imageUrls = [], googleInlineParts = [] }) {
  const fileParts = await Promise.all(images.map((f) => fileToGenerativePart(f)));
  const urlPartsRaw = await Promise.all((imageUrls || []).map((u) => safeUrlToGenerativePart(u)));
  const urlParts = urlPartsRaw.filter(Boolean);
  const imageParts = [...fileParts, ...urlParts, ...(googleInlineParts || [])];
  const textPart = { text: prompt };
  const promptParts = [textPart, ...imageParts];
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: promptParts }] }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || `HTTP 오류! 상태 코드: ${response.status}`);
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error(`AI로부터 유효한 응답을 받지 못했습니다. (차단 이유: ${data.candidates?.[0]?.finishReason})`);
  return text;
}

export const GenerativeApi = { fetchModels, generateContent };


