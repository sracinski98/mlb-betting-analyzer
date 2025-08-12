from mlb_analyzer.data.mlb_api import MLBApi
import pandas as pd
pd.set_option('display.max_rows', None)
pd.set_option('display.max_columns', None)
pd.set_option('display.width', None)

def main():
    api = MLBApi()
    
    # Get today's games
    print("\n=== TODAY'S GAMES ===")
    games = api.get_live_games()
    print(games[['game_id', 'home_team', 'away_team', 'status']].to_string())
    
    # Get raw odds data
    print("\n=== RAW ODDS DATA ===")
    raw_odds = api.odds_provider.get_all_odds()
    if isinstance(raw_odds, pd.DataFrame):
        # Clean team names
        raw_odds['home_team'] = raw_odds['home_team'].apply(api._normalize_team_name)
        raw_odds['away_team'] = raw_odds['away_team'].apply(api._normalize_team_name)
        
        # Group by game and calculate averages
        agg_odds = raw_odds.groupby(['game_id', 'home_team', 'away_team']).agg({
            'home_moneyline': 'mean',
            'away_moneyline': 'mean',
            'total_runs': 'mean',
            'over_odds': 'mean',
            'under_odds': 'mean',
        }).reset_index()
        
        # Add bookmaker count
        agg_odds['bookmakers'] = raw_odds.groupby('game_id')['bookmaker'].nunique()
        
        # Round appropriately
        agg_odds['home_moneyline'] = agg_odds['home_moneyline'].round()
        agg_odds['away_moneyline'] = agg_odds['away_moneyline'].round()
        agg_odds['total_runs'] = agg_odds['total_runs'].round(1)
        agg_odds['over_odds'] = agg_odds['over_odds'].round()
        agg_odds['under_odds'] = agg_odds['under_odds'].round()
        
        print("\nProcessed odds data:")
        print(agg_odds.to_string())
        
        # Compare with scheduled games
        print("\n=== MATCHING ANALYSIS ===")
        games_with_odds = set(zip(agg_odds['home_team'], agg_odds['away_team']))
        scheduled_games = set(zip(games['home_team'], games['away_team']))
        
        print("\nGames with odds:")
        for game in sorted(games_with_odds):
            print(f"{game[0]} vs {game[1]}")
        
        print("\nScheduled games:")
        for game in sorted(scheduled_games):
            print(f"{game[0]} vs {game[1]}")
        
        missing_games = scheduled_games - games_with_odds
        if missing_games:
            print("\nMissing odds for:")
            for game in sorted(missing_games):
                print(f"{game[0]} vs {game[1]}")
    else:
        print("Error: Could not get odds data")

if __name__ == '__main__':
    main()
