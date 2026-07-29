"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const [ligas, setLigas] = useState<{porra: any[], quiniela: any[]}>({porra: [], quiniela: []});
  const [codigo, setCodigo] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function cargarLigasDelUsuario() {
      // 1. Obtener el usuario autenticado actual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // 2. Buscar en 'league_members' las ligas a las que pertenece este usuario
      const { data: memberships, error: memberError } = await supabase
        .from('league_members')
        .select('league_id')
        .eq('user_id', user.id);

      if (memberError || !memberships || memberships.length === 0) {
        setLigas({ porra: [], quiniela: [] });
        return;
      }

      // Extraer los IDs de las ligas del usuario
      const leagueIds = memberships.map(m => m.league_id);

      // 3. Consultar únicamente los datos de esas ligas específicas divididas por tipo
      const { data: p } = await supabase
        .from('leagues')
        .select('*')
        .in('id', leagueIds)
        .ilike('game_type', 'porra');

      const { data: q } = await supabase
        .from('leagues')
        .select('*')
        .in('id', leagueIds)
        .ilike('game_type', 'quiniela');

      setLigas({ porra: p || [], quiniela: q || [] });
    }

    cargarLigasDelUsuario();
  }, [router]);

  const unirseALiga = async () => {
    if (!codigo) return alert("Introduce el código de la liga");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("Debes iniciar sesión");
    
    const { error } = await supabase.from('league_members').insert([{ league_id: codigo.trim(), user_id: user.id }]);
    if (error) alert("Error al unirse (comprueba que el código sea correcto): " + error.message);
    else { alert("¡Te has unido con éxito!"); window.location.reload(); }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-10">
          <h1 className="text-4xl font-extrabold text-gray-900">Mis Ligas</h1>
          <div className="flex gap-3">
            <button onClick={() => router.push('/perfil')} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300">Mi Perfil</button>
            <button onClick={() => supabase.auth.signOut().then(() => router.push('/login'))} className="bg-red-50 text-red-600 px-4 py-2 rounded-lg font-semibold hover:bg-red-100">Cerrar Sesión</button>
          </div>
        </header>

        <div className="flex gap-4 mb-12 items-center flex-wrap">
          <button onClick={() => router.push('/crear-liga?tipo=porra')} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700">Crear Porra</button>
          <button onClick={() => router.push('/crear-liga?tipo=quiniela')} className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700">Crear Quiniela</button>
          <input placeholder="ID / Código de liga" className="border p-3 rounded-xl bg-white" onChange={(e) => setCodigo(e.target.value)} />
          <button onClick={unirseALiga} className="bg-gray-800 text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-900">Unirse</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <section>
            <h2 className="text-2xl font-bold text-blue-700 mb-6">⚽ Mis Porras</h2>
            {ligas.porra.length === 0 ? (
              <p className="text-gray-500 italic">No estás en ninguna porra todavía.</p>
            ) : (
              ligas.porra.map(l => (
                <div key={l.id} onClick={() => router.push(`/liga/${l.id}`)} className="bg-white p-6 rounded-2xl shadow-sm border mb-4 cursor-pointer hover:shadow-md transition-all font-semibold text-gray-800">{l.name}</div>
              ))
            )}
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-green-700 mb-6">🏆 Mis Quinielas</h2>
            {ligas.quiniela.length === 0 ? (
              <p className="text-gray-500 italic">No estás en ninguna quiniela todavía.</p>
            ) : (
              ligas.quiniela.map(l => (
                <div key={l.id} onClick={() => router.push(`/liga/${l.id}`)} className="bg-white p-6 rounded-2xl shadow-sm border mb-4 cursor-pointer hover:shadow-md transition-all font-semibold text-gray-800">{l.name}</div>
              ))
            )}
          </section>
        </div>
      </div>
    </main>
  );
}