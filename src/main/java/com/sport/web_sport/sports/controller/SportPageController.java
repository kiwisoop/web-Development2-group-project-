package com.sport.web_sport.sports.controller;

import com.sport.web_sport.common.type.SportType;
import com.sport.web_sport.favorite.service.FavoriteTeamService;
import com.sport.web_sport.sports.service.SportsService;
import com.sport.web_sport.user.service.AuthService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/sports")
@RequiredArgsConstructor
public class SportPageController {

    private final SportsService sportsService;
    private final FavoriteTeamService favoriteTeamService;
    private final AuthService authService;

    @GetMapping("/soccer")
    public String soccer(Model model, HttpSession session) {
        return loadSport(model, session, SportType.SOCCER, "sports/soccer");
    }

    @GetMapping("/baseball")
    public String baseball(Model model, HttpSession session) {
        return loadSport(model, session, SportType.BASEBALL, "sports/baseball");
    }

    @GetMapping("/esports")
    public String esports(Model model, HttpSession session) {
        return loadSport(model, session, SportType.ESPORTS, "sports/esports");
    }

    private String loadSport(Model model, HttpSession session, SportType type, String view) {
        model.addAttribute("sportType", type);
        model.addAttribute("leagues", sportsService.findLeagues(type));
        model.addAttribute("teams", sportsService.findTeams(type));
        model.addAttribute("loginUserId", authService.getLoginUserId(session));
        model.addAttribute("favoriteTeamIds", favoriteTeamService.getFavoriteTeamIds(session));
        return view;
    }
}
