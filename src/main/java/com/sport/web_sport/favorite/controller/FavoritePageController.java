package com.sport.web_sport.favorite.controller;

import com.sport.web_sport.favorite.service.FavoriteTeamService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
@RequestMapping("/favorites")
@RequiredArgsConstructor
public class FavoritePageController {

    private final FavoriteTeamService favoriteTeamService;

    @GetMapping
    public String list(HttpSession session, Model model) {
        try {
            model.addAttribute("favorites", favoriteTeamService.getFavorites(session));
        } catch (RuntimeException e) {
            return "redirect:/login";
        }
        return "favorites";
    }

    @PostMapping("/add")
    public String add(@RequestParam Long teamId, HttpSession session) {
        favoriteTeamService.addFavorite(teamId, session);
        return "redirect:/favorites";
    }

    @PostMapping("/remove")
    public String remove(@RequestParam Long favoriteId, HttpSession session) {
        favoriteTeamService.removeFavorite(favoriteId, session);
        return "redirect:/favorites";
    }
}
