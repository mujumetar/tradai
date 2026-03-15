import { Link } from "react-router-dom";
import { Twitter, Instagram, Linkedin, Youtube } from "lucide-react";
import { useEffect, useState } from "react";

const Footer = () => {
    const [dynamicFooterLinks, setDynamicFooterLinks] = useState(null);

    useEffect(() => {
        fetch("/api/public/ui-config")
            .then(res => res.json())
            .then(data => {
                if (data.FOOTER_LINKS && Array.isArray(data.FOOTER_LINKS) && data.FOOTER_LINKS.length > 0) {
                    // Convert simple array back to expected CATEGORY format for Footer compatibility
                    setDynamicFooterLinks({ "Quick Links": data.FOOTER_LINKS });
                } else if (data.FOOTER_LINKS && typeof data.FOOTER_LINKS === 'object' && Object.keys(data.FOOTER_LINKS).length > 0) {
                    setDynamicFooterLinks(data.FOOTER_LINKS);
                }
            })
            .catch(err => console.error(err));
    }, []);

    const footerLinks = dynamicFooterLinks || {
        Company: [
            { name: "About Us", href: "/about" },
            { name: "Contact Us", href: "/contact" },
            { name: "Careers", href: "/careers" },
            { name: "Privacy Policy", href: "/privacy" },
        ],
        Products: [
            { name: "TRADAI One", href: "/liquide-one" },
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
        <footer className="bg-black border-t border-white/10 pt-12 sm:pt-16 pb-8 px-4 sm:px-6">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-8 sm:gap-12 mb-12 sm:mb-16">
                    {/* Brand Info — full width on mobile, 2 cols on lg */}
                    <div className="col-span-2 lg:col-span-2">
                        <Link to="/" className="flex items-center gap-2 mb-5 sm:mb-6">
                            <div className="w-8 h-8 bg-accent-gradient rounded-lg flex items-center justify-center font-bold text-black text-xl flex-shrink-0">
                                T
                            </div>
                            <span className="text-2xl font-bold tracking-tight text-white">TRADAI</span>
                        </Link>
                        <p className="text-gray-400 max-w-sm mb-6 sm:mb-8 text-sm leading-relaxed">
                            Empowering India's wealth journey through smart investment ideas,
                            robust portfolio health checks, and expert guidance.
                        </p>
                        <div className="flex gap-3 sm:gap-4">
                            {[
                                { Icon: Twitter, label: "Twitter" },
                                { Icon: Linkedin, label: "LinkedIn" },
                                { Icon: Instagram, label: "Instagram" },
                                { Icon: Youtube, label: "YouTube" },
                            ].map(({ Icon, label }) => (
                                <a
                                    key={label}
                                    href="#"
                                    aria-label={label}
                                    className="w-10 h-10 sm:w-10 sm:h-10 rounded-full border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-white/40 transition-all touch-active"
                                >
                                    <Icon size={18} />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Link columns — each takes 1 col on mobile grid */}
                    {Object.entries(footerLinks).map(([title, links]) => (
                        <div key={title}>
                            <h4 className="text-white font-semibold mb-4 sm:mb-6 text-sm sm:text-base">{title}</h4>
                            <ul className="space-y-3 sm:space-y-4">
                                {links.map((link) => (
                                    <li key={link.name}>
                                        <Link
                                            to={link.href}
                                            className="text-gray-400 hover:text-white transition-colors text-xs sm:text-sm py-1 block touch-active"
                                        >
                                            {link.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="border-t border-white/10 pt-6 sm:pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
                    <p className="text-gray-500 text-xs sm:text-sm">
                        © 2026 TRADAI. All rights reserved. Ai Registered Research Analyst.
                    </p>
                    <div className="flex gap-5 sm:gap-8">
                        <Link to="/terms" className="text-gray-500 hover:text-white text-xs sm:text-sm">Terms of Service</Link>
                        <Link to="/privacy" className="text-gray-500 hover:text-white text-xs sm:text-sm">Privacy Policy</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
