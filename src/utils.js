
const normalizeText = (text) => {
  if (!text) return '';
  return text.toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

export const calculateAge = (dob) => {
  if (!dob) return '';
  const diff = Date.now() - new Date(dob).getTime();
  const ageDt = new Date(diff);
  return Math.abs(ageDt.getUTCFullYear() - 1970);
};

export const calculateDaysDiff = (dateString) => {
  if (!dateString) return 0;
  const oneDay = 24 * 60 * 60 * 1000;
  const firstDate = new Date(dateString);
  const secondDate = new Date();
  return Math.floor((secondDate - firstDate) / oneDay);
};

export const calculateBMI = (weight, height) => {
    if (!weight || !height) return '';
    const h = parseFloat(height);
    const w = parseFloat(weight);
    if(h <= 0) return '';
    const bmi = w / (h * h);
    return bmi.toFixed(1);
};

export const getLocalISODate = () => {
    const d = new Date();
    const offset = d.getTimezoneOffset() * 60000;
    return (new Date(d - offset)).toISOString().slice(0, 10);
};

export const downloadCSV = (data, headers, filename) => {
  // Normalize headers and data to remove accents for compatibility
  const normalizedHeaders = headers.map(h => normalizeText(h));
  
  // Create rows with quoted values to handle commas safely
  const csvRows = [
      normalizedHeaders.join(","),
      ...data.map(row => 
          row.map(cell => `"${normalizeText(cell)}"`).join(",")
      )
  ];

  const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
