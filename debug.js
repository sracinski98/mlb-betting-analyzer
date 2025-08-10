// Simple syntax test for MLB Analytics
console.log("Testing MLB Analytics Engine...");

try {
    // Test basic class loading
    if (typeof MLBAnalyticsEngine !== 'undefined') {
        console.log("✅ MLBAnalyticsEngine class found");
        
        const engine = new MLBAnalyticsEngine();
        console.log("✅ Engine created successfully");
        
        // Test key methods
        if (typeof engine.getConfidenceFromScore === 'function') {
            const result = engine.getConfidenceFromScore(7.5);
            console.log("✅ getConfidenceFromScore works:", result);
        } else {
            console.log("❌ getConfidenceFromScore not found");
        }
        
        if (typeof engine.runComprehensiveAnalysis === 'function') {
            console.log("✅ runComprehensiveAnalysis method found");
        } else {
            console.log("❌ runComprehensiveAnalysis not found");
        }
        
    } else {
        console.log("❌ MLBAnalyticsEngine class not found");
    }
    
} catch (error) {
    console.error("❌ Error during testing:", error);
    console.error("Stack trace:", error.stack);
}
