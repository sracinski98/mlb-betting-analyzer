// Store chart instances globally
let confidenceChartInstance = null;
let distributionChartInstance = null;

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
    const engine = new window.MLBAnalyticsEngine();
    
    try {
        const result = await engine.runComprehensiveAnalysis();
        console.log("Analysis complete:", result);
        updateUI(result);
    } catch (error) {
        console.log("Analysis failed:", error);
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    const analyzeButton = document.getElementById('analyzeButton');
    if (analyzeButton) {
        analyzeButton.addEventListener('click', runAnalysis);
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
