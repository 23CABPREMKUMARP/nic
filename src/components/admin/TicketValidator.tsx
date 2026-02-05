
import React, { useState } from 'react';
import { OfflineTicketForm } from './OfflineTicketForm';
import { TicketVerifier } from './TicketVerifier';
import { Ticket, Search, BarChart3 } from 'lucide-react';
import CrowdAnalysisPanel from '@/components/admin/CrowdAnalysisPanel';

export const TicketValidator: React.FC = () => {
    const [tab, setTab] = useState<'ISSUE' | 'VERIFY' | 'ANALYSIS'>('ISSUE');

    return (
        <div className="space-y-6">
            <div className="flex bg-slate-100 p-1 rounded-xl w-fit border border-slate-200">
                <button
                    onClick={() => setTab('ISSUE')}
                    className={`px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition ${tab === 'ISSUE' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                    <Ticket size={16} /> Issue Ticket
                </button>
                <button
                    onClick={() => setTab('VERIFY')}
                    className={`px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition ${tab === 'VERIFY' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                    <Search size={16} /> Verify Entry
                </button>
                <button
                    onClick={() => setTab('ANALYSIS')}
                    className={`px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition ${tab === 'ANALYSIS' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                    <BarChart3 size={16} /> Crowd Status
                </button>
            </div>

            <div className="max-w-4xl">
                {tab === 'ISSUE' ? (
                    <OfflineTicketForm onSuccess={() => { }} />
                ) : tab === 'VERIFY' ? (
                    <TicketVerifier />
                ) : (
                    <div className="relative h-[600px] w-full">
                        <CrowdAnalysisPanel onClose={() => setTab('ISSUE')} />
                    </div>
                )}
            </div>
        </div>
    );
};
