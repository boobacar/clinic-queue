import React, { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import logo from '../assets/logo.jpg';

const Reception = () => {
  const [form, setForm] = useState({ fullName: '', motif: '' });
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
      const trimmed = (form.fullName || '').trim();
      if (!trimmed) {
        throw new Error('Nom et prénom requis');
      }
      const parts = trimmed.split(/\s+/);
      const prenom = parts[0];
      const nom = parts.slice(1).join(' ') || '-';
      const res = await apiFetch('/api/checkin', {
        method: 'POST',
        body: JSON.stringify({ nom, prenom, motif: form.motif }),
      });
      setLastTicket(res.ticketId);
      setForm({ fullName: '', motif: '' });
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
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src={logo}
              alt="Clinique Dentaire Dabia"
              className="h-12 w-12 rounded-full object-cover shadow-md shadow-pink-300/60"
            />
            <div>
              <div className="text-xs uppercase tracking-[0.25em] text-slate-400">
                Clinique Dentaire
              </div>
              <div className="text-xl font-extrabold text-clinic-pink-dark">Dabia</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {info && (
              <div className="inline-flex items-center rounded-full bg-pink-50 px-3 py-1 text-xs font-semibold text-pink-700">
                Hub: {info.hostname} ({info.ip})
              </div>
            )}
            <button
              type="button"
              className="inline-flex items-center rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-red-300 hover:bg-red-600 transition"
              onClick={async () => {
                if (!window.confirm('Réinitialiser tous les tickets et vider la file ?')) return;
                try {
                  await apiFetch('/api/reset', { method: 'POST' });
                  setLastTicket(null);
                  setMessage('Tickets réinitialisés, nouvelle journée.');
                  loadQueue();
                } catch (err) {
                  setMessage(err.message);
                }
              }}
            >
              Reset tickets
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">
              Accueil / Secrétaire
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Ajoutez les patients, suivez la file FIFO.
            </p>
          </div>
          {lastTicket && (
            <div className="inline-flex items-center rounded-full bg-pink-50 px-3 py-1 text-xs font-semibold text-pink-700">
              Dernier ticket: {lastTicket}
            </div>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl bg-white/90 p-5 sm:p-6 shadow-lg border border-pink-100">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Enregistrer un patient</h2>
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Prénom et nom
                </label>
                <input
                  required
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  placeholder="Ex: Boubacar Fall"
                  className="w-full rounded-full border border-pink-200 bg-pink-50/60 px-4 py-2.5 text-sm sm:text-base placeholder-slate-400 focus:border-clinic-pink focus:ring-2 focus:ring-clinic-pink/40 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Motif / Type de soins (optionnel)
                </label>
                <input
                  value={form.motif}
                  onChange={(e) => setForm({ ...form, motif: e.target.value })}
                  placeholder="Contrôle, douleur, etc."
                  className="w-full rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm sm:text-base placeholder-slate-400 focus:border-clinic-pink focus:ring-2 focus:ring-clinic-pink/40 outline-none"
                />
              </div>
              <button
                className="w-full rounded-xl bg-gradient-to-r from-clinic-pink to-clinic-pink-dark text-white font-semibold py-3.5 shadow-lg shadow-pink-300/40 hover:-translate-y-0.5 hover:shadow-pink-400/60 transition"
                type="submit"
                disabled={submitting}
              >
                {submitting ? 'Ajout...' : 'Ajouter à la file'}
              </button>
            </form>
            {message && (
              <div className="mt-3 text-sm font-semibold text-emerald-700">{message}</div>
            )}
          </div>

          <div className="rounded-3xl bg-white/90 p-5 sm:p-6 shadow-lg border border-pink-100">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Patients en attente</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm sm:text-base">
                <thead className="bg-slate-50">
                  <tr>
                    <th>Ticket</th>
                    <th>Prénom</th>
                    <th>Nom</th>
                    <th>Arrivée</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {queue.length === 0 && (
                    <tr>
                      <td colSpan="6" className="py-6 text-center text-slate-400">
                        Pas de patients en attente.
                      </td>
                    </tr>
                  )}
                  {queue.map((p) => (
                    <tr key={p.ticket_id}>
                      <td className="whitespace-nowrap">#{p.ticket_id}</td>
                      <td className="whitespace-nowrap">{p.prenom}</td>
                      <td className="whitespace-nowrap">{p.nom}</td>
                      <td className="whitespace-nowrap">
                        {new Date(p.arrival_time).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="whitespace-nowrap capitalize">{p.status}</td>
                      <td>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="inline-flex flex-1 items-center justify-center rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                            onClick={() => markAbsent(p.ticket_id)}
                          >
                            Absent / No show
                          </button>
                          <button
                            type="button"
                            className="inline-flex flex-1 items-center justify-center rounded-full bg-gradient-to-r from-clinic-pink to-clinic-pink-dark px-3 py-1.5 text-xs sm:text-sm font-medium text-white shadow-sm hover:shadow-md transition"
                            onClick={() => requeue(p.ticket_id)}
                          >
                            Réinsérer en fin de file
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reception;
