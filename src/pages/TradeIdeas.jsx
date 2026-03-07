import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Lock, ArrowUpRight, Target, ShieldAlert, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import api from "../utils/api";

const TradeIdeas = () => {
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
            <section className="pt-32 pb-24 px-6 max-w-7xl mx-auto">
                <div className="mb-16">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-6xl font-black mb-4"
                    >
                        Market <span className="text-gradient">Research & Ideas</span>
                    </motion.h1>
                    <p className="text-gray-400 text-lg max-w-2xl">Expert-curated trade ideas backed by institutional-grade research and LiMo AI. Ai Registered Advisory.</p>
                </div>

                {error && <p className="text-red-500 mb-8">{error}</p>}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {ideas.map((idea, idx) => (
                        <motion.div
                            key={idea.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="group bg-secondary border border-white/5 rounded-[40px] p-8 hover:border-accent-orange/30 transition-all relative overflow-hidden"
                        >
                            {idea.isLocked && (
                                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-8 text-center">
                                    <div className="w-16 h-16 bg-accent-orange/20 rounded-full flex items-center justify-center mb-4">
                                        <Lock className="text-accent-orange" size={32} />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">liquide One Exclusive</h3>
                                    <p className="text-gray-400 text-sm mb-6">This research is restricted to premium members.</p>
                                    <Link to="/pricing" className="bg-accent-gradient text-black px-8 py-3 rounded-full font-bold hover:opacity-90 transition-opacity">
                                        Upgrade to Unlock
                                    </Link>
                                </div>
                            )}

                            <div className="flex justify-between items-start mb-6">
                                <div className="bg-white/5 px-4 py-2 rounded-xl">
                                    <span className="text-accent-orange font-bold text-lg">{idea.ticker}</span>
                                </div>
                                <span className={`px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${idea.type === 'Buy' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
                                    }`}>
                                    {idea.type}
                                </span>
                            </div>

                            <h3 className="text-xl font-bold mb-4 line-clamp-1">{idea.title}</h3>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                                        <Target size={12} /> Target
                                    </p>
                                    <p className="font-bold text-accent-yellow">{idea.target}</p>
                                </div>
                                <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                                        <ShieldAlert size={12} /> Stop Loss
                                    </p>
                                    <p className="font-bold text-gray-400">{idea.stoploss}</p>
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-6 border-t border-white/5">
                                <span className="text-sm text-gray-500 font-medium">{idea.horizon}</span>
                                <button className="text-accent-orange font-bold flex items-center gap-1 hover:gap-2 transition-all">
                                    View Logic <ArrowUpRight size={18} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>
            <Footer />
        </main>
    );
};

export default TradeIdeas;
