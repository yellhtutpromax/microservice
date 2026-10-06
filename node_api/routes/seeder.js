const express = require('express');
const router = express.Router();

// controller
const {autoincrementIdCollectionSeeder} = require('../controllers/helpers/collectionIdSeeder');

router.get('/seeder',autoincrementIdCollectionSeeder);

module.exports = router;