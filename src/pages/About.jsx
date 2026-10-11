import React from 'react';
import { Code, Server, Cpu, Database } from 'lucide-react';

const About = () => (
  <div>
    <header className="page-header anim-fade-up">
      <h1>About the Project</h1>
      <p>WP2 Laboratory Mini Project</p>
    </header>

    <div className="card about-main-card anim-fade-up anim-delay-1">
      <div className="project-title">
        <h2>Irrigation Advisory System for Sugarcane Crop using AI and Sensor-based Technology</h2>
      </div>
      <div className="about-section">
        <h3>The Problem</h3>
        <p>Farmers often irrigate crops based on guesswork or fixed schedules. This leads to over-irrigation, under-irrigation, water wastage, and reduced crop yield.</p>
      </div>
      <div className="about-section">
        <h3>Our Solution</h3>
        <p>A smart irrigation system using real-time sensor data combined with AI-based recommendations to suggest exactly when and how much to irrigate.</p>
      </div>
    </div>

    <h3 className="section-title anim-fade-up anim-delay-2">Technologies</h3>
    <div className="tech-grid">
      {[
        { icon:<Code size={28} color="#61dafb"/>, title:'Frontend', desc:'React, HTML, CSS, JS' },
        { icon:<Server size={28} color="#539e43"/>, title:'Backend', desc:'Node.js, Express, MongoDB' },
        { icon:<Cpu size={28} color="var(--warning)"/>, title:'Advisory Engine', desc:'Crop rules + weather forecast' },
        { icon:<Database size={28} color="var(--primary)"/>, title:'IoT Sensors', desc:'Moisture, Temp, Humidity' },
      ].map((t,i) => (
        <div key={i} className={`tech-card anim-fade-up anim-delay-${i+2}`}>
          {t.icon}
          <h4>{t.title}</h4>
          <p>{t.desc}</p>
        </div>
      ))}
    </div>

    <h3 className="section-title anim-fade-up anim-delay-3">Team Members</h3>
    <div className="team-grid">
      <div className="card team-member glass-card anim-fade-up anim-delay-3">
        <div className="member-avatar">P</div>
        <h4>Param Sangani</h4>
        <p>Batch B2, IT</p>
        <span className="roll-no">16010424108</span>
      </div>
      <div className="card team-member glass-card anim-fade-up anim-delay-4">
        <div className="member-avatar" style={{background:'linear-gradient(135deg,#1565c0,#42a5f5)'}}>A</div>
        <h4>Ankit Vishvakarma</h4>
        <p>Batch B2, IT</p>
        <span className="roll-no">16010424120</span>
      </div>
      <div className="card team-member glass-card anim-fade-up anim-delay-5">
        <div className="member-avatar" style={{background:'linear-gradient(135deg,#574009,#7E5D0D)'}}>A</div>
        <h4>Aarya Thota</h4>
        <p>Batch B2, IT</p>
        <span className="roll-no">16010424115</span>
      </div>
    </div>
  </div>
);

export default About;
