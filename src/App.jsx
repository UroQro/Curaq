import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import Login from './components/Login';
import Census from './components/Census';
import Programming from './components/Programming';
import Discharges from './components/Discharges';
import { LogOut, ClipboardList, CalendarClock, Archive } from 'lucide-react';
import { getLocalISODate } from './utils';

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login'); 
  const [loading, setLoading] = useState(true);

  // LOGICA DE RESET A MEDIANOCHE (Checkbox visita diaria)
  const checkDailyReset = async () => {
      const todayStr = getLocalISODate();
      const metaRef = doc(db, 'metadata', 'daily_reset');
      try {
          const metaSnap = await getDoc(metaRef);
          if (!metaSnap.exists() || metaSnap.data().date !== todayStr) {
              // Si la fecha guardada no es hoy, reseteamos todos los checkbox 'dailyCheck'
              const batch = writeBatch(db);
              const q = query(collection(db, 'patients'), where('dailyCheck', '==', true));
              const snapshot = await getDocs(q);
              snapshot.docs.forEach(doc => { batch.update(doc.ref, { dailyCheck: false }); });
              
              // Actualizamos la fecha de reset
              batch.set(metaRef, { date: todayStr });
              await batch.commit();
              console.log("Daily reset complete");
          }
      } catch (e) { console.error("Reset error:", e); }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) { 
          setView('census'); 
          checkDailyReset(); 
      } else { 
          setView('login'); 
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = () => signOut(auth);

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-900 text-white">Cargando CURAQ...</div>;
  if (!user) return <Login />;

  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-500">
      <header className="bg-slate-900 text-white p-3 shadow-md sticky top-0 z-50 pt-safe">
        <div className="max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-3">
                <h1 className="text-xl font-bold tracking-tight">CURAQ <span className="text-blue-400 font-light">Manager</span></h1>
                <div className="text-xs flex items-center gap-2 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                    <span className="uppercase text-slate-300">{user.displayName || user.email.split('@')[0]}</span>
                    <button onClick={handleLogout} className="text-red-400 hover:text-red-300"><LogOut size={14}/></button>
                </div>
            </div>
            <nav className="flex justify-between gap-1 overflow-x-auto pb-1">
                <NavBtn active={view==='census'} onClick={()=>setView('census')} label="Censo" icon={<ClipboardList size={18}/>} />
                <NavBtn active={view==='programming'} onClick={()=>setView('programming')} label="Programación" icon={<CalendarClock size={18}/>} />
                <NavBtn active={view==='discharges'} onClick={()=>setView('discharges')} label="Egresos" icon={<Archive size={18}/>} />
            </nav>
        </div>
      </header>
      <main className="flex-1 p-2 max-w-5xl mx-auto w-full pb-safe">
        {view === 'census' && <Census user={user} />}
        {view === 'programming' && <Programming user={user} />}
        {view === 'discharges' && <Discharges />}
      </main>
    </div>
  );
}
const NavBtn = ({ active, onClick, label, icon }) => (
    <button onClick={onClick} className={`flex-1 flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-lg text-xs font-bold transition ${active ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
        {icon} 
        <span>{label}</span>
    </button>
);
