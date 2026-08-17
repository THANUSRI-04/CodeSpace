require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const programRoutes = require('./routes/programRoutes');
const folderRoutes = require('./routes/folderRoutes');
const executionRoutes = require('./routes/executionRoutes');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
    cors: {
        origin: true,
        credentials: true
    }
});

// Pass IO to the execution service
const executionService = require('./services/executionService');
executionService.initSocketIO(io);

// Middleware
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/programs', programRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/execute', executionRoutes);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
