package com.sport.web_sport.sports.controller;

import com.sport.web_sport.common.type.MatchStatus;
import com.sport.web_sport.common.type.SportType;
import com.sport.web_sport.sports.dto.MatchSearchCondition;
import com.sport.web_sport.sports.dto.response.MatchDetailFullResponse;
import com.sport.web_sport.sports.entity.Match;
import com.sport.web_sport.sports.service.MatchService;
import com.sport.web_sport.sports.service.SportsService;
import com.sport.web_sport.user.service.AuthService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/matches")
@RequiredArgsConstructor
public class MatchPageController {

    private final MatchService matchService;
    private final SportsService sportsService;
    private final AuthService authService;

    @GetMapping
    public String list(@ModelAttribute("condition") MatchSearchCondition condition, Model model) {
        Page<Match> page = matchService.searchMatchesPaged(condition);
        model.addAttribute("matchesPage", page);
        model.addAttribute("matches", page.getContent());
        model.addAttribute("sports", SportType.values());
        model.addAttribute("statuses", MatchStatus.values());
        model.addAttribute("leagues", sportsService.findAllLeagues());
        model.addAttribute("teams", sportsService.findAllTeams());
        return "matches/list";
    }

    @GetMapping("/{id}")
    public String detail(@PathVariable Long id, Model model, HttpSession session) {
        MatchDetailFullResponse detail = matchService.findDetailFull(id, session);
        model.addAttribute("detail", detail);
        model.addAttribute("savedAnalysis", detail.getAnalysis() != null && detail.getAnalysis().getId() != null
                ? detail.getAnalysis() : null);
        model.addAttribute("analysisStatus", detail.getAnalysisStatus());
        model.addAttribute("loginUserId", authService.getLoginUserId(session));
        model.addAttribute("homeFavorited", detail.isHomeTeamFavorite());
        model.addAttribute("awayFavorited", detail.isAwayTeamFavorite());
        return "matches/detail";
    }
}
