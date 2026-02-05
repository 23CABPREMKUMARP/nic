
import { NextResponse } from 'next/server';
import { CertificateService } from '@/services/eco/CertificateService';
import { currentUser } from '@clerk/nextjs/server';

export async function GET(request: Request) {
    try {
        const user = await currentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const points = parseInt(searchParams.get('points') || '0');
        const level = searchParams.get('level') || 'Green Explorer';

        const certData = CertificateService.generate(
            user.firstName + ' ' + (user.lastName || ''),
            points,
            level
        );

        const pdfBuffer = await CertificateService.generatePDF(certData);

        return new Response(Buffer.from(pdfBuffer), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="Eco-Certificate-${certData.id}.pdf"`
            }
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
