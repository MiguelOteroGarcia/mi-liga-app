"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert("Error: " + error.message);
      setLoading(false);
    } else {
      // Forzamos la navegación al dashboard
      router.push("/dashboard");
      router.refresh(); 
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert("Error al registrar: " + error.message);
    } else {
      alert("Registro exitoso. Ya puedes entrar.");
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-6">Únete a la Liga ⚽</h1>
        <form className="space-y-4">
          <input
            type="email"
            placeholder="Correo electrónico"
            className="w-full p-2 border rounded"
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Contraseña"
            className="w-full p-2 border rounded"
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="flex gap-2">
            <button
              onClick={handleLogin}
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 rounded font-bold"
            >
              {loading ? "..." : "Entrar"}
            </button>
            <button
              onClick={handleRegister}
              disabled={loading}
              className="flex-1 bg-gray-300 text-gray-700 py-2 rounded font-bold"
            >
              Registrarse
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}