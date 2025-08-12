// Initialize analytics engine
const analytics = new MLBAnalyticsEngine();

// UI Elements
const analyzeBtn = document.getElementById('analyzeBtn');
const refreshBtn = document.getElementById('refreshBtn');
const loadingState = document.getElementById('loadingState');
const mainContent = document.getElementById('mainContent');
const errorState = document.getElementById('errorState');
const retryBtn = document.getElementById('retryBtn');
const confidenceFilter = document.getElementById('confidenceFilter');
const betTypeFilter = document.getElementById('betTypeFilter');

// Loading state management
function showLoading() {
    loadingState.style.display = 'flex';
    mainContent.style.display = 'none';
    errorState.style.display = 'none';
}

function hideLoading() {
    loadingState.style.display = 'none';
    mainContent.style.display = 'block';
    errorState.style.display = 'none';
}

function showError(message) {
    loadingState.style.display = 'none';
    mainContent.style.display = 'none';
    errorState.style.display = 'flex';
    document.getElementById('errorMessage').textContent = message;
}

// Analysis execution
async function runAnalysis() {
    try {
        showLoading();
        console.log('Starting analysis...');
        const results = await analytics.runComprehensiveAnalysis();
        console.log('Analysis complete:', results);
        hideLoading();
        updateUI(results);
    } catch (error) {
        console.error('Analysis failed:', error);
        showError(error.message);
    }
}

// UI update functions
function updateUI(results) {
    // Update header stats
    document.getElementById('totalOpportunities').textContent = results.totalOpportunities || 0;
    document.getElementById('highConfidence').textContent = results.highConfidence || 0;
    document.getElementById('gamesAnalyzed').textContent = results.games?.length || 0;

    // Update sections
    updateTopPicks(results.recommendations);
    updateTeamBets(results.recommendations.filter(r => !r.betType.includes('player_')));
    updatePlayerProps(results.recommendations.filter(r => r.betType.includes('player_')));
    updateParlays(results.parlays);
    updateAnalytics(results);
}

function updateTopPicks(recommendations) {
    const topPicks = document.getElementById('topPicks');
    const highConfPicks = recommendations
        .filter(rec => rec.score >= 7.0)
        .slice(0, 6);

    topPicks.innerHTML = highConfPicks.map(pick => `
        <div class="pick-card">
            <div class="pick-header score-${getConfidenceClass(pick.score)}">
                <span class="score">${pick.score.toFixed(1)}/10</span>
                <span class="confidence">${pick.confidenceLabel || getConfidenceLabel(pick.score)}</span>
            </div>
            <div class="pick-content">
                <h3>${formatBetType(pick.betType)}</h3>
                ${pick.player ? `<p class="player">${pick.player}</p>` : ''}
                ${pick.team ? `<p class="team">${pick.team}</p>` : ''}
                <p class="matchup">${formatMatchup(pick.matchup, pick.team) || ''}</p>
                <p class="odds">Odds: ${formatOdds(pick.odds)}</p>
                <p class="reason">${pick.reason || ''}</p>
                <div class="pick-actions">
                    <button class="track-bet-btn" data-bet='${JSON.stringify(pick)}'>Track Bet</button>
                </div>
            </div>
        </div>
    `).join('');

    // Add event listeners for track buttons
    topPicks.querySelectorAll('.track-bet-btn').forEach(btn => {
        btn.addEventListener('click', () => trackBet(JSON.parse(btn.dataset.bet)));
    });
}

function updateTeamBets(teamBets) {
    const teamBetsContainer = document.getElementById('teamBets');
    teamBetsContainer.innerHTML = teamBets.map(bet => `
        <div class="bet-card" data-bet-type="${getBetCategory(bet.betType)}">
            <div class="bet-header score-${getConfidenceClass(bet.score)}">
                <span class="score">${bet.score.toFixed(1)}/10</span>
                <span class="confidence">${bet.confidenceLabel || getConfidenceLabel(bet.score)}</span>
            </div>
            <div class="bet-content">
                <h3>${formatBetType(bet.betType)}</h3>
                <div class="bet-details">
                    ${bet.team ? `<p class="team"><strong>${bet.team}</strong></p>` : ''}
                    <p class="game">${formatMatchup(bet.matchup, bet.team) || ''}</p>
                    ${bet.line ? `<p class="line">Line: ${bet.line}</p>` : ''}
                    <p class="odds">Odds: ${formatOdds(bet.odds)}</p>
                </div>
                <p class="reason">${bet.reason || ''}</p>
                <div class="bet-actions">
                    <button class="track-bet-btn" data-bet='${JSON.stringify(bet)}'>Track Bet</button>
                </div>
            </div>
        </div>
    `).join('');

    // Add event listeners for track buttons
    teamBetsContainer.querySelectorAll('.track-bet-btn').forEach(btn => {
        btn.addEventListener('click', () => trackBet(JSON.parse(btn.dataset.bet)));
    });
}

function updatePlayerProps(props) {
    const propsContainer = document.getElementById('playerProps');
    
    // Enhanced prop categorization with detailed filters
    console.log('All props:', props); // Debug log

    const categorizedProps = {
        hitting: props.filter(p => {
            const isPitchingProp = 
                p.betType?.includes('pitcher_') ||
                p.betType?.includes('strikeouts') ||
                p.betType?.includes('quality_start') ||
                p.betType?.includes('innings') ||
                p.category === 'pitching' ||
                p.position === 'P';
            
            if (isPitchingProp) return false;

            return p.betType?.includes('player_') ||
                   p.betType?.includes('hits') ||
                   p.betType?.includes('hr') ||
                   p.betType?.includes('rbi') ||
                   p.betType?.includes('bases') ||
                   p.betType?.includes('runs') ||
                   p.category === 'hitting';
        }),
        pitching: props.filter(p => {
            const isPitchingProp = 
                p.betType?.includes('pitcher_') ||
                p.betType?.includes('strikeouts') ||
                p.betType?.includes('quality_start') ||
                p.betType?.includes('innings') ||
                p.category === 'pitching' ||
                p.position === 'P' ||
                p.player?.toLowerCase().includes('pitcher');
            
            console.log(`Prop ${p.player || p.betType}: isPitchingProp = ${isPitchingProp}`); // Debug log
            return isPitchingProp;
        }),
        streaks: props.filter(p => 
            p.propFactor === 'hot_streak' || 
            (p.player && p.player in (window.MLBAnalyticsEngine.prototype.playerDatabase || {}) && 
             window.MLBAnalyticsEngine.prototype.playerDatabase[p.player]?.hotStreak)
        ),
        situational: props.filter(p => {
            const hasFactor = p.venueFactor || p.weatherFactor || 
                            (p.propFactor && p.propFactor !== 'hot_streak');
            const isSpecialVenue = p.reason && (
                p.reason.includes('Coors Field') ||
                p.reason.includes('Yankee Stadium') ||
                p.reason.includes('Fenway Park')
            );
            const hasWeatherImpact = p.reason && (
                p.reason.includes('temperature') ||
                p.reason.includes('wind') ||
                p.reason.includes('humidity')
            );
            return hasFactor || isSpecialVenue || hasWeatherImpact;
        })
    };
    
    // Debug log for prop counts
    console.log('Props by category:', {
        hitting: categorizedProps.hitting.length,
        pitching: categorizedProps.pitching.length,
        streaks: categorizedProps.streaks.length,
        situational: categorizedProps.situational.length
    });

    propsContainer.innerHTML = `
        <div class="props-sections">
            <div id="hittingProps" class="prop-section ${categorizedProps.hitting.length ? '' : 'empty'}">
                <h3>Hitting Props (${categorizedProps.hitting.length})</h3>
                <div class="props-grid">
                    ${renderPropCards(categorizedProps.hitting, 'hitting')}
                </div>
            </div>
            
            <div id="pitchingProps" class="prop-section ${categorizedProps.pitching.length ? '' : 'empty'}">
                <h3>Pitching Props (${categorizedProps.pitching.length})</h3>
                <div class="props-grid">
                    ${renderPropCards(categorizedProps.pitching, 'pitching')}
                </div>
            </div>
            
            <div id="streakProps" class="prop-section ${categorizedProps.streaks.length ? '' : 'empty'}">
                <h3>Hot Streaks (${categorizedProps.streaks.length})</h3>
                <div class="props-grid">
                    ${renderPropCards(categorizedProps.streaks, 'streaks')}
                </div>
            </div>
            
            <div id="situationalProps" class="prop-section ${categorizedProps.situational.length ? '' : 'empty'}">
                <h3>Situational Props (${categorizedProps.situational.length})</h3>
                <div class="props-grid">
                    ${renderPropCards(categorizedProps.situational, 'situational')}
                </div>
            </div>
        </div>
    `;

    // Add event listeners for track buttons
    propsContainer.querySelectorAll('.track-bet-btn').forEach(btn => {
        btn.addEventListener('click', () => trackBet(JSON.parse(btn.dataset.bet)));
    });
    
    // Show relevant sections based on current category filter
    const activeCategory = document.querySelector('.category-btn.active')?.dataset.category;
    filterPropsByCategory(activeCategory || 'all');
}


function updateParlays(parlays) {
    const parlaysContainer = document.getElementById('parlaysList');
    parlaysContainer.innerHTML = parlays.map(parlay => `
        <div class="parlay-card">
            <div class="parlay-header score-${getConfidenceClass(parlay.avgScore)}">
                <span class="score">${parlay.avgScore.toFixed(1)}/10</span>
                <span class="risk-level">${parlay.riskLevel ? parlay.riskLevel.toUpperCase() : getConfidenceLabel(parlay.avgScore)}</span>
            </div>
            <div class="parlay-content">
                <h3>${parlay.legs.length}-leg parlay</h3>
                <div class="parlay-legs">
                    ${parlay.legs.map(leg => `
                        <div class="parlay-leg">
                            <h4>${leg.matchup || leg.player}</h4>
                            <p class="bet-type">${formatBetType(leg.betType)}</p>
                            ${leg.odds ? `<p class="odds">Odds: ${formatOdds(leg.odds)}</p>` : ''}
                        </div>
                    `).join('')}
                </div>
                <p class="reason">${parlay.reasoning || ''}</p>
                <div class="parlay-actions">
                    <button class="track-bet-btn" data-bet='${JSON.stringify(parlay)}'>Track Parlay</button>
                </div>
            </div>
        </div>
    `).join('');

    // Add event listeners for track buttons
    parlaysContainer.querySelectorAll('.track-bet-btn').forEach(btn => {
        btn.addEventListener('click', () => trackBet(JSON.parse(btn.dataset.bet)));
    });
}

function updateAnalytics(results) {
    updateConfidenceChart(results.recommendations);
    updateBetTypeChart(results.recommendations);
}

// Helper functions
function getConfidenceClass(score) {
    if (score >= 8.0) return 'very-high';
    if (score >= 7.0) return 'high';
    if (score >= 6.0) return 'medium';
    return 'low';
}

function getConfidenceLabel(score) {
    if (score >= 8.0) return 'VERY HIGH';
    if (score >= 7.0) return 'HIGH';
    if (score >= 6.0) return 'MEDIUM';
    return 'LOW';
}

function formatOdds(odds) {
    if (!odds) return 'N/A';
    return odds > 0 ? `+${odds}` : odds;
}

function getBetCategory(betType) {
    if (!betType) return 'other';
    if (betType.includes('ml')) return 'ml';
    if (betType.includes('total')) return 'total';
    if (betType.includes('runline')) return 'runline';
    if (betType.includes('f5') || betType.includes('first_5')) return 'f5';
    return 'other';
}

function getPlayerPropCategory(betType) {
    if (!betType) return 'other';
    if (betType.includes('hits') || betType.includes('rbi') || betType.includes('hr')) return 'hitting';
    if (betType.includes('strikeout') || betType.includes('earned_run')) return 'pitching';
    if (betType.includes('streak')) return 'streaks';
    return 'situational';
}

function renderPropCards(props, category) {
    if (!props.length) {
        return `
            <div class="empty-state">
                <i class="fas fa-info-circle"></i>
                <p>No ${category} props available at this time</p>
            </div>
        `;
    }

    return props.map(prop => {
        // Enhanced reason formatting
        let enhancedReason = prop.reason;
        if (category === 'situational') {
            const venueFactor = prop.venueFactor ? `Venue Impact: ${prop.venueFactor.replace(/_/g, ' ')}` : '';
            const weatherFactor = prop.weatherFactor ? `Weather Impact: ${prop.weatherFactor.replace(/_/g, ' ')}` : '';
            const modelFactor = prop.model ? `Model: ${prop.model.replace(/_/g, ' ')}` : '';
            const factors = [venueFactor, weatherFactor, modelFactor].filter(f => f).join(' | ');
            
            if (factors) {
                enhancedReason = `${prop.reason}<br><span class="factor-detail">${factors}</span>`;
            }
            
            if (prop.venueFactors) {
                enhancedReason += `<br><span class="venue-stats">Venue Stats: ${JSON.stringify(prop.venueFactors)}</span>`;
            }
        }

        return `
        <div class="prop-card ${category}-card" data-prop-type="${category}">
            <div class="prop-header score-${getConfidenceClass(prop.score)}">
                <span class="score">${prop.score.toFixed(1)}/10</span>
                <span class="confidence">${prop.confidenceLabel || getConfidenceLabel(prop.score)}</span>
            </div>
            <div class="prop-content">
                <div class="prop-title">
                    <h3>${prop.player || prop.pitcher}</h3>
                    <span class="team-badge">${prop.team || getTeamFromMatchup(prop.matchup, prop.player) || ''}</span>
                </div>
                <div class="prop-details">
                    <div class="prop-type-line">
                        <span class="prop-label">${formatBetType(prop.betType)}</span>
                        <span class="prop-value">${prop.propLine || ''}</span>
                    </div>
                    <p class="game-info">${formatMatchup(prop.matchup, prop.team) || ''}</p>
                    ${prop.odds ? `<p class="odds-info">Odds: ${formatOdds(prop.odds)}</p>` : ''}
                </div>
                <div class="prop-analysis">
                    <p class="reason">${enhancedReason}</p>
                    ${renderPropStats(prop, category)}
                    ${renderFactorBadges(prop)}
                </div>
                <div class="prop-actions">
                    <button class="track-bet-btn" data-bet='${JSON.stringify(prop)}'>
                        <i class="fas fa-bookmark"></i> Track Bet
                    </button>
                </div>
            </div>
        </div>
    `}).join('');
}
}

function renderPropStats(prop, category) {
    switch(category) {
        case 'streaks':
            if (prop.hot_streak) {
                return `
                    <div class="prop-stats">
                        <div class="stat-item">
                            <span class="stat-value">${(prop.hot_streak.battingStats?.recentAvg || 0).toFixed(3)}</span>
                            <span class="stat-label">Recent AVG</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${prop.hot_streak.battingStats?.recentHR || 0}</span>
                            <span class="stat-label">Recent HR</span>
                        </div>
                    </div>
                `;
            }
            break;
        case 'pitching':
            if (prop.pitching) {
                return `
                    <div class="prop-stats">
                        <div class="stat-item">
                            <span class="stat-value">${prop.pitching.kPer9?.toFixed(1) || '-'}</span>
                            <span class="stat-label">K/9</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${prop.pitching.era?.toFixed(2) || '-'}</span>
                            <span class="stat-label">ERA</span>
                        </div>
                    </div>
                `;
            }
            break;
    }
    return '';
}

function renderFactorBadges(prop) {
    const factors = [];
    
    if (prop.hot_streak?.isHot) factors.push('Hot Streak');
    if (prop.situational_factors?.score >= 2) factors.push(...(prop.situational_factors.factors || []));
    if (prop.batter_vs_pitcher?.avg > 0.300) factors.push('Strong vs Pitcher');
    
    if (!factors.length) return '';
    
    return `
        <div class="factor-badges">
            ${factors.map(factor => `
                <span class="factor-badge">${factor}</span>
            `).join('')}
        </div>
    `;
}

function formatBetType(betType) {
    if (!betType) return 'N/A';
    
    // Special cases for player props
    if (betType.includes('player_')) {
        const parts = betType.split('_');
        if (parts.includes('over')) {
            const propType = parts.slice(1, -1).join(' ').toUpperCase();
            return `OVER ${propType}`;
        }
        if (parts.includes('under')) {
            const propType = parts.slice(1, -1).join(' ').toUpperCase();
            return `UNDER ${propType}`;
        }
    }
    
    // Handle team totals
    if (betType.includes('total')) {
        if (betType.includes('over')) return 'OVER TEAM TOTAL';
        if (betType.includes('under')) return 'UNDER TEAM TOTAL';
        return 'TEAM TOTAL';
    }
    
    // Handle moneyline
    if (betType.includes('ml')) return 'MONEYLINE';
    
    // Handle runline
    if (betType.includes('runline')) return 'RUN LINE';
    
    // Handle first 5
    if (betType.includes('f5') || betType.includes('first_5')) return 'FIRST 5 INNINGS';
    
    // Convert to uppercase
    const formatted = betType
        .split('_')
        .map(word => {
            // Special case for RBI, HR, etc.
            return word.toUpperCase();
        })
        .join(' ');
    
    return formatted;
}

// Chart updates
function updateConfidenceChart(recommendations) {
    const ctx = document.getElementById('confidenceChart').getContext('2d');
    const confidenceCounts = {
        'Very High (8-10)': recommendations.filter(r => r.score >= 8.0).length,
        'High (7-8)': recommendations.filter(r => r.score >= 7.0 && r.score < 8.0).length,
        'Medium (6-7)': recommendations.filter(r => r.score >= 6.0 && r.score < 7.0).length,
        'Low (<6)': recommendations.filter(r => r.score < 6.0).length
    };

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(confidenceCounts),
            datasets: [{
                data: Object.values(confidenceCounts),
                backgroundColor: ['#4CAF50', '#8BC34A', '#FFC107', '#FF5722']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                title: {
                    display: true,
                    text: 'Confidence Distribution'
                }
            }
        }
    });
}

function updateBetTypeChart(recommendations) {
    const ctx = document.getElementById('betTypeChart').getContext('2d');
    const betTypeCounts = {
        'Team ML': recommendations.filter(r => r.betType.includes('ml')).length,
        'Team Totals': recommendations.filter(r => r.betType.includes('total')).length,
        'Player Props': recommendations.filter(r => r.betType.includes('player_')).length,
        'Other': recommendations.filter(r => !r.betType.includes('ml') && !r.betType.includes('total') && !r.betType.includes('player_')).length
    };

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(betTypeCounts),
            datasets: [{
                data: Object.values(betTypeCounts),
                backgroundColor: ['#2196F3', '#9C27B0', '#FF9800', '#607D8B']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                title: {
                    display: true,
                    text: 'Bet Type Distribution'
                }
            }
        }
    });
}

// Bet tracking
async function trackBet(bet) {
    const button = event.target;
    button.disabled = true;
    button.textContent = 'Tracking...';
    
    try {
        const response = await fetch('/.netlify/functions/track-bets', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                bets: [bet],
                userId: 'user123' // Replace with actual user management
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to track bet');
        }

        button.textContent = '✓ Tracked';
        button.classList.add('tracked');
        showNotification('Bet tracked successfully!', 'success');
        
        // Immediately load tracked bets if we're on the tracked tab
        const trackedTab = document.querySelector('.tab-pane#tracked');
        if (trackedTab && trackedTab.classList.contains('active')) {
            loadTrackedBets();
        }
    } catch (error) {
        console.error('Error tracking bet:', error);
        button.disabled = false;
        button.textContent = 'Track Bet';
        showNotification(error.message || 'Failed to track bet', 'error');
    }
}

// Notification system
function getTeamFromMatchup(matchup, player) {
    if (!matchup) return '';
    const teams = matchup.split('@').map(team => team.trim());
    // Basic heuristic - return the first team as default
    // This could be enhanced with a player-team database lookup
    return teams[0];
}

function formatMatchup(matchup, playerTeam) {
    if (!matchup) return '';
    const formattedMatchup = matchup.replace('@', ' @ ');
    // Highlight the player's team if known
    if (playerTeam) {
        return formattedMatchup.replace(playerTeam, `<strong>${playerTeam}</strong>`);
    }
    return formattedMatchup;
}

function filterPropsByCategory(category) {
    // Get all prop sections
    const sections = document.querySelectorAll('.prop-section');
    
    sections.forEach(section => {
        // Get the section type from the ID (e.g., "hittingProps" -> "hitting")
        const sectionType = section.id.replace('Props', '').toLowerCase();
        
        if (category === 'all') {
            // Show all non-empty sections for 'all' category
            section.style.display = section.classList.contains('empty') ? 'none' : 'block';
        } else {
            // Only show the selected category if it's not empty
            const shouldShow = sectionType === category && !section.classList.contains('empty');
            section.style.display = shouldShow ? 'block' : 'none';
            
            // Log for debugging
            console.log(`Section ${sectionType}: ${shouldShow ? 'showing' : 'hiding'} (empty: ${section.classList.contains('empty')})`);
        }
    });

    // Update counts in section headers
    sections.forEach(section => {
        const visibleCards = section.querySelectorAll('.prop-card:not([style*="display: none"])').length;
        const header = section.querySelector('h3');
        if (header) {
            const sectionType = section.id.replace('Props', '');
            header.textContent = `${sectionType} Props (${visibleCards})`;
        }
    });
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

// Event listeners
analyzeBtn.addEventListener('click', runAnalysis);
refreshBtn.addEventListener('click', runAnalysis);
retryBtn.addEventListener('click', runAnalysis);

// Tab navigation
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        // Remove active class from all tabs and buttons
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        
        // Add active class to clicked button and corresponding pane
        btn.classList.add('active');
        const tabId = btn.dataset.tab;
        document.getElementById(tabId).classList.add('active');
    });
});

// Filters
confidenceFilter.addEventListener('change', () => {
    analytics.currentFilters.confidence = confidenceFilter.value;
    updateUI({ 
        recommendations: analytics.applyFilters(),
        games: analytics.cache.games,
        parlays: analytics.cache.parlays
    });
});

betTypeFilter.addEventListener('change', () => {
    analytics.currentFilters.betType = betTypeFilter.value;
    updateUI({ 
        recommendations: analytics.applyFilters(),
        games: analytics.cache.games,
        parlays: analytics.cache.parlays
    });
});

// Tracked bets functionality
async function loadTrackedBets() {
    try {
        const response = await fetch('/.netlify/functions/track-bets?userId=user123');
        if (!response.ok) {
            throw new Error('Failed to load tracked bets');
        }
        
        const data = await response.json();
        updateTrackedBetsUI(data.bets);
    } catch (error) {
        console.error('Error loading tracked bets:', error);
        showNotification('Failed to load tracked bets', 'error');
    }
}

function updateTrackedBetsUI(bets) {
    const trackedBetsContainer = document.getElementById('trackedBets');
    console.log('Updating tracked bets UI with:', bets); // Debug log
    
    if (!bets || bets.length === 0) {
        trackedBetsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-bookmark"></i>
                <p>No tracked bets yet. Track some bets to see them here!</p>
            </div>
        `;
        return;
    }
    
    trackedBetsContainer.innerHTML = bets.map(record => {
        // Handle both single bet and bet array formats
        const bet = Array.isArray(record.bets) ? record.bets[0] : record;
        const score = bet.score || bet.avgScore || 0;
        
        return `
            <div class="tracked-bet-card ${record.status || 'pending'}">
                <div class="bet-header score-${getConfidenceClass(score)}">
                    <span class="score">${score.toFixed(1)}/10</span>
                    <span class="confidence">${getConfidenceLabel(score)}</span>
                    <span class="status-badge">${record.status || 'PENDING'}</span>
                </div>
                <div class="bet-content">
                    <div class="bet-detail">
                        <h3>${formatBetType(bet.betType)}</h3>
                        <p class="matchup">${bet.matchup || bet.player || ''}</p>
                        ${bet.odds ? `<p class="odds">Odds: ${formatOdds(bet.odds)}</p>` : ''}
                        <p class="reason">${bet.reason || ''}</p>
                    </div>
                    <div class="bet-metadata">
                        <span class="timestamp">Tracked: ${new Date(record.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Load tracked bets when switching to tracked tab
document.querySelector('[data-tab="tracked"]').addEventListener('click', loadTrackedBets);

// Filter buttons functionality
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const container = btn.closest('.section').querySelector('.bets-container, .props-container');
        const filter = btn.dataset.filter;
        
        // Update active button
        btn.closest('.filters, .props-categories').querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Filter items
        if (filter === 'all') {
            container.querySelectorAll('.bet-card, .prop-card').forEach(card => card.style.display = '');
        } else {
            container.querySelectorAll('.bet-card, .prop-card').forEach(card => {
                if (card.dataset.betType === filter || card.dataset.propType === filter) {
                    card.style.display = '';
                } else {
                    card.style.display = 'none';
                }
            });
        }
    });
});

// Category buttons functionality
document.querySelectorAll('.category-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const category = btn.dataset.category;
        
        // Update active button
        document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Filter prop sections
        filterPropsByCategory(category);
    });
});

// Export functionality
document.getElementById('exportFab').addEventListener('click', () => {
    analytics.exportResults();
});