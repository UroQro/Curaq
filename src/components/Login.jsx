import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../firebase';
import { Mail, Lock, HeartPulse } from 'lucide-react';

export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [masterKey, setMasterKey] = useState('');
  const [error, setError] = useState('');

  const ADMIN_KEY = "Curaq8135892041";

  const handleLogin = async (e) => {
    e.preventDefault(); setError('');
    try { await signInWithEmailAndPassword(auth, email, password); } 
    catch (err) { setError("Usuario o contraseña incorrectos."); }
  };

  const handleRegister = async (e) => {
    e.preventDefault(); setError('');
    if (masterKey !== ADMIN_KEY) return setError("Clave maestra incorrecta.");
    try { 
        const cred = await createUserWithEmailAndPassword(auth, email, password); 
        await updateProfile(cred.user, { displayName: name });
    } catch (err) { setError(err.message); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md p-10 flex flex-col items-center">
        
        {/* LOGO CORAZÓN AZUL */}
        <div className="mb-6 relative">
             <HeartPulse className="text-blue-600 w-24 h-24 stroke-[1.5]" />
        </div>

        {/* TITULOS */}
        <h1 className="text-4xl font-black text-gray-900 mb-1 tracking-tight">CURAQ</h1>
        <p className="text-gray-500 font-medium mb-10 text-lg">Sistema Integral de Urología</p>

        {error && <div className="bg-red-50 text-red-500 text-sm p-3 rounded-lg w-full mb-4 text-center">{error}</div>}

        <form onSubmit={isRegistering ? handleRegister : handleLogin} className="w-full space-y-5">
            
            {isRegistering && (
                <>
                <div className="relative">
                    <input type="text" placeholder="Nombre Completo" className="input-curaq" value={name} onChange={e=>setName(e.target.value)} required />
                </div>
                <div className="relative">
                    <input type="password" placeholder="Clave Maestra" className="input-curaq" value={masterKey} onChange={e=>setMasterKey(e.target.value)} required />
                </div>
                </>
            )}

            {/* INPUT EMAIL */}
            <div className="relative">
                <Mail className="absolute left-4 top-4 text-gray-400" size={20} />
                <input 
                    type="email" 
                    placeholder="correo@ejemplo.com" 
                    className="input-curaq"
                    value={email}
                    onChange={e=>setEmail(e.target.value)}
                    required 
                />
            </div>

            {/* INPUT PASSWORD */}
            <div className="relative">
                <Lock className="absolute left-4 top-4 text-gray-400" size={20} />
                <input 
                    type="password" 
                    placeholder="••••••••" 
                    className="input-curaq"
                    value={password}
                    onChange={e=>setPassword(e.target.value)}
                    required 
                />
            </div>

            {/* BOTÓN AZUL GRANDE */}
            <button type="submit" className="w-full bg-blue-600 text-white font-bold text-lg py-4 rounded-xl shadow-lg hover:bg-blue-700 active:scale-95 transition-all mt-4">
                {isRegistering ? 'Registrar' : 'Iniciar Sesión'}
            </button>
        </form>

        <button onClick={() => {setIsRegistering(!isRegistering); setError('')}} className="mt-8 text-blue-600 font-semibold hover:underline">
            {isRegistering ? 'Volver al inicio' : 'Crear usuario nuevo'}
        </button>

      </div>
    </div>
  );
}
