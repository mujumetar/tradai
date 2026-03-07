import { Link } from "react-router-dom";
import { Facebook, Twitter, Instagram, Linkedin, Youtube } from "lucide-react";

const Footer = () => {
    const footerLinks = {
        Company: [
            { name: "About Us", href: "/about" },
            { name: "Contact Us", href: "/contact" },
            { name: "Careers", href: "/careers" },
            { name: "Privacy Policy", href: "/privacy" },
        ],
        Products: [
            { name: "liquide One", href: "/liquide-one" },
            // { name: "Academy", href: "/academy" },
            { name: "Calculators", href: "/calculators" },
            { name: "Wealth Management", href: "/wealth" },
        ],
        Resources: [
            { name: "Blogs", href: "/blogs" },
            { name: "FAQ", href: "/faq" },
            { name: "Trade Ideas", href: "/ideas" },
            { name: "Stock Analysis", href: "/analysis" },
        ],
    };

    return (
        <footer className="bg-black border-t border-white/10 pt-16 pb-8 px-6">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
                    {/* Brand Info */}
                    <div className="lg:col-span-2">
                        <Link to="/" className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 bg-accent-gradient rounded-lg flex items-center justify-center font-bold text-black text-xl">
                                L
                            </div>
                            <span className="text-2xl font-bold tracking-tight text-white">liquide</span>
                        </Link>
                        <p className="text-gray-400 max-w-sm mb-8">
                            Empowering India’s wealth journey through smart investment ideas,
                            robust portfolio health checks, and expert guidance.
                        </p>
                        <div className="flex gap-4">
                            <a href="#" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-white transition-all">
                                <Twitter size={20} />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-white transition-all">
                                <Linkedin size={20} />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-white transition-all">
                                <Instagram size={20} />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-white transition-all">
                                <Youtube size={20} />
                            </a>
                        </div>
                    </div>

                    {/* Links */}
                    {Object.entries(footerLinks).map(([title, links]) => (
                        <div key={title}>
                            <h4 className="text-white font-semibold mb-6">{title}</h4>
                            <ul className="space-y-4">
                                {links.map((link) => (
                                    <li key={link.name}>
                                        <Link
                                            to={link.href}
                                            className="text-gray-400 hover:text-white transition-colors text-sm"
                                        >
                                            {link.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-gray-500 text-sm">
                        © 2026 liquide. All rights reserved. Ai Registered Research Analyst.
                    </p>
                    <div className="flex gap-8">
                        <Link to="/terms" className="text-gray-500 hover:text-white text-sm">Terms of Service</Link>
                        <Link to="/privacy" className="text-gray-500 hover:text-white text-sm">Privacy Policy</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
