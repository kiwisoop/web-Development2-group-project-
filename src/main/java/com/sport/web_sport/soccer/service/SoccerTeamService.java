package com.sport.web_sport.soccer.service;

import com.sport.web_sport.common.error.BusinessException;
import com.sport.web_sport.soccer.entity.SoccerTeam;
import com.sport.web_sport.soccer.repository.SoccerTeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SoccerTeamService {

    private final SoccerTeamRepository soccerTeamRepository;

    public List<SoccerTeam> findAll() {
        return soccerTeamRepository.findAll();
    }

    public SoccerTeam findById(String teamId) {
        return soccerTeamRepository.findById(teamId)
                .orElseThrow(() -> new BusinessException("팀을 찾을 수 없습니다."));
    }
}
