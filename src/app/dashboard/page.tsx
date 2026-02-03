import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Plus, Ticket, Calendar, Car } from "lucide-react";
import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import DashboardList from "@/components/DashboardList";
import { DashboardCardAnimator } from "@/components/DashboardAnimator";

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
            <div className="pt-24 px-6 max-w-7xl mx-auto space-y-8 pb-12">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white drop-shadow-md">Dashboard</h1>
                        <p className="text-white/80 drop-shadow-sm">Welcome back, {user.firstName || 'Traveler'}</p>
                    </div>

                    <Link href="/apply">
                        <Button className="bg-white text-green-800 hover:bg-green-50 font-bold shadow-lg">
                            <Plus className="w-4 h-4 mr-2" /> Apply New Pass
                        </Button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* My Passes Sections */}
                    <DashboardCardAnimator className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-6 min-h-[200px] md:col-span-2 flex flex-col border border-white/20">
                        <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">My E-Passes</h2>
                                <p className="text-gray-500 text-sm">View and manage your entry passes.</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <DashboardList passes={passes} />
                        </div>
                    </DashboardCardAnimator>

                    <div className="space-y-6">
                        <DashboardCardAnimator delay={0.2} className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-white/20">
                            <h2 className="text-xl font-bold text-gray-900 mb-2">Parking Status</h2>
                            <p className="text-gray-500 text-sm mb-4">Real-time availability.</p>
                            <div className="space-y-1">
                                <div className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 px-2 rounded -mx-2">
                                    <span className="text-gray-700 font-medium">Ooty Lake</span>
                                    <span className="text-green-600 text-sm font-bold bg-green-50 px-2 py-1 rounded">Available</span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 px-2 rounded -mx-2">
                                    <span className="text-gray-700 font-medium">Doddabetta</span>
                                    <span className="text-red-500 text-sm font-bold bg-red-50 px-2 py-1 rounded">Full</span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 px-2 rounded -mx-2">
                                    <span className="text-gray-700 font-medium">Rose Garden</span>
                                    <span className="text-green-600 text-sm font-bold bg-green-50 px-2 py-1 rounded">Available</span>
                                </div>
                            </div>
                            <Link href="/parking">
                                <Button className="w-full mt-4 bg-gray-900 hover:bg-black text-white">Book Parking</Button>
                            </Link>
                        </DashboardCardAnimator>

                        <DashboardCardAnimator delay={0.4} className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-white/20">
                            <h2 className="text-xl font-bold text-gray-900 mb-2">Notifications</h2>
                            <div className="mt-4 space-y-3">
                                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 flex gap-3 items-start">
                                    <span className="text-yellow-600 mt-0.5">⚠️</span>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">Traffic Alert</p>
                                        <p className="text-xs text-gray-600 mt-1">Heavy congestion near Coonoor Sims Park due to flower show.</p>
                                    </div>
                                </div>
                            </div>
                        </DashboardCardAnimator>
                    </div>
                </div>
            </div>
        </>
    )
}
