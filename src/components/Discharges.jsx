import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { downloadCSV } from '../utils';

export default function Discharges() {
  const [list, setList] = useState([]);

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

  return (
    <div className="pb-20">
       <div className="bg-white dark:bg-slate-800 p-4 rounded shadow mb-4">
           <h2 className="font-bold text-xl dark:text-white">Historial de Egresos</h2>
       </div>
       <div className="space-y-2">
           {list.map(p => (
               <div key={p.id} className="bg-white dark:bg-slate-800 p-3 rounded shadow flex justify-between items-center opacity-80 hover:opacity-100">
                   <div>
                       <p className="font-bold text-slate-900 dark:text-white">{p.name}</p>
                       <p className="text-xs text-slate-500">{new Date(p.dischargeDate).toLocaleDateString()} • {p.insurance}</p>
                   </div>
                   <div className="flex flex-col items-end gap-2">
                       <label className="text-xs flex items-center gap-1 cursor-pointer dark:text-slate-300">
                           <input type="checkbox" checked={p.insurancePaperwork||false} onChange={()=>togglePaperwork(p)} /> Trámite Seguro
                       </label>
                       <button onClick={()=>readmit(p)} className="text-xs text-blue-500 underline">Reingresar</button>
                   </div>
               </div>
           ))}
       </div>
    </div>
  );
}
