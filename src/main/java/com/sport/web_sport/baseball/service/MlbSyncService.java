package com.sport.web_sport.baseball.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.sport.web_sport.baseball.dto.MlbSyncRequest;
import com.sport.web_sport.baseball.dto.MlbSyncResultResponse;
import com.sport.web_sport.common.type.MatchStatus;
import com.sport.web_sport.common.type.SportType;
import com.sport.web_sport.sports.entity.League;
import com.sport.web_sport.sports.entity.Match;
import com.sport.web_sport.sports.entity.Team;
import com.sport.web_sport.sports.repository.LeagueRepository;
import com.sport.web_sport.sports.repository.MatchRepository;
import com.sport.web_sport.sports.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class MlbSyncService {

    private final MlbApiService mlbApiService;
    private final LeagueRepository leagueRepository;
    private final TeamRepository teamRepository;
    private final MatchRepository matchRepository;

    public MlbSyncResultResponse sync(MlbSyncRequest request) {
        return sync(request.getStartDate(), request.getEndDate());
    }

    @Transactional
    public MlbSyncResultResponse sync(String startDate, String endDate) {
        List<JsonNode> games = mlbApiService.fetchGames(startDate, endDate);
        League mlbLeague = getOrCreateLeague(startDate);

        int createdMatches = 0, updatedMatches = 0, skippedGames = 0;
        int[] createdTeams = {0};

        for (JsonNode game : games) {
            try {
                long gamePk = game.get("gamePk").asLong();
                String externalId = "MLB-" + gamePk;
                String gameDate = game.get("gameDate").asText();
                String season = game.has("season")
                        ? game.get("season").asText()
                        : startDate.substring(0, 4);
                String gameType = game.path("gameType").asText("R");
                if (!isAllowedGameType(gameType)) { skippedGames++; continue; }
                String detailedState = game.path("status").path("detailedState").asText();
                MatchStatus status = mapStatus(detailedState);
                LocalDateTime matchDate = ZonedDateTime.parse(gameDate).withZoneSameInstant(ZoneOffset.UTC).toLocalDateTime();

                JsonNode homeNode = game.path("teams").path("home");
                JsonNode awayNode = game.path("teams").path("away");

                long homeTeamId = homeNode.path("team").path("id").asLong();
                long awayTeamId = awayNode.path("team").path("id").asLong();

                Team homeTeam = getOrCreateTeam(
                        homeNode.path("team").path("name").asText(),
                        homeNode.path("team").path("abbreviation").asText(),
                        homeTeamId,
                        mlbLeague, createdTeams
                );
                Team awayTeam = getOrCreateTeam(
                        awayNode.path("team").path("name").asText(),
                        awayNode.path("team").path("abbreviation").asText(),
                        awayTeamId,
                        mlbLeague, createdTeams
                );

                Integer homeScore = null;
                Integer awayScore = null;
                if (status == MatchStatus.LIVE || status == MatchStatus.FINAL) {
                    homeScore = homeNode.has("score") ? homeNode.get("score").asInt() : null;
                    awayScore = awayNode.has("score") ? awayNode.get("score").asInt() : null;
                }

                String venue = game.path("venue").path("name").asText(null);

                Optional<Match> existing = matchRepository.findByExternalId(externalId);
                if (existing.isPresent()) {
                    Match m = existing.get();
                    m.setStatus(status);
                    m.setHomeScore(homeScore);
                    m.setAwayScore(awayScore);
                    m.setVenue(venue);
                    m.setMatchDate(matchDate);
                    m.setGameType(gameType);
                    updatedMatches++;
                } else {
                    matchRepository.save(Match.builder()
                            .externalId(externalId)
                            .sportType(SportType.BASEBALL)
                            .league(mlbLeague)
                            .homeTeam(homeTeam)
                            .awayTeam(awayTeam)
                            .matchDate(matchDate)
                            .season(season)
                            .status(status)
                            .homeScore(homeScore)
                            .awayScore(awayScore)
                            .venue(venue)
                            .gameType(gameType)
                            .build());
                    createdMatches++;
                }
            } catch (Exception e) {
                log.warn("Skipped game gamePk={} due to: {}", game.path("gamePk").asText("?"), e.getMessage(), e);
                skippedGames++;
            }
        }

        return MlbSyncResultResponse.builder()
                .requestedStartDate(startDate)
                .requestedEndDate(endDate)
                .fetchedGames(games.size())
                .createdMatches(createdMatches)
                .updatedMatches(updatedMatches)
                .createdTeams(createdTeams[0])
                .skippedGames(skippedGames)
                .message("MLB 일정 동기화 완료")
                .build();
    }

    private League getOrCreateLeague(String startDate) {
        String year = startDate.substring(0, 4);
        return leagueRepository.findBySportTypeAndLeagueName(SportType.BASEBALL, "MLB")
                .orElseGet(() -> leagueRepository.save(League.builder()
                        .sportType(SportType.BASEBALL)
                        .leagueName("MLB")
                        .country("USA")
                        .season(year)
                        .build()));
    }

    private Team getOrCreateTeam(String teamName, String abbreviation,
                                  long teamId, League league, int[] newCount) {
        Optional<Team> existing = teamRepository.findBySportTypeAndTeamName(SportType.BASEBALL, teamName);
        if (existing.isPresent()) {
            Team t = existing.get();
            if (t.getLogoUrl() == null) {
                t.setLogoUrl(buildMlbTeamLogoUrl(teamId));
                teamRepository.save(t);
            }
            return t;
        }
        newCount[0]++;
        return teamRepository.save(Team.builder()
                .sportType(SportType.BASEBALL)
                .league(league)
                .teamName(teamName)
                .shortName(abbreviation)
                .logoUrl(buildMlbTeamLogoUrl(teamId))
                .build());
    }

    private String buildMlbTeamLogoUrl(long teamId) {
        return "https://midfield.mlbstatic.com/v1/team/" + teamId + "/spots/96";
    }

    private boolean isAllowedGameType(String gameType) {
        return switch (gameType) {
            case "R", "F", "D", "L", "W" -> true;
            default -> false;
        };
    }

    private MatchStatus mapStatus(String detailedState) {
        return switch (detailedState) {
            case "In Progress", "Live" -> MatchStatus.LIVE;
            case "Final", "Game Over", "Completed Early" -> MatchStatus.FINAL;
            case "Cancelled", "Postponed", "Suspended" -> MatchStatus.CANCELED;
            default -> MatchStatus.SCHEDULED;
        };
    }
}
