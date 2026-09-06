CREATE TABLE IF NOT EXISTS "auth_login_attempts" (
  "id" text PRIMARY KEY,
  "identifier_hash" text NOT NULL UNIQUE,
  "attempts" integer DEFAULT 0 NOT NULL,
  "window_started_at" timestamp DEFAULT now() NOT NULL,
  "blocked_until" timestamp,
  "updated_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "auth_sessions" (
  "id" text PRIMARY KEY,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "user_agent" text,
  "ip_address" text,
  "expires_at" timestamp NOT NULL,
  "revoked_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "auth_sessions_user_id_idx" ON "auth_sessions" ("user_id");--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "refresh_tokens" (
  "id" text PRIMARY KEY,
  "session_id" text NOT NULL REFERENCES "auth_sessions"("id") ON DELETE CASCADE,
  "token_hash" text NOT NULL,
  "expires_at" timestamp NOT NULL,
  "revoked_at" timestamp,
  "replaced_by_token_id" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "refresh_tokens_session_id_idx" ON "refresh_tokens" ("session_id");
