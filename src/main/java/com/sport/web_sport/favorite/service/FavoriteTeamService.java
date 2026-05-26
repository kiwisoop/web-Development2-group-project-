package com.sport.web_sport.favorite.service;

import com.sport.web_sport.common.error.BusinessException;
import com.sport.web_sport.favorite.entity.FavoriteTeam;
import com.sport.web_sport.favorite.repository.FavoriteTeamRepository;
import com.sport.web_sport.sports.entity.Team;
import com.sport.web_sport.sports.repository.TeamRepository;
import com.sport.web_sport.user.entity.User;
import com.sport.web_sport.user.repository.UserRepository;
import com.sport.web_sport.user.service.AuthService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FavoriteTeamService {

    private final FavoriteTeamRepository favoriteTeamRepository;
    private final TeamRepository teamRepository;
    private final UserRepository userRepository;
    private final AuthService authService;

    @Transactional(readOnly = true)
    public List<FavoriteTeam> getFavorites(HttpSession session) {
        Long userId = authService.requireLoginUserId(session);
        return favoriteTeamRepository.findByUserIdWithTeamAndLeague(userId);
    }

    @Transactional(readOnly = true)
    public List<Long> getFavoriteTeamIds(HttpSession session) {
        Long userId = authService.getLoginUserId(session);
        if (userId == null) {
            return Collections.emptyList();
        }
        return favoriteTeamRepository.findTeamIdsByUserId(userId);
    }

    @Transactional(readOnly = true)
    public boolean isFavoriteTeam(Long teamId, HttpSession session) {
        if (teamId == null) {
            return false;
        }
        Long userId = authService.getLoginUserId(session);
        if (userId == null) {
            return false;
        }
        return favoriteTeamRepository.existsByUserIdAndTeamId(userId, teamId);
    }

    @Transactional
    public FavoriteTeam addFavorite(Long teamId, HttpSession session) {
        Long userId = authService.requireLoginUserId(session);
        if (favoriteTeamRepository.existsByUserIdAndTeamId(userId, teamId)) {
            throw new BusinessException("이미 즐겨찾기에 추가된 팀입니다.");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("사용자를 찾을 수 없습니다."));
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new BusinessException("팀을 찾을 수 없습니다."));
        if (team.getLeague() != null) {
            team.getLeague().getLeagueName();
        }
        FavoriteTeam favorite = FavoriteTeam.builder()
                .user(user)
                .team(team)
                .sportType(team.getSportType())
                .teamName(team.getTeamName())
                .createdAt(LocalDateTime.now())
                .build();
        return favoriteTeamRepository.save(favorite);
    }

    @Transactional
    public void removeFavorite(Long favoriteId, HttpSession session) {
        Long userId = authService.requireLoginUserId(session);
        FavoriteTeam favorite = favoriteTeamRepository.findById(favoriteId)
                .orElseThrow(() -> new BusinessException("즐겨찾기를 찾을 수 없습니다."));
        if (!favorite.getUser().getId().equals(userId)) {
            throw new BusinessException("권한이 없습니다.");
        }
        favoriteTeamRepository.delete(favorite);
    }
}
