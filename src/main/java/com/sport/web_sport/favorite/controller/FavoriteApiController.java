package com.sport.web_sport.favorite.controller;

import com.sport.web_sport.favorite.entity.FavoriteTeam;
import com.sport.web_sport.favorite.service.FavoriteTeamService;
import com.sport.web_sport.sports.dto.response.FavoriteTeamResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/favorites")
@RequiredArgsConstructor
public class FavoriteApiController {

    private final FavoriteTeamService favoriteTeamService;

    @GetMapping
    public List<FavoriteTeamResponse> list(HttpSession session) {
        return favoriteTeamService.getFavorites(session).stream()
                .map(FavoriteTeamResponse::from)
                .toList();
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> add(@RequestParam Long teamId, HttpSession session) {
        FavoriteTeam saved = favoriteTeamService.addFavorite(teamId, session);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "favorite", FavoriteTeamResponse.from(saved)
        ));
    }

    @DeleteMapping("/{favoriteId}")
    public ResponseEntity<Map<String, Object>> remove(@PathVariable Long favoriteId, HttpSession session) {
        favoriteTeamService.removeFavorite(favoriteId, session);
        return ResponseEntity.ok(Map.of("success", true, "favoriteId", favoriteId));
    }
}
