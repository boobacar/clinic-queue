import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiFetch } from '../api';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const Room = () => {
  const { id } = useParams();
  const roomId = parseInt(id, 10);
  const [lastPatient, setLastPatient] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const loadLast = async () => {
    try {
      const data = await apiFetch(`/api/history?room=${roomId}&limit=1`);
      if (data && data.length > 0) {
        setLastPatient(data[0]);
      }
    } catch (err) {
      setMessage(err.message);
    }
  };

  useEffect(() => {
    loadLast();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const callWithRetry = async (url, retries = 2) => {
    let attempt = 0;
    while (attempt <= retries) {
      try {
        const res = await apiFetch(url, { method: 'POST' });
        return res;
      } catch (err) {
        if (attempt < retries) {
          setMessage('Connexion faible, nouvel essai...');
          await wait(800);
          attempt += 1;
          continue;
        }
        throw err;
      }
    }
    return null;
  };

  if (!roomId) {
    return (
      <div className="layout-center">
        <div className="card">Salle invalide.</div>
      </div>
    );
  }

  const handleNext = async () => {
    setLoading(true);
    setMessage('');
    try {
      const patient = await callWithRetry(`/api/next?room=${roomId}`);
      setLastPatient(patient);
      setMessage(`Ticket ${patient.ticket_id} appelé en Salle ${roomId}`);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRecall = async () => {
    setLoading(true);
    setMessage('');
    try {
      const patient = await apiFetch(`/api/recall?room=${roomId}`, { method: 'POST' });
      setLastPatient(patient);
      setMessage(`Rappel du ticket ${patient.ticket_id}`);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    setLoading(true);
    setMessage('');
    try {
      const patient = await apiFetch(`/api/skip?room=${roomId}`, { method: 'POST' });
      setMessage(`Ticket ${patient.ticket_id} marqué absent/skip`);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
      loadLast();
    }
  };

  return (
    <div className="layout-center">
      <div className="card" style={{ width: '100%', maxWidth: 640, textAlign: 'center' }}>
        <p className="subtle">Salle {roomId}</p>
        <h1>Tablette dentiste</h1>
        <div className="grid-buttons" style={{ marginTop: 24 }}>
          <button className="btn" style={{ fontSize: 28 }} onClick={handleNext} disabled={loading}>
            SUIVANT
          </button>
          <button className="btn secondary" onClick={handleRecall} disabled={loading}>
            RAPPELER
          </button>
          <button className="btn danger" onClick={handleSkip} disabled={loading}>
            ABSENT / SKIP
          </button>
        </div>

        {message && <div className="message" style={{ marginTop: 16 }}>{message}</div>}

        <div className="card" style={{ marginTop: 20 }}>
          <h3>Dernier patient appelé</h3>
          {lastPatient ? (
            <div style={{ fontSize: 20 }}>
              Ticket {lastPatient.ticket_id} — {lastPatient.nom} {lastPatient.prenom}
              <div className="subtle">
                {lastPatient.called_time ? new Date(lastPatient.called_time).toLocaleTimeString() : ''}
              </div>
            </div>
          ) : (
            <p>Aucun appel pour le moment.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Room;
