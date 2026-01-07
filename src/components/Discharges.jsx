import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { downloadCSV } from '../utils';
import { Search, Trash2, Undo, Download } from 'lucide-react';

export default function Discharges() {
  const [list, setList] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const q = query(collection(db, "patients"), where("status", "==", "discharged"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
       const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
       setList(data.sort((a,b) => new Date(b.dischargeDate) - new Date(a.dischargeDate)));
    });
    return () => unsubscribe();
  }, []);

  const togglePaperwork = async (p) => { await updateDoc(doc(db, "patients", p.id), { insurancePaperwork: !p.insurancePaperwork }); };
  const readmit = async (p) => { if(confirm("¿Reingresar al censo?")) await updateDoc(doc(db, "patients", p.id), { status: 'active', dischargeDate: null }); };
  
  const deletePatient = async (p) => { 
      const confirmCode = prompt(`¿ESTÁS SEGURO? Esto eliminará PERMANENTEMENTE a ${p.name}. Escribe "BORRAR" para confirmar:`);
      if(confirmCode === "BORRAR") {
          await deleteDoc(doc(db, "patients", p.id));
      }
  };

  const exportCSV = () => {
      const data = list.map(p => [
          p.dischargeDate || '', 
          p.name, 
          p.diagnosis || '', 
          p.hospital, 
          p.doctor, 
          p.insurance
      ]);
      downloadCSV(data, ["Fecha Egreso", "Paciente", "Diagnostico", "Hospital", "Medico", "Seguro"], "Reporte_Egresos.csv");
  };

  const filteredList = list.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase()) || 
      p.diagnosis.toLowerCase().includes(search.toLowerCase()) ||
      p.doctor.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="pb-20">
       <div className="bg-white dark:bg-slate-800 p-4 rounded shadow mb-4 space-y-3">
           <div className="flex justify-between items-center">
               <h2 className="font-bold text-xl dark:text-white">Historial de Egresos</h2>
               <button onClick={exportCSV} className="bg-green-600 text-white text-xs px-3 py-1.5 rounded font-bold shadow hover:bg-green-700 flex items-center gap-1"><Download size={14}/> CSV</button>
           </div>
           <div className="flex items-center bg-gray-100 dark:bg-slate-700 rounded px-3 py-2">
               <Search size={18} className="text-gray-400 mr-2"/>
               <input className="bg-transparent outline-none w-full text-sm dark:text-white" placeholder="Buscar por nombre, diagnóstico o doctor..." value={search} onChange={e=>setSearch(e.target.value)} />
           </div>
       </div>
       <div className="space-y-2">
           {filteredList.map(p => (
               <div key={p.id} className="bg-white dark:bg-slate-800 p-3 rounded shadow flex justify-between items-center opacity-80 hover:opacity-100">
                   <div>
                       <p className="font-bold text-slate-900 dark:text-white">{p.name}</p>
                       <p className="text-xs text-slate-500">{new Date(p.dischargeDate).toLocaleDateString()} • {p.insurance}</p>
                   </div>
                   <div className="flex flex-col items-end gap-2">
                       <label className="text-xs flex items-center gap-1 cursor-pointer dark:text-slate-300">
                           <input type="checkbox" checked={p.insurancePaperwork||false} onChange={()=>togglePaperwork(p)} /> Trámite Seguro
                       </label>
                       <div className="flex gap-2">
                           <button onClick={()=>readmit(p)} className="text-xs text-blue-500 bg-blue-50 p-1 rounded" title="Reingresar"><Undo size={14}/></button>
                           <button onClick={()=>deletePatient(p)} className="text-xs text-red-500 bg-red-50 p-1 rounded" title="Eliminar Definitivamente"><Trash2 size={14}/></button>
                       </div>
                   </div>
               </div>
           ))}
           {filteredList.length === 0 && <p className="text-center text-gray-400 text-sm mt-4">No se encontraron pacientes.</p>}
       </div>
    </div>
  );
}
