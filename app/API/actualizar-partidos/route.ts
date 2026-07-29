import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fecha = searchParams.get('date') || new Date().toISOString().split('T')[0];

    const response = await fetch(`https://free-api-live-football-data.p.rapidapi.com/football-fixtures-by-date?date=${fecha}`, {
      headers: {
        'X-RapidAPI-Key': process.env.FOOTBALL_API_KEY!,
        'X-RapidAPI-Host': 'free-api-live-football-data.p.rapidapi.com'
      }
    });

    const data = await response.json();
    const partidosApi = data.response?.matches || data.matches || [];

    if (partidosApi.length === 0) {
      return NextResponse.json({ success: true, message: `No se encontraron partidos en la API para la fecha ${fecha}.` });
    }

    let actualizados = 0;

    for (const match of partidosApi) {
      const local = match.homeTeam?.name || match.home_team;
      const visitante = match.awayTeam?.name || match.away_team;
      const estado = match.status?.short || match.status;

      if (estado === 'FT' || estado === 'Finished') {
        const golesLocal = match.scores?.homeTeam ?? match.home_score;
        const golesVisitante = match.scores?.awayTeam ?? match.away_score;

        const { error } = await supabaseAdmin
          .from('matches')
          .update({
            home_score: Number(golesLocal),
            away_score: Number(golesVisitante),
            status: 'finished'
          })
          .ilike('home_team', `%${local}%`)
          .ilike('away_team', `%${visitante}%`);

        if (!error) actualizados++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `¡Actualización completada! Se han actualizado ${actualizados} partidos para la fecha ${fecha}.` 
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}