import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Lock, ArrowUpRight, Target, ShieldAlert, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import api from "../utils/api";
import PortfolioView from "./Portfolio";

const TradeIdeas = () => {
    const [activeTab, setActiveTab] = useState("portfolio");
    const [ideas, setIdeas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchIdeas = async () => {
            try {
                const { data } = await api.get('/trade-ideas');
                setIdeas(data);
            } catch (err) {
                setError("Failed to load research ideas.");
            } finally {
                setLoading(false);
            }
        };
        fetchIdeas();
    }, []);

    if (loading) return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <Zap className="text-accent-orange animate-pulse" size={48} />
        </div>
    );

    return (
        <main className="min-h-screen bg-black text-white">
            <Navbar />
            <section className="pt-24 sm:pt-32 pb-4 sm:pb-6 px-4 sm:px-6 max-w-7xl mx-auto border-b border-white/10 mb-6 sm:mb-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-4"
                        >
                            Market <span className="text-gradient">Research</span>
                        </motion.h1>
                        <p className="text-gray-400 text-sm sm:text-lg max-w-2xl">Expert-curated trade ideas backed by institutional-grade research and TRADAI AI. Ai Registered Advisory.</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 sm:gap-6 mt-8 sm:mt-10 overflow-x-auto no-scrollbar">
                    <button
                        onClick={() => setActiveTab('portfolio')}
                        className={`pb-4 text-sm sm:text-base font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === 'portfolio' ? 'border-accent-orange text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                    >
                        Live Portfolio Tracking
                    </button>
                    <button
                        onClick={() => setActiveTab('ideas')}
                        className={`pb-4 text-sm sm:text-base font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === 'ideas' ? 'border-accent-orange text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                    >
                        Trade Ideas
                    </button>
                </div>
            </section>

            {activeTab === 'ideas' ? (
                <section className="pb-16 sm:pb-24 px-4 sm:px-6 max-w-7xl mx-auto">
                    {error && <p className="text-red-500 mb-8">{error}</p>}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8">
                        {ideas.map((idea, idx) => (
                            <motion.div
                                key={idea.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.05 }}
                                className="group bg-secondary border border-white/5 rounded-[32px] sm:rounded-[40px] p-6 sm:p-8 hover:border-accent-orange/30 transition-all relative overflow-hidden touch-card touch-active"
                            >
                                {idea.isLocked && (
                                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-10 flex flex-col items-center justify-center p-6 sm:p-8 text-center">
                                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-accent-orange/20 rounded-full flex items-center justify-center mb-4">
                                            <Lock className="text-accent-orange" size={24} />
                                        </div>
                                        <h3 className="text-lg sm:text-xl font-bold mb-2">TRADAI One Exclusive</h3>
                                        <p className="text-gray-400 text-xs sm:text-sm mb-6">Restricted to premium members.</p>
                                        <Link to="/pricing" className="bg-accent-gradient text-black px-6 sm:px-8 py-2.5 sm:py-3 rounded-full font-bold text-sm hover:opacity-90 transition-opacity">
                                            Upgrade Now
                                        </Link>
                                    </div>
                                )}

                                <div className="flex justify-between items-start mb-5 sm:mb-6">
                                    <div className="bg-white/5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl border border-white/5">
                                        <span className="text-accent-orange font-black text-base sm:text-lg">{idea.ticker}</span>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.1em] ${idea.type === 'Buy' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
                                        }`}>
                                        {idea.type}
                                    </span>
                                </div>

                                <h3 className="text-lg sm:text-xl font-bold mb-4 line-clamp-1 group-hover:text-accent-orange transition-colors">{idea.title}</h3>

                                <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-5 sm:mb-6">
                                    <div className="bg-white/[0.03] p-3 sm:p-4 rounded-2xl border border-white/5">
                                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                                            <Target size={10} /> Target
                                        </p>
                                        <p className="font-black text-accent-yellow text-sm sm:text-base">{idea.target}</p>
                                    </div>
                                    <div className="bg-white/[0.03] p-3 sm:p-4 rounded-2xl border border-white/5">
                                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                                            <ShieldAlert size={10} /> Stop Loss
                                        </p>
                                        <p className="font-black text-white text-sm sm:text-base">{idea.stopLoss}</p>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center pt-5 sm:pt-6 border-t border-white/5">
                                    <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">{idea.horizon}</span>
                                    <button className="text-accent-orange font-black text-sm flex items-center gap-1.5 hover:gap-2.5 transition-all">
                                        View Logic <ArrowUpRight size={16} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>
            ) : (
                <PortfolioView />
            )}
            <Footer />
        </main>
    );
};

export default TradeIdeas;
