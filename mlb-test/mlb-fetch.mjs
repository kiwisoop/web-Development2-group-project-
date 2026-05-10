// mlb-fetch.mjs
// MLB schedule and game detail test script
// Run:
// node mlb-fetch.mjs 2025-06-01
// node mlb-fetch.mjs 2025-06-01 777156

const BASE_URL = "https://statsapi.mlb.com/api/v1";

async function getJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

function simplifyGame(game) {
  const home = game.teams?.home;
  const away = game.teams?.away;

  const innings = game.linescore?.innings?.map((inning) => ({
    inning: inning.num,
    awayRuns: inning.away?.runs ?? 0,
    homeRuns: inning.home?.runs ?? 0,
  })) ?? [];

  return {
    gamePk: game.gamePk,
    date: game.gameDate,
    status: game.status?.detailedState,
    venue: game.venue?.name,
    awayTeam: away?.team?.name,
    homeTeam: home?.team?.name,
    awayScore: away?.score ?? "-",
    homeScore: home?.score ?? "-",
    innings,
  };
}

async function fetchSchedule(date) {
  const url =
    `${BASE_URL}/schedule?sportId=1&date=${date}&hydrate=team,linescore`;

  const data = await getJson(url);
  const games = data.dates?.flatMap((d) => d.games) ?? [];

  return games.map(simplifyGame);
}

async function fetchGameDetail(gamePk) {
  const url = `${BASE_URL}/game/${gamePk}/feed/live`;
  const data = await getJson(url);

  const gameData = data.gameData;
  const liveData = data.liveData;

  const allPlays = liveData?.plays?.allPlays ?? [];

  const recentPlays = allPlays.slice(-10).map((play) => ({
    inning: play.about?.inning,
    halfInning: play.about?.halfInning,
    event: play.result?.event,
    description: play.result?.description,
  }));

  return {
    gamePk,
    status: gameData?.status?.detailedState,
    venue: gameData?.venue?.name,
    awayTeam: gameData?.teams?.away?.name,
    homeTeam: gameData?.teams?.home?.name,
    currentInning: liveData?.linescore?.currentInning,
    currentInningHalf: liveData?.linescore?.inningHalf,
    awayScore: liveData?.linescore?.teams?.away?.runs ?? "-",
    homeScore: liveData?.linescore?.teams?.home?.runs ?? "-",
    recentPlays,
  };
}

async function main() {
  const date = process.argv[2] ?? new Date().toISOString().slice(0, 10);
  const gamePk = process.argv[3];

  console.log(`\nMLB Schedule Date: ${date}\n`);

  const games = await fetchSchedule(date);

  if (games.length === 0) {
    console.log("No MLB games found for this date.");
    return;
  }

  console.table(
    games.map((g) => ({
      gamePk: g.gamePk,
      status: g.status,
      away: g.awayTeam,
      home: g.homeTeam,
      score: `${g.awayScore} : ${g.homeScore}`,
      venue: g.venue,
    }))
  );

  console.log("\nFirst game's inning score example:");
  console.log(games[0].innings);

  if (gamePk) {
    console.log(`\nMLB Game Detail: ${gamePk}\n`);
    const detail = await fetchGameDetail(gamePk);
    console.log(JSON.stringify(detail, null, 2));
  } else {
    console.log("\nTo get detail, run:");
    console.log(`node mlb-fetch.mjs ${date} ${games[0].gamePk}`);
  }
}

main().catch((error) => {
  console.error("Error:", error.message);
});