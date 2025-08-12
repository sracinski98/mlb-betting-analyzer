import fetch from 'node-fetch';

// Fetch pitcher stats and recent performance
async function getPitcherStats(playerId) {
  try {
    const statsUrl = `https://statsapi.mlb.com/api/v1/people/${playerId}/stats?stats=statSplits,statsSingleSeason&group=pitching&season=2024&sportId=1`;
    const response = await fetch(statsUrl);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching pitcher stats:', error);
    return null;
  }
}

// Analyze pitcher vs batter matchups
async function getBatterVsPitcherStats(batterId, pitcherId) {
  try {
    const matchupUrl = `https://statsapi.mlb.com/api/v1/people/${batterId}/stats/vsPlayer?opposingPlayerId=${pitcherId}&season=2024&sportId=1`;
    const response = await fetch(matchupUrl);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching batter vs pitcher stats:', error);
    return null;
  }
}

// Detect hot/cold streaks
function analyzeHotStreak(recentGames, threshold = 5) {
  if (!recentGames || recentGames.length < threshold) return null;

  const stats = {
    batting: {
      hits: 0,
      atBats: 0,
      homeRuns: 0,
      rbi: 0
    },
    pitching: {
      era: 0,
      strikeouts: 0,
      inningsPitched: 0,
      whip: 0
    }
  };

  // Calculate recent performance metrics
  recentGames.slice(-threshold).forEach(game => {
    if (game.stats.batting) {
      stats.batting.hits += game.stats.batting.hits || 0;
      stats.batting.atBats += game.stats.batting.atBats || 0;
      stats.batting.homeRuns += game.stats.batting.homeRuns || 0;
      stats.batting.rbi += game.stats.batting.rbi || 0;
    }
    if (game.stats.pitching) {
      stats.pitching.strikeouts += game.stats.pitching.strikeouts || 0;
      stats.pitching.inningsPitched += game.stats.pitching.inningsPitched || 0;
      // Calculate ERA and WHIP
    }
  });

  // Determine if player is "hot" based on recent performance
  const isHotBatter = (stats.batting.hits / stats.batting.atBats) > 0.350 ||
                     (stats.batting.homeRuns / threshold) > 0.4;
  
  const isHotPitcher = stats.pitching.inningsPitched > 0 &&
                       ((stats.pitching.strikeouts / stats.pitching.inningsPitched) > 1.2);

  return {
    isHot: isHotBatter || isHotPitcher,
    battingStats: {
      recentAvg: stats.batting.hits / stats.batting.atBats,
      recentHR: stats.batting.homeRuns,
      recentRBI: stats.batting.rbi
    },
    pitchingStats: {
      recentK: stats.pitching.strikeouts,
      recentIP: stats.pitching.inningsPitched,
    }
  };
}

// Analyze situational factors
function analyzeSituationalFactors(player, game) {
  const situationalScore = {
    score: 0,
    factors: []
  };

  // Home/Away splits
  if (player.splits?.home?.avg > player.splits?.away?.avg + 0.050) {
    situationalScore.score += 1;
    situationalScore.factors.push('Strong home performance');
  }

  // Left/Right matchup advantage
  if (player.splits?.vsLefty?.avg > 0.300 || player.splits?.vsRighty?.avg > 0.300) {
    situationalScore.score += 1;
    situationalScore.factors.push('Favorable pitcher matchup');
  }

  // Ballpark factors
  // Weather impact
  // Recent rest/workload
  // Historical performance in similar situations

  return situationalScore;
}

export {
  getPitcherStats,
  getBatterVsPitcherStats,
  analyzeHotStreak,
  analyzeSituationalFactors
};
