// Helper functions for player data management

async function getPlayerId(playerName) {
  try {
    const searchUrl = `https://statsapi.mlb.com/api/v1/people/search?q=${encodeURIComponent(playerName)}`;
    const response = await fetch(searchUrl);
    const data = await response.json();
    
    if (data.people && data.people.length > 0) {
      // Return the first matching player's ID
      return data.people[0].id;
    }
    return null;
  } catch (error) {
    console.error('Error searching for player:', error);
    return null;
  }
}

function getStartingPitcherId(game, batterName) {
  // Make sure we get the opposing team's pitcher
  const homeTeam = game.teams.home;
  const awayTeam = game.teams.away;
  
  // Determine if batter is on home or away team
  const isHomeTeamBatter = homeTeam.players.some(p => p.person.fullName === batterName);
  
  // Get the opposing team's probable pitcher
  const opposingTeam = isHomeTeamBatter ? awayTeam : homeTeam;
  return opposingTeam.probablePitcher?.id || null;
}

function calculatePitchingRecommendation(betScore, hotStreakAnalysis, situationalFactors) {
  let finalScore = betScore;
  
  // Adjust for hot streak
  if (hotStreakAnalysis?.isHot) {
    finalScore += 1;
  }
  
  // Adjust for situational factors
  finalScore += Math.min(situationalFactors.score, 2);
  
  return {
    recommendation: finalScore >= 8 ? 'Strong Bet' : finalScore >= 6.5 ? 'Consider' : 'Monitor',
    score: finalScore,
    factors: [
      ...(hotStreakAnalysis?.isHot ? ['Hot Streak'] : []),
      ...situationalFactors.factors
    ]
  };
}

function calculateBatterRecommendation(betScore, hotStreakAnalysis, batterVsPitcher, situationalFactors) {
  let finalScore = betScore;
  
  // Adjust for hot streak
  if (hotStreakAnalysis?.isHot) {
    finalScore += 1;
  }
  
  // Adjust for batter vs pitcher history
  if (batterVsPitcher?.avg > 0.300 && batterVsPitcher?.atBats >= 10) {
    finalScore += 1;
  }
  
  // Adjust for situational factors
  finalScore += Math.min(situationalFactors.score, 2);
  
  return {
    recommendation: finalScore >= 8 ? 'Strong Bet' : finalScore >= 6.5 ? 'Consider' : 'Monitor',
    score: finalScore,
    factors: [
      ...(hotStreakAnalysis?.isHot ? ['Hot Streak'] : []),
      ...(batterVsPitcher?.avg > 0.300 ? ['Strong Matchup History'] : []),
      ...situationalFactors.factors
    ]
  };
}

export {
  getPlayerId,
  getStartingPitcherId,
  calculatePitchingRecommendation,
  calculateBatterRecommendation
};
