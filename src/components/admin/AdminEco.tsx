
import React, { useState } from 'react';
import { TreePine, ShoppingBag, Award, Users, Search, Filter } from 'lucide-react';

export const AdminEco: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'PARTNERS' | 'SCORES' | 'PLANTS'>('PARTNERS');

    const partners = [
        { name: 'Nilgiri Tea Co.', type: 'Beverage', coupons: 124, status: 'Active' },
        { name: 'Ooty Home Made Chocolates', type: 'Sweets', coupons: 89, status: 'Active' },
        { name: 'Municipality Parking', type: 'Utility', coupons: 442, status: 'Pending' }
    ];

    return (
        <div className="space-y-6">
            {/* Nav Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-2xl w-fit border border-slate-200">
                <button
                    onClick={() => setActiveTab('PARTNERS')}
                    className={`px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition ${activeTab === 'PARTNERS' ? 'bg-white shadow-sm text-emerald-700' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <ShoppingBag size={18} /> Partners
                </button>
                <button
                    onClick={() => setActiveTab('SCORES')}
                    className={`px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition ${activeTab === 'SCORES' ? 'bg-white shadow-sm text-emerald-700' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Award size={18} /> Leaderboard
                </button>
                <button
                    onClick={() => setActiveTab('PLANTS')}
                    className={`px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition ${activeTab === 'PLANTS' ? 'bg-white shadow-sm text-emerald-700' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <TreePine size={18} /> Plant Registry
                </button>
            </div>

            <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-black text-slate-800 tracking-tight">
                            {activeTab === 'PARTNERS' ? 'Eco Reward Partners' : activeTab === 'SCORES' ? 'Top Eco Tourists' : 'Plant-a-Tree Registry'}
                        </h3>
                        <p className="text-slate-400 text-xs font-bold mt-1 uppercase tracking-widest">
                            Nilgiri Ecosystem Management
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
                            />
                        </div>
                        <button className="bg-emerald-600 text-white p-2 rounded-xl hover:bg-emerald-700 transition-colors">
                            <Filter size={18} />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-400">
                            <tr>
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest">Entity</th>
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest">Category</th>
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest">Analytics</th>
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {activeTab === 'PARTNERS' && partners.map((p, i) => (
                                <tr key={i} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 font-bold uppercase">
                                                {p.name[0]}
                                            </div>
                                            <span className="font-bold text-slate-800">{p.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className="text-sm font-medium text-slate-500">{p.type}</span>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-sm font-black text-emerald-600">{p.coupons}</span>
                                            <span className="text-[10px] text-slate-400 font-bold uppercase">Issued</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <button className="text-xs font-black uppercase text-emerald-600 tracking-wider hover:underline">Manage</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {activeTab !== 'PARTNERS' && (
                    <div className="p-20 text-center space-y-4">
                        <div className="w-20 h-20 bg-slate-50 rounded-[32px] flex items-center justify-center mx-auto text-slate-200">
                            <Users size={40} />
                        </div>
                        <p className="text-slate-400 font-bold text-sm italic">Connect database to view live {activeTab.toLowerCase()} data.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
