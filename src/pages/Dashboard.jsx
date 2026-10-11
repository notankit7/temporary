import React, { useEffect, useState } from 'react';
import { Droplets, Thermometer, Wind, CloudRain, Waves, Zap, ArrowRight, TrendingDown, CloudSun } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchSensorData, fetchAdvisoryData, fetchAlertsData, getStoredUser } from '../services/api';
import { timeAgo } from '../utils/format';

const StatCard = ({ title, value, icon, color, status, delay }) => (
  <div className={`stat-card card anim-fade-up anim-delay-${delay}`}>
    <div className="stat-icon" style={{ background: `${color}18`, color }}>
      {icon}
    </div>
    <div className="stat-details">
      <h3>{title}</h3>
      <div className="stat-value">{value}</div>
      {status && <div className={`stat-status status-${status.type}`}>● {status.text}</div>}
    </div>
  </div>
);

const HEALTH = { normal: 'Good', warning: 'Fair', critical: 'Stressed' };

const Dashboard = () => {
  // State to hold data coming back from the backend API,
  // and a loading flag while the fetch is in flight.
  const [sensorData, setSensorData] = useState(null);
  const [advisory, setAdvisory] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const user = getStoredUser();

  // useEffect with an empty dependency array runs once, when the
  // page first loads — the usual place to fetch data.
  useEffect(() => {
    Promise.all([fetchSensorData(), fetchAdvisoryData(), fetchAlertsData({ limit: 3 })])
      .then(([sensors, advisoryData, alertsData]) => {
        setSensorData(sensors);
        setAdvisory(advisoryData);
        setAlerts(alertsData);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p style={{ padding: '2rem', color: 'var(--text-muted)' }}>Loading dashboard data…</p>;
  }
  if (error) {
    return <p style={{ padding: '2rem', color: 'var(--danger)' }}>Could not load dashboard: {error}</p>;
  }

  const moisture = sensorData.soilMoisture;
  const { min: moistMin, max: moistMax } = advisory.thresholds.moisture;
  const cropName = advisory.crop.name;
  const needsWater = advisory.status !== 'normal' && advisory.waterMm > 0;
  const rec = {
    title: advisory.recommendation,
    cls: advisory.status,
    icon: needsWater ? <TrendingDown size={18}/> : advisory.waterMm === 0 && advisory.status !== 'normal' ? <CloudSun size={18}/> : <Zap size={18}/>,
  };

  return (
    <div>
      <header className="page-header anim-fade-up">
        <h1>Welcome back, {user?.name?.split(' ')[0] || 'Farmer'}</h1>
        <p>Here's your farm overview for today</p>
      </header>

      {/* Hero Banner */}
      <div className="hero-banner anim-fade-up anim-delay-1">
        <div className={`rec-badge rec-${rec.cls}`}>
          {rec.icon} {rec.title}
        </div>
        <h2>
          {needsWater
            ? `Your ${cropName.toLowerCase()} needs water ${advisory.status === 'critical' ? 'today' : 'soon'}`
            : advisory.status === 'normal'
              ? 'Your crop is doing well'
              : 'Rain is on the way — hold irrigation'}
        </h2>
        <p>
          Soil moisture at <strong style={{color:'var(--primary)'}}>{moisture}%</strong> ·
          Temperature {sensorData.temperature}°C ·
          Next irrigation: <strong>{advisory.nextIrrigation}</strong>
        </p>
        <Link to="/app/advisory" className="btn" style={{marginTop:'1.25rem'}}>
          View Full Advisory <ArrowRight size={16}/>
        </Link>
      </div>

      {/* Sensor Stats */}
      <div className="stats-grid">
        <StatCard title="Soil Moisture" value={`${sensorData.soilMoisture}%`}
          icon={<Droplets size={22}/>} color="var(--primary)"
          status={moisture < moistMin ? {type:'warning',text:'Low'} : moisture > moistMax ? {type:'warning',text:'High'} : {type:'normal',text:'OK'}} delay={1} />
        <StatCard title="Temperature" value={`${sensorData.temperature}°C`}
          icon={<Thermometer size={22}/>} color="var(--warning)" delay={2} />
        <StatCard title="Humidity" value={`${sensorData.humidity}%`}
          icon={<Wind size={22}/>} color="var(--accent)" delay={3} />
        <StatCard title="Rainfall" value={`${sensorData.rainfall} mm`}
          icon={<CloudRain size={22}/>} color="#b0bec5" delay={4} />
        <StatCard title="Water Level" value={`${sensorData.waterLevel}%`}
          icon={<Waves size={22}/>} color="var(--primary-light)" delay={5} />
      </div>

      {/* Bottom Grid */}
      <div className="dashboard-grid">
        <div className="card alerts-widget anim-fade-up anim-delay-3">
          <h3>Recent Alerts</h3>
          <div className="alert-list">
            {alerts.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No alerts yet.</p>}
            {alerts.map(a => (
              <div key={a.id} className={`alert-item alert-${a.type}`}>
                <div className="alert-content">
                  <p>{a.message}</p>
                  <span>{timeAgo(a.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
          <Link to="/app/alerts" className="view-all">View All →</Link>
        </div>

        <div className="card info-widget anim-fade-up anim-delay-4">
          <h3>Crop Health</h3>
          <div className="health-status">
            <div className="health-circle">
              <span>{HEALTH[advisory.status]}</span>
            </div>
            <p>
              {cropName} is in the {advisory.stage.name} stage (day {advisory.stage.daysSinceSowing}).
              Maintain moisture between {moistMin}% and {moistMax}%.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
