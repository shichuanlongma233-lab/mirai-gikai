-- 回答メモ方式（質問の柱）のための列
-- pillars: 取り込んだ「質問の柱」(JSON)。pillars_version は保存するたびに1増やす
-- question_engine: classic=今までの進め方 / memo=回答メモ方式（インタビューごとに切り替え）
-- answer_memo: セッションごとの回答メモ（聞きたい点ごとの回答状況）

ALTER TABLE interview_configs
  ADD COLUMN pillars JSONB,
  ADD COLUMN pillars_version INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN question_engine TEXT NOT NULL DEFAULT 'classic'
    CHECK (question_engine IN ('classic', 'memo'));

ALTER TABLE interview_sessions
  ADD COLUMN answer_memo JSONB;

COMMENT ON COLUMN interview_configs.pillars IS '質問の柱（取り込み形式のJSON）';
COMMENT ON COLUMN interview_configs.pillars_version IS '柱を保存した回数（回答メモとの対応づけ用）';
COMMENT ON COLUMN interview_configs.question_engine IS 'classic=従来 / memo=回答メモ方式';
COMMENT ON COLUMN interview_sessions.answer_memo IS '回答メモ（聞きたい点ごとの回答状況）';
