// Rule-based irrigation advisory engine.
//
// Inputs: the latest sensor reading, recent history (for the drying trend),
// the crop's thresholds, and an optional rain forecast. Output: a
// recommendation, its urgency, reasons, timing and how much water to apply.

const RAIN_HOLD_MM = 10; // forecast rain (next 48h) that makes it worth waiting

const fmtTime = (d) =>
  d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }).toUpperCase();
const fmtDay = (d) => d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

function dayLabel(date, now) {
  const startOf = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diff = Math.round((startOf(date) - startOf(now)) / 86_400_000);
  if (diff === 0) return `Today, ${fmtTime(date)}`;
  if (diff === 1) return `Tomorrow, ${fmtTime(date)}`;
  return `${fmtDay(date)}, ${fmtTime(date)}`;
}

// Irrigating at 6 AM or 6 PM keeps evaporation losses low.
function nextIrrigationSlot(now, minHoursAhead = 0) {
  const earliest = new Date(now.getTime() + minHoursAhead * 3_600_000);
  // 30 = 6 AM the following day
  for (const hour of [6, 18, 30]) {
    const slot = new Date(earliest);
    slot.setHours(hour, 0, 0, 0);
    if (slot >= earliest) return slot;
  }
}

// Least-squares slope of soil moisture over time, in % per hour.
export function moistureTrend(history) {
  if (history.length < 3) return null;
  const t0 = new Date(history[0].createdAt).getTime();
  const pts = history.map((r) => [(new Date(r.createdAt).getTime() - t0) / 3_600_000, r.soilMoisture]);
  const n = pts.length;
  const sx = pts.reduce((a, [x]) => a + x, 0);
  const sy = pts.reduce((a, [, y]) => a + y, 0);
  const sxx = pts.reduce((a, [x]) => a + x * x, 0);
  const sxy = pts.reduce((a, [x, y]) => a + x * y, 0);
  const denom = n * sxx - sx * sx;
  if (denom === 0) return null;
  return (n * sxy - sx * sy) / denom;
}

export function waterNeeded(crop, moisture) {
  const target = (crop.moisture.min + crop.moisture.max) / 2;
  const deficit = Math.max(0, target - moisture);
  const mm = Math.round((deficit / 100) * crop.rootZoneMm);
  return { target, mm, litresPerHectare: mm * 10_000 };
}

export function buildAdvisory({ reading, history = [], crop, stage, forecast, now = new Date() }) {
  const { moisture: m, temperature: t } = crop;
  const moisture = reading.soilMoisture;
  const reasons = [];

  const rainMm = forecast?.rainNext48hMm ?? null;
  const rainExpected = rainMm !== null && rainMm >= RAIN_HOLD_MM;
  const hot = reading.temperature > t.max;
  const trend = moistureTrend(history);

  let status;
  let recommendation;
  let nextAt = null;
  let nextLabel;

  if (moisture < m.critical) {
    status = 'critical';
    recommendation = 'Irrigate Today';
    reasons.push(`Soil moisture is critically low (current: ${moisture}%, crop needs at least ${m.min}%)`);
    // Wait for the cooler evening/morning slot only if it's still today.
    const slot = nextIrrigationSlot(now);
    if (slot.toDateString() === now.toDateString()) {
      nextAt = slot;
    } else {
      nextAt = now;
      nextLabel = 'As soon as possible';
    }
  } else if (moisture < m.min) {
    if (rainExpected) {
      status = 'warning';
      recommendation = 'Hold — Rain Expected';
      reasons.push(`Soil moisture is below the ideal ${m.min}% (current: ${moisture}%)`);
      reasons.push(`${rainMm} mm of rain is forecast in the next 48 hours, which should cover the deficit`);
      nextLabel = 'Re-check after the rain';
    } else {
      status = 'warning';
      recommendation = hot ? 'Irrigate Today' : 'Irrigate Within 24 Hours';
      reasons.push(`Soil moisture is below the ideal ${m.min}% (current: ${moisture}%)`);
      nextAt = nextIrrigationSlot(now, hot ? 0 : 6);
    }
  } else if (moisture > m.max) {
    status = 'normal';
    recommendation = 'Do Not Irrigate';
    reasons.push(`Soil moisture is above the ideal range (current: ${moisture}%, ideal: ${m.min}-${m.max}%)`);
    reasons.push('Extra water now risks waterlogging and nutrient leaching');
  } else {
    status = 'normal';
    recommendation = 'No Irrigation Needed';
    reasons.push(`Soil moisture is within the ideal range (current: ${moisture}%, ideal: ${m.min}-${m.max}%)`);
  }

  if (hot) {
    reasons.push(`Temperature is high (${reading.temperature}°C, above ${t.max}°C) — the soil will dry faster`);
  } else if (reading.temperature < t.min) {
    reasons.push(`Temperature is low (${reading.temperature}°C) — water use is reduced`);
  } else {
    reasons.push(`Temperature is in the optimal range (${reading.temperature}°C)`);
  }

  if (rainMm === null) {
    reasons.push('Rain forecast unavailable — add your farm location to enable it');
  } else if (!rainExpected) {
    reasons.push(rainMm > 0 ? `Only ${rainMm} mm of rain forecast in the next 48 hours` : 'No rainfall expected in the next 48 hours');
  }

  if (stage) {
    reasons.push(`Crop is in the ${stage.name} stage (day ${stage.daysSinceSowing})`);
  }

  // When moisture is still fine, estimate when it will drop below the ideal
  // band using the drying trend from recent readings.
  if (status === 'normal' && !nextLabel) {
    if (trend !== null && trend < -0.05) {
      const hoursLeft = (moisture - m.min) / -trend;
      if (hoursLeft <= 24 * 7) {
        nextAt = nextIrrigationSlot(now, hoursLeft);
        reasons.push(`Moisture is falling about ${Math.abs(trend).toFixed(1)}% per hour`);
      } else {
        nextLabel = 'Not needed this week';
      }
    } else {
      nextLabel = 'Not needed soon — moisture is stable';
    }
  }

  const water = status === 'normal' || rainExpected ? { target: null, mm: 0, litresPerHectare: 0 } : waterNeeded(crop, moisture);

  return {
    recommendation,
    status,
    reasons,
    nextIrrigation: nextLabel ?? dayLabel(nextAt, now),
    nextIrrigationAt: nextAt,
    waterQuantity: water.mm
      ? `${water.litresPerHectare.toLocaleString('en-IN')} Litres / Hectare (${water.mm} mm)`
      : 'None required',
    waterMm: water.mm,
    crop: { id: crop.id, name: crop.name },
    stage,
    thresholds: { moisture: m, temperature: t },
    rainNext48hMm: rainMm,
    moistureTrendPerHour: trend === null ? null : Number(trend.toFixed(2)),
    basedOn: { readingId: reading.id ?? reading._id, at: reading.createdAt },
  };
}
