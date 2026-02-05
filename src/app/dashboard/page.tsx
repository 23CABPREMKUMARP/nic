import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Plus, Navigation } from "lucide-react";
import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { DashboardCardAnimator } from "@/components/DashboardAnimator";
import ActivePassDisplay from "@/components/ActivePassDisplay";
import { TrafficEngine } from '@/services/traffic/trafficEngine';
import { CrowdAnalyzer } from '@/services/analytics/crowdAnalyzer';
import { EcoStoreService } from '@/services/eco/EcoStoreService';
import { TrafficService } from "@/services/trafficService";
import { EcoStatusBadge } from "@/components/eco/EcoStatusBadge";


export default async function Dashboard() {
    const user = await currentUser();

    if (!user) {
        redirect('/');
    }

    // Fetch Active Pass with full details
    let activePass = null;
    try {
        const activePasses = await prisma.pass.findMany({
            where: {
                userId: user.id,
                status: { in: ['ACTIVE', 'USED', 'SUBMITTED', 'PENDING'] }
            },
            include: {
                parkingBookings: {
                    where: { status: { not: 'CANCELLED' } },
                    include: {
                        facility: {
                            include: { location: true }
                        }
                    }
                }
            },
            orderBy: { visitDate: 'desc' },
            take: 1
        });
        activePass = activePasses[0] || null;
    } catch (e) {
        console.error("Dashboard pass fetch failed:", e);
    }

    // Fetch dynamic stats for dashboard
    let parkingSpots: any[] = [];
    try {
        parkingSpots = await prisma.location.findMany({ where: { type: 'PARKING' }, take: 3 });
    } catch (e) {
        // Fallback or empty
    }
    const dynamicParking = await Promise.all(parkingSpots.map(async loc => {
        try {
            const congestion = await TrafficEngine.getCongestionScore(loc.id); // Use ID ideally, but trafficEngine uses ID. 
            // If loc.id is not in traffic engine map, it falls back? TrafficEngine expects ID.
            // OOTY_SPOTS IDs are like 'ooty-lake'. Location DB IDs are UUIDs.
            // We need to match by name if IDs don't match. 
            // TrafficEngine.getCongestionScore uses ID. If we don't have ID mapping, we might fail.
            // Let's use CrowdAnalyzer directly by name as backup or use TrafficEngine if we can match.

            // Safer: Use CrowdAnalyzer directly via TrafficEngine? 
            // Actually TrafficEngine.getCongestionScore expects an ID from OOTY_SPOTS.
            // Let's try to find the matching OOTY_SPOT by name.

            // Simplified: Just use the name for display and simulate level for now to be safe,
            // OR use the new CrowdAnalyzer.analyzeSpot(loc.name) which uses name.
            const analysis = await CrowdAnalyzer.analyzeSpot(loc.name);

            let level = 'SAFE';
            if (analysis.metrics.crowdLevel === 'CRITICAL' || analysis.metrics.crowdLevel === 'HIGH') level = 'OVERFLOW';
            else if (analysis.metrics.crowdLevel === 'MEDIUM') level = 'BUSY';

            return { name: loc.name, level };
        } catch {
            return { name: loc.name, level: 'SAFE' };
        }
    }));

    const alerts = [];
    try {
        const trafficLake = await TrafficService.estimateTraffic('Ooty Lake');
        if (trafficLake.status === 'HEAVY') {
            alerts.push({ title: 'Traffic Alert', msg: `Heavy congestion near Ooty Lake. Delay: +${trafficLake.delayMinutes} min.` });
        }
    } catch { } // Swallow errors

    try {
        const trafficGarden = await TrafficService.estimateTraffic('Botanical Garden');
        if (trafficGarden.status === 'HEAVY') {
            alerts.push({ title: 'Traffic Alert', msg: `Heavy congestion near Botanic Garden. Delay: +${trafficGarden.delayMinutes} min.` });
        }
    } catch { }

    // Fetch Eco Stats (Direct Service Call)
    const ecoStats = await EcoStoreService.getUserPoints(user.id);


    return (
        <>
            <Navbar />
            <div className="pt-24 px-6 max-w-7xl mx-auto space-y-8 pb-12 text-sans">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-5xl font-black text-white drop-shadow-lg tracking-tight italic">Dashboard</h1>
                        <p className="text-white/80 drop-shadow-sm font-medium mt-1">Welcome back, {user.firstName || 'Traveler'} • Nilgiris is waiting for you</p>
                    </div>

                    <div className="flex flex-wrap gap-4">
                        <Link href="/map">
                            <Button className="bg-blue-600 hover:bg-blue-500 text-white font-black py-6 px-8 rounded-2xl shadow-2xl transition-all active:scale-95 flex items-center gap-2 border border-blue-400/30">
                                <Navigation className="w-5 h-5" /> Live Map Status
                            </Button>
                        </Link>
                        <Link href="/apply">
                            <Button className="bg-white text-emerald-900 hover:bg-emerald-50 font-black py-6 px-8 rounded-2xl shadow-2xl transition-all active:scale-95">
                                <Plus className="w-5 h-5 mr-2" /> Apply New Pass
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Auto-Populated Active Pass Section */}
                    <div className="md:col-span-2 space-y-8">
                        <EcoStatusBadge points={ecoStats.totalPoints} level={ecoStats.level} badge={ecoStats.badge} />
                        <ActivePassDisplay initialPass={activePass} />
                    </div>


                    {/* Right Column: Status & Alerts */}
                    <div className="space-y-6">
                        <DashboardCardAnimator delay={0.2} className="bg-white/95 backdrop-blur-xl rounded-[32px] shadow-2xl p-8 border border-white/40">
                            <h2 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">Parking Status</h2>
                            <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-6">Live AI Estimates</p>
                            <div className="space-y-2">
                                {dynamicParking.map((p, i) => (
                                    <div key={i} className="flex justify-between items-center py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 px-3 rounded-2xl transition-colors">
                                        <span className="text-gray-700 font-bold">{p.name}</span>
                                        <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${p.level === 'SAFE' ? 'bg-emerald-100 text-emerald-600' : p.level === 'OVERFLOW' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                                            {p.level === 'SAFE' ? 'Available' : p.level === 'OVERFLOW' ? 'Full' : 'Busy'}
                                        </span>
                                    </div>
                                ))}
                                {dynamicParking.length === 0 && <p className="text-gray-400 text-sm">No parking data.</p>}
                            </div>
                            <Link href="/parking">
                                <Button className="w-full mt-6 bg-gray-900 border-2 border-transparent hover:border-gray-900 hover:bg-white hover:text-gray-900 text-white font-black py-4 rounded-xl transition-all active:scale-[0.98]">
                                    Book Parking
                                </Button>
                            </Link>
                        </DashboardCardAnimator>

                        <DashboardCardAnimator delay={0.4} className="bg-white/95 backdrop-blur-xl rounded-[32px] shadow-2xl p-8 border border-white/40">
                            <h2 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">Notifications</h2>
                            <div className="mt-6 space-y-4">
                                {alerts.map((a, i) => (
                                    <div key={i} className="bg-rose-50 p-5 rounded-2xl border border-rose-100 flex gap-4 items-start shadow-sm">
                                        <div className="w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center text-white shrink-0">
                                            <span className="text-xs">!</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-gray-900">{a.title}</p>
                                            <p className="text-xs text-gray-500 font-medium mt-1 leading-relaxed">{a.msg}</p>
                                        </div>
                                    </div>
                                ))}
                                {alerts.length === 0 && (
                                    <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100 flex gap-4 items-center shadow-sm">
                                        <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0">
                                            <span className="text-xs">✓</span>
                                        </div>
                                        <p className="text-xs text-emerald-700 font-bold italic">No active traffic issues.</p>
                                    </div>
                                )}
                            </div>
                        </DashboardCardAnimator>
                    </div>
                </div>
            </div>
        </>
    )
}
