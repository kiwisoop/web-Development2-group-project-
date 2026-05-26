package com.sport.web_sport.config;

import com.sport.web_sport.common.type.MatchStatus;
import com.sport.web_sport.common.type.SportType;
import com.sport.web_sport.favorite.repository.FavoriteTeamRepository;
import com.sport.web_sport.sports.entity.*;
import com.sport.web_sport.sports.repository.*;
import com.sport.web_sport.user.entity.User;
import com.sport.web_sport.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Configuration
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final LeagueRepository leagueRepository;
    private final TeamRepository teamRepository;
    private final PlayerRepository playerRepository;
    private final MatchRepository matchRepository;
    private final MatchStatRepository matchStatRepository;
    private final MatchEventRepository matchEventRepository;
    private final FavoriteTeamRepository favoriteTeamRepository;

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepository.count() > 0) {
            return;
        }

        userRepository.save(User.builder()
                .username("demo")
                .password("demo123")
                .nickname("데모유저")
                .createdAt(LocalDateTime.now())
                .build());

        // Soccer 샘플 데이터는 실제 K리그 DB(TEAMS / FIXTURES / STANDINGS)를 사용하므로 시드하지 않음.
        // 야구·E스포츠는 별도 데이터 소스가 없어 샘플 시드를 유지.
        seedBaseball();
        seedEsports();
    }

    private void seedSoccer() {
        League league = leagueRepository.save(League.builder()
                .sportType(SportType.SOCCER)
                .leagueName("K League 1")
                .season("2026")
                .country("KR")
                .build());

        Team t1 = saveTeam(SportType.SOCCER, league, "FC 서울", "SEO", "KR");
        Team t2 = saveTeam(SportType.SOCCER, league, "전북 현대", "JEO", "KR");
        Team t3 = saveTeam(SportType.SOCCER, league, "울산 HD", "ULS", "KR");

        savePlayer(SportType.SOCCER, t1, "김민준", 10, "FW", "민준");
        savePlayer(SportType.SOCCER, t1, "박지성", 7, "MF", "JS");
        savePlayer(SportType.SOCCER, t2, "이동국", 20, "FW", "라이언킹");
        savePlayer(SportType.SOCCER, t3, "주민규", 9, "FW", "주민규");

        Match m1 = saveMatch(SportType.SOCCER, league, "2026", t1, t2, 2, 1, "서울월드컵경기장",
                MatchStatus.FINAL, LocalDateTime.now().minusDays(3));
        Match m2 = saveMatch(SportType.SOCCER, league, "2026", t2, t3, 1, 1, "전주월드컵경기장",
                MatchStatus.LIVE, LocalDateTime.now());
        saveMatch(SportType.SOCCER, league, "2026", t1, t3, null, null, "서울월드컵경기장",
                MatchStatus.SCHEDULED, LocalDateTime.now().plusDays(3));

        saveStat(m1, t1, "슈팅", "14");
        saveStat(m1, t1, "점유율", "58%");
        saveStat(m1, t2, "슈팅", "9");
        saveStat(m1, t2, "점유율", "42%");

        saveEvent(m1, t1, null, "12", "GOAL", "선제골", "1-0");
        saveEvent(m1, t2, null, "44", "GOAL", "동점골", "1-1");
        saveEvent(m1, t1, null, "78", "GOAL", "결승골", "2-1");
        saveEvent(m2, t2, null, "30", "GOAL", "선제골", "1-0");
        saveEvent(m2, t3, null, "65", "GOAL", "동점골", "1-1");
    }

    private void seedBaseball() {
        League league = leagueRepository.save(League.builder()
                .sportType(SportType.BASEBALL)
                .leagueName("KBO 리그")
                .season("2026")
                .country("KR")
                .build());

        Team t1 = saveTeam(SportType.BASEBALL, league, "두산 베어스", "DOO", "KR");
        Team t2 = saveTeam(SportType.BASEBALL, league, "LG 트윈스", "LG", "KR");
        Team t3 = saveTeam(SportType.BASEBALL, league, "KIA 타이거즈", "KIA", "KR");

        savePlayer(SportType.BASEBALL, t1, "양석환", 53, "1B", "양크루즈");
        savePlayer(SportType.BASEBALL, t2, "오스틴 딘", 22, "1B", "오스틴");
        savePlayer(SportType.BASEBALL, t3, "김도영", 5, "3B", "도영");

        Match m1 = saveMatch(SportType.BASEBALL, league, "2026", t1, t2, 5, 3, "잠실야구장",
                MatchStatus.FINAL, LocalDateTime.now().minusDays(2));
        Match m2 = saveMatch(SportType.BASEBALL, league, "2026", t2, t3, 4, 4, "잠실야구장",
                MatchStatus.LIVE, LocalDateTime.now());
        saveMatch(SportType.BASEBALL, league, "2026", t1, t3, null, null, "광주-기아 챔피언스 필드",
                MatchStatus.SCHEDULED, LocalDateTime.now().plusDays(2));

        saveStat(m1, t1, "안타", "9");
        saveStat(m1, t2, "안타", "7");

        saveEvent(m1, t1, null, "1회", "HR", "선두타자 홈런", "1-0");
        saveEvent(m1, t2, null, "5회", "HR", "투런 홈런", "1-2");
        saveEvent(m1, t1, null, "7회", "HR", "역전 쓰리런", "4-2");
    }

    private void seedEsports() {
        League league = leagueRepository.save(League.builder()
                .sportType(SportType.ESPORTS)
                .leagueName("LCK")
                .season("2026 Spring")
                .country("KR")
                .build());

        Team t1 = saveTeam(SportType.ESPORTS, league, "T1", "T1", "KR");
        Team t2 = saveTeam(SportType.ESPORTS, league, "Gen.G", "GEN", "KR");
        Team t3 = saveTeam(SportType.ESPORTS, league, "DRX", "DRX", "KR");

        savePlayer(SportType.ESPORTS, t1, "이상혁", 1, "MID", "Faker");
        savePlayer(SportType.ESPORTS, t2, "정지훈", 2, "MID", "Chovy");
        savePlayer(SportType.ESPORTS, t3, "김혁규", 3, "TOP", "Rascal");

        Match m1 = saveMatch(SportType.ESPORTS, league, "2026", t1, t2, 2, 1, "LoL Park",
                MatchStatus.FINAL, LocalDateTime.now().minusDays(1));
        Match m2 = saveMatch(SportType.ESPORTS, league, "2026", t2, t3, 1, 0, "LoL Park",
                MatchStatus.LIVE, LocalDateTime.now());
        saveMatch(SportType.ESPORTS, league, "2026", t1, t3, null, null, "LoL Park",
                MatchStatus.SCHEDULED, LocalDateTime.now().plusDays(4));

        saveStat(m1, t1, "킬", "32");
        saveStat(m1, t2, "킬", "28");

        saveEvent(m1, t1, null, "1세트", "WIN", "T1 1세트 승리", "1-0");
        saveEvent(m1, t2, null, "2세트", "WIN", "Gen.G 2세트 승리", "1-1");
        saveEvent(m1, t1, null, "3세트", "WIN", "T1 3세트 승리", "2-1");
    }

    private Team saveTeam(SportType type, League league, String name, String shortName, String country) {
        return teamRepository.save(Team.builder()
                .sportType(type)
                .league(league)
                .teamName(name)
                .shortName(shortName)
                .logoUrl(null)
                .country(country)
                .build());
    }

    private void savePlayer(SportType type, Team team, String name, Integer back, String pos, String nickname) {
        playerRepository.save(Player.builder()
                .sportType(type)
                .team(team)
                .playerName(name)
                .backNumber(back)
                .position(pos)
                .nickname(nickname)
                .build());
    }

    private Match saveMatch(SportType type, League league, String season, Team home, Team away,
                            Integer hs, Integer as, String venue, MatchStatus status, LocalDateTime date) {
        return matchRepository.save(Match.builder()
                .sportType(type)
                .league(league)
                .season(season)
                .matchDate(date)
                .homeTeam(home)
                .awayTeam(away)
                .homeScore(hs)
                .awayScore(as)
                .venue(venue)
                .status(status)
                .build());
    }

    private void saveStat(Match match, Team team, String name, String value) {
        matchStatRepository.save(MatchStat.builder()
                .match(match)
                .team(team)
                .statName(name)
                .statValue(value)
                .build());
    }

    private void saveEvent(Match match, Team team, Player player, String time, String type,
                           String desc, String score) {
        matchEventRepository.save(MatchEvent.builder()
                .match(match)
                .team(team)
                .player(player)
                .eventTime(time)
                .eventType(type)
                .description(desc)
                .scoreAfterEvent(score)
                .build());
    }
}
