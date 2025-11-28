import React, { useEffect, useState } from 'react';
import { apiFetch } from '../api';

const Reception = () => {
  const [form, setForm] = useState({ nom: '', prenom: '', motif: '' });
  const [queue, setQueue] = useState([]);
  const [lastTicket, setLastTicket] = useState(null);
  const [message, setMessage] = useState('');
  const [info, setInfo] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadQueue = async () => {
    try {
      const data = await apiFetch('/api/queue');
      setQueue(data);
    } catch (err) {
      setMessage(err.message);
    }
  };

  const loadInfo = async () => {
    try {
      const data = await apiFetch('/api/info');
      setInfo(data);
    } catch (err) {
      setMessage(err.message);
    }
  };

  useEffect(() => {
    loadQueue();
    loadInfo();
    const interval = setInterval(loadQueue, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');
    try {
      const res = await apiFetch('/api/checkin', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setLastTicket(res.ticketId);
      setForm({ nom: '', prenom: '', motif: '' });
      setMessage('Patient ajouté à la file');
      loadQueue();
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const markAbsent = async (ticketId) => {
    setMessage('');
    try {
      await apiFetch(`/api/skip?ticketId=${ticketId}`, { method: 'POST' });
      setMessage(`Ticket ${ticketId} marqué absent / no show`);
      loadQueue();
    } catch (err) {
      setMessage(err.message);
    }
  };

  const requeue = async (ticketId) => {
    setMessage('');
    try {
      await apiFetch(`/api/requeue?ticketId=${ticketId}`, { method: 'POST' });
      setMessage(`Ticket ${ticketId} réinséré en fin de file`);
      loadQueue();
    } catch (err) {
      setMessage(err.message);
    }
  };

  return (
    <div className="page">
      <div className="headline">
        <div>
          <h1>Accueil / Secrétaire</h1>
          <p className="subtle">
            Ajoutez les patients, suivez la file FIFO. Hub: {info ? `${info.hostname} (${info.ip})` : '...'}
          </p>
        </div>
        {lastTicket && <div className="badge">Dernier ticket: {lastTicket}</div>}
      </div>

      <div className="cards">
        <div className="card">
          <h2>Enregistrer un patient</h2>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
            <div>
              <label>Nom</label>
              <input
                required
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                placeholder="Nom"
              />
            </div>
            <div>
              <label>Prénom</label>
              <input
                required
                value={form.prenom}
                onChange={(e) => setForm({ ...form, prenom: e.target.value })}
                placeholder="Prénom"
              />
            </div>
            <div>
              <label>Motif / Type de soins (optionnel)</label>
              <input
                value={form.motif}
                onChange={(e) => setForm({ ...form, motif: e.target.value })}
                placeholder="Contrôle, douleur, etc."
              />
            </div>
            <button className="btn" type="submit" disabled={submitting}>
              {submitting ? 'Ajout...' : 'Ajouter à la file'}
            </button>
          </form>
          {message && <div className="message">{message}</div>}
        </div>

        <div className="card">
          <h2>Patients en attente</h2>
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Nom</th>
                  <th>Prénom</th>
                  <th>Arrivée</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {queue.length === 0 && (
                  <tr>
                    <td colSpan="6">Pas de patients en attente.</td>
                  </tr>
                )}
                {queue.map((p) => (
                  <tr key={p.ticket_id}>
                    <td>{p.ticket_id}</td>
                    <td>{p.nom}</td>
                    <td>{p.prenom}</td>
                    <td>{new Date(p.arrival_time).toLocaleTimeString()}</td>
                    <td>{p.status}</td>
                    <td style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button className="btn secondary" onClick={() => markAbsent(p.ticket_id)}>
                        Absent / No show
                      </button>
                      <button className="btn" onClick={() => requeue(p.ticket_id)}>
                        Réinsérer en fin de file
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reception;
