import React, { useState } from 'react';
import { X, CreditCard, Lock, CheckCircle, ShieldCheck } from 'lucide-react';
import { subscriptionService } from '../services/subscriptionService';
import { useApp } from '../App';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    plan?: 'pro' | 'school';
    onSuccess: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, plan = 'pro', onSuccess }) => {
    const { user } = useApp();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [step, setStep] = useState<'details' | 'processing' | 'success'>('details');

    if (!isOpen) return null;

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setStep('processing');

        try {
            if (!user) throw new Error("User not logged in");

            const result = await subscriptionService.upgradeSubscription(user.id, plan as 'pro' | 'school');

            if (result.success) {
                setStep('success');
                setTimeout(() => {
                    onSuccess();
                    onClose();
                }, 2000);
            } else {
                throw new Error(result.error || "Payment failed");
            }
        } catch (err: any) {
            setError(err.message);
            setStep('details');
        } finally {
            setLoading(false);
        }
    };

    const planDetails = {
        pro: {
            name: 'Pro Plan',
            price: '$4.99',
            period: '/month',
            features: ['100 AI Quizzes/month', 'Priority Support', 'Custom Branding']
        },
        school: {
            name: 'School Plan',
            price: 'Custom',
            period: '',
            features: ['Unlimited Quizzes', 'Admin Dashboard', 'SSO Integration']
        }
    };

    const currentPlan = planDetails[plan];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 relative">

                {/* Header */}
                <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-start">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">Upgrade Subscription</h3>
                        <p className="text-sm text-slate-500 mt-1">Secure payment via Paymob</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {step === 'success' ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                                <CheckCircle size={32} />
                            </div>
                            <h4 className="text-xl font-bold text-slate-900 mb-2">Payment Successful!</h4>
                            <p className="text-slate-600">You have been upgraded to the {currentPlan.name}.</p>
                        </div>
                    ) : (
                        <>
                            {/* Plan Summary */}
                            <div className="bg-primary-50 p-4 rounded-xl mb-6 flex justify-between items-center border border-primary-100">
                                <div>
                                    <p className="font-bold text-primary-900">{currentPlan.name}</p>
                                    <p className="text-xs text-primary-600 font-medium mt-0.5">{currentPlan.features[0]}</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-xl font-black text-primary-700">{currentPlan.price}</span>
                                    <span className="text-xs text-primary-600 font-medium">{currentPlan.period}</span>
                                </div>
                            </div>

                            {/* Mock Form */}
                            <form onSubmit={handlePayment} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Card Information</label>
                                    <div className="relative">
                                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="text"
                                            placeholder="0000 0000 0000 0000"
                                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition font-mono text-sm"
                                            defaultValue="4242 4242 4242 4242"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mt-4">
                                        <input
                                            type="text"
                                            placeholder="MM / YY"
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition font-mono text-sm"
                                            defaultValue="12 / 25"
                                        />
                                        <input
                                            type="text"
                                            placeholder="CVC"
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition font-mono text-sm"
                                            defaultValue="123"
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <div className="text-red-500 text-sm font-medium bg-red-50 p-3 rounded-lg">
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition shadow-lg disabled:opacity-70 flex items-center justify-center gap-2 mt-2"
                                >
                                    {loading ? (
                                        <>Processing...</>
                                    ) : (
                                        <>
                                            <Lock size={16} /> Pay {currentPlan.price}
                                        </>
                                    )}
                                </button>
                            </form>

                            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400 font-medium">
                                <ShieldCheck size={14} />
                                <span>Payments processed securely by Paymob</span>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;
