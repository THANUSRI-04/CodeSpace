const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
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
        const childProcess = exec(command, { timeout: timeoutMs }, (error, stdout, stderr) => {
            if (error) {
                if (error.killed) {
                    return resolve({ success: false, output: 'Error: Execution Timed Out' });
                }
                return resolve({ success: false, output: stderr || stdout || error.message });
            }
            if (stderr) {
                return resolve({ success: false, output: stderr }); // some languages write warnings to stderr
            }
            resolve({ success: true, output: stdout });
        });

        if (input) {
            childProcess.stdin.write(input);
            childProcess.stdin.end();
        }
    });
};

exports.executeCode = async (language, code, input) => {
    const config = LANGUAGE_CONFIG[language.toLowerCase()];
    if (!config) {
        return { success: false, output: `Language ${language} is not supported.` };
    }

    const uniqueId = uuidv4();
    const fileName = config.className ? `${config.className}.${config.extension}` : `${uniqueId}.${config.extension}`;
    
    // Create a unique directory for this execution to avoid conflicts (especially for Java and Zig)
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
            
            if (!compileResult.success) {
                return { success: false, output: `Compilation Error:\n${compileResult.output}` };
            }
            runCommand = config.run(executablePath, execDir);
        } else {
            runCommand = config.run(filePath);
        }

        const runResult = await executeCommand(runCommand, input, 5000);
        return runResult;
        
    } catch (error) {
        return { success: false, output: `Server Error: ${error.message}` };
    } finally {
        // Cleanup
        try {
            await fs.rm(execDir, { recursive: true, force: true });
        } catch (cleanupError) {
            console.error('Error cleaning up temp directory:', cleanupError);
        }
    }
};
