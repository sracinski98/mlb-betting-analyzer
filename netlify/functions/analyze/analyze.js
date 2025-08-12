import fetch from 'node-fetch';
import {
  getPlayerId,
  getStartingPitcherId,
  calculatePitchingRecommendation,
  calculateBatterRecommendation
} from './playerUtils.js';

async function getTodaysGames() {
  const date = new Date().toISOString().split('T')[0];
  const mlbApiUrl = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${date}`;
  
  const response = await fetch(mlbApiUrl);
  const data = await response.json();
  return data.dates[0]?.games || [];
}

async function getOdds() {
  try {
    const apiKey = process.env.ODDS_API_KEY || 'fe3e1db58259d6d7d3599e2ae3d22ecc';
    const oddsUrl = `https://api.the-odds-api.com/v4/sports/baseball_mlb/odds/?apiKey=${apiKey}&regions=us&markets=h2h,spreads,totals,player_props&oddsFormat=american`;
    
    const response = await fetch(oddsUrl);
    if (!response.ok) {
      throw new Error(`Odds API returned ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    
    // Ensure we got an array back
    if (!Array.isArray(data)) {
      console.error('Unexpected odds data format:', data);
      return [];
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching odds:', error);
    return [];
  }
}

function calculateImpliedProbability(odds) {
  if (odds > 0) {
    return (100 / (odds + 100)) * 100;
  } else {
    return (Math.abs(odds) / (Math.abs(odds) + 100)) * 100;
  }
}

function calculateBetScore(impliedProb, odds, historicalData = null) {
  // Base score starts at 5
  let score = 5;
  
  // Favorable odds boost (up to +2 points)
  if (odds > 0) {
    score += Math.min((odds / 200), 2);
  } else {
    score += Math.min((Math.abs(odds) / 400), 1);
  }
  
  // Value based on implied probability (up to +2 points)
  if (impliedProb > 60) {
    score += Math.min(((impliedProb - 60) / 20), 2);
  }
  
  // If we have historical data, adjust score (up to +1 point)
  if (historicalData) {
    const { winRate, totalBets } = historicalData;
    if (totalBets > 10 && winRate > 0.55) {
      score += Math.min(((winRate - 0.55) * 10), 1);
    }
  }
  
  // Round to nearest 0.5
  return Math.round(score * 2) / 2;
}

import {
  getPitcherStats,
  getBatterVsPitcherStats,
  analyzeHotStreak,
  analyzeSituationalFactors
} from './statsAnalyzer.js';

async function getPlayerStats(playerId, isPitcher = false) {
  try {
    // Get basic stats
    const statsUrl = `https://statsapi.mlb.com/api/v1/people/${playerId}/stats/game/mlb?season=2024`;
    const response = await fetch(statsUrl);
    const data = await response.json();

    // Get additional stats based on player type
    if (isPitcher) {
      const pitcherStats = await getPitcherStats(playerId);
      return { ...data, pitching: pitcherStats };
    }

    return data;
  } catch (error) {
    console.error('Error fetching player stats:', error);
    return null;
  }
}

async function findValueBets(games, oddsData) {
  const valueBets = [];
  const parlayOpportunities = [];
  const playerProps = [];
  const pitchingProps = [];
  const situationalBets = [];
  const hotStreakBets = [];

  // Map MLB API team names to betting site team names
  const teamNameMap = {
    'New York Yankees': 'NY Yankees',
    'Boston Red Sox': 'Boston',
    'Los Angeles Angels': 'LA Angels',
    'Chicago White Sox': 'Chi White Sox',
    'St. Louis Cardinals': 'St. Louis',
    'Los Angeles Dodgers': 'LA Dodgers',
    // Add more mappings as needed
  };

  // Ensure oddsData is an array
  const odds = Array.isArray(oddsData) ? oddsData : [oddsData];

  games.forEach(game => {
    const homeTeam = game.teams.home.team.name;
    const awayTeam = game.teams.away.team.name;
    const matchup = `${awayTeam} vs ${homeTeam}`;

    const matchingOdds = odds.find(odd => {
      const homeTeamMatch = odd.home_team === homeTeam || 
                          odd.home_team === teamNameMap[homeTeam] || 
                          homeTeam.includes(odd.home_team) ||
                          (teamNameMap[homeTeam] && teamNameMap[homeTeam].includes(odd.home_team));
      const awayTeamMatch = odd.away_team === awayTeam || 
                          odd.away_team === teamNameMap[awayTeam] ||
                          awayTeam.includes(odd.away_team) ||
                          (teamNameMap[awayTeam] && teamNameMap[awayTeam].includes(odd.away_team));
      return homeTeamMatch && awayTeamMatch;
    });

    if (matchingOdds) {
      // Process moneyline bets
      const bookmaker = matchingOdds.bookmakers[0];
      if (bookmaker) {
        // Handle moneyline bets
        const moneylineMarket = bookmaker.markets.find(m => m.key === 'h2h');
        if (moneylineMarket) {
          moneylineMarket.outcomes.forEach(outcome => {
            const impliedProb = calculateImpliedProbability(outcome.price);
            const betScore = calculateBetScore(impliedProb, outcome.price);
            
            valueBets.push({
              matchup,
              team: outcome.name,
              bet_type: 'Moneyline',
              odds: outcome.price,
              implied_prob: impliedProb,
              score: betScore,
              recommendation: betScore >= 8 ? 'Strong Bet' : betScore >= 6 ? 'Consider' : 'Monitor'
            });
          });
        }

        // Handle player props
        const propMarkets = bookmaker.markets.filter(m => m.key.includes('player'));
        for (const market of propMarkets) {
          for (const outcome of market.outcomes) {
            const impliedProb = calculateImpliedProbability(outcome.price);
            const betScore = calculateBetScore(impliedProb, outcome.price);
            
            // Get player details from MLB API
            const playerNameParts = outcome.name.split(' ');
            // You'll need to implement a function to get player ID from name
            const playerId = await getPlayerId(playerNameParts.join(' '));
            
            if (playerId) {
              // Get player stats and analyze hot streaks
              const playerStats = await getPlayerStats(playerId);
              const hotStreakAnalysis = analyzeHotStreak(playerStats?.recentGames || []);
              
              // For pitcher props
              if (market.key.includes('strikeouts') || market.key.includes('earned_runs')) {
                const pitcherStats = await getPitcherStats(playerId);
                const situationalFactors = analyzeSituationalFactors(pitcherStats, game);
                
                pitchingProps.push({
                  matchup,
                  pitcher: outcome.name,
                  prop_type: market.key,
                  line: outcome.point || 'N/A',
                  odds: outcome.price,
                  implied_prob: impliedProb,
                  score: betScore,
                  hot_streak: hotStreakAnalysis,
                  situational_factors: situationalFactors,
                  recommendation: calculatePitchingRecommendation(betScore, hotStreakAnalysis, situationalFactors)
                });
              } 
              // For batter props
              else {
                // Get pitcher ID for the opposing team
                const opposingPitcherId = getStartingPitcherId(game, outcome.name);
                let batterVsPitcher = null;
                if (opposingPitcherId) {
                  batterVsPitcher = await getBatterVsPitcherStats(playerId, opposingPitcherId);
                }
                
                const situationalFactors = analyzeSituationalFactors(playerStats, game);
                
                playerProps.push({
                  matchup,
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
                });
              }
              
              // Add to hot streak bets if applicable
              if (hotStreakAnalysis?.isHot) {
                hotStreakBets.push({
                  player: outcome.name,
                  prop_type: market.key,
                  hot_streak_details: hotStreakAnalysis,
                  odds: outcome.price,
                  recommendation: 'Hot Streak Play'
                });
              }
            }
          }
        });

        // Simple parlay logic - if odds are favorable
        const highValueBets = valueBets.filter(bet => bet.score >= 7);
        if (highValueBets.length >= 2) {
          parlayOpportunities.push({
            legs: highValueBets.slice(0, 2),
            combined_score: (highValueBets[0].score + highValueBets[1].score) / 2
          });
        }
      }
    }
  });

  // Sort hot streak bets by confidence
  const sortedHotStreakBets = hotStreakBets.sort((a, b) => 
    (b.hot_streak_details.battingStats.recentAvg || 0) - 
    (a.hot_streak_details.battingStats.recentAvg || 0)
  );

  return {
    team_bets: valueBets,
    player_props: playerProps,
    pitching_props: pitchingProps,
    hot_streak_bets: sortedHotStreakBets.slice(0, 5), // Top 5 hot streak bets
    situational_bets: situationalBets,
    parlays: parlayOpportunities.slice(0, 3) // Top 3 parlay opportunities
  };
}

exports.handler = async function (event, context) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST'
  };

  try {
    // Handle preflight requests
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 204,
        headers
      };
    }

    console.log('Fetching games and odds...');
    const [games, odds] = await Promise.all([
      getTodaysGames(),
      getOdds()
    ]);

    console.log('Games fetched:', games.length);
    console.log('Odds fetched:', Array.isArray(odds) ? odds.length : 'not an array');

    if (!Array.isArray(games) || games.length === 0) {
      console.log('No games found for today');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          team_bets: [],
          player_props: [],
          pitching_props: [],
          hot_streak_bets: [],
          situational_bets: [],
          parlays: [],
          message: 'No games found for today'
        })
      };
    }

    if (!Array.isArray(odds) || odds.length === 0) {
      console.log('No odds data available');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          team_bets: [],
          player_props: [],
          pitching_props: [],
          hot_streak_bets: [],
          situational_bets: [],
          parlays: [],
          message: 'No odds data available'
        })
      };
    }

    console.log('Processing bets...');
    const response = findValueBets(games, odds);

    // Store results in our tracking system
    if (event.httpMethod === 'POST' && event.body) {
      const betSelections = JSON.parse(event.body);
      // Here you would implement the storage of selected bets
      // This could be in a database or other persistent storage
      console.log('Tracking bets:', betSelections);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    };
  } catch (error) {
    console.error('Error in analyze function:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
};
