
import React, { useState } from 'react';
import { Search, CheckCircle, XCircle, Clock, MapPin, User, Car as CarIcon, Loader2 } from 'lucide-react';

export const TicketVerifier: React.FC = () => {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [ticket, setTicket] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setError(null);
        setTicket(null);

        try {
            const res = await fetch(`/api/admin/offline-ticket?query=${encodeURIComponent(query)}`);
            const data = await res.json();

            if (data.ticket) {
                setTicket(data.ticket);
            } else {
                setError("No ticket found for this vehicle or ID.");
            }
        } catch (err) {
            setError("Failed to verify ticket. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleExit = async () => {
        if (!ticket) return;
        setLoading(true);
        try {
            const res = await fetch('/api/admin/offline-ticket', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: ticket.id, source: ticket.source })
            });
            const data = await res.json();
            if (data.success) {
                setTicket(data.ticket);
            } else {
                setError(data.error || "Failed to mark exit.");
            }
        } catch (err) {
            setError("Error updating status.");
        } finally {
            setLoading(false);
        }
    };

    const isExited = (status: string) => status === 'EXITED' || status === 'COMPLETED';
    const isActive = (status: string) => status === 'ACTIVE' || status === 'BOOKED' || status === 'ARRIVED';

    const getStatusColor = (status: string) => {
        if (isActive(status)) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
        if (isExited(status)) return 'text-slate-500 bg-slate-50 border-slate-100';
        return 'text-rose-600 bg-rose-50 border-rose-100';
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span className="bg-blue-100 p-1.5 rounded-lg text-blue-600"><Search size={20} /></span>
                Verify Ticket Entry
            </h3>

            <form onSubmit={handleSearch} className="flex gap-2 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Enter Vehicle No or Ticket ID"
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase font-mono"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-slate-800 hover:bg-slate-900 text-white px-6 py-2 rounded-lg font-bold transition disabled:opacity-50"
                >
                    {loading ? <Loader2 className="animate-spin" /> : 'Search'}
                </button>
            </form>

            {error && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-sm flex items-center gap-3">
                    <XCircle size={20} />
                    {error}
                </div>
            )}

            {ticket && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className={`p-4 rounded-xl border mb-4 flex items-center justify-between ${getStatusColor(ticket.status)}`}>
                        <div className="flex items-center gap-3">
                            {isActive(ticket.status) ? <CheckCircle size={24} /> : <Clock size={24} />}
                            <div>
                                <div className="flex items-center gap-2">
                                    <p className="font-bold text-lg">{ticket.status}</p>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-black uppercase tracking-tighter ${ticket.source === 'ONLINE' ? 'bg-blue-200 text-blue-800' : 'bg-purple-200 text-purple-800'}`}>
                                        {ticket.source}
                                    </span>
                                    {ticket.source === 'ONLINE' && (
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-black uppercase tracking-tighter ${ticket.paymentStatus === 'COMPLETED' ? 'bg-green-200 text-green-800' : 'bg-amber-200 text-amber-800'}`}>
                                            {ticket.paymentStatus}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs opacity-80 uppercase font-black tracking-widest">{ticket.id}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs opacity-70">Issued</p>
                            <p className="font-mono text-xs">{new Date(ticket.createdAt).toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <p className="text-[10px] uppercase font-black text-slate-400 mb-1 flex items-center gap-1">
                                    <CarIcon size={12} /> Vehicle Number
                                </p>
                                <p className="font-mono font-bold text-slate-700">{ticket.vehicleNo}</p>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <p className="text-[10px] uppercase font-black text-slate-400 mb-1 flex items-center gap-1">
                                    <User size={12} /> {ticket.source === 'ONLINE' ? 'QR Code' : 'Driver'}
                                </p>
                                <p className="font-bold text-slate-700">{ticket.source === 'ONLINE' ? ticket.qrCode : ticket.name}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <p className="text-[10px] uppercase font-black text-slate-400 mb-1 flex items-center gap-1">
                                    <MapPin size={12} /> {ticket.source === 'ONLINE' ? 'Parking Location' : 'Spot Location'}
                                </p>
                                <p className="font-bold text-slate-700">{ticket.spotId}</p>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <p className="text-[10px] uppercase font-black text-slate-400 mb-1 flex items-center gap-1">
                                    <Clock size={12} /> {ticket.source === 'ONLINE' ? 'Valid Until' : 'Members'}
                                </p>
                                <p className="font-bold text-slate-700">
                                    {ticket.source === 'ONLINE'
                                        ? new Date(ticket.endTime).toLocaleTimeString()
                                        : `${ticket.members} Person(s)`
                                    }
                                </p>
                            </div>
                        </div>

                        {isActive(ticket.status) && (
                            <button
                                onClick={handleExit}
                                disabled={loading}
                                className={`w-full py-3 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50 ${ticket.source === 'ONLINE' && ticket.paymentStatus === 'PENDING'
                                    ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-200'
                                    : 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
                                    }`}
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin mx-auto" />
                                ) : (
                                    ticket.source === 'ONLINE' && ticket.paymentStatus === 'PENDING'
                                        ? `Collect ₹${ticket.amount} & Mark Exit`
                                        : 'Mark Exit & Release Slot'
                                )}
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
