package com.sport.web_sport.soccer.service;

import com.sport.web_sport.admin.dto.SyncResultResponse;
import com.sport.web_sport.common.type.MatchStatus;
import com.sport.web_sport.common.type.SportType;
import com.sport.web_sport.soccer.entity.Fixture;
import com.sport.web_sport.soccer.repository.FixtureRepository;
import com.sport.web_sport.sports.entity.League;
import com.sport.web_sport.sports.entity.Match;
import com.sport.web_sport.sports.entity.Team;
import com.sport.web_sport.sports.repository.LeagueRepository;
import com.sport.web_sport.sports.repository.MatchRepository;
import com.sport.web_sport.sports.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SoccerSyncService {

    private final FixtureRepository fixtureRepository;
    private final LeagueRepository leagueRepository;
    private final TeamRepository teamRepository;
    private final MatchRepository matchRepository;

    @Transactional
    public SyncResultResponse sync(String startDate, String endDate) {
        LocalDateTime start = LocalDate.parse(startDate).atStartOfDay();
        LocalDateTime endExclusive = LocalDate.parse(endDate).plusDays(1).atStartOfDay();

        int fetched = 0;
        int created = 0;
        int updated = 0;
        int createdTeams = 0;
        int skipped = 0;

        List<Fixture> fixtures = fixtureRepository.findAll();
        for (Fixture fixture : fixtures) {
            if (fixture.getMatchDate() == null
                    || fixture.getMatchDate().isBefore(start)
                    || !fixture.getMatchDate().isBefore(endExclusive)) {
                continue;
            }
            fetched++;

            if (isBlank(fixture.getHomeTeamName()) || isBlank(fixture.getAwayTeamName())) {
                skipped++;
                continue;
            }

            String leagueName = isBlank(fixture.getLeagueName()) ? "K League" : fixture.getLeagueName();
            League league = getOrCreateLeague(leagueName, valueOrDefault(fixture.getSeason(), startDate.substring(0, 4)));

            TeamResult home = getOrCreateTeam(fixture.getHomeTeamName(), league);
            TeamResult away = getOrCreateTeam(fixture.getAwayTeamName(), league);
            createdTeams += home.created ? 1 : 0;
            createdTeams += away.created ? 1 : 0;

            String externalId = "KLEAGUE-" + fixture.getFixtureId();
            Match match = matchRepository.findByExternalId(externalId).orElseGet(() -> {
                Match newMatch = new Match();
                newMatch.setExternalId(externalId);
                return newMatch;
            });
            boolean isNew = match.getId() == null;

            match.setSportType(SportType.SOCCER);
            match.setLeague(league);
            match.setSeason(valueOrDefault(fixture.getSeason(), startDate.substring(0, 4)));
            match.setMatchDate(fixture.getMatchDate());
            match.setHomeTeam(home.team);
            match.setAwayTeam(away.team);
            match.setHomeScore(parseScore(fixture.getHomeScore()));
            match.setAwayScore(parseScore(fixture.getAwayScore()));
            match.setVenue(fixture.getVenue());
            match.setStatus(mapSoccerStatus(fixture.getStatus()));
            match.setGameType(fixture.getRound());
            match.setWinnerTeam(resolveWinner(match));
            matchRepository.save(match);

            if (isNew) created++;
            else updated++;
        }

        return SyncResultResponse.builder()
                .sportType(SportType.SOCCER.name())
                .requestedStartDate(startDate)
                .requestedEndDate(endDate)
                .fetchedGames(fetched)
                .createdMatches(created)
                .updatedMatches(updated)
                .createdTeams(createdTeams)
                .skippedGames(skipped)
                .message("축구 원본 DB 데이터를 공통 경기 테이블로 동기화했습니다.")
                .build();
    }

    private League getOrCreateLeague(String leagueName, String season) {
        return leagueRepository.findBySportType(SportType.SOCCER).stream()
                .filter(league -> leagueName.equals(league.getLeagueName()))
                .findFirst()
                .orElseGet(() -> leagueRepository.save(League.builder()
                        .sportType(SportType.SOCCER)
                        .leagueName(leagueName)
                        .season(season)
                        .country("KR")
                        .build()));
    }

    private TeamResult getOrCreateTeam(String teamName, League league) {
        return teamRepository.findBySportTypeAndTeamName(SportType.SOCCER, teamName)
                .map(team -> {
                    team.setLeague(league);
                    return new TeamResult(team, false);
                })
                .orElseGet(() -> new TeamResult(teamRepository.save(Team.builder()
                        .sportType(SportType.SOCCER)
                        .league(league)
                        .teamName(teamName)
                        .shortName(teamName)
                        .country("KR")
                        .build()), true));
    }

    private MatchStatus mapSoccerStatus(String status) {
        if (status == null) return MatchStatus.SCHEDULED;
        return switch (status.toUpperCase()) {
            case "FT", "AET", "PEN" -> MatchStatus.FINAL;
            case "LIVE", "1H", "2H", "HT", "ET", "P" -> MatchStatus.LIVE;
            case "CANC", "PST", "ABD" -> MatchStatus.CANCELED;
            default -> MatchStatus.SCHEDULED;
        };
    }

    private Integer parseScore(String value) {
        if (isBlank(value)) return null;
        try {
            return Integer.parseInt(value.trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private Team resolveWinner(Match match) {
        if (match.getStatus() != MatchStatus.FINAL || match.getHomeScore() == null || match.getAwayScore() == null) {
            return null;
        }
        if (match.getHomeScore() > match.getAwayScore()) return match.getHomeTeam();
        if (match.getAwayScore() > match.getHomeScore()) return match.getAwayTeam();
        return null;
    }

    private String valueOrDefault(String value, String defaultValue) {
        return isBlank(value) ? defaultValue : value;
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private record TeamResult(Team team, boolean created) {
    }
}
