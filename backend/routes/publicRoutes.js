const express = require('express');
const router = express.Router();
const SystemSettings = require('../models/SystemSettings');

router.get('/ui-config', async (req, res) => {
    try {
        const settings = await SystemSettings.find({
            key: { $in: ['SIDEBAR_LINKS', 'FOOTER_LINKS', 'ROLE_ROUTES_ADMIN', 'ROLE_ROUTES_MANAGER', 'ROLE_ROUTES_SUPPORT'] }
        });
        
        const config = {
            SIDEBAR_LINKS: [
                { name: "Home", href: "/" },
                { name: "Blogs", href: "/blogs" },
                { name: "TRADAI One", href: "/liquide-one" },
                { name: "Research", href: "/research" },
                { name: "Pricing", href: "/pricing" },
                { name: "About", href: "/about" },
            ],
            FOOTER_LINKS: {
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
            }
        };
        settings.forEach(s => {
            config[s.key] = s.value;
        });

        res.status(200).json(config);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
