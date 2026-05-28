package com.sport.web_sport.esports.init;

import com.sport.web_sport.common.type.MatchStatus;
import com.sport.web_sport.common.type.SportType;
import com.sport.web_sport.esports.entity.*;
import com.sport.web_sport.esports.repository.*;
import com.sport.web_sport.sports.entity.*;
import com.sport.web_sport.sports.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * LCK 2025 샘플 데이터 초기화
 * - 10개 팀 × 5명 선수 = 50명
 * - 완료 경기 5개 (12게임), 예정 경기 3개
 * - 게임별 선수 스탯, 팀 오브젝트 기록, 타임라인, AI 분석 포함
 */
@Slf4j
@Component
@Order(2)
@RequiredArgsConstructor
public class LckDataInitializer implements CommandLineRunner {

    private final GameRepository              gameRepo;
    private final PlayerGameStatRepository    pgsRepo;
    private final TeamGameStatRepository      tgsRepo;
    private final LckTimelineEventRepository  teRepo;
    private final LckAnalysisResultRepository arRepo;
    private final LeagueRepository            leagueRepo;
    private final TeamRepository              teamRepo;
    private final PlayerRepository            playerRepo;
    private final MatchRepository             matchRepo;

    @Override
    @Transactional
    public void run(String... args) {
        if (gameRepo.count() > 0) {
            log.info("LCK 게임 데이터 이미 존재 - 초기화 건너뜀");
            return;
        }
        log.info("=== LCK 2025 샘플 데이터 초기화 시작 ===");

        League spring = league("LCK", "KR", "2025 Spring");
        League summer = league("LCK", "KR", "2025 Summer");

        // 10개 팀 생성
        Team t1   = team(spring, "T1",                  "T1");
        Team geng = team(spring, "Gen.G",               "GEN");
        Team kt   = team(spring, "KT Rolster",          "KT");
        Team hle  = team(spring, "Hanwha Life Esports", "HLE");
        Team dk   = team(spring, "Dplus KIA",           "DK");
        Team bfx  = team(spring, "BNK FearX",           "BFX");
        Team ns   = team(spring, "NongShim RedForce",   "NS");
        Team okb  = team(spring, "OKSavingsBank BRION", "OKB");
        Team drx  = team(spring, "DRX",                 "DRX");
        Team kdf  = team(spring, "Kwangdong Freecs",    "KDF");

        // 선수 생성 (팀당 5명, "실명/닉네임/포지션" 형식)
        Player[] t1p  = mkPlayers(t1,  "최우제/Zeus/TOP",    "문현준/Oner/JGL",   "이상혁/Faker/MID",
                                       "이민형/Gumayusi/BOT","류민석/Keria/SUP");
        Player[] gp   = mkPlayers(geng,"김기인/Kiin/TOP",    "김건부/Canyon/JGL", "정지훈/Chovy/MID",
                                       "김수환/Peyz/BOT",    "손시우/Lehends/SUP");
        Player[] ktp  = mkPlayers(kt,  "최현준/Doran/TOP",   "문우찬/Cuzz/JGL",   "곽보성/Bdd/MID",
                                       "김하람/Aiming/BOT",  "김정민/Life/SUP");
        Player[] hlep = mkPlayers(hle, "황성훈/Kingen/TOP",  "한왕호/Peanut/JGL", "김건우/Zeka/MID",
                                       "박도현/Viper/BOT",   "유환중/Delight/SUP");
        Player[] dkp  = mkPlayers(dk,  "박시우/Siwoo/TOP",   "최원영/Lucid/JGL",  "허수/ShowMaker/MID",
                                       "박상준/Abox/BOT",    "조건희/BeryL/SUP");
        Player[] bfxp = mkPlayers(bfx, "이동준/DuDu/TOP",    "심재원/Sylvie/JGL", "최현우/Fisher/MID",
                                       "김태윤/Taeyoon/BOT", "이주현/Peter/SUP");
        Player[] nsp  = mkPlayers(ns,  "강승훈/DnDn/TOP",    "조우재/Willer/JGL", "정진성/Quad/MID",
                                       "김혁규/Deft/BOT",    "이상호/Effort/SUP");
        Player[] okbp = mkPlayers(okb, "오현식/Morgan/TOP",  "이동원/Croco/JGL",  "이서현/Karis/MID",
                                       "류현우/Hena/BOT",    "김지훈/Loopy/SUP");
        Player[] drxp = mkPlayers(drx, "류원일/Rascal/TOP",  "홍창현/Pyosik/JGL", "손우현/Ucal/MID",
                                       "배태준/deokdam/BOT", "이민규/Pleata/SUP");
        Player[] kdfp = mkPlayers(kdf, "최태영/Hoya/TOP",    "이재원/Raptor/JGL", "김진성/Dove/MID",
                                       "박진성/Teddy/BOT",   "김재훈/Andil/SUP");

        // === 완료 경기 ===
        initT1vsKDF   (spring, t1, kdf, t1p, kdfp);
        initGengvsDRX (spring, geng, drx, gp, drxp);
        initHLEvsBFX  (spring, hle, bfx, hlep, bfxp);
        initT1vsGENG  (spring, t1, geng, t1p, gp);
        initDKvsNS    (spring, dk, ns, dkp, nsp);

        // === 예정 경기 (2025 Summer) ===
        matchRepo.save(Match.builder().sportType(SportType.ESPORTS).league(summer)
            .season("2025 Summer").matchDate(LocalDateTime.of(2025,6,11,17,0))
            .homeTeam(t1).awayTeam(kt).venue("LoL Park").status(MatchStatus.SCHEDULED).build());
        matchRepo.save(Match.builder().sportType(SportType.ESPORTS).league(summer)
            .season("2025 Summer").matchDate(LocalDateTime.of(2025,6,11,19,0))
            .homeTeam(geng).awayTeam(hle).venue("LoL Park").status(MatchStatus.SCHEDULED).build());
        matchRepo.save(Match.builder().sportType(SportType.ESPORTS).league(summer)
            .season("2025 Summer").matchDate(LocalDateTime.of(2025,6,12,17,0))
            .homeTeam(dk).awayTeam(drx).venue("LoL Park").status(MatchStatus.SCHEDULED).build());

        log.info("=== LCK 2025 샘플 데이터 초기화 완료 ===");
    }

    // =============================================
    // MATCH 1: T1 2-0 KDF (2025-01-15)
    // =============================================
    private void initT1vsKDF(League lg, Team t1, Team kdf, Player[] t1p, Player[] kdfp) {
        Match m = match(lg, "2025 Spring", t1, kdf, 2, 0, MatchStatus.FINAL,
                        LocalDateTime.of(2025,1,15,17,0), t1);

        // Game 1: T1(Blue) 승, 32분
        Game g1 = game(m, 1, t1, kdf, t1, 1920);
        pStats(g1, t1p, new String[]{"Jayce","Vi","Azir","Jinx","Nautilus"},
            new int[][]{{3,1,5,245,14200,18500,42},{4,0,8,185,13800,12300,35},
                        {5,1,7,312,16500,28700,28},{6,2,5,268,15900,32100,24},{0,1,13,42,9200,5800,78}}, 1920);
        pStats(g1, kdfp, new String[]{"Camille","Jarvan IV","Viktor","Caitlyn","Lulu"},
            new int[][]{{1,4,2,220,11000,11000,38},{2,3,3,165,10200,8500,32},
                        {2,5,2,285,13500,21000,25},{3,3,2,250,13000,22000,22},{0,3,7,38,7800,4200,65}}, 1920);
        tStats(g1,t1, 8,4,2,1,4,75600,18); tStats(g1,kdf,2,0,0,0,2,55200,7);
        ev(g1,720,"VOID_GRUB",t1,t1p[1],"T1 공허 유충 1번째 처치");
        ev(g1,780,"VOID_GRUB",t1,t1p[1],"T1 공허 유충 2번째 처치");
        ev(g1,840,"VOID_GRUB",kdf,kdfp[1],"KDF 공허 유충 3번째 처치");
        ev(g1,960,"VOID_GRUB",t1,t1p[0],"T1 공허 유충 4번째 처치");
        ev(g1,1080,"FIRST_BLOOD",t1,t1p[2],"Faker 솔로킬 퍼스트 블러드");
        ev(g1,1320,"HERALD",t1,t1p[1],"T1 전령 획득");
        ev(g1,1440,"DRAGON",t1,t1p[1],"T1 화염 드래곤 획득 (1번째)");
        ev(g1,1500,"TOWER",t1,null,"T1 미드 1차 포탑 파괴");
        ev(g1,1680,"DRAGON",t1,t1p[1],"T1 대지 드래곤 획득 (2번째)");
        ev(g1,1740,"BARON",t1,t1p[1],"T1 바론 나스코르 획득");
        ev(g1,1860,"DRAGON",t1,t1p[1],"T1 바람 드래곤 획득 (3번째) - 소울 포인트");
        ev(g1,1920,"GAME_END",t1,null,"T1 게임 1 승리");
        anal(g1,t1p[2],"T1이 강력한 초반 오브젝트 장악으로 KDF를 압도했습니다. Faker의 Azir가 중앙에서 솔로킬을 따내며 주도권을 확보했고, Oner의 체계적인 오브젝트 관리로 T1이 손쉽게 승리했습니다. 드래곤 4개를 독점해 드래곤 소울 수준에 도달했습니다.",8.5,9.2);

        // Game 2: KDF(Blue) T1(Red) 승, 28분
        Game g2 = game(m, 2, kdf, t1, t1, 1680);
        pStats(g2, t1p, new String[]{"Darius","Lee Sin","Viktor","Jinx","Thresh"},
            new int[][]{{2,0,6,215,13800,16200,38},{3,1,7,155,12500,10500,42},
                        {5,0,4,295,15800,29500,30},{4,1,3,248,14800,28500,20},{0,0,14,35,8800,5200,82}}, 1680);
        pStats(g2, kdfp, new String[]{"Malphite","Xin Zhao","Orianna","Kai'Sa","Morgana"},
            new int[][]{{0,3,1,195,10200,9500,35},{1,4,2,148,9800,8000,28},
                        {1,5,1,270,12500,18500,22},{2,4,2,235,12800,20500,18},{0,2,3,35,7200,3800,60}}, 1680);
        tStats(g2,t1, 7,3,1,0,3,65900,14); tStats(g2,kdf,2,0,0,1,3,52500,5);
        ev(g2,720,"VOID_GRUB",t1,t1p[1],"T1 공허 유충 1번째 처치");
        ev(g2,840,"VOID_GRUB",kdf,kdfp[1],"KDF 공허 유충 2번째 처치");
        ev(g2,900,"VOID_GRUB",t1,t1p[0],"T1 공허 유충 3번째 처치");
        ev(g2,1020,"HERALD",kdf,kdfp[1],"KDF 전령 획득");
        ev(g2,1320,"FIRST_BLOOD",t1,t1p[2],"Faker 퍼스트 블러드 (솔로킬)");
        ev(g2,1440,"DRAGON",t1,t1p[1],"T1 불꽃 드래곤 획득");
        ev(g2,1500,"TOWER",t1,null,"T1 바텀 1차 포탑 파괴");
        ev(g2,1560,"DRAGON",t1,t1p[1],"T1 바람 드래곤 획득 (2번째)");
        ev(g2,1620,"BARON",t1,t1p[1],"T1 바론 나스코르 획득");
        ev(g2,1680,"GAME_END",t1,null,"T1 게임 2 승리 - T1 시리즈 2-0 승");
        anal(g2,t1p[2],"T1이 레드 사이드에서도 완벽한 운영을 보여줬습니다. Faker의 Viktor가 딜링에서 압도적인 수치를 기록했으며, Keria의 Thresh 플레이가 팀원들의 생존을 돕는 핵심 역할을 했습니다.",8.0,8.5);
    }

    // =============================================
    // MATCH 2: Gen.G 2-1 DRX (2025-01-15)
    // =============================================
    private void initGengvsDRX(League lg, Team geng, Team drx, Player[] gp, Player[] drxp) {
        Match m = match(lg, "2025 Spring", geng, drx, 2, 1, MatchStatus.FINAL,
                        LocalDateTime.of(2025,1,15,19,0), geng);

        // Game 1: Gen.G(Blue) 승, 35분
        Game g1 = game(m, 1, geng, drx, geng, 2100);
        pStats(g1, gp, new String[]{"Gangplank","Rell","Orianna","Kai'Sa","Thresh"},
            new int[][]{{4,1,5,280,16200,22000,45},{2,0,9,165,11800,9500,38},
                        {6,0,6,325,17500,32000,30},{7,2,4,285,16800,35000,22},{1,1,14,45,9800,6200,82}}, 2100);
        pStats(g1, drxp, new String[]{"Gragas","Lillia","Viktor","Jinx","Nautilus"},
            new int[][]{{1,4,2,255,13500,14000,42},{0,4,3,168,11000,7500,35},
                        {3,5,2,298,14500,24500,25},{4,3,3,265,14200,28000,20},{0,3,7,40,8200,5000,70}}, 2100);
        tStats(g1,geng,9,4,2,1,5,82500,20); tStats(g1,drx,2,1,0,0,1,62000,9);
        ev(g1,720,"VOID_GRUB",geng,gp[1],"Gen.G 공허 유충 1번째 처치");
        ev(g1,780,"VOID_GRUB",geng,gp[1],"Gen.G 공허 유충 2번째 처치");
        ev(g1,840,"VOID_GRUB",drx,drxp[1],"DRX 공허 유충 3번째 처치");
        ev(g1,900,"VOID_GRUB",geng,gp[1],"Gen.G 공허 유충 4번째 처치");
        ev(g1,1140,"FIRST_BLOOD",geng,gp[2],"Chovy 퍼스트 블러드 획득");
        ev(g1,1320,"HERALD",geng,gp[1],"Gen.G 전령 획득");
        ev(g1,1440,"DRAGON",geng,gp[1],"Gen.G 불꽃 드래곤 획득");
        ev(g1,1500,"TOWER",geng,null,"Gen.G 미드 1차 포탑 파괴");
        ev(g1,1680,"DRAGON",drx,drxp[1],"DRX 바람 드래곤 획득");
        ev(g1,1800,"BARON",geng,gp[1],"Gen.G 바론 나스코르 첫 획득");
        ev(g1,1920,"DRAGON",geng,gp[1],"Gen.G 대지 드래곤 획득 (3번째)");
        ev(g1,2040,"BARON",geng,gp[1],"Gen.G 바론 나스코르 재획득");
        ev(g1,2100,"GAME_END",geng,null,"Gen.G 게임 1 승리");
        anal(g1,gp[3],"Gen.G가 드래곤 장악을 중심으로 안정적인 운영을 선보였습니다. Peyz의 Kai'Sa가 7킬을 달성하며 캐리 퍼포먼스를 보여줬습니다. Chovy의 미드 라인 지배력이 Gen.G의 오브젝트 장악 기반이 되었습니다.",9.0,8.8);

        // Game 2: DRX(Blue) 승, 38분 (DRX 세트 탈환)
        Game g2 = game(m, 2, drx, geng, drx, 2280);
        pStats(g2, drxp, new String[]{"Darius","Lee Sin","Syndra","Aphelios","Leona"},
            new int[][]{{5,2,6,262,14800,19000,42},{4,1,9,172,13500,11500,38},
                        {7,2,5,310,16800,31500,28},{6,3,4,272,15500,32000,22},{0,2,15,42,9500,5800,80}}, 2280);
        pStats(g2, gp, new String[]{"Garen","Jarvan IV","Azir","Jinx","Blitzcrank"},
            new int[][]{{2,4,2,252,12800,13500,40},{3,3,4,168,12200,10000,35},
                        {4,5,3,308,15200,26500,28},{5,4,2,265,14500,27500,20},{0,2,9,40,8800,5200,75}}, 2280);
        tStats(g2,drx,8,4,1,1,4,78000,22); tStats(g2,geng,3,1,0,0,2,61500,14);
        ev(g2,720,"VOID_GRUB",drx,drxp[1],"DRX 공허 유충 1번째 처치");
        ev(g2,840,"VOID_GRUB",geng,gp[1],"Gen.G 공허 유충 2번째 처치");
        ev(g2,960,"VOID_GRUB",drx,drxp[0],"DRX 공허 유충 3번째 처치");
        ev(g2,1200,"FIRST_BLOOD",drx,drxp[2],"Ucal 퍼스트 블러드");
        ev(g2,1380,"HERALD",drx,drxp[1],"DRX 전령 획득");
        ev(g2,1440,"DRAGON",drx,drxp[1],"DRX 화염 드래곤 획득");
        ev(g2,1620,"TOWER",drx,null,"DRX 탑 1차 포탑 파괴");
        ev(g2,1800,"DRAGON",drx,drxp[1],"DRX 바람 드래곤 획득 (2번째)");
        ev(g2,1920,"BARON",drx,drxp[1],"DRX 바론 나스코르 획득");
        ev(g2,2100,"DRAGON",drx,drxp[1],"DRX 대지 드래곤 획득 (3번째)");
        ev(g2,2280,"GAME_END",drx,null,"DRX 게임 2 승리 - 시리즈 1-1 타이");
        anal(g2,drxp[2],"DRX가 블루 사이드에서 강력한 초반 운영으로 반격에 성공했습니다. Ucal의 Syndra가 라인전부터 압도적인 CS 우위를 바탕으로 중반 이후 게임을 지배했습니다. deokdam의 Aphelios 딜량이 팀 내 최고를 기록했습니다.",8.2,8.5);

        // Game 3: Gen.G(Blue) 승, 30분 (시리즈 결정전)
        Game g3 = game(m, 3, geng, drx, geng, 1800);
        pStats(g3, gp, new String[]{"Fiora","Vi","Viktor","Jinx","Nautilus"},
            new int[][]{{5,1,5,268,15800,21000,45},{3,0,8,175,13200,11000,38},
                        {6,1,6,320,17200,33500,30},{7,1,5,272,16500,36000,22},{0,0,14,42,9200,5800,80}}, 1800);
        pStats(g3, drxp, new String[]{"Gragas","Lillia","Orianna","Caitlyn","Leona"},
            new int[][]{{1,4,2,240,12500,12500,40},{2,3,3,162,11200,8200,35},
                        {3,5,2,290,13800,22000,25},{3,4,2,252,13500,24000,20},{0,3,7,38,8000,4500,72}}, 1800);
        tStats(g3,geng,9,4,2,1,5,80000,21); tStats(g3,drx,2,0,0,0,1,58500,9);
        ev(g3,720,"VOID_GRUB",geng,gp[1],"Gen.G 공허 유충 1번째 처치");
        ev(g3,780,"VOID_GRUB",geng,gp[1],"Gen.G 공허 유충 2번째 처치");
        ev(g3,840,"VOID_GRUB",drx,drxp[1],"DRX 공허 유충 3번째 처치");
        ev(g3,960,"VOID_GRUB",geng,gp[0],"Gen.G 공허 유충 4번째 처치");
        ev(g3,1080,"FIRST_BLOOD",geng,gp[3],"Peyz 퍼스트 블러드");
        ev(g3,1380,"DRAGON",geng,gp[1],"Gen.G 불꽃 드래곤 획득");
        ev(g3,1440,"HERALD",geng,gp[1],"Gen.G 전령 획득");
        ev(g3,1500,"TOWER",geng,null,"Gen.G 미드 포탑 파괴 (전령 활용)");
        ev(g3,1620,"BARON",geng,gp[1],"Gen.G 바론 획득으로 게임 마무리");
        ev(g3,1680,"DRAGON",geng,gp[1],"Gen.G 바람 드래곤 획득 (2번째)");
        ev(g3,1800,"GAME_END",geng,null,"Gen.G 게임 3 승리 - Gen.G 시리즈 2-1 승");
        anal(g3,gp[3],"Gen.G가 결정적인 3세트에서 압도적인 경기력으로 DRX를 제압했습니다. Peyz의 Jinx가 멀티킬을 달성하며 캐리했고, Canyon의 Vi가 핵심 오브젝트를 모두 장악했습니다. 시리즈 MVP는 Peyz입니다.",9.2,9.0);
    }

    // =============================================
    // MATCH 3: HLE 2-0 BFX (2025-01-22)
    // =============================================
    private void initHLEvsBFX(League lg, Team hle, Team bfx, Player[] hlep, Player[] bfxp) {
        Match m = match(lg, "2025 Spring", hle, bfx, 2, 0, MatchStatus.FINAL,
                        LocalDateTime.of(2025,1,22,17,0), hle);

        // Game 1: HLE(Blue) 승, 27분
        Game g1 = game(m, 1, hle, bfx, hle, 1620);
        pStats(g1, hlep, new String[]{"Jayce","Jarvan IV","Zed","Jinx","Thresh"},
            new int[][]{{3,0,5,228,13800,16500,42},{4,0,8,172,13200,11800,38},
                        {6,1,5,305,16200,29500,28},{7,1,4,260,15600,33000,22},{0,0,13,38,9000,5500,82}}, 1620);
        pStats(g1, bfxp, new String[]{"Garen","Lee Sin","Viktor","Caitlyn","Lulu"},
            new int[][]{{1,4,1,205,10800,10500,38},{1,3,2,158,10000,8200,30},
                        {2,5,2,275,13200,20500,24},{2,4,2,242,12500,21500,20},{0,3,6,35,7600,4000,68}}, 1620);
        tStats(g1,hle,9,4,1,1,5,72000,20); tStats(g1,bfx,1,0,0,0,1,52000,6);
        ev(g1,720,"VOID_GRUB",hle,hlep[1],"HLE 공허 유충 1번째 처치");
        ev(g1,780,"VOID_GRUB",hle,hlep[1],"HLE 공허 유충 2번째 처치");
        ev(g1,840,"VOID_GRUB",bfx,bfxp[1],"BFX 공허 유충 3번째 처치");
        ev(g1,900,"VOID_GRUB",hle,hlep[1],"HLE 공허 유충 4번째 처치");
        ev(g1,960,"FIRST_BLOOD",hle,hlep[2],"Zeka 퍼스트 블러드 솔로킬");
        ev(g1,1260,"DRAGON",hle,hlep[1],"HLE 대지 드래곤 획득");
        ev(g1,1320,"HERALD",hle,hlep[1],"HLE 전령 획득");
        ev(g1,1380,"TOWER",hle,null,"HLE 탑 1차 포탑 파괴 (전령)");
        ev(g1,1500,"BARON",hle,hlep[1],"HLE 바론 나스코르 획득");
        ev(g1,1620,"GAME_END",hle,null,"HLE 게임 1 승리");
        anal(g1,hlep[2],"HLE이 Zeka의 미드 지배력을 바탕으로 초반부터 우세를 점했습니다. Peanut의 정글링이 BFX의 정글 동선을 완전히 차단했으며, Viper의 안정적인 딜링이 팀의 한타 승리를 이끌었습니다.",8.8,9.0);

        // Game 2: BFX(Blue) HLE(Red) 승, 35분
        Game g2 = game(m, 2, bfx, hle, hle, 2100);
        pStats(g2, hlep, new String[]{"Fiora","Hecarim","Orianna","Kaisa","Blitzcrank"},
            new int[][]{{4,1,6,260,15500,20000,45},{5,1,9,180,14200,13000,40},
                        {6,2,6,318,17000,31000,30},{7,2,4,268,16000,34000,22},{0,1,15,40,9500,6000,82}}, 2100);
        pStats(g2, bfxp, new String[]{"Malphite","Xin Zhao","Syndra","Jhin","Nautilus"},
            new int[][]{{2,4,2,242,12500,13000,40},{2,3,3,162,11500,9000,35},
                        {3,5,2,295,14000,23000,25},{4,4,2,258,13800,26000,20},{0,3,7,38,8000,4800,70}}, 2100);
        tStats(g2,hle,8,4,2,0,4,80000,22); tStats(g2,bfx,3,1,0,1,2,62000,11);
        ev(g2,720,"VOID_GRUB",hle,hlep[1],"HLE 공허 유충 1번째 처치");
        ev(g2,840,"VOID_GRUB",bfx,bfxp[1],"BFX 공허 유충 2번째 처치");
        ev(g2,960,"VOID_GRUB",hle,hlep[0],"HLE 공허 유충 3번째 처치");
        ev(g2,1080,"HERALD",bfx,bfxp[1],"BFX 전령 획득");
        ev(g2,1320,"FIRST_BLOOD",hle,hlep[1],"Peanut 인베이드 킬");
        ev(g2,1440,"DRAGON",hle,hlep[1],"HLE 불꽃 드래곤 획득");
        ev(g2,1560,"DRAGON",bfx,bfxp[1],"BFX 대지 드래곤 획득");
        ev(g2,1680,"TOWER",hle,null,"HLE 미드 1차 포탑 파괴");
        ev(g2,1800,"BARON",hle,hlep[1],"HLE 바론 나스코르 획득");
        ev(g2,1920,"DRAGON",hle,hlep[1],"HLE 바람 드래곤 획득 (3번째)");
        ev(g2,2040,"ACE",hle,null,"HLE 5:0 에이스 달성");
        ev(g2,2100,"GAME_END",hle,null,"HLE 게임 2 승리 - HLE 시리즈 2-0 승");
        anal(g2,hlep[3],"HLE이 레드 사이드에서도 완벽한 경기력을 보여줬습니다. Viper의 Kai'Sa가 후반 한타에서 멀티킬을 달성하며 게임을 결정지었습니다. 전체적으로 HLE은 모든 오브젝트를 장악하며 압도적인 경기력을 선보였습니다.",9.0,9.3);
    }

    // =============================================
    // MATCH 4: T1 2-1 Gen.G (2025-02-05) - 라이벌 매치
    // =============================================
    private void initT1vsGENG(League lg, Team t1, Team geng, Player[] t1p, Player[] gp) {
        Match m = match(lg, "2025 Spring", t1, geng, 2, 1, MatchStatus.FINAL,
                        LocalDateTime.of(2025,2,5,17,0), t1);

        // Game 1: T1(Blue) 승, 34분
        Game g1 = game(m, 1, t1, geng, t1, 2040);
        pStats(g1, t1p, new String[]{"Gangplank","Lee Sin","Azir","Jinx","Thresh"},
            new int[][]{{4,2,5,272,15500,21000,45},{3,1,9,180,13800,12500,40},
                        {5,1,7,320,17000,31500,28},{6,2,5,275,16200,34000,22},{0,1,15,42,9500,6200,82}}, 2040);
        pStats(g1, gp, new String[]{"Darius","Vi","Viktor","Caitlyn","Nautilus"},
            new int[][]{{2,4,3,255,13000,15000,42},{2,3,4,172,12000,10500,36},
                        {4,4,3,308,15000,27000,26},{4,3,2,262,14200,28000,20},{0,3,9,40,8500,5500,75}}, 2040);
        tStats(g1,t1, 8,4,2,1,4,78000,18); tStats(g1,geng,3,1,0,0,2,62000,12);
        ev(g1,720,"VOID_GRUB",t1,t1p[1],"T1 공허 유충 1번째 처치");
        ev(g1,780,"VOID_GRUB",t1,t1p[1],"T1 공허 유충 2번째 처치");
        ev(g1,840,"VOID_GRUB",geng,gp[1],"Gen.G 공허 유충 3번째 처치");
        ev(g1,960,"VOID_GRUB",t1,t1p[0],"T1 공허 유충 4번째 처치");
        ev(g1,1200,"FIRST_BLOOD",t1,t1p[2],"Faker Gen.G 정글 인베이드에서 킬 획득");
        ev(g1,1320,"HERALD",t1,t1p[1],"T1 전령 획득");
        ev(g1,1440,"DRAGON",t1,t1p[1],"T1 불꽃 드래곤 획득");
        ev(g1,1560,"TOWER",t1,null,"T1 탑 1차 포탑 파괴 (전령)");
        ev(g1,1680,"DRAGON",geng,gp[1],"Gen.G 바람 드래곤 획득");
        ev(g1,1800,"BARON",t1,t1p[1],"T1 바론 나스코르 획득");
        ev(g1,1920,"DRAGON",t1,t1p[1],"T1 대지 드래곤 획득 (3번째)");
        ev(g1,2040,"GAME_END",t1,null,"T1 게임 1 승리");
        anal(g1,t1p[2],"T1 vs Gen.G 라이벌 매치에서 T1이 첫 세트를 가져갔습니다. Faker의 Azir가 팀 내 최고 딜량을 기록하며 존재감을 과시했습니다. Oner의 정글링이 Gen.G의 오브젝트 루트를 완전히 차단했습니다.",8.5,8.8);

        // Game 2: Gen.G(Blue) 승, 42분 (Gen.G 세트 탈환)
        Game g2 = game(m, 2, geng, t1, geng, 2520);
        pStats(g2, gp, new String[]{"Gragas","Rell","Orianna","Jinx","Leona"},
            new int[][]{{3,2,8,278,14800,15500,48},{2,1,12,172,13000,10000,42},
                        {5,2,8,330,17500,32000,30},{8,3,5,282,17000,37000,22},{0,2,16,42,9800,5800,85}}, 2520);
        pStats(g2, t1p, new String[]{"Malphite","Hecarim","Viktor","Caitlyn","Blitzcrank"},
            new int[][]{{2,4,3,260,13200,13800,42},{3,3,4,178,12800,11000,38},
                        {4,4,4,315,15800,28000,28},{5,4,2,268,14800,29000,20},{0,3,9,40,9000,5200,78}}, 2520);
        tStats(g2,geng,9,4,3,1,5,92000,18); tStats(g2,t1,4,2,1,0,1,73500,14);
        ev(g2,720,"VOID_GRUB",geng,gp[1],"Gen.G 공허 유충 1번째 처치");
        ev(g2,840,"VOID_GRUB",t1,t1p[1],"T1 공허 유충 2번째 처치");
        ev(g2,960,"VOID_GRUB",geng,gp[0],"Gen.G 공허 유충 3번째 처치");
        ev(g2,1200,"FIRST_BLOOD",geng,gp[1],"Canyon 정글 킬로 퍼스트 블러드");
        ev(g2,1380,"DRAGON",geng,gp[1],"Gen.G 불꽃 드래곤 획득");
        ev(g2,1500,"HERALD",geng,gp[1],"Gen.G 전령 획득");
        ev(g2,1680,"DRAGON",t1,t1p[1],"T1 대지 드래곤 획득");
        ev(g2,1800,"BARON",geng,gp[1],"Gen.G 바론 나스코르 1차 획득");
        ev(g2,1980,"DRAGON",geng,gp[1],"Gen.G 바람 드래곤 획득 (3번째)");
        ev(g2,2100,"BARON",t1,t1p[1],"T1 바론 나스코르 탈취 성공! (역전 시도)");
        ev(g2,2280,"BARON",geng,gp[1],"Gen.G 바론 재획득 후 어드밴티지 확보");
        ev(g2,2400,"DRAGON",geng,gp[1],"Gen.G 드래곤 소울 획득 (4번째)");
        ev(g2,2520,"GAME_END",geng,null,"Gen.G 게임 2 승리 - 시리즈 1-1 타이");
        anal(g2,gp[3],"Gen.G가 긴 운영 끝에 T1에게 한 세트를 내줬습니다. 중반 T1의 바론 탈취 시도가 게임을 뒤흔들었으나, Gen.G가 드래곤 소울까지 획득하며 결국 승리를 거뒀습니다. Peyz의 Jinx가 드래곤 소울 버프를 받아 후반 한타를 지배했습니다.",9.5,9.0);

        // Game 3: T1(Blue) 승, 36분 (시리즈 결정전)
        Game g3 = game(m, 3, t1, geng, t1, 2160);
        pStats(g3, t1p, new String[]{"Jayce","Vi","Azir","Jinx","Nautilus"},
            new int[][]{{4,1,6,275,15800,20500,46},{4,0,10,185,14200,12500,42},
                        {7,1,8,328,17800,33000,28},{8,2,5,278,17000,36500,22},{0,1,18,45,9800,6000,84}}, 2160);
        pStats(g3, gp, new String[]{"Gangplank","Rell","Viktor","Caitlyn","Thresh"},
            new int[][]{{2,4,3,262,13800,16000,44},{2,2,5,175,12800,10500,38},
                        {4,5,3,315,15800,28000,28},{4,4,2,268,15000,29000,20},{0,3,10,42,9200,5500,80}}, 2160);
        tStats(g3,t1, 10,4,2,1,5,84000,23); tStats(g3,geng,2,1,0,0,1,64500,10);
        ev(g3,720,"VOID_GRUB",t1,t1p[1],"T1 공허 유충 1번째 처치");
        ev(g3,780,"VOID_GRUB",t1,t1p[1],"T1 공허 유충 2번째 처치");
        ev(g3,840,"VOID_GRUB",t1,t1p[0],"T1 공허 유충 3번째 처치");
        ev(g3,960,"VOID_GRUB",geng,gp[1],"Gen.G 공허 유충 4번째 처치");
        ev(g3,1020,"VOID_GRUB",t1,t1p[1],"T1 공허 유충 5번째 처치");
        ev(g3,1140,"FIRST_BLOOD",t1,t1p[2],"Faker 미드 솔로킬 퍼스트 블러드");
        ev(g3,1320,"HERALD",t1,t1p[1],"T1 전령 획득");
        ev(g3,1440,"DRAGON",t1,t1p[1],"T1 불꽃 드래곤 획득");
        ev(g3,1500,"TOWER",t1,null,"T1 미드 포탑 파괴 (전령)");
        ev(g3,1620,"KILL",t1,t1p[2],"T1 4킬 한타 승리 - Faker 트리플킬");
        ev(g3,1740,"DRAGON",t1,t1p[1],"T1 대지 드래곤 획득 (2번째)");
        ev(g3,1800,"BARON",t1,t1p[1],"T1 바론 나스코르 획득");
        ev(g3,1980,"DRAGON",t1,t1p[1],"T1 바람 드래곤 획득 (3번째)");
        ev(g3,2040,"ACE",t1,null,"T1 에이스 달성 후 넥서스 공략");
        ev(g3,2160,"GAME_END",t1,null,"T1 게임 3 승리 - T1 시리즈 2-1 승 (라이벌 매치 승리)");
        anal(g3,t1p[2],"역대급 라이벌 매치에서 T1이 최종 승리를 거뒀습니다. Faker의 Azir가 7킬을 달성하며 MVP 퍼포먼스를 선보였습니다. 특히 1620초 한타에서 Faker의 트리플킬이 게임의 전세를 완전히 바꿨습니다. 이 경기는 LCK 2025 Spring 최고의 명경기로 평가받습니다.",9.8,9.5);
    }

    // =============================================
    // MATCH 5: DK 2-0 NS (2025-02-12)
    // =============================================
    private void initDKvsNS(League lg, Team dk, Team ns, Player[] dkp, Player[] nsp) {
        Match m = match(lg, "2025 Spring", dk, ns, 2, 0, MatchStatus.FINAL,
                        LocalDateTime.of(2025,2,12,17,0), dk);

        // Game 1: DK(Blue) 승, 30분
        Game g1 = game(m, 1, dk, ns, dk, 1800);
        pStats(g1, dkp, new String[]{"Camille","Hecarim","Orianna","Jinx","Thresh"},
            new int[][]{{3,1,5,255,14500,17500,42},{4,0,8,180,13800,12000,38},
                        {5,1,7,315,16500,30000,28},{6,2,4,268,15800,32500,22},{0,1,13,42,9200,5500,80}}, 1800);
        pStats(g1, nsp, new String[]{"Garen","Lee Sin","Viktor","Caitlyn","Lulu"},
            new int[][]{{1,4,2,225,11200,11000,38},{1,3,3,162,10500,8500,32},
                        {2,5,2,285,13800,21500,24},{3,3,2,252,13200,23000,20},{0,2,7,38,7800,4000,68}}, 1800);
        tStats(g1,dk, 9,4,2,1,5,76000,18); tStats(g1,ns, 1,0,0,0,1,54000,6);
        ev(g1,720,"VOID_GRUB",dk,dkp[1],"DK 공허 유충 1번째 처치");
        ev(g1,780,"VOID_GRUB",dk,dkp[1],"DK 공허 유충 2번째 처치");
        ev(g1,840,"VOID_GRUB",ns,nsp[1],"NS 공허 유충 3번째 처치");
        ev(g1,960,"VOID_GRUB",dk,dkp[0],"DK 공허 유충 4번째 처치");
        ev(g1,1080,"FIRST_BLOOD",dk,dkp[2],"ShowMaker 라인전 솔로킬");
        ev(g1,1320,"DRAGON",dk,dkp[1],"DK 화염 드래곤 획득");
        ev(g1,1380,"HERALD",dk,dkp[1],"DK 전령 획득");
        ev(g1,1500,"TOWER",dk,null,"DK 미드 포탑 파괴");
        ev(g1,1620,"BARON",dk,dkp[1],"DK 바론 나스코르 획득");
        ev(g1,1680,"DRAGON",dk,dkp[1],"DK 바람 드래곤 획득 (2번째)");
        ev(g1,1800,"GAME_END",dk,null,"DK 게임 1 승리");
        anal(g1,dkp[2],"DK가 ShowMaker의 미드 라인 지배력을 중심으로 안정적인 승리를 거뒀습니다. Lucid의 정글링이 NS의 모든 정글 경로를 차단했으며, BeryL의 서포팅이 팀 전체의 생존을 돕는 결정적 역할을 했습니다.",8.5,9.0);

        // Game 2: NS(Blue) DK(Red) 승, 35분
        Game g2 = game(m, 2, ns, dk, dk, 2100);
        pStats(g2, dkp, new String[]{"Darius","Vi","Azir","Kaisa","Nautilus"},
            new int[][]{{3,1,6,262,15200,18000,42},{4,1,8,175,13500,12000,40},
                        {6,1,6,320,17200,31500,28},{7,2,4,272,16200,34000,22},{0,1,15,42,9500,5800,82}}, 2100);
        pStats(g2, nsp, new String[]{"Malphite","Xin Zhao","Syndra","Jinx","Blitzcrank"},
            new int[][]{{1,4,2,248,12500,12500,40},{2,3,3,165,11500,9000,35},
                        {3,5,2,295,14000,23000,25},{4,4,2,258,13800,26000,20},{0,3,7,38,8000,4800,72}}, 2100);
        tStats(g2,dk, 8,4,2,0,4,80000,20); tStats(g2,ns, 2,1,0,1,2,62000,10);
        ev(g2,720,"VOID_GRUB",dk,dkp[1],"DK 공허 유충 1번째 처치");
        ev(g2,840,"VOID_GRUB",ns,nsp[1],"NS 공허 유충 2번째 처치");
        ev(g2,960,"VOID_GRUB",dk,dkp[0],"DK 공허 유충 3번째 처치");
        ev(g2,1080,"HERALD",ns,nsp[1],"NS 전령 획득");
        ev(g2,1260,"FIRST_BLOOD",dk,dkp[2],"ShowMaker Syndra 킬 획득");
        ev(g2,1380,"DRAGON",ns,nsp[1],"NS 불꽃 드래곤 획득");
        ev(g2,1500,"DRAGON",dk,dkp[1],"DK 대지 드래곤 획득 (2번째)");
        ev(g2,1620,"TOWER",dk,null,"DK 바텀 1차 포탑 파괴");
        ev(g2,1800,"BARON",dk,dkp[1],"DK 바론 나스코르 획득");
        ev(g2,1920,"DRAGON",dk,dkp[1],"DK 바람 드래곤 획득 (3번째)");
        ev(g2,2040,"ACE",dk,null,"DK 에이스 후 넥서스 공략");
        ev(g2,2100,"GAME_END",dk,null,"DK 게임 2 승리 - DK 시리즈 2-0 승");
        anal(g2,dkp[2],"DK가 NS를 상대로 완벽한 스윕 승리를 달성했습니다. ShowMaker의 Azir가 2세트 연속 압도적인 라인전을 보여줬으며, 팀 내 딜 비율에서도 가장 높은 수치를 기록했습니다. DK는 이 승리로 LCK 2025 Spring 상위권 진입에 성공했습니다.",8.8,8.9);
    }

    // =============================================
    // HELPER METHODS
    // =============================================

    private League league(String name, String region, String season) {
        return leagueRepo.findByLeagueNameAndSeason(name, season)
            .orElseGet(() -> leagueRepo.save(League.builder()
                .sportType(SportType.ESPORTS).leagueName(name)
                .season(season).country(region).build()));
    }

    private Team team(League lg, String name, String shortName) {
        return teamRepo.save(Team.builder()
            .sportType(SportType.ESPORTS).league(lg)
            .teamName(name).shortName(shortName).country("KR").build());
    }

    private Player[] mkPlayers(Team team, String... specs) {
        Player[] arr = new Player[specs.length];
        for (int i = 0; i < specs.length; i++) {
            String[] parts = specs[i].split("/");
            arr[i] = playerRepo.save(Player.builder()
                .sportType(SportType.ESPORTS).team(team)
                .playerName(parts[0]).nickname(parts[1]).position(parts[2])
                .nationality("KR").build());
        }
        return arr;
    }

    private Match match(League lg, String season, Team home, Team away,
                        int hs, int as, MatchStatus status,
                        LocalDateTime date, Team winner) {
        return matchRepo.save(Match.builder()
            .sportType(SportType.ESPORTS).league(lg).season(season)
            .matchDate(date).homeTeam(home).awayTeam(away)
            .homeScore(hs).awayScore(as).venue("LoL Park")
            .status(status).winnerTeam(winner).build());
    }

    private Game game(Match m, int num, Team blue, Team red, Team winner, int dur) {
        return gameRepo.save(Game.builder()
            .match(m).gameNumber(num).blueTeam(blue).redTeam(red)
            .winnerTeam(winner).duration(dur).build());
    }

    /**
     * 선수 스탯 일괄 저장
     * stats 행: [kills, deaths, assists, cs, gold, damage, visionScore]
     */
    private void pStats(Game game, Player[] players, String[] champs,
                        int[][] stats, int duration) {
        double min = duration / 60.0;
        int totalDmg = 0;
        for (int[] s : stats) totalDmg += s[5];

        for (int i = 0; i < 5; i++) {
            int[] s = stats[i];
            double dpm   = Math.round(s[5] / min * 100.0) / 100.0;
            double ratio = totalDmg > 0 ? Math.round(s[5] * 10000.0 / totalDmg) / 100.0 : 0;
            pgsRepo.save(PlayerGameStat.builder()
                .game(game).player(players[i]).championName(champs[i])
                .kills(s[0]).deaths(s[1]).assists(s[2]).cs(s[3])
                .gold(s[4]).damage(s[5]).visionScore(s[6])
                .dpm(dpm).teamDamageRatio(ratio).build());
        }
    }

    private void tStats(Game game, Team team,
                        int tw, int dr, int ba, int he, int vg, int gold, int kills) {
        tgsRepo.save(TeamGameStat.builder()
            .game(game).team(team)
            .towerKills(tw).dragonKills(dr).baronKills(ba)
            .heraldKills(he).voidGrubKills(vg)
            .totalGold(gold).totalKills(kills).build());
    }

    private void ev(Game game, int time, String type, Team team, Player player, String desc) {
        teRepo.save(LckTimelineEvent.builder()
            .game(game).eventTime(time).eventType(type)
            .team(team).player(player).description(desc).build());
    }

    private void anal(Game game, Player keyPlayer, String summary,
                      double teamFight, double objective) {
        arRepo.save(LckAnalysisResult.builder()
            .game(game).keyPlayer(keyPlayer).summary(summary)
            .teamFightScore(teamFight).objectiveScore(objective).build());
    }
}
