import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import api from "../utils/api";
import { ArrowRight, Clock, User, Share2, Loader2 } from "lucide-react";

const Blogs = () => {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchBlogs = async () => {
            try {
                const { data } = await api.get('/blogs');
                setArticles(data);
            } catch (err) {
                setError("Failed to load insights. Please try again later.");
            } finally {
                setLoading(false);
            }
        };
        fetchBlogs();
    }, []);

    if (loading) return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <Loader2 className="animate-spin text-accent-orange" size={48} />
        </div>
    );

    return (
        <main className="min-h-screen bg-black text-white">
            <Navbar />

            <section className="pt-32 pb-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-16">
                        <h1 className="text-5xl md:text-8xl font-black mb-6">Market <span className="text-gradient">Insights</span></h1>
                        <p className="text-xl text-gray-400 max-w-2xl">
                            Stay ahead of the curve with expert analysis, market news, and in-depth research articles.
                        </p>
                    </div>

                    {/* Featured Article */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="group relative h-[500px] rounded-[48px] overflow-hidden border border-white/10 mb-20 cursor-pointer"
                    >
                        <img
                            src={articles[0].image}
                            alt={articles[0].title}
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                        <div className="absolute bottom-0 left-0 p-8 md:p-16 max-w-3xl">
                            <span className="inline-block px-4 py-1 rounded-full bg-accent-orange text-black font-bold text-xs mb-6 uppercase tracking-widest">
                                {articles[0].category}
                            </span>
                            <h2 className="text-3xl md:text-5xl font-bold mb-6 group-hover:text-accent-orange transition-colors">
                                {articles[0].title}
                            </h2>
                            <div className="flex items-center gap-6 text-gray-300 text-sm">
                                <span className="flex items-center gap-2"><User size={16} className="text-accent-orange" /> {articles[0].author}</span>
                                <span className="flex items-center gap-2"><Clock size={16} className="text-accent-yellow" /> {articles[0].readTime}</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Article Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                        {articles.slice(1).map((article, idx) => (
                            <motion.article
                                key={article.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                className="group cursor-pointer"
                            >
                                <div className="aspect-[16/10] rounded-[32px] overflow-hidden border border-white/5 mb-6">
                                    <img
                                        src={article.image}
                                        alt={article.title}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                    />
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-accent-yellow text-xs font-bold uppercase tracking-widest">{article.category}</span>
                                        <span className="text-gray-500 text-xs">{article.date}</span>
                                    </div>
                                    <h3 className="text-2xl font-bold mb-4 group-hover:text-accent-orange transition-colors line-clamp-2">
                                        {article.title}
                                    </h3>
                                    <p className="text-gray-400 text-sm mb-6 line-clamp-3">
                                        {article.summary}
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <button className="flex items-center gap-2 font-bold text-sm group/btn">
                                            Read Article <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                                        </button>
                                        <button className="text-gray-500 hover:text-white transition-colors">
                                            <Share2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </motion.article>
                        ))}
                    </div>

                    {/* Newsletter */}
                    <div className="mt-32 bg-secondary rounded-[48px] p-12 md:p-20 border border-white/10 text-center">
                        <h2 className="text-4xl md:text-5xl font-bold mb-6">Subscribe to <span className="text-gradient">Market Beat</span></h2>
                        <p className="text-gray-400 mb-10 max-w-xl mx-auto">Get the daily dose of market insights delivered straight to your inbox.</p>
                        <form className="max-w-md mx-auto flex gap-4">
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="flex-1 bg-black border border-white/10 rounded-2xl px-6 outline-none focus:border-accent-orange"
                            />
                            <button className="bg-accent-gradient text-black px-8 py-4 rounded-2xl font-bold hover:opacity-90">
                                Join
                            </button>
                        </form>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
};

export default Blogs;
