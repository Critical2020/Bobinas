/**
 * Robust CSV parser implementing RFC-4180
 * Correctly handles fields enclosed in double quotes containing commas, newlines, and escaped quotes ("")
 */
export function parseCSV(csvText) {
  const rows = [];
  let currentRow = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"';
        i++; // skip next quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip LF after CR
      }
      currentRow.push(currentField.trim());
      currentField = '';
      if (currentRow.some(col => col.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
    } else {
      currentField += char;
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some(col => col.length > 0)) {
      rows.push(currentRow);
    }
  }

  if (rows.length < 2) {
    throw new Error('El archivo CSV debe contener al menos la cabecera y 1 fila de datos.');
  }

  const headers = rows[0].map(h => h.trim().replace(/^"|"$/g, ''));
  const records = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = row[idx] !== undefined ? row[idx] : '';
    });
    records.push(obj);
  }

  return records;
}

/**
 * Exports database items to CSV string format
 */
export function exportToCSV(items) {
  const headers = ['id', 'name', 'brand', 'carModel', 'engine', 'oem', 'type', 'connector', 'price', 'oldPrice', 'stock', 'warranty', 'badge'];
  
  const escapeField = val => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerRow = headers.join(',');
  const dataRows = items.map(item => headers.map(h => escapeField(item[h])).join(','));
  
  return [headerRow, ...dataRows].join('\n');
}

/**
 * Exports database items to SQL statements
 */
export function exportToSQL(items) {
  const safe = str => String(str ?? '').replace(/'/g, "''");
  const inserts = items.map(b => 
    `INSERT INTO bobinas_inventario (id, name, brand, car_model, engine, oem, type, connector, price, old_price, stock, warranty, badge) VALUES ('${safe(b.id)}', '${safe(b.name)}', '${safe(b.brand)}', '${safe(b.carModel)}', '${safe(b.engine)}', '${safe(b.oem)}', '${safe(b.type)}', '${safe(b.connector)}', ${Number(b.price).toFixed(2)}, ${Number(b.oldPrice || b.price * 1.2).toFixed(2)}, ${b.stock}, '${safe(b.warranty)}', '${safe(b.badge)}');`
  ).join('\n');

  return `-- ========================================================\n-- DUMP SQL GENERADO POR BOBINAS EXPRESS\n-- Fecha: ${new Date().toISOString()}\n-- Total bobinas: ${items.length}\n-- ========================================================\n\n${inserts}`;
}

/**
 * Triggers browser file download
 */
export function downloadFile(content, fileName, mimeType = 'text/plain;charset=utf-8;') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
