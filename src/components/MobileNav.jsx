import { Link, useLocation } from "react-router-dom";
import { Home, TrendingUp, Sparkles, User, Briefcase } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "../utils/cn";

const MobileNav = () => {
    const location = useLocation();
    
    const navItems = [
        { name: "Home", icon: Home, href: "/" },
        { name: "Research", icon: TrendingUp, href: "/research" },
        { name: "Limo AI", icon: Sparkles, href: "/limo-ai" },
        { name: "One", icon: Briefcase, href: "/liquide-one" },
        { name: "Profile", icon: User, href: "/profile" },
    ];

    const isActive = (href) => location.pathname === href;

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-[60] md:hidden px-4 pb-4 pt-2 bottom-nav-blur border-t border-white/5">
            <div className="max-w-md mx-auto flex items-center justify-around bg-white/5 rounded-3xl p-1.5 border border-white/10 backdrop-blur-2xl">
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        to={item.href}
                        className={cn(
                            "relative flex flex-col items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl transition-all duration-300",
                            isActive(item.href) ? "text-white" : "text-gray-500"
                        )}
                    >
                        {isActive(item.href) && (
                            <motion.div
                                layoutId="mobileNavActive"
                                className="absolute inset-0 bg-accent-gradient rounded-2xl -z-10"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        <item.icon 
                            size={20} 
                            strokeWidth={isActive(item.href) ? 3 : 2} 
                            className={cn(
                                "transition-transform duration-300",
                                isActive(item.href) ? "scale-110 text-black" : "scale-100"
                            )}
                        />
                        <span className={cn(
                            "text-[10px] font-black uppercase tracking-widest transition-opacity duration-300",
                            isActive(item.href) ? "text-black" : "text-gray-500"
                        )}>
                            {item.name}
                        </span>
                    </Link>
                ))}
            </div>
        </nav>
    );
};

export default MobileNav;
