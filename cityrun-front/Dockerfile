# React 프론트엔드 앱을 빌드하고 Nginx 웹 서버를 이용해 실행하기 위한 Dockerfile

# --- 1. 빌드(Build) 단계 ---
FROM node:20-alpine AS builder # Node.js 20 버전과 Alpine Linux 기반 이미지를 빌드 환경으로 사용
WORKDIR /app # 작업 디렉토리 설정

# 의존성 파일 복사 (Docker Layer 캐시 활용)
COPY package.json package-lock.json ./
RUN npm install # 의존성 설치

# 나머지 모든 소스 코드를 복사
COPY . .
# 'package.json'에 정의된 'build' 스크립트를 실행하여 React 앱을 정적 파일로 빌드 (결과물: /app/dist)
RUN npm run build

# --- 2. 실행(Runtime) 단계 ---
FROM nginx:alpine # 가벼운 Nginx Alpine 이미지를 실행 환경으로 사용
# 빌드 단계에서 생성된 정적 파일(/app/dist)을 Nginx의 웹 루트 디렉토리로 복사
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80 # 80번 포트를 외부에 노출
# 컨테이너 시작 시 Nginx 서버 실행
CMD ["nginx", "-g", "daemon off;"]