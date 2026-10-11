import React, { useEffect, useState } from 'react';
import { Leaf, Droplets, Sun, Calendar, Info } from 'lucide-react';
import { fetchMyCrop } from '../services/api';

const CropInfo = () => {
  const [crop, setCrop] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMyCrop().then(setCrop).catch((err) => setError(err.message));
  }, []);

  if (error) return <p style={{ padding: '2rem', color: 'var(--danger)' }}>Could not load crop info: {error}</p>;
  if (!crop) return <p style={{ padding: '2rem', color: 'var(--text-muted)' }}>Loading crop info…</p>;

  const current = crop.currentStage;
  const stages = crop.stages.map((s, i) => ({
    num: i + 1,
    name: s.name,
    time: `${s.startDay}-${s.endDay} days`,
    state: i < current.index || current.harvestDue ? 'completed' : i === current.index ? 'active' : 'pending',
  }));

  const requirements = [
    { icon:<Droplets size={28} color="var(--accent)"/>, title:'Water Requirement', ...crop.requirements.water },
    { icon:<Sun size={28} color="var(--warning)"/>, title:'Temperature', ...crop.requirements.temperature },
    { icon:<Calendar size={28} color="var(--primary)"/>, title:'Duration', ...crop.requirements.duration },
  ];

  return (
    <div>
      <header className="page-header anim-fade-up">
        <h1>Crop Information</h1>
        <p>Essential data for {crop.name.toLowerCase()} cultivation</p>
      </header>

      <div className="card crop-header-card anim-fade-up anim-delay-1">
        <div className="crop-main-info">
          <div className="crop-icon-large"><Leaf size={48} color="var(--primary)"/></div>
          <div>
            <h2>{crop.name}</h2>
            <p className="crop-stage">
              Current Stage: <strong>{current.harvestDue ? 'Ready for Harvest' : `${current.name} Phase`}</strong>
              {' '}· Day {current.daysSinceSowing} since sowing
            </p>
            <p className="crop-desc">{crop.description}</p>
          </div>
        </div>
      </div>

      <h3 className="section-title anim-fade-up anim-delay-2">Growth Stages</h3>
      <div className="card stages-container anim-fade-up anim-delay-2">
        {stages.map(s => (
          <div key={s.num} className={`stage-item ${s.state}`}>
            <div className="stage-marker">{s.num}</div>
            <div className="stage-info">
              <h4>{s.name}</h4>
              <p>{s.time}</p>
              {s.state === 'active' && <span className="stage-badge">Current</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="req-grid">
        {requirements.map((r,i) => (
          <div key={i} className={`card req-card anim-fade-up anim-delay-${i+3}`}>
            {r.icon}
            <h3>{r.title}</h3>
            <p className="req-val">{r.value}</p>
            <p className="req-desc">{r.note}</p>
          </div>
        ))}
      </div>

      <div className="card tips-card anim-fade-up anim-delay-5">
        <h3 style={{display:'flex',alignItems:'center',gap:'0.5rem',marginBottom:'0.75rem'}}>
          <Info size={20} color="var(--primary)"/> Irrigation Tips
        </h3>
        <ul className="tips-list">
          {crop.tips.map((tip) => (
            <li key={tip.title}><strong>{tip.title}:</strong> {tip.text}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default CropInfo;
