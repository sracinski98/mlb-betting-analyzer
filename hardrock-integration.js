/**
 * Hard Rock Sportsbook API Integration
 * Fetches live odds, line movements, and betting data specifically from Hard Rock
 */

class HardRockIntegration {
    constructor() {
        this.config = {
            // Hard Rock Sportsbook API endpoints (using The Odds API as proxy)
            baseUrl: 'https://api.the-odds-api.com/v4',
            apiKey: 'b1cc0151482fcdf0d3d970d1355b1323',
            bookmaker: 'draftkings', // Will use DraftKings as Hard Rock proxy for now
            sport: 'baseball_mlb',
            regions: 'us',
            markets: 'h2h,spreads,totals,h2h_lay,spreads_lay,totals_lay'
        };
        
        this.cache = {
            odds: null,
            lineHistory: {},
            lastUpdate: null,
            ttl: 2 * 60 * 1000 // 2 minutes for live odds
        };
        
        this.lineMovement = {
            tracking: {},
            alerts: [],
            thresholds: {
                significant: 0.5, // 0.5 point move is significant
                major: 1.0       // 1.0 point move is major
            }
        };
    }

    /**
     * Fetch live odds from Hard Rock Sportsbook
     */
    async fetchLiveOdds(games) {
        console.log('🎰 Fetching Hard Rock live odds...');
        
        try {
            // Check cache first for live odds
            if (this.isCacheValid()) {
                console.log('📋 Using cached Hard Rock odds');
                return this.cache.odds;
            }
            
            const oddsData = await this.getOddsFromAPI();
            const processedOdds = this.processHardRockOdds(oddsData, games);
            
            // Track line movements
            this.trackLineMovements(processedOdds);
            
            // Cache the results
            this.cache.odds = processedOdds;
            this.cache.lastUpdate = Date.now();
            
            console.log('✅ Hard Rock odds fetched successfully');
            return processedOdds;
            
        } catch (error) {
            console.error('❌ Hard Rock odds fetch failed:', error);
            return this.getFallbackOdds(games);
        }
    }

    /**
     * Get odds data from The Odds API (Hard Rock proxy)
     */
    async getOddsFromAPI() {
        const url = `${this.config.baseUrl}/sports/${this.config.sport}/odds/` +
                   `?apiKey=${this.config.apiKey}` +
                   `&regions=${this.config.regions}` +
                   `&markets=${this.config.markets}` +
                   `&bookmakers=${this.config.bookmaker}` +
                   `&dateFormat=iso`;
        
        console.log('🌐 Calling Hard Rock odds API...');
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Hard Rock API error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`📊 Received odds for ${data.length} games`);
        
        return data;
    }

    /**
     * Process and format Hard Rock odds data
     */
    processHardRockOdds(oddsData, games) {
        console.log('🔄 Processing Hard Rock odds data...');
        
        const processedOdds = {
            games: {},
            summary: {
                totalGames: 0,
                averageOdds: {},
                lineMovements: 0,
                lastUpdate: new Date().toISOString()
            }
        };
        
        oddsData.forEach(game => {
            const gameId = this.matchGameToMLB(game, games);
            if (!gameId) return;
            
            const hardRockBook = game.bookmakers.find(book => 
                book.key === this.config.bookmaker
            );
            
            if (!hardRockBook) return;
            
            processedOdds.games[gameId] = {
                gameId: gameId,
                homeTeam: game.home_team,
                awayTeam: game.away_team,
                commence_time: game.commence_time,
                markets: this.processMarkets(hardRockBook.markets),
                lineHistory: this.getLineHistory(gameId),
                movements: this.getRecentMovements(gameId),
                value: this.calculateValueBets(hardRockBook.markets),
                lastUpdated: new Date().toISOString()
            };
            
            processedOdds.summary.totalGames++;
        });
        
        return processedOdds;
    }

    /**
     * Process different betting markets from Hard Rock
     */
    processMarkets(markets) {
        const processed = {};
        
        markets.forEach(market => {
            switch (market.key) {
                case 'h2h': // Moneyline
                    processed.moneyline = {
                        home: this.findOutcome(market.outcomes, 'home'),
                        away: this.findOutcome(market.outcomes, 'away'),
                        lastUpdate: market.last_update
                    };
                    break;
                    
                case 'spreads': // Run line
                    processed.runline = {
                        home: this.findOutcome(market.outcomes, 'home'),
                        away: this.findOutcome(market.outcomes, 'away'),
                        lastUpdate: market.last_update
                    };
                    break;
                    
                case 'totals': // Over/Under
                    processed.total = {
                        over: this.findOutcome(market.outcomes, 'over'),
                        under: this.findOutcome(market.outcomes, 'under'),
                        lastUpdate: market.last_update
                    };
                    break;
            }
        });
        
        return processed;
    }

    /**
     * Find specific outcome in market outcomes
     */
    findOutcome(outcomes, type) {
        const outcome = outcomes.find(o => {
            if (type === 'home' || type === 'away') {
                return o.name.toLowerCase().includes(type);
            }
            return o.name.toLowerCase() === type;
        });
        
        return outcome ? {
            price: outcome.price,
            point: outcome.point || null,
            name: outcome.name
        } : null;
    }

    /**
     * Match odds API game to MLB game
     */
    matchGameToMLB(oddsGame, mlbGames) {
        // Simple team name matching - can be enhanced
        const homeTeam = oddsGame.home_team;
        const awayTeam = oddsGame.away_team;
        
        for (const game of mlbGames) {
            const mlbHome = game.teams?.home?.team?.name;
            const mlbAway = game.teams?.away?.team?.name;
            
            if (this.teamsMatch(homeTeam, mlbHome) && this.teamsMatch(awayTeam, mlbAway)) {
                return game.gamePk;
            }
        }
        
        return null;
    }

    /**
     * Check if team names match (handles abbreviations and variations)
     */
    teamsMatch(oddsTeam, mlbTeam) {
        if (!oddsTeam || !mlbTeam) return false;
        
        // Direct match
        if (oddsTeam.toLowerCase().includes(mlbTeam.toLowerCase()) ||
            mlbTeam.toLowerCase().includes(oddsTeam.toLowerCase())) {
            return true;
        }
        
        // City/name variations
        const teamMappings = {
            'Los Angeles Dodgers': ['Dodgers', 'LA Dodgers', 'LAD'],
            'New York Yankees': ['Yankees', 'NY Yankees', 'NYY'],
            'Boston Red Sox': ['Red Sox', 'Boston', 'BOS'],
            'San Diego Padres': ['Padres', 'San Diego', 'SD'],
            'Atlanta Braves': ['Braves', 'Atlanta', 'ATL'],
            // Add more mappings as needed
        };
        
        for (const [fullName, variations] of Object.entries(teamMappings)) {
            if ((mlbTeam === fullName && variations.some(v => 
                oddsTeam.toLowerCase().includes(v.toLowerCase()))) ||
                (oddsTeam === fullName && variations.some(v => 
                mlbTeam.toLowerCase().includes(v.toLowerCase())))) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Track line movements over time
     */
    trackLineMovements(newOdds) {
        console.log('📈 Tracking Hard Rock line movements...');
        
        Object.entries(newOdds.games).forEach(([gameId, gameData]) => {
            if (!this.lineMovement.tracking[gameId]) {
                this.lineMovement.tracking[gameId] = {
                    history: [],
                    alerts: []
                };
            }
            
            const tracking = this.lineMovement.tracking[gameId];
            const timestamp = Date.now();
            
            // Store current lines
            const currentLines = {
                timestamp: timestamp,
                moneyline: gameData.markets.moneyline,
                runline: gameData.markets.runline,
                total: gameData.markets.total
            };
            
            tracking.history.push(currentLines);
            
            // Keep only last 50 entries
            if (tracking.history.length > 50) {
                tracking.history = tracking.history.slice(-50);
            }
            
            // Check for significant movements
            if (tracking.history.length > 1) {
                this.checkForSignificantMovements(gameId, tracking.history);
            }
        });
    }

    /**
     * Check for significant line movements that warrant alerts
     */
    checkForSignificantMovements(gameId, history) {
        if (history.length < 2) return;
        
        const latest = history[history.length - 1];
        const previous = history[history.length - 2];
        
        // Check moneyline movements
        if (latest.moneyline && previous.moneyline) {
            const homeMove = Math.abs(latest.moneyline.home?.price - previous.moneyline.home?.price);
            const awayMove = Math.abs(latest.moneyline.away?.price - previous.moneyline.away?.price);
            
            if (homeMove > 20 || awayMove > 20) { // 20+ point movement
                this.addLineAlert(gameId, 'MONEYLINE_MOVEMENT', {
                    homeMove: homeMove,
                    awayMove: awayMove,
                    direction: homeMove > awayMove ? 'home' : 'away'
                });
            }
        }
        
        // Check total movements
        if (latest.total && previous.total && latest.total.over && previous.total.over) {
            const totalMove = Math.abs(latest.total.over.point - previous.total.over.point);
            
            if (totalMove >= this.lineMovement.thresholds.significant) {
                this.addLineAlert(gameId, 'TOTAL_MOVEMENT', {
                    movement: totalMove,
                    direction: latest.total.over.point > previous.total.over.point ? 'up' : 'down',
                    newTotal: latest.total.over.point
                });
            }
        }
    }

    /**
     * Add line movement alert
     */
    addLineAlert(gameId, type, data) {
        const alert = {
            gameId: gameId,
            type: type,
            data: data,
            timestamp: Date.now(),
            severity: this.getAlertSeverity(type, data)
        };
        
        this.lineMovement.alerts.push(alert);
        
        // Keep only last 100 alerts
        if (this.lineMovement.alerts.length > 100) {
            this.lineMovement.alerts = this.lineMovement.alerts.slice(-100);
        }
        
        console.log(`🚨 Line movement alert: ${type} for game ${gameId}`);
    }

    /**
     * Determine alert severity
     */
    getAlertSeverity(type, data) {
        switch (type) {
            case 'MONEYLINE_MOVEMENT':
                return Math.max(data.homeMove, data.awayMove) > 50 ? 'high' : 'medium';
            case 'TOTAL_MOVEMENT':
                return data.movement >= this.lineMovement.thresholds.major ? 'high' : 'medium';
            default:
                return 'low';
        }
    }

    /**
     * Calculate potential value bets
     */
    calculateValueBets(markets) {
        const value = {
            opportunities: [],
            summary: 'No significant value detected'
        };
        
        // Simple value calculation based on implied probability
        markets.forEach(market => {
            if (market.key === 'h2h' && market.outcomes.length === 2) {
                const homeOdds = market.outcomes.find(o => o.name.includes('home'))?.price;
                const awayOdds = market.outcomes.find(o => o.name.includes('away'))?.price;
                
                if (homeOdds && awayOdds) {
                    const homeImplied = this.oddsToImpliedProbability(homeOdds);
                    const awayImplied = this.oddsToImpliedProbability(awayOdds);
                    const totalImplied = homeImplied + awayImplied;
                    
                    // Look for low vig (under 105% total implied probability)
                    if (totalImplied < 1.05) {
                        value.opportunities.push({
                            market: 'moneyline',
                            type: 'low_vig',
                            vigPercentage: (totalImplied - 1) * 100,
                            recommendation: 'Consider both sides for arbitrage'
                        });
                    }
                }
            }
        });
        
        return value;
    }

    /**
     * Convert American odds to implied probability
     */
    oddsToImpliedProbability(americanOdds) {
        if (americanOdds > 0) {
            return 100 / (americanOdds + 100);
        } else {
            return Math.abs(americanOdds) / (Math.abs(americanOdds) + 100);
        }
    }

    /**
     * Get line history for a specific game
     */
    getLineHistory(gameId) {
        return this.lineMovement.tracking[gameId]?.history || [];
    }

    /**
     * Get recent movements for a specific game
     */
    getRecentMovements(gameId) {
        const alerts = this.lineMovement.alerts.filter(alert => alert.gameId === gameId);
        return alerts.slice(-5); // Last 5 movements
    }

    /**
     * Check if cached odds are still valid
     */
    isCacheValid() {
        return this.cache.lastUpdate && 
               (Date.now() - this.cache.lastUpdate) < this.cache.ttl &&
               this.cache.odds;
    }

    /**
     * Get fallback odds if API fails
     */
    getFallbackOdds(games) {
        console.log('🔄 Using fallback Hard Rock odds...');
        
        const fallback = {
            games: {},
            summary: {
                totalGames: games.length,
                averageOdds: {},
                lineMovements: 0,
                lastUpdate: new Date().toISOString(),
                status: 'FALLBACK_DATA'
            }
        };
        
        games.forEach(game => {
            fallback.games[game.gamePk] = {
                gameId: game.gamePk,
                homeTeam: game.teams?.home?.team?.name || 'Unknown',
                awayTeam: game.teams?.away?.team?.name || 'Unknown',
                markets: {
                    moneyline: {
                        home: { price: -110, name: 'Home' },
                        away: { price: -110, name: 'Away' }
                    }
                },
                lineHistory: [],
                movements: [],
                value: { opportunities: [] },
                status: 'FALLBACK'
            };
        });
        
        return fallback;
    }

    /**
     * Get odds adjustment for confidence scoring
     */
    getOddsAdjustment(gameId, prediction, hardRockOdds) {
        if (!hardRockOdds || !hardRockOdds.games || !hardRockOdds.games[gameId]) {
            return 0;
        }
        
        const gameOdds = hardRockOdds.games[gameId];
        let adjustment = 0;
        
        // Value bet bonus
        if (gameOdds.value.opportunities.length > 0) {
            adjustment += 0.3;
        }
        
        // Line movement consideration
        if (gameOdds.movements.length > 0) {
            const recentMovement = gameOdds.movements[gameOdds.movements.length - 1];
            if (recentMovement.severity === 'high') {
                adjustment += 0.4;
            } else if (recentMovement.severity === 'medium') {
                adjustment += 0.2;
            }
        }
        
        return Math.min(adjustment, 0.8); // Cap at 0.8 point boost
    }
}
