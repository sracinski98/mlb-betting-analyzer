exports.handler = async function (event, context) {
  try {
    // For now, return test data
    const response = {
      team_bets: [
        {
          matchup: "Test A vs Test B",
          team: "Test A",
          bet_type: "Moneyline",
          odds: 150,
          implied_prob: 40.0
        }
      ],
      parlays: [
        {
          leg: "Test Parlay",
          team: "Test A + Test C",
          odds: 250,
          implied_prob: 28.5
        }
      ]
    };

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
