
export const HOSPITALS = ["Hospital Star Médica","Hospital Ángeles Querétaro","Hospital Ángeles Centro Sur","Hospital H+","Hospital San José","Hospital Moscati","Gestamed","Hospital Santa Rosa de Viterbo","Hospital Santo Tomás","Hospital Médica Ebor","Hospital Santiago de Querétaro","Hospital Jardines","Clínica San Francisco","Hospital San Pedro","Hospital del Sagrado Corazón","Clínica Las Campanas","Centro Médico Jurica","Clínica CER","Hospital Idaly Medical","CEM","Otro"].sort();
export const DOCTORS = ["Enrique Hans Mues Guizar", "Rolando L Bonilla Silva", "Otro"].sort();
export const INSURANCES = ["Afirme","Allianz","Atlas","Atlantis","AXA","Banorte","Bupa","VUMI","Bx+","Chubb","General de Seguros","GNP","Inbursa","La Latino","Mapfre","MetLife","Pan-American","Plan Seguro","Sisnova","Prevem","Seguros Monterrey NYL","Sura","Particular","Paquete","Otro"].sort();

export const calculateAge = (dob) => {
    if(!dob) return '';
    const diff = Date.now() - new Date(dob).getTime();
    return Math.abs(new Date(diff).getUTCFullYear() - 1970);
};

export const getLocalISODate = () => new Date().toISOString().split('T')[0];
