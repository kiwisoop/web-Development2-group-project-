-- Sample data. Loaded after JPA creates the schema.
-- SOCCER: full reference data (3 matches with stats + events).
-- Other sports: 3 matches each (basic info only) so spec minimum is met.

-- ===== SOCCER =====
INSERT INTO matches (sport_type, league_name, match_date, home_team, away_team, home_score, away_score, venue, status, basic_summary)
VALUES ('SOCCER', 'Premier League', '2026-05-01 20:00:00', 'Manchester United', 'Liverpool', 2, 1, 'Old Trafford', 'FINISHED',
 'A tight derby with United edging it 2-1 thanks to a late winner.');
INSERT INTO matches (sport_type, league_name, match_date, home_team, away_team, home_score, away_score, venue, status, basic_summary)
VALUES ('SOCCER', 'La Liga', '2026-05-03 21:00:00', 'Real Madrid', 'Barcelona', 3, 3, 'Santiago Bernabeu', 'FINISHED',
 'A six-goal Clasico thriller ended in a dramatic draw.');
INSERT INTO matches (sport_type, league_name, match_date, home_team, away_team, home_score, away_score, venue, status, basic_summary)
VALUES ('SOCCER', 'K League 1', '2026-05-08 19:30:00', 'FC Seoul', 'Ulsan HD', 1, 2, 'Seoul World Cup Stadium', 'FINISHED',
 'Ulsan came from behind on the road to beat Seoul 2-1.');

-- Soccer stats (match 1: United vs Liverpool)
INSERT INTO match_stats (match_id, team_name, stat_name, stat_value) VALUES (1, 'Manchester United', 'Possession%', '48');
INSERT INTO match_stats (match_id, team_name, stat_name, stat_value) VALUES (1, 'Liverpool', 'Possession%', '52');
INSERT INTO match_stats (match_id, team_name, stat_name, stat_value) VALUES (1, 'Manchester United', 'Shots', '12');
INSERT INTO match_stats (match_id, team_name, stat_name, stat_value) VALUES (1, 'Liverpool', 'Shots', '14');
INSERT INTO match_stats (match_id, team_name, stat_name, stat_value) VALUES (1, 'Manchester United', 'ShotsOnTarget', '6');
INSERT INTO match_stats (match_id, team_name, stat_name, stat_value) VALUES (1, 'Liverpool', 'ShotsOnTarget', '5');

-- Match 2 stats
INSERT INTO match_stats (match_id, team_name, stat_name, stat_value) VALUES (2, 'Real Madrid', 'Possession%', '54');
INSERT INTO match_stats (match_id, team_name, stat_name, stat_value) VALUES (2, 'Barcelona', 'Possession%', '46');
INSERT INTO match_stats (match_id, team_name, stat_name, stat_value) VALUES (2, 'Real Madrid', 'Shots', '15');
INSERT INTO match_stats (match_id, team_name, stat_name, stat_value) VALUES (2, 'Barcelona', 'Shots', '13');

-- Match 3 stats
INSERT INTO match_stats (match_id, team_name, stat_name, stat_value) VALUES (3, 'FC Seoul', 'Possession%', '45');
INSERT INTO match_stats (match_id, team_name, stat_name, stat_value) VALUES (3, 'Ulsan HD', 'Possession%', '55');
INSERT INTO match_stats (match_id, team_name, stat_name, stat_value) VALUES (3, 'FC Seoul', 'Shots', '9');
INSERT INTO match_stats (match_id, team_name, stat_name, stat_value) VALUES (3, 'Ulsan HD', 'Shots', '11');

-- Soccer events
INSERT INTO match_events (match_id, event_time, team_name, player_name, event_type, description) VALUES (1, '23''', 'Liverpool', 'M. Salah', 'GOAL', 'Salah finishes a counter-attack.');
INSERT INTO match_events (match_id, event_time, team_name, player_name, event_type, description) VALUES (1, '54''', 'Manchester United', 'B. Fernandes', 'GOAL', 'Fernandes equalises with a long-range strike.');
INSERT INTO match_events (match_id, event_time, team_name, player_name, event_type, description) VALUES (1, '88''', 'Manchester United', 'R. Hojlund', 'GOAL', 'Late header secures the win for United.');

INSERT INTO match_events (match_id, event_time, team_name, player_name, event_type, description) VALUES (2, '12''', 'Real Madrid', 'Vinicius Jr', 'GOAL', 'Opens the scoring after a quick break.');
INSERT INTO match_events (match_id, event_time, team_name, player_name, event_type, description) VALUES (2, '34''', 'Barcelona', 'Lewandowski', 'GOAL', 'Equaliser from close range.');
INSERT INTO match_events (match_id, event_time, team_name, player_name, event_type, description) VALUES (2, '90+3''', 'Barcelona', 'Yamal', 'GOAL', 'Stoppage-time leveller for the draw.');

INSERT INTO match_events (match_id, event_time, team_name, player_name, event_type, description) VALUES (3, '30''', 'FC Seoul', 'J. Kim', 'GOAL', 'Header from a corner.');
INSERT INTO match_events (match_id, event_time, team_name, player_name, event_type, description) VALUES (3, '67''', 'Ulsan HD', 'M. Lee', 'GOAL', 'Equaliser via penalty.');
INSERT INTO match_events (match_id, event_time, team_name, player_name, event_type, description) VALUES (3, '83''', 'Ulsan HD', 'S. Joo', 'GOAL', 'Winning goal on the counter.');

-- ===== VOLLEYBALL =====
INSERT INTO matches (sport_type, league_name, match_date, home_team, away_team, home_score, away_score, venue, status, basic_summary)
VALUES ('VOLLEYBALL', 'V-League', '2026-04-28 19:00:00', 'Hyundai Capital', 'Korean Air', 3, 1, 'Cheonan Arena', 'FINISHED', 'Hyundai Capital takes the match 3-1 in sets.');
INSERT INTO matches (sport_type, league_name, match_date, home_team, away_team, home_score, away_score, venue, status, basic_summary)
VALUES ('VOLLEYBALL', 'V-League', '2026-04-30 19:00:00', 'KB Stars', 'IBK Altos', 3, 2, 'Suwon Arena', 'FINISHED', 'A five-set thriller for KB Stars.');
INSERT INTO matches (sport_type, league_name, match_date, home_team, away_team, home_score, away_score, venue, status, basic_summary)
VALUES ('VOLLEYBALL', 'V-League', '2026-05-05 19:00:00', 'Samsung Bluefangs', 'OK Savings', 0, 3, 'Daejeon Arena', 'FINISHED', 'OK Savings sweep the road match 3-0.');

-- ===== BASKETBALL =====
INSERT INTO matches (sport_type, league_name, match_date, home_team, away_team, home_score, away_score, venue, status, basic_summary)
VALUES ('BASKETBALL', 'KBL', '2026-04-29 19:00:00', 'SK Knights', 'KGC Ginseng', 88, 81, 'Jamsil Arena', 'FINISHED', 'SK Knights edged a tight finish 88-81.');
INSERT INTO matches (sport_type, league_name, match_date, home_team, away_team, home_score, away_score, venue, status, basic_summary)
VALUES ('BASKETBALL', 'KBL', '2026-05-02 19:00:00', 'Samsung Thunders', 'LG Sakers', 95, 102, 'Jamsil Arena', 'FINISHED', 'Sakers overcame a 12-point deficit.');
INSERT INTO matches (sport_type, league_name, match_date, home_team, away_team, home_score, away_score, venue, status, basic_summary)
VALUES ('BASKETBALL', 'KBL', '2026-05-06 19:00:00', 'KCC Egis', 'DB Promy', 76, 78, 'Jeonju Arena', 'FINISHED', 'A buzzer-beater decided this two-point game.');

-- ===== ESPORTS =====
INSERT INTO matches (sport_type, league_name, match_date, home_team, away_team, home_score, away_score, venue, status, basic_summary)
VALUES ('ESPORTS', 'LCK', '2026-04-27 17:00:00', 'T1', 'GenG', 2, 1, 'LoL Park', 'FINISHED', 'T1 take the BO3 2-1.');
INSERT INTO matches (sport_type, league_name, match_date, home_team, away_team, home_score, away_score, venue, status, basic_summary)
VALUES ('ESPORTS', 'LCK', '2026-05-01 17:00:00', 'DRX', 'KT Rolster', 0, 2, 'LoL Park', 'FINISHED', 'KT sweep DRX 2-0.');
INSERT INTO matches (sport_type, league_name, match_date, home_team, away_team, home_score, away_score, venue, status, basic_summary)
VALUES ('ESPORTS', 'LCK', '2026-05-04 17:00:00', 'Hanwha Life', 'Dplus KIA', 2, 0, 'LoL Park', 'FINISHED', 'Hanwha Life sweep 2-0.');

-- A demo user
INSERT INTO users (username, password, email, nickname) VALUES ('demo', 'demo123', 'demo@example.com', 'Demo User');
