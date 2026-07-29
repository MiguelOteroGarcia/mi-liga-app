"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { useRouter, useParams } from "next/navigation";

export default function ConfiguracionLigaPage() {
  const [nombreLiga, setNombreLiga] = useState("");
  const [cargando, setCargando] = useState(true);
  const router = useRouter();
  const params = useParams();
  const leagueId = params.id;

  useEffect(() => {
    async function cargarLiga() {
      const { data, error } = await supabase
        .from('leagues')
        .select('name')
        .eq('id', leagueId)
        .single();

      if (data) {
        setNombreLiga(data.name);
      }
      setCargando(false);
    }
    if (leagueId) cargarLiga();
  }, [leagueId]);

  const actualizarNombre = async () => {
    if (!nombreLiga.trim()) return alert("El nombre no puede estar vacío.");

    const { error } = await supabase
      .from('leagues')
      .update({ name: nombreLiga })
      .eq('id', leagueId);

    if (error) {
      alert("Error al actualizar el nombre: " + error.message);
    } else {
      alert("¡Nombre de la liga actualizado con éxito!");
      router.push(`/liga/${leagueId}`);
    }
  };

  if (cargando) return <div className="p-8 text-center">Cargando configuración...</div>;

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-sm border">
        <h1 className="text-2xl font-bold mb-6 text-gray-900">Configuración de la Liga</h1>
        
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Liga</label>
            <input 
              type="text" 
              value={nombreLiga}
              onChange={(e) => setNombreLiga(e.target.value)}
              className="border p-3 rounded-lg w-full"
            />
          </div>

          <button 
            onClick={actualizarNombre} 
            className="bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700 transition-all"
          >
            Guardar Cambios
          </button>

          <button 
            onClick={() => router.push(`/liga/${leagueId}`)} 
            className="bg-gray-100 text-gray-700 p-2 rounded-lg font-semibold hover:bg-gray-200 text-center"
          >
            Volver
          </button>
        </div>
      </div>
    </main>
  );
}