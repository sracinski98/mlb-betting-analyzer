import {
  getPitcherStats,
  getBatterVsPitcherStats,
  analyzeHotStreak,
  analyzeSituationalFactors
} from './statsAnalyzer.js';

import {
  getPlayerId,
  getStartingPitcherId,
  calculatePitchingRecommendation,
  calculateBatterRecommendation
} from './playerUtils.js';

export async function analyzeGame(game, bookmaker) {
  const results = {
    valueBets: [],
    playerProps: [],
    pitchingProps: [],
    situationalBets: [],
    hotStreakBets: []
  };

  if (!bookmaker) {
    console.log('No bookmaker data available for game');
    return results;
  }

  // Handle moneyline bets
  const moneylineMarket = bookmaker.markets.find(m => m.key === 'h2h');
  if (moneylineMarket) {
    for (const outcome of moneylineMarket.outcomes) {
      const impliedProb = calculateImpliedProbability(outcome.price);
      const betScore = calculateBetScore(impliedProb, outcome.price);
      
      results.valueBets.push({
        matchup: `${game.teams.away.team.name} vs ${game.teams.home.team.name}`,
        team: outcome.name,
        bet_type: 'Moneyline',
        odds: outcome.price,
        implied_prob: impliedProb,
        score: betScore,
        recommendation: betScore >= 8 ? 'Strong Bet' : betScore >= 6 ? 'Consider' : 'Monitor'
      });
    }
  }

  // Handle player props
  const propMarkets = bookmaker.markets.filter(m => m.key.includes('player') || 
                                                   m.key.includes('pitcher') || 
                                                   m.key.includes('batter'));
  
  console.log(`Found ${propMarkets.length} prop markets`);
  
  for (const market of propMarkets) {
    console.log(`Processing market: ${market.key}`);
    
    for (const outcome of market.outcomes) {
      try {
        const playerId = await getPlayerId(outcome.name);
        if (!playerId) {
          console.log(`Could not find player ID for ${outcome.name}`);
          continue;
        }

        const isPitcher = market.key.includes('pitcher');
        const playerStats = await getPlayerStats(playerId, isPitcher);
        const hotStreakAnalysis = analyzeHotStreak(playerStats?.recentGames || []);
        const impliedProb = calculateImpliedProbability(outcome.price);
        const betScore = calculateBetScore(impliedProb, outcome.price);

        // Process pitcher props
        if (isPitcher) {
          const pitcherStats = await getPitcherStats(playerId);
          const situationalFactors = analyzeSituationalFactors(pitcherStats, game);
          
          const pitchingProp = {
            matchup: `${game.teams.away.team.name} vs ${game.teams.home.team.name}`,
            pitcher: outcome.name,
            prop_type: market.key,
            line: outcome.point || 'N/A',
            odds: outcome.price,
            implied_prob: impliedProb,
            score: betScore,
            hot_streak: hotStreakAnalysis,
            situational_factors: situationalFactors,
            recommendation: calculatePitchingRecommendation(betScore, hotStreakAnalysis, situationalFactors)
          };

          results.pitchingProps.push(pitchingProp);
          
          if (situationalFactors.score >= 2) {
            results.situationalBets.push({
              ...pitchingProp,
              factors: situationalFactors.factors
            });
          }
        } 
        // Process batter props
        else {
          const opposingPitcherId = getStartingPitcherId(game, outcome.name);
          const batterVsPitcher = opposingPitcherId ? 
            await getBatterVsPitcherStats(playerId, opposingPitcherId) : null;
          
          const situationalFactors = analyzeSituationalFactors(playerStats, game);
          
          const batterProp = {
            matchup: `${game.teams.away.team.name} vs ${game.teams.home.team.name}`,
            player: outcome.name,
            prop_type: market.key,
            line: outcome.point || 'N/A',
            odds: outcome.price,
            implied_prob: impliedProb,
            score: betScore,
            hot_streak: hotStreakAnalysis,
            batter_vs_pitcher: batterVsPitcher,
            situational_factors: situationalFactors,
            recommendation: calculateBatterRecommendation(betScore, hotStreakAnalysis, batterVsPitcher, situationalFactors)
          };

          results.playerProps.push(batterProp);
          
          if (situationalFactors.score >= 2) {
            results.situationalBets.push({
              ...batterProp,
              factors: situationalFactors.factors
            });
          }
        }

        // Add hot streak bets
        if (hotStreakAnalysis?.isHot) {
          results.hotStreakBets.push({
            player: outcome.name,
            prop_type: market.key,
            hot_streak_details: hotStreakAnalysis,
            odds: outcome.price,
            recommendation: 'Hot Streak Play'
          });
        }
      } catch (error) {
        console.error(`Error processing prop for ${outcome.name}:`, error);
      }
    }
  }

  return results;
}

function calculateImpliedProbability(odds) {
  if (odds > 0) {
    return (100 / (odds + 100)) * 100;
  } else {
    return (Math.abs(odds) / (Math.abs(odds) + 100)) * 100;
  }
}

function calculateBetScore(impliedProb, odds, historicalData = null) {
  let score = 5;
  
  if (odds > 0) {
    score += Math.min((odds / 200), 2);
  } else {
    score += Math.min((Math.abs(odds) / 400), 1);
  }
  
  if (impliedProb > 60) {
    score += Math.min(((impliedProb - 60) / 20), 2);
  }
  
  if (historicalData?.winRate > 0.55 && historicalData?.totalBets > 10) {
    score += Math.min(((historicalData.winRate - 0.55) * 10), 1);
  }
  
  return Math.round(score * 2) / 2;
}
