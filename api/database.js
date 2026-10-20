/**
 * Vercel Serverless Function: Database Management & Healthcheck API
 * Realiza chequeo de conexión, verificación de tablas y creación de esquemas DDL
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Solo se acepta POST' });
  }

  const { action, engine, credentials } = req.body || {};

  try {
    if (action === 'check-and-init') {
      if (engine === 'supabase') {
        const { url, anonKey, table = 'bobinas_inventario' } = credentials || {};
        if (!url || !anonKey) {
          return res.status(400).json({ error: 'Faltan credenciales de Supabase (URL o Anon Key)' });
        }

        const cleanUrl = url.replace(/\/+$/, '');
        const tableUrl = `${cleanUrl}/${table}?select=*`;

        // 1. Verificar si la tabla existe
        const checkRes = await fetch(tableUrl, {
          method: 'GET',
          headers: {
            'apikey': anonKey,
            'Authorization': `Bearer ${anonKey}`,
            'Content-Type': 'application/json'
          }
        });

        if (checkRes.ok) {
          const rows = await checkRes.json();
          return res.status(200).json({
            status: 'connected',
            tableExists: true,
            count: Array.isArray(rows) ? rows.length : 0,
            elements: Array.isArray(rows) ? rows : [],
            message: `Tabla '${table}' verificada (${Array.isArray(rows) ? rows.length : 0} artículos encontrados)`
          });
        }

        // Si devuelve 404 o 400 (la relación no existe)
        const errText = await checkRes.text();
        const isMissing = errText.includes('relation') || errText.includes('does not exist') || checkRes.status === 404;

        if (isMissing) {
          return res.status(200).json({
            status: 'missing_table',
            tableExists: false,
            needsCreation: true,
            table,
            message: `La tabla '${table}' no existe aún en la base de datos Supabase.`
          });
        }

        return res.status(checkRes.status).json({
          status: 'error',
          error: `Error Supabase (${checkRes.status}): ${errText.slice(0, 150)}`
        });
      }
    }

    return res.status(400).json({ error: 'Acción o motor no reconocido' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
