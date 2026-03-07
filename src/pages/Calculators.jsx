import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SIPCalculator from "../components/SIPCalculator";
import { motion } from "framer-motion";

const Calculators = () => {
    return (
        <div className="min-h-screen bg-black text-white">
            <Navbar />

            <section className="pt-32 pb-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-5xl md:text-7xl font-bold mb-6"
                        >
                            Financial <span className="text-gradient">Calculators</span>
                        </motion.h1>
                        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                            Plan your future with precision. Use our suite of financial tools
                            to estimate your returns and reach your goals faster.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                        <SIPCalculator />

                        <div className="space-y-8">
                            <div className="bg-secondary/50 p-8 rounded-[32px] border border-white/10 hover:border-accent-orange/30 transition-colors">
                                <h4 className="text-xl font-bold mb-4">Why use an SIP Calculator?</h4>
                                <p className="text-gray-400 leading-relaxed">
                                    Systematic Investment Plan (SIP) allows you to invest small amounts
                                    periodically. Our calculator helps you visualize the power of
                                    compounding over long periods.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                {['Lumpsum', 'FD', 'RD', 'GST', 'PPF', 'SWP'].map((calc) => (
                                    <button
                                        key={calc}
                                        className="p-6 bg-secondary rounded-2xl border border-white/10 hover:border-accent-orange/30 transition-all font-bold text-lg"
                                    >
                                        {calc} Calculator
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default Calculators;
