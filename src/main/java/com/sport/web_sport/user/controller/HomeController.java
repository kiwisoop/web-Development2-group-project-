package com.sport.web_sport.user.controller;

import com.sport.web_sport.sports.entity.Match;
import com.sport.web_sport.sports.repository.MatchRepository;
import com.sport.web_sport.sports.service.MatchService;
import com.sport.web_sport.user.service.AuthService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.List;

@Controller
@RequiredArgsConstructor
public class HomeController {

    private final MatchRepository matchRepository;
    private final MatchService matchService;
    private final AuthService authService;

    @GetMapping("/")
    public String index(Model model, HttpSession session) {
        List<Match> recent = matchRepository.findTop10WithTeams(PageRequest.of(0, 10));
        model.addAttribute("recentMatches", recent);
        model.addAttribute("loginUsername", session.getAttribute(AuthService.SESSION_USERNAME));

        boolean loggedIn = authService.getLoginUserId(session) != null;
        model.addAttribute("loggedIn", loggedIn);
        model.addAttribute("favoriteMatches",
                loggedIn ? matchService.findMatchesByFavoriteTeams(session) : List.of());
        return "index";
    }

    @GetMapping("/api-test")
    public String apiTest() {
        return "api-test";
    }
}
