
import React, { useState } from 'react';
import { Truck, Car, Bike, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { OOTY_SPOTS } from '@/data/ootyMapData';

export const OfflineTicketForm: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
    const [form, setForm] = useState({
        vehicleNo: '',
        name: '',
        mobile: '',
        members: 1,
        vehicleType: 'CAR',
        spotId: OOTY_SPOTS[0]?.id || '',
        type: 'OFFLINE_PAID'
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const res = await fetch('/api/admin/offline-ticket', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error?.message || data.error || 'Failed to create ticket');

            setMessage({ type: 'success', text: `Ticket created! ID: ${data.ticket.id}` });
            setForm(prev => ({ ...prev, vehicleNo: '', name: '' })); // Reset key fields
            onSuccess(); // Trigger refresh on parent

            // Clear success message after 3s
            setTimeout(() => setMessage(null), 3000);

        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span className="bg-purple-100 p-1.5 rounded-lg text-purple-600"><Car size={20} /></span>
                Offline Ticket Entry
            </h3>

            {message && (
                <div className={`p-3 rounded-lg text-sm mb-4 flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}>
                    {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Vehicle No */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Vehicle Number</label>
                        <input
                            type="text"
                            required
                            placeholder="TN 43 AZ 1234"
                            className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none uppercase"
                            value={form.vehicleNo}
                            onChange={e => setForm({ ...form, vehicleNo: e.target.value.toUpperCase() })}
                        />
                    </div>

                    {/* Spot Selection */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Parking Location</label>
                        <select
                            className="w-full p-2 border border-slate-200 rounded-lg outline-none"
                            value={form.spotId}
                            onChange={e => setForm({ ...form, spotId: e.target.value })}
                        >
                            {OOTY_SPOTS.map(spot => (
                                <option key={spot.id} value={spot.id}>{spot.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Name */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Driver Name</label>
                        <input
                            type="text"
                            required
                            className="w-full p-2 border border-slate-200 rounded-lg outline-none"
                            value={form.name}
                            onChange={e => setForm({ ...form, name: e.target.value })}
                        />
                    </div>
                    {/* Members */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Members</label>
                        <input
                            type="number"
                            min="1"
                            className="w-full p-2 border border-slate-200 rounded-lg outline-none"
                            value={form.members}
                            onChange={e => setForm({ ...form, members: parseInt(e.target.value) })}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Vehicle Type */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Vehicle Type</label>
                        <div className="flex gap-2">
                            {['CAR', 'BUS', 'BIKE'].map(type => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setForm({ ...form, vehicleType: type })}
                                    className={`flex-1 py-2 text-xs font-bold rounded-lg border transition ${form.vehicleType === type
                                            ? 'bg-slate-800 text-white border-slate-800'
                                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                        }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* Category */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Ticket Class</label>
                        <select
                            className="w-full p-2 border border-slate-200 rounded-lg outline-none"
                            value={form.type}
                            onChange={e => setForm({ ...form, type: e.target.value })}
                        >
                            <option value="OFFLINE_PAID">Paid Ticket</option>
                            <option value="GOVT_PASS">Govt Pass</option>
                            <option value="EMERGENCY">Emergency</option>
                            <option value="STAFF">Staff</option>
                        </select>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg shadow-purple-200 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    {loading ? <Loader2 className="animate-spin" /> : 'Issue Ticket'}
                </button>
            </form>
        </div>
    );
};
