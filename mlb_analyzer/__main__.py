"""
Main entry point for the MLB Betting Analyzer.
"""

import logging
from datetime import datetime, timedelta
from mlb_analyzer.data.mlb_api import MLBApi
from mlb_analyzer.data.odds_api import OddsAPI
from mlb_analyzer.analysis.analyzer import MLBAnalyzer
from mlb_analyzer.config import Config

def setup_logging():
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )

def main():
    # Setup
    setup_logging()
    logger = logging.getLogger(__name__)
    config = Config.from_env()
    
    # Initialize components
    mlb_api = MLBApi()
    odds_api = OddsAPI(config.ODDS_API_KEY)
    analyzer = MLBAnalyzer()
    
    # Get today's date
    today = datetime.now().strftime("%Y-%m-%d")
    
    try:
        # Fetch today's games
        logger.info(f"Fetching games for {today}")
        games = mlb_api.get_games_by_date(today)
        
        # Fetch odds
        odds = odds_api.get_mlb_odds(today)
        
        # Analyze each game
        for game in games:
            home_team_id = game["teams"]["home"]["team"]["id"]
            away_team_id = game["teams"]["away"]["team"]["id"]
            
            # Get team stats
            home_stats = mlb_api.get_team_stats(home_team_id)
            away_stats = mlb_api.get_team_stats(away_team_id)
            
            # Analyze matchup
            analysis = analyzer.analyze_matchup(home_stats, away_stats)
            
            # Find value bets
            value_bets = analyzer.calculate_value_bets(analysis, odds)
            
            # Log findings
            logger.info(f"Analysis for {game['teams']['away']['team']['name']} @ {game['teams']['home']['team']['name']}")
            logger.info(f"Value bets found: {value_bets}")
            
    except Exception as e:
        logger.error(f"Error in analysis: {str(e)}")

if __name__ == "__main__":
    main()
