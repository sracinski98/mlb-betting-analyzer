const { MongoClient } = require('mongodb');

// MongoDB connection
let cachedDb = null;

async function connectToDatabase() {
    if (cachedDb) {
        return cachedDb;
    }

    const client = await MongoClient.connect(process.env.MONGODB_URI);
    const db = client.db('mlb-betting');
    
    // Create indexes if they don't exist
    await db.collection('bets').createIndex({ userId: 1 });
    await db.collection('bets').createIndex({ status: 1 });
    await db.collection('bets').createIndex({ createdAt: 1 });
    
    cachedDb = db;
    return db;
}

exports.handler = async function(event, context) {
    context.callbackWaitsForEmptyEventLoop = false;

    try {
        const db = await connectToDatabase();
        const collection = db.collection('bets');

        // Set CORS headers
        const headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Content-Type': 'application/json'
        };

        // Handle OPTIONS request
        if (event.httpMethod === 'OPTIONS') {
            return {
                statusCode: 204,
                headers
            };
        }

        if (event.httpMethod === 'POST') {
            const { bets, userId } = JSON.parse(event.body);
            
            const doc = {
                bets,
                userId,
                createdAt: new Date(),
                status: 'pending',
                lastUpdated: new Date()
            };

            const result = await collection.insertOne(doc);

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    message: 'Bets tracked successfully',
                    betId: result.insertedId
                })
            };
        }

        if (event.httpMethod === 'GET') {
            const { userId, status, limit = 20, skip = 0 } = event.queryStringParameters || {};
            
            const query = {};
            if (userId) query.userId = userId;
            if (status) query.status = status;

            const bets = await collection
                .find(query)
                .sort({ createdAt: -1 })
                .skip(Number(skip))
                .limit(Number(limit))
                .toArray();

            const total = await collection.countDocuments(query);

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    bets,
                    pagination: {
                        total,
                        limit: Number(limit),
                        skip: Number(skip),
                        hasMore: total > (Number(skip) + Number(limit))
                    }
                })
            };
        }

        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };

    } catch (error) {
        console.error('Database error:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                error: 'Database operation failed',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            })
        };
    }
};
