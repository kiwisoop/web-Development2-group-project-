import requests
import oracledb
from datetime import datetime

# ==================== 설정 ====================
API_KEY     = "********" # 사용하기전 API키 변경 후 실행
LEAGUE_ID   = "4689"
SEASONS     = ["2025", "2026"]

DB_USER     = "soccer" # 사용하기전 자신의 DB 계정으로 변경 후 실행
DB_PASSWORD = "Soccer123!"
DB_DSN      = "localhost:1521/freepdb1"
BASE_URL    = f"https://www.thesportsdb.com/api/v1/json/{API_KEY}"
# ===============================================


def get_connection():
    return oracledb.connect(user=DB_USER, password=DB_PASSWORD, dsn=DB_DSN)


# ──────────────────────────────────────────────
# 테이블 초기화
# ──────────────────────────────────────────────
def init_tables():
    print("테이블 초기화 중...")
    conn   = get_connection()
    cursor = conn.cursor()

    for tbl in ["STANDINGS", "FIXTURES", "TEAMS"]:
        try:
            cursor.execute(f"DROP TABLE {tbl} CASCADE CONSTRAINTS")
        except:
            pass

    cursor.execute("""
        CREATE TABLE TEAMS (
            TEAM_ID       VARCHAR2(20)  PRIMARY KEY,
            TEAM_NAME     VARCHAR2(100),
            TEAM_NAME_KR  VARCHAR2(100),
            SHORT_NAME    VARCHAR2(50),
            STADIUM       VARCHAR2(100),
            CITY          VARCHAR2(100),
            FOUNDED       VARCHAR2(10),
            LOGO_URL      VARCHAR2(500),
            BANNER_URL    VARCHAR2(500),
            TEAM_DESC     CLOB
        )
    """)

    cursor.execute("""
        CREATE TABLE FIXTURES (
            FIXTURE_ID      VARCHAR2(20)  PRIMARY KEY,
            SEASON          VARCHAR2(10),
            LEAGUE_ID       VARCHAR2(20),
            LEAGUE_NAME     VARCHAR2(100),
            ROUND           VARCHAR2(50),
            MATCH_DATE      DATE,
            MATCH_DATE_STR  VARCHAR2(30),
            STATUS          VARCHAR2(20),
            HOME_TEAM_ID    VARCHAR2(20),
            HOME_TEAM_NAME  VARCHAR2(100),
            AWAY_TEAM_ID    VARCHAR2(20),
            AWAY_TEAM_NAME  VARCHAR2(100),
            HOME_SCORE      VARCHAR2(10),
            AWAY_SCORE      VARCHAR2(10),
            VENUE           VARCHAR2(100),
            SPECTATORS      VARCHAR2(20),
            THUMBNAIL_URL   VARCHAR2(500)
        )
    """)

    cursor.execute("""
        CREATE TABLE STANDINGS (
            STANDING_ID   NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
            LEAGUE_ID     VARCHAR2(20),
            SEASON        VARCHAR2(10),
            TEAM_ID       VARCHAR2(20),
            TEAM_NAME     VARCHAR2(100),
            RANK          NUMBER,
            PLAYED        NUMBER,
            WINS          NUMBER,
            DRAWS         NUMBER,
            LOSSES        NUMBER,
            GOALS_FOR     NUMBER,
            GOALS_AGAINST NUMBER,
            GOAL_DIFF     NUMBER,
            POINTS        NUMBER,
            STANDING_DESC VARCHAR2(200)
        )
    """)

    conn.commit()
    cursor.close()
    conn.close()
    print("  → 테이블 준비 완료\n")


# ──────────────────────────────────────────────
# 1. 팀 데이터
# ──────────────────────────────────────────────
def fetch_and_save_teams():
    print("팀 데이터 수집 중...")
    res  = requests.get(f"{BASE_URL}/search_all_teams.php",
                        params={"l": "South Korean K League 1"})
    data = res.json()

    if not data.get("teams"):
        print("  → 팀 데이터 없음\n")
        return

    conn   = get_connection()
    cursor = conn.cursor()

    for team in data["teams"]:
        team_id      = team.get("idTeam")
        team_name    = team.get("strTeam")
        team_name_kr = team.get("strTeamAlternate")
        short_name   = team.get("strTeamShort")
        stadium      = team.get("strStadium")
        city         = team.get("strCity")
        founded      = team.get("intFormedYear")
        logo_url     = team.get("strTeamBadge")
        banner_url   = team.get("strTeamBanner")
        team_desc    = team.get("strDescriptionEN")

        cursor.execute(
            "SELECT COUNT(*) FROM TEAMS WHERE TEAM_ID = :1", [team_id])
        exists = cursor.fetchone()[0]

        if exists:
            cursor.execute("""
                UPDATE TEAMS SET
                    TEAM_NAME=:1, TEAM_NAME_KR=:2, SHORT_NAME=:3,
                    STADIUM=:4, CITY=:5, FOUNDED=:6,
                    LOGO_URL=:7, BANNER_URL=:8, TEAM_DESC=:9
                WHERE TEAM_ID=:10
            """, [team_name, team_name_kr, short_name,
                  stadium, city, founded,
                  logo_url, banner_url, team_desc, team_id])
        else:
            cursor.execute("""
                INSERT INTO TEAMS
                    (TEAM_ID, TEAM_NAME, TEAM_NAME_KR, SHORT_NAME,
                     STADIUM, CITY, FOUNDED, LOGO_URL, BANNER_URL, TEAM_DESC)
                VALUES (:1,:2,:3,:4,:5,:6,:7,:8,:9,:10)
            """, [team_id, team_name, team_name_kr, short_name,
                  stadium, city, founded,
                  logo_url, banner_url, team_desc])

    conn.commit()
    cursor.close()
    conn.close()
    print(f"  → {len(data['teams'])}개 팀 저장 완료\n")


# ──────────────────────────────────────────────
# 2. 경기 데이터 (종료 + 예정 전체)
# ──────────────────────────────────────────────
def fetch_and_save_fixtures(season):
    print(f"[{season}] 경기 데이터 수집 중...")
    res  = requests.get(f"{BASE_URL}/eventsseason.php",
                        params={"id": LEAGUE_ID, "s": season})
    data = res.json()

    if not data.get("events"):
        print(f"  → [{season}] 경기 데이터 없음\n")
        return

    conn   = get_connection()
    cursor = conn.cursor()

    saved = 0
    for event in data["events"]:
        fixture_id   = event.get("idEvent")
        league_id    = event.get("idLeague")
        league_name  = event.get("strLeague")
        round_no     = event.get("intRound")
        date_str     = event.get("dateEvent")
        time_str     = event.get("strTime") or "00:00:00"
        home_team_id = event.get("idHomeTeam")
        home_name    = event.get("strHomeTeam")
        away_team_id = event.get("idAwayTeam")
        away_name    = event.get("strAwayTeam")
        home_score   = event.get("intHomeScore")
        away_score   = event.get("intAwayScore")
        venue        = event.get("strVenue")
        spectators   = event.get("intSpectators")
        thumbnail    = event.get("strThumb")

        match_date = None
        if date_str:
            try:
                dt_str     = f"{date_str} {time_str[:8]}"
                match_date = datetime.strptime(dt_str, "%Y-%m-%d %H:%M:%S")
            except:
                pass

        status = "FT" if (home_score not in [None, ""]) else "NS"

        cursor.execute(
            "SELECT COUNT(*) FROM FIXTURES WHERE FIXTURE_ID = :1",
            [fixture_id])
        exists = cursor.fetchone()[0]

        if exists:
            cursor.execute("""
                UPDATE FIXTURES SET
                    SEASON=:1, LEAGUE_ID=:2, LEAGUE_NAME=:3, ROUND=:4,
                    MATCH_DATE=:5, MATCH_DATE_STR=:6, STATUS=:7,
                    HOME_TEAM_ID=:8, HOME_TEAM_NAME=:9,
                    AWAY_TEAM_ID=:10, AWAY_TEAM_NAME=:11,
                    HOME_SCORE=:12, AWAY_SCORE=:13,
                    VENUE=:14, SPECTATORS=:15, THUMBNAIL_URL=:16
                WHERE FIXTURE_ID=:17
            """, [season, league_id, league_name, round_no,
                  match_date, date_str, status,
                  home_team_id, home_name,
                  away_team_id, away_name,
                  home_score, away_score,
                  venue, spectators, thumbnail,
                  fixture_id])
        else:
            cursor.execute("""
                INSERT INTO FIXTURES
                    (FIXTURE_ID, SEASON, LEAGUE_ID, LEAGUE_NAME, ROUND,
                     MATCH_DATE, MATCH_DATE_STR, STATUS,
                     HOME_TEAM_ID, HOME_TEAM_NAME,
                     AWAY_TEAM_ID, AWAY_TEAM_NAME,
                     HOME_SCORE, AWAY_SCORE,
                     VENUE, SPECTATORS, THUMBNAIL_URL)
                VALUES
                    (:1,:2,:3,:4,:5,:6,:7,:8,:9,:10,
                     :11,:12,:13,:14,:15,:16,:17)
            """, [fixture_id, season, league_id, league_name, round_no,
                  match_date, date_str, status,
                  home_team_id, home_name,
                  away_team_id, away_name,
                  home_score, away_score,
                  venue, spectators, thumbnail])
        saved += 1

    conn.commit()
    cursor.close()
    conn.close()

    finished = sum(1 for e in data["events"]
                   if e.get("intHomeScore") not in [None, ""])
    upcoming = len(data["events"]) - finished
    print(f"  → 총 {saved}경기 저장 "
          f"(종료: {finished}경기 / 예정: {upcoming}경기)\n")


# ──────────────────────────────────────────────
# 3. 순위 데이터
# ──────────────────────────────────────────────
def fetch_and_save_standings(season):
    print(f"[{season}] 순위 데이터 수집 중...")
    res  = requests.get(f"{BASE_URL}/lookuptable.php",
                        params={"l": LEAGUE_ID, "s": season})
    data = res.json()

    if not data.get("table"):
        print(f"  → [{season}] 순위 데이터 없음\n")
        return

    conn   = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "DELETE FROM STANDINGS WHERE LEAGUE_ID=:1 AND SEASON=:2",
        [LEAGUE_ID, season])

    for row in data["table"]:
        cursor.execute("""
            INSERT INTO STANDINGS
                (LEAGUE_ID, SEASON, TEAM_ID, TEAM_NAME, RANK,
                 PLAYED, WINS, DRAWS, LOSSES,
                 GOALS_FOR, GOALS_AGAINST, GOAL_DIFF,
                 POINTS, STANDING_DESC)
            VALUES
                (:1,:2,:3,:4,:5,:6,:7,:8,:9,:10,:11,:12,:13,:14)
        """, [
            LEAGUE_ID, season,
            row.get("idTeam"),
            row.get("strTeam"),
            row.get("intRank"),
            row.get("intPlayed"),
            row.get("intWin"),
            row.get("intDraw"),
            row.get("intLoss"),
            row.get("intGoalsFor"),
            row.get("intGoalsAgainst"),
            row.get("intGoalDifference"),
            row.get("intPoints"),
            row.get("strDescription")
        ])

    conn.commit()
    cursor.close()
    conn.close()
    print(f"  → {len(data['table'])}개 팀 순위 저장 완료\n")


# ──────────────────────────────────────────────
# 메인 실행
# ──────────────────────────────────────────────
if __name__ == "__main__":
    print("=" * 45)
    print("  K리그 데이터 수집 (TheSportsDB 프리미엄)")
    print("  2025 ~ 2026 시즌")
    print("=" * 45 + "\n")

    init_tables()
    fetch_and_save_teams()

    for season in SEASONS:
        print(f"▶ {season} 시즌")
        print("-" * 40)
        fetch_and_save_fixtures(season)
        fetch_and_save_standings(season)

    print("=" * 45)
    print("  완료!")
    print("=" * 45)