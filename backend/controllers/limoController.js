const axios = require('axios');

exports.proxyLimo = async (req, res) => {
    try {
        const { topic } = req.body;

        const response = await axios.post('https://n8n-32uz.onrender.com/webhook/market-research',
            { topic },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            }
        );

        res.json(response.data);
    } catch (error) {
        console.error('Limo AI Proxy Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to connect to AI research engine.'
        });
    }
};
