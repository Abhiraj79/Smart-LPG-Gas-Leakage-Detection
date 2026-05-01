import { useState, useEffect, useRef, useCallback } from 'react';

// ─── Humanized Speech Phrases ───────────────────────────────────────────────
const SPEECH_PHRASES = {
  boot: [
    "AegisNet is now online. All sensors are calibrated and ready.",
    "Good to go. Pipeline monitoring has started — all systems nominal.",
    "System initialization complete. I'm watching all sensors for you.",
  ],
  warning: [
    "Hey, I'm detecting elevated hydrocarbon levels. Worth keeping an eye on this.",
    "Heads up — gas concentration is climbing above normal. I'll keep monitoring.",
    "Warning: I'm seeing unusual gas readings. Please check the area.",
    "Something's off. Hydrocarbon levels are higher than expected.",
  ],
  critical: [
    "This is serious. Critical gas concentration detected — I'm shutting the valve now. Please evacuate the area immediately.",
    "Emergency! I've detected a major gas leak. Valve is being closed automatically. Evacuate now, do not use any electrical switches.",
    "Critical alert! Gas levels are dangerously high. I've triggered an emergency shutoff. Please leave the area right away.",
  ],
  valveOpen: [
    "Valve is now open. Gas flow has resumed.",
    "Solenoid valve has been opened. Monitoring is active.",
    "Pipeline flow restored. I'm watching for any anomalies.",
  ],
  valveClosed: [
    "Valve closed. Gas flow has been stopped.",
    "Solenoid valve is now shut. The pipeline is isolated.",
    "I've closed the valve. The system is in isolation mode.",
  ],
  tankLow: [
    "Just a heads-up — tank level is running below 20 percent. You may want to schedule a refill soon.",
    "Tank is getting low. Only about 20 percent capacity remaining.",
  ],
  returning_nominal: [
    "Gas levels are back to normal. All clear.",
    "Great news — readings have returned to safe levels. System nominal.",
    "The situation has stabilized. Hydrocarbon levels are within safe range.",
  ],
};

const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

export const useAegisData = () => {
  const [isBooting, setIsBooting] = useState(true);
  const [bootProgress, setBootProgress] = useState(0);
  const [uptime, setUptime] = useState(0); // seconds

  // Advanced Telemetry Metrics
  const [ppm, setPpm] = useState(45);
  const [temperature, setTemperature] = useState(24.5);
  const [humidity, setHumidity] = useState(45.2);
  const [pressure, setPressure] = useState(101.3);
  const [flowRate, setFlowRate] = useState(12.5);
  const [co2, setCo2] = useState(412); // ppm CO2

  // Hardware Status
  const [isValveOpen, setIsValveOpen] = useState(true);
  const [tankLevel, setTankLevel] = useState(82.5);
  const [latency, setLatency] = useState(24);
  const [voltage, setVoltage] = useState(3.3);

  // Risk & Analytics
  const [riskScore, setRiskScore] = useState(0); // 0-100
  const [sensorHealth, setSensorHealth] = useState({ mq6: 98, dht22: 100, bmp280: 97 });

  const [logs, setLogs] = useState([]);
  const [alertLevel, setAlertLevel] = useState(1); // 1=Nominal, 2=Warning, 3=Critical
  const [demoModeActive, setDemoModeActive] = useState(false);

  const audioCtxRef = useRef(null);
  const sirenIntervalRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);
  const tankLowAlertedRef = useRef(false);
  const prevAlertLevelRef = useRef(1);
  const isSpeakingRef = useRef(false);

  const getAudioCtx = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtxRef.current;
  };

  // ─── Humanized Speech Engine ─────────────────────────────────────────────
  const speak = useCallback((text, priority = false) => {
    if (!('speechSynthesis' in window)) return;
    if (isSpeakingRef.current && !priority) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);

    // Pick a natural, warm voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v =>
      v.name.includes('Google UK English Female') ||
      v.name.includes('Microsoft Zira') ||
      v.name.includes('Samantha') ||
      v.name.includes('Karen') ||
      v.name.includes('Google US English')
    ) || voices.find(v => v.lang === 'en-US' && !v.name.includes('Male'));

    if (preferred) utterance.voice = preferred;

    // Natural conversational pacing
    utterance.rate = 0.92;
    utterance.pitch = 1.05;
    utterance.volume = 1.0;

    isSpeakingRef.current = true;
    utterance.onend = () => { isSpeakingRef.current = false; };
    utterance.onerror = () => { isSpeakingRef.current = false; };

    window.speechSynthesis.speak(utterance);
  }, []);

  // ─── Audio Engine ─────────────────────────────────────────────────────────
  const playSound = useCallback((type) => {
    try {
      const ctx = getAudioCtx();
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 2000;

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      const now = ctx.currentTime;

      switch (type) {
        case 'valve': {
          // Mechanical thunk
          osc.type = 'square';
          osc.frequency.setValueAtTime(80, now);
          osc.frequency.exponentialRampToValueAtTime(8, now + 0.25);
          gain.gain.setValueAtTime(0.4, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
          osc.start(now); osc.stop(now + 0.25);
          break;
        }
        case 'warning': {
          // Two-tone beep
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.connect(gain2); gain2.connect(ctx.destination);
          osc.type = 'sine'; osc2.type = 'sine';
          osc.frequency.value = 880;
          osc2.frequency.value = 660;
          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.3, now + 0.05);
          gain.gain.linearRampToValueAtTime(0.3, now + 0.2);
          gain.gain.linearRampToValueAtTime(0, now + 0.25);
          gain2.gain.setValueAtTime(0, now + 0.3);
          gain2.gain.linearRampToValueAtTime(0.3, now + 0.35);
          gain2.gain.linearRampToValueAtTime(0.3, now + 0.5);
          gain2.gain.linearRampToValueAtTime(0, now + 0.55);
          osc.start(now); osc.stop(now + 0.25);
          osc2.start(now + 0.3); osc2.stop(now + 0.55);
          break;
        }
        case 'heartbeat': {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(60, now);
          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.8, now + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
          osc.start(now); osc.stop(now + 0.25);
          break;
        }
        case 'defcon_siren': {
          // Wailing siren with distortion
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(800, now);
          osc.frequency.linearRampToValueAtTime(1400, now + 0.4);
          osc.frequency.linearRampToValueAtTime(800, now + 0.8);
          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.7, now + 0.05);
          gain.gain.linearRampToValueAtTime(0.7, now + 0.75);
          gain.gain.linearRampToValueAtTime(0, now + 0.8);
          osc.start(now); osc.stop(now + 0.8);
          break;
        }
        case 'nominal': {
          // Soft confirmation chime
          osc.type = 'sine';
          osc.frequency.setValueAtTime(523, now);
          osc.frequency.setValueAtTime(659, now + 0.12);
          osc.frequency.setValueAtTime(784, now + 0.24);
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
          osc.start(now); osc.stop(now + 0.5);
          break;
        }
      }
    } catch (e) { /* silent fail */ }
  }, []);

  const addLog = useCallback((message, type = 'info') => {
    setLogs(prev => [{
      id: Date.now() + Math.random(),
      time: new Date().toLocaleTimeString('en-IN', { hour12: true }),
      message,
      type
    }, ...prev].slice(0, 120));
  }, []);

  // ─── Boot Sequence ────────────────────────────────────────────────────────
  useEffect(() => {
    // Pre-load voices
    window.speechSynthesis?.getVoices();
    window.speechSynthesis?.addEventListener('voiceschanged', () => window.speechSynthesis.getVoices());

    const bootInterval = setInterval(() => {
      setBootProgress(prev => {
        const increment = Math.random() * 12 + 4;
        if (prev + increment >= 100) {
          clearInterval(bootInterval);
          setIsBooting(false);
          setTimeout(() => {
            speak(pickRandom(SPEECH_PHRASES.boot));
            addLog('SYSTEM INITIALIZATION COMPLETE', 'success');
            addLog('MQ-6 GAS SENSOR: CALIBRATED ✓', 'success');
            addLog('DHT-22 ENVIRONMENTAL SENSOR: ONLINE ✓', 'success');
            addLog('BMP-280 PRESSURE SENSOR: ONLINE ✓', 'success');
            addLog('SOLENOID VALVE: ENGAGED (OPEN) ✓', 'success');
            addLog('AEGISNET CLOUD SYNC: CONNECTED ✓', 'success');
            playSound('nominal');
          }, 600);
          return 100;
        }
        return prev + increment;
      });
    }, 130);
    return () => clearInterval(bootInterval);
  }, [speak, addLog, playSound]);

  // ─── Uptime Counter ───────────────────────────────────────────────────────
  useEffect(() => {
    if (isBooting) return;
    const t = setInterval(() => setUptime(p => p + 1), 1000);
    return () => clearInterval(t);
  }, [isBooting]);

  // ─── Valve Toggle ─────────────────────────────────────────────────────────
  const toggleValve = useCallback(() => {
    setIsValveOpen(prev => {
      const newState = !prev;
      playSound('valve');
      addLog(`HARDWARE OVERRIDE: SOLENOID VALVE ${newState ? 'OPENED' : 'CLOSED'}`, 'warning');
      speak(pickRandom(newState ? SPEECH_PHRASES.valveOpen : SPEECH_PHRASES.valveClosed));
      if (!newState) {
        setAlertLevel(1);
        setPpm(45);
        setFlowRate(0);
      } else {
        setFlowRate(12.5);
      }
      return newState;
    });
  }, [playSound, addLog, speak]);

  // ─── Siren / Heartbeat Loop ───────────────────────────────────────────────
  useEffect(() => {
    if (alertLevel === 3 && isValveOpen) {
      sirenIntervalRef.current = setInterval(() => playSound('defcon_siren'), 900);
      heartbeatIntervalRef.current = setInterval(() => playSound('heartbeat'), 600);
    } else {
      clearInterval(sirenIntervalRef.current);
      clearInterval(heartbeatIntervalRef.current);
    }
    return () => {
      clearInterval(sirenIntervalRef.current);
      clearInterval(heartbeatIntervalRef.current);
    };
  }, [alertLevel, isValveOpen, playSound]);

  // ─── Main Telemetry Engine ────────────────────────────────────────────────
  useEffect(() => {
    if (isBooting || demoModeActive) return;

    const interval = setInterval(() => {
      if (!isValveOpen) {
        setPpm(prev => Math.max(8, prev - (Math.random() * 12 + 5)));
        setFlowRate(0);
        setPressure(prev => Math.min(101.8, prev + 0.05));
        setAlertLevel(1);
        return;
      }

      setPpm(prev => Number(Math.max(12, Math.min(1000, prev + (Math.random() - 0.5) * 8)).toFixed(1)));
      setTemperature(prev => Number(Math.max(18, Math.min(50, prev + (Math.random() - 0.5) * 0.3)).toFixed(1)));
      setHumidity(prev => Number(Math.max(20, Math.min(95, prev + (Math.random() - 0.5) * 0.6)).toFixed(1)));
      setPressure(prev => Number(Math.max(98, Math.min(104, prev + (Math.random() - 0.5) * 0.12)).toFixed(2)));
      setFlowRate(prev => Number(Math.max(0, Math.min(50, 12.5 + (Math.random() - 0.5) * 0.5)).toFixed(2)));
      setCo2(prev => Number(Math.max(400, Math.min(600, prev + (Math.random() - 0.5) * 2)).toFixed(0)));
      setLatency(Math.floor(18 + Math.random() * 15));
      setVoltage(Number((3.3 + (Math.random() - 0.5) * 0.06).toFixed(2)));

      // Slight sensor health drift
      setSensorHealth({
        mq6: Math.max(90, Math.min(100, Math.floor(98 + (Math.random() - 0.5) * 2))),
        dht22: Math.max(90, Math.min(100, Math.floor(100 + (Math.random() - 0.5) * 1))),
        bmp280: Math.max(90, Math.min(100, Math.floor(97 + (Math.random() - 0.5) * 2))),
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isValveOpen, isBooting, demoModeActive]);

  // ─── Risk Score Calculator ────────────────────────────────────────────────
  useEffect(() => {
    if (isBooting) return;
    const ppmScore = Math.min(60, (ppm / 300) * 60);
    const flowScore = flowRate > 20 ? Math.min(20, (flowRate - 12) * 2.5) : 0;
    const pressureScore = pressure < 99 ? Math.min(20, (101 - pressure) * 5) : 0;
    setRiskScore(Math.min(100, Math.floor(ppmScore + flowScore + pressureScore)));
  }, [ppm, flowRate, pressure, isBooting]);

  // ─── Alert Level Evaluator ────────────────────────────────────────────────
  useEffect(() => {
    if (!isValveOpen || isBooting) return;

    if (ppm > 300) {
      if (prevAlertLevelRef.current !== 3) {
        prevAlertLevelRef.current = 3;
        setAlertLevel(3);
        addLog('⚠ CRITICAL: HYDROCARBON CONCENTRATION EXCEEDS 300 PPM SAFETY LIMIT', 'danger');
        addLog('INITIATING EMERGENCY PROTOCOL — AUTOMATED SHUTOFF IN 3 SECONDS', 'danger');
        speak(pickRandom(SPEECH_PHRASES.critical), true);
        setTimeout(() => {
          setIsValveOpen(curr => {
            if (curr) {
              playSound('valve');
              addLog('EMERGENCY SHUTOFF: SOLENOID VALVE CLOSED BY SYSTEM', 'danger');
              return false;
            }
            return curr;
          });
        }, 3000);
      }
    } else if (ppm > 150) {
      if (prevAlertLevelRef.current !== 2) {
        prevAlertLevelRef.current = 2;
        setAlertLevel(2);
        addLog('⚡ WARNING: ELEVATED HYDROCARBON LEVELS DETECTED (>150 PPM)', 'warning');
        playSound('warning');
        speak(pickRandom(SPEECH_PHRASES.warning));
      }
    } else {
      if (prevAlertLevelRef.current !== 1) {
        prevAlertLevelRef.current = 1;
        setAlertLevel(1);
        addLog('✓ STATUS NORMALIZED: PPM WITHIN SAFE RANGE', 'success');
        playSound('nominal');
        speak(pickRandom(SPEECH_PHRASES.returning_nominal));
      }
    }
  }, [ppm, isValveOpen, isBooting, addLog, speak, playSound]);

  // ─── Tank Level Drain ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!isValveOpen || isBooting) return;
    const interval = setInterval(() => {
      setTankLevel(prev => {
        const next = Number(Math.max(0, prev - Math.random() * 0.02).toFixed(2));
        if (next < 20 && !tankLowAlertedRef.current) {
          tankLowAlertedRef.current = true;
          addLog('⚠ TANK LEVEL CRITICAL: BELOW 20% — SCHEDULE REFILL', 'warning');
          speak(pickRandom(SPEECH_PHRASES.tankLow));
        }
        if (next >= 20) tankLowAlertedRef.current = false;
        return next;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [isValveOpen, isBooting, addLog, speak]);

  // ─── Demo Scenarios ───────────────────────────────────────────────────────
  const triggerScenario = useCallback((scenario) => {
    setDemoModeActive(true);
    if (!isValveOpen) {
      setIsValveOpen(true);
      playSound('valve');
    }
    prevAlertLevelRef.current = 1;
    tankLowAlertedRef.current = false;

    switch (scenario) {
      case 'nominal':
        setPpm(45); setFlowRate(12.5); setPressure(101.3); setCo2(415);
        setAlertLevel(1);
        addLog('SCENARIO: NOMINAL OPERATION RESTORED', 'info');
        speak(pickRandom(SPEECH_PHRASES.returning_nominal));
        playSound('nominal');
        setDemoModeActive(false);
        break;
      case 'micro-leak':
        setPpm(185); setFlowRate(13.4); setPressure(100.7); setCo2(435);
        addLog('DEMO: MICRO-LEAK SCENARIO INJECTED', 'warning');
        break;
      case 'rupture':
        setPpm(460); setFlowRate(30.5); setPressure(94.8); setCo2(475);
        addLog('DEMO: CATASTROPHIC RUPTURE SCENARIO INJECTED', 'danger');
        break;
    }
  }, [isValveOpen, playSound, addLog, speak]);

  const formatUptime = () => {
    const h = Math.floor(uptime / 3600);
    const m = Math.floor((uptime % 3600) / 60);
    const s = uptime % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return {
    isBooting, bootProgress,
    ppm, temperature, humidity, pressure, flowRate, co2,
    isValveOpen, tankLevel, latency, voltage,
    logs, alertLevel, riskScore, sensorHealth, uptime: formatUptime(),
    toggleValve, triggerScenario,
  };
};
