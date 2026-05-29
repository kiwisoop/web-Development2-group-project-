package com.sport.web_sport.esports.service;

import com.sport.web_sport.admin.dto.SyncResultResponse;
import com.sport.web_sport.common.type.MatchStatus;
import com.sport.web_sport.common.type.SportType;
import com.sport.web_sport.esports.dto.CitoScheduleResponse;
import com.sport.web_sport.sports.entity.League;
import com.sport.web_sport.sports.entity.Match;
import com.sport.web_sport.sports.entity.Team;
import com.sport.web_sport.sports.repository.LeagueRepository;
import com.sport.web_sport.sports.repository.MatchRepository;
import com.sport.web_sport.sports.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EsportsSyncService {

    private final CitoApiService citoApiService;
    private final LeagueRepository leagueRepository;
    private final TeamRepository teamRepository;
    private final MatchRepository matchRepository;

    @Transactional
    public SyncResultResponse sync(String startDate, String endDate) {
        CitoScheduleResponse response = citoApiService.fetchScheduleByDateRange(startDate, endDate);
        List<CitoScheduleResponse.MatchEvent> events = response != null
                && response.getData() != null
                && response.getData().getEvents() != null
                ? response.getData().getEvents()
                : List.of();

        int created = 0;
        int updated = 0;
        int createdTeams = 0;
        int skipped = 0;

        String leagueName = response != null && response.getData() != null && !isBlank(response.getData().getLeagueName())
                ? response.getData().getLeagueName()
                : "LCK";
        League league = getOrCreateLeague(leagueName, startDate.substring(0, 4));

        for (CitoScheduleResponse.MatchEvent event : events) {
            if (isBlank(event.getMatchId()) || event.getTeams() == null || event.getTeams().size() < 2) {
                skipped++;
                continue;
            }

            CitoScheduleResponse.TeamEntry homeEntry = event.getTeams().get(0);
            CitoScheduleResponse.TeamEntry awayEntry = event.getTeams().get(1);
            if (isBlank(homeEntry.getName()) || isBlank(awayEntry.getName())) {
                skipped++;
                continue;
            }

            TeamResult home = getOrCreateTeam(homeEntry, league);
            TeamResult away = getOrCreateTeam(awayEntry, league);
            createdTeams += home.created ? 1 : 0;
            createdTeams += away.created ? 1 : 0;

            String externalId = "CITO-" + event.getMatchId();
            Match match = matchRepository.findByExternalId(externalId).orElseGet(() -> {
                Match newMatch = new Match();
                newMatch.setExternalId(externalId);
                return newMatch;
            });
            boolean isNew = match.getId() == null;

            match.setSportType(SportType.ESPORTS);
            match.setLeague(league);
            match.setSeason(isBlank(event.getBlockName()) ? startDate.substring(0, 4) : event.getBlockName());
            match.setMatchDate(parseStartTime(event.getStartTime()));
            match.setHomeTeam(home.team);
            match.setAwayTeam(away.team);
            match.setHomeScore(homeEntry.getScore());
            match.setAwayScore(awayEntry.getScore());
            match.setVenue("LoL Park");
            match.setStatus(mapEsportsStatus(event.getState()));
            match.setGameType(event.getType());
            match.setWinnerTeam(resolveWinner(match));
            matchRepository.save(match);

            if (isNew) created++;
            else updated++;
        }

        return SyncResultResponse.builder()
                .sportType(SportType.ESPORTS.name())
                .requestedStartDate(startDate)
                .requestedEndDate(endDate)
                .fetchedGames(events.size())
                .createdMatches(created)
                .updatedMatches(updated)
                .createdTeams(createdTeams)
                .skippedGames(skipped)
                .message("Cito LCK 일정을 공통 경기 테이블로 동기화했습니다.")
                .build();
    }

    private League getOrCreateLeague(String leagueName, String season) {
        return leagueRepository.findBySportType(SportType.ESPORTS).stream()
                .filter(league -> leagueName.equals(league.getLeagueName()))
                .findFirst()
                .orElseGet(() -> leagueRepository.save(League.builder()
                        .sportType(SportType.ESPORTS)
                        .leagueName(leagueName)
                        .season(season)
                        .country("KR")
                        .build()));
    }

    private TeamResult getOrCreateTeam(CitoScheduleResponse.TeamEntry entry, League league) {
        return teamRepository.findBySportTypeAndTeamName(SportType.ESPORTS, entry.getName())
                .map(team -> {
                    team.setLeague(league);
                    team.setShortName(isBlank(entry.getCode()) ? team.getShortName() : entry.getCode());
                    team.setLogoUrl(isBlank(entry.getImageUrl()) ? team.getLogoUrl() : entry.getImageUrl());
                    return new TeamResult(team, false);
                })
                .orElseGet(() -> new TeamResult(teamRepository.save(Team.builder()
                        .sportType(SportType.ESPORTS)
                        .league(league)
                        .teamName(entry.getName())
                        .shortName(isBlank(entry.getCode()) ? entry.getName() : entry.getCode())
                        .logoUrl(entry.getImageUrl())
                        .country("KR")
                        .build()), true));
    }

    private MatchStatus mapEsportsStatus(String state) {
        if (state == null) return MatchStatus.SCHEDULED;
        return switch (state.toLowerCase()) {
            case "completed" -> MatchStatus.FINAL;
            case "inprogress", "in_progress", "live" -> MatchStatus.LIVE;
            default -> MatchStatus.SCHEDULED;
        };
    }

    private LocalDateTime parseStartTime(String startTime) {
        if (isBlank(startTime)) return null;
        try {
            return OffsetDateTime.parse(startTime).toLocalDateTime();
        } catch (Exception ignored) {
            try {
                return LocalDateTime.parse(startTime);
            } catch (Exception e) {
                return null;
            }
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

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private record TeamResult(Team team, boolean created) {
    }
}
