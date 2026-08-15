const express = require('express');
const router = express.Router();
const programController = require('../controllers/programController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.post('/', programController.createProgram);
router.get('/', programController.getPrograms);
router.get('/:id', programController.getProgramById);
router.put('/:id', programController.updateProgram);
router.delete('/:id', programController.deleteProgram);

module.exports = router;
