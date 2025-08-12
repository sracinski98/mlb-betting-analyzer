"""
Test the Odds API integration with our configuration.
"""

import logging
import sys
from mlb_analyzer.config import Config
from mlb_analyzer.data.mlb_api import MLBApi

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_odds_api():
    # Get configuration
    config = Config()
    logger.info(f"Using Odds API key: {config.ODDS_API_KEY[:8]}...")
    
    # Initialize API with our configured key
    mlb_api = MLBApi(odds_api_key=config.ODDS_API_KEY)
    
    # Try to fetch live odds
    odds_data = mlb_api.get_live_odds()
    
    if odds_data.empty:
        logger.error("Failed to fetch odds data")
        return False
    
    logger.info(f"Successfully fetched odds data for {len(odds_data)} entries")
    logger.info("\nSample of odds data:")
    logger.info(odds_data.head())
    return True

if __name__ == "__main__":
    success = test_odds_api()
    sys.exit(0 if success else 1)
