def handler(event, context):
    try:
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Methods": "GET"
            },
            "body": """{"team_bets": [{"matchup": "Test A vs Test B", "team": "Test A", "bet_type": "Moneyline", "odds": 150, "implied_prob": 40.0}], "parlays": [{"leg": "Test Parlay", "team": "Test A + Test C", "odds": 250, "implied_prob": 28.5}]}"""
        }
    except Exception as e:
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Methods": "GET"
            },
            "body": f'{{"error": "{str(e)}"}}'
        }

def analyze_games(mlb_api):
    try:
        # Get today's games
        games = mlb_api.get_todays_games()
        odds = mlb_api.get_todays_odds()
        
        # Your analysis logic here
        # For now, returning sample data
        return {
            "team_bets": [
                {
                    "matchup": "Team A vs Team B",
                    "team": "Team A",
                    "bet_type": "Moneyline",
                    "odds": 150,
                    "implied_prob": 40.0
                }
            ],
            "parlays": [
                {
                    "leg": "Parlay 1",
                    "team": "Team A + Team C",
                    "odds": 250,
                    "implied_prob": 28.5
                }
            ]
        }
    except Exception as e:
        logger.error(f"Error in analyze_games: {str(e)}")
        logger.error(traceback.format_exc())
        raise

def handler(event, context):
    try:
        logger.info("Received request")
        
        # Log environment variables (excluding sensitive data)
        env_vars = {k: v for k, v in os.environ.items() if 'KEY' not in k.upper()}
        logger.info(f"Environment variables: {env_vars}")
        
        # Get today's games and analysis
        logger.info("Starting game analysis")
        recommendations = analyze_games(mlb_api)
        logger.info(f"Analysis complete. Found {len(recommendations.get('team_bets', []))} team bets and {len(recommendations.get('parlays', []))} parlays")
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'GET'
            },
            'body': json.dumps(recommendations)
        }
        
    except Exception as e:
        error_msg = str(e)
        tb = traceback.format_exc()
        error_details = {
            "error": f"Analysis failed: {error_msg}",
            "traceback": tb
        }
        logger.error("Error in handler: %s", error_msg)
        logger.error("Traceback: %s", tb)
        
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'GET'
            },
            'body': json.dumps(error_details)
        }