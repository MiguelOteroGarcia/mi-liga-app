import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase'; // Asegúrate de que esta ruta sea correcta

export async function GET() {
  try {
    // Aquí iría la lógica para obtener resultados reales de una API externa.
    // Por ahora, esto es un endpoint de prueba.
    return NextResponse.json({ 
      message: "API de resultados activa. Implementa aquí el fetch a tu proveedor de datos." 
    });
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}