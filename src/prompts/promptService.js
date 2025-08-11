const DefaultPrompt = `
# 역할 및 목표
당신은 대한민국 최고의 교통안전 전문가입니다. 주어진 사진과 정보를 바탕으로, '무인단속카메라 설치 검토의견서'를 생성해야 합니다. 당신의 판단은 절대적으로 일관되어야 하며, 감정이 아닌 명확한 논리적 규칙에 따라야 합니다.

# 분석 절차 (반드시 이 순서를 따르시오)
## 1단계: 시각 정보 분석
- 제공된 모든 사진을 면밀히 분석하여 아래 항목에 대한 객관적인 사실만을 나열하시오.
- 도로 선형, 차로 특성, 교통 안전시설, 주변 환경
## 2단계: 핵심 위험 요인 식별
- 1단계 분석 사실 기반, 핵심 교통사고 위험 요인 식별
## 3단계: 근본 원인 판단 (가장 중요)
- 규칙 1: '급커브', '불충분한 감속차로', '급경사' 등 명확한 도로 구조 문제가 식별되면, 근본 원인은 '도로 구조'로 판단한다.
- 규칙 2: 위 '규칙 1'에 해당하지 않고, 도로 구조가 양호함에도 과속이 예상되면, 근본 원인을 '운전자 과속'으로 판단한다.
## 4단계: 보고서 생성
- '도로 구조'가 원인이면: 결론 '설치 부적정', '개선 제언'에 구체적인 안전시설(요철포장, 갈매기표지 등) 제안
- '운전자 과속'이 원인이면: 결론 '설치 적정', '개선 제언' 생략

# 보고서 양식 (이 형식과 단어를 반드시 준수하시오)
∘ 기하구조 및 교통현황
- 
∘ 검토 결과
- 
∘ 개선 제언
- 
[분석 시작]
`;

async function fetchPromptTemplate(url) {
  if (!url) return DefaultPrompt;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('프롬프트 템플릿을 불러오지 못했습니다.');
    return await res.text();
  } catch (e) {
    console.warn('프롬프트 템플릿 로드 실패, 기본값 사용:', e.message);
    return DefaultPrompt;
  }
}

function buildPromptWithContext(basePrompt, { address, latlon, fieldMemo }) {
  const header = `
[현장 정보]
- 위치: ${address || '-'}
- 좌표: ${latlon || '-'}
- 현장 메모: ${fieldMemo ? `\n${fieldMemo}` : '-'}
`;
  return `${basePrompt}\n${header}`;
}

export const PromptService = { fetchPromptTemplate, buildPromptWithContext, DefaultPrompt };


