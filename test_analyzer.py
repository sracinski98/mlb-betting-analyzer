"""
Test script for the MLB betting analyzer
"""

import logging
from mlb_analyzer.data.mlb_api import MLBApi
from mlb_analyzer.strategies.multi_market import MultiMarketStrategy

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def main():
    # Initialize API with your Odds API key
    mlb_api = MLBApi(odds_api_key="fe3e1db58259d6d7d3599e2ae3d22ecc")
    
    # Initialize strategy
    strategy = MultiMarketStrategy(
        mlb_api=mlb_api,
        bankroll=10000,
        kelly_fraction=0.25,
        min_edge=0.05,
        confidence_threshold=0.6
    )
    
    # Get betting opportunities
    opportunities = strategy.analyze_games()
    
    if not opportunities:
        logger.info("No betting opportunities found meeting our criteria.")
        return
    
    # Display betting recommendations
    logger.info(f"\nFound {len(opportunities)} betting opportunities:")
    
    for opp in opportunities:
        logger.info("\n=== Betting Opportunity ===")
        logger.info(f"Game: {opp['analysis']['away_team']} @ {opp['analysis']['home_team']}")
        logger.info(f"Bet: {opp['bet_type'].upper()} on {opp['team']}")
        logger.info(f"Market: {opp['market']}")
        logger.info(f"Odds: {opp['odds']:.2f}")
        logger.info(f"Confidence: {opp['confidence']:.2%}")
        logger.info(f"Expected Value: ${opp['expected_value']:.2f}")
        logger.info(f"Recommended Bet: ${opp['recommended_bet']:.2f}")
        
        logger.info("\nTeam Analysis:")
        logger.info(f"Home Team ({opp['analysis']['home_team']}):")
        logger.info(f"  Recent Win%: {opp['analysis']['home_stats']['recent_form']:.3f}")
        logger.info(f"  Runs/Game: {opp['analysis']['home_stats']['runs_per_game']:.2f}")
        logger.info(f"  Runs Allowed/Game: {opp['analysis']['home_stats']['runs_allowed']:.2f}")
        
        logger.info(f"\nAway Team ({opp['analysis']['away_team']}):")
        logger.info(f"  Recent Win%: {opp['analysis']['away_stats']['recent_form']:.3f}")
        logger.info(f"  Runs/Game: {opp['analysis']['away_stats']['runs_per_game']:.2f}")
        logger.info(f"  Runs Allowed/Game: {opp['analysis']['away_stats']['runs_allowed']:.2f}")

if __name__ == "__main__":
    main()
