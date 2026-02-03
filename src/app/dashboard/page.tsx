import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Plus, Ticket, Calendar, Car } from "lucide-react";
import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function Dashboard() {
    const user = await currentUser();

    if (!user) {
        redirect('/');
    }

    const passes = await prisma.pass.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
    });

    return (
        <>
            <Navbar />
            <div className="pt-24 px-6 max-w-7xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-white">Dashboard</h1>
                    <Link href="/apply">
                        <Button variant="primary">
                            <Plus className="w-4 h-4 mr-2" /> Apply New Pass
                        </Button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* My Passes Sections - Spans 2 cols if needed, or just takes one slot but vertically grows */}
                    <div className="glass-card p-6 min-h-[200px] md:col-span-2 flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h2 className="text-xl font-bold text-white">My E-Passes</h2>
                                <p className="text-white/60 text-sm">View and manage your entry passes.</p>
                            </div>
                        </div>

                        <div className="space-y-3 mt-2">
                            {passes.length === 0 ? (
                                <div className="p-8 border border-dashed border-white/20 rounded-lg text-center text-white/40">
                                    No active passes found. apply for one!
                                </div>
                            ) : (
                                passes.map(pass => (
                                    <Link key={pass.id} href={`/pass/${pass.id}`}>
                                        <div className="bg-white/5 border border-white/10 p-4 rounded-lg flex items-center justify-between hover:bg-white/10 transition-colors group">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-3 rounded-full ${pass.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                                    <Ticket size={24} />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-white group-hover:text-green-400 transition-colors">{pass.vehicleNo}</h3>
                                                    <div className="flex items-center gap-3 text-xs text-white/60 mt-1">
                                                        <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(pass.visitDate).toLocaleDateString()}</span>
                                                        <span className="flex items-center gap-1"><Car size={12} /> {pass.vehicleType}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${pass.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' :
                                                        pass.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' :
                                                            'bg-white/10 text-white/60'
                                                    }`}>
                                                    {pass.status}
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="glass-card p-6">
                            <h2 className="text-xl font-bold mb-2">Parking Status</h2>
                            <p className="text-white/60 text-sm">Real-time availability.</p>
                            <div className="mt-4">
                                <div className="flex justify-between items-center py-2 border-b border-white/10">
                                    <span>Ooty Lake</span>
                                    <span className="text-green-400">Available</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-white/10">
                                    <span>Doddabetta</span>
                                    <span className="text-red-400">Full</span>
                                </div>
                            </div>
                        </div>

                        <div className="glass-card p-6">
                            <h2 className="text-xl font-bold mb-2">Notifications</h2>
                            <div className="mt-4 space-y-2">
                                <div className="bg-yellow-500/10 p-2 rounded border border-yellow-500/20 text-xs text-yellow-200">
                                    Traffic alert near Coonoor.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
