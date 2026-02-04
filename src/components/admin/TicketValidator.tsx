
import React, { useState } from 'react';
import { UnifiedDashboard } from './UnifiedDashboard';
import { OfflineTicketForm } from './OfflineTicketForm';
import { LayoutDashboard, Ticket, FileText } from 'lucide-react';

export const TicketValidator: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'ENTRY'>('DASHBOARD');
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    return (
        <div className="space-y-6">
            {/* Header Tabs */}
            <div className="flex bg-white rounded-xl p-1 shadow-sm border border-slate-200 w-fit">
                <button
                    onClick={() => setActiveTab('DASHBOARD')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition ${activeTab === 'DASHBOARD' ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <LayoutDashboard size={16} />
                    Unified Data
                </button>
                <button
                    onClick={() => setActiveTab('ENTRY')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition ${activeTab === 'ENTRY' ? 'bg-purple-50 text-purple-700' : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <Ticket size={16} />
                    Offline Entry
                </button>
            </div>

            {/* Content Area */}
            {activeTab === 'DASHBOARD' ? (
                <UnifiedDashboard key={refreshTrigger} />
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1">
                        <OfflineTicketForm onSuccess={() => setRefreshTrigger(p => p + 1)} />
                    </div>
                    <div className="lg:col-span-2">
                        {/* We can re-use the dashboard in read-only mode, or show specific ticket list */}
                        <UnifiedDashboard key={refreshTrigger + 1} />
                    </div>
                </div>
            )}
        </div>
    );
};
