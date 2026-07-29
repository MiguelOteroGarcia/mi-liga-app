"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter, useParams } from "next/navigation";

export default function AdminLigaPage() {
  const router = useRouter();
  const params = useParams();
  const leagueId = params.id;
  const [eliminando, setEliminando] = useState(false);

  const eliminarLiga = async () => {
    // Mensaje de confirmación de seguridad
    const confirmacion = window.confirm(
      "¿Estás totalmente seguro de que quieres eliminar esta liga? Esta acción borrará todos sus datos y no se puede deshacer."
    );

    if (!confirmacion) return;

    setEliminando(true);

    // 1. Borrar primero los registros relacionados (miembros y apuestas) para evitar errores de restricción
    await supabase.from('league_members').delete().eq('league_id', leagueId);
    await supabase.from('bets').delete().eq('league_id', leagueId);

    // 2. Borrar la liga de la tabla 'leagues'
    const { error } = await supabase
      .from('leagues')
      .delete()
      .eq('id', leagueId);

    if (error) {
      alert("Error al eliminar la liga: " + error.message);
      setEliminando(false);
    } else {
      alert("La liga ha sido eliminada correctamente.");
      router.push('/dashboard');
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-sm border">
        <h1 className="text-2xl font-bold mb-6 text-gray-900">Ajustes de Administrador</h1>
        
        <div className="flex flex-col gap-6">
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
            <h2 className="font-bold text-red-700 mb-2">Zona Peligrosa</h2>
            <p className="text-sm text-red-600 mb-4">
              Si eliminas la liga desaparecerá por completo para todos los participantes.
            </p>
            <button 
              onClick={eliminarLiga}
              disabled={eliminando}
              className="bg-red-600 text-white w-full p-3 rounded-lg font-bold hover:bg-red-700 transition-all disabled:opacity-50"
            >
              {eliminando ? "Eliminando..." : "Eliminar Liga"}
            </button>
          </div>

          <button 
            onClick={() => router.push(`/liga/${leagueId}`)} 
            className="bg-gray-100 text-gray-700 p-2 rounded-lg font-semibold hover:bg-gray-200 text-center"
          >
            Volver a la liga
          </button>
        </div>
      </div>
    </main>
  );
}