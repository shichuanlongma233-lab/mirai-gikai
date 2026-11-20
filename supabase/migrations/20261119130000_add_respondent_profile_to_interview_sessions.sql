-- 回答者の出身の国・地域（ISO 3166-1 alpha-2 または 'other'）と年代。市場調査の集計用。
-- 言語選択の直後に任意で答えてもらう（答えない場合は NULL）。
ALTER TABLE interview_sessions ADD COLUMN respondent_country TEXT;
ALTER TABLE interview_sessions ADD COLUMN respondent_age_range TEXT
  CHECK (respondent_age_range IN ('under20', '20s', '30s', '40s', '50s', '60plus'));

COMMENT ON COLUMN interview_sessions.respondent_country IS '回答者の出身の国・地域（集計用、任意）';
COMMENT ON COLUMN interview_sessions.respondent_age_range IS '回答者の年代（集計用、任意）';
