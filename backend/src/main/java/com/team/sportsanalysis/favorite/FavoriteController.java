package com.team.sportsanalysis.favorite;

import com.team.sportsanalysis.common.SportType;
import lombok.Data;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/favorites/teams")
public class FavoriteController {

    private final FavoriteTeamRepository repo;

    public FavoriteController(FavoriteTeamRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public List<FavoriteTeam> list(@RequestParam Long userId) {
        return repo.findByUserId(userId);
    }

    @PostMapping
    public ResponseEntity<FavoriteTeam> add(@RequestBody FavoriteRequest req) {
        if (repo.existsByUserIdAndTeamName(req.getUserId(), req.getTeamName())) {
            return ResponseEntity.ok(
                    repo.findByUserId(req.getUserId()).stream()
                            .filter(f -> f.getTeamName().equals(req.getTeamName()))
                            .findFirst().orElseThrow());
        }
        FavoriteTeam saved = repo.save(FavoriteTeam.builder()
                .userId(req.getUserId())
                .sportType(req.getSportType())
                .teamName(req.getTeamName())
                .build());
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> remove(@PathVariable Long id) {
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @Data
    public static class FavoriteRequest {
        private Long userId;
        private SportType sportType;
        private String teamName;
    }
}
