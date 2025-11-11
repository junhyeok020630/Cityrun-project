CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  nickname VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_routes ( -- 테이블 이름 일치 (이전에 수정됨)
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  name VARCHAR(100),
  origin_lat DOUBLE, origin_lng DOUBLE,
  dest_lat DOUBLE, dest_lng DOUBLE,
  distance_m INT, uphill_m INT, crosswalk_count INT,
  night_score INT, crowd_score INT, final_score INT,
  geom_json JSON,
  -- 💡 is_public 컬럼 추가
  is_public BOOLEAN NOT NULL DEFAULT FALSE, 
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_routes_user (user_id),
  CONSTRAINT fk_routes_user FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS emergency_requests (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  lat DOUBLE, lng DOUBLE,
  status ENUM('SENT','ACK','RESOLVED') DEFAULT 'SENT',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;