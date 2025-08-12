const { MongoClient } = require('mongodb');

exports.handler = async function(event, context) {
    context.callbackWaitsForEmptyEventLoop = false;

    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    try {
        const client = await MongoClient.connect(process.env.MONGODB_URI);
        const db = client.db('mlb-betting');
        
        // Create a test document
        const result = await db.collection('test').insertOne({
            test: true,
            timestamp: new Date(),
            message: 'Database connection successful'
        });

        await client.close();

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                message: 'Database connection and test write successful',
                documentId: result.insertedId
            })
        };
    } catch (error) {
        console.error('Database connection error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Database connection failed',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            })
        };
    }
}
