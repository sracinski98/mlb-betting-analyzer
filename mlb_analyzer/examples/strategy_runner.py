"""
Example runner for the multi-market betting strategy.
"""

import logging
from mlb_analyzer.data.mlb_api import MLBApi
from mlb_analyzer.strategies.multi_market import MultiMarketStrategy
from mlb_analyzer.config import Config

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def main():
    # Initialize configuration
    config = Config()
    
    # Initialize API client
    mlb_api = MLBApi(odds_api_key=config.ODDS_API_KEY)
    
    # Initialize strategy
    strategy = MultiMarketStrategy(
        mlb_api=mlb_api,
        bankroll=10000,  # Starting with $10,000
        kelly_fraction=0.25,  # Conservative Kelly
        min_edge=0.05,  # 5% minimum edge
        confidence_threshold=0.6  # 60% confidence required
    )
    
    # Analyze current opportunities
    opportunities = strategy.analyze_games()
    
    if not opportunities:
        logger.info("No betting opportunities found meeting our criteria.")
        return
    
    # Display recommendations
    logger.info(f"\nFound {len(opportunities)} betting opportunities:")
    
    for opp in opportunities:
        logger.info("\n=== Betting Opportunity ===")
        logger.info(f"Market: {opp['market']}")
        logger.info(f"Bet Type: {opp['bet_type']}")
        logger.info(f"Odds: {opp['odds']:.2f}")
        logger.info(f"Confidence: {opp['confidence']:.2%}")
        logger.info(f"Expected Value: ${opp['expected_value']:.2f}")
        logger.info(f"Recommended Bet: ${opp['recommended_bet']:.2f}")
        
        if 'analysis' in opp:
            logger.info("\nAnalysis:")
            logger.info(f"Home Win Probability: {opp['analysis']['home_prob']:.2%}")
            logger.info(f"Away Win Probability: {opp['analysis']['away_prob']:.2%}")
            logger.info("\nTrends:")
            logger.info(f"Home Team: {opp['analysis']['trends']['home']}")
            logger.info(f"Away Team: {opp['analysis']['trends']['away']}")

if __name__ == "__main__":
    main()
