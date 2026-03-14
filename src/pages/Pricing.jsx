import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, Zap, Shield, Star, ArrowRight, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import api from "../utils/api";

const Pricing = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
    const [loading, setLoading] = useState(false);

    const handleUpgrade = async (plan) => {
        if (!user) {
            navigate('/auth');
            return;
        }

        if (user.subscription === 'premium') return;

        setLoading(true);
        try {
            // 1. Create Simulated Order
            const { data: order } = await api.post('/payments/create-order', { amount: 999, plan: 'TRADAI One' });

            // 2. Simulate User Paying (Artificial Delay)
            await new Promise(resolve => setTimeout(resolve, 2000));

            // 3. Verify Payment
            const { data: result } = await api.post('/payments/verify', {
                orderId: order.orderId,
                plan: plan,
                userId: user._id
            });

            if (result.success) {
                const refreshedUser = { ...user, subscription: 'premium' };
                localStorage.setItem('user', JSON.stringify(refreshedUser));
                setUser(refreshedUser);
                alert("Subscription Upgraded Successfully! You now have access to TRADAI One.");
                // navigate('/academy');
            }
        } catch (err) {
            alert(err.response?.data?.message || "Payment failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const plans = [
        {
            name: "Free",
            price: "₹0",
            period: "forever",
            desc: "Basic insights for casual investors",
            features: [
                "Basic SIP & Lumpsum Calculators",
                "Public Market News & Blogs",
                "Portfolio Tracking (1 Portfolio)",
                "Daily Market Summary"
            ],
            isCurrent: user?.subscription !== 'premium',
            premium: false
        },
        {
            name: "TRADAI One",
            price: "₹999",
            period: "per quarter",
            desc: "Institutional-grade wealth management",
            features: [
                "Priority Trade Ideas (Ai Research)",
                "TRADAI AI Personal Assistant",
                "Unlimited Portfolio Audits",
                "Exclusive Academy Sessions",
                "Dedicated Relationship Manager",
                "Custom Performance Reports"
            ],
            isCurrent: user?.subscription === 'premium',
            premium: true,
            popular: true
        }
    ];

    return (
        <main className="min-h-screen bg-black text-white">
            <Navbar />
            <section className="pt-32 pb-24 px-6 text-center">
                <div className="max-w-4xl mx-auto mb-20">
                    <motion.h1
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-5xl md:text-7xl font-black mb-6"
                    >
                        One Plan. <span className="text-gradient">Unlimited Superpowers.</span>
                    </motion.h1>
                    <p className="text-xl text-gray-400">Choose the plan that fits your wealth journey. Upgrade to TRADAI One for the ultimate edge.</p>
                </div>

                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 px-4">
                    {plans.map((plan, idx) => (
                        <motion.div
                            key={plan.name}
                            initial={{ opacity: 0, x: idx === 0 ? -30 : 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`relative p-10 rounded-[48px] border text-left flex flex-col ${plan.premium ? 'bg-secondary border-accent-orange shadow-[0_0_50px_rgba(231,137,50,0.15)]' : 'bg-secondary/40 border-white/10'
                                }`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-accent-gradient text-black px-4 py-1 rounded-full text-xs font-black tracking-widest uppercase">
                                    Most Popular
                                </div>
                            )}

                            <div className="mb-10">
                                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                                <p className="text-gray-500 text-sm mb-6">{plan.desc}</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-5xl font-black">{plan.price}</span>
                                    <span className="text-gray-500">{plan.period}</span>
                                </div>
                            </div>

                            <div className="space-y-4 mb-12 flex-1">
                                {plan.features.map(feature => (
                                    <div key={feature} className="flex gap-3 items-center text-gray-300">
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${plan.premium ? 'bg-accent-orange/20 text-accent-orange' : 'bg-white/10 text-gray-500'}`}>
                                            <Check size={12} strokeWidth={3} />
                                        </div>
                                        <span>{feature}</span>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => plan.premium && handleUpgrade('premium')}
                                disabled={plan.isCurrent || (loading && plan.premium)}
                                className={`w-full py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${plan.isCurrent ? 'bg-white/10 text-gray-500 cursor-default' :
                                    plan.premium ? 'bg-accent-gradient text-black hover:scale-[1.02]' : 'bg-white/5 border border-white/10 hover:bg-white/10'
                                    }`}>
                                {loading && plan.premium ? (
                                    <><Loader2 className="animate-spin" size={20} /> Processing...</>
                                ) : (
                                    <>{plan.isCurrent ? 'Current Plan' : plan.premium ? 'Upgrade Now' : 'Select Plan'} <ArrowRight size={20} /></>
                                )}
                            </button>
                        </motion.div>
                    ))}
                </div>

                {/* Payment Methods */}
                <div className="mt-24 text-center">
                    <p className="text-gray-500 text-sm uppercase tracking-widest mb-8">Secure Payments With</p>
                    <div className="flex flex-wrap justify-center items-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/8/89/Razorpay_logo.svg" alt="Razorpay" className="h-6" />
                        <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" alt="Stripe" className="h-6" />
                        <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo.png" alt="UPI" className="h-6" />
                    </div>
                </div>
            </section>
            <Footer />
        </main>
    );
};

export default Pricing;
