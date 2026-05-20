-- 마이보이스키즈 (myvoicekids) DB 스키마 / MySQL 8
-- 실행: npm run db:setup

CREATE DATABASE IF NOT EXISTS myvoicekids
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE myvoicekids;

-- 회원
CREATE TABLE IF NOT EXISTS users (
  id            BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
  email         VARCHAR(255)     NOT NULL,
  password_hash VARCHAR(255)     NOT NULL,
  child_name    VARCHAR(50)      NULL,
  child_age     TINYINT UNSIGNED NULL,
  created_at    TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 복제한 목소리 (메타데이터만 저장, 오디오 원본은 ElevenLabs)
CREATE TABLE IF NOT EXISTS voices (
  id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id             BIGINT UNSIGNED NOT NULL,
  elevenlabs_voice_id VARCHAR(100)    NOT NULL,
  name                VARCHAR(100)    NOT NULL,
  emoji               VARCHAR(16)     NOT NULL DEFAULT '🎙️',
  created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_voices_user (user_id),
  CONSTRAINT fk_voices_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 저장한(북마크한) 동화 — story_id 는 정적 동화 id 또는 user_stories id
CREATE TABLE IF NOT EXISTS bookmarks (
  user_id    BIGINT UNSIGNED NOT NULL,
  story_id   VARCHAR(64)     NOT NULL,
  created_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, story_id),
  CONSTRAINT fk_bookmarks_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- AI 로 생성한 동화
CREATE TABLE IF NOT EXISTS user_stories (
  id           BIGINT UNSIGNED   NOT NULL AUTO_INCREMENT,
  user_id      BIGINT UNSIGNED   NOT NULL,
  title        VARCHAR(200)      NOT NULL,
  content      MEDIUMTEXT        NOT NULL,
  morals       JSON              NOT NULL,
  age_min      TINYINT UNSIGNED  NOT NULL,
  age_max      TINYINT UNSIGNED  NOT NULL,
  duration_min SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  created_at   TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_user_stories_user (user_id),
  CONSTRAINT fk_user_stories_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 기본 제공 동화 카탈로그 (책장)
CREATE TABLE IF NOT EXISTS stories (
  id           VARCHAR(16)       NOT NULL,
  title        VARCHAR(200)      NOT NULL,
  content      MEDIUMTEXT        NOT NULL,
  age_min      TINYINT UNSIGNED  NOT NULL,
  age_max      TINYINT UNSIGNED  NOT NULL,
  morals       JSON              NOT NULL,
  is_premium   TINYINT(1)        NOT NULL DEFAULT 0,
  category     VARCHAR(32)       NOT NULL,
  duration_min SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  sort_order   INT               NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_stories_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
