const express = require('express');
const groupController = require('../controllers/group.controller');
const { authenticate } = require('../middlewares/auth.middleware');

const router = express.Router();

// All routes in this file require authentication
router.use(authenticate);

// Group creation and management (for drivers)
router.post('/', groupController.createGroup);
router.post('/create-from-chain', groupController.createGroupFromChain);
router.get('/find-passenger-matches', groupController.findPassengerMatches);
router.get('/:groupId', groupController.getGroupById);
router.put('/:groupId', groupController.updateGroup);
router.delete('/:groupId', groupController.deleteGroup);

// Group search (for passengers)
router.post('/search/activity', groupController.searchGroupsByActivity);
router.post('/search/trajectory', groupController.searchGroupsByTrajectory);

// User groups
router.get('/user/me', groupController.getUserGroups);
router.get('/user/me/active', groupController.getUserActiveGroup);

module.exports = router;