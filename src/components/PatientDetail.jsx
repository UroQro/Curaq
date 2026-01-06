import React, { useState } from 'react';
import { db } from '../firebase';
import { doc, updateDoc, arrayUnion, deleteDoc } from 'firebase/firestore';
import { ArrowLeft, MoreVertical, Plus, Edit } from 'lucide-react';

export default function PatientDetail({ patient, onClose, user }) {
  const [activeView, setActiveView] = useState('info'); // info, notes
  const [showActions, setShowActions] = useState(false);
  
  // Note Form State
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteType, setNoteType] = useState('texto');
  const [noteData, setNoteData] = useState({});

  const today = new Date().toISOString().split('T')[0];
  const isVisitChecked = patient.lastVisitCheck === today;

  const toggleVisit = async () => {
      await updateDoc(doc(db, 'patients', patient.id), { lastVisitCheck: isVisitChecked ? null : today });
  };

  const handleAction = async (action) => {
      if(action === 'prealta') {
          await updateDoc(doc(db, 'patients', patient.id), { preDischarge: true });
          alert("Marcado para Pre-Alta");
      } else if (action === 'programar') {
          const date = prompt("Fecha de cirugía (YYYY-MM-DD):");
          if(date) {
             await updateDoc(doc(db, 'patients', patient.id), { status: 'scheduled', surgeryDate: date });
             onClose();
          }
      } else if (action === 'egresar') {
          if(confirm("¿Confirmar Egreso?")) {
             await updateDoc(doc(db, 'patients', patient.id), { status: 'discharged', dischargeDate: new Date().toISOString() });
             onClose();
          }
      } else if (action === 'censo') {
          await updateDoc(doc(db, 'patients', patient.id), { status: 'census' });
          onClose();
      }
      setShowActions(false);
  };

  const saveNote = async (e) => {
      e.preventDefault();
      const newNote = {
          id: Date.now().toString(),
          type: noteType,
          author: user.displayName || user.email,
          timestamp: new Date().toISOString(),
          content: noteData
      };
      await updateDoc(doc(db, 'patients', patient.id), { notes: arrayUnion(newNote) });
      setShowNoteModal(false);
      setNoteData({});
  };

  const updateClinical = async (e) => {
      e.preventDefault();
      const f = e.target;
      const history = {
          dm: f.dm.checked, has: f.has.checked, hipo: f.hipo.checked, onco: f.onco.checked,
          text: f.histText.value, meds: f.meds.value
      };
      await updateDoc(doc(db, 'patients', patient.id), { phone: f.phone.value, history });
      alert("Datos guardados");
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
        {/* TOP BAR */}
        <div className="p-4 border-b flex justify-between items-center bg-white sticky top-0 z-10">
            <button onClick={onClose} className="text-blue-600 flex items-center gap-1 font-bold"><ArrowLeft size={20}/> Atrás</button>
            <h2 className="font-bold text-gray-800">Expediente</h2>
            <div className="relative">
                <button onClick={()=>setShowActions(!showActions)} className="p-2"><MoreVertical/></button>
                {showActions && (
                    <div className="absolute right-0 top-10 bg-white shadow-xl border rounded-xl w-48 py-2 z-20">
                        {patient.status === 'census' ? (
                            <>
                            <button onClick={()=>handleAction('prealta')} className="w-full text-left px-4 py-3 hover:bg-gray-100 text-purple-600 font-bold">Pre-Alta</button>
                            <button onClick={()=>handleAction('programar')} className="w-full text-left px-4 py-3 hover:bg-gray-100 text-blue-600 font-bold">Programar Qx</button>
                            <button onClick={()=>handleAction('egresar')} className="w-full text-left px-4 py-3 hover:bg-gray-100 text-red-600 font-bold">Egresar</button>
                            </>
                        ) : (
                            <button onClick={()=>handleAction('censo')} className="w-full text-left px-4 py-3 hover:bg-gray-100 text-gray-600 font-bold">Regresar al Censo</button>
                        )}
                    </div>
                )}
            </div>
        </div>

        {/* INFO CARD */}
        <div className="p-6 bg-gray-50 border-b">
             <h1 className="text-2xl font-black text-gray-900">{patient.name}</h1>
             <p className="text-gray-500 mt-1">{patient.hospital} • {patient.doctor}</p>
             <p className="text-blue-600 font-medium mt-1">{patient.diagnosis}</p>
             
             {patient.status === 'census' && (
                 <div className="mt-4 flex items-center gap-3 bg-white p-3 rounded-lg border shadow-sm w-fit cursor-pointer" onClick={toggleVisit}>
                     <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isVisitChecked ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                         {isVisitChecked && <span className="text-white text-xs">✓</span>}
                     </div>
                     <span className="font-bold text-gray-700">Visita del día</span>
                 </div>
             )}
        </div>

        {/* TABS */}
        <div className="flex border-b">
            <button onClick={()=>setActiveView('info')} className={`flex-1 py-4 font-bold text-sm ${activeView==='info'?'border-b-2 border-blue-600 text-blue-600':'text-gray-400'}`}>DATOS CLÍNICOS</button>
            <button onClick={()=>setActiveView('notes')} className={`flex-1 py-4 font-bold text-sm ${activeView==='notes'?'border-b-2 border-blue-600 text-blue-600':'text-gray-400'}`}>NOTAS & EVOLUCIÓN</button>
        </div>

        {/* CONTENT */}
        <div className="p-4 flex-1 bg-gray-50">
            {activeView === 'info' && (
                <form onSubmit={updateClinical} className="bg-white p-4 rounded-xl shadow-sm space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase">Teléfono</label>
                        <input name="phone" defaultValue={patient.phone} placeholder="Número de contacto" className="input-curaq" />
                    </div>
                    
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase">Antecedentes</label>
                        <div className="flex gap-2 my-2">
                             <label className="chip"><input type="checkbox" name="dm" defaultChecked={patient.history?.dm} /> DM</label>
                             <label className="chip"><input type="checkbox" name="has" defaultChecked={patient.history?.has} /> HAS</label>
                             <label className="chip"><input type="checkbox" name="hipo" defaultChecked={patient.history?.hipo} /> HipoT</label>
                             <label className="chip"><input type="checkbox" name="onco" defaultChecked={patient.history?.onco} /> Onco</label>
                        </div>
                        <textarea name="histText" defaultValue={patient.history?.text} placeholder="Alergias, Qx previas..." className="input-curaq h-24"></textarea>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase">Medicamentos</label>
                        <textarea name="meds" defaultValue={patient.history?.meds} placeholder="Lista..." className="input-curaq h-24"></textarea>
                    </div>

                    <button className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">Guardar Datos</button>
                </form>
            )}

            {activeView === 'notes' && (
                <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-2 mb-4">
                        <button onClick={()=>{setNoteType('visita'); setShowNoteModal(true);}} className="bg-white p-2 rounded-lg border shadow-sm text-xs font-bold text-gray-600">Visita</button>
                        <button onClick={()=>{setNoteType('labs'); setShowNoteModal(true);}} className="bg-white p-2 rounded-lg border shadow-sm text-xs font-bold text-gray-600">Labs</button>
                        <button onClick={()=>{setNoteType('vitales'); setShowNoteModal(true);}} className="bg-white p-2 rounded-lg border shadow-sm text-xs font-bold text-gray-600">Signos</button>
                        <button onClick={()=>{setNoteType('check_qx'); setShowNoteModal(true);}} className="bg-green-50 p-2 rounded-lg border border-green-200 shadow-sm text-xs font-bold text-green-700">Check Qx</button>
                        <button onClick={()=>{setNoteType('check_egr'); setShowNoteModal(true);}} className="bg-green-50 p-2 rounded-lg border border-green-200 shadow-sm text-xs font-bold text-green-700">Check Egr</button>
                        <button onClick={()=>{setNoteType('texto'); setShowNoteModal(true);}} className="bg-white p-2 rounded-lg border shadow-sm text-xs font-bold text-gray-600">Nota</button>
                    </div>

                    {/* TIMELINE */}
                    {patient.notes && patient.notes.slice().reverse().map((note, idx) => (
                        <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-blue-500">
                             <div className="flex justify-between text-xs text-gray-400 mb-2">
                                 <span className="font-bold uppercase">{note.type}</span>
                                 <span>{new Date(note.timestamp).toLocaleDateString()} {new Date(note.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                             </div>
                             <div className="text-sm text-gray-800 whitespace-pre-wrap">
                                 {note.type === 'visita' ? (
                                     <>
                                     <p><strong>S:</strong> {note.content.subj}</p>
                                     <p className="bg-gray-100 p-1 rounded mt-1 text-xs">SV: TA {note.content.ta} | FC {note.content.fc} | T {note.content.temp}</p>
                                     <p className="mt-1"><strong>P:</strong> {note.content.plan}</p>
                                     </>
                                 ) : note.type === 'labs' ? (
                                     <div className="grid grid-cols-3 gap-1 text-xs font-mono bg-gray-50 p-2 rounded">
                                         <span>Hb: {note.content.hb}</span><span>Leu: {note.content.leu}</span><span>Plq: {note.content.plq}</span>
                                         <span>Cr: {note.content.cr}</span><span>Glu: {note.content.glu}</span><span>Na: {note.content.na}</span>
                                     </div>
                                 ) : note.type.includes('check') ? (
                                     <div className="space-y-1">
                                         {Object.entries(note.content).map(([k,v]) => (
                                             <div key={k} className="flex items-center gap-2">
                                                 <span>{v ? '✅' : '❌'}</span> <span className="capitalize">{k}</span>
                                             </div>
                                         ))}
                                     </div>
                                 ) : (
                                     <p>{note.content.text}</p>
                                 )}
                             </div>
                             <p className="text-[10px] text-right text-gray-300 mt-2 uppercase">{note.author}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>

        {/* NOTE MODAL */}
        {showNoteModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
                    <h3 className="font-bold text-lg mb-4 uppercase">{noteType.replace('_', ' ')}</h3>
                    <form onSubmit={saveNote} className="space-y-3">
                        {noteType === 'visita' && (
                            <>
                            <textarea placeholder="Subjetivo" className="input-curaq" onChange={e=>setNoteData({...noteData, subj: e.target.value})}></textarea>
                            <div className="flex gap-2"><input placeholder="TA" className="input-curaq" onChange={e=>setNoteData({...noteData, ta: e.target.value})}/><input placeholder="FC" className="input-curaq" onChange={e=>setNoteData({...noteData, fc: e.target.value})}/><input placeholder="Temp" className="input-curaq" onChange={e=>setNoteData({...noteData, temp: e.target.value})}/></div>
                            <textarea placeholder="Análisis y Plan" className="input-curaq" onChange={e=>setNoteData({...noteData, plan: e.target.value})}></textarea>
                            </>
                        )}
                        {noteType === 'labs' && (
                             <div className="grid grid-cols-3 gap-2">
                                 <input placeholder="Hb" className="input-curaq" onChange={e=>setNoteData({...noteData, hb: e.target.value})}/>
                                 <input placeholder="Leu" className="input-curaq" onChange={e=>setNoteData({...noteData, leu: e.target.value})}/>
                                 <input placeholder="Cr" className="input-curaq" onChange={e=>setNoteData({...noteData, cr: e.target.value})}/>
                             </div>
                        )}
                        {noteType.includes('check') && (
                            <div className="space-y-2">
                                {['Carta','Nota','VPO','Labs','Sangre','Receta'].map(label => (
                                    <label key={label} className="flex items-center gap-2 p-2 border rounded">
                                        <input type="checkbox" className="w-5 h-5" onChange={e=>setNoteData({...noteData, [label]: e.target.checked})}/> {label}
                                    </label>
                                ))}
                            </div>
                        )}
                        {noteType === 'texto' && <textarea placeholder="Nota libre..." className="input-curaq h-32" onChange={e=>setNoteData({...noteData, text: e.target.value})}></textarea>}

                        <div className="flex gap-2 pt-2">
                             <button type="button" onClick={()=>setShowNoteModal(false)} className="flex-1 bg-gray-200 py-3 rounded-lg font-bold">Cancelar</button>
                             <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold">Guardar</button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
}
