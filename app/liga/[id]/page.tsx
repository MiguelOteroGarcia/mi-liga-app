"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { useParams, useRouter } from "next/navigation";

export default function SalaLiga() {
  const { id } = useParams();
  const router = useRouter();
  const [liga, setLiga] = useState<any>(null);
  const [partidos, setPartidos] = useState<any[]>([]);
  const [jornadaActual, setJornadaActual] = useState(0); // Empezamos por defecto en la jornada 0 de amistosos o 1
  const [apuestas, setApuestas] = useState<Record<string, any>>({});
  const [vista, setVista] = useState<'clasificacion' | 'resultados' | 'configuracion' | 'notificaciones'>('resultados');
  const [clasificacion, setClasificacion] = useState<any[]>([]);
  const [notificaciones, setNotificaciones] = useState<any[]>([]);
  const [notificacionesNoLeidas, setNotificacionesNoLeidas] = useState(0);
  const [esAdmin, setEsAdmin] = useState(false);

  const [ptsExactoInput, setPtsExactoInput] = useState(3);
  const [ptsSignoInput, setPtsSignoInput] = useState(1);
  const [nombreLigaInput, setNombreLigaInput] = useState("");

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: l } = await supabase.from('leagues').select('*').eq('id', id).single();
      
      setLiga(l);
      if (l) {
        setPtsExactoInput(l['points_exact_2.0'] ?? 3);
        setPtsSignoInput(l['points_sign_2.0'] ?? 1);
        setNombreLigaInput(l.name ?? "");
      }
      
      if (user && l && (l.admin_ === user.id || l.admin_id === user.id)) {
        setEsAdmin(true);
      }

      cargarPartidos(0); // Cargamos por defecto la jornada 0 (Amistosos)
      cargarNotificaciones();
    }
    init();
  }, [id]);

  const cargarPartidos = async (j: number) => {
    setJornadaActual(j);
    const { data: p } = await supabase.from('matches').select('*').eq('jornada', j);
    setPartidos(p || []);
  };

  const cargarNotificaciones = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('league_id', id)
      .order('created_at', { ascending: false });
    
    const lista = data || [];
    setNotificaciones(lista);

    const vistasGuardadas = Number(localStorage.getItem(`leidas_count_${id}`) || 0);
    const totalActual = lista.length;
    const noLeidas = Math.max(0, totalActual - vistasGuardadas);
    setNotificacionesNoLeidas(noLeidas);
  };

  const verNotificaciones = () => {
    setVista('notificaciones');
    setNotificacionesNoLeidas(0);
    localStorage.setItem(`leidas_count_${id}`, notificaciones.length.toString());
  };

  const guardarConfiguracionLiga = async () => {
    if (!nombreLigaInput.trim()) return alert("El nombre de la liga no puede estar vacío.");

    const { error } = await supabase
      .from('leagues')
      .update({
        name: nombreLigaInput,
        'points_exact_2.0': Number(ptsExactoInput),
        'points_sign_2.0': Number(ptsSignoInput)
      })
      .eq('id', id);

    if (error) {
      alert("Error al actualizar la configuración: " + error.message);
    } else {
      const mensajeNoti = `El administrador ha actualizado la configuración de la liga (Nombre: ${nombreLigaInput}, Pleno: ${ptsExactoInput}, Signo: ${ptsSignoInput}).`;
      await supabase.from('notifications').insert([{ league_id: id, message: mensajeNoti }]);

      alert("¡Configuración actualizada con éxito!");
      setLiga({
        ...liga,
        name: nombreLigaInput,
        'points_exact_2.0': Number(ptsExactoInput),
        'points_sign_2.0': Number(ptsSignoInput)
      });
      cargarNotificaciones();
    }
  };

  const cargarClasificacion = async () => {
    setVista('clasificacion');

    const { data: miembros } = await supabase
      .from('league_members')
      .select('user_id')
      .eq('league_id', id);

    if (!miembros) return;

    const { data: perfiles } = await supabase.from('profiles').select('*');
    const { data: todosLosPartidos } = await supabase.from('matches').select('*');
    const { data: todasLasApuestas } = await supabase.from('bets').select('*');
    const { data: manualPts } = await supabase.from('manual_points').select('*').eq('league_id', id);

    const tablaPuntos: Record<string, number> = {};

    miembros.forEach(m => {
      const manual = manualPts?.find((mp: any) => mp.user_id === m.user_id);
      tablaPuntos[m.user_id] = manual ? manual.points : 0;
    });

    todasLasApuestas?.forEach(apuesta => {
      if (tablaPuntos[apuesta.user_id] !== undefined) {
        const partido = todosLosPartidos?.find(p => p.id === apuesta.match_id);
        
        if (partido && partido.status === 'finished') {
          if (liga?.game_type === 'porra') {
            const ptsExacto = liga['points_exact_2.0'] ?? 3;
            const ptsSigno = liga['points_sign_2.0'] ?? 1;

            if (
              apuesta.predicted_home_score === partido.home_score && 
              apuesta.predicted_away_score === partido.away_score
            ) {
              tablaPuntos[apuesta.user_id] += ptsExacto; 
            } else {
              const apuestaSigno = apuesta.predicted_home_score > apuesta.predicted_away_score ? '1' : apuesta.predicted_home_score < apuesta.predicted_away_score ? '2' : 'X';
              const realSigno = partido.home_score > partido.away_score ? '1' : partido.home_score < partido.away_score ? '2' : 'X';
              if (apuestaSigno === realSigno) {
                tablaPuntos[apuesta.user_id] += ptsSigno; 
              }
            }
          } else if (liga?.game_type === 'quiniela') {
            const ptsQuiniela = liga['points_exact_2.0'] ?? 1;
            const real1X2 = partido.home_score > partido.away_score ? '1' : partido.home_score < partido.away_score ? '2' : 'X';
            
            if (apuesta.prediction_1x2 === real1X2) {
              tablaPuntos[apuesta.user_id] += ptsQuiniela; 
            }
          }
        }
      }
    });

    const clasificacionOrdenada = Object.keys(tablaPuntos).map(userId => {
      const perfil = perfiles?.find((p: any) => p.id === userId);
      const nombreUsuario = perfil?.username || perfil?.full_name || `Usuario_${userId.substring(0, 5)}`;

      return {
        userId,
        nombre: nombreUsuario,
        puntos: tablaPuntos[userId]
      };
    }).sort((a, b) => b.puntos - a.puntos);

    setClasificacion(clasificacionOrdenada);
  };

  const guardar = async (matchId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const val = apuestas[matchId];
    const payload = liga.game_type === 'porra' 
      ? { user_id: user.id, match_id: matchId, predicted_home_score: Number(val.home), predicted_away_score: Number(val.away) }
      : { user_id: user.id, match_id: matchId, prediction_1x2: val };
    
    await supabase.from('bets').upsert(payload as any, { onConflict: 'user_id, match_id' });
    alert("¡Apuesta guardada!");
  };

  return (
    <main className="p-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <button onClick={() => router.push('/dashboard')} className="text-blue-600 font-bold">← Volver al Dashboard</button>
        <h1 className="text-2xl font-bold">{liga?.name}</h1>
        
        <div className="flex gap-2 items-center">
          {esAdmin && (
            <button 
              onClick={() => router.push(`/admin?liga=${id}`)} 
              className="bg-purple-600 text-white px-3 py-2 rounded text-sm font-bold hover:bg-purple-700"
            >
              ⚙️ Ajuste Manual Admin
            </button>
          )}
          <button onClick={() => {navigator.clipboard.writeText(id as string); alert("Código copiado");}} className="bg-gray-200 px-4 py-2 rounded text-sm">Código: {id}</button>
        </div>
      </div>

      <div className="flex gap-4 mb-6 flex-wrap">
        <button onClick={() => setVista('resultados')} className={`px-4 py-2 border rounded ${vista === 'resultados' ? 'bg-blue-600 text-white' : 'bg-white'}`}>Resultados</button>
        <button onClick={cargarClasificacion} className={`px-4 py-2 border rounded ${vista === 'clasificacion' ? 'bg-blue-600 text-white' : 'bg-white'}`}>Clasificación</button>
        
        <button onClick={verNotificaciones} className={`px-4 py-2 border rounded relative ${vista === 'notificaciones' ? 'bg-blue-600 text-white' : 'bg-white'}`}>
          🔔 Notificaciones
          {notificacionesNoLeidas > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
              {notificacionesNoLeidas}
            </span>
          )}
        </button>

        {esAdmin && (
          <button onClick={() => setVista('configuracion')} className={`px-4 py-2 border rounded ${vista === 'configuracion' ? 'bg-blue-600 text-white' : 'bg-white'}`}>⚙️ Configuración</button>
        )}
      </div>

      {vista === 'resultados' ? (
        <>
          {/* Selector de jornadas incluyendo la Jornada 0 de Amistosos */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2 items-center">
            <button 
              onClick={() => cargarPartidos(0)} 
              className={`px-3 py-1 border rounded font-bold ${jornadaActual === 0 ? 'bg-blue-600 text-white' : 'bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200'}`}
            >
              🟡 Amistosos (J0)
            </button>

            {[...Array(38)].map((_, i) => (
              <button 
                key={i+1} 
                onClick={() => cargarPartidos(i+1)} 
                className={`px-3 py-1 border rounded ${jornadaActual === i+1 ? 'bg-blue-600 text-white' : 'bg-white'}`}
              >
                J{i+1}
              </button>
            ))}
          </div>

          {partidos.length === 0 ? (
            <p className="text-gray-500 italic bg-white p-6 rounded shadow">No hay partidos programados para esta jornada.</p>
          ) : (
            partidos.map((p) => (
              <div key={p.id} className="bg-white p-4 rounded shadow mb-2 flex justify-between items-center">
                <span>{p.home_team} vs {p.away_team} {p.status === 'finished' && `(${p.home_score} - ${p.away_score})`}</span>
                {liga?.game_type === 'porra' ? (
                  <div className="flex gap-2">
                    <input type="number" defaultValue={apuestas[p.id]?.home} onChange={(e) => setApuestas({...apuestas, [p.id]: {...apuestas[p.id], home: e.target.value}})} className="w-12 border p-1"/>
                    <input type="number" defaultValue={apuestas[p.id]?.away} onChange={(e) => setApuestas({...apuestas, [p.id]: {...apuestas[p.id], away: e.target.value}})} className="w-12 border p-1"/>
                    <button onClick={() => guardar(p.id)} className="bg-blue-500 text-white px-2 rounded">Ok</button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    {['1', 'X', '2'].map(op => (
                      <button key={op} onClick={() => setApuestas({...apuestas, [p.id]: op})} className={`px-3 py-1 border rounded ${apuestas[p.id] === op ? 'bg-green-500 text-white' : 'bg-gray-100'}`}>{op}</button>
                    ))}
                    <button onClick={() => guardar(p.id)} className="bg-green-600 text-white px-2 rounded">Ok</button>
                  </div>
                )}
              </div>
            ))
          )}
        </>
      ) : vista === 'clasificacion' ? (
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-bold mb-4">Clasificación de la Liga</h2>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b">
                <th className="p-2">Posición</th>
                <th className="p-2">Usuario</th>
                <th className="p-2 text-right">Puntos</th>
              </tr>
            </thead>
            <tbody>
              {clasificacion.map((row, index) => (
                <tr key={row.userId} className="border-b">
                  <td className="p-2 font-bold">{index + 1}º</td>
                  <td className="p-2 font-medium text-gray-800">{row.nombre}</td>
                  <td className="p-2 text-right font-extrabold text-blue-600">{row.puntos} pts</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : vista === 'notificaciones' ? (
        <div className="bg-white p-6 rounded shadow max-w-2xl">
          <h2 className="text-xl font-bold mb-4">Notificaciones y Avisos</h2>
          {notificaciones.length === 0 ? (
            <p className="text-gray-500">No hay notificaciones recientes en esta liga.</p>
          ) : (
            <div className="space-y-3">
              {notificaciones.map((n) => (
                <div key={n.id} className="p-3 bg-blue-50 border-l-4 border-blue-600 text-sm text-gray-800 rounded">
                  <p>{n.message}</p>
                  <span className="text-xs text-gray-400 mt-1 block">{new Date(n.created_at).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white p-6 rounded shadow max-w-lg">
          <h2 className="text-xl font-bold mb-4">Configuración de la Liga</h2>
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Liga</label>
              <input 
                type="text" 
                value={nombreLigaInput} 
                onChange={(e) => setNombreLigaInput(e.target.value)}
                className="border p-2 rounded w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {liga?.game_type === 'porra' ? 'Puntos por Resultado Exacto (Pleno)' : 'Puntos por Acertar Quiniela (1X2)'}
              </label>
              <input 
                type="number" 
                value={ptsExactoInput} 
                onChange={(e) => setPtsExactoInput(Number(e.target.value))}
                className="border p-2 rounded w-full"
              />
            </div>

            {liga?.game_type === 'porra' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Puntos por Acertar el Signo</label>
                <input 
                  type="number" 
                  value={ptsSignoInput} 
                  onChange={(e) => setPtsSignoInput(Number(e.target.value))}
                  className="border p-2 rounded w-full"
                />
              </div>
            )}

            <button 
              onClick={guardarConfiguracionLiga}
              className="bg-blue-600 text-white p-3 rounded font-bold hover:bg-blue-700 mt-2"
            >
              Guardar Cambios
            </button>
          </div>
        </div>
      )}
    </main>
  );
}