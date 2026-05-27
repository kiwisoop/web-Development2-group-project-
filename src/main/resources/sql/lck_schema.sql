-- ============================================================
-- LCK E-Sports Database Schema for Oracle 12c+
-- Web Development 2 Group Project - E-Sports Module
-- ============================================================
-- 주의: league, team, player, match_info 테이블은 JPA가 자동 생성합니다.
-- 이 스크립트는 LCK 전용 신규 테이블 5개를 생성합니다.
-- ============================================================

-- GAME: BO3/BO5 시리즈 내 개별 게임 기록
CREATE TABLE game (
    game_id         NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    match_id        NUMBER          NOT NULL,
    game_number     NUMBER(2,0)     NOT NULL,
    blue_team_id    NUMBER          NOT NULL,
    red_team_id     NUMBER          NOT NULL,
    winner_team_id  NUMBER,
    duration        NUMBER(6,0),                -- 게임 시간(초)
    CONSTRAINT fk_game_match  FOREIGN KEY (match_id)       REFERENCES match_info(id),
    CONSTRAINT fk_game_blue   FOREIGN KEY (blue_team_id)   REFERENCES team(id),
    CONSTRAINT fk_game_red    FOREIGN KEY (red_team_id)    REFERENCES team(id),
    CONSTRAINT fk_game_winner FOREIGN KEY (winner_team_id) REFERENCES team(id)
);

COMMENT ON TABLE  game             IS 'BO3/BO5 시리즈 내 개별 게임';
COMMENT ON COLUMN game.game_id     IS '게임 PK';
COMMENT ON COLUMN game.match_id    IS '상위 매치 FK';
COMMENT ON COLUMN game.game_number IS '게임 순번 (1, 2, 3 ...)';
COMMENT ON COLUMN game.duration    IS '게임 시간(초)';

-- PLAYER_GAME_STAT: 게임별 선수 개인 통계
CREATE TABLE player_game_stat (
    stat_id             NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    game_id             NUMBER          NOT NULL,
    player_id           NUMBER          NOT NULL,
    champion_name       VARCHAR2(50 CHAR),
    kills               NUMBER(3,0)     DEFAULT 0,
    deaths              NUMBER(3,0)     DEFAULT 0,
    assists             NUMBER(3,0)     DEFAULT 0,
    cs                  NUMBER(5,0)     DEFAULT 0,      -- 미니언 + 몬스터
    gold                NUMBER(7,0)     DEFAULT 0,      -- 총 획득 골드
    damage              NUMBER(9,0)     DEFAULT 0,      -- 챔피언 대상 딜량
    vision_score        NUMBER(5,0)     DEFAULT 0,
    dpm                 NUMBER(10,2)    DEFAULT 0,      -- 분당 딜량
    team_damage_ratio   NUMBER(5,2)     DEFAULT 0,      -- 팀 내 딜 비율(%)
    CONSTRAINT fk_pgs_game   FOREIGN KEY (game_id)   REFERENCES game(game_id),
    CONSTRAINT fk_pgs_player FOREIGN KEY (player_id) REFERENCES player(id)
);

COMMENT ON TABLE  player_game_stat                   IS '게임별 선수 통계 (KDA, CS, 골드, 딜, 시야)';
COMMENT ON COLUMN player_game_stat.dpm               IS '분당 딜량';
COMMENT ON COLUMN player_game_stat.team_damage_ratio IS '팀 전체 딜 중 해당 선수 비율(%)';

-- TEAM_GAME_STAT: 게임별 팀 오브젝트 획득 통계
CREATE TABLE team_game_stat (
    stat_id         NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    game_id         NUMBER      NOT NULL,
    team_id         NUMBER      NOT NULL,
    tower_kills     NUMBER(3,0) DEFAULT 0,
    dragon_kills    NUMBER(3,0) DEFAULT 0,
    baron_kills     NUMBER(3,0) DEFAULT 0,
    herald_kills    NUMBER(3,0) DEFAULT 0,
    void_grub_kills NUMBER(3,0) DEFAULT 0,  -- 공허 유충
    total_gold      NUMBER(7,0) DEFAULT 0,
    total_kills     NUMBER(3,0) DEFAULT 0,
    CONSTRAINT fk_tgs_game FOREIGN KEY (game_id) REFERENCES game(game_id),
    CONSTRAINT fk_tgs_team FOREIGN KEY (team_id) REFERENCES team(id)
);

COMMENT ON TABLE  team_game_stat                  IS '게임별 팀 오브젝트 기록';
COMMENT ON COLUMN team_game_stat.void_grub_kills  IS '공허 유충 처치 수';

-- TIMELINE_EVENT: 게임 내 타임라인 주요 사건 기록
CREATE TABLE timeline_event (
    event_id    NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    game_id     NUMBER          NOT NULL,
    event_time  NUMBER(6,0)     NOT NULL,    -- 게임 시작 후 경과 시간(초)
    event_type  VARCHAR2(50 CHAR) NOT NULL,  -- KILL, DRAGON, BARON, HERALD, TOWER, VOID_GRUB, ACE 등
    team_id     NUMBER,
    player_id   NUMBER,
    description VARCHAR2(500 CHAR),
    CONSTRAINT fk_te_game   FOREIGN KEY (game_id)   REFERENCES game(game_id),
    CONSTRAINT fk_te_team   FOREIGN KEY (team_id)   REFERENCES team(id),
    CONSTRAINT fk_te_player FOREIGN KEY (player_id) REFERENCES player(id)
);

COMMENT ON TABLE  timeline_event            IS '게임 내 타임라인 이벤트';
COMMENT ON COLUMN timeline_event.event_time IS '게임 시작 기준 경과 시간(초)';
COMMENT ON COLUMN timeline_event.event_type IS 'KILL|DRAGON|BARON|HERALD|TOWER|VOID_GRUB|ACE|FIRST_BLOOD';

-- ANALYSIS_RESULT: 게임별 AI/분석 결과
CREATE TABLE analysis_result (
    analysis_id      NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    game_id          NUMBER          NOT NULL,
    summary          CLOB,
    key_player_id    NUMBER,
    team_fight_score NUMBER(5,2)     DEFAULT 0,  -- 팀파이트 점수 (10점 만점)
    objective_score  NUMBER(5,2)     DEFAULT 0,  -- 오브젝트 점수 (10점 만점)
    created_at       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ar_game   FOREIGN KEY (game_id)       REFERENCES game(game_id),
    CONSTRAINT fk_ar_player FOREIGN KEY (key_player_id) REFERENCES player(id)
);

COMMENT ON TABLE  analysis_result                  IS '게임 분석 결과 (AI 요약, 핵심 선수, 점수)';
COMMENT ON COLUMN analysis_result.team_fight_score IS '팀파이트 기여도 점수 (0~10)';
COMMENT ON COLUMN analysis_result.objective_score  IS '오브젝트 장악 점수 (0~10)';

-- ============================================================
-- 기존 테이블 컬럼 추가 (ALTER)
-- ============================================================

-- match_info 테이블에 winner_team_id 컬럼 추가 (이미 존재하면 무시)
ALTER TABLE match_info ADD (winner_team_id NUMBER);
ALTER TABLE match_info ADD CONSTRAINT fk_match_winner FOREIGN KEY (winner_team_id) REFERENCES team(id);

-- player 테이블에 nationality 컬럼 추가 (이미 존재하면 무시)
ALTER TABLE player ADD (nationality VARCHAR2(10 CHAR));

-- ============================================================
-- 관계 구조
-- LEAGUE  1 ─ N  match_info
-- TEAM    1 ─ N  player
-- match_info 1 ─ N  game
-- game    1 ─ N  player_game_stat
-- game    1 ─ N  team_game_stat
-- game    1 ─ N  timeline_event
-- game    1 ─ N  analysis_result
-- ============================================================
