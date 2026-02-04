
export interface CrowdBrain {
    id: string;
    currentDensity: number;
    predictedDensity30m: number;
    trend: 'RISING' | 'FALLING' | 'STABLE';
    recommendation: string;
    tamil_recommendation: string;
}

export class CrowdPredictor {
    /**
     * Simulates predictive analysis using e-pass counts and historical patterns
     */
    static async predict(spotId: string, currentData: any): Promise<CrowdBrain> {
        const pastHourIncrease = currentData.factors?.passes || 0;
        const parkingFull = currentData.factors?.parking > 90;

        let trend: 'RISING' | 'FALLING' | 'STABLE' = 'STABLE';
        if (pastHourIncrease > 60) trend = 'RISING';
        if (pastHourIncrease < 30) trend = 'FALLING';

        const predicted = trend === 'RISING' ? currentData.crowdScore + 15 : currentData.crowdScore - 5;

        let recommendation = "Ideal time to visit.";
        let tamil_rec = "வருகை தருவதற்கு ஏற்ற நேரம்.";

        if (predicted > 85 || parkingFull) {
            recommendation = "Crowd surge predicted. Suggest alternate spot.";
            tamil_rec = "அதிக கூட்டம் எதிர்பார்க்கப்படுகிறது. மாற்று இடத்திற்கு செல்லவும்.";
        } else if (predicted > 60) {
            recommendation = "Moderate traffic. Expect 15m delay.";
            tamil_rec = "மிதமான போக்குவரத்து. 15 நிமிடம் தாமதம் ஏற்படலாம்.";
        }

        return {
            id: spotId,
            currentDensity: currentData.crowdScore,
            predictedDensity30m: Math.min(100, predicted),
            trend,
            recommendation,
            tamil_recommendation: tamil_rec
        };
    }

    static getBetterAlternate(spotId: string, allSpots: any[]) {
        // Simple logic: return the closest spot with < 50% density
        return allSpots
            .filter(s => s.id !== spotId && s.crowdScore < 50)
            .sort((a, b) => a.crowdScore - b.crowdScore)[0];
    }
}
