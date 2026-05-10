package com.team.sportsanalysis.mlb.records;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.team.sportsanalysis.mlb.MlbClient;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class MlbRecordsService {

    private final MlbClient client;
    private final ObjectMapper mapper = new ObjectMapper();

    private static final Map<String, String> HITTING_CATEGORIES = new LinkedHashMap<>();
    private static final Map<String, String> PITCHING_CATEGORIES = new LinkedHashMap<>();
    static {
        HITTING_CATEGORIES.put("battingAverage", "Batting Average");
        HITTING_CATEGORIES.put("homeRuns", "Home Runs");
        HITTING_CATEGORIES.put("runsBattedIn", "RBIs");
        HITTING_CATEGORIES.put("hits", "Hits");
        HITTING_CATEGORIES.put("stolenBases", "Stolen Bases");
        HITTING_CATEGORIES.put("onBasePlusSlugging", "OPS");

        PITCHING_CATEGORIES.put("earnedRunAverage", "ERA");
        PITCHING_CATEGORIES.put("wins", "Wins");
        PITCHING_CATEGORIES.put("strikeouts", "Strikeouts");
        PITCHING_CATEGORIES.put("saves", "Saves");
        PITCHING_CATEGORIES.put("walksAndHitsPerInningPitched", "WHIP");
    }

    public MlbRecordsService(MlbClient client) {
        this.client = client;
    }

    public List<MlbStandingTeam> getStandings(int season) {
        String json = client.fetchStandingsJson(season);
        List<MlbStandingTeam> result = new ArrayList<>();
        if (json == null || json.isBlank()) return result;
        try {
            JsonNode root = mapper.readTree(json);
            for (JsonNode rec : root.path("records")) {
                String league = rec.path("league").path("name").asText(null);
                String division = rec.path("division").path("name").asText(null);
                for (JsonNode tr : rec.path("teamRecords")) {
                    JsonNode team = tr.path("team");
                    Integer rs = optInt(tr.path("runsScored"));
                    Integer ra = optInt(tr.path("runsAllowed"));
                    Integer diff = (rs != null && ra != null) ? (rs - ra) : null;

                    String streak = tr.path("streak").path("streakCode").asText(null);
                    if (streak == null || streak.isBlank()) {
                        streak = tr.path("streak").path("streakNumber").asText(null);
                    }

                    result.add(MlbStandingTeam.builder()
                            .teamId(optLong(team.path("id")))
                            .teamName(team.path("name").asText(null))
                            .league(league)
                            .division(division)
                            .divisionRank(optInt(tr.path("divisionRank")))
                            .leagueRank(optInt(tr.path("leagueRank")))
                            .wins(optInt(tr.path("wins")))
                            .losses(optInt(tr.path("losses")))
                            .winningPercentage(tr.path("winningPercentage").asText(null))
                            .gamesBack(tr.path("gamesBack").asText(null))
                            .streak(streak)
                            .runsScored(rs)
                            .runsAllowed(ra)
                            .runDifferential(diff)
                            .build());
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse MLB standings: " + e.getMessage(), e);
        }
        return result;
    }

    public List<MlbTeamRecordCard> buildTeamRecordCards(List<MlbStandingTeam> standings) {
        List<MlbTeamRecordCard> cards = new ArrayList<>();
        if (standings == null || standings.isEmpty()) return cards;

        // Best winning %
        standings.stream()
                .filter(t -> t.getWinningPercentage() != null && !t.getWinningPercentage().isBlank())
                .max(Comparator.comparingDouble(t -> parseDoubleSafe(t.getWinningPercentage())))
                .ifPresent(t -> cards.add(MlbTeamRecordCard.builder()
                        .label("Best Winning %")
                        .teamName(t.getTeamName())
                        .teamId(t.getTeamId())
                        .value(t.getWinningPercentage())
                        .build()));

        // Most wins
        standings.stream()
                .filter(t -> t.getWins() != null)
                .max(Comparator.comparingInt(MlbStandingTeam::getWins))
                .ifPresent(t -> cards.add(MlbTeamRecordCard.builder()
                        .label("Most Wins")
                        .teamName(t.getTeamName())
                        .teamId(t.getTeamId())
                        .value(String.valueOf(t.getWins()))
                        .build()));

        // Best run differential
        standings.stream()
                .filter(t -> t.getRunDifferential() != null)
                .max(Comparator.comparingInt(MlbStandingTeam::getRunDifferential))
                .ifPresent(t -> {
                    int v = t.getRunDifferential();
                    String s = (v >= 0 ? "+" : "") + v;
                    cards.add(MlbTeamRecordCard.builder()
                            .label("Best Run Differential")
                            .teamName(t.getTeamName())
                            .teamId(t.getTeamId())
                            .value(s)
                            .build());
                });

        // Most runs scored
        standings.stream()
                .filter(t -> t.getRunsScored() != null)
                .max(Comparator.comparingInt(MlbStandingTeam::getRunsScored))
                .ifPresent(t -> cards.add(MlbTeamRecordCard.builder()
                        .label("Most Runs Scored")
                        .teamName(t.getTeamName())
                        .teamId(t.getTeamId())
                        .value(String.valueOf(t.getRunsScored()))
                        .build()));

        // Fewest runs allowed (best pitching/defense by RA)
        standings.stream()
                .filter(t -> t.getRunsAllowed() != null)
                .min(Comparator.comparingInt(MlbStandingTeam::getRunsAllowed))
                .ifPresent(t -> cards.add(MlbTeamRecordCard.builder()
                        .label("Fewest Runs Allowed")
                        .teamName(t.getTeamName())
                        .teamId(t.getTeamId())
                        .value(String.valueOf(t.getRunsAllowed()))
                        .build()));

        return cards;
    }

    public List<MlbLeaderGroup> getHittingLeaders(int season, int limit) {
        return getLeaders("hitting", HITTING_CATEGORIES, season, limit);
    }

    public List<MlbLeaderGroup> getPitchingLeaders(int season, int limit) {
        return getLeaders("pitching", PITCHING_CATEGORIES, season, limit);
    }

    private List<MlbLeaderGroup> getLeaders(String statGroup, Map<String, String> categories, int season, int limit) {
        List<MlbLeaderGroup> groups = new ArrayList<>();
        for (Map.Entry<String, String> e : categories.entrySet()) {
            try {
                String json = client.fetchStatLeadersJson(statGroup, e.getKey(), season, limit);
                groups.add(MlbLeaderGroup.builder()
                        .category(e.getKey())
                        .label(e.getValue())
                        .leaders(parseLeaders(json))
                        .build());
            } catch (Exception ex) {
                // keep other categories alive even if one call fails
                groups.add(MlbLeaderGroup.builder()
                        .category(e.getKey())
                        .label(e.getValue())
                        .leaders(new ArrayList<>())
                        .build());
            }
        }
        return groups;
    }

    private List<MlbStatLeader> parseLeaders(String json) {
        List<MlbStatLeader> result = new ArrayList<>();
        if (json == null || json.isBlank()) return result;
        try {
            JsonNode root = mapper.readTree(json);
            JsonNode categories = root.path("leagueLeaders");
            // The MLB API returns leagueLeaders[].leaders[] across multiple league rows.
            // To avoid duplicate-by-league rows, take the first non-empty entry.
            JsonNode chosen = null;
            for (JsonNode cat : categories) {
                JsonNode leaders = cat.path("leaders");
                if (leaders.isArray() && leaders.size() > 0) {
                    chosen = leaders;
                    break;
                }
            }
            if (chosen == null) return result;

            for (JsonNode l : chosen) {
                JsonNode person = l.path("person");
                JsonNode team = l.path("team");
                result.add(MlbStatLeader.builder()
                        .rank(optInt(l.path("rank")))
                        .playerId(optLong(person.path("id")))
                        .playerName(person.path("fullName").asText(null))
                        .teamId(optLong(team.path("id")))
                        .teamName(team.path("name").asText(null))
                        .value(l.path("value").asText(null))
                        .build());
            }
        } catch (Exception e) {
            // swallow parse errors for resilience
        }
        return result;
    }

    private static final List<String> BATTING_FIELDS = List.of(
            "avg", "runs", "hits", "homeRuns", "doubles", "triples",
            "stolenBases", "baseOnBalls", "strikeOuts", "obp", "slg", "ops"
    );
    private static final List<String> PITCHING_FIELDS = List.of(
            "era", "wins", "losses", "inningsPitched",
            "hits", "homeRuns", "baseOnBalls", "strikeOuts", "whip"
    );
    private static final List<String> FIELDING_FIELDS = List.of(
            "errors", "fielding"
    );

    // Aliases for cleaner frontend keys (MLB API uses some shared names like "hits" across groups).
    private static final Map<String, String> PITCHING_ALIAS = Map.of(
            "hits", "hitsAllowed",
            "homeRuns", "homeRunsAllowed",
            "baseOnBalls", "walksAllowed"
    );
    private static final Map<String, String> FIELDING_ALIAS = Map.of(
            "fielding", "fieldingPercentage"
    );

    public List<MlbTeamStatRow> getTeamStats(String group, int season) {
        String json;
        try {
            json = client.fetchTeamStatsJson(group, season);
        } catch (Exception e) {
            return new ArrayList<>();
        }
        return parseTeamStats(json, group);
    }

    public MlbTeamStatsDashboard buildTeamStatsDashboard(int season) {
        return MlbTeamStatsDashboard.builder()
                .season(season)
                .batting(getTeamStats("hitting", season))
                .pitching(getTeamStats("pitching", season))
                .fielding(getTeamStats("fielding", season))
                .build();
    }

    private List<MlbTeamStatRow> parseTeamStats(String json, String group) {
        List<MlbTeamStatRow> result = new ArrayList<>();
        if (json == null || json.isBlank()) return result;
        try {
            JsonNode root = mapper.readTree(json);
            JsonNode statsArr = root.path("stats");
            if (!statsArr.isArray() || statsArr.size() == 0) return result;

            JsonNode splits = statsArr.get(0).path("splits");
            if (!splits.isArray()) return result;

            List<String> fields;
            Map<String, String> alias;
            switch (group) {
                case "pitching":
                    fields = PITCHING_FIELDS;
                    alias = PITCHING_ALIAS;
                    break;
                case "fielding":
                    fields = FIELDING_FIELDS;
                    alias = FIELDING_ALIAS;
                    break;
                default:
                    fields = BATTING_FIELDS;
                    alias = Map.of();
            }

            int rank = 0;
            for (JsonNode split : splits) {
                rank++;
                JsonNode team = split.path("team");
                JsonNode stat = split.path("stat");

                Map<String, Object> values = new LinkedHashMap<>();
                for (String f : fields) {
                    JsonNode v = stat.path(f);
                    String outKey = alias.getOrDefault(f, f);
                    values.put(outKey, jsonValue(v));
                }

                result.add(MlbTeamStatRow.builder()
                        .rank(rank)
                        .teamId(optLong(team.path("id")))
                        .teamName(team.path("name").asText(null))
                        .stats(values)
                        .build());
            }
        } catch (Exception e) {
            // fall through with whatever we managed to parse
        }
        return result;
    }

    private static Object jsonValue(JsonNode n) {
        if (n == null || n.isMissingNode() || n.isNull()) return null;
        if (n.isInt() || n.isLong() || n.isShort()) return n.asLong();
        if (n.isDouble() || n.isFloat()) return n.asDouble();
        if (n.isBoolean()) return n.asBoolean();
        return n.asText(null);
    }

    public MlbRecordsDashboard buildDashboard(int season, int limit) {
        List<MlbStandingTeam> standings = getStandings(season);
        return MlbRecordsDashboard.builder()
                .season(season)
                .standings(standings)
                .teamRecordCards(buildTeamRecordCards(standings))
                .hittingLeaders(getHittingLeaders(season, limit))
                .pitchingLeaders(getPitchingLeaders(season, limit))
                .build();
    }

    private static double parseDoubleSafe(String s) {
        try { return Double.parseDouble(s); } catch (Exception e) { return Double.NEGATIVE_INFINITY; }
    }

    private static Integer optInt(JsonNode n) {
        if (n == null || n.isMissingNode() || n.isNull()) return null;
        if (n.isNumber()) return n.asInt();
        if (n.isTextual()) {
            try { return Integer.parseInt(n.asText()); } catch (Exception ignored) { return null; }
        }
        return null;
    }

    private static Long optLong(JsonNode n) {
        if (n == null || n.isMissingNode() || n.isNull()) return null;
        if (n.isNumber()) return n.asLong();
        if (n.isTextual()) {
            try { return Long.parseLong(n.asText()); } catch (Exception ignored) { return null; }
        }
        return null;
    }
}
