import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import LeadForm from "../components/LeadForm";
import { Check, Star, Shield, Zap, TrendingUp, BarChart, Bell } from "lucide-react";

const LiquideOne = () => {
    const superpowers = [
        {
            icon: <Zap className="text-accent-yellow" />,
            title: "Priority Trade Ideas",
            desc: "Get institutional-grade research-backed trade ideas before anyone else."
        },
        {
            icon: <Shield className="text-accent-orange" />,
            title: "Portfolio Safeguard",
            desc: "Advanced risk management tools to protect your capital from market volatility."
        },
        {
            icon: <TrendingUp className="text-green-500" />,
            title: "Wealth Management",
            desc: "Personalized guidance from Ai-registered experts to scale your wealth."
        },
        {
            icon: <BarChart className="text-blue-500" />,
            title: "Deep Portfolio Audit",
            desc: "A comprehensive health check with actionable insights for every stock."
        },
        {
            icon: <Bell className="text-purple-500" />,
            title: "Real-time Alerts",
            desc: "Instant notifications for buy/sell signals and critical market news."
        },
        {
            icon: <Star className="text-accent-yellow" />,
            title: "Dedicated Support",
            desc: "Priority access to our research team and a dedicated relationship manager."
        }
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <main className="min-h-screen bg-black text-white">
            <Navbar />

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-6 relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-accent-orange/5 blur-[120px] rounded-full -z-10" />
                <div className="max-w-7xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                        className="inline-block px-4 py-2 rounded-full border border-accent-orange/20 bg-accent-orange/5 text-accent-orange font-bold text-sm mb-6"
                    >
                        liquide ONE
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                        className="text-5xl md:text-8xl font-black mb-8 leading-tight"
                    >
                        Unlock <span className="text-gradient">6 Superpowers</span> <br /> for Your Wealth
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.8 }}
                        className="text-xl text-gray-400 max-w-3xl mx-auto mb-12"
                    >
                        Experience the pinnacle of smart investing. liquide One is our flagship
                        subscription designed for serious investors who demand the best insights.
                    </motion.p>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-accent-gradient text-black px-10 py-5 rounded-2xl font-bold text-xl shadow-[0_0_30px_rgba(231,137,50,0.3)]"
                    >
                        Get liquide One Now
                    </motion.button>
                </div>
            </section>

            {/* Superpowers Grid */}
            <section className="py-24 px-6 bg-secondary/30">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                    >
                        {superpowers.map((power, idx) => (
                            <motion.div
                                key={idx}
                                variants={itemVariants}
                                className="p-8 bg-black/40 border border-white/5 rounded-[40px] hover:border-accent-orange/30 transition-all group"
                            >
                                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    {power.icon}
                                </div>
                                <h3 className="text-2xl font-bold mb-4">{power.title}</h3>
                                <p className="text-gray-500 leading-relaxed">{power.desc}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Stats Table Section */}
            <section className="py-24 px-6">
                <div className="max-w-5xl mx-auto text-center">
                    <h2 className="text-4xl md:text-5xl font-bold mb-16">Why Users Trust <span className="text-gradient">liquide One</span></h2>
                    <div className="bg-secondary rounded-[40px] border border-white/10 overflow-hidden">
                        <div className="grid grid-cols-2 border-b border-white/5">
                            <div className="p-8 font-bold border-r border-white/5">Features</div>
                            <div className="p-8 font-bold text-accent-orange">liquide One</div>
                        </div>
                        {[
                            "Institutional Grade Research",
                            "Priority Trade Ideas",
                            "Personal Relationship Manager",
                            "Unlimited Portfolio Health Checks",
                            "Exclusive Market Webinars",
                            "Advanced Stock Screener"
                        ].map((feature, idx) => (
                            <div key={idx} className="grid grid-cols-2 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                                <div className="p-6 text-left pl-12 text-gray-400">{feature}</div>
                                <div className="p-6 flex items-center justify-center">
                                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                        <Check size={14} className="text-black stroke-[3]" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA Form */}
            <section className="py-24 px-6 relative overflow-hidden">
                <div className="max-w-4xl mx-auto bg-accent-gradient p-[1px] rounded-[48px]">
                    <div className="bg-black rounded-[48px] p-8 md:p-16 flex flex-col items-center text-center">
                        <h2 className="text-4xl md:text-5xl font-black mb-6">Ready to Supercharge Your Portfolio?</h2>
                        <p className="text-gray-400 mb-12 max-w-xl text-lg">
                            Join thousands of premium investors. Fill the form below to get a personalized demo.
                        </p>
                        <div className="w-full max-w-md">
                            <LeadForm source="liquide-one-page" />
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
};

export default LiquideOne;
