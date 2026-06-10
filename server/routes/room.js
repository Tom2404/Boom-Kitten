// Room routes for public room list and room detail lookups.
const express = require('express');
const { getPublicRooms, getRoomState } = require('../game/roomManager');

const router = express.Router();

router.get('/', (_req, res) => {
  res.json(getPublicRooms());
});

router.get('/:code', (req, res) => {
  const room = getRoomState(req.params.code);
  if (!room) return res.status(404).json({ message: 'Room not found' });
  return res.json(room);
});

module.exports = router;
