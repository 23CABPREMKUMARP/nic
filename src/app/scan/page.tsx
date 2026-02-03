'use client';

import Navbar from "@/components/Navbar";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle } from "lucide-react";

export default function ScannerPage() {
    const [scanResult, setScanResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const router = useRouter();

    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

    useEffect(() => {
        if (scanResult || loading) return;

        // Prevent double initialization in Strict Mode
        if (scannerRef.current) return;

        // Ensure element exists before initializing
        const element = document.getElementById("reader");
        if (!element) return;

        try {
            const scanner = new Html5QrcodeScanner(
                "reader",
                { fps: 10, qrbox: { width: 250, height: 250 } },
                false
            );

            scannerRef.current = scanner;

            scanner.render(onScanSuccess, (err) => {
                // Ignore innocuous parse errors as they happen every frame
                // console.warn(err);
            });
        } catch (e) {
            console.error("Scanner init error:", e);
        }

        function onScanSuccess(decodedText: string) {
            // Stop scanning immediately on success
            if (scannerRef.current) {
                scannerRef.current.clear().catch(console.error);
                scannerRef.current = null;
            }
            fetchPassDetails(decodedText);
        }

        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(console.error);
                scannerRef.current = null;
            }
        };
    }, [scanResult, loading]);

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
        const audio = new Audio('/beep-success.mp3'); // We'll need to add this file or use inline b64 if simpler, but for now assuming placeholder or browser beep
        // Simple OSC beep for zero-dependency
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

    // ... (rest of activator logic)

    // In render, check warning
    // ...

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
                setScanResult({ ...scanResult, pass: data.pass, message: "Activated Successfully" });
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
        window.location.reload();
    };

    return (
        <>
            <Navbar />
            <div className="min-h-screen pt-24 pb-12 px-6 flex flex-col items-center justify-center">
                <div className="glass-card w-full max-w-md p-6 text-center">
                    <h1 className="text-2xl font-bold text-white mb-4">Official Gate Scanner</h1>

                    {!scanResult && !loading && (
                        <div id="reader" className="w-full bg-black/20 rounded-xl overflow-hidden"></div>
                    )}

                    {loading && <p className="text-white mt-4">Fetching Pass Details...</p>}

                    {scanResult && (
                        <div className="mt-6 flex flex-col items-center animate-in fade-in zoom-in duration-300">
                            {/* Status Badge */}
                            <div className={`mb-4 px-4 py-2 rounded-full font-bold text-lg ${scanResult.valid ?
                                (scanResult.pass?.status === 'ACTIVE' ? 'bg-green-500 text-white' :
                                    scanResult.pass?.status === 'PENDING' ? 'bg-yellow-500 text-black' :
                                        scanResult.pass?.status === 'USED' ? 'bg-gray-500 text-white' : 'bg-red-500 text-white')
                                : 'bg-red-500 text-white'
                                }`}>
                                {scanResult.valid ? scanResult.pass?.status : 'INVALID'}
                            </div>

                            <p className="text-white/80 mb-4 text-lg">{scanResult.message || (scanResult.valid ? 'Pass Verified' : 'Scan Failed')}</p>

                            {scanResult.pass && (
                                <div className="bg-white/10 p-4 rounded-xl w-full text-left space-y-3 mb-6">
                                    <div className="border-b border-white/10 pb-2 mb-2">
                                        <p className="text-xs text-gray-400 uppercase tracking-widest">Applicant Details</p>
                                        <p className="text-white font-bold text-lg">{scanResult.pass.fullName || scanResult.pass.user?.name}</p>
                                        <p className="text-sm text-gray-300">📞 {scanResult.pass.mobile || 'N/A'}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <p className="text-xs text-gray-400">Vehicle</p>
                                            <p className="text-white font-mono font-bold">{scanResult.pass.vehicleNo}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-400">Type</p>
                                            <p className="text-white font-bold">{scanResult.pass.vehicleType}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400">Members</p>
                                            <p className="text-white font-bold">{scanResult.pass.membersCount}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-400">Date</p>
                                            <p className="text-white font-bold">{new Date(scanResult.pass.visitDate).toLocaleDateString()}</p>
                                        </div>
                                    </div>

                                    <div className="border-t border-white/10 pt-2 mt-2">
                                        <p className="text-xs text-gray-400">Purpose & Stay</p>
                                        <p className="text-sm text-white">{scanResult.pass.purpose} • {scanResult.pass.currentStay}</p>
                                        {scanResult.pass.address && <p className="text-xs text-gray-400 mt-1 truncate">{scanResult.pass.address}</p>}
                                    </div>

                                    {/* Simulated Document View for Admin */}
                                    <div className="border-t border-white/10 pt-3 mt-2">
                                        <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Uploaded Documents</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {/* Mock ID Card */}
                                            <div className="bg-black/40 rounded p-2 flex flex-col items-center justify-center h-20 border border-white/10">
                                                <div className="text-xs text-gray-400 mb-1">ID Proof</div>
                                                <div className="bg-gray-700 w-12 h-8 rounded mb-1 flex items-center justify-center text-[8px] text-white/50">IMG</div>
                                                <span className="text-[10px] text-green-400 flex items-center gap-1">
                                                    <CheckCircle size={10} /> Verified
                                                </span>
                                            </div>
                                            {/* RC not uploaded by user anymore, but maybe old records have it. For now, show ID only as prominent. */}
                                            <div className="bg-black/40 rounded p-2 flex flex-col items-center justify-center h-20 border border-white/10">
                                                <div className="text-xs text-gray-400 mb-1">Aadhaar</div>
                                                <div className="bg-gray-700 w-12 h-8 rounded mb-1 flex items-center justify-center text-[8px] text-white/50">IMG</div>
                                                <span className="text-[10px] text-green-400 flex items-center gap-1">
                                                    <CheckCircle size={10} /> Verified
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {scanResult.warning && (
                                <div className="p-3 bg-red-600 border border-red-500 rounded text-white text-lg font-bold w-full uppercase animate-pulse mb-4">
                                    ⛔ {scanResult.warning}
                                </div>
                            )}

                            {/* Actions based on Status - Only if no warning */}
                            {!scanResult.warning && scanResult.pass?.status === 'PENDING' && (
                                <Button
                                    onClick={handleActivate}
                                    disabled={actionLoading}
                                    variant="primary"
                                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
                                >
                                    {actionLoading ? 'Activating...' : 'ACTIVATE PASS'}
                                </Button>
                            )}

                            {!scanResult.warning && scanResult.pass?.status === 'ACTIVE' && (
                                <Button
                                    onClick={handleConsume}
                                    disabled={actionLoading}
                                    variant="primary"
                                    className="w-full bg-green-600 hover:bg-green-500 font-bold"
                                >
                                    {actionLoading ? 'Processing...' : 'MARK ENTRY (USED)'}
                                </Button>
                            )}

                            {scanResult.pass?.status === 'USED' && (
                                <div className="p-3 bg-red-500/20 border border-red-500/50 rounded text-red-200 text-sm font-bold w-full">
                                    ⚠️ ALREADY USED
                                </div>
                            )}

                            <Button onClick={handleReset} variant="secondary" className="mt-4 w-full">Scan Next</Button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
