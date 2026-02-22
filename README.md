# 🏃‍♂️ 시티런 프로젝트 (Cityrun Project)

> **"당신의 도심 러닝을 더 안전하고 스마트하게"**
> 클라우드 네이티브 기반의 지능형 러닝 네비게이션 및 SOS 긴급 호출 서비스입니다.

<div align=center>
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB"/>
  <img src="https://img.shields.io/badge/Spring_Boot-6DB33F?style=for-the-badge&logo=spring-boot&logoColor=white"/>
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white"/>
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white"/>
  <img src="https://img.shields.io/badge/MariaDB-003545?style=for-the-badge&logo=mariadb&logoColor=white"/>
  <img src="https://img.shields.io/badge/Naver_Maps-03C75A?style=for-the-badge&logo=naver&logoColor=white"/>
</div>

---

## 📖 소개

**시티런 프로젝트**는 복잡한 도심 속에서 러너들이 최적의 경로를 탐색하고, 위급 상황 발생 시 즉각적인 보호를 받을 수 있도록 설계된 통합 플랫폼입니다. 가천대학교 졸업 프로젝트의 일환으로 5명의 팀원이 마이크로서비스 아키텍처(MSA)를 지향하여 개발하였습니다.

- 🗺️ **정교한 경로 탐색**: PostGIS를 활용하여 단순 직선거리가 아닌 실제 지리 데이터를 기반으로 한 경로를 제공합니다.
- 🚨 **안전 최우선**: 실시간 위치 기반 SOS 알림 기능을 지원하여 러닝 중 발생할 수 있는 사고에 대비합니다.
- ☁️ **클라우드 네이티브**: Docker 기반의 컨테이너 환경에서 유연하게 실행되도록 설계되었습니다.

---

## ✨ 주요 기능

| 기능 | 상세 설명 |
|:---:|---|
| 🚨 **SOS 긴급 알림** | 위급 상황 발생 시 클릭 한 번으로 보호자에게 현재 위치와 구조 요청 메시지 전송 |
| 📍 **러닝 경로 관리** | 사용자 맞춤형 러닝 코스를 직접 생성하고 관리하며, 실시간 트래킹 기록 저장 |
| 🔍 **스마트 장소 검색** | 네이버 지도 API와 연동하여 주변 편의시설 및 주요 지점을 실시간으로 탐색 |
| 📊 **활동 분석** | 실시간 주행 거리, 시간 데이터를 수집하여 개인별 러닝 대시보드 제공 |
| 🗺️ **GIS 경로 안내** | PostGIS 기반의 지리 정보 시스템을 통해 최적화된 러닝 맵 인터페이스 구현 |

---

## 🚀 실행 가이드

이 프로젝트는 Docker 환경에서 가장 원활하게 작동하며, `docker-compose`를 통해 모든 서비스를 한 번에 실행할 수 있습니다.

### 1️⃣ 사전 준비 및 파일 배치
* `docker-compose.yml` 파일과 `infra` 폴더 전체를 프로젝트 **최상위 디렉토리**에 배치하십시오.
* **필수 포함 요소:** `infra` 폴더 내 Nginx 설정, SSL 인증서, DB 초기화 스크립트(`init.sql`).
* 모든 커스텀 이미지는 Docker Hub에 Public으로 등록되어 있어 별도의 빌드 과정 없이 즉시 실행 가능합니다.

### 2️⃣ 서버 실행 명령어
터미널에서 아래 명령어를 입력하여 7개의 마이크로서비스를 동시에 시작합니다.
```bash
docker compose up -d
```

### 3️⃣ ✅ 접속 및 사용 안내 (필수)
* **권장 접속 주소:** [https://localhost](https://localhost)
* **접속 주의사항:** 외부 네이버 지도 API의 인증 보안 정책으로 인해, VM 내부에서 **루프백 주소(localhost)**를 통해 접속하는 것을 강력히 권장합니다.
* **리소스 권장:** PostGIS 지리 정보 데이터(약 1~2GB)가 이미지에 포함되어 있습니다. 원활한 실행을 위해 **VM에 최소 5~6GB 이상의 여유 공간**을 확보해 주세요.

---

## 📁 프로젝트 구조

```bash
cityrun-project/
├── 📂 cityrun-api/          # 백엔드 (Spring Boot) - 회원 인증 및 비즈니스 로직
├── 📂 cityrun-front/        # 프론트엔드 (React/Vite) - UI 및 지도 렌더링
├── 📂 cityrun-geo/          # GIS 서버 (Node.js) - 지리 데이터 연산 및 경로 처리
├── 📂 infra/                # 인프라 설정 폴더 (필수)
│   ├── 📂 certs/            # HTTPS용 SSL 인증서
│   ├── 📂 db/               # MariaDB 초기화 SQL (init.sql)
│   └── 📂 proxy/            # Nginx 리버스 프록시 설정
└── docker-compose.yml       # 전체 서비스 컨테이너 오케스트레이션
```

---

## 🛠️ 기술 스택 (Tech Stack)

### **Frontend**
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)

### **Backend**
![SpringBoot](https://img.shields.io/badge/SpringBoot-6DB33F?style=for-the-badge&logo=SpringBoot&logoColor=white)
![Node.js](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Spring Security](https://img.shields.io/badge/Spring_Security-6DB33F?style=for-the-badge&logo=Spring-Security&logoColor=white)

### **Database & Infrastructure**
![MariaDB](https://img.shields.io/badge/MariaDB-003545?style=for-the-badge&logo=mariadb&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostGIS-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/redis-%23DD0031.svg?style=for-the-badge&logo=redis&logoColor=white)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)
![Nginx](https://img.shields.io/badge/nginx-%23009639.svg?style=for-the-badge&logo=nginx&logoColor=white)

---
Copyright © 2026 Cityrun Team. All rights reserved.
