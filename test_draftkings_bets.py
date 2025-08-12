from mlb_analyzer.data.providers.draftkings import DraftKingsProvider
import pandas as pd
from datetime import datetime

def test_draftkings_bets():
    """Test DraftKings betting functionality with team bets, player props, and parlays."""
    
    # Set up logging
    import logging
    logging.basicConfig(level=logging.INFO)
    
    # Initialize DraftKings provider
    dk = DraftKingsProvider()
    
    # Get all available MLB games and odds
    print("\n=== Available MLB Games ===")
    print("Fetching events from DraftKings...")
    events_data = dk._get_events()
    if events_data:
        print(f"Events data received with keys: {list(events_data.keys())}")
        if 'eventGroup' in events_data:
            event_group = events_data['eventGroup']
            print(f"\nEvent Group data:")
            print(f"- Group ID: {event_group.get('groupId')}")
            print(f"- Events count: {len(event_group.get('events', []))}")
            for event in event_group.get('events', []):
                print(f"\nEvent: {event.get('name')}")
                print(f"- Event ID: {event.get('eventId')}")
                print(f"- Start Date: {event.get('startDate')}")
    else:
        print("No events data received from DraftKings")
        return
    
    print("\nFetching odds for all games...")
    all_odds = dk.get_all_odds()
    print(f"Odds DataFrame empty: {all_odds.empty}")
    if not all_odds.empty:
        print(all_odds[['game_id', 'home_team', 'away_team', 'home_moneyline', 'away_moneyline']].to_string())
        
        # Pick the first game for detailed odds
        test_game_id = all_odds.iloc[0]['game_id']
        
        # 1. Team Bet Example
        print("\n=== Team Bet Example ===")
        game_odds = dk.get_game_odds(test_game_id)
        if game_odds:
            for book in game_odds['bookmakers']:
                if book['name'] == 'DraftKings':
                    print(f"Game ID: {test_game_id}")
                    print("Moneyline:")
                    print(f"  Home Team: {book['home_ml']}")
                    print(f"  Away Team: {book['away_ml']}")
                    print("\nSpread:")
                    print(f"  Line: {book['spread']}")
                    print(f"  Home Odds: {book['home_spread_odds']}")
                    print(f"  Away Odds: {book['away_spread_odds']}")
                    print("\nTotal:")
                    print(f"  Line: {book['total']}")
                    print(f"  Over Odds: {book['over_odds']}")
                    print(f"  Under Odds: {book['under_odds']}")
        
        # 2. Player Props Example
        print("\n=== Player Props Example ===")
        # Note: In practice, you'd want to get the player_id from your game data
        # Here we're just demonstrating the format
        player_props = dk.get_player_props(player_id="example_player", game_id=test_game_id)
        if player_props:
            print(f"Player: {player_props['player_name']}")
            for prop in player_props['props']:
                print(f"\n{prop['type']}:")
                print(f"  Line: {prop['line']}")
                print(f"  Over Odds: {prop['over_odds']}")
                print(f"  Under Odds: {prop['under_odds']}")
        
        # 3. Parlay Example
        print("\n=== Parlay Example ===")
        print("Creating a sample parlay with:")
        
        # For demonstration, let's combine a moneyline bet and an over/under
        game_odds = dk.get_game_odds(test_game_id)
        if game_odds and game_odds['bookmakers']:
            book = game_odds['bookmakers'][0]
            
            # Calculate parlay odds (simple multiplication for American odds)
            def american_to_decimal(odds):
                if odds > 0:
                    return (odds / 100) + 1
                return (100 / abs(odds)) + 1
            
            def decimal_to_american(odds):
                if odds >= 2:
                    return int((odds - 1) * 100)
                return int(-100 / (odds - 1))
            
            # Example parlay: Home team ML + Over
            home_ml_decimal = american_to_decimal(int(book['home_ml']))
            over_decimal = american_to_decimal(int(book['over_odds']))
            parlay_decimal = home_ml_decimal * over_decimal
            parlay_american = decimal_to_american(parlay_decimal)
            
            print(f"1. Home Team Moneyline ({book['home_ml']})")
            print(f"2. Over {book['total']} ({book['over_odds']})")
            print(f"\nParlay Odds: {parlay_american:+d}")
            print(f"$100 bet would win: ${(parlay_decimal - 1) * 100:.2f}")
    else:
        print("No MLB games currently available")

if __name__ == "__main__":
    test_draftkings_bets()
