'use client';

import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";

export default function ApplyPass() {
    const router = useRouter();
    const { user, isLoaded } = useUser();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Extended State
    const [formData, setFormData] = useState({
        // Personal
        fullName: '',
        fatherName: '',
        dob: '',
        gender: 'MALE',
        mobile: '',
        email: '',

        // Address
        address: '',
        currentStay: '',

        // Travel
        purpose: 'TOURISM',
        fromLocation: '',
        toLocation: 'Ooty',
        visitDate: '',

        // Vehicle
        vehicleNo: '',
        vehicleType: 'CAR',
        driverName: '',
        driverLicense: '',
        membersCount: 1,

        // Docs (Mock)
        idProofUrl: '',
        vehicleRcUrl: ''
    });

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/pass/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    userId: user?.id,
                    name: user?.fullName, // Fallback if not typed
                    email: user?.primaryEmailAddress?.emailAddress
                })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Failed to create pass');
            }

            const data = await res.json();
            router.push(`/pass/${data.id}`);
        } catch (error: any) {
            console.error(error);
            setError(error.message || 'Submission failed. check network.');
        } finally {
            setLoading(false);
        }
    };

    if (!isLoaded) return <div className="text-white text-center pt-40">Loading...</div>;

    return (
        <>
            <Navbar />
            <div className="min-h-screen pt-24 pb-12 px-4 md:px-8 flex justify-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    // CHANGED: Light Theme Wrapper
                    className="w-full max-w-4xl bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl text-gray-900 p-6 md:p-10 border border-white/20"
                >
                    <div className="text-center mb-8 border-b border-gray-200 pb-4">
                        <h1 className="text-3xl font-bold text-green-800">E-Pass Application Form</h1>
                        <p className="text-gray-500">Government of Nilgiris - Official Entry Permit</p>
                    </div>

                    {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-red-600 font-medium">{error}</div>}

                    <form onSubmit={handleSubmit} className="space-y-8">

                        {/* Section 1: Personal Details */}
                        <section>
                            <h2 className="text-xl font-semibold text-green-700 mb-4 flex items-center gap-2">1. Personal Information <span className="text-xs font-normal text-gray-400">(As per ID Proof)</span></h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input label="Full Name" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="e.g. John Doe" required />
                                <Input label="Father / Guardian Name" name="fatherName" value={formData.fatherName} onChange={handleChange} placeholder="Guardian Name" required />
                                <Input label="Date of Birth" name="dob" type="date" value={formData.dob} onChange={handleChange} required />
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                                    <select name="gender" value={formData.gender} onChange={handleChange} className="input-field">
                                        <option value="MALE">Male</option>
                                        <option value="FEMALE">Female</option>
                                        <option value="OTHER">Other</option>
                                    </select>
                                </div>
                                <Input label="Mobile Number" name="mobile" type="tel" value={formData.mobile} onChange={handleChange} placeholder="9876543210" required />
                                <Input label="Email ID" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="john@example.com" required />
                            </div>
                        </section>

                        {/* Section 2: Address */}
                        <section>
                            <h2 className="text-xl font-semibold text-green-700 mb-4">2. Residential & Stay Details</h2>
                            <div className="space-y-4">
                                <Input label="Permanent Address (Door No, Street, City, State, Pincode)" name="address" value={formData.address} onChange={handleChange} placeholder="Full Address" required />
                                <Input label="Hotel / Homestay Name & Location in Nilgiris" name="currentStay" value={formData.currentStay} onChange={handleChange} placeholder="e.g. Hotel Blue Hills, Ooty" required />
                            </div>
                        </section>

                        {/* Section 3: Travel & Vehicle */}
                        <section>
                            <h2 className="text-xl font-semibold text-green-700 mb-4">3. Vehicle & Journey Details</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <Input label="Vehicle Number" name="vehicleNo" value={formData.vehicleNo} onChange={handleChange} placeholder="TN 01 AB 1234" required />
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Type</label>
                                    <select name="vehicleType" value={formData.vehicleType} onChange={handleChange} className="input-field">
                                        <option value="CAR">Car (LMV)</option>
                                        <option value="BIKE">Bike (2 Wheeler)</option>
                                        <option value="BUS">Bus (HMV)</option>
                                        <option value="TRUCK">Goods Truck (HMV)</option>
                                        <option value="TEMPOTRAVELER">Tempo Traveler</option>
                                    </select>
                                </div>
                                <Input label="No. of Persons" name="membersCount" type="number" min="1" max="50" value={formData.membersCount} onChange={handleChange} required />

                                <Input label="Driver Name" name="driverName" value={formData.driverName} onChange={handleChange} placeholder="If different from applicant" />
                                <Input label="Driver License No" name="driverLicense" value={formData.driverLicense} onChange={handleChange} placeholder="DL-12345..." />

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Purpose</label>
                                    <select name="purpose" value={formData.purpose} onChange={handleChange} className="input-field">
                                        <option value="TOURISM">Tourism</option>
                                        <option value="WORK">Work / Official</option>
                                        <option value="MEDICAL">Medical Emergency</option>
                                        <option value="GOODS">Goods Transport</option>
                                        <option value="EDUCATION">Education</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                <Input label="From Location" name="fromLocation" value={formData.fromLocation} onChange={handleChange} placeholder="e.g. Coimbatore" required />
                                <Input label="Date of Entry" name="visitDate" type="date" value={formData.visitDate} onChange={handleChange} min={new Date().toISOString().split('T')[0]} required />
                            </div>
                        </section>

                        {/* Section 4: Documents */}
                        <section className="p-6 border border-dashed border-green-200 rounded-xl bg-green-50/50">
                            <h2 className="text-lg font-semibold text-green-800 mb-2">4. Required Documents Upload</h2>
                            <p className="text-sm text-gray-500 mb-4">Please upload clear photos of your original documents. (Max 5MB each)</p>

                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Aadhaar / Gov ID Card</label>
                                    <div className="relative border border-gray-300 bg-white rounded-lg p-3 flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors h-32">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) alert(`Attached: ${file.name} (Simulated Upload)`);
                                            }}
                                        />
                                        <div className="text-center text-sm text-gray-500">
                                            <span className="text-green-600 font-medium block text-lg mb-1">Click to Upload</span>
                                            <span className="text-xs">Supports JPG, PNG</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full py-6 text-xl font-bold mt-8 bg-green-700 hover:bg-green-800 text-white shadow-lg shadow-green-900/20"
                        >
                            {loading ? 'Processing Verification...' : 'SUBMIT APPLICATION'}
                        </Button>
                    </form>
                </motion.div>
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
                .input-field option {
                    background: white;
                    color: #111827;
                }
                /* Date Input fix for gray background */
                input[type="date"] {
                    color-scheme: light;
                }
            `}</style>
        </>
    );
}

function Input({ label, ...props }: any) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
            <input className="input-field" {...props} />
        </div>
    );
}
