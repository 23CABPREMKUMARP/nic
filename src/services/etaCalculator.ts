
export interface ETAResult {
    durationMinutes: number;
    distanceKm: number;
    delayMinutes: number;
    confidence: number;
}

export class ETACalculator {
    private static TERRAIN_FACTOR = 1.4; // Nilgiri hills slow down travel
    private static BASE_SPEED = 40; // km/h

    /**
     * Calculates live ETA based on distance, traffic density, and terrain
     */
    static calculate(
        distanceMeters: number,
        trafficStatus: 'SMOOTH' | 'MODERATE' | 'HEAVY' | 'BLOCKED',
        weatherCode: number
    ): ETAResult {
        const distanceKm = distanceMeters / 1000;

        // 1. Base Duration
        let durationMinutes = (distanceKm / this.BASE_SPEED) * 60;

        // 2. Add Hill Terrain Overhead
        durationMinutes *= this.TERRAIN_FACTOR;

        // 3. Add Traffic Delay
        let delay = 0;
        if (trafficStatus === 'HEAVY') delay = durationMinutes * 0.8;
        else if (trafficStatus === 'MODERATE') delay = durationMinutes * 0.3;
        else if (trafficStatus === 'BLOCKED') delay = 999;

        // 4. Add Weather Delay (Fog/Rain)
        if (weatherCode >= 51) delay += (durationMinutes * 0.2); // Rain
        if (weatherCode >= 45 && weatherCode <= 48) delay += (durationMinutes * 0.4); // Fog

        return {
            durationMinutes: Math.round(durationMinutes + delay),
            distanceKm: parseFloat(distanceKm.toFixed(2)),
            delayMinutes: Math.round(delay),
            confidence: trafficStatus === 'SMOOTH' ? 0.95 : 0.7
        };
    }
}
