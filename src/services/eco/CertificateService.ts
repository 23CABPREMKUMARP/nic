import { jsPDF } from 'jspdf';
import { prisma } from '@/lib/prisma';

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

    static async generatePDF(cert: EcoCertificate): Promise<Uint8Array> {
        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });

        // Nile Forest Green Theme
        doc.setFillColor(46, 125, 50); // Emerald 700
        doc.rect(0, 0, 297, 210, 'F');

        // Inner Border
        doc.setDrawColor(255, 255, 255);
        doc.setLineWidth(1);
        doc.rect(10, 10, 277, 190);

        // Header
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(40);
        doc.setFont('helvetica', 'bold');
        doc.text('ECO-TRAVELLER CERTIFICATE', 148.5, 50, { align: 'center' });

        doc.setFontSize(16);
        doc.setFont('helvetica', 'normal');
        doc.text('NILGIRI SMART TOURISM INITIATIVE', 148.5, 60, { align: 'center' });

        // Body
        doc.setFontSize(24);
        doc.text('This is to certify that', 148.5, 90, { align: 'center' });

        doc.setFontSize(36);
        doc.setFont('helvetica', 'italic');
        doc.text(cert.userName.toUpperCase(), 148.5, 110, { align: 'center' });

        doc.setFontSize(18);
        doc.setFont('helvetica', 'normal');
        doc.text(`has successfully completed sustainable travel milestones in Ooty`, 148.5, 125, { align: 'center' });
        doc.text(`earning a total of ${cert.points} ECO POINTS.`, 148.5, 135, { align: 'center' });

        // Footer details
        doc.setFontSize(12);
        doc.text(`Level: ${cert.level}`, 50, 170);
        doc.text(`Date: ${cert.issuedDate}`, 50, 180);
        doc.text(`Tree ID: ${cert.plantId}`, 50, 190);

        doc.text(`Certificate ID: ${cert.id}`, 247, 190, { align: 'right' });

        // Branding
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('OOTY ECO-PRIDE', 148.5, 175, { align: 'center' });

        return new Uint8Array(doc.output('arraybuffer'));
    }
}
