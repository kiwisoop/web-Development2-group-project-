package com.sport.web_sport.sports.controller;

import com.sport.web_sport.common.type.SportType;
import com.sport.web_sport.sports.dto.response.LeagueResponse;
import com.sport.web_sport.sports.dto.response.PlayerResponse;
import com.sport.web_sport.sports.dto.response.TeamResponse;
import com.sport.web_sport.sports.entity.League;
import com.sport.web_sport.sports.entity.Player;
import com.sport.web_sport.sports.entity.Team;
import com.sport.web_sport.sports.service.SportsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.List;

@RestController
@RequiredArgsConstructor
public class SportApiController {

    private final SportsService sportsService;

    @GetMapping("/api/sports")
    public List<SportType> sports() {
        return Arrays.asList(SportType.values());
    }

    @GetMapping("/api/leagues")
    public List<LeagueResponse> leagues(@RequestParam(required = false) SportType sportType) {
        List<League> leagues = sportType != null
                ? sportsService.findLeagues(sportType)
                : sportsService.findAllLeagues();
        return leagues.stream().map(LeagueResponse::from).toList();
    }

    @GetMapping("/api/teams")
    public List<TeamResponse> teams(@RequestParam(required = false) SportType sportType,
                                    @RequestParam(required = false) Long leagueId) {
        List<Team> teams;
        if (leagueId != null) {
            teams = sportsService.findTeamsByLeague(leagueId);
        } else if (sportType != null) {
            teams = sportsService.findTeams(sportType);
        } else {
            teams = sportsService.findAllTeams();
        }
        return teams.stream().map(TeamResponse::from).toList();
    }

    @GetMapping("/api/players")
    public List<PlayerResponse> players(@RequestParam(required = false) Long teamId) {
        List<Player> players = teamId != null
                ? sportsService.findPlayersByTeam(teamId)
                : sportsService.findAllPlayers();
        return players.stream().map(PlayerResponse::from).toList();
    }

    @GetMapping("/api/sports/{sportType}/leagues")
    public List<LeagueResponse> leaguesBySport(@PathVariable SportType sportType) {
        return sportsService.findLeagues(sportType).stream().map(LeagueResponse::from).toList();
    }

    @GetMapping("/api/sports/{sportType}/teams")
    public List<TeamResponse> teamsBySport(@PathVariable SportType sportType) {
        return sportsService.findTeams(sportType).stream().map(TeamResponse::from).toList();
    }

    @GetMapping("/api/sports/teams/{teamId}/players")
    public List<PlayerResponse> playersByTeam(@PathVariable Long teamId) {
        return sportsService.findPlayersByTeam(teamId).stream().map(PlayerResponse::from).toList();
    }
}
