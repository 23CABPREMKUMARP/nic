'use client';

import Navbar from "@/components/Navbar";
import { TicketValidator } from "@/components/admin/TicketValidator";
import { Ticket, ShieldCheck, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function ValidatorPage() {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />
            <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="pt-24 px-6 pb-12 w-full max-w-5xl mx-auto"
            >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <Link href="/admin" className="text-slate-500 hover:text-purple-600 flex items-center gap-1 text-sm font-bold mb-2 transition-colors">
                            <ArrowLeft size={16} /> Back to Admin
                        </Link>
                        <motion.h1 layout className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                            <div className="bg-purple-600 p-2 rounded-xl text-white shadow-lg shadow-purple-200">
                                <Ticket />
                            </div>
                            Offline Ticket Validator
                        </motion.h1>
                        <p className="text-slate-500 mt-2 text-sm font-medium">Issue and verify physical tickets for walk-in tourists and staff.</p>
                    </div>

                    <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-full text-emerald-700 text-xs font-bold">
                        <ShieldCheck size={14} /> Security Active
                    </div>
                </div>

                <motion.div
                    variants={itemVariants}
                    className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl p-8 border border-slate-200"
                >
                    <TicketValidator />
                </motion.div>

                <motion.div variants={itemVariants} className="mt-8 p-6 bg-purple-50 rounded-2xl border border-purple-100">
                    <h3 className="text-purple-900 font-bold mb-2 flex items-center gap-2">
                        💡 Usage Tip
                    </h3>
                    <p className="text-purple-700 text-sm leading-relaxed">
                        Use the <strong>Issue Ticket</strong> tab for walk-in visitors who haven't generated an E-Pass online. Use the <strong>Verify Entry</strong> tab to search by Vehicle Number and record entries or exits manually.
                    </p>
                </motion.div>
            </motion.div>
        </div>
    );
}
