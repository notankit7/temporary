import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Droplets, Thermometer, Wind, CloudRain, Waves, RefreshCw } from 'lucide-react';
import { fetchSensorData, fetchSensorHistory, fetchMyCrop, simulateReading } from '../services/api';
import { clockTime, timeAgo } from '../utils/format';

const Sensors = () => {
  // useState stores the latest reading, the reading history for the chart,
  // the crop thresholds and how many times the sensor has been checked.
  const [reading, setReading] = useState(null);
  const [history, setHistory] = useState([]);
  const [crop, setCrop] = useState(null);
  const [checks, setChecks] = useState(0);
  const [checking, setChecking] = useState(false);
  const [newAlerts, setNewAlerts] = useState(0);
  const [error, setError] = useState('');

  // Load the latest reading, 24h history and crop thresholds on first render.
  useEffect(() => {
    Promise.all([fetchSensorData(), fetchSensorHistory(24), fetchMyCrop()])
      .then(([latest, hist, cropInfo]) => {
        setReading(latest);
        setHistory(hist);
        setCrop(cropInfo);
      })
      .catch((err) => setError(err.message));
  }, []);

  // useEffect runs whenever `reading` changes — here it just logs it,
  // the way we were taught to watch a piece of state with useEffect.
  useEffect(() => {
    if (reading) console.log('Moisture updated:', reading.soilMoisture);
  }, [reading]);

  // Asks the backend for a fresh reading (from the sensor simulator).
  const checkSensor = async () => {
    setChecking(true);
    try {
      const { reading: next, alerts } = await simulateReading();
      setReading(next);
      setHistory((h) => [...h, next]);
      setChecks((c) => c + 1);
      setNewAlerts(alerts.length);
    } catch (err) {
      setError(err.message);
    } finally {
      setChecking(false);
    }
  };

  if (error) return <p style={{ padding: '2rem', color: 'var(--danger)' }}>Could not load sensors: {error}</p>;
  if (!reading || !crop) return <p style={{ padding: '2rem', color: 'var(--text-muted)' }}>Loading sensor data…</p>;

  const moisture = reading.soilMoisture;
  const m = crop.moisture;
  const t = crop.temperature;

  const sensors = [
    { title: 'Soil Moisture', value: moisture, unit: '%',
      status: moisture < m.critical ? { type: 'critical', text: 'Critical' } : moisture < m.min ? { type: 'warning', text: 'Low' } : moisture > m.max ? { type: 'warning', text: 'High' } : { type: 'normal', text: 'OK' },
      icon: <Droplets size={22} />, color: 'var(--primary)' },
    { title: 'Temperature', value: reading.temperature, unit: '°C',
      status: reading.temperature > t.max ? { type: 'warning', text: 'High' } : reading.temperature < t.min ? { type: 'warning', text: 'Low' } : { type: 'normal', text: 'Normal' },
      icon: <Thermometer size={22} />, color: 'var(--warning)' },
    { title: 'Humidity', value: reading.humidity, unit: '%', status: { type: 'normal', text: 'Normal' }, icon: <Wind size={22} />, color: 'var(--accent)' },
    { title: 'Rainfall', value: reading.rainfall, unit: 'mm',
      status: reading.rainfall >= 10 ? { type: 'normal', text: 'Heavy' } : reading.rainfall > 0 ? { type: 'normal', text: 'Light' } : { type: 'normal', text: 'None' },
      icon: <CloudRain size={22} />, color: 'var(--text-muted)' },
    { title: 'Water Level', value: reading.waterLevel, unit: '%',
      status: reading.waterLevel < 20 ? { type: 'critical', text: 'Low' } : { type: 'normal', text: 'Good' },
      icon: <Waves size={22} />, color: 'var(--primary-light)' },
  ];

  const chartData = history.map((r) => ({ time: clockTime(r.createdAt), moisture: r.soilMoisture, temp: r.temperature }));

  return (
    <div>
      <header className="page-header anim-fade-up">
        <h1>Sensor Monitoring</h1>
        <p>Live data from your field sensors · last reading {timeAgo(reading.createdAt)}</p>
      </header>

      <div className="card anim-fade-up" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <p style={{ fontWeight: 600 }}>{moisture < m.min ? 'Irrigation Needed' : 'Moisture is Sufficient'}</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Sensor checked {checks} time{checks === 1 ? '' : 's'} this session
            {newAlerts > 0 && <> · <strong style={{ color: 'var(--danger)' }}>{newAlerts} new alert{newAlerts === 1 ? '' : 's'}</strong></>}
          </p>
        </div>
        <button className="btn" onClick={checkSensor} disabled={checking}>
          <RefreshCw size={16} /> {checking ? 'Checking…' : 'Check Sensor'}
        </button>
      </div>

      <div className="sensors-grid">
        {sensors.map((s, i) => (
          <div key={i} className={`card sensor-detail-card anim-fade-up anim-delay-${i + 1}`}>
            <div className="sensor-header">
              <div className="sensor-title">
                <div className="sensor-icon" style={{ background: 'var(--primary-tint)', color: s.color }}>{s.icon}</div>
                <h3>{s.title}</h3>
              </div>
              <span className={`status-badge badge-${s.status.type}`}>{s.status.text}</span>
            </div>
            <div className="sensor-value">{s.value}<span className="unit">{s.unit}</span></div>
          </div>
        ))}
      </div>

      <div className="card chart-card anim-fade-up anim-delay-3">
        <h3>Moisture & Temperature Trends (last 24h)</h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(38,74,51,0.18)" />
            <XAxis dataKey="time" stroke="#264A33" tick={{ fontSize: 12 }} />
            <YAxis stroke="#264A33" tick={{ fontSize: 12 }} />
            <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid var(--border-strong)', borderRadius: 12, color: 'var(--text)', boxShadow: 'var(--shadow)', fontFamily: 'var(--font-ui)', fontSize: '0.85rem' }} />
            <Line type="monotone" dataKey="moisture" name="Moisture %" stroke="#0B4F28" strokeWidth={2.5} dot={{ r: 4, fill: '#0B4F28' }} />
            <Line type="monotone" dataKey="temp" name="Temp °C" stroke="#6E4708" strokeWidth={2.5} dot={{ r: 4, fill: '#6E4708' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Sensors;
