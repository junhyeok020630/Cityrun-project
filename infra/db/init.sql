-- 'CityRun' 프로젝트의 모든 테이블 구조(Schema)를 정의하는 SQL 스크립트

-- 'users' 테이블: 사용자 계정 정보
CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT, -- 사용자 고유 ID
  email VARCHAR(120) NOT NULL UNIQUE, -- 로그인 ID (이메일)
  password_hash VARCHAR(255) NOT NULL, -- 해시된 비밀번호
  nickname VARCHAR(50), -- 사용자 닉네임
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- 계정 생성 일시
) ENGINE=InnoDB;

-- 'user_routes' 테이블: 사용자가 저장한 러닝 경로
CREATE TABLE IF NOT EXISTS user_routes (
  id BIGINT PRIMARY KEY AUTO_INCREMENT, -- 경로 고유 ID
  user_id BIGINT NOT NULL, -- 생성한 사용자 ID (users.id)
  name VARCHAR(100), -- 경로 이름
  origin_lat DOUBLE, origin_lng DOUBLE, -- 출발지 위도/경도
  dest_lat DOUBLE, dest_lng DOUBLE, -- 도착지 위도/경도
  distance_m INT, -- 총 거리 (미터)
  uphill_m INT, -- 오르막 (확장용)
  crosswalk_count INT, -- 횡단보도 개수
  night_score INT, -- 야간 안전 점수
  crowd_score INT, -- 혼잡도 점수
  final_score INT, -- 최종 추천 점수
  geom_json JSON, -- 경로 좌표 (GeoJSON)
  is_public BOOLEAN NOT NULL DEFAULT FALSE, -- 경로 공개 여부 (확장용)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 경로 생성 일시
  INDEX idx_routes_user (user_id), -- user_id 검색용 인덱스
  CONSTRAINT fk_routes_user FOREIGN KEY (user_id) REFERENCES users(id) -- 외래 키
    ON DELETE CASCADE ON UPDATE CASCADE -- 사용자 삭제 시 관련 경로도 삭제
) ENGINE=InnoDB;

-- 'emergency_requests' 테이블: SOS 긴급 요청 기록
CREATE TABLE IF NOT EXISTS emergency_requests (
  id BIGINT PRIMARY KEY AUTO_INCREMENT, -- 요청 고유 ID
  user_id BIGINT NOT NULL, -- 요청한 사용자 ID
  lat DOUBLE, lng DOUBLE, -- 요청 시점 위도/경도
  status ENUM('SENT','ACK','RESOLVED') DEFAULT 'SENT', -- 요청 상태 (SENT: 전송됨)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- 요청 일시
) ENGINE=InnoDB;

-- 'user_activities' 테이블: 사용자의 실제 운동 완료 기록
CREATE TABLE IF NOT EXISTS user_activities (
  id BIGINT PRIMARY KEY AUTO_INCREMENT, -- 활동 고유 ID
  user_id BIGINT NOT NULL, -- 사용자 ID (users.id)
  distance_m INT NOT NULL,         -- 총 달린 거리 (미터)
  duration_s INT NOT NULL,         -- 총 운동 시간 (초)
  avg_pace_s_per_km INT,           -- 평균 페이스 (km당 초)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 운동 완료(저장) 시간
  
  INDEX idx_activities_user (user_id), -- user_id 검색용 인덱스
  CONSTRAINT fk_activities_user FOREIGN KEY (user_id) REFERENCES users(id) -- 외래 키
    ON DELETE CASCADE ON UPDATE CASCADE -- 사용자 삭제 시 관련 활동도 삭제
) ENGINE=InnoDB;