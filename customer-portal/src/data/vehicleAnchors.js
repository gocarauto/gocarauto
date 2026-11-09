/**
 * Normalized Anchor Point System for GoCar Auto Fleet Visualizer
 *
 * Each vehicle silhouette is mapped to normalized percentage coordinates (0% to 100%)
 * across X and Y axes. This ensures dynamic SVG leader lines stretch and track
 * with mathematical precision regardless of vehicle wheelbase, roofline, or screen aspect ratio.
 */

export const DEFAULT_ANCHORS = {
    engine_bay:   { x: 38.0, y: 36.0 },
    transmission: { x: 34.0, y: 74.0 },
    front_brake:  { x: 62.0, y: 52.0 },
    rear_tire:    { x: 78.0, y: 80.0 },
    cockpit:      { x: 50.0, y: 30.0 }
};

export const VEHICLE_CONFIGS = {
    'ford-focus-2009': {
        vehicle_id: 'ford-focus-2009',
        name: 'Ford Focus',
        year: 2009,
        bodyType: 'hatchback',
        anchors: {
            engine_bay:   { x: 38.0, y: 36.0 },
            transmission: { x: 34.0, y: 74.0 },
            front_brake:  { x: 62.0, y: 52.0 },
            rear_tire:    { x: 78.0, y: 80.0 },
            cockpit:      { x: 50.0, y: 30.0 }
        }
    },
    'nissan-sunny-2011': {
        vehicle_id: 'nissan-sunny-2011',
        name: 'Nissan Sunny N16',
        year: 2011,
        bodyType: 'sedan',
        anchors: {
            engine_bay:   { x: 36.0, y: 38.0 },
            transmission: { x: 32.0, y: 72.0 },
            front_brake:  { x: 60.0, y: 56.0 },
            rear_tire:    { x: 80.0, y: 82.0 },
            cockpit:      { x: 48.0, y: 28.0 }
        }
    },
    'toyota-corolla-2019': {
        vehicle_id: 'toyota-corolla-2019',
        name: 'Toyota Corolla',
        year: 2019,
        bodyType: 'sedan',
        anchors: {
            engine_bay:   { x: 37.0, y: 37.0 },
            transmission: { x: 33.0, y: 73.0 },
            front_brake:  { x: 61.0, y: 54.0 },
            rear_tire:    { x: 79.0, y: 81.0 },
            cockpit:      { x: 49.0, y: 29.0 }
        }
    },
    'mercedes-s-class-2022': {
        vehicle_id: 'mercedes-s-class-2022',
        name: 'Mercedes S-Class',
        year: 2022,
        bodyType: 'sedan',
        anchors: {
            engine_bay:   { x: 35.0, y: 36.0 },
            transmission: { x: 31.0, y: 75.0 },
            front_brake:  { x: 63.0, y: 53.0 },
            rear_tire:    { x: 82.0, y: 79.0 },
            cockpit:      { x: 47.0, y: 28.0 }
        }
    },
    'daihatsu-terrios-2007': {
        vehicle_id: 'daihatsu-terrios-2007',
        name: 'Daihatsu Terios',
        year: 2007,
        bodyType: 'suv',
        anchors: {
            engine_bay:   { x: 39.0, y: 34.0 },
            transmission: { x: 36.0, y: 76.0 },
            front_brake:  { x: 60.0, y: 55.0 },
            rear_tire:    { x: 77.0, y: 78.0 },
            cockpit:      { x: 51.0, y: 26.0 }
        }
    },
    'geely-pandino-2015': {
        vehicle_id: 'geely-pandino-2015',
        name: 'Geely Pandino',
        year: 2015,
        bodyType: 'hatchback',
        anchors: {
            engine_bay:   { x: 40.0, y: 38.0 },
            transmission: { x: 37.0, y: 73.0 },
            front_brake:  { x: 59.0, y: 54.0 },
            rear_tire:    { x: 75.0, y: 79.0 },
            cockpit:      { x: 52.0, y: 32.0 }
        }
    },
    'kia-cerato-2023': {
        vehicle_id: 'kia-cerato-2023',
        name: 'Kia Cerato',
        year: 2023,
        bodyType: 'sedan',
        anchors: {
            engine_bay:   { x: 37.0, y: 37.0 },
            transmission: { x: 33.0, y: 73.0 },
            front_brake:  { x: 61.0, y: 53.0 },
            rear_tire:    { x: 79.0, y: 81.0 },
            cockpit:      { x: 49.0, y: 29.0 }
        }
    }
};

/**
 * Resolves normalized percentage coordinates for a given vehicle
 * @param {string} make
 * @param {string} model
 * @param {string|number} year
 * @returns {object} { engine_bay, transmission, front_brake, rear_tire, cockpit }
 */
export const getVehicleAnchors = (make, model, year) => {
    if (!make) return DEFAULT_ANCHORS;
    const normalizedMake = make.toLowerCase().replace('mercedes-benz', 'mercedes').trim().replace(/[^a-z0-9]/g, '-');
    const normalizedModel = model ? model.toLowerCase().trim().replace(/[^a-z0-9]/g, '-') : '';
    const normalizedYear = year ? year.toString().trim() : '';

    const specificKey = `${normalizedMake}-${normalizedModel}-${normalizedYear}`;
    const modelKey = `${normalizedMake}-${normalizedModel}`;

    if (VEHICLE_CONFIGS[specificKey]) return VEHICLE_CONFIGS[specificKey].anchors;
    if (VEHICLE_CONFIGS[modelKey]) return VEHICLE_CONFIGS[modelKey].anchors;
    return DEFAULT_ANCHORS;
};
