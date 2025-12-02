const express = require('express');
const os = require('os');
const {
  addPatient,
  getQueue,
  getNextPatient,
  recallPatient,
  skipCurrent,
  markDone,
  getHistory,
  requeuePatient,
  getRoomState,
  resetQueue,
} = require('./db');
const { announce } = require('./audio/announce');
const { emitCall } = require('./socket');

const router = express.Router();

const getIpAddress = () => {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return null;
};

router.post('/checkin', (req, res) => {
  const { nom, prenom, motif } = req.body || {};
  if (!nom || !prenom) {
    return res.status(400).json({ error: 'nom et prenom requis' });
  }
  const patient = addPatient({ nom, prenom, motif });
  return res.status(201).json({ ticketId: patient.ticket_id, patient });
});

router.get('/queue', (_req, res) => {
  const queue = getQueue();
  return res.json(queue);
});

router.post('/next', (req, res) => {
  const roomId = parseInt(req.query.room, 10);
  if (!roomId) {
    return res.status(400).json({ error: 'Paramètre room requis' });
  }
  const patient = getNextPatient(roomId);
  if (!patient) {
    return res.status(404).json({ error: 'Aucun patient en attente' });
  }

  const payload = {
    ticketId: patient.ticket_id,
    nom: patient.nom,
    prenom: patient.prenom,
    roomId,
    calledAt: patient.called_time,
  };

  emitCall(payload);
  try {
    announce(patient.ticket_id, roomId);
  } catch (err) {
    console.warn('[audio] annonce échouée', err);
  }

  return res.json(patient);
});

router.post('/recall', (req, res) => {
  const roomId = parseInt(req.query.room, 10);
  if (!roomId) {
    return res.status(400).json({ error: 'Paramètre room requis' });
  }
  const patient = recallPatient(roomId);
  if (!patient) {
    return res.status(404).json({ error: 'Aucun patient à rappeler' });
  }
  const payload = {
    ticketId: patient.ticket_id,
    nom: patient.nom,
    prenom: patient.prenom,
    roomId,
    calledAt: patient.called_time,
  };
  emitCall(payload);
  try {
    announce(patient.ticket_id, roomId);
  } catch (err) {
    console.warn('[audio] rappel échoué', err);
  }
  return res.json(patient);
});

router.post('/skip', (req, res) => {
  const roomId = req.query.room ? parseInt(req.query.room, 10) : undefined;
  const ticketId = req.query.ticketId ? parseInt(req.query.ticketId, 10) : undefined;
  const patient = skipCurrent({ roomId, ticketId });
  if (!patient) {
    return res.status(404).json({ error: 'Aucun patient à marquer absent/skip' });
  }
  return res.json(patient);
});

router.post('/done', (req, res) => {
  const ticketId = parseInt(req.query.ticketId, 10);
  if (!ticketId) {
    return res.status(400).json({ error: 'ticketId requis' });
  }
  const patient = markDone(ticketId);
  if (!patient) {
    return res.status(404).json({ error: 'Patient introuvable' });
  }
  return res.json(patient);
});

router.post('/requeue', (req, res) => {
  const ticketId = parseInt(req.query.ticketId, 10);
  if (!ticketId) {
    return res.status(400).json({ error: 'ticketId requis' });
  }
  const patient = requeuePatient(ticketId);
  if (!patient) {
    return res.status(404).json({ error: 'Patient introuvable' });
  }
  return res.json(patient);
});

router.get('/history', (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit, 10) : 3;
  const roomId = req.query.room ? parseInt(req.query.room, 10) : undefined;
  const history = getHistory(limit, roomId);
  return res.json(history);
});

router.get('/roomState', (req, res) => {
  const roomId = parseInt(req.query.room, 10);
  if (!roomId) {
    return res.status(400).json({ error: 'Paramètre room requis' });
  }
  const state = getRoomState(roomId);
  return res.json(state);
});

router.post('/reset', (_req, res) => {
  resetQueue();
  return res.json({ ok: true });
});

router.get('/info', (_req, res) => {
  const hostname = os.hostname() || 'queue-hub.local';
  const ip = getIpAddress() || '192.168.x.x';
  return res.json({ hostname, ip });
});

module.exports = router;
