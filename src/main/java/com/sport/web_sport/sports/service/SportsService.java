package com.sport.web_sport.sports.service;

import com.sport.web_sport.common.type.SportType;
import com.sport.web_sport.sports.entity.League;
import com.sport.web_sport.sports.entity.Player;
import com.sport.web_sport.sports.entity.Team;
import com.sport.web_sport.sports.repository.LeagueRepository;
import com.sport.web_sport.sports.repository.PlayerRepository;
import com.sport.web_sport.sports.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SportsService {

    private final LeagueRepository leagueRepository;
    private final TeamRepository teamRepository;
    private final PlayerRepository playerRepository;

    public List<League> findLeagues(SportType sportType) {
        return leagueRepository.findBySportType(sportType);
    }

    public List<League> findAllLeagues() {
        return leagueRepository.findAll();
    }

    public List<Team> findAllTeams() {
        return teamRepository.findAll();
    }

    public List<Team> findTeams(SportType sportType) {
        return teamRepository.findBySportTypeWithLeague(sportType);
    }

    public List<Team> findTeamsByLeague(Long leagueId) {
        return teamRepository.findByLeagueId(leagueId);
    }

    public List<Player> findPlayersByTeam(Long teamId) {
        return playerRepository.findByTeamId(teamId);
    }

    public List<Player> findAllPlayers() {
        return playerRepository.findAll();
    }
}
