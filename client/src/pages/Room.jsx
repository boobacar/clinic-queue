import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiFetch } from '../api';
import logo from '../assets/logo.jpg';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const Room = () => {
  const { id } = useParams();
  const roomId = parseInt(id, 10);
  const [roomState, setRoomState] = useState({ current: null, previous: null, next: null });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const loadState = async () => {
    try {
      const data = await apiFetch(`/api/roomState?room=${roomId}`);
      setRoomState(data);
    } catch (err) {
      setMessage(err.message);
    }
  };

  useEffect(() => {
    loadState();
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
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="rounded-3xl bg-white/90 shadow-lg border border-pink-100 px-6 py-5">
          Salle invalide.
        </div>
      </div>
    );
  }

  const handleNext = async () => {
    setLoading(true);
    setMessage('');
    try {
      const patient = await callWithRetry(`/api/next?room=${roomId}`);
      setMessage(`Ticket ${patient.ticket_id} appelé en Salle ${roomId}`);
      loadState();
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
      setMessage(`Rappel du ticket ${patient.ticket_id}`);
      loadState();
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
      loadState();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md sm:max-w-lg rounded-3xl bg-white/90 shadow-xl border border-pink-100 px-6 py-6 sm:px-8 sm:py-8 text-center space-y-5">
        <div className="flex items-center justify-center mb-2">
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
        </div>
        <p className="text-sm text-slate-500">Salle {roomId}</p>
        <h1 className="text-2xl font-semibold text-slate-900">Tablette dentiste</h1>
        <div className="grid grid-cols-1 gap-3 mt-4">
          <button
            className="w-full rounded-2xl bg-gradient-to-r from-clinic-pink to-clinic-pink-dark text-white font-bold text-2xl py-3.5 shadow-lg shadow-pink-300/40 hover:-translate-y-0.5 hover:shadow-pink-400/60 transition"
            onClick={handleNext}
            disabled={loading}
          >
            SUIVANT
          </button>
          <button
            className="w-full rounded-2xl border border-slate-300 bg-white text-slate-800 font-semibold py-3 shadow-sm hover:bg-slate-50 transition"
            onClick={handleRecall}
            disabled={loading}
          >
            RAPPELER
          </button>
          <button
            className="w-full rounded-2xl bg-red-500 text-white font-semibold py-3 shadow-md shadow-red-300 hover:bg-red-600 transition"
            onClick={handleSkip}
            disabled={loading}
          >
            ABSENT / SKIP
          </button>
        </div>

        {message && (
          <div className="mt-3 text-sm font-semibold text-slate-700 min-h-[1.5rem]">{message}</div>
        )}

        <div className="mt-4 rounded-3xl bg-pink-50/70 p-4">
          <h3 className="text-sm font-semibold text-slate-800">Patients</h3>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
            <div className="rounded-2xl bg-slate-50 px-3 py-3">
              <div className="text-xs uppercase tracking-wide text-slate-500">Précédent</div>
              {roomState.previous ? (
                <div className="mt-2 text-sm">
                  Ticket {roomState.previous.ticket_id}
                  <br />
                  {roomState.previous.prenom} {roomState.previous.nom}
                </div>
              ) : (
                <div className="mt-2 text-sm text-slate-400">—</div>
              )}
            </div>
            <div className="rounded-2xl bg-pink-100 px-3 py-3">
              <div className="text-xs uppercase tracking-wide text-slate-500">En salle</div>
              {roomState.current ? (
                <div className="mt-2 text-base font-semibold">
                  Ticket {roomState.current.ticket_id}
                  <br />
                  {roomState.current.prenom} {roomState.current.nom}
                </div>
              ) : (
                <div className="mt-2 text-sm text-slate-400">—</div>
              )}
            </div>
            <div className="rounded-2xl bg-cyan-50 px-3 py-3">
              <div className="text-xs uppercase tracking-wide text-slate-500">Suivant</div>
              {roomState.next ? (
                <div className="mt-2 text-sm">
                  Ticket {roomState.next.ticket_id}
                  <br />
                  {roomState.next.prenom} {roomState.next.nom}
                </div>
              ) : (
                <div className="mt-2 text-sm text-slate-400">—</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Room;
