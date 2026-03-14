import { motion } from "framer-motion";
import LeadForm from "../components/LeadForm";
import { Check } from "lucide-react";

const LiquideOnePreview = () => {
    const benefits = [
        "Personalized Wealth Management",
        "Ai Registered Research Advice",
        "Priority Access to Trade Ideas",
        "Dedicated Relationship Manager",
        "Comprehensive Portfolio Audit",
        "Exclusive Market News & Insights"
    ];

    return (
        <section className="py-14 sm:py-24 px-4 sm:px-6 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent-orange/5 blur-[150px] -z-10" />

            <div className="max-w-7xl mx-auto bg-secondary rounded-[32px] sm:rounded-[48px] border border-white/10 p-6 sm:p-10 md:p-16">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-16 items-center">
                    <div>
                        <div className="inline-block px-4 py-2 rounded-full border border-accent-orange/20 bg-accent-orange/5 text-accent-orange font-bold text-sm mb-6 uppercase tracking-wider">
                            Premium Subscription
                        </div>
                        <h2 className="text-3xl sm:text-4xl md:text-6xl font-extrabold mb-6 sm:mb-8">
                            Experience <span className="text-gradient">TRADAI One</span>
                        </h2>
                        <p className="text-gray-400 text-base sm:text-lg mb-8 sm:mb-10">
                            Go beyond retail investing. Get institutional-grade research and
                            personalized guidance to scale your wealth with confidence.
                        </p>

                        <ul className="space-y-4 mb-8">
                            {benefits.map((benefit) => (
                                <li key={benefit} className="flex items-center gap-3 text-gray-300">
                                    <div className="w-6 h-6 rounded-full bg-accent-gradient flex items-center justify-center text-black">
                                        <Check size={14} strokeWidth={3} />
                                    </div>
                                    {benefit}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="bg-black/40 backdrop-blur-xl p-6 sm:p-8 rounded-[24px] sm:rounded-[32px] border border-white/10">
                        <h3 className="text-2xl font-bold mb-2">Speak to an Expert</h3>
                        <p className="text-gray-500 mb-8">Fill the form below and we'll call you back.</p>
                        <LeadForm source="liquide-one-home" />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default LiquideOnePreview;
