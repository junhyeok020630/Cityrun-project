# 'cityrun-geo' (Node.js) 서버를 실행하기 위한 Dockerfile

# --- 1. 빌드(Build) 단계 ---
# 'node:20-alpine' 이미지를 기반으로 함 (Alpine Linux 기반의 경량 Node.js 20 이미지)
FROM node:20-alpine
# 작업 디렉토리를 '/app'으로 설정
WORKDIR /app

# package.json과 package-lock.json을 먼저 복사
# (npm install이 소스 코드 변경과 관계없이 캐시되도록 함)
COPY package.json ./
# --omit=dev: package.json의 'devDependencies'를 제외하고 'dependencies'만 설치
RUN npm install --omit=dev

# 나머지 모든 소스 코드(server.js 등)를 /app 디렉토리로 복사
COPY . .

# 3000 포트를 외부에 노출 (server.js에서 3000번 포트 사용)
EXPOSE 3000

# 컨테이너가 시작될 때 'node server.js' 명령을 실행하여 서버를 시작
CMD ["node", "server.js"]