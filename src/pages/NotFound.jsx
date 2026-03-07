import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { AlertCircle, Home } from "lucide-react";

const NotFound = () => {
    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md"
            >
                <div className="w-20 h-20 bg-orange-500/20 rounded-3xl flex items-center justify-center mx-auto mb-8">
                    <AlertCircle size={40} className="text-orange-500" />
                </div>
                <h1 className="text-6xl font-black mb-4 tracking-tighter">404</h1>
                <h2 className="text-2xl font-bold mb-6">Lost in the Markets?</h2>
                <p className="text-gray-500 mb-10 leading-relaxed">
                    The page you're looking for doesn't exist or has been moved.
                    Let's get you back to the trading community.
                </p>
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 bg-accent-gradient text-black font-black px-8 py-4 rounded-2xl hover:opacity-90 transition-opacity"
                >
                    <Home size={20} />
                    Back to Home
                </Link>
            </motion.div>

            {/* Background elements */}
            <div className="fixed -bottom-20 -left-20 w-96 h-96 bg-orange-500/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="fixed -top-20 -right-20 w-96 h-96 bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />
        </div>
    );
};

export default NotFound;
