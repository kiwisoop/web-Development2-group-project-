import { useState } from 'react';

const GRADIENTS = {
  LAD: 'linear-gradient(135deg,#005a9c,#1ec8ff)',
  NYY: 'linear-gradient(135deg,#003087,#7c5cff)',
  BOS: 'linear-gradient(135deg,#bd3039,#ff8a3d)',
  SF: 'linear-gradient(135deg,#fd5a1e,#ff4dd2)',
  HOU: 'linear-gradient(135deg,#ff6b35,#ff4d6d)',
  ATL: 'linear-gradient(135deg,#ce1141,#ff4dd2)',
  T1: 'linear-gradient(135deg,#b6ff3a,#00d27a)',
  GEN: 'linear-gradient(135deg,#ff8a3d,#ff4dd2)',
  DK: 'linear-gradient(135deg,#ff4d6d,#7c5cff)',
  DRX: 'linear-gradient(135deg,#005bbb,#18d6ff)',
  KT: 'linear-gradient(135deg,#cc0000,#ff8a3d)',
  HLE: 'linear-gradient(135deg,#ff7000,#ff4dd2)',
};

const K_LEAGUE_LOGOS = [
  ['FC Seoul', 'https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f7ff7ea6c1da2fb26909f1_fc-seoul-footballlogos-org.svg'],
  ['Incheon United', 'https://iconape.com/wp-content/png_logo_vector/incheon-united-fc-logo.png'],
  ['Bucheon FC 1995', 'https://assets.fclogo.top/png/bucheon-fc-v0000.png'],
  ['Gangwon FC', 'https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f8008a19ff9663b28c9475_gangwon-fc-footballlogos-org.svg'],
  ['Daegu FC', 'https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f8004e0fcd1c4d0490ba06_daegu-fc-footballlogos-org.svg'],
  ['Jeju SK', 'https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f8001a292560df11b84793_jeju-sk-footballlogos-org.svg'],
  ['Jeju United', 'https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f8001a292560df11b84793_jeju-sk-footballlogos-org.svg'],
  ['Daejeon Hana Citizen', 'https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f7ffdd73d1e11cd4e2c149_daejeon-hana-citizen-footballlogos-org.svg'],
  ['FC Anyang', 'https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f801ae0fcd1c4d0490fa02_fc-anyang-footballlogos-org.svg'],
  ['Jeonbuk Hyundai Motors', 'https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f7fee64de5077d96824a19_jeonbuk-hyundai-footballlogos-org.svg'],
  ['Pohang Steelers', 'https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f7fea84fa3e81853b93392_pohang-steelers-footballlogos-org.svg'],
  ['Ulsan HD', 'https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f7fe6adf78ff0e3819e4fb_ulsan-hd-footballlogos-org.svg'],
  ['Gimcheon Sangmu', 'https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f7fe1c1be3b08578b7fca3_gimcheon-sangmu-footballlogos-org.svg'],
  ['Gwangju FC', 'https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f7fdd0a9b05a6cdb5441a1_gwangju-fc-footballlogos-org.svg'],
  ['Suwon FC', 'https://cdn.prod.website-files.com/68f550992570ca0322737dc2/68f80141ca2e509642f9b6d1_suwon-fc-footballlogos-org.svg'],
];

const MLB_LOGOS = [
  ['Tampa Bay Rays', 'https://a.espncdn.com/i/teamlogos/mlb/500/tb.png'],
  ['Los Angeles Angels', 'https://a.espncdn.com/i/teamlogos/mlb/500/laa.png'],
  ['Houston Astros', 'https://a.espncdn.com/i/teamlogos/mlb/500/hou.png'],
  ['Texas Rangers', 'https://a.espncdn.com/i/teamlogos/mlb/500/tex.png'],
  ['New York Mets', 'https://a.espncdn.com/i/teamlogos/mlb/500/nym.png'],
  ['Miami Marlins', 'https://a.espncdn.com/i/teamlogos/mlb/500/mia.png'],
  ['Seattle Mariners', 'https://a.espncdn.com/i/teamlogos/mlb/500/sea.png'],
  ['Arizona Diamondbacks', 'https://a.espncdn.com/i/teamlogos/mlb/500/ari.png'],
  ['Los Angeles Dodgers', 'https://a.espncdn.com/i/teamlogos/mlb/500/lad.png'],
  ['Philadelphia Phillies', 'https://a.espncdn.com/i/teamlogos/mlb/500/phi.png'],
  ['Athletics', 'https://a.espncdn.com/i/teamlogos/mlb/500/ath.png'],
  ['New York Yankees', 'https://a.espncdn.com/i/teamlogos/mlb/500/nyy.png'],
  ['Colorado Rockies', 'https://a.espncdn.com/i/teamlogos/mlb/500/col.png'],
  ['San Francisco Giants', 'https://a.espncdn.com/i/teamlogos/mlb/500/sf.png'],
  ['Kansas City Royals', 'https://a.espncdn.com/i/teamlogos/mlb/500/kc.png'],
  ['Chicago White Sox', 'https://a.espncdn.com/i/teamlogos/mlb/500/chw.png'],
  ['Detroit Tigers', 'https://a.espncdn.com/i/teamlogos/mlb/500/det.png'],
  ['Milwaukee Brewers', 'https://a.espncdn.com/i/teamlogos/mlb/500/mil.png'],
  ['Cincinnati Reds', 'https://a.espncdn.com/i/teamlogos/mlb/500/cin.png'],
  ['Atlanta Braves', 'https://a.espncdn.com/i/teamlogos/mlb/500/atl.png'],
  ['Cleveland Guardians', 'https://a.espncdn.com/i/teamlogos/mlb/500/cle.png'],
  ['Boston Red Sox', 'https://a.espncdn.com/i/teamlogos/mlb/500/bos.png'],
  ['Chicago Cubs', 'https://a.espncdn.com/i/teamlogos/mlb/500/chc.png'],
  ['St. Louis Cardinals', 'https://a.espncdn.com/i/teamlogos/mlb/500/stl.png'],
  ['Toronto Blue Jays', 'https://a.espncdn.com/i/teamlogos/mlb/500/tor.png'],
  ['Baltimore Orioles', 'https://a.espncdn.com/i/teamlogos/mlb/500/bal.png'],
  ['Minnesota Twins', 'https://a.espncdn.com/i/teamlogos/mlb/500/min.png'],
  ['Pittsburgh Pirates', 'https://a.espncdn.com/i/teamlogos/mlb/500/pit.png'],
  ['Washington Nationals', 'https://a.espncdn.com/i/teamlogos/mlb/500/wsh.png'],
  ['San Diego Padres', 'https://a.espncdn.com/i/teamlogos/mlb/500/sd.png'],
];

const ESPORTS_LOGOS = [
  ['T1', 'https://commons.wikimedia.org/wiki/Special:Redirect/file/T1_(esports).png'],
  ['KT Rolster', 'https://static.cdnlogo.com/logos/k/15/kt-rolster.svg'],
  ['Gen.G', 'https://static.wikia.nocookie.net/lolesports_gamepedia_en/images/7/78/Gen.Glogo_profile.png'],
  ['Dplus KIA', 'https://static.wikia.nocookie.net/lolesports_gamepedia_en/images/5/5f/Dplus_KIAlogo_square.png'],
  ['Hanwha Life Esports', 'https://static.wikia.nocookie.net/lolesports_gamepedia_en/images/9/9e/Hanwha_Life_Esportslogo_square.png'],
  ['NONGSHIM RED FORCE', 'https://static.wikia.nocookie.net/lolesports_gamepedia_en/images/5/52/Nongshim_RedForcelogo_square.png'],
  ['DRX', 'https://static.wikia.nocookie.net/lolesports_gamepedia_en/images/f/f7/DRXlogo_square.png'],
  ['BNK FEARX', 'https://static.wikia.nocookie.net/lolesports_gamepedia_en/images/0/0e/BNK_FEARXlogo_square.png'],
  ['BRION', 'https://static.wikia.nocookie.net/lolesports_gamepedia_en/images/4/4f/BRIONlogo_square.png'],
];

function mappedLogoUrl(team) {
  if (team?.logoUrl) return team.logoUrl;
  const name = String(team?.teamName || team?.name || team?.shortName || '').toLowerCase();
  const allLogos = [...K_LEAGUE_LOGOS, ...MLB_LOGOS, ...ESPORTS_LOGOS];
  const found = allLogos.find(([teamName]) => name.includes(teamName.toLowerCase()) || teamName.toLowerCase().includes(name));
  return found?.[1] || null;
}

export default function TeamLogo({ team, size = 38, radius = 10 }) {
  const [imgErr, setImgErr] = useState(false);

  const code = team
    ? String(team.shortName || team.teamName || team.name || '?').slice(0, 3).toUpperCase()
    : '?';
  const gradient = team?.teamColor
    ? `linear-gradient(135deg, ${team.teamColor}, #18d6ff)`
    : GRADIENTS[code] || 'linear-gradient(135deg,#7c5cff,#18d6ff)';

  const logoUrl = mappedLogoUrl(team);
  const hasLogo = Boolean(logoUrl && !imgErr);
  const wrapStyle = {
    width: size,
    height: size,
    borderRadius: radius,
    flexShrink: 0,
    display: 'grid',
    placeItems: 'center',
    overflow: 'hidden',
    background: hasLogo ? 'rgba(255,255,255,0.05)' : gradient,
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.16), 0 2px 8px rgba(0,0,0,0.28)',
    color: '#fff',
    fontWeight: 800,
    fontSize: Math.max(10, Math.round(size * 0.32)),
    letterSpacing: 0,
    border: '1px solid rgba(255,255,255,0.14)',
  };

  return (
    <div style={wrapStyle} title={team?.teamName || team?.shortName || ''} aria-label={team?.teamName || code}>
      {hasLogo ? (
        <img
          src={logoUrl}
          alt={team.teamName || code}
          style={{ width: '100%', height: '100%', objectFit: 'contain', padding: Math.max(3, Math.round(size * 0.1)) }}
          onError={() => setImgErr(true)}
        />
      ) : (
        code
      )}
    </div>
  );
}
