// Agronomic reference data for the crops a farmer can pick at registration.
//
// moisture     – soil moisture % band the crop is happiest in; below `critical`
//                the plant is under water stress and must be irrigated today.
// temperature  – optimal air temperature band (°C); above `max` raises a heat alert.
// rootZoneMm   – water (mm) the root zone holds between 0% and 100% on our
//                moisture scale. Used to turn a moisture deficit into litres.
// stages       – growth stages by days after sowing.

export const CROPS = {
  sugarcane: {
    id: 'sugarcane',
    name: 'Sugarcane',
    description:
      'A tall perennial grass cultivated for juice from which sugar is processed. Requires high temperatures and adequate water.',
    moisture: { critical: 40, min: 60, max: 80 },
    temperature: { min: 24, max: 35 },
    rootZoneMm: 100,
    stages: [
      { name: 'Germination', startDay: 0, endDay: 60 },
      { name: 'Tillering', startDay: 60, endDay: 120 },
      { name: 'Grand Growth', startDay: 120, endDay: 270 },
      { name: 'Maturity', startDay: 270, endDay: 360 },
    ],
    requirements: {
      water: { value: '1500-2500 mm', note: 'Irrigate every 7-10 days during grand growth.' },
      temperature: { value: '27°C - 38°C', note: 'Growth slows below 20°C.' },
      duration: { value: '12-18 Months', note: 'Depending on variety and planting season.' },
    },
    tips: [
      { title: 'Avoid waterlogging', text: 'Ensure proper drainage at all times.' },
      { title: 'Critical stages', text: 'Grand growth phase needs the most water. Stress here reduces yield.' },
      { title: 'Before harvest', text: 'Stop irrigation 15-20 days before harvest for better sugar recovery.' },
    ],
  },
  wheat: {
    id: 'wheat',
    name: 'Wheat',
    description:
      'A rabi cereal grown in cool winters. Most sensitive to water stress at crown root initiation, flowering and grain filling.',
    moisture: { critical: 35, min: 50, max: 70 },
    temperature: { min: 15, max: 25 },
    rootZoneMm: 75,
    stages: [
      { name: 'Crown Root Initiation', startDay: 0, endDay: 25 },
      { name: 'Tillering & Jointing', startDay: 25, endDay: 65 },
      { name: 'Flowering', startDay: 65, endDay: 95 },
      { name: 'Grain Filling', startDay: 95, endDay: 125 },
    ],
    requirements: {
      water: { value: '450-650 mm', note: 'Typically 4-6 irrigations across the season.' },
      temperature: { value: '15°C - 25°C', note: 'Heat above 30°C at grain filling shrivels grain.' },
      duration: { value: '4 Months', note: 'Sown Oct-Nov, harvested Mar-Apr.' },
    },
    tips: [
      { title: 'First irrigation', text: 'Give the first irrigation at crown root initiation, 20-25 days after sowing.' },
      { title: 'Flowering', text: 'Never let the field dry out at flowering; it directly cuts grain count.' },
      { title: 'Light & frequent', text: 'Use light irrigations (~50 mm) to avoid lodging.' },
    ],
  },
  cotton: {
    id: 'cotton',
    name: 'Cotton',
    description:
      'A kharif fibre crop that tolerates heat but needs steady moisture from squaring through boll development.',
    moisture: { critical: 35, min: 50, max: 70 },
    temperature: { min: 21, max: 35 },
    rootZoneMm: 90,
    stages: [
      { name: 'Germination', startDay: 0, endDay: 20 },
      { name: 'Squaring', startDay: 20, endDay: 60 },
      { name: 'Flowering & Boll Formation', startDay: 60, endDay: 120 },
      { name: 'Boll Opening', startDay: 120, endDay: 180 },
    ],
    requirements: {
      water: { value: '700-1300 mm', note: 'Peak demand during flowering and boll formation.' },
      temperature: { value: '21°C - 35°C', note: 'Frost and cold nights damage bolls.' },
      duration: { value: '5-6 Months', note: 'Depending on variety.' },
    },
    tips: [
      { title: 'Flower shedding', text: 'Water stress at flowering causes squares and bolls to drop.' },
      { title: 'Avoid excess', text: 'Too much water early causes excessive vegetative growth.' },
      { title: 'Boll opening', text: 'Stop irrigation once most bolls have opened.' },
    ],
  },
  rice: {
    id: 'rice',
    name: 'Rice',
    description:
      'A water-loving cereal usually grown in puddled, flooded fields. Needs saturated soil through most of its life.',
    moisture: { critical: 60, min: 80, max: 100 },
    temperature: { min: 22, max: 32 },
    rootZoneMm: 120,
    stages: [
      { name: 'Seedling', startDay: 0, endDay: 30 },
      { name: 'Tillering', startDay: 30, endDay: 65 },
      { name: 'Panicle & Flowering', startDay: 65, endDay: 100 },
      { name: 'Ripening', startDay: 100, endDay: 130 },
    ],
    requirements: {
      water: { value: '1200-1600 mm', note: 'Keep 2-5 cm standing water during tillering.' },
      temperature: { value: '22°C - 32°C', note: 'Above 35°C at flowering causes sterility.' },
      duration: { value: '4-5 Months', note: 'Depending on variety.' },
    },
    tips: [
      { title: 'Standing water', text: 'Maintain shallow standing water from transplanting to panicle initiation.' },
      { title: 'AWD saves water', text: 'Alternate wetting and drying can save 25% water without yield loss.' },
      { title: 'Before harvest', text: 'Drain the field 10-15 days before harvest.' },
    ],
  },
};

export const CROP_IDS = Object.keys(CROPS);

export const getCrop = (id) => CROPS[id] || CROPS.sugarcane;

// Works out which growth stage the crop is in from its sowing date.
export function getStage(crop, sowingDate, now = new Date()) {
  const daysSinceSowing = Math.max(0, Math.floor((now - new Date(sowingDate)) / 86_400_000));
  let index = crop.stages.findIndex((s) => daysSinceSowing < s.endDay);
  const harvestDue = index === -1;
  if (harvestDue) index = crop.stages.length - 1;
  return { index, name: crop.stages[index].name, daysSinceSowing, harvestDue };
}
