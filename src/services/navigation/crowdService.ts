
export interface CrowdMetrics {
    crowdLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'OVERFLOW';
    density: number;
    parkingSlots: number;
    waitTime: string;
    bestVisitTime: string;
    description: string;
    tamil_description: string;
}

export class CrowdService {
    /**
     * Calculates advanced crowd metrics based on multi-source data
     */
    static getMetrics(spotId: string, baseData: any): CrowdMetrics {
        // Simulation logic using input factors
        const ePassCount = baseData.factors?.passes || Math.floor(Math.random() * 500);
        const parkingBooked = baseData.factors?.parking || Math.floor(Math.random() * 100);

        let density = Math.min(100, (ePassCount / 1000) * 100 + (parkingBooked / 2));

        // Manual override for specific spots if parking is full
        if (parkingBooked > 95) density = Math.max(90, density);

        let crowdLevel: CrowdMetrics['crowdLevel'] = 'LOW';
        if (density > 85) crowdLevel = 'OVERFLOW';
        else if (density > 65) crowdLevel = 'HIGH';
        else if (density > 35) crowdLevel = 'MEDIUM';

        const waitTime = crowdLevel === 'OVERFLOW' ? '45-60 min' :
            crowdLevel === 'HIGH' ? '20-30 min' :
                crowdLevel === 'MEDIUM' ? '10 min' : 'No wait';

        return {
            crowdLevel,
            density: Math.round(density),
            parkingSlots: Math.max(0, 100 - parkingBooked),
            waitTime,
            bestVisitTime: "7:30 AM or 4:30 PM",
            description: this.getReason(crowdLevel, density),
            tamil_description: this.getTamilReason(crowdLevel, density)
        };
    }

    private static getReason(level: string, density: number): string {
        if (level === 'OVERFLOW') return "Current e-pass scans indicate heavy congestion.";
        if (level === 'HIGH') return "Moderate peak observed. Consider nearby alternates.";
        return "Smooth flow. Ideal for photography.";
    }

    private static getTamilReason(level: string, density: number): string {
        if (level === 'OVERFLOW') return "தற்போது அதிக கூட்டம் காணப்படுகிறது.";
        if (level === 'HIGH') return "மிதமான கூட்டம். மற்ற இடங்களை பரிசீலிக்கவும்.";
        return "குறைவான கூட்டம். தாராளமாக ரசிக்கலாம்.";
    }
}
