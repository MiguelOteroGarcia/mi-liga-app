"use client";

import { useEffect, useState, Suspense } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";

function AdminContent() {
  const searchParams = useSearchParams();
  const ligaId = searchParams.get('liga');
  const router = useRouter();

  const [liga, setLiga] = useState<any>(null);
  const [miembros, setMiembros] = useState<any[]>([]);
  const [puntosExtra, setPuntosExtra] = useState<Record<string, string>>({});
  const [cargando, setCargando] = useState(true);
  const [esAutorizado, setEsAutorizado] = useState(false);

  useEffect(() => {
    async function verificarYCargar() {
      if (!ligaId) {
        setCargando(false);
        return;
      }

      // 1. Obtener usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // 2. Cargar info de la liga
      const { data: l } = await supabase.from('leagues').select('*').eq('id', ligaId).single();
      
      if (!l) {
        setCargando(false);
        return;
      }

      setLiga(l);

      // 3. Comprobar si el usuario actual es el administrador de esta liga
      const esAdminDeLiga = l.admin_ === user.id || l.admin_id === user.id;
      if (!esAdminDeLiga) {
        setCargando(false);
        return; // No autorizado
      }

      setEsAutorizado(true);

      // 4. Cargar miembros de esta liga
      const { data: mems } = await supabase
        .from('league_members')
        .select('user_id')
        .eq('league_id', ligaId);

      if (!mems) {
        setCargando(false);
        return;
      }

      const { data: perfiles } = await supabase.from('profiles').select('*');
      const { data: manualPts } = await supabase.from('manual_points').select('*').eq('league_id', ligaId);

      const listaCompleta = mems.map(m => {
        const perfil = perfiles?.find((p: any) => p.id === m.user_id);
        const manual = manualPts?.find((mp: any) => mp.user_id === m.user_id);
        return {
          userId: m.user_id,
          nombre: perfil?.username || perfil?.full_name || `Usuario_${m.user_id.substring(0, 5)}`,
          puntosActuales: manual?.points || 0
        };
      });

      setMiembros(listaCompleta);
      setCargando(false);
    }
    verificarYCargar();
  }, [ligaId, router]);

  const aplicarPuntosManuales = async (userId: string, nombreUsuario: string) => {
    const valor = Number(puntosExtra[userId]);
    if (isNaN(valor)) return alert("Introduce un número válido");

    const { data: existente } = await supabase
      .from('manual_points')
      .select('*')
      .eq('league_id', ligaId)
      .eq('user_id', userId)
      .single();

    if (existente) {
      await supabase
        .from('manual_points')
        .update({ points: valor })
        .eq('league_id', ligaId)
        .eq('user_id', userId);
    } else {
      await supabase
        .from('manual_points')
        .insert([{ league_id: ligaId, user_id: userId, points: valor }]);
    }

    const mensaje = `El administrador ha modificado la puntuación: ha fijado los puntos manuales en ${valor} para el usuario ${nombreUsuario}.`;
    await supabase.from('notifications').insert([{ league_id: ligaId, message: mensaje }]);

    alert("¡Puntos ajustados y notificación enviada!");
    window.location.reload();
  };

  if (cargando) {
    return <div className="p-8 text-center">Verificando permisos de administrador...</div>;
  }

  if (!ligaId || !esAutorizado) {
    return (
      <main className="p-8 max-w-4xl mx-auto text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Acceso Denegado</h1>
        <p className="text-gray-600 mb-4">No tienes permisos de administración para esta liga o el enlace no es válido.</p>
        <button onClick={() => router.push('/dashboard')} className="bg-blue-600 text-white px-4 py-2 rounded font-bold">← Volver al Dashboard</button>
      </main>
    );
  }

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Panel Admin - Ajuste Manual</h1>
        <button onClick={() => router.push(`/liga/${ligaId}`)} className="text-blue-600 font-bold">← Volver a la Liga</button>
      </div>

      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-bold mb-2">Liga: {liga?.name}</h2>
        <p className="text-sm text-gray-600 mb-6">Establece los puntos manuales para los participantes de esta liga.</p>

        <div className="space-y-4">
          {miembros.map(m => (
            <div key={m.userId} className="flex justify-between items-center p-3 border rounded">
              <div>
                <span className="font-bold">{m.nombre}</span>
                <span className="text-xs text-gray-500 block">Puntos manuales actuales: {m.puntosActuales} pts</span>
              </div>
              <div className="flex gap-2 items-center">
                <input 
                  type="number" 
                  placeholder="Nuevo total"
                  className="border p-1 w-24 text-center rounded"
                  value={puntosExtra[m.userId] || ''}
                  onChange={(e) => setPuntosExtra({...puntosExtra, [m.userId]: e.target.value})}
                />
                <button 
                  onClick={() => aplicarPuntosManuales(m.userId, m.nombre)}
                  className="bg-purple-600 text-white px-4 py-1 rounded font-bold hover:bg-purple-700"
                >
                  Guardar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="p-8">Cargando panel...</div>}>
      <AdminContent />
    </Suspense>
  );
}