require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const programRoutes = require('./routes/programRoutes');
const folderRoutes = require('./routes/folderRoutes');
const executionRoutes = require('./routes/executionRoutes');

const app = express();

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/programs', programRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/execute', executionRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
