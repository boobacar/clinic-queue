const path = require('path');
const Database = require('better-sqlite3');

const dbFile = path.join(__dirname, 'queue.db');
const db = new Database(dbFile);

db.pragma('journal_mode = WAL');

db.prepare(
  `CREATE TABLE IF NOT EXISTS patients_queue (
    ticket_id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL,
    prenom TEXT NOT NULL,
    motif TEXT NULL,
    arrival_time DATETIME NOT NULL,
    status TEXT NOT NULL,
    called_room INTEGER NULL,
    called_time DATETIME NULL,
    last_called BOOLEAN DEFAULT 0
  )`
).run();

const getPatientById = (ticketId) =>
  db.prepare('SELECT * FROM patients_queue WHERE ticket_id = ?').get(ticketId);

const addPatient = ({ nom, prenom, motif }) => {
  const now = new Date().toISOString();
  const result = db
    .prepare(
      'INSERT INTO patients_queue (nom, prenom, motif, arrival_time, status, last_called) VALUES (?, ?, ?, ?, ?, 0)'
    )
    .run(nom, prenom, motif || null, now, 'waiting');

  return getPatientById(result.lastInsertRowid);
};

const getQueue = () =>
  db
    .prepare(
      'SELECT * FROM patients_queue WHERE status = "waiting" ORDER BY arrival_time ASC, ticket_id ASC'
    )
    .all();

const clearLastCalledForRoom = (roomId) =>
  db.prepare('UPDATE patients_queue SET last_called = 0 WHERE called_room = ?').run(roomId);

const getNextPatient = (roomId) => {
  const patient = db
    .prepare(
      'SELECT * FROM patients_queue WHERE status = "waiting" ORDER BY arrival_time ASC, ticket_id ASC LIMIT 1'
    )
    .get();
  if (!patient) return null;

  const now = new Date().toISOString();
  const tx = db.transaction(() => {
    clearLastCalledForRoom(roomId);
    db.prepare(
      'UPDATE patients_queue SET status = "called", called_room = ?, called_time = ?, last_called = 1 WHERE ticket_id = ?'
    ).run(roomId, now, patient.ticket_id);
  });
  tx();

  return {
    ...patient,
    status: 'called',
    called_room: roomId,
    called_time: now,
    last_called: 1,
  };
};

const getLastCalledByRoom = (roomId) =>
  db
    .prepare(
      'SELECT * FROM patients_queue WHERE called_room = ? AND status = "called" ORDER BY called_time DESC LIMIT 1'
    )
    .get(roomId);

const recallPatient = (roomId) => {
  const patient = getLastCalledByRoom(roomId);
  if (!patient) return null;
  const now = new Date().toISOString();
  const tx = db.transaction(() => {
    clearLastCalledForRoom(roomId);
    db.prepare('UPDATE patients_queue SET called_time = ?, last_called = 1 WHERE ticket_id = ?').run(
      now,
      patient.ticket_id
    );
  });
  tx();
  return { ...patient, called_time: now, last_called: 1 };
};

const skipCurrent = ({ roomId, ticketId }) => {
  let patient =
    ticketId && getPatientById(ticketId)
      ? getPatientById(ticketId)
      : db
          .prepare(
            'SELECT * FROM patients_queue WHERE called_room = ? AND status = "called" AND last_called = 1 ORDER BY called_time DESC LIMIT 1'
          )
          .get(roomId);

  if (!patient) return null;

  db.prepare('UPDATE patients_queue SET status = "skipped", last_called = 0 WHERE ticket_id = ?').run(
    patient.ticket_id
  );

  return { ...patient, status: 'skipped', last_called: 0 };
};

const markDone = (ticketId) => {
  const patient = getPatientById(ticketId);
  if (!patient) return null;
  db.prepare('UPDATE patients_queue SET status = "done", last_called = 0 WHERE ticket_id = ?').run(
    ticketId
  );
  return { ...patient, status: 'done', last_called: 0 };
};

const requeuePatient = (ticketId) => {
  const patient = getPatientById(ticketId);
  if (!patient) return null;
  const now = new Date().toISOString();
  db.prepare(
    'UPDATE patients_queue SET status = "waiting", arrival_time = ?, called_room = NULL, called_time = NULL, last_called = 0 WHERE ticket_id = ?'
  ).run(now, ticketId);
  return { ...patient, status: 'waiting', arrival_time: now, called_room: null, called_time: null, last_called: 0 };
};

const getHistory = (limit = 3, roomId) => {
  if (roomId) {
    return db
      .prepare(
        'SELECT * FROM patients_queue WHERE status = "called" AND called_room = ? ORDER BY called_time DESC LIMIT ?'
      )
      .all(roomId, limit);
  }
  return db
    .prepare('SELECT * FROM patients_queue WHERE status = "called" ORDER BY called_time DESC LIMIT ?')
    .all(limit);
};

module.exports = {
  db,
  addPatient,
  getQueue,
  getNextPatient,
  recallPatient,
  skipCurrent,
  markDone,
  getHistory,
  requeuePatient,
  getLastCalledByRoom,
  getPatientById,
};
