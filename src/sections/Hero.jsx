import { motion } from "framer-motion";
import { ArrowRight, Play, Star } from "lucide-react";

const Hero = () => {
    return (
        <section className="relative pt-24 sm:pt-32 pb-16 sm:pb-20 px-4 sm:px-6 overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-0 right-0 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-accent-orange/10 blur-[100px] sm:blur-[130px] rounded-full -z-10 translate-x-1/2 -translate-y-1/2 animate-pulse" />
            <div className="absolute bottom-0 left-0 w-[250px] sm:w-[500px] h-[250px] sm:h-[500px] bg-accent-yellow/5 blur-[100px] sm:blur-[120px] rounded-full -z-10 -translate-x-1/2 translate-y-1/2" />

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
                {/* ── Left: Text Content ── */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-xs sm:text-sm font-medium mb-6 sm:mb-8"
                    >
                        <span className="flex h-2 w-2 rounded-full bg-accent-orange animate-pulse flex-shrink-0" />
                        Empowering 3.5 Million+ Investors
                    </motion.div>

                    <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-[0.9] mb-6 sm:mb-8 tracking-tighter">
                        Invest with <span className="text-gradient block mt-1 sm:mt-2">Intelligence</span>
                    </h1>
                    <p className="text-base sm:text-xl text-gray-400 mb-8 sm:mb-10 max-w-lg leading-relaxed">
                        liquide helps you build wealth with institutional-grade research,
                        personalized trade ideas, and a powerful portfolio health checker.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-5">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="bg-accent-gradient text-black px-7 sm:px-10 py-4 sm:py-5 rounded-3xl font-black text-base sm:text-lg flex items-center justify-center gap-3 shadow-[0_10px_40px_rgba(249,115,22,0.3)]"
                        >
                            Get Started Now <ArrowRight size={20} />
                        </motion.button>
                        <motion.button
                            whileHover={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                            className="bg-black border border-white/10 text-white px-7 sm:px-10 py-4 sm:py-5 rounded-3xl font-black text-base sm:text-lg flex items-center justify-center gap-3 transition-colors"
                        >
                            <div className="p-2 bg-white/10 rounded-full"><Play size={16} fill="white" /></div> Watch Demo
                        </motion.button>
                    </div>

                    <div className="mt-10 sm:mt-16 flex flex-wrap items-center gap-6 sm:gap-8">
                        <div className="flex -space-x-3 sm:-space-x-4">
                            {[1, 2, 3, 4].map((i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.5 + (i * 0.1) }}
                                    className="w-9 h-9 sm:w-12 sm:h-12 rounded-full border-4 border-black bg-gradient-to-br from-gray-700 to-gray-900 shadow-xl"
                                />
                            ))}
                        </div>
                        <div>
                            <div className="flex items-center gap-1 sm:gap-1.5 text-accent-yellow mb-1">
                                {[1, 2, 3, 4, 5].map(i => <Star key={i} size={14} fill="currentColor" />)}
                                <span className="text-white font-black ml-1.5 sm:ml-2 text-base sm:text-lg">4.8/5</span>
                            </div>
                            <p className="text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-widest">App Store &amp; Play Store Ratings</p>
                        </div>
                    </div>
                </motion.div>

                {/* ── Right: Card Mockup ── */}
                <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 1, delay: 0.4 }}
                    className="relative w-full"
                >
                    {/* Floating Signal Chip — repositioned for mobile */}
                    <motion.div
                        drag
                        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                        animate={{ y: [-10, 10, -10], rotate: [-1, 1, -1] }}
                        transition={{ duration: 5, repeat: Infinity }}
                        className="absolute -top-4 sm:-top-10 right-2 sm:-right-10 bg-accent-gradient px-4 py-3 sm:p-6 sm:py-4 rounded-[24px] sm:rounded-[32px] shadow-3xl border border-white/20 cursor-grab active:cursor-grabbing z-20"
                    >
                        <p className="text-black font-black text-[9px] sm:text-[10px] uppercase tracking-widest mb-0.5 sm:mb-1">Live signal</p>
                        <p className="text-black text-base sm:text-xl font-black">RELIANCE <span className="text-xs sm:text-sm">+12%</span></p>
                    </motion.div>

                    {/* Card */}
                    <motion.div
                        animate={{ y: [0, -20, 0] }}
                        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                        className="relative bg-[#111] rounded-[40px] sm:rounded-[60px] border border-white/10 p-6 sm:p-10 shadow-3xl overflow-hidden group mt-6 sm:mt-0"
                    >
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-accent-gradient opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="flex justify-between items-start mb-8 sm:mb-12">
                            <div>
                                <h3 className="text-xl sm:text-3xl font-black mb-1 sm:mb-2">Portfolio Health</h3>
                                <p className="text-gray-500 font-bold text-[10px] sm:text-xs uppercase tracking-widest">Real-time analysis</p>
                            </div>
                            <div className="text-right">
                                <motion.span
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-4xl sm:text-5xl font-black text-green-400 block"
                                >
                                    84
                                </motion.span>
                                <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">Score</p>
                            </div>
                        </div>

                        <div className="space-y-5 sm:space-y-8">
                            {[
                                { label: "Diversification", value: 92, color: "bg-green-400" },
                                { label: "Risk Management", value: 78, color: "bg-accent-orange" },
                                { label: "Performance", value: 88, color: "bg-green-400" },
                            ].map((item) => (
                                <div key={item.label}>
                                    <div className="flex justify-between text-xs font-black uppercase tracking-widest mb-2 sm:mb-3">
                                        <span className="text-gray-500">{item.label}</span>
                                        <span className="text-white">{item.value}%</span>
                                    </div>
                                    <div className="w-full h-2.5 sm:h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            whileInView={{ width: `${item.value}%` }}
                                            transition={{ duration: 1.5, delay: 1, ease: "circOut" }}
                                            className={`h-full ${item.color} shadow-[0_0_15px_rgba(74,222,128,0.3)]`}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 sm:mt-12 pt-6 sm:pt-10 border-t border-white/5 grid grid-cols-2 gap-4 sm:gap-6 text-center">
                            <div className="p-4 sm:p-6 bg-white/[0.03] rounded-2xl sm:rounded-3xl border border-white/5">
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 sm:mb-2">Growth</p>
                                <p className="text-xl sm:text-2xl font-black text-green-400">+24.5%</p>
                            </div>
                            <div className="p-4 sm:p-6 bg-white/[0.03] rounded-2xl sm:rounded-3xl border border-white/5">
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 sm:mb-2">Volatility</p>
                                <p className="text-xl sm:text-2xl font-black">Low</p>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
};

export default Hero;
