import React, { useEffect, useState } from 'react';
import { AlertTriangle, AlertCircle, CheckCircle, X } from 'lucide-react';
import { fetchAlertsData, markAlertRead, markAllAlertsRead, deleteAlert } from '../services/api';
import { timeAgo } from '../utils/format';

const icons = {
  critical: <AlertTriangle size={20} color="var(--danger)"/>,
  warning: <AlertCircle size={20} color="var(--warning)"/>,
  normal: <CheckCircle size={20} color="var(--success)"/>,
};

const FILTERS = [
  { label: 'All', type: undefined },
  { label: 'Critical', type: 'critical' },
  { label: 'Warnings', type: 'warning' },
  { label: 'Info', type: 'normal' },
];

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState(FILTERS[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Re-fetch the alert list whenever the selected filter changes.
  useEffect(() => {
    setLoading(true);
    fetchAlertsData({ type: filter.type })
      .then(setAlerts)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [filter]);

  const handleRead = async (alert) => {
    if (alert.read) return;
    const updated = await markAlertRead(alert.id);
    setAlerts((list) => list.map((a) => (a.id === updated.id ? updated : a)));
  };

  const handleReadAll = async () => {
    await markAllAlertsRead();
    setAlerts((list) => list.map((a) => ({ ...a, read: true })));
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    await deleteAlert(id);
    setAlerts((list) => list.filter((a) => a.id !== id));
  };

  const unread = alerts.filter((a) => !a.read).length;

  return (
    <div>
      <header className="page-header anim-fade-up">
        <h1>Alerts & Notifications</h1>
        <p>System warnings and events{unread > 0 && ` · ${unread} unread`}</p>
      </header>

      <div className="card alerts-container anim-fade-up anim-delay-1">
        <div className="alerts-header-row">
          <h3>All Alerts</h3>
          <div className="alert-filters">
            {FILTERS.map((f) => (
              <button key={f.label} type="button"
                className={`filter ${filter.label === f.label ? 'active' : ''}`}
                onClick={() => setFilter(f)}>
                {f.label}
              </button>
            ))}
            {unread > 0 && (
              <button type="button" className="filter" onClick={handleReadAll}>Mark all read</button>
            )}
          </div>
        </div>
        <div className="alerts-list-full">
          {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
          {!loading && !error && alerts.length === 0 && (
            <p style={{ color: 'var(--text-muted)' }}>No alerts here.</p>
          )}
          {alerts.map((a, i) => (
            <div key={a.id} onClick={() => handleRead(a)}
              className={`alert-card-full type-${a.type} anim-fade-up anim-delay-${Math.min(i+1, 5)}`}
              style={{ opacity: a.read ? 0.65 : 1, cursor: a.read ? 'default' : 'pointer' }}
              title={a.read ? '' : 'Click to mark as read'}>
              <div className="alert-icon-container">{icons[a.type]}</div>
              <div className="alert-content-full" style={{ flex: 1 }}>
                <h4>
                  {a.type.charAt(0).toUpperCase() + a.type.slice(1)}
                  {!a.read && <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', color: 'var(--primary)' }}>● New</span>}
                </h4>
                <p>{a.message}</p>
                <span className="alert-time">{timeAgo(a.createdAt)}</span>
              </div>
              <button type="button" onClick={(e) => handleDelete(e, a.id)} aria-label="Dismiss alert"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem' }}>
                <X size={18} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Alerts;
