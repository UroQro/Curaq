import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { HeartPulse } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center bg-gray-100"><HeartPulse className="animate-pulse text-blue-600" size={48}/></div>;
  
  // Si no hay usuario, mostrar el Login (Diseño de la captura)
  if (!user) return <Login />;

  // Si hay usuario, mostrar el Dashboard (Estilo Rounds App)
  return <Dashboard user={user} onLogout={() => signOut(auth)} />;
}
