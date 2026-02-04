'use client';

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import html2canvas from "html2canvas";
import QRCode from "qrcode";
import { Car, Calendar, Users, MapPin, CheckCircle, Clock, AlertTriangle, Download, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import Link from "next/link";

// Helper for QR using local library
const QrDisplay = ({ value, blur = false }: { value: string, blur?: boolean }) => {
    const [qrUrl, setQrUrl] = useState('');

    useEffect(() => {
        if (!blur) {
            QRCode.toDataURL(value)
                .then(url => setQrUrl(url))
                .catch(err => console.error(err));
        }
    }, [value, blur]);

    return (
        <div className="relative">
            {qrUrl && !blur ? (
                <img
                    src={qrUrl}
                    alt="QR Code"
                    className="w-32 h-32 transition-all duration-500 blur-0 opacity-100"
                />
            ) : (
                <div className={`w-32 h-32 flex items-center justify-center bg-gray-50 border border-dashed rounded-lg ${blur ? 'blur-md opacity-50' : ''}`}>
                    <Loader2 className="w-8 h-8 text-yellow-600 animate-spin" />
                </div>
            )}
        </div>
    );
};

export default function ActivePassDisplay({ initialPass }: { initialPass: any }) {
    const [pass, setPass] = useState<any>(initialPass);
    const [downloading, setDownloading] = useState(false);

    // Real-time Sync Logic (Optimized Polling)
    useEffect(() => {
        let isActive = true;
        const poll = async () => {
            try {
                const res = await fetch('/api/pass/active');
                if (res.status === 401) return;
                const data = await res.json();
                if (isActive && data && data.passes && data.passes.length > 0) {
                    const latest = data.passes[0];
                    if (latest.status !== pass.status || latest.id !== pass.id) {
                        setPass(latest);
                    }
                }
            } catch (err) {
                // Silently handle polling errors
            }
        };

        const interval = setInterval(poll, 5000);
        return () => {
            isActive = false;
            clearInterval(interval);
        };
    }, [pass?.id, pass?.status]);

    const handleDownload = async () => {
        const element = document.getElementById('capture-pass-element');
        if (element) {
            setDownloading(true);
            try {
                // Wait for high-res assets
                await new Promise(r => setTimeout(r, 1000));

                const canvas = await html2canvas(element, {
                    scale: 3,
                    useCORS: true,
                    backgroundColor: '#ffffff',
                    logging: false,
                    onclone: (clonedDoc) => {
                        const el = clonedDoc.getElementById('capture-pass-element');
                        if (el) {
                            el.style.position = 'static';
                            el.style.left = '0';
                            el.style.top = '0';
                            el.style.visibility = 'visible';
                            el.style.display = 'block';
                        }
                    }
                });

                const dataUrl = canvas.toDataURL('image/png');
                if (dataUrl && dataUrl.length > 1000) {
                    const link = document.createElement('a');
                    link.download = `Nilgiris-EPass-${pass.vehicleNo}.png`;
                    link.href = dataUrl;
                    link.click();
                } else {
                    throw new Error("Canvas generation returned empty image");
                }
            } catch (err) {
                console.error("Capture failed:", err);
                alert("Generation failed. Please try again.");
            } finally {
                setDownloading(false);
            }
        }
    };

    if (!pass) return <EmptyState />;

    const isActive = pass.status === 'ACTIVE' || pass.status === 'USED';

    return (
        <div className="w-full relative" style={{ perspective: '1200px', minHeight: '500px' }}>
            {/* HIDDEN CAPTURE VERSION (Safe positioning for capture) */}
            <div
                id="capture-pass-element"
                style={{ position: 'fixed', left: '-5000px', top: '0', width: '600px', zIndex: -1 }}
                className="bg-white rounded-2xl overflow-hidden border"
            >
                <PassCardFace
                    pass={pass}
                    statusOverride={pass.status === 'USED' ? 'USED E-PASS' : 'ACTIVE E-PASS'}
                    colorClass={pass.status === 'USED' ? 'bg-gray-600' : 'bg-green-600'}
                    isBlurred={false}
                    isCapture={true}
                />
            </div>

            <motion.div
                className="w-full relative"
                initial={false}
                animate={{ rotateY: isActive ? 180 : 0 }}
                transition={{ duration: 0.8, type: "spring", stiffness: 60 }}
                style={{ transformStyle: 'preserve-3d' }}
            >
                {/* FRONT FACE (PENDING) */}
                <div
                    className="absolute inset-0 w-full bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-yellow-200/50"
                    style={{ backfaceVisibility: 'hidden' }}
                >
                    <PassCardFace
                        pass={pass}
                        statusOverride="PENDING VERIFICATION"
                        colorClass="bg-yellow-500"
                        isBlurred={true}
                    />
                </div>

                {/* BACK FACE (ACTIVE) */}
                <div
                    className="relative w-full bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-green-200/50"
                    style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                >
                    <PassCardFace
                        pass={pass}
                        statusOverride={pass.status === 'USED' ? 'USED E-PASS' : 'ACTIVE E-PASS'}
                        colorClass={pass.status === 'USED' ? 'bg-gray-600' : 'bg-green-600'}
                        isBlurred={false}
                        handleDownload={handleDownload}
                        downloading={downloading}
                    />
                </div>
            </motion.div>
        </div>
    );
}

const PassCardFace = ({ pass, statusOverride, colorClass, isBlurred, handleDownload, downloading, isCapture }: any) => {
    const booking = pass.parkingBookings?.[0];

    return (
        <>
            <div className={`p-4 flex justify-between items-center ${colorClass} text-white`}>
                <div className="flex items-center gap-2">
                    {isBlurred ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                    <span className="font-bold tracking-wide uppercase">{statusOverride}</span>
                </div>
                <span className="text-sm font-mono opacity-90">#{pass.id.slice(-6).toUpperCase()}</span>
            </div>

            <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-8 text-slate-900">
                {/* QR Section */}
                <div className="flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-gray-100 pb-6 md:pb-0 md:pr-6">
                    <div className="bg-white p-2 rounded-xl shadow-lg border border-gray-100 mb-4">
                        <QrDisplay value={pass.qrCode || pass.id} blur={isBlurred} />
                    </div>
                    <p className="text-xs text-gray-400 font-mono text-center">
                        {isBlurred ? 'Waiting for Admin Scan...' : 'Scan at Checkpost'}
                    </p>
                </div>

                {/* Content Section */}
                <div className="space-y-6 md:col-span-2">
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Vehicle Number" value={pass.vehicleNo} icon={<Car size={16} />} />
                        <Field label="Vehicle Type" value={pass.vehicleType} icon={<Car size={16} />} />
                        <Field label="Visit Date" value={new Date(pass.visitDate).toISOString().split('T')[0].split('-').reverse().join('/')} icon={<Calendar size={16} />} />
                        <Field label="Members" value={`${pass.membersCount} Persons`} icon={<Users size={16} />} />
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <MapPin size={16} className="text-red-500" /> Allocated Parking
                        </h3>
                        {booking ? (
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-gray-900 text-lg">{booking.facility?.location?.name || "Designated Area"}</p>
                                    <p className="text-xs text-gray-500">Slot: {booking.facility?.vehicleType} Zone</p>
                                </div>
                                <div className="text-right">
                                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">RESERVED</span>
                                </div>
                            </div>
                        ) : (
                            <div className="flex justify-between items-center">
                                <p className="text-sm text-gray-500">No parking slot reserved yet.</p>
                                <Link href="/parking"><Button variant="outline" className="text-xs h-8">Book Now</Button></Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer - Only visible in UI, not in Capture */}
            {!isCapture && (
                <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex justify-end gap-3 rounded-b-2xl">
                    {!isBlurred && (
                        <Button
                            variant="outline"
                            className="flex items-center gap-2 text-green-700 border-green-200 hover:bg-green-50"
                            onClick={handleDownload}
                            disabled={downloading}
                        >
                            <Download size={14} />
                            {downloading ? 'Saving...' : 'Download Pass'}
                        </Button>
                    )}
                    {isBlurred && (
                        <div className="text-xs text-gray-400 italic py-2">Approval Pending at Checkpost</div>
                    )}
                </div>
            )}
        </>
    );
};

// Simple Components
const EmptyState = () => (
    <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl p-8 border border-white/20 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Car className="w-8 h-8 text-gray-400" />
            {/* Using Car icon as fallback since TicketIcon definition was missing/implicit */}
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">No Active E-Pass Found</h2>
        <p className="text-gray-500 mb-6">Create a new pass to access Nilgiris features.</p>
        <Link href="/apply">
            <Button className="bg-green-600 hover:bg-green-700 text-white font-bold">Create E-Pass Now</Button>
        </Link>
    </div>
);

const Field = ({ label, value, icon }: any) => (
    <div>
        <label className="text-xs text-gray-500 flex items-center gap-1 mb-1">{icon} {label}</label>
        <div className="font-bold text-gray-900 text-lg">{value}</div>
    </div>
);
