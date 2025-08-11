# Silsa Project

## 프로젝트 개요
Silsa는 카카오 지도 API와 Google API를 활용하여 사용자에게 주소 검색, 지도 표시, 그리고 보고서 생성을 제공하는 웹 애플리케이션입니다.

---

## 설치 및 실행 방법

### 1. 프로젝트 클론
bash
git clone https://github.com/hyk071/silsa.git
cd silsa

### 2. 환경설치 및 실행 방법
npm install

### 3. api 설정
YOUR_GOOGLE_API_KEY: Google API 키를 입력하세요.
YOUR_KAKAO_MAPS_APP_KEY: 카카오 지도 API 키를 입력하세요.
샘플 파일(src/config.example.js)을 참고하세요.

### 4. 실행
npm run dev

주요 기능
주소 검색: 카카오 지도 API를 사용하여 주소를 검색하고 지도에 표시.
보고서 생성: 사용자 입력을 기반으로 보고서를 생성.
API 키 유효성 검사: 입력된 API 키의 유효성을 확인.

기술 스택
Frontend: React, TailwindCSS, Vite
API: 카카오 지도 API, Google API

주의사항
src/config.js 파일은 민감한 정보를 포함하므로 절대 공개 저장소에 업로드하지 마세요.
.gitignore에 src/config.js가 포함되어 있습니다.

라이선스
이 프로젝트는 MIT 라이선스를 따릅니다.


---

### 4. **최종 확인**
위 작업을 완료한 후, 다음 명령어로 변경 사항을 커밋하고 푸시하세요:
```sh
git add .
git commit -m "Update .gitignore, add config example, and write README"
git push