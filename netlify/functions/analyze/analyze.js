import fetch from 'node-fetch';

async function getTodaysGames() {
  const date = new Date().toISOString().split('T')[0];
  const mlbApiUrl = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${date}`;
  
  const response = await fetch(mlbApiUrl);
  const data = await response.json();
  return data.dates[0]?.games || [];
}

async function getOdds() {
  const apiKey = process.env.ODDS_API_KEY || 'fe3e1db58259d6d7d3599e2ae3d22ecc';
  const oddsUrl = `https://api.the-odds-api.com/v4/sports/baseball_mlb/odds/?apiKey=${apiKey}&regions=us&markets=h2h,spreads,totals,player_props&oddsFormat=american`;
  
  const response = await fetch(oddsUrl);
  const data = await response.json();
  return data;
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

async function getPlayerStats(playerId) {
  try {
    const statsUrl = `https://statsapi.mlb.com/api/v1/people/${playerId}/stats/game/mlb?season=2024`;
    const response = await fetch(statsUrl);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching player stats:', error);
    return null;
  }
}

function findValueBets(games, odds) {
  const valueBets = [];
  const parlayOpportunities = [];
  const playerProps = [];

  // Map MLB API team names to betting site team names
  const teamNameMap = {
    'New York Yankees': 'NY Yankees',
    'Boston Red Sox': 'Boston',
    // Add more mappings as needed
  };

  games.forEach(game => {
    const homeTeam = game.teams.home.team.name;
    const awayTeam = game.teams.away.team.name;
    const matchup = `${awayTeam} vs ${homeTeam}`;

    const matchingOdds = odds.find(odd => {
      const homeTeamMatch = odd.home_team === homeTeam || odd.home_team === teamNameMap[homeTeam];
      const awayTeamMatch = odd.away_team === awayTeam || odd.away_team === teamNameMap[awayTeam];
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
        propMarkets.forEach(market => {
          market.outcomes.forEach(outcome => {
            const impliedProb = calculateImpliedProbability(outcome.price);
            const betScore = calculateBetScore(impliedProb, outcome.price);
            
            playerProps.push({
              matchup,
              player: outcome.name,
              prop_type: market.key,
              line: outcome.point || 'N/A',
              odds: outcome.price,
              implied_prob: impliedProb,
              score: betScore,
              recommendation: betScore >= 8 ? 'Strong Bet' : betScore >= 6 ? 'Consider' : 'Monitor'
            });
          });
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

  return {
    team_bets: valueBets,
    player_props: playerProps,
    parlays: parlayOpportunities.slice(0, 3) // Return top 3 parlay opportunities
  };
}

exports.handler = async function (event, context) {
  try {
    const [games, odds] = await Promise.all([
      getTodaysGames(),
      getOdds()
    ]);

    const response = findValueBets(games, odds);

    // Store results in our tracking system
    if (event.httpMethod === 'POST' && event.body) {
      const betSelections = JSON.parse(event.body);
      // Here you would implement the storage of selected bets
      // This could be in a database or other persistent storage
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST'
      },
      body: JSON.stringify(response)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST'
      },
      body: JSON.stringify({ error: error.message })
    };
  }
};
