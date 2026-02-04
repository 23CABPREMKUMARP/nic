
export interface CrowdBrain {
    id: string;
    currentDensity: number;
    predictedDensityNextHour: number;
    trend: 'RISING' | 'FALLING' | 'STABLE';
    recommendation: string;
    tamil_recommendation: string;
    bestAlternativeId?: string;
}

export class CrowdPredictor {
    static async predict(spotId: string, currentData: any): Promise<CrowdBrain> {
        // Multi-weighted prediction algorithm
        const hour = new Date().getHours();
        const baseDensity = currentData.metrics?.density || 50;

        // Time-based multipliers
        let multiplier = 1.0;
        if (hour >= 10 && hour <= 13) multiplier = 1.4; // Morning rush
        if (hour >= 16 && hour <= 18) multiplier = 1.2; // Sunset rush

        const predicted = Math.min(100, baseDensity * multiplier);
        const trend = predicted > baseDensity ? 'RISING' : predicted < baseDensity ? 'FALLING' : 'STABLE';

        return {
            id: spotId,
            currentDensity: baseDensity,
            predictedDensityNextHour: Math.round(predicted),
            trend,
            recommendation: this.generateRecommendation(trend, predicted, spotId),
            tamil_recommendation: this.generateTamilRecommendation(trend, predicted, spotId),
            bestAlternativeId: predicted > 80 ? 'tea-factory' : undefined
        };
    }

    private static generateRecommendation(trend: string, density: number, id: string): string {
        if (density > 85) return "Critical congestion! We suggest redirecting to the Tea Factory for a calm experience.";
        if (trend === 'RISING' && density > 60) return "Crowd is growing fast. Arrive in the next 15 mins or pick another spot.";
        return "Ideal time to visit. Great for clear photos.";
    }

    private static generateTamilRecommendation(trend: string, density: number, id: string): string {
        if (density > 85) return "அதிக கூட்டம்! அமைதியான அனுபவத்திற்கு தேயிலை தொழிற்சாலைக்கு செல்லுமாறு பரிந்துரைக்கிறோம்.";
        if (trend === 'RISING' && density > 60) return "கூட்டம் வேகமாக அதிகரித்து வருகிறது. அடுத்த 15 நிமிடங்களுக்குள் செல்லவும்.";
        return "சரியான நேரம். புகைப்படங்கள் எடுக்க மிகச்சிறந்தது.";
    }
}
