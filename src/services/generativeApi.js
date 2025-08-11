async function fileToGenerativePart(file) {
  const base64EncodedDataPromise = new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.readAsDataURL(file);
  });
  return { inlineData: { data: await base64EncodedDataPromise, mimeType: file.type } };
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

async function generateContent({ apiKey, model, prompt, images }) {
  const imageParts = await Promise.all(images.map((f) => fileToGenerativePart(f)));
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


