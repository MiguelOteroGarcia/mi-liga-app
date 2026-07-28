"use client";

import { useState, Suspense } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";

function CrearLigaContent() {
  const [nombre, setNombre] = useState("");
  const searchParams = useSearchParams();
  const tipo = searchParams.get('tipo'); // Obtenemos 'porra' o 'quiniela' directamente de la URL
  const router = useRouter();

  const crearNuevaLiga = async () => {
    if (!nombre) return alert("Por favor, introduce un nombre para la liga.");
    if (!tipo) return alert("Error: tipo de liga no definido.");

    const { error } = await supabase
      .from('leagues')
      .insert([{ name: nombre, gmae_type: tipo }]); // Usamos gmae_type para que coincida con tu BD actual

    if (error) {
      alert("Error al crear la liga: " + error.message);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto bg-white rounded-xl shadow-sm border mt-10">
      <h1 className="text-2xl font-bold mb-6">Crear nueva {tipo === 'porra' ? 'Porra' : 'Quiniela'}</h1>
      
      <div className="flex flex-col gap-4">
        <input 
          type="text" 
          placeholder="Nombre de la liga" 
          className="border p-3 rounded-lg"
          onChange={(e) => setNombre(e.target.value)}
        />

        <button 
          onClick={crearNuevaLiga} 
          className="bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700"
        >
          Crear liga de {tipo === 'porra' ? 'Porra' : 'Quiniela'}
        </button>
      </div>
    </div>
  );
}

export default function CrearLiga() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Cargando...</div>}>
      <CrearLigaContent />
    </Suspense>
  );
}