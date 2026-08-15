const pool = require('../config/db');

exports.createProgram = async (req, res) => {
    const { program_name, language, code, output, folder_id } = req.body;
    try {
        if (folder_id) {
            const [folder] = await pool.query('SELECT id FROM folders WHERE id = ? AND user_id = ?', [folder_id, req.user.id]);
            if (folder.length === 0) {
                return res.status(403).json({ success: false, message: 'Forbidden: Folder does not belong to user' });
            }
        }

        const [result] = await pool.query(
            'INSERT INTO programs (user_id, folder_id, program_name, language, code, output) VALUES (?, ?, ?, ?, ?, ?)',
            [req.user.id, folder_id || null, program_name, language, code, output || '']
        );
        res.status(201).json({ success: true, programId: result.insertId, message: 'Program saved successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error saving program', error: error.message });
    }
};

exports.getPrograms = async (req, res) => {
    try {
        const [programs] = await pool.query(
            'SELECT id, folder_id, program_name, language, code, output, created_at, updated_at FROM programs WHERE user_id = ? AND folder_id IS NULL ORDER BY created_at DESC',
            [req.user.id]
        );
        res.json({ success: true, programs });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching programs' });
    }
};

exports.getProgramById = async (req, res) => {
    try {
        const [programs] = await pool.query(
            'SELECT * FROM programs WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );
        if (programs.length === 0) {
            return res.status(404).json({ success: false, message: 'Program not found' });
        }
        res.json({ success: true, program: programs[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching program' });
    }
};


exports.updateProgram = async (req, res) => {
    const { program_name, code, output } = req.body;
    try {
        const [result] = await pool.query(
            'UPDATE programs SET program_name = ?, code = ?, output = ? WHERE id = ? AND user_id = ?',
            [program_name, code, output, req.params.id, req.user.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Program not found or unauthorized' });
        }
        res.json({ message: 'Program updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating program' });
    }
};

exports.deleteProgram = async (req, res) => {
    try {
        const [result] = await pool.query(
            'DELETE FROM programs WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Program not found or unauthorized' });
        }
        res.json({ message: 'Program deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting program' });
    }
};
