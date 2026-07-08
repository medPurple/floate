-- Schéma floate — stats/events/chat, exécuté une fois sur floate_db.
-- psql "postgresql://floate:MOT_DE_PASSE@localhost:5432/floate_db" -f schema.sql

CREATE TABLE IF NOT EXISTS visits (
  id BIGSERIAL PRIMARY KEY,
  ts TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_visits_ts ON visits (ts);

CREATE TABLE IF NOT EXISTS closed_sessions (
  id BIGSERIAL PRIMARY KEY,
  joined_at TIMESTAMPTZ NOT NULL,
  left_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_closed_sessions_left_at ON closed_sessions (left_at);

CREATE TABLE IF NOT EXISTS listen_sources (
  name  TEXT PRIMARY KEY,
  count BIGINT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS traffic_sources (
  name  TEXT PRIMARY KEY,
  count BIGINT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS geo_stats (
  name  TEXT PRIMARY KEY,
  count BIGINT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS events (
  id   BIGSERIAL PRIMARY KEY,
  kind TEXT NOT NULL,
  who  TEXT,
  room TEXT,
  ts   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_events_ts ON events (ts DESC);

CREATE TABLE IF NOT EXISTS chat_messages (
  id      BIGSERIAL PRIMARY KEY,
  room    TEXT NOT NULL,
  peer_id TEXT,
  pseudo  TEXT,
  text    TEXT NOT NULL,
  ts      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room ON chat_messages (room, ts);
