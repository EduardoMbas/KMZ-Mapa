const express = require('express');
const { saveRoute, upload } = require('../controllers/routesController');

const router = express.Router();

router.get('/', (req, res) => {
  res.send('Backend is running');
});

router.post('/save-route', upload.single('routeFile'), saveRoute);

module.exports = router;
