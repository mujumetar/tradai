import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Linkedin, Twitter, ExternalLink } from "lucide-react";

const About = () => {
    const team = [
        { name: "Anish Shankh", role: "Co-Founder", image: "https://i.pravatar.cc/300?u=anish" },
        { name: "Kunal Jha", role: "Co-Founder", image: "https://i.pravatar.cc/300?u=kunal" },
        { name: "Siddharth Sharma", role: "Head of Research", image: "https://i.pravatar.cc/300?u=sid" },
        { name: "Priya Varma", role: "Product Lead", image: "https://i.pravatar.cc/300?u=priya" },
    ];

    return (
        <main className="min-h-screen bg-black text-white">
            <Navbar />

            <section className="pt-32 pb-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative h-[400px] md:h-[600px] rounded-[64px] overflow-hidden mb-24"
                    >
                        <img
                            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1200"
                            className="absolute inset-0 w-full h-full object-cover"
                            alt="Team Office"
                        />
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-center p-8">
                            <div>
                                <h1 className="text-5xl md:text-8xl font-black mb-6">Changing the Way <br /> <span className="text-gradient">India Invests</span></h1>
                                <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                                    We are on a mission to democratize institutional-grade research and provide
                                    personalized investment guidance to every Indian household.
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center mb-32 px-4">
                        <div>
                            <h2 className="text-4xl font-bold mb-8">Our Journey</h2>
                            <p className="text-gray-400 text-lg leading-relaxed mb-6">
                                Founded in 2021, TRADAI was born out of a simple observation: retail investors
                                lack the tools and experts that institutional giants take for granted.
                            </p>
                            <p className="text-gray-400 text-lg leading-relaxed">
                                By combining advanced AI (TRADAI AI) with human expertise from Ai-registered
                                analysts, we've built an ecosystem that empowers 3.5 million+ users to
                                make data-driven decisions.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-8">
                            <div className="p-8 bg-secondary rounded-[40px] border border-white/5">
                                <p className="text-4xl font-bold text-gradient mb-2">3.5M+</p>
                                <p className="text-gray-500 text-sm">Active Downloads</p>
                            </div>
                            <div className="p-8 bg-secondary rounded-[40px] border border-white/5">
                                <p className="text-4xl font-bold text-accent-orange mb-2">₹2.5K Cr</p>
                                <p className="text-gray-500 text-sm">Assets Tracked</p>
                            </div>
                            <div className="p-8 bg-secondary rounded-[40px] border border-white/5">
                                <p className="text-4xl font-bold text-accent-yellow mb-2">50+</p>
                                <p className="text-gray-500 text-sm">Expert Researchers</p>
                            </div>
                            <div className="p-8 bg-secondary rounded-[40px] border border-white/5">
                                <p className="text-4xl font-bold text-green-500 mb-2">4.8</p>
                                <p className="text-gray-500 text-sm">Avg User Rating</p>
                            </div>
                        </div>
                    </div>

                    <div className="mb-32">
                        <h2 className="text-4xl font-bold text-center mb-16">The Brains Behind <span className="text-gradient">TRADAI</span></h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {team.map((member, idx) => (
                                <motion.div
                                    key={member.name}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="group relative"
                                >
                                    <div className="aspect-[4/5] rounded-[40px] overflow-hidden border border-white/10 mb-6">
                                        <img src={member.image} alt={member.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center hover:bg-accent-orange transition-colors">
                                                <Linkedin size={20} />
                                            </button>
                                            <button className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center hover:bg-accent-yellow transition-colors text-black">
                                                <Twitter size={20} />
                                            </button>
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-bold mb-1">{member.name}</h3>
                                    <p className="text-gray-500">{member.role}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
};

export default About;
