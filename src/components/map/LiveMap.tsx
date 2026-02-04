'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const LiveMapComponent = dynamic(
    () => import('./LiveMapComponent'),
    {
        loading: () => (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-xl">
                <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                <span className="ml-2 text-gray-400">Loading Map...</span>
            </div>
        ),
        ssr: false
    }
);

export default function LiveMap() {
    return (
        <div className="w-full h-[500px] md:h-[600px] rounded-xl overflow-hidden shadow-lg border border-gray-200 relative z-0">
            <LiveMapComponent />
        </div>
    );
}
