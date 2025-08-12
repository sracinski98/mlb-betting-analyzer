// Store chart instances globally
let confidenceChartInstance = null;
let distributionChartInstance = null;

// Button event handlers
function trackBet(bet) {
    console.log('Tracking bet:', bet);
    // Save the bet to local storage
    const trackedBets = JSON.parse(localStorage.getItem('trackedBets') || '[]');
    trackedBets.push({
        ...bet,
        trackingId: Date.now(),
        trackDate: new Date().toISOString()
    });
    localStorage.setItem('trackedBets', JSON.stringify(trackedBets));
    updateTrackingUI();
}

function updateTrackingUI() {
    const trackedBetsContainer = document.getElementById('trackedBets');
    if (!trackedBetsContainer) return;

    const trackedBets = JSON.parse(localStorage.getItem('trackedBets') || '[]');
    if (trackedBets.length === 0) {
        trackedBetsContainer.innerHTML = '<p>No bets tracked yet</p>';
        return;
    }

    trackedBetsContainer.innerHTML = `
        <div class="tracked-bets-grid">
            ${trackedBets.map(bet => `
                <div class="tracked-bet-card">
                    <h4>${bet.betType}</h4>
                    ${bet.player ? `<p>Player: ${bet.player}</p>` : ''}
                    ${bet.propLine ? `<p>Line: ${bet.propLine}</p>` : ''}
                    <p>Confidence: ${bet.confidence}</p>
                    <button class="remove-bet-btn" data-id="${bet.trackingId}">Remove</button>
                </div>
            `).join('')}
        </div>
    `;

    // Add event listeners for remove buttons
    trackedBetsContainer.querySelectorAll('.remove-bet-btn').forEach(btn => {
        btn.addEventListener('click', () => removeBet(btn.dataset.id));
    });
}

function removeBet(trackingId) {
    const trackedBets = JSON.parse(localStorage.getItem('trackedBets') || '[]');
    const updatedBets = trackedBets.filter(bet => bet.trackingId !== parseInt(trackingId));
    localStorage.setItem('trackedBets', JSON.stringify(updatedBets));
    updateTrackingUI();
}

function renderPropCards(props, category) {
    // Deduplicate props based on betType and reason
    const uniqueProps = props.reduce((acc, prop) => {
        const key = `${prop.betType}-${prop.reason}`;
        if (!acc[key] || prop.score > acc[key].score) {
            acc[key] = prop;
        }
        return acc;
    }, {});

    return Object.values(uniqueProps).map(prop => `
        <div class="prop-card ${category} ${prop.confidence.toLowerCase()}">
            <div class="prop-header">
                <div class="confidence-score">${prop.score?.toFixed(1) || '0.0'}/10</div>
                <div class="confidence-label">${prop.confidenceLabel || prop.confidence.toUpperCase()}</div>
            </div>
            <div class="prop-content">
                <h4>${prop.player || formatBetType(prop.betType)}</h4>
                ${prop.propLine ? `<p class="prop-line">${prop.propLine}</p>` : ''}
                ${prop.odds ? `<p class="odds">Odds: ${prop.odds}</p>` : ''}
                <p class="reason">${prop.reason || 'No analysis available'}</p>
                ${prop.team ? `<p class="team">Team: ${prop.team}</p>` : ''}
                ${prop.matchup ? `<p class="matchup">${prop.matchup}</p>` : ''}
            </div>
            <button class="track-bet-btn" data-bet='${JSON.stringify(prop)}'>
                <i class="fas fa-plus"></i> Track Bet
            </button>
        </div>
    `).join('');
}

function formatBetType(betType) {
    if (!betType) return 'Unknown Bet Type';
    return betType
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function filterPropsByCategory(category) {
    const sections = document.querySelectorAll('.prop-section');
    if (category === 'all') {
        sections.forEach(section => {
            if (!section.classList.contains('empty')) {
                section.style.display = 'block';
            }
        });
    } else {
        sections.forEach(section => {
            if (section.id === `${category}Props` && !section.classList.contains('empty')) {
                section.style.display = 'block';
            } else {
                section.style.display = 'none';
            }
        });
    }
}

function updateParlays(parlays) {
    const parlayContainer = document.getElementById('parlayRecommendations');
    if (!parlayContainer) return;

    // Group parlays by category
    const groupedParlays = parlays.reduce((acc, parlay) => {
        const category = parlay.parlayCategory || 'other';
        if (!acc[category]) acc[category] = [];
        acc[category].push(parlay);
        return acc;
    }, {});

    parlayContainer.innerHTML = `
        <div class="parlay-sections">
            ${Object.entries(groupedParlays).map(([category, categoryParlays]) => `
                <div class="parlay-section">
                    <h3>${formatCategory(category)} (${categoryParlays.length})</h3>
                    <div class="parlay-grid">
                        ${categoryParlays.map(parlay => `
                            <div class="parlay-card ${parlay.riskLevel}">
                                <div class="parlay-header">
                                    <div class="confidence-score">${parlay.avgScore?.toFixed(1) || '0.0'}/10</div>
                                    <div class="parlay-type">${parlay.type}</div>
                                    <div class="risk-level ${parlay.riskLevel}">${parlay.riskLevel.toUpperCase()}</div>
                                </div>
                                <div class="parlay-content">
                                    <p class="odds">Expected Odds: ${parlay.expectedOdds || 'N/A'}</p>
                                    <p class="reason">${parlay.reasoning || 'No analysis available'}</p>
                                    <div class="parlay-legs">
                                        ${parlay.legs.map(leg => `
                                            <div class="parlay-leg">
                                                <div class="leg-header">
                                                    <span class="leg-type">${formatBetType(leg.betType)}</span>
                                                    ${leg.confidence ? `<span class="leg-confidence">${leg.confidence.toUpperCase()}</span>` : ''}
                                                </div>
                                                ${leg.player ? `<p class="leg-player">${leg.player}</p>` : ''}
                                                ${leg.propLine ? `<p class="leg-line">${leg.propLine}</p>` : ''}
                                                <p class="leg-reason">${leg.reason || 'No analysis available'}</p>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                                <button class="track-parlay-btn" data-parlay='${JSON.stringify(parlay)}'>
                                    <i class="fas fa-plus"></i> Track Parlay
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
    `;

    // Add event listeners for track buttons
    parlayContainer.querySelectorAll('.track-parlay-btn').forEach(btn => {
        btn.addEventListener('click', () => trackBet(JSON.parse(btn.dataset.parlay)));
    });
}

function formatCategory(category) {
    if (!category) return 'Other';
    return category
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

    // Add event listeners for track buttons
    parlayContainer.querySelectorAll('.track-parlay-btn').forEach(btn => {
        btn.addEventListener('click', () => trackBet(JSON.parse(btn.dataset.parlay)));
    });
}

function updateConfidenceChart(data) {
    const ctx = document.getElementById('confidenceChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (confidenceChartInstance) {
        confidenceChartInstance.destroy();
    }
    
    // Create new chart
    confidenceChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Elite', 'Very High', 'High', 'Medium', 'Low'],
            datasets: [{
                label: 'Confidence Distribution',
                data: data,
                backgroundColor: [
                    '#4CAF50',
                    '#8BC34A',
                    '#CDDC39',
                    '#FFC107',
                    '#FF5722'
                ]
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

function updateAnalytics(recommendations) {
    const confidenceData = [0, 0, 0, 0, 0]; // Elite, Very High, High, Medium, Low
    
    recommendations.forEach(rec => {
        switch(rec.confidence) {
            case 'elite': confidenceData[0]++; break;
            case 'very-high': confidenceData[1]++; break;
            case 'high': confidenceData[2]++; break;
            case 'medium': case 'medium-high': case 'medium-low': confidenceData[3]++; break;
            case 'low': case 'very-low': confidenceData[4]++; break;
        }
    });
    
    updateConfidenceChart(confidenceData);
}

function updateUI(result) {
    try {
        updateAnalytics(result.recommendations);
        updateParlays(result.parlays);
        updatePlayerProps(result.recommendations);
    } catch (error) {
        console.error('UI update error:', error);
        throw error;
    }
}

async function runAnalysis() {
    console.log("Starting analysis...");
    
    if (!window.MLBAnalyticsEngine) {
        console.error("MLBAnalyticsEngine not found!");
        alert("Error: Analytics engine not loaded properly. Please refresh the page and try again.");
        return;
    }
    
    try {
        const engine = new window.MLBAnalyticsEngine();
        
        // Show loading state
        const analyzeButton = document.getElementById('analyzeButton');
        if (analyzeButton) {
            analyzeButton.disabled = true;
            analyzeButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';
        }
        
        const result = await engine.runComprehensiveAnalysis();
        console.log("Analysis complete:", result);
        updateUI(result);
        
        // Reset button state
        if (analyzeButton) {
            analyzeButton.disabled = false;
            analyzeButton.innerHTML = '<i class="fas fa-play"></i> Run Analysis';
        }
    } catch (error) {
        console.error("Analysis failed:", error);
        alert("An error occurred while running the analysis. Please try again.");
        
        // Reset button on error
        const analyzeButton = document.getElementById('analyzeButton');
        if (analyzeButton) {
            analyzeButton.disabled = false;
            analyzeButton.innerHTML = '<i class="fas fa-play"></i> Run Analysis';
        }
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Content Loaded - Setting up event listeners");
    const analyzeButton = document.getElementById('analyzeButton');
    
    if (analyzeButton) {
        console.log("Analyze button found - adding click listener");
        analyzeButton.addEventListener('click', runAnalysis);
    } else {
        console.error("Analyze button not found in the DOM");
    }
    
    // Verify MLBAnalyticsEngine is available
    if (window.MLBAnalyticsEngine) {
        console.log("MLBAnalyticsEngine is available");
    } else {
        console.error("MLBAnalyticsEngine not found - analysis functionality may not work");
    }
});

// UI update function
function updatePlayerProps(props) {
    const propsContainer = document.getElementById('playerProps');
    
    // Log incoming props
    console.log('Received props for categorization:', props);

    // Initialize categorized props
    const categorizedProps = {
        hitting: [],
        pitching: [],
        streaks: [],
        situational: []
    };

    // Categorize each prop
    props.forEach(prop => {
        // Detailed logging of each prop
        console.log('Processing prop:', {
            type: prop.betType,
            player: prop.player,
            category: prop.category,
            position: prop.position
        });

        // Check for pitching props first
        if (prop.betType?.toLowerCase().includes('pitcher') ||
            prop.betType?.toLowerCase().includes('strikeout') ||
            prop.betType?.toLowerCase().includes('quality_start') ||
            prop.betType?.toLowerCase().includes('innings') ||
            prop.category?.toLowerCase() === 'pitching' ||
            prop.position === 'P' ||
            prop.player?.toLowerCase().includes('pitcher')) {
            console.log(`Categorized as pitching: ${prop.player || prop.betType}`);
            categorizedProps.pitching.push(prop);
            return;
        }

        // Check for hitting props
        if (prop.betType?.toLowerCase().includes('hits') ||
            prop.betType?.toLowerCase().includes('hr') ||
            prop.betType?.toLowerCase().includes('rbi') ||
            prop.betType?.toLowerCase().includes('bases') ||
            prop.betType?.toLowerCase().includes('runs') ||
            prop.category?.toLowerCase() === 'hitting' ||
            prop.betType?.toLowerCase().includes('player')) {
            console.log(`Categorized as hitting: ${prop.player || prop.betType}`);
            categorizedProps.hitting.push(prop);
            return;
        }

        // Check for streaks
        if (prop.propFactor === 'hot_streak' ||
            (prop.player && window.MLBAnalyticsEngine?.prototype?.playerDatabase?.[prop.player]?.hotStreak)) {
            console.log(`Categorized as streak: ${prop.player || prop.betType}`);
            categorizedProps.streaks.push(prop);
            return;
        }

        // Check for situational props
        if (prop.venueFactor || prop.weatherFactor ||
            (prop.propFactor && prop.propFactor !== 'hot_streak') ||
            (prop.reason && (
                prop.reason.includes('Coors Field') ||
                prop.reason.includes('Yankee Stadium') ||
                prop.reason.includes('Fenway Park') ||
                prop.reason.includes('temperature') ||
                prop.reason.includes('wind') ||
                prop.reason.includes('humidity')
            ))) {
            console.log(`Categorized as situational: ${prop.player || prop.betType}`);
            categorizedProps.situational.push(prop);
            return;
        }
    });

    // Log categorization results
    Object.entries(categorizedProps).forEach(([category, categoryProps]) => {
        console.log(`${category} props count:`, categoryProps.length);
    });

    // Update the DOM with categorized props
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
