const pool = require('../config/db');

exports.createFolder = async (req, res) => {
    const { folder_name } = req.body;
    if (!folder_name || !folder_name.trim()) {
        return res.status(400).json({ success: false, message: 'Folder name is required' });
    }

    try {
        const [result] = await pool.query(
            'INSERT INTO folders (user_id, folder_name) VALUES (?, ?)',
            [req.user.id, folder_name.trim()]
        );
        res.status(201).json({ success: true, folderId: result.insertId, message: 'Folder created successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error creating folder', error: error.message });
    }
};

exports.getFolders = async (req, res) => {
    try {
        const [folders] = await pool.query(
            `SELECT f.id, f.folder_name, f.created_at, COUNT(p.id) AS program_count
             FROM folders f
             LEFT JOIN programs p ON f.id = p.folder_id
             WHERE f.user_id = ?
             GROUP BY f.id
             ORDER BY f.created_at DESC`,
            [req.user.id]
        );
        res.json({ success: true, folders });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching folders' });
    }
};

exports.getFolderPrograms = async (req, res) => {
    const folderId = req.params.id;
    try {
        const [folder] = await pool.query('SELECT id, folder_name FROM folders WHERE id = ? AND user_id = ?', [folderId, req.user.id]);
        if (folder.length === 0) {
            return res.status(403).json({ success: false, message: 'Forbidden: Folder does not belong to user' });
        }

        const [programs] = await pool.query(
            'SELECT id, folder_id, program_name, language, code, output, created_at, updated_at FROM programs WHERE folder_id = ? AND user_id = ? ORDER BY created_at DESC',
            [folderId, req.user.id]
        );
        res.json({ success: true, folder: folder[0], programs });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching folder programs' });
    }
};

exports.deleteFolder = async (req, res) => {
    const folderId = req.params.id;
    try {
        const [folder] = await pool.query('SELECT id FROM folders WHERE id = ? AND user_id = ?', [folderId, req.user.id]);
        if (folder.length === 0) {
            return res.status(403).json({ success: false, message: 'Forbidden: Folder does not belong to user' });
        }

        await pool.query('DELETE FROM folders WHERE id = ?', [folderId]);
        res.json({ success: true, message: 'Folder deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting folder' });
    }
};
