"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase"; 
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAuth = async (isRegister: boolean) => {
    setLoading(true);
    const { error } = isRegister 
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    if (error) { alert(error.message); }
    else if (!isRegister) { router.push("/dashboard"); router.refresh(); }
    else { alert("Registro exitoso. Ya puedes entrar."); }
    setLoading(false);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-6">La Quiniela ⚽</h1>
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <input type="email" placeholder="Correo" className="w-full p-2 border rounded" onChange={(e) => setEmail(e.target.value)} />
          <input type="password" placeholder="Contraseña" className="w-full p-2 border rounded" onChange={(e) => setPassword(e.target.value)} />
          <button onClick={() => handleAuth(false)} className="w-full bg-blue-600 text-white py-2 rounded font-bold" disabled={loading}>Entrar</button>
          <button onClick={() => handleAuth(true)} className="w-full bg-gray-200 text-gray-700 py-2 rounded font-bold" disabled={loading}>Registrarse</button>
        </form>
      </div>
    </main>
  );
}