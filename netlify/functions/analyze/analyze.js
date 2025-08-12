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
  const oddsUrl = `https://api.the-odds-api.com/v4/sports/baseball_mlb/odds/?apiKey=${apiKey}&regions=us&markets=h2h&oddsFormat=american`;
  
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

function findValueBets(games, odds) {
  const valueBets = [];
  const parlayOpportunities = [];

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
      const bookmaker = matchingOdds.bookmakers[0];
      if (bookmaker) {
        const market = bookmaker.markets.find(m => m.key === 'h2h');
        if (market) {
          market.outcomes.forEach(outcome => {
            const impliedProb = calculateImpliedProbability(outcome.price);
            valueBets.push({
              matchup,
              team: outcome.name,
              bet_type: 'Moneyline',
              odds: outcome.price,
              implied_prob: impliedProb
            });

            // Simple parlay logic - if odds are favorable
            if (outcome.price > 150) {
              parlayOpportunities.push({
                leg: matchup,
                team: outcome.name,
                odds: outcome.price,
                implied_prob: impliedProb
              });
            }
          });
        }
      }
    }
  });

  return {
    team_bets: valueBets,
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

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET'
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
        'Access-Control-Allow-Methods': 'GET'
      },
      body: JSON.stringify({ error: error.message })
    };
  }
};
