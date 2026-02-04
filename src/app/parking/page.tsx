'use client';

import Navbar from "@/components/Navbar";
import { useEffect, useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Ticket } from "lucide-react";

function ParkingBookingContent() {
    const { user } = useUser();
    const router = useRouter();
    const searchParams = useSearchParams();
    const preselectName = searchParams.get('preselect');

    // State
    const [locations, setLocations] = useState<any[]>([]);
    const [selectedLocation, setSelectedLocation] = useState<string>("");
    const [vehicleType, setVehicleType] = useState<string>("CAR");
    const [date, setDate] = useState<string>("");
    const [startTime, setStartTime] = useState<string>("");
    const [duration, setDuration] = useState<number>(1); // Hours
    const [vehicleNo, setVehicleNo] = useState<string>("");

    const [loading, setLoading] = useState(false);
    const [bookingSuccess, setBookingSuccess] = useState<any>(null);

    // E-Pass Integration
    const [activePasses, setActivePasses] = useState<any[]>([]);
    const [selectedPassId, setSelectedPassId] = useState<string>("");

    useEffect(() => {
        // Set today's date
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        setDate(`${year}-${month}-${day}`);

        fetch('/api/parking/locations')
            .then(res => res.json())
            .then(data => {
                if (data.locations) {
                    setLocations(data.locations);
                    // Handle Pre-selection
                    if (preselectName) {
                        const found = data.locations.find((l: any) =>
                            l.name.toLowerCase().includes(preselectName.toLowerCase())
                        );
                        if (found) setSelectedLocation(found.id);
                    }
                }
            })
            .catch(err => console.error(err));

        // Fetch Active Passes
        if (user) {
            fetch('/api/pass/active')
                .then(async res => {
                    const text = await res.text();
                    try {
                        return text ? JSON.parse(text) : {};
                    } catch (e) {
                        console.error("Invalid JSON from API:", text);
                        return {};
                    }
                })
                .then(data => {
                    if (data.passes && data.passes.length > 0) {
                        setActivePasses(data.passes);

                        // AUTO-FILL: Automatically select the most recent pass
                        const latestPass = data.passes[0];
                        setSelectedPassId(latestPass.id);
                        setVehicleNo(latestPass.vehicleNo);
                        setVehicleType(latestPass.vehicleType);
                        const visitDate = new Date(latestPass.visitDate).toISOString().split('T')[0];
                        setDate(visitDate);
                    }
                })
                .catch(err => console.error("Failed to load passes", err));
        }
    }, [user]);

    const handlePassSelect = (passId: string) => {
        setSelectedPassId(passId);
        if (passId) {
            const pass = activePasses.find(p => p.id === passId);
            if (pass) {
                setVehicleNo(pass.vehicleNo);
                setVehicleType(pass.vehicleType);
                const visitDate = new Date(pass.visitDate).toISOString().split('T')[0];
                setDate(visitDate);
            }
        } else {
            setVehicleNo("");
            setVehicleType("CAR");
            // Reset to today
            const now = new Date();
            setDate(now.toISOString().split('T')[0]);
        }
    };

    const getFacility = () => {
        if (!selectedLocation || !locations.length) return null;
        const loc = locations.find(l => l.id === selectedLocation);
        return loc?.parkingFacilities.find((f: any) => f.vehicleType === vehicleType);
    };

    const facility = getFacility();
    const totalAmount = facility ? (facility.hourlyRate * duration) : 0;

    const handleBook = async () => {
        if (!user) return alert("Please login first");
        if (!facility) return alert("Facility unavailable");

        setLoading(true);
        try {
            // Construct start/end time
            const start = new Date(`${date}T${startTime}`);
            const end = new Date(start.getTime() + duration * 60 * 60 * 1000);

            const res = await fetch('/api/parking/book', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    locationId: selectedLocation,
                    vehicleType,
                    startTime: start.toISOString(),
                    endTime: end.toISOString(),
                    vehicleNo,
                    passId: selectedPassId || undefined // Link booking to pass if selected
                })
            });
            const data = await res.json();
            if (data.success) {
                setBookingSuccess(data.booking);
            } else {
                alert(data.error || "Booking Failed");
            }
        } catch (e) {
            console.error(e);
            alert("Error booking");
        } finally {
            setLoading(false);
        }
    };

    if (bookingSuccess) {
        return (
            <>
                <Navbar />
                <div className="min-h-screen pt-24 px-4 flex flex-col items-center justify-center text-gray-900">
                    <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl text-gray-900 p-8 text-center border border-white/20 animate-in zoom-in">
                        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/30">
                            <span className="text-3xl text-white">✓</span>
                        </div>
                        <h2 className="text-2xl font-bold mb-2 text-green-800">Booking Confirmed!</h2>
                        <p className="text-gray-600 mb-6">Your parking slot is reserved.</p>

                        <div className="bg-white border-2 border-dashed border-gray-200 p-4 rounded-xl mb-6">
                            {/* QR Code Placeholder */}
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${bookingSuccess.qrCode}`}
                                alt="Parking QR"
                                className="w-full h-auto mix-blend-multiply"
                            />
                            <p className="text-black font-mono mt-2 text-sm font-bold tracking-widest">{bookingSuccess.qrCode}</p>
                        </div>

                        <div className="text-left space-y-2 text-sm mb-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <p><strong className="text-gray-500">Location:</strong> <span className="font-semibold">{bookingSuccess.facility?.location?.name}</span></p>
                            <p><strong className="text-gray-500">Vehicle:</strong> <span className="font-semibold">{bookingSuccess.vehicleNo} ({bookingSuccess.vehicleType})</span></p>
                            <p><strong className="text-gray-500">Time:</strong> <span className="font-semibold">{new Date(bookingSuccess.startTime).toLocaleString()}</span></p>
                            <p><strong className="text-gray-500">Amount Paid:</strong> <span className="text-green-600 font-bold">₹{bookingSuccess.amount}</span></p>
                        </div>

                        <Button onClick={() => setBookingSuccess(null)} className="w-full bg-gray-900 hover:bg-black text-white">Book Another</Button>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <div className="min-h-screen pt-24 px-4 pb-12">
                <div className="max-w-2xl mx-auto">

                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-md">🅿️ Smart Parking Booking</h1>
                        <p className="text-white/90 font-medium drop-shadow-sm">Reserve your spot at Ooty's top attractions.</p>
                    </div>

                    <div className="w-full bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl text-gray-900 p-6 md:p-8 border border-white/20">
                        {/* 0. E-Pass Auto-Fill */}
                        {activePasses.length > 0 && (
                            <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                                <label className="block text-sm font-bold text-blue-900 mb-2 flex items-center gap-2">
                                    <Ticket size={16} />
                                    {selectedPassId ? "Vehicle Details Auto-Detected from E-Pass" : "Select Active E-Pass"}
                                </label>
                                <select
                                    className="input-field border-blue-200 focus:border-blue-500 bg-white"
                                    value={selectedPassId}
                                    onChange={(e) => handlePassSelect(e.target.value)}
                                >
                                    <option value="">-- Manual Entry --</option>
                                    {activePasses.map(pass => (
                                        <option key={pass.id} value={pass.id}>
                                            {pass.vehicleNo} ({pass.vehicleType}) - {new Date(pass.visitDate).toLocaleDateString()}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-blue-600 mt-2">
                                    Selecting a pass automatically fills your vehicle details.
                                </p>
                            </div>
                        )}

                        {/* 1. Location */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Select Attraction</label>
                            <select
                                className="input-field"
                                value={selectedLocation}
                                onChange={(e) => setSelectedLocation(e.target.value)}
                            >
                                <option value="">-- Choose Location --</option>
                                {locations.map(loc => (
                                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                                ))}
                            </select>
                        </div>

                        {selectedLocation && (
                            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                                {/* 2. Vehicle Type */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Type</label>
                                    <div className="flex gap-2">
                                        {["CAR", "BIKE", "BUS"].map(type => (
                                            <button
                                                key={type}
                                                onClick={() => !selectedPassId && setVehicleType(type)}
                                                className={`px-4 py-2 rounded-lg border font-medium transition-all ${vehicleType === type ? 'bg-green-600 text-white border-green-600 shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'} ${selectedPassId ? 'opacity-80 cursor-not-allowed' : ''}`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-xs text-green-600 font-semibold mt-2">Rate: ₹{getFacility()?.hourlyRate || '--'}/hr</p>
                                </div>

                                {/* 3. Date & Time */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                                        <input
                                            type="date"
                                            className={`input-field ${selectedPassId ? 'bg-gray-100 cursor-not-allowed opacity-70' : ''}`}
                                            value={date}
                                            readOnly={!!selectedPassId}
                                            min={new Date().toLocaleDateString('fr-CA')}
                                            onChange={(e) => setDate(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                                        <input
                                            type="time"
                                            className="input-field"
                                            onChange={(e) => setStartTime(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* 4. Duration */}
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <label className="block text-sm font-medium text-gray-700">Duration</label>
                                        <span className="text-sm font-bold text-green-700">{duration} Hours</span>
                                    </div>
                                    <input
                                        type="range" min="1" max="12" step="1"
                                        value={duration}
                                        onChange={(e) => setDuration(parseInt(e.target.value))}
                                        className="w-full accent-green-600 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                    />
                                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                                        <span>1 Hr</span>
                                        <span>12 Hrs</span>
                                    </div>
                                </div>

                                {/* 5. Vehicle Details */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Number</label>
                                    <input
                                        type="text"
                                        placeholder="TN 43 ..."
                                        className={`input-field uppercase placeholder:normal-case ${selectedPassId ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                        value={vehicleNo}
                                        readOnly={!!selectedPassId}
                                        onChange={(e) => setVehicleNo(e.target.value.toUpperCase())}
                                    />
                                    {selectedPassId && <p className="text-xs text-green-600 mt-1">✓ Verified from E-Pass</p>}
                                </div>

                                {/* Summary */}
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 mt-4 flex justify-between items-center">
                                    <span className="text-gray-600 font-medium">Total Payable</span>
                                    <span className="text-3xl font-bold text-gray-900">₹{totalAmount}</span>
                                </div>

                                <Button
                                    onClick={handleBook}
                                    disabled={loading || !date || !startTime || !vehicleNo}
                                    className="w-full bg-green-700 hover:bg-green-800 h-12 text-lg font-bold shadow-green-900/20 shadow-lg text-white"
                                >
                                    {loading ? 'Processing...' : `Pay ₹${totalAmount} & Book`}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <style jsx global>{`
                .input-field {
                    width: 100%;
                    background: #f9fafb; /* bg-gray-50 */
                    border: 1px solid #e5e7eb; /* border-gray-200 */
                    border-radius: 0.5rem;
                    padding: 0.75rem;
                    color: #111827; /* text-gray-900 */
                    outline: none;
                    transition: all 0.2s;
                }
                .input-field:focus {
                    border-color: #15803d; /* green-700 */
                    background: #ffffff;
                    box-shadow: 0 0 0 2px rgba(21, 128, 61, 0.1);
                }
                .input-field::placeholder {
                    color: #9ca3af; /* text-gray-400 */
                }
                input[type="date"], input[type="time"] {
                    color-scheme: light;
                }
            `}</style>
        </>
    );
}

export default function ParkingBookingPage() {
    return (
        <Suspense fallback={<div className="min-h-screen pt-24 text-center text-white">Loading Booking System...</div>}>
            <ParkingBookingContent />
        </Suspense>
    );
}
