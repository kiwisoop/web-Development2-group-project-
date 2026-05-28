import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.sql.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;

/**
 * K리그 데이터 수집기 (TheSportsDB API → Oracle DB)
 *
 * 의존성 (Maven):
 *   <dependency>
 *       <groupId>com.fasterxml.jackson.core</groupId>
 *       <artifactId>jackson-databind</artifactId>
 *       <version>2.17.0</version>
 *   </dependency>
 *   <dependency>
 *       <groupId>com.oracle.database.jdbc</groupId>
 *       <artifactId>ojdbc11</artifactId>
 *       <version>23.4.0.24.05</version>
 *   </dependency>
 */
public class KLeagueDataCollector {

    // ==================== 설정 ====================
    private static final String API_KEY   = "0812281435"; // 사용하기 전 API 키 변경 후 실행
    private static final String LEAGUE_ID = "4689";
    private static final List<String> SEASONS = List.of("2025", "2026");

    private static final String DB_USER     = "soccer";   // 사용하기 전 자신의 DB 계정으로 변경 후 실행
    private static final String DB_PASSWORD = "Soccer123!";
    private static final String DB_URL      = "jdbc:oracle:thin:@localhost:1521/freepdb1";

    private static final String BASE_URL =
            "https://www.thesportsdb.com/api/v1/json/" + API_KEY;
    // ===============================================

    private static final HttpClient HTTP_CLIENT = HttpClient.newHttpClient();
    private static final ObjectMapper MAPPER     = new ObjectMapper();

    // ──────────────────────────────────────────────
    // DB 연결
    // ──────────────────────────────────────────────
    private static Connection getConnection() throws SQLException {
        return DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD);
    }

    // ──────────────────────────────────────────────
    // HTTP GET → JsonNode
    // ──────────────────────────────────────────────
    private static JsonNode fetchJson(String url) throws IOException, InterruptedException {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .GET()
                .build();
        HttpResponse<String> response =
                HTTP_CLIENT.send(request, HttpResponse.BodyHandlers.ofString());
        return MAPPER.readTree(response.body());
    }

    // ──────────────────────────────────────────────
    // 테이블 초기화
    // ──────────────────────────────────────────────
    public static void initTables() {
        System.out.println("테이블 초기화 중...");
        try (Connection conn = getConnection();
             Statement stmt = conn.createStatement()) {

            for (String tbl : new String[]{"STANDINGS", "FIXTURES", "TEAMS"}) {
                try {
                    stmt.execute("DROP TABLE " + tbl + " CASCADE CONSTRAINTS");
                } catch (SQLException ignored) {
                    // 테이블이 존재하지 않으면 무시
                }
            }

            stmt.execute("""
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
            """);

            stmt.execute("""
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
            """);

            stmt.execute("""
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
            """);

            conn.commit();
            System.out.println("  → 테이블 준비 완료\n");

        } catch (SQLException e) {
            System.err.println("테이블 초기화 실패: " + e.getMessage());
        }
    }

    // ──────────────────────────────────────────────
    // 1. 팀 데이터
    // ──────────────────────────────────────────────
    public static void fetchAndSaveTeams() {
        System.out.println("팀 데이터 수집 중...");
        try {
            String url = BASE_URL + "/search_all_teams.php?l=South+Korean+K+League+1";
            JsonNode data = fetchJson(url);
            JsonNode teams = data.get("teams");

            if (teams == null || teams.isNull()) {
                System.out.println("  → 팀 데이터 없음\n");
                return;
            }

            try (Connection conn = getConnection()) {
                conn.setAutoCommit(false);

                String checkSql  = "SELECT COUNT(*) FROM TEAMS WHERE TEAM_ID = ?";
                String updateSql = """
                    UPDATE TEAMS SET
                        TEAM_NAME=?, TEAM_NAME_KR=?, SHORT_NAME=?,
                        STADIUM=?, CITY=?, FOUNDED=?,
                        LOGO_URL=?, BANNER_URL=?, TEAM_DESC=?
                    WHERE TEAM_ID=?
                """;
                String insertSql = """
                    INSERT INTO TEAMS
                        (TEAM_ID, TEAM_NAME, TEAM_NAME_KR, SHORT_NAME,
                         STADIUM, CITY, FOUNDED, LOGO_URL, BANNER_URL, TEAM_DESC)
                    VALUES (?,?,?,?,?,?,?,?,?,?)
                """;

                for (JsonNode team : teams) {
                    String teamId     = text(team, "idTeam");
                    String teamName   = text(team, "strTeam");
                    String teamNameKr = text(team, "strTeamAlternate");
                    String shortName  = text(team, "strTeamShort");
                    String stadium    = text(team, "strStadium");
                    String city       = text(team, "strCity");
                    String founded    = text(team, "intFormedYear");
                    String logoUrl    = text(team, "strTeamBadge");
                    String bannerUrl  = text(team, "strTeamBanner");
                    String teamDesc   = text(team, "strDescriptionEN");

                    try (PreparedStatement checkStmt = conn.prepareStatement(checkSql)) {
                        checkStmt.setString(1, teamId);
                        ResultSet rs = checkStmt.executeQuery();
                        rs.next();
                        boolean exists = rs.getInt(1) > 0;

                        if (exists) {
                            try (PreparedStatement ps = conn.prepareStatement(updateSql)) {
                                ps.setString(1, teamName);
                                ps.setString(2, teamNameKr);
                                ps.setString(3, shortName);
                                ps.setString(4, stadium);
                                ps.setString(5, city);
                                ps.setString(6, founded);
                                ps.setString(7, logoUrl);
                                ps.setString(8, bannerUrl);
                                ps.setString(9, teamDesc);
                                ps.setString(10, teamId);
                                ps.executeUpdate();
                            }
                        } else {
                            try (PreparedStatement ps = conn.prepareStatement(insertSql)) {
                                ps.setString(1, teamId);
                                ps.setString(2, teamName);
                                ps.setString(3, teamNameKr);
                                ps.setString(4, shortName);
                                ps.setString(5, stadium);
                                ps.setString(6, city);
                                ps.setString(7, founded);
                                ps.setString(8, logoUrl);
                                ps.setString(9, bannerUrl);
                                ps.setString(10, teamDesc);
                                ps.executeUpdate();
                            }
                        }
                    }
                }

                conn.commit();
                System.out.println("  → " + teams.size() + "개 팀 저장 완료\n");
            }

        } catch (Exception e) {
            System.err.println("팀 데이터 저장 실패: " + e.getMessage());
        }
    }

    // ──────────────────────────────────────────────
    // 2. 경기 데이터 (종료 + 예정 전체)
    // ──────────────────────────────────────────────
    public static void fetchAndSaveFixtures(String season) {
        System.out.println("[" + season + "] 경기 데이터 수집 중...");
        try {
            String url = BASE_URL + "/eventsseason.php?id=" + LEAGUE_ID + "&s=" + season;
            JsonNode data = fetchJson(url);
            JsonNode events = data.get("events");

            if (events == null || events.isNull()) {
                System.out.println("  → [" + season + "] 경기 데이터 없음\n");
                return;
            }

            try (Connection conn = getConnection()) {
                conn.setAutoCommit(false);

                String checkSql  = "SELECT COUNT(*) FROM FIXTURES WHERE FIXTURE_ID = ?";
                String updateSql = """
                    UPDATE FIXTURES SET
                        SEASON=?, LEAGUE_ID=?, LEAGUE_NAME=?, ROUND=?,
                        MATCH_DATE=?, MATCH_DATE_STR=?, STATUS=?,
                        HOME_TEAM_ID=?, HOME_TEAM_NAME=?,
                        AWAY_TEAM_ID=?, AWAY_TEAM_NAME=?,
                        HOME_SCORE=?, AWAY_SCORE=?,
                        VENUE=?, SPECTATORS=?, THUMBNAIL_URL=?
                    WHERE FIXTURE_ID=?
                """;
                String insertSql = """
                    INSERT INTO FIXTURES
                        (FIXTURE_ID, SEASON, LEAGUE_ID, LEAGUE_NAME, ROUND,
                         MATCH_DATE, MATCH_DATE_STR, STATUS,
                         HOME_TEAM_ID, HOME_TEAM_NAME,
                         AWAY_TEAM_ID, AWAY_TEAM_NAME,
                         HOME_SCORE, AWAY_SCORE,
                         VENUE, SPECTATORS, THUMBNAIL_URL)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
                """;

                int saved = 0, finished = 0;
                DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

                for (JsonNode event : events) {
                    String fixtureId  = text(event, "idEvent");
                    String leagueId   = text(event, "idLeague");
                    String leagueName = text(event, "strLeague");
                    String roundNo    = text(event, "intRound");
                    String dateStr    = text(event, "dateEvent");
                    String timeStr    = text(event, "strTime");
                    if (timeStr == null || timeStr.isBlank()) timeStr = "00:00:00";
                    String homeTeamId = text(event, "idHomeTeam");
                    String homeName   = text(event, "strHomeTeam");
                    String awayTeamId = text(event, "idAwayTeam");
                    String awayName   = text(event, "strAwayTeam");
                    String homeScore  = text(event, "intHomeScore");
                    String awayScore  = text(event, "intAwayScore");
                    String venue      = text(event, "strVenue");
                    String spectators = text(event, "intSpectators");
                    String thumbnail  = text(event, "strThumb");

                    Timestamp matchDate = null;
                    if (dateStr != null && !dateStr.isBlank()) {
                        try {
                            String dtStr = dateStr + " " + timeStr.substring(0, 8);
                            LocalDateTime ldt = LocalDateTime.parse(dtStr, dtf);
                            matchDate = Timestamp.valueOf(ldt);
                        } catch (DateTimeParseException ignored) {}
                    }

                    String status = (homeScore != null && !homeScore.isBlank()) ? "FT" : "NS";
                    if ("FT".equals(status)) finished++;

                    try (PreparedStatement checkStmt = conn.prepareStatement(checkSql)) {
                        checkStmt.setString(1, fixtureId);
                        ResultSet rs = checkStmt.executeQuery();
                        rs.next();
                        boolean exists = rs.getInt(1) > 0;

                        if (exists) {
                            try (PreparedStatement ps = conn.prepareStatement(updateSql)) {
                                ps.setString(1, season);
                                ps.setString(2, leagueId);
                                ps.setString(3, leagueName);
                                ps.setString(4, roundNo);
                                ps.setTimestamp(5, matchDate);
                                ps.setString(6, dateStr);
                                ps.setString(7, status);
                                ps.setString(8, homeTeamId);
                                ps.setString(9, homeName);
                                ps.setString(10, awayTeamId);
                                ps.setString(11, awayName);
                                ps.setString(12, homeScore);
                                ps.setString(13, awayScore);
                                ps.setString(14, venue);
                                ps.setString(15, spectators);
                                ps.setString(16, thumbnail);
                                ps.setString(17, fixtureId);
                                ps.executeUpdate();
                            }
                        } else {
                            try (PreparedStatement ps = conn.prepareStatement(insertSql)) {
                                ps.setString(1, fixtureId);
                                ps.setString(2, season);
                                ps.setString(3, leagueId);
                                ps.setString(4, leagueName);
                                ps.setString(5, roundNo);
                                ps.setTimestamp(6, matchDate);
                                ps.setString(7, dateStr);
                                ps.setString(8, status);
                                ps.setString(9, homeTeamId);
                                ps.setString(10, homeName);
                                ps.setString(11, awayTeamId);
                                ps.setString(12, awayName);
                                ps.setString(13, homeScore);
                                ps.setString(14, awayScore);
                                ps.setString(15, venue);
                                ps.setString(16, spectators);
                                ps.setString(17, thumbnail);
                                ps.executeUpdate();
                            }
                        }
                        saved++;
                    }
                }

                conn.commit();
                int upcoming = saved - finished;
                System.out.println("  → 총 " + saved + "경기 저장 "
                        + "(종료: " + finished + "경기 / 예정: " + upcoming + "경기)\n");
            }

        } catch (Exception e) {
            System.err.println("[" + season + "] 경기 데이터 저장 실패: " + e.getMessage());
        }
    }

    // ──────────────────────────────────────────────
    // 3. 순위 데이터
    // ──────────────────────────────────────────────
    public static void fetchAndSaveStandings(String season) {
        System.out.println("[" + season + "] 순위 데이터 수집 중...");
        try {
            String url = BASE_URL + "/lookuptable.php?l=" + LEAGUE_ID + "&s=" + season;
            JsonNode data = fetchJson(url);
            JsonNode table = data.get("table");

            if (table == null || table.isNull()) {
                System.out.println("  → [" + season + "] 순위 데이터 없음\n");
                return;
            }

            String insertSql = """
                INSERT INTO STANDINGS
                    (LEAGUE_ID, SEASON, TEAM_ID, TEAM_NAME, RANK,
                     PLAYED, WINS, DRAWS, LOSSES,
                     GOALS_FOR, GOALS_AGAINST, GOAL_DIFF,
                     POINTS, STANDING_DESC)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            """;

            try (Connection conn = getConnection()) {
                conn.setAutoCommit(false);

                try (PreparedStatement delStmt = conn.prepareStatement(
                        "DELETE FROM STANDINGS WHERE LEAGUE_ID=? AND SEASON=?")) {
                    delStmt.setString(1, LEAGUE_ID);
                    delStmt.setString(2, season);
                    delStmt.executeUpdate();
                }

                for (JsonNode row : table) {
                    try (PreparedStatement ps = conn.prepareStatement(insertSql)) {
                        ps.setString(1, LEAGUE_ID);
                        ps.setString(2, season);
                        ps.setString(3, text(row, "idTeam"));
                        ps.setString(4, text(row, "strTeam"));
                        setInt(ps, 5, text(row, "intRank"));
                        setInt(ps, 6, text(row, "intPlayed"));
                        setInt(ps, 7, text(row, "intWin"));
                        setInt(ps, 8, text(row, "intDraw"));
                        setInt(ps, 9, text(row, "intLoss"));
                        setInt(ps, 10, text(row, "intGoalsFor"));
                        setInt(ps, 11, text(row, "intGoalsAgainst"));
                        setInt(ps, 12, text(row, "intGoalDifference"));
                        setInt(ps, 13, text(row, "intPoints"));
                        ps.setString(14, text(row, "strDescription"));
                        ps.executeUpdate();
                    }
                }

                conn.commit();
                System.out.println("  → " + table.size() + "개 팀 순위 저장 완료\n");
            }

        } catch (Exception e) {
            System.err.println("[" + season + "] 순위 데이터 저장 실패: " + e.getMessage());
        }
    }

    // ──────────────────────────────────────────────
    // 유틸: JsonNode에서 문자열 추출 (null-safe)
    // ──────────────────────────────────────────────
    private static String text(JsonNode node, String field) {
        JsonNode v = node.get(field);
        if (v == null || v.isNull()) return null;
        String s = v.asText("").trim();
        return s.isEmpty() ? null : s;
    }

    // 유틸: String → int, null이면 NULL 세팅
    private static void setInt(PreparedStatement ps, int idx, String val) throws SQLException {
        if (val == null) {
            ps.setNull(idx, Types.INTEGER);
        } else {
            try {
                ps.setInt(idx, Integer.parseInt(val));
            } catch (NumberFormatException e) {
                ps.setNull(idx, Types.INTEGER);
            }
        }
    }

    // ──────────────────────────────────────────────
    // 메인 실행
    // ──────────────────────────────────────────────
    public static void main(String[] args) {
        System.out.println("=============================================");
        System.out.println("  K리그 데이터 수집 (TheSportsDB 프리미엄)");
        System.out.println("  2025 ~ 2026 시즌");
        System.out.println("=============================================\n");

        initTables();
        fetchAndSaveTeams();

        for (String season : SEASONS) {
            System.out.println("▶ " + season + " 시즌");
            System.out.println("----------------------------------------");
            fetchAndSaveFixtures(season);
            fetchAndSaveStandings(season);
        }

        System.out.println("=============================================");
        System.out.println("  완료!");
        System.out.println("=============================================");
    }
}
