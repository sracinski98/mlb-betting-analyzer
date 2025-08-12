"""
Command-line interface for testing MLB data collection.
"""

import argparse
from datetime import datetime, timedelta
import pandas as pd
from mlb_analyzer.data.mlb_api import MLBApi

def main():
    parser = argparse.ArgumentParser(description='MLB Data Collection CLI')
    parser.add_argument('--date', type=str, help='Date in YYYY-MM-DD format')
    parser.add_argument('--team', type=str, help='Team abbreviation (e.g., NYY)')
    parser.add_argument('--action', type=str, choices=['games', 'stats', 'statcast'],
                       help='Action to perform')
    parser.add_argument('--output', type=str, help='Output file path')
    
    args = parser.parse_args()
    api = MLBApi()
    
    # Use today's date if not specified
    if not args.date:
        args.date = datetime.now().strftime("%Y-%m-%d")
    
    try:
        if args.action == 'games':
            # Fetch games for specified date
            games = api.get_games_by_date(args.date)
            print("\nGames found for", args.date)
            print("==================")
            print(games)
            
            if args.output:
                games.to_csv(args.output)
                print(f"\nSaved games data to {args.output}")
                
        elif args.action == 'stats' and args.team:
            # Fetch team stats
            stats = api.get_team_stats(args.team)
            print(f"\nTeam stats for {args.team}")
            print("==================")
            print(stats)
            
            if args.output:
                stats.to_csv(args.output)
                print(f"\nSaved team stats to {args.output}")
                
        elif args.action == 'statcast':
            # Fetch Statcast data for a 7-day window
            end_date = datetime.strptime(args.date, "%Y-%m-%d")
            start_date = end_date - timedelta(days=7)
            data = api.get_statcast_data(start_date.strftime("%Y-%m-%d"), 
                                       args.date)
            print("\nStatcast data summary:")
            print("==================")
            print(data.describe())
            
            if args.output:
                data.to_csv(args.output)
                print(f"\nSaved Statcast data to {args.output}")
        
        else:
            print("Please specify a valid action and required parameters")
            parser.print_help()
            
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    main()
