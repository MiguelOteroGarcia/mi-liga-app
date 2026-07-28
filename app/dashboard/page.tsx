"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const [ligas, setLigas] = useState<{porra: any[], quiniela: any[]}>({porra: [], quiniela: []});
  const [codigo, setCodigo] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function cargar() {
      // Usamos .ilike para ignorar mayúsculas/minúsculas y asegurar que encuentra los datos
      const { data: p } = await supabase.from('leagues').select('*').ilike('game_type', 'porra');
      const { data: q } = await supabase.from('leagues').select('*').ilike('game_type', 'quiniela');
      setLigas({ porra: p || [], quiniela: q || [] });
    }
    cargar();
  }, []);

  const unirseALiga = async () => {
    if (!codigo) return alert("Introduce el código de la liga");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("Debes iniciar sesión");
    
    const { error } = await supabase.from('league_members').insert([{ league_id: codigo, user_id: user.id }]);
    if (error) alert("Error al unirse: " + error.message);
    else { alert("¡Te has unido!"); window.location.reload(); }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-10">
          <h1 className="text-4xl font-extrabold text-gray-900">Mis Ligas</h1>
          <div className="flex gap-3">
            <button onClick={() => router.push('/perfil')} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300">Mi Perfil</button>
            <button onClick={() => supabase.auth.signOut().then(() => router.push('/login'))} className="bg-red-50 text-red-600 px-4 py-2 rounded-lg font-semibold">Cerrar Sesión</button>
          </div>
        </header>

        <div className="flex gap-4 mb-12 items-center flex-wrap">
          <button onClick={() => router.push('/crear-liga?tipo=porra')} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700">Crear Porra</button>
          <button onClick={() => router.push('/crear-liga?tipo=quiniela')} className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700">Crear Quiniela</button>
          <input placeholder="Código de liga" className="border p-3 rounded-xl" onChange={(e) => setCodigo(e.target.value)} />
          <button onClick={unirseALiga} className="bg-gray-800 text-white px-6 py-3 rounded-xl font-bold">Unirse</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <section>
            <h2 className="text-2xl font-bold text-blue-700 mb-6">⚽ Porras</h2>
            {ligas.porra.map(l => (
              <div key={l.id} onClick={() => router.push(`/liga/${l.id}`)} className="bg-white p-6 rounded-2xl shadow-sm border mb-4 cursor-pointer hover:shadow-md transition-all">{l.name}</div>
            ))}
          </section>
          <section>
            <h2 className="text-2xl font-bold text-green-700 mb-6">🏆 Quinielas</h2>
            {ligas.quiniela.map(l => (
              <div key={l.id} onClick={() => router.push(`/liga/${l.id}`)} className="bg-white p-6 rounded-2xl shadow-sm border mb-4 cursor-pointer hover:shadow-md transition-all">{l.name}</div>
            ))}
          </section>
        </div>
      </div>
    </main>
  );
}