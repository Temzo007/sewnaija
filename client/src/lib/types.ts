// Existing type definitions

type Invoice = {
    id: string;
    amount: number;
    date: Date;
    clientId: string;
};

type MeasurementPhoto = {
    id: string;
    url: string;
    measurementId: string;
};

type PhotoReference = {
    id: string;
    url: string;
    referenceId: string;
};

// Exports
export { Invoice, MeasurementPhoto, PhotoReference };