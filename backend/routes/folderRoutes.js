const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const folderController = require('../controllers/folderController');

router.post('/', authMiddleware, folderController.createFolder);
router.get('/', authMiddleware, folderController.getFolders);
router.get('/:id/programs', authMiddleware, folderController.getFolderPrograms);
router.delete('/:id', authMiddleware, folderController.deleteFolder);

module.exports = router;
