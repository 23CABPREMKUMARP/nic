
/**
 * Certificate Service
 * Generates digital certificates for eco-conscious tourists
 */

export interface EcoCertificate {
    id: string;
    userName: string;
    level: string;
    points: number;
    plantId: string;
    issuedDate: string;
    qrData: string;
}

export class CertificateService {
    static generate(userName: string, points: number, level: string): EcoCertificate {
        const id = `CERT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const plantId = `NLG-TREE-${Math.floor(Math.random() * 10000)}`;

        return {
            id,
            userName,
            level,
            points,
            plantId,
            issuedDate: new Date().toLocaleDateString(),
            qrData: `https://nic-lake.vercel.app/verify/eco/${id}`
        };
    }
}
