import { useState, useEffect } from 'react';
import {
  Activity, ShieldAlert, Power, Wifi,
  Zap, Droplets, Clock, Flame, AlertTriangle,
  Fingerprint, Radio, PlayCircle, Thermometer,
  Wind, Gauge, Server, CheckCircle2, TrendingUp,
  BarChart3, Shield, Cpu, BatteryMedium
} from 'lucide-react';
import {
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, CartesianGrid
} from 'recharts';
import { useAegisData } from './hooks/useAegisData';

// ─── Risk Gauge Component ──────────────────────────────────────────────────
const RiskGauge = ({ score }) => {
  const color = score >= 70 ? '#EF4444' : score >= 35 ? '#F59E0B' : '#10B981';
  const pct = Math.min(100, score);
  return (
    <div style={{ textAlign: 'center' }}>
      <svg viewBox="0 0 120 70" width="160" height="90">
        <path d="M10 65 A50 50 0 0 1 110 65" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" strokeLinecap="round" />
        <path
          d="M10 65 A50 50 0 0 1 110 65"
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * 157} 157`}
          style={{ transition: 'all 1s ease', filter: `drop-shadow(0 0 6px ${color})` }}
        />
        <text x="60" y="62" textAnchor="middle" fill={color} fontSize="18" fontWeight="700" fontFamily="monospace">{score}</text>
        <text x="60" y="75" textAnchor="middle" fill="#6B7280" fontSize="8" fontFamily="monospace">RISK SCORE</text>
      </svg>
    </div>
  );
};

// ─── Sensor Health Bar ─────────────────────────────────────────────────────
const HealthBar = ({ label, value }) => {
  const color = value >= 95 ? '#10B981' : value >= 80 ? '#F59E0B' : '#EF4444';
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
        <span style={{ fontSize: '11px', color, fontFamily: 'monospace' }}>{value}%</span>
      </div>
      <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px' }}>
        <div style={{ height: '100%', width: `${value}%`, background: color, borderRadius: '2px', transition: 'width 1s ease' }} />
      </div>
    </div>
  );
};

// ─── Stat Card ─────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, unit, color = 'var(--accent-cyan)', alert = false }) => (
  <div className="metric-card" style={{ borderTop: `2px solid ${color}` }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
      <span className="metric-label">{label}</span>
      <Icon size={14} style={{ color, opacity: 0.7 }} />
    </div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
      <span className={alert ? 'metric-value glitch-effect' : 'metric-value'} data-text={value} style={{ color }}>
        {value}
      </span>
      {unit && <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{unit}</span>}
    </div>
  </div>
);

// ─── Main App ──────────────────────────────────────────────────────────────
const App = () => {
  const {
    isBooting, bootProgress,
    ppm, temperature, humidity, pressure, flowRate, co2,
    isValveOpen, tankLevel, latency, voltage,
    logs, alertLevel, riskScore, sensorHealth, uptime,
    toggleValve, triggerScenario
  } = useAegisData();

  const [telemetryHistory, setTelemetryHistory] = useState([]);

  useEffect(() => {
    if (isBooting) return;
    const now = new Date();
    setTelemetryHistory(prev => [...prev, {
      time: now.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      ppm, pressure, flowRate
    }].slice(-40));
  }, [ppm, pressure, flowRate, isBooting]);

  const getStatus = () => {
    if (!isValveOpen) return { text: 'SYSTEM ISOLATED', type: 'warning' };
    if (alertLevel === 3) return { text: 'CRITICAL RUPTURE', type: 'danger' };
    if (alertLevel === 2) return { text: 'ELEVATED GAS', type: 'warning' };
    return { text: 'ALL SYSTEMS NOMINAL', type: 'safe' };
  };
  const status = getStatus();

  let themeClass = '';
  if (alertLevel === 3) themeClass = 'theme-defcon1';
  else if (alertLevel === 2) themeClass = 'theme-warning';

  const ppmColor = alertLevel === 3 ? 'var(--status-danger)' : alertLevel === 2 ? 'var(--status-warning)' : 'var(--accent-cyan)';
  const chartColor = alertLevel === 3 ? '#EF4444' : alertLevel === 2 ? '#F59E0B' : '#00F0FF';

  // ── Boot Screen ──────────────────────────────────────────────────────────
  if (isBooting) {
    return (
      <div className={`boot-screen`}>
        <div className="matrix-bg" />
        <div className="scanline" />
        <div className="boot-content">
          <div className="boot-icon-ring">
            <Flame size={36} style={{ color: 'var(--accent-cyan)' }} />
          </div>
          <h1 className="glitch-effect boot-title" data-text="AEGISNET IOT v3.4.1">AEGISNET IOT v3.4.1</h1>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '13px', letterSpacing: '3px', marginBottom: '32px' }}>
            INDUSTRIAL PIPELINE SECURITY SYSTEM
          </p>
          <div className="boot-bar-wrap">
            <div className="boot-bar-fill" style={{ width: `${bootProgress}%` }} />
          </div>
          <div className="boot-steps">
            {[
              { label: 'MQ-6 Gas Sensor', done: bootProgress > 20 },
              { label: 'DHT-22 Env Array', done: bootProgress > 45 },
              { label: 'BMP-280 Pressure', done: bootProgress > 65 },
              { label: 'Solenoid Valve', done: bootProgress > 80 },
              { label: 'AegisNet Uplink', done: bootProgress > 95 },
            ].map(s => (
              <div key={s.label} className="boot-step">
                {s.done
                  ? <CheckCircle2 size={12} style={{ color: 'var(--status-safe)' }} />
                  : <div className="boot-step-dot" />}
                <span style={{ color: s.done ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>{s.label}</span>
              </div>
            ))}
          </div>
          <p style={{ fontFamily: 'monospace', fontSize: '13px', color: 'var(--text-tertiary)', marginTop: '16px' }}>
            FIRMWARE BOOT: {Math.floor(bootProgress)}%
          </p>
        </div>
      </div>
    );
  }

  // ── Main Dashboard ───────────────────────────────────────────────────────
  return (
    <div className={`dashboard-container ${themeClass} ${alertLevel === 3 && isValveOpen ? 'animate-shake' : ''}`}>
      <div className="matrix-bg" />
      {alertLevel === 3 && isValveOpen && <div className="strobe-overlay" />}
      {alertLevel >= 2 && isValveOpen && <div className="scanline" />}

      <div className="dash-inner">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <header className="glass-panel header-bar">
          <div className="flex-center" style={{ gap: '16px' }}>
            <div className="header-logo" style={{ background: ppmColor }}>
              <Flame size={22} />
            </div>
            <div>
              <h1 className="header-title">
                AEGIS<span style={{ color: ppmColor }}>NET</span> IOT
              </h1>
              <p className="header-sub">Industrial Pipeline Security • AI Gas Leakage System</p>
            </div>
          </div>

          <div className="header-meta">
            <div className="meta-pill">
              <div className={`status-indicator status-${status.type}`} />
              <span style={{ color: `var(--status-${status.type})`, fontWeight: 600, fontSize: '13px' }}>{status.text}</span>
            </div>
            <div className="meta-pill">
              <Wifi size={13} style={{ color: 'var(--text-secondary)' }} />
              <span>{latency}ms</span>
            </div>
            <div className="meta-pill">
              <Zap size={13} style={{ color: 'var(--text-secondary)' }} />
              <span>{voltage}V</span>
            </div>
            <div className="meta-pill">
              <Clock size={13} style={{ color: 'var(--text-secondary)' }} />
              <span className="mono">{uptime}</span>
            </div>
          </div>
        </header>

        {/* ── Critical Banner ─────────────────────────────────────────────── */}
        {alertLevel === 3 && isValveOpen && (
          <div className="hazard-stripes critical-banner">
            <AlertTriangle size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
            ⚠ CRITICAL GAS RUPTURE — AUTOMATED SHUTOFF ACTIVE — EVACUATE IMMEDIATELY
            <AlertTriangle size={16} style={{ display: 'inline', marginLeft: '8px', verticalAlign: 'middle' }} />
          </div>
        )}

        {/* ── Simulation Controller ────────────────────────────────────────── */}
        <div className="glass-panel sim-bar">
          <div className="flex-center" style={{ gap: '8px', color: 'var(--text-secondary)' }}>
            <PlayCircle size={15} />
            <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Simulation Controller</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => triggerScenario('nominal')} className="sim-btn btn-default">⬤ Reset Nominal</button>
            <button onClick={() => triggerScenario('micro-leak')} className="sim-btn btn-warning">⚡ Simulate Micro-Leak</button>
            <button onClick={() => triggerScenario('rupture')} className="sim-btn btn-danger">🔥 Simulate Rupture</button>
          </div>
        </div>

        {/* ── Main Grid ───────────────────────────────────────────────────── */}
        <div className="main-grid">

          {/* LEFT: Telemetry + Env + Controls */}
          <div className="col-left">

            {/* Primary Telemetry Panel */}
            <div className="glass-panel tele-panel" style={{ position: 'relative', overflow: 'hidden' }}>
              {isValveOpen && alertLevel < 3 && <div className="radar-overlay" />}

              <div className="panel-header">
                <h2 className="panel-title">
                  <Activity size={15} className={alertLevel > 1 ? 'animate-flash' : ''} />
                  MQ-6 Core Telemetry
                </h2>
                <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Live • 2s refresh</span>
              </div>

              <div className="metrics-row">
                <StatCard icon={Flame} label="Hydrocarbon (PPM)" value={ppm.toFixed(1)} color={ppmColor} alert={alertLevel === 3} />
                <StatCard icon={Gauge} label="Pipeline Pressure" value={pressure.toFixed(1)} unit="kPa" color="var(--accent-purple)" />
                <StatCard icon={Wind} label="Gas Flow Rate" value={flowRate.toFixed(1)} unit="L/min" color="var(--accent-blue)" />
                <StatCard icon={BarChart3} label="CO₂ Level" value={co2} unit="ppm" color="#34D399" />
              </div>

              <div style={{ height: '240px', marginTop: '24px', position: 'relative', zIndex: 1, minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={telemetryHistory} margin={{ top: 5, right: 4, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradPpm" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chartColor} stopOpacity={0.35} />
                        <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradPressure" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="time" hide />
                    <YAxis yAxisId="left" domain={[0, 600]} tick={{ fontSize: 10, fill: '#6B7280' }} width={40} />
                    <YAxis yAxisId="right" orientation="right" domain={[95, 105]} hide />
                    <Tooltip
                      contentStyle={{ background: 'rgba(15,18,25,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Area yAxisId="left" type="monotone" dataKey="ppm" name="PPM" stroke={chartColor} strokeWidth={2} fill="url(#gradPpm)" isAnimationActive={false} />
                    <Area yAxisId="right" type="monotone" dataKey="pressure" name="Pressure kPa" stroke="#8B5CF6" strokeWidth={2} fill="url(#gradPressure)" isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bottom Row: Env + Valve */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

              {/* Environmental */}
              <div className="glass-panel" style={{ padding: '20px' }}>
                <h2 className="panel-title" style={{ marginBottom: '16px' }}>
                  <Radio size={14} /> DHT-22 Environmental
                </h2>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div className="env-card">
                    <Thermometer size={16} style={{ color: '#FB923C' }} />
                    <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Temp</span>
                    <span style={{ fontSize: '22px', fontFamily: 'monospace', color: '#FB923C' }}>{temperature.toFixed(1)}°C</span>
                  </div>
                  <div className="env-card">
                    <Droplets size={16} style={{ color: '#38BDF8' }} />
                    <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Humidity</span>
                    <span style={{ fontSize: '22px', fontFamily: 'monospace', color: '#38BDF8' }}>{humidity.toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              {/* Valve Control */}
              <div className="glass-panel" style={{ padding: '20px', border: !isValveOpen ? '1px solid var(--status-warning)' : '1px solid var(--glass-border)' }}>
                <h2 className="panel-title" style={{ marginBottom: '16px' }}>
                  <Fingerprint size={14} /> Physical Isolation
                </h2>
                <button onClick={toggleValve} className="advanced-btn valve-btn"
                  style={{
                    background: isValveOpen ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                    border: `1px solid ${isValveOpen ? 'var(--status-safe)' : 'var(--status-warning)'}`,
                    color: isValveOpen ? 'var(--status-safe)' : 'var(--status-warning)',
                  }}>
                  <Power size={16} />
                  {isValveOpen ? 'Solenoid: OPEN — Click to Close' : 'Solenoid: CLOSED — Click to Open'}
                </button>
                <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '10px', textAlign: 'center' }}>
                  {isValveOpen ? '● Gas flow active' : '○ Pipeline isolated'}
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT Column */}
          <div className="col-right">

            {/* Risk Score */}
            <div className="glass-panel" style={{ padding: '20px' }}>
              <h2 className="panel-title" style={{ marginBottom: '12px' }}>
                <Shield size={14} /> AI Risk Assessment
              </h2>
              <RiskGauge score={riskScore} />
              <div style={{ textAlign: 'center', marginTop: '4px' }}>
                <span style={{
                  fontSize: '11px', padding: '4px 12px', borderRadius: '20px', fontWeight: 600,
                  background: riskScore >= 70 ? 'rgba(239,68,68,0.2)' : riskScore >= 35 ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)',
                  color: riskScore >= 70 ? '#EF4444' : riskScore >= 35 ? '#F59E0B' : '#10B981',
                }}>
                  {riskScore >= 70 ? 'HIGH RISK' : riskScore >= 35 ? 'ELEVATED RISK' : 'LOW RISK'}
                </span>
              </div>
              <div style={{ marginTop: '16px', background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px', borderLeft: `3px solid ${riskScore >= 70 ? '#EF4444' : riskScore >= 35 ? '#F59E0B' : 'var(--accent-blue)'}` }}>
                <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginBottom: '4px', textTransform: 'uppercase' }}>ML Classification</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: alertLevel === 3 ? '#EF4444' : alertLevel === 2 ? '#F59E0B' : 'var(--text-primary)' }}>
                  {alertLevel === 3 ? '🔴 CRITICAL RUPTURE IDENTIFIED' : alertLevel === 2 ? '🟡 MICRO-LEAK DETECTED' : '🟢 NOMINAL USAGE PATTERN'}
                </div>
              </div>
            </div>

            {/* Tank Analytics */}
            <div className="glass-panel" style={{ padding: '20px' }}>
              <h2 className="panel-title" style={{ marginBottom: '16px' }}>
                <BatteryMedium size={14} /> Tank Analytics
              </h2>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>Current Capacity</span>
                  <span style={{ fontWeight: 700, color: tankLevel < 20 ? 'var(--status-danger)' : 'var(--text-primary)' }}>{tankLevel.toFixed(1)}%</span>
                </div>
                <div style={{ height: '8px', background: 'var(--bg-base)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${tankLevel}%`,
                    background: tankLevel < 20 ? 'var(--status-danger)' : tankLevel < 40 ? 'var(--status-warning)' : 'linear-gradient(90deg, var(--accent-blue), var(--accent-cyan))',
                    transition: 'width 1s ease',
                    boxShadow: tankLevel < 20 ? '0 0 8px rgba(239,68,68,0.5)' : '0 0 8px rgba(0,240,255,0.2)',
                  }} />
                </div>
                <div style={{ marginTop: '6px', fontSize: '11px', color: 'var(--text-tertiary)', textAlign: 'right' }}>
                  Est. depletion: ~{Math.floor(tankLevel * 0.4)} days
                </div>
              </div>
            </div>

            {/* Sensor Health */}
            <div className="glass-panel" style={{ padding: '20px' }}>
              <h2 className="panel-title" style={{ marginBottom: '16px' }}>
                <Cpu size={14} /> Sensor Health
              </h2>
              <HealthBar label="MQ-6 Gas Sensor" value={sensorHealth.mq6} />
              <HealthBar label="DHT-22 Env Array" value={sensorHealth.dht22} />
              <HealthBar label="BMP-280 Pressure" value={sensorHealth.bmp280} />
            </div>

            {/* Audit Log */}
            <div className="glass-panel" style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: '280px' }}>
              <h2 className="panel-title" style={{ marginBottom: '14px' }}>
                <ShieldAlert size={14} /> System Audit Log
              </h2>
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
                {logs.map((log, i) => (
                  <div key={log.id} className={i === 0 ? 'log-entry animate-slide-in' : 'log-entry'}
                    style={{
                      borderLeft: `2px solid ${log.type === 'danger' ? '#EF4444' : log.type === 'warning' ? '#F59E0B' : log.type === 'success' ? '#10B981' : 'rgba(255,255,255,0.1)'}`,
                      background: log.type === 'danger' ? 'rgba(239,68,68,0.07)' : log.type === 'warning' ? 'rgba(245,158,11,0.07)' : 'rgba(0,0,0,0.2)',
                    }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginBottom: '3px', display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <Clock size={9} /> {log.time}
                    </div>
                    <div style={{ fontSize: '11px', color: log.type === 'danger' ? '#EF4444' : log.type === 'success' ? '#10B981' : 'var(--text-primary)' }}>
                      {log.message}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
