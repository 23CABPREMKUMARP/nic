'use client';

import Link from "next/link";
import { Ticket, Calendar, Car } from "lucide-react";
import { motion } from "framer-motion";

export default function DashboardList({ passes }: { passes: any[] }) {
    if (passes.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-12 border-2 border-dashed border-gray-200 rounded-xl text-center"
            >
                <div className="text-gray-400 mb-2">No active passes found</div>
                <Link href="/apply">
                    <button className="text-green-700 border border-green-200 hover:bg-green-50 px-4 py-2 rounded-md transition-colors">Apply Now</button>
                </Link>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={{
                hidden: { opacity: 0 },
                visible: {
                    opacity: 1,
                    transition: {
                        staggerChildren: 0.1
                    }
                }
            }}
            className="space-y-3"
        >
            {passes.map(pass => (
                <Link key={pass.id} href={`/pass/${pass.id}`}>
                    <motion.div
                        variants={{
                            hidden: { opacity: 0, x: -20 },
                            visible: { opacity: 1, x: 0 }
                        }}
                        whileHover={{ scale: 1.01, backgroundColor: "#ffffff" }}
                        className="bg-gray-50 border border-gray-200 p-4 rounded-xl flex items-center justify-between hover:shadow-md transition-all group cursor-pointer"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-full ${pass.status === 'ACTIVE' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                                <Ticket size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 group-hover:text-green-700 transition-colors uppercase font-mono tracking-wide">{pass.vehicleNo}</h3>
                                <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                                    <span className="flex items-center gap-1"><Calendar size={14} className="text-gray-400" /> {new Date(pass.visitDate).toLocaleDateString('en-GB')}</span>
                                    <span className="flex items-center gap-1"><Car size={14} className="text-gray-400" /> {pass.vehicleType}</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${pass.status === 'ACTIVE' ? 'bg-green-100 text-green-700 border border-green-200' :
                                pass.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                                    'bg-gray-100 text-gray-600 border border-gray-200'
                                }`}>
                                {pass.status}
                            </span>
                        </div>
                    </motion.div>
                </Link>
            ))}
        </motion.div>
    );
}
