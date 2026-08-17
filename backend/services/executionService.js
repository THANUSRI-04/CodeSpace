const fs = require('fs').promises;
const path = require('path');
const { exec, spawn } = require('child_process');
const { v4: uuidv4 } = require('uuid');

const TEMP_DIR = path.join(__dirname, '..', 'temp');

// Ensure temp directory exists
fs.mkdir(TEMP_DIR, { recursive: true }).catch(console.error);

const LANGUAGE_CONFIG = {
    c: {
        extension: 'c',
        compile: (filePath, executablePath) => `gcc "${filePath}" -o "${executablePath}"`,
        run: (executablePath) => `"${executablePath}"`,
        isCompiled: true
    },
    cpp: {
        extension: 'cpp',
        compile: (filePath, executablePath) => `g++ "${filePath}" -o "${executablePath}"`,
        run: (executablePath) => `"${executablePath}"`,
        isCompiled: true
    },
    java: {
        extension: 'java',
        compile: (filePath) => `javac "${filePath}"`,
        run: (filePath, dir) => `java -cp "${dir}" Main`,
        isCompiled: true,
        className: 'Main' // Java file needs to be named Main.java
    },
    python: {
        extension: 'py',
        run: (filePath) => `python "${filePath}"`,
        isCompiled: false
    },
    javascript: {
        extension: 'js',
        run: (filePath) => `node "${filePath}"`,
        isCompiled: false
    },
    rust: {
        extension: 'rs',
        compile: (filePath, executablePath) => `rustc "${filePath}" -o "${executablePath}"`,
        run: (executablePath) => `"${executablePath}"`,
        isCompiled: true
    },
    zig: {
        extension: 'zig',
        compile: (filePath, executablePath) => `zig build-exe "${filePath}" -femit-bin="${executablePath}"`,
        run: (executablePath) => `"${executablePath}"`,
        isCompiled: true
    }
};

const executeCommand = (command, input, timeoutMs = 5000) => {
    return new Promise((resolve, reject) => {
        const safeEnv = { PATH: process.env.PATH };
        if (process.platform === 'win32') {
            if (process.env.SystemRoot) safeEnv.SystemRoot = process.env.SystemRoot;
            if (process.env.SystemDrive) safeEnv.SystemDrive = process.env.SystemDrive;
            if (process.env.TEMP) safeEnv.TEMP = process.env.TEMP;
            if (process.env.TMP) safeEnv.TMP = process.env.TMP;
            if (process.env.ComSpec) safeEnv.ComSpec = process.env.ComSpec;
        } else {
            if (process.env.TMPDIR) safeEnv.TMPDIR = process.env.TMPDIR;
        }

        const childProcess = exec(command, {
            timeout: timeoutMs,
            killSignal: 'SIGKILL',
            env: safeEnv 
        }, (error, stdout, stderr) => {
            if (error) {
                if (error.killed) {
                    return resolve({ success: false, output: `Error: Execution Timed Out after ${timeoutMs}ms` });
                }
                const errorMessage = stderr || stdout || error.message;
                return resolve({ success: false, output: errorMessage });
            }
            if (stderr) {
                return resolve({ success: true, output: (stdout ? stdout + '\n' : '') + stderr });
            }
            resolve({ success: true, output: stdout });
        });

        if (input) {
            childProcess.stdin.write(input);
        }
        childProcess.stdin.end();
    });
};

// ----------------------------------------------------
// SOCKET.IO INTERACTIVE EXECUTION
// ----------------------------------------------------

let ioInstance;
const activeProcesses = new Map();

exports.initSocketIO = (io) => {
    ioInstance = io;

    io.on('connection', (socket) => {
        console.log(`Socket connected: ${socket.id}`);

        socket.on('execute', async (data) => {
            await handleSocketExecute(socket, data);
        });

        socket.on('input', (data) => {
            const child = activeProcesses.get(socket.id);
            if (child && child.stdin && child.stdin.writable) {
                child.stdin.write(data);
            }
        });

        socket.on('stop', () => {
            cleanupProcess(socket.id);
            socket.emit('output', '\n[Process manually terminated]\n');
            socket.emit('finished', { success: false });
        });

        socket.on('disconnect', () => {
            cleanupProcess(socket.id);
            console.log(`Socket disconnected: ${socket.id}`);
        });
    });
};

const cleanupProcess = (socketId) => {
    const child = activeProcesses.get(socketId);
    if (child) {
        try {
            if (process.platform === 'win32') {
                exec(`taskkill /pid ${child.pid} /t /f`, () => {});
            } else {
                child.kill('SIGKILL');
            }
        } catch (e) {
            console.error('Error killing process:', e);
        }
        activeProcesses.delete(socketId);
    }
};

const handleSocketExecute = async (socket, { language, code }) => {
    console.log(`[Socket ${socket.id}] ========== CODE EXECUTION START ==========`);
    console.log(`[Socket ${socket.id}] Language:`, language);

    const config = LANGUAGE_CONFIG[language.toLowerCase()];
    if (!config) {
        return socket.emit('finished', { success: false, output: `Language ${language} is not supported.` });
    }

    // Cleanup any existing process for this socket
    cleanupProcess(socket.id);

    const uniqueId = uuidv4();
    const fileName = config.className ? `${config.className}.${config.extension}` : `${uniqueId}.${config.extension}`;
    const execDir = path.join(TEMP_DIR, uniqueId);
    const filePath = path.join(execDir, fileName);
    const executablePath = path.join(execDir, process.platform === 'win32' ? `${uniqueId}.exe` : uniqueId);

    try {
        await fs.mkdir(execDir, { recursive: true });
        await fs.writeFile(filePath, code);

        let runCommand;

        // Compilation Phase (Synchronous block)
        if (config.isCompiled) {
            socket.emit('output', 'Compiling...\n');
            const compileCommand = config.compile(filePath, executablePath);
            const compileResult = await executeCommand(compileCommand, null, 10000);

            if (!compileResult.success) {
                socket.emit('output', `Compilation Error:\n${compileResult.output}`);
                socket.emit('finished', { success: false });
                await fs.rm(execDir, { recursive: true, force: true }).catch(console.error);
                return;
            }
            runCommand = config.run(executablePath, execDir);
        } else {
            runCommand = config.run(filePath);
        }
        
        const safeEnv = { PATH: process.env.PATH };
        if (process.platform === 'win32') {
            if (process.env.SystemRoot) safeEnv.SystemRoot = process.env.SystemRoot;
            if (process.env.SystemDrive) safeEnv.SystemDrive = process.env.SystemDrive;
            if (process.env.TEMP) safeEnv.TEMP = process.env.TEMP;
            if (process.env.TMP) safeEnv.TMP = process.env.TMP;
            if (process.env.ComSpec) safeEnv.ComSpec = process.env.ComSpec;
        } else {
            if (process.env.TMPDIR) safeEnv.TMPDIR = process.env.TMPDIR;
        }

        // Use shell: true to support arbitrary commands like "java -cp dir Main"
        const childProcess = spawn(runCommand, {
            shell: true,
            env: safeEnv,
            cwd: execDir
        });

        activeProcesses.set(socket.id, childProcess);

        // Timeout handler
        const timeoutMs = 60000; // Allow 60s for interactive runs so users have time to type
        const timeoutId = setTimeout(() => {
            if (activeProcesses.has(socket.id)) {
                cleanupProcess(socket.id);
                socket.emit('output', `\n[Error: Execution Timed Out after ${timeoutMs}ms]\n`);
                socket.emit('finished', { success: false });
            }
        }, timeoutMs);

        // Stream Output
        childProcess.stdout.on('data', (data) => {
            socket.emit('output', data.toString());
        });

        childProcess.stderr.on('data', (data) => {
            socket.emit('output', data.toString()); 
        });

        childProcess.on('close', (code) => {
            clearTimeout(timeoutId);
            activeProcesses.delete(socket.id);
            socket.emit('output', `\n[Process finished with exit code ${code}]`);
            socket.emit('finished', { success: code === 0 });
            
            // Cleanup directory
            fs.rm(execDir, { recursive: true, force: true }).catch(console.error);
        });

    } catch (error) {
        socket.emit('output', `Server Error: ${error.message}`);
        socket.emit('finished', { success: false });
        fs.rm(execDir, { recursive: true, force: true }).catch(console.error);
    }
};

// Legacy REST API fallback
exports.executeCode = async (language, code, input) => {
    // This maintains compatibility if anything else uses the REST endpoint
    // It will still execute using the old exec logic.
    console.log("========== LEGACY CODE EXECUTION START ==========");
    const config = LANGUAGE_CONFIG[language.toLowerCase()];
    if (!config) return { success: false, output: `Language ${language} is not supported.` };

    const uniqueId = uuidv4();
    const fileName = config.className ? `${config.className}.${config.extension}` : `${uniqueId}.${config.extension}`;
    const execDir = path.join(TEMP_DIR, uniqueId);
    const filePath = path.join(execDir, fileName);
    const executablePath = path.join(execDir, process.platform === 'win32' ? `${uniqueId}.exe` : uniqueId);

    try {
        await fs.mkdir(execDir, { recursive: true });
        await fs.writeFile(filePath, code);
        let runCommand;
        if (config.isCompiled) {
            const compileCommand = config.compile(filePath, executablePath);
            const compileResult = await executeCommand(compileCommand, null, 10000);
            if (!compileResult.success) return { success: false, output: `Compilation Error:\n${compileResult.output}` };
            runCommand = config.run(executablePath, execDir);
        } else {
            runCommand = config.run(filePath);
        }
        const runResult = await executeCommand(runCommand, input, 5000);
        return runResult;
    } catch (error) {
        return { success: false, output: `Server Error: ${error.message}` };
    } finally {
        try { await fs.rm(execDir, { recursive: true, force: true }); } catch (e) {}
    }
};
