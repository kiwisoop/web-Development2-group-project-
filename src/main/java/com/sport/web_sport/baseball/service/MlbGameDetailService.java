package com.sport.web_sport.baseball.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.sport.web_sport.baseball.dto.response.*;
import com.sport.web_sport.common.type.SportType;
import com.sport.web_sport.sports.entity.Match;
import com.sport.web_sport.sports.entity.Team;
import com.sport.web_sport.sports.repository.MatchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MlbGameDetailService {

    private final MatchRepository matchRepository;
    private final MlbApiService mlbApiService;

    @Transactional(readOnly = true)
    public MlbGameDetailResponse getDetail(Long matchId) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new IllegalArgumentException("Match not found: " + matchId));

        if (match.getSportType() != SportType.BASEBALL
                || match.getExternalId() == null
                || !match.getExternalId().startsWith("MLB-")) {
            return null;
        }

        long gamePk = Long.parseLong(match.getExternalId().substring(4));

        JsonNode feed = mlbApiService.fetchGameFeedLive(gamePk);
        JsonNode boxscore = mlbApiService.fetchGameBoxscore(gamePk);
        JsonNode linescore = mlbApiService.fetchGameLinescore(gamePk);

        // --- feed/live: gameStatus + probablePitchers ---
        String gameStatus = "";
        String homeProbablePitcher = "-";
        String awayProbablePitcher = "-";
        if (feed != null) {
            JsonNode gameData = feed.path("gameData");
            gameStatus = gameData.path("status").path("detailedState").asText("");
            JsonNode prob = gameData.path("probablePitchers");
            homeProbablePitcher = prob.path("home").path("fullName").asText("-");
            awayProbablePitcher = prob.path("away").path("fullName").asText("-");
        }

        // --- linescore ---
        MlbLinescoreResponse linescoreResponse = linescore != null ? parseLinescore(linescore) : null;

        // --- boxscore ---
        List<MlbLineupPlayerResponse> homeLineup = List.of();
        List<MlbLineupPlayerResponse> awayLineup = List.of();
        List<MlbBatterStatResponse> homeBatters = List.of();
        List<MlbBatterStatResponse> awayBatters = List.of();
        List<MlbPitcherStatResponse> homePitchers = List.of();
        List<MlbPitcherStatResponse> awayPitchers = List.of();

        if (boxscore != null) {
            JsonNode bsTeams = boxscore.path("teams");
            homeLineup = parseLineup(bsTeams.path("home"));
            awayLineup = parseLineup(bsTeams.path("away"));
            homeBatters = parseBatterStats(bsTeams.path("home"));
            awayBatters = parseBatterStats(bsTeams.path("away"));
            homePitchers = parsePitcherStats(bsTeams.path("home"));
            awayPitchers = parsePitcherStats(bsTeams.path("away"));
        }

        Team homeTeam = match.getHomeTeam();
        Team awayTeam = match.getAwayTeam();

        return MlbGameDetailResponse.builder()
                .matchId(matchId)
                .gamePk(gamePk)
                .gameStatus(gameStatus)
                .homeTeamName(homeTeam != null ? homeTeam.getTeamName() : "")
                .awayTeamName(awayTeam != null ? awayTeam.getTeamName() : "")
                .homeTeamLogoUrl(homeTeam != null ? homeTeam.getLogoUrl() : null)
                .awayTeamLogoUrl(awayTeam != null ? awayTeam.getLogoUrl() : null)
                .homeTeamShortName(homeTeam != null ? homeTeam.getShortName() : "")
                .awayTeamShortName(awayTeam != null ? awayTeam.getShortName() : "")
                .homeProbablePitcher(homeProbablePitcher)
                .awayProbablePitcher(awayProbablePitcher)
                .linescore(linescoreResponse)
                .homeLineup(homeLineup)
                .awayLineup(awayLineup)
                .homeBatters(homeBatters)
                .awayBatters(awayBatters)
                .homePitchers(homePitchers)
                .awayPitchers(awayPitchers)
                .build();
    }

    private MlbLinescoreResponse parseLinescore(JsonNode linescore) {
        List<MlbInningScoreResponse> innings = new ArrayList<>();
        JsonNode inningsNode = linescore.path("innings");
        if (inningsNode.isArray()) {
            for (JsonNode inning : inningsNode) {
                JsonNode homeRuns = inning.path("home").path("runs");
                JsonNode awayRuns = inning.path("away").path("runs");
                innings.add(MlbInningScoreResponse.builder()
                        .inningNumber(inning.path("num").asInt())
                        .homeRuns(homeRuns.isMissingNode() || homeRuns.isNull() ? "X" : homeRuns.asText())
                        .awayRuns(awayRuns.isMissingNode() || awayRuns.isNull() ? "X" : awayRuns.asText())
                        .build());
            }
        }
        JsonNode teams = linescore.path("teams");
        return MlbLinescoreResponse.builder()
                .innings(innings)
                .currentInning(linescore.path("currentInning").asInt(0))
                .currentInningOrdinal(linescore.path("currentInningOrdinal").asText(""))
                .homeRuns(teams.path("home").path("runs").asInt(0))
                .homeHits(teams.path("home").path("hits").asInt(0))
                .homeErrors(teams.path("home").path("errors").asInt(0))
                .awayRuns(teams.path("away").path("runs").asInt(0))
                .awayHits(teams.path("away").path("hits").asInt(0))
                .awayErrors(teams.path("away").path("errors").asInt(0))
                .build();
    }

    private List<MlbLineupPlayerResponse> parseLineup(JsonNode teamNode) {
        List<MlbLineupPlayerResponse> result = new ArrayList<>();
        JsonNode batters = teamNode.path("batters");
        JsonNode players = teamNode.path("players");
        if (!batters.isArray()) return result;
        for (JsonNode idNode : batters) {
            JsonNode player = players.path("ID" + idNode.asInt());
            if (player.isMissingNode()) continue;
            int orderRaw = player.path("battingOrder").asInt(0);
            result.add(MlbLineupPlayerResponse.builder()
                    .battingOrder(orderRaw > 0 ? orderRaw / 100 : 0)
                    .fullName(player.path("person").path("fullName").asText("-"))
                    .position(player.path("position").path("abbreviation").asText("-"))
                    .jerseyNumber(player.path("jerseyNumber").asText("-"))
                    .build());
        }
        result.sort(Comparator.comparingInt(p -> p.getBattingOrder() == 0 ? 999 : p.getBattingOrder()));
        return result;
    }

    private List<MlbBatterStatResponse> parseBatterStats(JsonNode teamNode) {
        List<MlbBatterStatResponse> result = new ArrayList<>();
        JsonNode batters = teamNode.path("batters");
        JsonNode players = teamNode.path("players");
        if (!batters.isArray()) return result;
        for (JsonNode idNode : batters) {
            JsonNode player = players.path("ID" + idNode.asInt());
            if (player.isMissingNode()) continue;
            JsonNode stats = player.path("stats").path("batting");
            if (stats.isMissingNode()) continue;
            int orderRaw = player.path("battingOrder").asInt(0);
            result.add(MlbBatterStatResponse.builder()
                    .fullName(player.path("person").path("fullName").asText("-"))
                    .position(player.path("position").path("abbreviation").asText("-"))
                    .battingOrder(orderRaw > 0 ? orderRaw / 100 : 0)
                    .atBats(statStr(stats, "atBats"))
                    .runs(statStr(stats, "runs"))
                    .hits(statStr(stats, "hits"))
                    .rbi(statStr(stats, "rbi"))
                    .baseOnBalls(statStr(stats, "baseOnBalls"))
                    .strikeOuts(statStr(stats, "strikeOuts"))
                    .homeRuns(statStr(stats, "homeRuns"))
                    .doubles(statStr(stats, "doubles"))
                    .triples(statStr(stats, "triples"))
                    .build());
        }
        result.sort(Comparator.comparingInt(p -> p.getBattingOrder() == 0 ? 999 : p.getBattingOrder()));
        return result;
    }

    private List<MlbPitcherStatResponse> parsePitcherStats(JsonNode teamNode) {
        List<MlbPitcherStatResponse> result = new ArrayList<>();
        JsonNode pitchers = teamNode.path("pitchers");
        JsonNode players = teamNode.path("players");
        if (!pitchers.isArray()) return result;
        for (JsonNode idNode : pitchers) {
            JsonNode player = players.path("ID" + idNode.asInt());
            if (player.isMissingNode()) continue;
            JsonNode stats = player.path("stats").path("pitching");
            if (stats.isMissingNode()) continue;
            result.add(MlbPitcherStatResponse.builder()
                    .fullName(player.path("person").path("fullName").asText("-"))
                    .inningsPitched(statStr(stats, "inningsPitched"))
                    .hits(statStr(stats, "hits"))
                    .runs(statStr(stats, "runs"))
                    .earnedRuns(statStr(stats, "earnedRuns"))
                    .baseOnBalls(statStr(stats, "baseOnBalls"))
                    .strikeOuts(statStr(stats, "strikeOuts"))
                    .numberOfPitches(statStr(stats, "numberOfPitches"))
                    .era(statStr(stats, "era"))
                    .build());
        }
        return result;
    }

    @Transactional(readOnly = true)
    public MlbPlayByPlayResponse getPlayByPlay(Long matchId) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new IllegalArgumentException("Match not found: " + matchId));

        if (match.getSportType() != SportType.BASEBALL
                || match.getExternalId() == null
                || !match.getExternalId().startsWith("MLB-")) {
            return MlbPlayByPlayResponse.builder()
                    .matchId(matchId)
                    .gamePk(0)
                    .plays(List.of())
                    .build();
        }

        long gamePk = Long.parseLong(match.getExternalId().substring(4));
        JsonNode feed = mlbApiService.fetchGameFeedLive(gamePk);

        List<MlbPlayEventResponse> plays = new ArrayList<>();
        if (feed != null) {
            JsonNode allPlays = feed.path("liveData").path("plays").path("allPlays");
            if (allPlays.isArray()) {
                for (JsonNode play : allPlays) {
                    JsonNode about   = play.path("about");
                    JsonNode matchup = play.path("matchup");
                    JsonNode result  = play.path("result");
                    JsonNode count   = play.path("count");
                    plays.add(MlbPlayEventResponse.builder()
                            .inning(about.path("inning").asInt(0))
                            .halfInning(about.path("halfInning").asText(""))
                            .batterName(matchup.path("batter").path("fullName").asText(""))
                            .pitcherName(matchup.path("pitcher").path("fullName").asText(""))
                            .event(result.path("event").asText(""))
                            .description(result.path("description").asText(""))
                            .rbi(result.path("rbi").asInt(0))
                            .awayScore(result.path("awayScore").asInt(0))
                            .homeScore(result.path("homeScore").asInt(0))
                            .balls(count.path("balls").asInt(0))
                            .strikes(count.path("strikes").asInt(0))
                            .outs(count.path("outs").asInt(0))
                            .build());
                }
            }
        }

        return MlbPlayByPlayResponse.builder()
                .matchId(matchId)
                .gamePk(gamePk)
                .plays(plays)
                .build();
    }

    @Transactional(readOnly = true)
    public MlbPitchZoneResponse getPitchZone(Long matchId) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new IllegalArgumentException("Match not found: " + matchId));

        if (match.getSportType() != SportType.BASEBALL
                || match.getExternalId() == null
                || !match.getExternalId().startsWith("MLB-")) {
            return MlbPitchZoneResponse.builder()
                    .matchId(matchId)
                    .gamePk(0)
                    .pitches(List.of())
                    .totalPitches(0)
                    .build();
        }

        long gamePk = Long.parseLong(match.getExternalId().substring(4));
        JsonNode feed = mlbApiService.fetchGameFeedLive(gamePk);

        List<MlbPitchPointResponse> pitches = new ArrayList<>();
        if (feed != null) {
            JsonNode allPlays = feed.path("liveData").path("plays").path("allPlays");
            if (allPlays.isArray()) {
                for (JsonNode play : allPlays) {
                    JsonNode about = play.path("about");
                    int inning = about.path("inning").asInt(0);
                    String halfInning = about.path("halfInning").asText("");
                    String batterName = play.path("matchup").path("batter").path("fullName").asText("");
                    String pitcherName = play.path("matchup").path("pitcher").path("fullName").asText("");

                    JsonNode playEvents = play.path("playEvents");
                    if (!playEvents.isArray()) continue;
                    for (JsonNode event : playEvents) {
                        if (!"pitch".equals(event.path("type").asText())) continue;

                        JsonNode pd = event.path("pitchData");
                        JsonNode coords = pd.path("coordinates");
                        JsonNode details = event.path("details");

                        if (coords.isMissingNode() || !coords.has("pX") || !coords.has("pZ")) continue;
                        JsonNode pxNode = coords.path("pX");
                        JsonNode pzNode = coords.path("pZ");
                        if (pxNode.isNull() || pzNode.isNull()) continue;

                        pitches.add(MlbPitchPointResponse.builder()
                                .inning(inning)
                                .halfInning(halfInning)
                                .batterName(batterName)
                                .pitcherName(pitcherName)
                                .pitchType(details.path("type").path("description").asText(null))
                                .pitchDescription(details.path("description").asText(null))
                                .callDescription(details.path("call").path("description").asText(null))
                                .isBall(details.path("isBall").asBoolean(false))
                                .isStrike(details.path("isStrike").asBoolean(false))
                                .isInPlay(details.path("isInPlay").asBoolean(false))
                                .zone(pd.has("zone") && !pd.path("zone").isNull() ? pd.path("zone").asInt() : null)
                                .plateX(pxNode.asDouble())
                                .plateZ(pzNode.asDouble())
                                .strikeZoneTop(pd.has("strikeZoneTop") && !pd.path("strikeZoneTop").isNull()
                                        ? pd.path("strikeZoneTop").asDouble() : null)
                                .strikeZoneBottom(pd.has("strikeZoneBottom") && !pd.path("strikeZoneBottom").isNull()
                                        ? pd.path("strikeZoneBottom").asDouble() : null)
                                .startSpeed(pd.has("startSpeed") && !pd.path("startSpeed").isNull()
                                        ? pd.path("startSpeed").asDouble() : null)
                                .endSpeed(pd.has("endSpeed") && !pd.path("endSpeed").isNull()
                                        ? pd.path("endSpeed").asDouble() : null)
                                .build());
                    }
                }
            }
        }

        return MlbPitchZoneResponse.builder()
                .matchId(matchId)
                .gamePk(gamePk)
                .pitches(pitches)
                .totalPitches(pitches.size())
                .build();
    }

    private String statStr(JsonNode node, String field) {
        JsonNode val = node.path(field);
        if (val.isMissingNode() || val.isNull()) return "-";
        return val.asText();
    }
}
