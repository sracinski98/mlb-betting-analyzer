"""Test MLB API with today's games"""
import sys
import pandas as pd
from mlb_analyzer.data.mlb_api import MLBApi  # Use the main API file
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def main():
    # Initialize API
    mlb = MLBApi()
    
    # Get today's games
    logger.info("Fetching today's games...")
    games_df = mlb.get_live_games()
    logger.info(f"Found {len(games_df)} games")
    print("\nGames:")
    print(games_df)
    
    # Get current odds
    logger.info("\nFetching odds...")
    odds_df = mlb.get_live_odds()
    logger.info(f"Found odds for {len(odds_df)} games")
    print("\nOdds:")
    print(odds_df)
    
    # Merge games with odds
    if not games_df.empty and not odds_df.empty:
        merged = pd.merge(
            games_df,
            odds_df,
            on=['home_team', 'away_team'],
            how='left'
        )
        print("\nMerged Data:")
        print(merged)

if __name__ == "__main__":
    main()
