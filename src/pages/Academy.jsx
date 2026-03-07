import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import api from "../utils/api";
import { Search, PlayCircle, Calendar, Users, Loader2, Lock } from "lucide-react";

const Academy = () => {
    const [sessions, setSessions] = useState([]);
    const [activeTab, setActiveTab] = useState("upcoming");
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSessions = async () => {
            try {
                const { data } = await api.get('/academy');
                setSessions(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchSessions();
    }, []);

    if (loading) return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <Loader2 className="animate-spin text-accent-orange" size={48} />
        </div>
    );

    const filteredSessions = sessions.filter(s =>
        s.status === activeTab &&
        (s.title.toLowerCase().includes(searchQuery.toLowerCase()) || s.tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <main className="min-h-screen bg-black text-white">
            <Navbar />

            <section className="pt-32 pb-12 px-6">
                <div className="max-w-7xl mx-auto text-center mb-16">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl md:text-7xl font-bold mb-6"
                    >
                        liquide <span className="text-gradient">Academy</span>
                    </motion.h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        Learn from the experts. Master the art of investing with our curated
                        live sessions and resource library.
                    </p>
                </div>

                <div className="max-w-7xl mx-auto mb-12">
                    <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
                        {/* Tabs */}
                        <div className="flex bg-secondary p-1 rounded-2xl border border-white/5">
                            {['upcoming', 'past', 'resources'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-8 py-3 rounded-xl font-bold transition-all capitalize ${activeTab === tab ? 'bg-accent-gradient text-black shadow-lg' : 'text-gray-400 hover:text-white'
                                        }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {/* Search */}
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                            <input
                                type="text"
                                placeholder="Search sessions or topics..."
                                className="w-full bg-secondary border border-white/10 rounded-2xl px-12 py-4 outline-none focus:border-accent-orange transition-colors"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-24">
                    <AnimatePresence mode="popLayout">
                        {filteredSessions.map((session) => (
                            <motion.div
                                key={session.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className={`bg-secondary rounded-[32px] overflow-hidden border border-white/10 transition-all group cursor-pointer ${session.isLocked ? 'grayscale opacity-80' : 'hover:border-accent-orange/30'
                                    }`}
                            >
                                <div className="relative aspect-video">
                                    <img src={session.image} alt={session.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        {session.isLocked ? <Lock size={64} className="text-accent-yellow" /> : <PlayCircle size={64} className="text-white" />}
                                    </div>
                                    <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-bold text-accent-yellow uppercase tracking-wider">
                                        {session.tag}
                                    </div>
                                </div>
                                <div className="p-8">
                                    <h3 className="text-xl font-bold mb-4 line-clamp-2 min-h-[3.5rem] group-hover:text-accent-orange transition-colors">
                                        {session.title}
                                    </h3>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 rounded-full bg-gray-800 border border-white/10 overflow-hidden">
                                            <img src={`https://i.pravatar.cc/100?u=${session.instructor}`} alt={session.instructor} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold">{session.instructor}</p>
                                            <p className="text-xs text-gray-500">Stock Market Expert</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/5">
                                        <div className="flex items-center gap-2 text-xs text-gray-400">
                                            <Calendar size={14} className="text-accent-orange" />
                                            {session.date}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-400">
                                            <Users size={14} className="text-accent-yellow" />
                                            {session.attendees} enrolled
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {filteredSessions.length === 0 && (
                        <div className="col-span-full py-20 text-center text-gray-500">
                            No sessions found matching your criteria.
                        </div>
                    )}
                </div>
            </section>

            <Footer />
        </main>
    );
};

export default Academy;
