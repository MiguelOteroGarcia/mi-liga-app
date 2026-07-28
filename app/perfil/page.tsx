"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function PerfilPage() {
  const [nombre, setNombre] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function cargarPerfil() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/login');

      // Consultar si ya tiene un perfil creado
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) {
        setNombre(data.username || data.full_name || "");
      }
    }
    cargarPerfil();
  }, [router]);

  const guardarPerfil = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Guardar o actualizar el nombre en la tabla 'profiles'
    // Asegúrate de que tu tabla 'profiles' tenga las columnas 'id' y 'username'
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, username: nombre });

    if (error) {
      alert("Error al guardar: " + error.message);
    } else {
      alert("¡Nombre actualizado con éxito!");
      router.push('/dashboard');
    }
  };

  return (
    <main className="p-8 max-w-md mx-auto bg-white rounded-xl shadow-sm border mt-10">
      <h1 className="text-2xl font-bold mb-6">Mi Perfil</h1>
      
      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de usuario o Apodo</label>
          <input 
            type="text" 
            value={nombre}
            placeholder="Ej: Juanito_Bet" 
            className="border p-3 rounded-lg w-full"
            onChange={(e) => setNombre(e.target.value)}
          />
        </div>

        <button 
          onClick={guardarPerfil} 
          className="bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700"
        >
          Guardar Nombre
        </button>

        <button 
          onClick={() => router.push('/dashboard')} 
          className="bg-gray-100 text-gray-700 p-2 rounded-lg font-semibold hover:bg-gray-200 text-center"
        >
          Volver
        </button>
      </div>
    </main>
  );
}