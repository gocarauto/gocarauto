/**
 * Utility to get the appropriate vehicle sketch based on make and model.
 * Falls back to a generic sketch if a specific one isn't found.
 */
export const getVehicleSketch = (makeOrVehicle, modelArg, yearArg) => {
    let make = makeOrVehicle;
    let model = modelArg;
    let year = yearArg;

    if (typeof makeOrVehicle === 'object' && makeOrVehicle !== null) {
        make = makeOrVehicle.make;
        model = makeOrVehicle.model;
        year = makeOrVehicle.year;
    }

    if (!make || typeof make !== 'string') return '/sketches/generic-car.png';

    const normalizedMake = make.toLowerCase().trim().replace(/[^a-z0-9]/g, '-');
    const normalizedModel = model ? model.toLowerCase().trim().replace(/[^a-z0-9]/g, '-') : '';
    const normalizedYear = year ? year.toString().trim() : '';

    // Priority 1: Exact match make-model-year
    // Priority 2: Match make-model
    // Priority 3: Match make-only
    // Priority 4: Fallback

    // In a real app, you might check a manifest of available files.
    // Here we map known available assets.
    const availableSketches = [
        'daihatsu-terrios-2007',
        'ford-focus-2009',
        'nissan-sunny-2011',
        'toyota-corolla-2019',
        'mercedes-s-class-2022'
    ];

    const specificPath = `${normalizedMake}-${normalizedModel}-${normalizedYear}`;
    const modelPath = `${normalizedMake}-${normalizedModel}`;

    if (availableSketches.includes(specificPath)) return `/sketches/${specificPath}.png`;
    if (availableSketches.includes(modelPath)) return `/sketches/${modelPath}.png`;

    // Priority 3: Body Style Categorization (Smart Fallbacks)
    const SUVs = ['tucson', 'ix35', 'tivoli', 'terrios', 'sportage', 'qashqai', 'duster'];
    const Hatchbacks = ['colt', 'gen-2', 'pandino', 'yaris', 'i10', 'i20', 'clio', 'sandero', 'picanto'];
    const Vans = ['matrix', 'carens', 'lodgy', 'grand-livina'];
    const Coupes = ['megane-4', 'civic']; // Megane 4 often coupe/sporty, Civic often sporty profiles

    if (SUVs.some(s => normalizedModel.includes(s))) return '/sketches/suv.png';
    if (Hatchbacks.some(h => normalizedModel.includes(h))) return '/sketches/hatchback.png';
    if (Vans.some(v => normalizedModel.includes(v))) return '/sketches/van.png';
    if (Coupes.some(c => normalizedModel.includes(c))) return '/sketches/coupe.png';

    // Priority 4: Default Sedan (Most common type for remaining models e.g., Lancer, Elantra, Logan, Passat)
    return '/sketches/sedan.png';
};
