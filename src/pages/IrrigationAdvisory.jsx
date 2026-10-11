import React, { useCallback, useEffect, useState } from 'react';
import { Droplets, Thermometer, CloudRain, Cpu, CheckCircle } from 'lucide-react';
import { fetchSensorData, fetchAdvisoryData, fetchWeather, logIrrigation } from '../services/api';

const dayName = (date) => new Date(date).toLocaleDateString([], { weekday: 'short' });

const IrrigationAdvisory = () => {
  const [sensorData, setSensorData] = useState(null);
  const [advisory, setAdvisory] = useState(null);
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState('');
  const [irrigating, setIrrigating] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(() => {
    Promise.all([fetchSensorData(), fetchAdvisoryData()])
      .then(([sensors, advisoryData]) => {
        setSensorData(sensors);
        setAdvisory(advisoryData);
      })
      .catch((err) => setError(err.message));
    // Weather is optional — the page still works if it fails.
    fetchWeather().then(setWeather).catch(() => setWeather({ available: false, message: 'Weather service unavailable' }));
  }, []);

  useEffect(load, [load]);

  const handleIrrigated = async () => {
    setIrrigating(true);
    try {
      const { event } = await logIrrigation(advisory.waterMm);
      setMessage(`Logged ${event.waterMm} mm of irrigation. Soil moisture is now ${event.moistureAfter}%.`);
      load();
    } catch (err) {
      setMessage(err.message);
    } finally {
      setIrrigating(false);
    }
  };

  if (error) return <p style={{ padding: '2rem', color: 'var(--danger)' }}>Could not load advisory: {error}</p>;
  if (!sensorData || !advisory) {
    return <p style={{ padding: '2rem', color: 'var(--text-muted)' }}>Loading advisory…</p>;
  }

  const { moisture: m, temperature: t } = advisory.thresholds;
  const rainCard = weather?.available
    ? {
        val: `${weather.rainNext48hMm} mm`,
        ideal: `Next 48h · ${weather.daily.map((d) => `${dayName(d.date)} ${d.rainMm}mm`).join(' · ')}`,
      }
    : { val: 'Unavailable', ideal: weather?.message || 'Loading forecast…' };

  return (
    <div>
      <header className="page-header anim-fade-up">
        <h1>Irrigation Advisory</h1>
        <p>Recommendations based on real-time sensor data{weather?.available && ` and the weather forecast for ${weather.location}`}</p>
      </header>

      <div className="card advisory-main-card anim-fade-up anim-delay-1">
        <div className="advisory-header">
          <div className="ai-badge"><Cpu size={14}/> Smart Advisory</div>
          <h2 style={{fontSize:'1.2rem'}}>Advisory for {advisory.crop.name} · {advisory.stage.name} stage</h2>
        </div>
        <div className="advisory-content">
          <div className="recommendation-box">
            <h3>Recommendation: <span className={`highlight-${advisory.status}`}>{advisory.recommendation}</span></h3>
            <div className="recommendation-details">
              <div className="detail-item">
                <CheckCircle size={18} color="var(--primary)"/>
                <p><strong>Time:</strong> {advisory.nextIrrigation}</p>
              </div>
              <div className="detail-item">
                <CheckCircle size={18} color="var(--primary)"/>
                <p><strong>Water:</strong> {advisory.waterQuantity}</p>
              </div>
            </div>
            {advisory.waterMm > 0 && (
              <button className="btn" style={{ marginTop: '1rem' }} onClick={handleIrrigated} disabled={irrigating}>
                <Droplets size={16}/> {irrigating ? 'Saving…' : 'Mark as Irrigated'}
              </button>
            )}
            {message && <p style={{ marginTop: '0.75rem', fontSize: '0.9rem', color: 'var(--text-dim)' }}>{message}</p>}
          </div>
          <div className="reason-box">
            <h3>Why?</h3>
            <ul>{advisory.reasons.map((r,i) => <li key={i}>{r}</li>)}</ul>
          </div>
        </div>
      </div>

      <h3 className="section-title anim-fade-up anim-delay-2">Current Field Conditions</h3>
      <div className="conditions-grid">
        {[
          { title:'Soil Moisture', val:`${sensorData.soilMoisture}%`, ideal:`${m.min}% - ${m.max}%`, icon:<Droplets size={28} color="var(--primary)"/>,
            pct:sensorData.soilMoisture, pcls: sensorData.soilMoisture < m.critical ? 'critical' : sensorData.soilMoisture < m.min ? 'warning' : 'normal' },
          { title:'Temperature', val:`${sensorData.temperature}°C`, ideal:`${t.min}°C - ${t.max}°C`, icon:<Thermometer size={28} color="var(--warning)"/>,
            pct:Math.min(100, Math.round(sensorData.temperature / 50 * 100)), pcls: sensorData.temperature > t.max ? 'warning' : 'normal' },
          { title:'Rainfall Prediction', val:rainCard.val, ideal:rainCard.ideal, icon:<CloudRain size={28} color="var(--accent)"/> },
        ].map((c,i) => (
          <div key={i} className={`card condition-card anim-fade-up anim-delay-${i+2}`}>
            <div className="condition-icon">{c.icon}</div>
            <div className="condition-info">
              <h4>{c.title}</h4>
              <div className="condition-value">{c.val}</div>
              <p>{c.pct != null ? `Ideal: ${c.ideal}` : c.ideal}</p>
              {c.pct != null && <div className="progress-bar"><div className={`progress-fill ${c.pcls}`} style={{width:`${c.pct}%`}}/></div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IrrigationAdvisory;
