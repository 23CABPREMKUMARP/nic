'use client';

import Navbar from "@/components/Navbar";
import { Html5Qrcode } from "html5-qrcode";
import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, Camera } from "lucide-react";

export default function ScannerPage() {
    const [scanResult, setScanResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    // Use Html5Qrcode (class) instead of Html5QrcodeScanner (widget)
    const scannerRef = useRef<Html5Qrcode | null>(null);

    const startScanning = async () => {
        setCameraError(null);
        try {
            if (!scannerRef.current) {
                scannerRef.current = new Html5Qrcode("reader");
            }

            await scannerRef.current.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 }
                },
                (decodedText) => {
                    stopScanning();
                    fetchPassDetails(decodedText);
                },
                (errorMessage) => {
                    // ignore
                }
            );
            setIsScanning(true);
        } catch (err: any) {
            console.error("Camera start error:", err);
            setCameraError(err?.message || "Camera access denied. Please ensure you have granted camera permissions.");
        }
    };

    const stopScanning = async () => {
        if (scannerRef.current && isScanning) {
            try {
                await scannerRef.current.stop();
                setIsScanning(false);
            } catch (err) {
                console.error("Failed to stop", err);
            }
        }
    };

    useEffect(() => {
        return () => {
            if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().catch(console.error);
                scannerRef.current.clear();
            }
        };
    }, []);

    const fetchPassDetails = async (qrCode: string) => {
        setLoading(true);
        try {
            const res = await fetch('/api/pass/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ qrCode })
            });
            const data = await res.json();
            if (data.error) {
                setScanResult({ valid: false, message: data.error });
                playErrorSound();
            } else {
                setScanResult({ valid: true, pass: data.pass, warning: data.warning });
                if (data.warning) playErrorSound();
                else playSuccessSound();
            }
        } catch (err) {
            setScanResult({ valid: false, message: "Network Error" });
        } finally {
            setLoading(false);
        }
    };

    const playSuccessSound = () => {
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            osc.type = "sine";
            osc.frequency.setValueAtTime(800, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);
            osc.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.1);
        } catch (e) { }
    };

    const playErrorSound = () => {
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            osc.type = "sawtooth";
            osc.frequency.setValueAtTime(200, ctx.currentTime);
            osc.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.3);
        } catch (e) { }
    };

    const handleActivate = async () => {
        if (!scanResult?.pass?.id) return;
        setActionLoading(true);
        try {
            const res = await fetch('/api/pass/activate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ passId: scanResult.pass.id })
            });
            const data = await res.json();
            if (data.success) {
                setScanResult({ ...scanResult, pass: data.pass, message: "Your E-Pass was activated", valid: true });
            } else {
                alert(data.error);
            }
        } catch (err) {
            alert('Failed to activate');
        } finally {
            setActionLoading(false);
        }
    };

    const handleConsume = async () => {
        if (!scanResult?.pass?.id) return;
        setActionLoading(true);
        try {
            const res = await fetch('/api/pass/consume', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ passId: scanResult.pass.id })
            });
            const data = await res.json();
            if (data.success) {
                setScanResult({ ...scanResult, pass: data.pass, message: "Entry Marked (Used)" });
            } else {
                alert(data.error);
            }
        } catch (err) {
            alert('Failed to mark entry');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReset = () => {
        setScanResult(null);
        startScanning();
    };

    return (
        <>
            <Navbar />
            <div className="min-h-screen pt-24 pb-12 px-6 flex flex-col items-center justify-center">
                <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-6 text-center border border-white/20">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Official Gate Scanner</h1>

                    {cameraError && (
                        <div className="bg-red-50 border border-red-200 p-3 rounded text-red-700 text-sm mb-4">
                            {cameraError}
                        </div>
                    )}

                    {!scanResult && !loading && (
                        <div className="relative">
                            {/* The ID 'reader' is used by Html5Qrcode library */}
                            <div id="reader" className="w-full bg-black rounded-xl overflow-hidden min-h-[300px] border border-gray-200 relative z-0"></div>

                            {!isScanning && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/60 rounded-xl pointer-events-none">
                                    <Camera size={48} className="text-white/50 mb-2" />
                                    <p className="text-white/70 text-sm">Camera Offline</p>
                                </div>
                            )}

                            {!isScanning && (
                                <div className="space-y-3 mt-4 z-20 relative pointer-events-auto">
                                    <Button
                                        onClick={startScanning}
                                        className="w-full bg-green-700 hover:bg-green-600 font-bold shadow-lg shadow-green-900/20 text-white"
                                    >
                                        Start Camera
                                    </Button>

                                    <div className="relative">
                                        <input
                                            type="file"
                                            id="qr-file-input"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={async (e) => {
                                                if (e.target.files && e.target.files.length > 0) {
                                                    const file = e.target.files[0];
                                                    try {
                                                        const html5QrCode = new Html5Qrcode("reader");
                                                        const decodedText = await html5QrCode.scanFile(file, true);
                                                        fetchPassDetails(decodedText);
                                                    } catch (err) {
                                                        console.error(err);
                                                        setScanResult({ valid: false, message: "Could not read QR from image" });
                                                        playErrorSound();
                                                    }
                                                }
                                            }}
                                        />
                                        <Button
                                            onClick={() => document.getElementById('qr-file-input')?.click()}
                                            variant="secondary"
                                            className="w-full bg-blue-600 hover:bg-blue-500 font-bold shadow-lg shadow-blue-900/20 text-white"
                                        >
                                            Upload from Gallery
                                        </Button>
                                    </div>
                                </div>
                            )}
                            {isScanning && (
                                <Button
                                    onClick={stopScanning}
                                    className="mt-4 w-full bg-red-600 hover:bg-red-500 font-bold z-20 relative pointer-events-auto shadow-lg shadow-red-900/20 text-white"
                                >
                                    Stop Camera
                                </Button>
                            )}
                        </div>
                    )}

                    {loading && <div className="py-20 text-gray-700 animate-pulse font-medium">Processing Pass...</div>}

                    {scanResult && (
                        <div className="mt-6 flex flex-col items-center animate-in fade-in zoom-in duration-300">
                            {/* Status Badge */}
                            <div className={`mb-4 px-4 py-2 rounded-full font-bold text-lg shadow-md ${scanResult.valid ?
                                (scanResult.pass?.status === 'ACTIVE' || scanResult.parking?.status === 'BOOKED' ? 'bg-green-100 text-green-700 border border-green-200' :
                                    scanResult.pass?.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                                        (scanResult.pass?.status === 'USED' || scanResult.parking?.status === 'ARRIVED') ? 'bg-gray-100 text-gray-600 border border-gray-200' : 'bg-red-100 text-red-700 border border-red-200')
                                : 'bg-red-100 text-red-700 border border-red-200'
                                }`}>
                                {scanResult.valid ?
                                    (scanResult.pass?.status === 'ACTIVE' ?
                                        <span className="flex items-center gap-2"><CheckCircle size={20} /> Your E-Pass is activated</span>
                                        : (scanResult.pass?.status || scanResult.parking?.status))
                                    : 'INVALID'}
                            </div>

                            <p className="text-gray-700 mb-4 text-lg font-medium">{scanResult.message || (scanResult.valid ? 'Pass Verified' : 'Scan Failed')}</p>

                            {scanResult.pass && (
                                <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl w-full text-left space-y-3 mb-6 shadow-inset">
                                    <div className="border-b border-gray-200 pb-2 mb-2">
                                        <p className="text-xs text-gray-500 uppercase tracking-widest">Applicant Details</p>
                                        <p className="text-gray-900 font-bold text-lg">{scanResult.pass.fullName || scanResult.pass.user?.name}</p>
                                        <p className="text-sm text-gray-600">📞 {scanResult.pass.mobile || 'N/A'}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <p className="text-xs text-gray-500">Vehicle</p>
                                            <p className="text-gray-900 font-mono font-bold">{scanResult.pass.vehicleNo}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-500">Type</p>
                                            <p className="text-gray-900 font-bold">{scanResult.pass.vehicleType}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Members</p>
                                            <p className="text-gray-900 font-bold">{scanResult.pass.membersCount}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-500">Date</p>
                                            <p className="text-gray-900 font-bold">{new Date(scanResult.pass.visitDate).toLocaleDateString()}</p>
                                        </div>
                                    </div>

                                    <div className="border-t border-gray-200 pt-2 mt-2">
                                        <p className="text-xs text-gray-500">Purpose & Stay</p>
                                        <p className="text-sm text-gray-800">{scanResult.pass.purpose} • {scanResult.pass.currentStay}</p>
                                        {scanResult.pass.address && <p className="text-xs text-gray-500 mt-1 truncate">{scanResult.pass.address}</p>}
                                    </div>

                                    {/* Simulated Document View for Admin */}
                                    <div className="border-t border-gray-200 pt-3 mt-2">
                                        <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Uploaded Documents</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {/* Mock ID Card */}
                                            <div className="bg-white rounded p-2 flex flex-col items-center justify-center h-20 border border-gray-200">
                                                <div className="text-xs text-gray-500 mb-1">ID Proof</div>
                                                <div className="bg-gray-100 w-12 h-8 rounded mb-1 flex items-center justify-center text-[8px] text-gray-400">IMG</div>
                                                <span className="text-[10px] text-green-600 flex items-center gap-1 font-bold">
                                                    <CheckCircle size={10} /> Verified
                                                </span>
                                            </div>
                                            <div className="bg-white rounded p-2 flex flex-col items-center justify-center h-20 border border-gray-200">
                                                <div className="text-xs text-gray-500 mb-1">Aadhaar</div>
                                                <div className="bg-gray-100 w-12 h-8 rounded mb-1 flex items-center justify-center text-[8px] text-gray-400">IMG</div>
                                                <span className="text-[10px] text-green-600 flex items-center gap-1 font-bold">
                                                    <CheckCircle size={10} /> Verified
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {scanResult.parking && (
                                <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl w-full text-left space-y-3 mb-6">
                                    <div className="border-b border-gray-200 pb-2 mb-2 flex justify-between items-start">
                                        <div>
                                            <p className="text-xs text-green-600 uppercase tracking-widest font-bold">🅿️ Parking Entry</p>
                                            <p className="text-gray-900 font-bold text-lg">{scanResult.parking.facility?.location?.name}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-500">Vehicle</p>
                                            <p className="text-gray-900 font-mono font-bold">{scanResult.parking.vehicleNo}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <p className="text-xs text-gray-500">Start Time</p>
                                            <p className="text-gray-900 font-bold">{new Date(scanResult.parking.startTime).toLocaleTimeString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-500">End Time</p>
                                            <p className="text-gray-900 font-bold">{new Date(scanResult.parking.endTime).toLocaleTimeString()}</p>
                                        </div>
                                    </div>

                                    <div className="border-t border-gray-200 pt-2 mt-2">
                                        <p className="text-xs text-gray-500">Payment Status</p>
                                        <p className="text-sm text-green-600 font-bold">{scanResult.parking.paymentStatus} (₹{scanResult.parking.amount})</p>
                                    </div>
                                </div>
                            )}

                            {scanResult.warning && (
                                <div className="p-3 bg-red-100 border border-red-300 rounded text-red-700 text-lg font-bold w-full uppercase animate-pulse mb-4">
                                    ⛔ {scanResult.warning}
                                </div>
                            )}

                            {/* Actions based on Status - Only if no warning */}
                            {!scanResult.warning && (scanResult.pass?.status === 'PENDING' || scanResult.pass?.status === 'SUBMITTED') && (
                                <Button
                                    onClick={handleActivate}
                                    disabled={actionLoading}
                                    variant="primary"
                                    className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold shadow-lg shadow-yellow-900/10 border border-yellow-500"
                                >
                                    {actionLoading ? 'Activating...' : 'ACTIVATE PASS'}
                                </Button>
                            )}

                            {!scanResult.warning && scanResult.pass?.status === 'ACTIVE' && (
                                <Button
                                    onClick={handleConsume}
                                    disabled={actionLoading}
                                    variant="primary"
                                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold shadow-lg shadow-green-900/10"
                                >
                                    {actionLoading ? 'Processing...' : 'MARK ENTRY (USED)'}
                                </Button>
                            )}

                            {scanResult.pass?.status === 'USED' && (
                                <div className="p-3 bg-red-100 border border-red-200 rounded text-red-700 text-sm font-bold w-full text-center">
                                    ⚠️ ALREADY USED
                                </div>
                            )}

                            <Button onClick={handleReset} variant="secondary" className="mt-4 w-full border border-gray-300 text-gray-700 hover:bg-gray-100 bg-white">Scan Next Pass</Button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
