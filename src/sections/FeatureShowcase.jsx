import { motion } from "framer-motion";

const features = [
    {
        title: "Trade Ideas",
        description: "Get curated, research-backed trade ideas from Ai registered analysts across all market caps. Tailored signals designed for consistent alpha.",
        image: "https://images.unsplash.com/photo-1611974717482-9625b7eeed70?auto=format&fit=crop&q=80&w=800",
        reverse: false,
        color: "from-orange-500/20"
    },
    {
        title: "Portfolio Health",
        description: "Connect your broker and get a comprehensive health check for your portfolio. Identify risks, sector overlaps, and growth potential in one click.",
        image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800",
        reverse: true,
        color: "from-blue-500/20"
    },
    {
        title: "TRADAI One",
        description: "The gold standard of investing. Access flagship wealth management, priority execution support, and exclusive market insights.",
        image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800",
        reverse: false,
        color: "from-purple-500/20"
    }
];

const FeatureShowcase = () => {
    return (
        <section className="py-16 sm:py-24 lg:py-32 px-4 sm:px-6 bg-black relative">
            <div className="max-w-7xl mx-auto space-y-20 sm:space-y-32 lg:space-y-48">
                {features.map((feature, index) => (
                    <div
                        key={index}
                        className={`group flex flex-col ${feature.reverse ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-10 sm:gap-14 lg:gap-20 touch-card`}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-80px" }}
                            transition={{ duration: 0.8 }}
                            className="flex-1 w-full"
                        >
                            <div className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-5 sm:mb-6">
                                Feature {index + 1}
                            </div>
                            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-5 sm:mb-8 tracking-tighter">
                                {feature.title}
                            </h2>
                            <p className="text-base sm:text-xl text-gray-400 mb-7 sm:mb-10 leading-relaxed font-medium">
                                {feature.description}
                            </p>
                            <button className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 px-5 sm:px-6 py-3 rounded-2xl transition-all group-hover:border-white/20">
                                <span className="font-black text-sm uppercase tracking-widest text-white">Explore Feature</span>
                                <span className="text-orange-500 group-hover:translate-x-1 transition-transform">→</span>
                            </button>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true, margin: "-80px" }}
                            transition={{ duration: 0.8 }}
                            className="flex-1 w-full relative"
                        >
                            <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} to-transparent blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000`} />
                            <div className="aspect-[4/3] rounded-[32px] sm:rounded-[48px] overflow-hidden border border-white/10 group-hover:border-white/20 transition-colors shadow-2xl relative z-10">
                                <img
                                    src={feature.image}
                                    alt={feature.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1.5s] ease-out"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        </motion.div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default FeatureShowcase;
