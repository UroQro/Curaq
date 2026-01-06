import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, updateDoc, arrayUnion, onSnapshot } from 'firebase/firestore';
import { calculateAge, calculateDaysDiff, calculateBMI, getLocalISODate } from '../utils';
import { ArrowLeft, Copy, Edit, Link as LinkIcon, Save, Trash2 } from 'lucide-react';
import PatientFormModal from './PatientFormModal';

export default function PatientDetail({ patient: initialPatient, onClose, user }) {
  const [patient, setPatient] = useState(initialPatient);
  const [showEdit, setShowEdit] = useState(false);
  const [noteType, setNoteType] = useState('visita');
  
  // FORM STATES
  const [noteForm, setNoteForm] = useState({}); 

  // Reset form when type changes
  useEffect(() => {
      setNoteForm({});
  }, [noteType]);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "patients", initialPatient.id), (docSnapshot) => {
        if (docSnapshot.exists()) setPatient({ id: docSnapshot.id, ...docSnapshot.data() });
    });
    return () => unsub();
  }, [initialPatient.id]);

  const getUserName = () => user.displayName || user.email.split('@')[0];

  const handleSaveNote = async () => {
      if(Object.keys(noteForm).length === 0) return alert("Llena los campos");
      const newNote = {
          id: Date.now().toString(),
          type: noteType,
          author: getUserName(),
          timestamp: new Date().toISOString(),
          content: noteForm
      };
      await updateDoc(doc(db, "patients", patient.id), { notes: arrayUnion(newNote) });
      setNoteForm({});
      alert("Nota guardada");
  };

  const copyToWA = (n) => {
      // WA Format Logic
      let t = `*PACIENTE:* ${patient.name}\n*HOSPITAL:* ${patient.hospital}\n`;
      const c = n.content;
      if(n.type === 'visita'){
          t += `*Subjetivo:* ${c.subj || '-'}\n`;
          t += `*SV:* TA:${c.ta||'-'} | FC:${c.fc||'-'} | T:${c.temp||'-'}\n`;
          t += `*Labs:* Hb:${c.hb||'-'} Leu:${c.leu||'-'} Cr:${c.cr||'-'}\n`;
          t += `*Líq:* GU:${c.gu||'-'} | Dren:${c.drains||'-'}\n`;
          t += `*PLAN:* ${c.plan||'-'}`;
      } else {
          t += `*Nota:* ${JSON.stringify(c)}`;
      }
      navigator.clipboard.writeText(t);
      alert("Copiado para WhatsApp");
  };

  const Input = ({ label, k, placeholder, type="text" }) => (
      <div className="flex flex-col"><label className="text-[10px] uppercase font-bold text-gray-400">{label}</label><input type={type} className="border rounded p-1.5 text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder={placeholder} value={noteForm[k] || ''} onChange={e=>setNoteForm({...noteForm, [k]: e.target.value})} /></div>
  );

  return (
    <div className="bg-gray-50 dark:bg-slate-900 min-h-screen pb-20">
      {/* HEADER */}
      <div className="sticky top-0 z-20 bg-white dark:bg-slate-800 shadow-sm border-b dark:border-slate-700 p-3 flex items-center gap-3">
          <button onClick={onClose}><ArrowLeft className="text-slate-600 dark:text-slate-300"/></button>
          <div className="flex-1">
              <h2 className="font-bold text-slate-900 dark:text-white leading-tight">{patient.name}</h2>
              <p className="text-xs text-slate-500">{patient.hospital} • {calculateAge(patient.dob)}a • {patient.diagnosis}</p>
          </div>
          <button onClick={()=>setShowEdit(true)} className="p-2 bg-blue-50 text-blue-600 rounded-full"><Edit size={16}/></button>
      </div>

      <div className="p-3 space-y-4">
          {/* INFO CARD */}
          <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 text-sm shadow-sm">
              <div className="grid grid-cols-2 gap-2 mb-2">
                  <div><span className="font-bold block text-xs text-gray-400">TRATANTE</span>{patient.doctor}</div>
                  <div><span className="font-bold block text-xs text-gray-400">SEGURO</span>{patient.insurance}</div>
                  <div><span className="font-bold block text-xs text-gray-400">TELÉFONO</span><a href={`tel:${patient.phone}`} className="text-blue-500 underline">{patient.phone}</a></div>
              </div>
              <div className="border-t pt-2 mt-2 dark:border-slate-700">
                  <span className="font-bold block text-xs text-gray-400 mb-1">ANTECEDENTES</span>
                  <div className="flex flex-wrap gap-1 mb-1">
                      {patient.antecedents?.dm && <span className="px-1.5 py-0.5 bg-red-100 text-red-800 rounded text-[10px] font-bold">DM</span>}
                      {patient.antecedents?.has && <span className="px-1.5 py-0.5 bg-orange-100 text-orange-800 rounded text-[10px] font-bold">HAS</span>}
                      {patient.antecedents?.onco && <span className="px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded text-[10px] font-bold">ONCO</span>}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300">{patient.antecedents?.other || 'Sin otros antecedentes'}</p>
                  {patient.allergies && <p className="text-xs text-red-500 font-bold mt-1">ALERGIAS: {patient.allergies}</p>}
              </div>
          </div>

          {/* NEW NOTE FORM */}
          <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow border border-blue-200 dark:border-slate-600">
              <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-sm text-blue-600 dark:text-blue-400">NUEVA NOTA</h3>
                  <select className="text-xs p-1 border rounded bg-slate-50 dark:bg-slate-700 dark:text-white" value={noteType} onChange={e=>setNoteType(e.target.value)}>
                      <option value="visita">Visita Diaria</option>
                      <option value="check_qx">Verificación Qx</option>
                      <option value="check_egreso">Checklist Egreso</option>
                      <option value="labs">Laboratorios</option>
                      <option value="vitales">Signos Vitales</option>
                      <option value="sonda">Sonda / Catéter</option>
                      <option value="urocultivo">Urocultivo</option>
                      <option value="somato">Peso y Talla</option>
                      <option value="vpo">VPO</option>
                      <option value="imagen">Imagen (URL)</option>
                      <option value="texto">Nota Libre</option>
                  </select>
              </div>

              <div className="space-y-2 mb-3">
                  {/* DYNAMIC INPUTS BASED ON TYPE */}
                  {noteType === 'visita' && (
                      <>
                        <textarea className="w-full border rounded p-2 text-sm dark:bg-slate-700 dark:text-white" placeholder="Subjetivo..." value={noteForm.subj||''} onChange={e=>setNoteForm({...noteForm, subj:e.target.value})}/>
                        <div className="grid grid-cols-3 gap-2">
                             <Input label="TA" k="ta"/> <Input label="FC" k="fc"/> <Input label="Temp" k="temp"/>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                             <Input label="Gasto U (ml)" k="gu"/> <Input label="Drenajes" k="drains"/>
                        </div>
                        <div className="p-2 bg-slate-50 dark:bg-slate-700 rounded border dark:border-slate-600">
                            <p className="text-[10px] font-bold text-gray-400 mb-1">LABS RÁPIDOS</p>
                            <div className="grid grid-cols-4 gap-1">
                                <Input label="Hb" k="hb"/> <Input label="Leu" k="leu"/> <Input label="Cr" k="cr"/> <Input label="Glu" k="glu"/>
                            </div>
                        </div>
                        <textarea className="w-full border rounded p-2 text-sm dark:bg-slate-700 dark:text-white h-20" placeholder="Análisis y Plan..." value={noteForm.plan||''} onChange={e=>setNoteForm({...noteForm, plan:e.target.value})}/>
                      </>
                  )}

                  {noteType === 'check_qx' && (
                      <div className="space-y-1">
                          {['Carta Seguro','Nota Internamiento','VPO','Laboratorios','Indicaciones Pre-Op','Confirmación Tel'].map(item => (
                              <label key={item} className="flex items-center gap-2 text-sm dark:text-white">
                                  <input type="checkbox" checked={noteForm[item]||false} onChange={e=>setNoteForm({...noteForm, [item]:e.target.checked})} /> {item}
                              </label>
                          ))}
                      </div>
                  )}

                  {noteType === 'check_egreso' && (
                      <div className="space-y-1">
                          {['Receta Entregada','Informe Médico','Nota de Egreso'].map(item => (
                              <label key={item} className="flex items-center gap-2 text-sm dark:text-white">
                                  <input type="checkbox" checked={noteForm[item]||false} onChange={e=>setNoteForm({...noteForm, [item]:e.target.checked})} /> {item}
                              </label>
                          ))}
                      </div>
                  )}
                  
                  {noteType === 'labs' && (
                      <div className="grid grid-cols-3 gap-2">
                          <Input label="Hb" k="hb"/> <Input label="Hto" k="htc"/> <Input label="Leu" k="leu"/> <Input label="Plq" k="plq"/>
                          <Input label="Glu" k="glu"/> <Input label="Urea" k="urea"/> <Input label="BUN" k="bun"/> <Input label="Cr" k="cr"/>
                          <Input label="Na" k="na"/> <Input label="K" k="k"/> <Input label="Cl" k="cl"/>
                          <Input label="TP" k="tp"/> <Input label="TTP" k="ttp"/> <Input label="INR" k="inr"/>
                      </div>
                  )}

                  {noteType === 'vitales' && (
                      <div className="flex gap-2">
                          <Input label="TA" k="ta"/> <Input label="FR" k="fr"/> <Input label="Temp" k="temp"/>
                      </div>
                  )}

                  {noteType === 'sonda' && (
                      <div className="flex gap-2">
                           <div className="flex-1"><label className="text-[10px] font-bold text-gray-400">Fecha Colocación</label><input type="date" className="w-full border rounded p-1.5 text-sm dark:bg-slate-700 dark:text-white" value={noteForm.date||''} onChange={e=>setNoteForm({...noteForm, date:e.target.value})}/></div>
                      </div>
                  )}

                  {noteType === 'urocultivo' && (
                      <div className="space-y-2">
                          <select className="w-full border p-2 rounded dark:bg-slate-700 dark:text-white" onChange={e=>setNoteForm({...noteForm, res:e.target.value})}><option value="">Resultado...</option><option value="+">Positivo (+)</option><option value="-">Negativo (-)</option></select>
                          {noteForm.res === '+' && (<><Input label="Microorganismo" k="germ"/><Input label="Sensibilidad" k="sens"/></>)}
                      </div>
                  )}

                  {noteType === 'somato' && (
                      <div className="flex gap-2 items-end">
                          <Input label="Peso (kg)" k="w"/> <Input label="Talla (m)" k="h"/>
                          <div className="text-sm font-bold p-2 bg-gray-100 rounded">IMC: {calculateBMI(noteForm.w, noteForm.h)}</div>
                      </div>
                  )}
                  
                  {noteType === 'vpo' && (
                      <div className="space-y-2">
                          <Input label="Médico que evalúa" k="doc"/>
                          <Input label="Grupo ASA" k="asa"/>
                      </div>
                  )}

                  {(noteType === 'texto' || noteType === 'imagen') && (
                       <textarea className="w-full border rounded p-2 text-sm dark:bg-slate-700 dark:text-white h-20" placeholder={noteType==='imagen'?'Pegar URL...':'Escribir nota...'} value={noteForm.text||''} onChange={e=>setNoteForm({...noteForm, text:e.target.value})}/>
                  )}
              </div>

              <button onClick={handleSaveNote} className="w-full bg-blue-600 text-white py-2 rounded font-bold shadow hover:bg-blue-700 flex justify-center items-center gap-2"><Save size={16}/> Guardar Nota</button>
          </div>

          {/* NOTE HISTORY */}
          <div className="space-y-3">
              {patient.notes?.slice().reverse().map(note => (
                  <div key={note.id} className="bg-white dark:bg-slate-800 p-3 rounded shadow-sm border border-gray-100 dark:border-slate-700 relative">
                      <div className="flex justify-between items-center text-xs text-gray-400 mb-2 border-b pb-1">
                          <span>{new Date(note.timestamp).toLocaleDateString()} {new Date(note.timestamp).toLocaleTimeString([],{hour:'2-digit', minute:'2-digit'})}</span>
                          <span className="uppercase font-bold bg-gray-100 dark:bg-slate-700 px-1 rounded">{note.type}</span>
                          <span className="font-bold text-blue-500">{note.author}</span>
                      </div>
                      <div className="text-sm text-slate-800 dark:text-slate-200">
                          {/* RENDER CONTENT BASED ON TYPE */}
                          {note.type === 'visita' && (
                              <div className="space-y-1">
                                  <p><span className="font-bold">S:</span> {note.content.subj}</p>
                                  <div className="bg-slate-50 dark:bg-slate-700 p-1.5 rounded text-xs font-mono">
                                      TA:{note.content.ta} FC:{note.content.fc} T:{note.content.temp} | GU:{note.content.gu}
                                  </div>
                                  <p className="font-medium text-blue-800 dark:text-blue-300">P: {note.content.plan}</p>
                                  <button onClick={()=>copyToWA(note)} className="text-[10px] text-green-600 font-bold flex gap-1 items-center mt-1"><Copy size={10}/> Copiar WA</button>
                              </div>
                          )}
                          {note.type.includes('check') && (
                              <ul className="list-disc pl-4 text-xs">
                                  {Object.entries(note.content).map(([k,v]) => v && <li key={k}>{k}</li>)}
                              </ul>
                          )}
                          {note.type === 'sonda' && <p>Colocación: {note.content.date} <span className="font-bold text-red-500">({calculateDaysDiff(note.content.date)} días)</span></p>}
                          {note.type === 'imagen' && <img src={note.content.text} alt="Nota" className="max-w-full rounded mt-2"/>}
                          {!['visita','check_qx','check_egreso','sonda','imagen'].includes(note.type) && (
                              <pre className="whitespace-pre-wrap font-sans">{JSON.stringify(note.content, null, 2).replace(/[{}"]/g,'')}</pre>
                          )}
                      </div>
                  </div>
              ))}
          </div>
      </div>
      {showEdit && <PatientFormModal onClose={() => {setShowEdit(false); onClose();}} mode="edit" initialData={patient} />}
    </div>
  );
}
