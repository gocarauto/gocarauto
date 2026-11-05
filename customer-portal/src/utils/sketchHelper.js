export const getVehicleSketch = (make, model, year) => {
    if (!make) return '/sketches/generic-car.png';

    const normalizedMake = make.toLowerCase()
        .replace('mercedes-benz', 'mercedes')
        .trim()
        .replace(/[^a-z0-9]/g, '-');

    const normalizedModel = model ? model.toLowerCase().trim().replace(/[^a-z0-9]/g, '-') : '';
    const normalizedYear = year ? year.toString().trim() : '';

    const availableSketches = [
        'daihatsu-terrios-2007',
        'ford-focus-2009',
        'nissan-sunny-2011',
        'toyota-corolla-2019',
        'mercedes-s-class-2022',
        'geely-pandino-2015',
        'kia-cerato-2023',
    ];

    const specificPath = `${normalizedMake}-${normalizedModel}-${normalizedYear}`;
    const modelPath = `${normalizedMake}-${normalizedModel}`;

    if (availableSketches.includes(specificPath)) return `/sketches/${specificPath}.png`;
    if (availableSketches.includes(modelPath)) return `/sketches/${modelPath}.png`;

    // Basic Body Type Fallbacks
    const SUVs = ['tucson', 'ix35', 'tivoli', 'terrios', 'sportage', 'qashqai', 'duster'];
    const Hatchbacks = ['colt', 'gen-2', 'pandino', 'yaris', 'i10', 'i20', 'clio', 'sandero', 'picanto'];

    if (SUVs.some(s => normalizedModel.includes(s))) return '/sketches/suv.png';
    if (Hatchbacks.some(h => normalizedModel.includes(h))) return '/sketches/hatchback.png';

    return '/sketches/sedan.png';
};
