const executionService = require('../services/executionService');

exports.executeCode = async (req, res) => {
    const { language, code, input } = req.body;

    if (!language || !code) {
        return res.status(400).json({ success: false, output: 'Language and code are required.' });
    }

    try {
        const result = await executionService.executeCode(language, code, input);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, output: 'Internal server error during execution.' });
    }
};
