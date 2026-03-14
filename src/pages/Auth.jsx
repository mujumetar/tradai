import { useState } from "react";
import api from "../utils/api";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, Phone, ArrowRight, Github } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

import { getDeviceMeta } from "../utils/deviceFingerprint";

const Auth = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        mobile: ""
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const endpoint = isLogin ? '/users/login' : '/users';
            const deviceMeta = getDeviceMeta();
            const { data } = await api.post(endpoint, { ...formData, ...deviceMeta });

            localStorage.setItem("user", JSON.stringify(data));

            if (data.role === 'admin') {
                navigate('/admin');
            } else {
                navigate('/');
            }
        } catch (err) {
            alert(err.response?.data?.message || "Authentication failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-black text-white flex flex-col">
            <Navbar />
            <div className="flex-1 flex items-center justify-center px-6 pt-24 pb-12">
                <div className="absolute inset-0 bg-accent-orange/5 blur-[150px] -z-10" />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md bg-secondary border border-white/10 rounded-[48px] p-8 md:p-12 shadow-2xl relative overflow-hidden"
                >
                    <div className="text-center mb-10">
                        <h1 className="text-4xl font-black mb-3">
                            {isLogin ? "Welcome Back" : "Join TRADAI"}
                        </h1>
                        <p className="text-gray-500">
                            {isLogin ? "Use admin@tradai.com / admin123" : "Start your wealth journey today"}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <AnimatePresence mode="wait">
                            {!isLogin && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-6"
                                >
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                                        <input
                                            type="text"
                                            placeholder="Full Name"
                                            required
                                            className="w-full bg-black border border-white/10 rounded-2xl px-12 py-4 outline-none focus:border-accent-orange transition-colors"
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                                        <input
                                            type="tel"
                                            placeholder="Mobile Number"
                                            required
                                            className="w-full bg-black border border-white/10 rounded-2xl px-12 py-4 outline-none focus:border-accent-orange transition-colors"
                                            onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                            <input
                                type="email"
                                placeholder="Email Address"
                                required
                                className="w-full bg-black border border-white/10 rounded-2xl px-12 py-4 outline-none focus:border-accent-orange transition-colors"
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>

                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                            <input
                                type="password"
                                placeholder="Password"
                                required
                                className="w-full bg-black border border-white/10 rounded-2xl px-12 py-4 outline-none focus:border-accent-orange transition-colors"
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-accent-gradient text-black py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                            {loading ? "Authenticating..." : (isLogin ? "Sign In" : "Create Account")}
                            {!loading && <ArrowRight size={20} />}
                        </button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-white/5 text-center">
                        <p className="text-gray-500 mb-6">Or continue with</p>
                        <div className="flex gap-4">
                            <button className="flex-1 bg-black border border-white/10 py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-white/5 transition-colors">
                                <Github size={20} /> GitHub
                            </button>
                            <button className="flex-1 bg-black border border-white/10 py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-white/5 transition-colors font-bold text-accent-yellow">
                                Google
                            </button>
                        </div>
                    </div>

                    <div className="mt-8 text-center">
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-accent-orange font-bold hover:underline"
                        >
                            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                        </button>
                    </div>
                </motion.div>
            </div>
        </main>
    );
};

export default Auth;
