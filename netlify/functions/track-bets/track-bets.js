const faunadb = require('faunadb');
const q = faunadb.query;

const client = new faunadb.Client({
  secret: process.env.FAUNA_SECRET_KEY
});

exports.handler = async function(event, context) {
  try {
    if (event.httpMethod !== 'POST' && event.httpMethod !== 'GET') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }

    if (event.httpMethod === 'POST') {
      const { bets, userId } = JSON.parse(event.body);
      
      // Store the bets in FaunaDB
      const result = await client.query(
        q.Create(
          q.Collection('bets'),
          {
            data: {
              bets,
              userId,
              placedAt: new Date().toISOString(),
              status: 'pending' // Will be updated once game completes
            }
          }
        )
      );

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: 'Bets tracked successfully',
          betId: result.ref.id
        })
      };
    }

    if (event.httpMethod === 'GET') {
      const { userId, status } = event.queryStringParameters || {};
      
      let query = q.Match(q.Index('bets_by_user'), userId);
      if (status) {
        query = q.Filter(
          query,
          q.Lambda(
            'bet',
            q.Equals(q.Select(['data', 'status'], q.Get(q.Var('bet'))), status)
          )
        );
      }

      const result = await client.query(
        q.Map(
          q.Paginate(query),
          q.Lambda('ref', q.Get(q.Var('ref')))
        )
      );

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bets: result.data.map(doc => ({
            id: doc.ref.id,
            ...doc.data
          }))
        })
      };
    }
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to process request' })
    };
  }
};
