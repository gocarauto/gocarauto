/**
 * Resolves the appropriate vehicle technical blueprint sketch based on make, model, and year.
 * Priority 1: Exact make-model-year match (e.g., mitsubishi-lancer-2008, nissan-sunny-2011)
 * Priority 2: Base-model year match (e.g., "Sunny N16" 2011 -> nissan-sunny-2011)
 * Priority 3: Make-model match (e.g., mitsubishi-lancer)
 * Priority 4: Base-model match
 * Priority 5: Smart body style classification (SUV, Van/MPV, Hatchback, Coupe, Sedan)
 * Priority 6: Generic car blueprint fallback
 */

const AVAILABLE_SKETCHES = new Set([
    'chevrolet-aveo', 'chevrolet-aveo-2013', 'citroen-c-elysee', 'citroen-c-elysee-2016',
    'citroen-c5-aircross', 'citroen-c5-aircross-2020', 'coupe', 'daewoo-lanos', 'daewoo-lanos-1999',
    'daihatsu-terios', 'daihatsu-terios-2007', 'daihatsu-terrios', 'daihatsu-terrios-2007',
    'ford-focus', 'ford-focus-2009', 'ford-focus-2012', 'geely-pandino', 'geely-pandino-2015',
    'generic-car', 'hatchback', 'honda-civic', 'honda-civic-2008', 'honda-civic-2018',
    'hyundai-accent-2015', 'hyundai-accent-2017', 'hyundai-accent-rb', 'hyundai-accent-rb-2015',
    'hyundai-accent-rb-2017', 'hyundai-elantra', 'hyundai-elantra-2011', 'hyundai-elantra-2013',
    'hyundai-elantra-2022', 'hyundai-elantra-hd', 'hyundai-elantra-hd-2017', 'hyundai-elentra',
    'hyundai-elentra-2011', 'hyundai-elentra-2013', 'hyundai-elentra-2022', 'hyundai-elentra-hd',
    'hyundai-elentra-hd-2017', 'hyundai-i10', 'hyundai-i10-2008', 'hyundai-ix35-2016',
    'hyundai-matrix', 'hyundai-matrix-2005', 'hyundai-matrix-2009', 'hyundai-matrix-2011',
    'hyundai-solaris', 'hyundai-solaris-2015', 'hyundai-tucson', 'hyundai-tucson-2016',
    'hyundai-tucson-ix35', 'hyundai-tucson-ix35-2016', 'hyundai-verna', 'hyundai-verna-2008',
    'hyundai-verna-2010', 'kia-cerato', 'kia-cerato-2023', 'mazda-3', 'mazda-3-2015',
    'mercedes-benz-c200-2002', 'mercedes-c200', 'mercedes-c200-2002', 'mercedes-s-class-2022',
    'mitsubishi-colt', 'mitsubishi-colt-2000', 'mitsubishi-lancer', 'mitsubishi-lancer-2008',
    'mitsubishi-lancer-2009', 'mitsubishi-lancer-2015', 'mitsubishi-lancer-2017',
    'nissan-blue-bird', 'nissan-blue-bird-2011', 'nissan-bluebird-2011', 'nissan-livina',
    'nissan-livina-2010', 'nissan-sunny', 'nissan-sunny-2011', 'nissan-sunny-n16-2011',
    'opel-insignia', 'opel-insignia-2015', 'proton-gen-2', 'proton-gen-2-2013',
    'proton-saga', 'proton-saga-2013', 'proton-waga', 'proton-waga-2007', 'proton-waja',
    'proton-waja-2007', 'renault-fluence', 'renault-fluence-2015', 'renault-logan',
    'renault-logan-2010', 'renault-logan-2013', 'renault-megane', 'renault-megane-2021',
    'renault-megane-4', 'renault-megane-4-2021', 'sedan', 'skoda-octavia',
    'skoda-octavia-2016', 'soueast-s05', 'soueast-s05-2025', 'ssangyong-tivoli',
    'ssangyong-tivoli-2016', 'subaru-xv', 'subaru-xv-2018', 'suv', 'toyota-corolla',
    'toyota-corolla-2008', 'toyota-corolla-2010', 'toyota-corolla-2012',
    'toyota-corolla-2013', 'toyota-corolla-2019', 'toyota-yaris', 'toyota-yaris-2007',
    'toyota-yaris-2008', 'van', 'volkswagen-jetta', 'volkswagen-jetta-2007',
    'volkswagen-jetta-2008', 'volkswagen-passat', 'volkswagen-passat-2013'
]);

const SUVS = new Set([
    'tucson', 'ix35', 'tivoli', 'terrios', 'terios', 'sportage', 'qashqai', 'duster',
    'aircross', 'c5', 'xv', 's05', 'dx3', 'dx5', 'dx7', 'suv', 'crossover',
    'tiguan', 'kuga', 'rav4', 'creta', 'kadjar', 'captur', 'xtrail', 'x-trail',
    'patrol', 'prado', 'pajero', 'renegade'
]);

const VANS = new Set([
    'matrix', 'livina', 'grand-livina', 'carens', 'lodgy', 'carnival', 'van', 'mpv', 'scenic', 'zafira'
]);

const HATCHBACKS = new Set([
    'colt', 'gen-2', 'pandino', 'yaris', 'i10', 'i20', 'clio', 'sandero', 'picanto',
    'swift', 'fiesta', 'golf', 'polo', 'rio', 'leon', 'ibiza', 'micra', 'spark', 'punto'
]);

const COUPES = new Set([
    'coupe', 'grand-coupe', 'tiburon', 'civic-coupe', 'tt', 'scirocco', 'rcz', 'mustang'
]);

export const getVehicleSketch = (makeOrVehicle, modelArg, yearArg, ext = 'webp') => {
    const formatUrl = (name) => `/sketches/${name}.${ext}?v=3`;

    let make = makeOrVehicle;
    let model = modelArg;
    let year = yearArg;

    if (typeof makeOrVehicle === 'object' && makeOrVehicle !== null) {
        make = makeOrVehicle.make;
        model = makeOrVehicle.model;
        year = makeOrVehicle.year;
    }

    if (!make || typeof make !== 'string') return formatUrl('generic-car');

    const normalizedMake = make.toLowerCase()
        .replace('mercedes-benz', 'mercedes')
        .trim()
        .replace(/[^a-z0-9]/g, '-');

    const normalizedModel = model ? model.toLowerCase().trim().replace(/[^a-z0-9]/g, '-') : '';
    const normalizedYear = year ? year.toString().trim() : '';

    // 1. Exact match make-model-year
    const specificPath = `${normalizedMake}-${normalizedModel}-${normalizedYear}`;
    if (AVAILABLE_SKETCHES.has(specificPath)) return formatUrl(specificPath);

    // 2. Base-model extraction (e.g. "sunny-n16" -> "sunny", "elentra-hd" -> "elentra")
    const tokens = normalizedModel.split('-').filter(Boolean);
    const baseModel = tokens[0] || normalizedModel;

    const baseYearPath = `${normalizedMake}-${baseModel}-${normalizedYear}`;
    if (AVAILABLE_SKETCHES.has(baseYearPath)) return formatUrl(baseYearPath);

    // 3. Make-model match
    const modelPath = `${normalizedMake}-${normalizedModel}`;
    if (AVAILABLE_SKETCHES.has(modelPath)) return formatUrl(modelPath);

    const baseModelPath = `${normalizedMake}-${baseModel}`;
    if (AVAILABLE_SKETCHES.has(baseModelPath)) return formatUrl(baseModelPath);

    // 4. Token-based Body Style Categorization
    for (const t of tokens) {
        if (SUVS.has(t)) return formatUrl('suv');
        if (VANS.has(t)) return formatUrl('van');
        if (HATCHBACKS.has(t)) return formatUrl('hatchback');
        if (COUPES.has(t)) return formatUrl('coupe');
    }

    // Compound phrases
    if (normalizedModel.includes('gen-2')) return formatUrl('hatchback');
    if (normalizedModel.includes('aircross') || normalizedModel.includes('s05')) return formatUrl('suv');
    if (normalizedModel.includes('matrix') || normalizedModel.includes('livina')) return formatUrl('van');

    // 5. Default Sedan fallback
    return formatUrl('sedan');
};
