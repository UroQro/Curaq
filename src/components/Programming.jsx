import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, where, updateDoc, doc } from 'firebase/firestore';
import { downloadCSV, getLocalISODate } from '../utils';
import { Calendar, Download, Trash2 } from 'lucide-react';
import PatientFormModal from './PatientFormModal';
import PatientDetail from './PatientDetail';

export default function Programming({ user }) {
  const [list, setList] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  
  useEffect(() => {
    const q = query(collection(db, "patients"), where("scheduledDate", "!=", ""));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a,b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));
      setList(data);
    });
    return () => unsubscribe();
  }, []);

  const today = getLocalISODate();

  const exportCSV = () => {
      const data = list.map(p => [p.scheduledDate, p.name, p.procedure || 'N/A', p.hospital, p.doctor, p.insurance]);
      downloadCSV(data, ["Fecha", "Paciente", "Procedimiento", "Hospital", "Dr", "Seguro"], "Programacion_Qx.csv");
  };

  const removeFromSchedule = async (e, id) => {
      e.stopPropagation();
      if(confirm("¿Quitar de la programación?")) {
          await updateDoc(doc(db, "patients", id), { scheduledDate: "" }); 
      }
  };

  if (selectedPatient) return <PatientDetail patient={selectedPatient} onClose={() => setSelectedPatient(null)} user={user} />;

  return (
    <div className="pb-20">
       <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-lg shadow mb-4 border border-blue-100 dark:border-slate-700">
           <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2"><Calendar className="text-blue-500"/> Programación</h2>
           <div className="flex gap-2">
               <button onClick={()=>setShowModal(true)} className="bg-blue-600 text-white text-xs px-3 py-2 rounded font-bold shadow hover:bg-blue-700">+ Agendar Nuevo</button>
               <button onClick={exportCSV} className="bg-green-600 text-white text-xs px-3 py-2 rounded font-bold shadow hover:bg-green-700 flex items-center gap-1"><Download size={14}/> CSV</button>
           </div>
       </div>

       <div className="space-y-3">
           {list.map(p => {
               const isToday = p.scheduledDate === today;
               const opacity = isToday ? 'opacity-100' : 'opacity-75';
               const dateObj = new Date(p.scheduledDate + 'T12:00:00'); 
               
               return (
                   <div key={p.id} onClick={() => setSelectedPatient(p)} className={`cursor-pointer bg-white dark:bg-slate-800 p-4 rounded-lg shadow border-l-[6px] border-blue-500 dark:border-blue-400 ${opacity} hover:opacity-100 transition active:scale-[0.98]`}>
                       <div className="flex justify-between items-start">
                           <div>
                               <div className="flex items-center gap-2 mb-2">
                                   <span className={`text-xs font-bold px-2 py-0.5 rounded ${isToday ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                                       {dateObj.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase()}
                                   </span>
                                   {/* ACENTUACION HOSPITAL */}
                                   <span className="text-xs font-black bg-blue-900 text-white px-2 py-0.5 rounded shadow-sm tracking-wide">{p.hospital}</span>
                                   
                                   {p.status === 'pre_admission' && <span className="text-[10px] border border-blue-200 text-blue-500 px-1 rounded uppercase">Ambulatorio</span>}
                                   {p.status === 'active' && <span className="text-[10px] bg-red-100 text-red-500 px-1 rounded uppercase font-bold">Hospitalizado</span>}
                               </div>
                               <h3 className="text-lg font-bold text-slate-900 dark:text-white">{p.name}</h3>
                               <p className="text-sm text-blue-600 dark:text-blue-300 font-medium">{p.diagnosis}</p>
                               <div className="text-xs text-slate-500 mt-1">{p.doctor} • {p.insurance}</div>
                           </div>
                           <button onClick={(e)=>removeFromSchedule(e, p.id)} className="text-red-400 hover:text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded-full"><Trash2 size={16}/></button>
                       </div>
                   </div>
               );
           })}
           {list.length === 0 && <div className="text-center p-10 text-slate-400">No hay cirugías programadas.</div>}
       </div>
       {showModal && <PatientFormModal onClose={()=>setShowModal(false)} mode="create" originContext="programming" />}
    </div>
  );
}
