'use client';

import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Download, Share2, MapPin } from "lucide-react";
import { motion } from "framer-motion";

export default function PassViewClient({ pass }: { pass: any }) {
    const [qrUrl, setQrUrl] = useState('');

    useEffect(() => {
        QRCode.toDataURL(pass.qrCode)
            .then(url => {
                setQrUrl(url);
            })
            .catch(err => {
                console.error(err);
            });
    }, [pass.qrCode]);

    return (
        <>
            <Navbar />
            <div className="min-h-screen pt-24 pb-12 px-6 flex items-center justify-center">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl relative"
                >
                    {/* Header */}
                    <div className="bg-[#0f3b28] p-6 text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('/bg.png')] bg-cover"></div>
                        <h1 className="text-white text-2xl font-bold relative z-10">Nilgiri E-Pass</h1>
                        <p className="text-white/60 text-sm relative z-10">Official Tourism Entry</p>
                    </div>

                    <div className="p-8 flex flex-col items-center">
                        {/* QR Code */}
                        <div className="w-48 h-48 bg-gray-100 rounded-xl p-2 mb-6 shadow-inner">
                            {qrUrl ? (
                                <img src={qrUrl} alt="QR Code" className="w-full h-full object-contain mix-blend-multiply" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">Loading QR...</div>
                            )}
                        </div>

                        {pass.status === 'PENDING' && (
                            <p className="text-center text-sm text-yellow-600 bg-yellow-50 px-4 py-2 rounded-full mb-6 font-semibold animate-pulse border border-yellow-200 shadow-sm">
                                🔔 Show to Gate Admin for Activation
                            </p>
                        )}

                        <div className="text-center mb-6">
                            <p className="text-gray-500 text-sm uppercase tracking-wider font-semibold">Vehicle Number</p>
                            <p className="text-3xl font-bold text-gray-800 font-mono">{pass.vehicleNo}</p>
                        </div>

                        <div className="w-full grid grid-cols-2 gap-4 border-t border-gray-100 pt-6">
                            <div>
                                <p className="text-gray-400 text-xs uppercase">Date</p>
                                <p className="font-semibold text-gray-700">{format(new Date(pass.visitDate), 'dd MMM yyyy')}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-gray-400 text-xs uppercase">Members</p>
                                <p className="font-semibold text-gray-700">{pass.membersCount} Persons</p>
                            </div>
                            <div>
                                <p className="text-gray-400 text-xs uppercase">Type</p>
                                <p className="font-semibold text-gray-700">{pass.vehicleType}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-gray-400 text-xs uppercase">Status</p>
                                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${pass.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                                    pass.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                                        pass.status === 'USED' ? 'bg-gray-100 text-gray-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                    {pass.status}
                                </span>
                            </div>
                        </div>

                        {pass.parkingSlot && (
                            <div className="mt-6 w-full bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-center gap-3">
                                <MapPin className="text-blue-500" />
                                <div>
                                    <p className="text-xs text-blue-400 uppercase font-bold">Allocated Parking</p>
                                    <p className="text-blue-900 font-semibold">{pass.parkingSlot.location.name} - Slot {pass.parkingSlot.slotNumber}</p>
                                </div>
                            </div>
                        )}

                        <div className="mt-8 flex gap-3 w-full">
                            <Button variant="secondary" className="flex-1 bg-gray-100 hover:bg-gray-200 border-none text-gray-700 justify-center">
                                <Share2 size={18} className="mr-2" /> Share
                            </Button>
                            <Button variant="primary" className="flex-1 justify-center">
                                <Download size={18} className="mr-2" /> Save
                            </Button>
                        </div>
                    </div>

                    {/* Ticket jagged edge bottom */}
                    <div className="h-4 bg-[#0f3b28]" style={{
                        background: 'linear-gradient(45deg, transparent 50%, #0f3b28 50%), linear-gradient(-45deg, transparent 50%, #0f3b28 50%)',
                        backgroundSize: '20px 20px',
                        backgroundRepeat: 'repeat-x',
                        backgroundPosition: '0 10px'
                    }}></div>
                </motion.div>
            </div>
        </>
    )
}
