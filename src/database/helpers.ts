import { executeSql } from './db';

// Types
export interface Plate {
  plate_id?: number;
  external_id?: string;
  state?: string;
  country?: string;
  name?: string;
  years_available?: string;
  available?: boolean;   // maps to "available" INTEGER
  base?: boolean;
  embossed?: boolean;
  pattern_font?: string;   // maps to "pattern_font"
  pattern_color?: string; // maps to "pattern_color"
  state_font?: string;
  state_color?: string;
  state_location?: string;
  primary_background_colors?: string;
  all_colors?: string;
  background_description?: string; // maps to "background_description"
  county?: boolean;
  url?: boolean;
  text?: string;
  tags?: string;   // maps to "tags"
  additional_description?: string; // maps to "additional_description"
  notes?: string;
}

export interface Pattern {
  pattern_id?: number;
  plate_id: number;
  external_id?: string;
  serial_id?: number;
  unique_id?: number;
  pattern: string;
  seperator?: string;
  type?: string;
  series_years?: string;
}

export interface Sighting {
  sighting_id?: number;
  plate_id: number;
  external_id?: string;
  location?: string;
  time?: string;
  notes?: string;
  image_uri?: string;
  trip?: string | null;
}

//--------------------------Plates----------------------------

export const getAllPlates = async (): Promise<Plate[]> => {
  const res = await executeSql('SELECT * FROM LicensePlate ORDER BY name COLLATE NOCASE;');
  const rows: Plate[] = [];
  for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
  return rows;
};

export const searchPlates = async (query: string): Promise<Plate[]> => {
  const q = `%${(query || '').trim()}%`;
  const res = await executeSql(
    `SELECT * FROM LicensePlate 
     WHERE name LIKE ? OR state LIKE ? OR notes LIKE ? OR external_id LIKE ?
     ORDER BY name COLLATE NOCASE
     LIMIT 100;`,
    [q, q, q, q]
  );
  const rows: Plate[] = [];
  for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
  return rows;
};

// Test function to verify database is working
export const testDatabase = async (): Promise<boolean> => {
  try {
    console.log('Testing database connection...');
    const result = await executeSql('SELECT 1 as test;');
    console.log('Database connection test successful');
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
};

export const addPlate = async (p: Plate): Promise<Plate> => {
  // Test database connection first
  const dbWorking = await testDatabase();
  if (!dbWorking) {
    throw new Error('Database connection failed');
  }

  // Auto-generate external_id if missing (format: Country-State-id)
  // For bulk import, external_id should be provided in CSV
  // For Add Plate screen, external_id is auto-generated
  let externalId = (p.external_id || '').trim();
  if (!externalId) {
    const country = (p.country || 'Unknown').toString().trim();
    const state = (p.state || 'Unknown').toString().trim();
    
    try {
      // Count existing plates for this country-state combination
    const countRes = await executeSql(
        'SELECT COUNT(*) as cnt FROM LicensePlate WHERE country = ? AND state = ?;',
        [country, state]
    );
    const baseCount = countRes.rows.item(0).cnt as number;
    let attempt = baseCount + 1;

      // Generate external_id in format "Country-State-id"
    for (let i = 0; i < 10000; i++) {
        const candidate = `${country}-${state}-${attempt}`;
      const existsRes = await executeSql(
        'SELECT 1 FROM LicensePlate WHERE external_id = ? LIMIT 1;',
        [candidate]
      );
      if (existsRes.rows.length === 0) {
        externalId = candidate;
        break;
      }
      attempt += 1;
    }

    if (!externalId) {
        externalId = `${country}-${state}-${Date.now()}`;
      }
    } catch (error) {
      console.warn('Error counting existing plates, using timestamp-based ID:', error);
      externalId = `${country}-${state}-${Date.now()}`;
    }
  }

  // Validate and sanitize data before insertion
  // Convert empty strings to null to avoid SQL issues
  const sanitizeValue = (value: any): string | null => {
    if (value === null || value === undefined) return null;
    const trimmed = value.toString().trim();
    return trimmed === '' ? null : trimmed;
  };

  const sanitizedPlate = {
    external_id: externalId,
    state: sanitizeValue(p.state),
    country: sanitizeValue(p.country),
    name: sanitizeValue(p.name),
    years_available: sanitizeValue(p.years_available),
    available: p.available ? 1 : 0,
    base: p.base ? 1 : 0,
    embossed: p.embossed ? 1 : 0,
    pattern_font: sanitizeValue(p.pattern_font),
    pattern_color: sanitizeValue(p.pattern_color),
    state_font: sanitizeValue(p.state_font),
    state_color: sanitizeValue(p.state_color),
    state_location: sanitizeValue(p.state_location),
    primary_background_colors: sanitizeValue(p.primary_background_colors),
    all_colors: sanitizeValue(p.all_colors),
    background_description: sanitizeValue(p.background_description),
    county: p.county ? 1 : 0,
    url: p.url ? 1 : 0,
    text: sanitizeValue(p.text),
    tags: sanitizeValue(p.tags),
    additional_description: sanitizeValue(p.additional_description),
    notes: sanitizeValue(p.notes),
  };

  try {
    const columns = [
      'external_id', 'state', 'country', 'name', 'years_available', 'available', 'base', 'embossed',
      'pattern_font', 'pattern_color', 'state_font', 'state_color', 'state_location',
      'primary_background_colors', 'all_colors', 'background_description',
      'county', 'url', 'text', 'tags', 'additional_description', 'notes'
    ];
    
    const values = [
      sanitizedPlate.external_id, sanitizedPlate.state, sanitizedPlate.country, sanitizedPlate.name, sanitizedPlate.years_available,
      sanitizedPlate.available, sanitizedPlate.base, sanitizedPlate.embossed,
      sanitizedPlate.pattern_font, sanitizedPlate.pattern_color, sanitizedPlate.state_font, sanitizedPlate.state_color, sanitizedPlate.state_location,
      sanitizedPlate.primary_background_colors, sanitizedPlate.all_colors, sanitizedPlate.background_description,
      sanitizedPlate.county, sanitizedPlate.url, sanitizedPlate.text, sanitizedPlate.tags,
      sanitizedPlate.additional_description, sanitizedPlate.notes,
    ];
    
    const placeholders = values.map(() => '?').join(', ');
    const columnNames = columns.join(', ');
    
    const sqlQuery = `INSERT INTO LicensePlate (${columnNames}) VALUES (${placeholders});`;
    
    console.log('SQL Query:', sqlQuery);
    console.log('Values count:', values.length);
    console.log('Values:', values);
    
    const res = await executeSql(sqlQuery, values);
  return { ...p, plate_id: res.insertId, external_id: externalId };
  } catch (error) {
    console.error('Error inserting plate:', error);
    console.error('Sanitized plate data:', sanitizedPlate);
    
    try {
      const tableInfo = await executeSql('PRAGMA table_info(LicensePlate);');
      console.log('Table structure:');
      for (let i = 0; i < tableInfo.rows.length; i++) {
        const row = tableInfo.rows.item(i);
        console.log(`  ${row.name}: ${row.type}`);
      }
    } catch (tableError) {
      console.error('Error getting table info:', tableError);
    }
    
    throw error;
  }
};

export const updatePlate = async (p: Plate): Promise<void> => {
  // Use the same sanitization function
  const sanitizeValue = (value: any): string | null => {
    if (value === null || value === undefined) return null;
    const trimmed = value.toString().trim();
    return trimmed === '' ? null : trimmed;
  };

  await executeSql(
    `UPDATE LicensePlate SET
      state=?, country=?, name=?, years_available=?, available=?, base=?, embossed=?,
      pattern_font=?, pattern_color=?, state_font=?, state_color=?, state_location=?,
      primary_background_colors=?, all_colors=?, background_description=?,
      county=?, url=?, text=?, tags=?, additional_description=?, notes=?
     WHERE plate_id=?;`,
    [
      sanitizeValue(p.state), sanitizeValue(p.country), sanitizeValue(p.name), sanitizeValue(p.years_available),
      p.available ? 1 : 0, p.base ? 1 : 0, p.embossed ? 1 : 0,
      sanitizeValue(p.pattern_font), sanitizeValue(p.pattern_color), sanitizeValue(p.state_font), sanitizeValue(p.state_color), sanitizeValue(p.state_location),
      sanitizeValue(p.primary_background_colors), sanitizeValue(p.all_colors), sanitizeValue(p.background_description),
      p.county ? 1 : 0, p.url ? 1 : 0, sanitizeValue(p.text), sanitizeValue(p.tags),
      sanitizeValue(p.additional_description), sanitizeValue(p.notes), p.plate_id,
    ],
  );
};

export const deletePlate = async (plate_id: number): Promise<void> => {
  await executeSql('DELETE FROM LicensePlate WHERE plate_id=?;', [plate_id]);
};
// -------------------- Patterns ----------------------------------------

export const getPatternsByPlate = async (plate_id: number): Promise<Pattern[]> => {
  const res = await executeSql('SELECT * FROM SerialPattern WHERE plate_id=?;', [plate_id]);
  const rows: Pattern[] = [];
  for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
  return rows;
};

export const addPattern = async (pattern: Pattern): Promise<Pattern> => {
  const res = await executeSql(
    `INSERT INTO SerialPattern (plate_id, external_id, serial_id, unique_id, pattern, seperator, type, series_years) VALUES (?,?,?,?,?,?,?,?);`,
    [pattern.plate_id, pattern.external_id, pattern.serial_id, pattern.unique_id, pattern.pattern, pattern.seperator, pattern.type, pattern.series_years],
  );
  return { ...pattern, pattern_id: res.insertId };
};

export const updatePattern = async (pattern: Pattern): Promise<void> => {
  await executeSql(
    `UPDATE SerialPattern SET pattern=?, seperator=?, type=?, series_years=? WHERE pattern_id=?;`,
    [pattern.pattern, pattern.seperator, pattern.type, pattern.series_years, pattern.pattern_id],
  );
};

export const deletePattern = async (pattern_id: number): Promise<void> => {
  await executeSql('DELETE FROM SerialPattern WHERE pattern_id=?;', [pattern_id]);
};

// -------------------- Sightings -------------------------------------------------

export const getSightingsByPlate = async (plate_id: number): Promise<Sighting[]> => {
  const res = await executeSql('SELECT * FROM Sighting WHERE plate_id=? ORDER BY time DESC;', [plate_id]);
  const rows: Sighting[] = [];
  for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
  return rows;
};

export const addSighting = async (sighting: Sighting): Promise<Sighting> => {
  const res = await executeSql(
    `INSERT INTO Sighting (plate_id, external_id, location, time, notes, image_uri, trip) VALUES (?,?,?,?,?,?,?);`,
    [
      sighting.plate_id,
      sighting.external_id,
      sighting.location,
      sighting.time,
      sighting.notes,
      sighting.image_uri,
      sighting.trip ?? null,
    ],
  );
  return { ...sighting, sighting_id: res.insertId };
};

export const updateSighting = async (sighting: Sighting): Promise<void> => {
  await executeSql(
    `UPDATE Sighting SET external_id=?, location=?, time=?, notes=?, image_uri=?, trip=? WHERE sighting_id=?;`,
    [
      sighting.external_id,
      sighting.location,
      sighting.time,
      sighting.notes,
      sighting.image_uri,
      sighting.trip ?? null,
      sighting.sighting_id,
    ],
  );
};

export const deleteSighting = async (sighting_id: number): Promise<void> => {
  await executeSql('DELETE FROM Sighting WHERE sighting_id=?;', [sighting_id]);
};

export interface SightingsFilter {
  dateFrom?: string | null;
  dateTo?: string | null;
  state?: string | null;
  country?: string | null;
  limit: number;
  offset: number;
}

export type SightingListItem = Sighting & {
  plate_name?: string;
  plate_state?: string;
  plate_country?: string;
};

export const getSightingsPaged = async (f: SightingsFilter): Promise<SightingListItem[]> => {
  const where: string[] = [];
  const params: any[] = [];
  if (f.dateFrom) { where.push('s.time >= ?'); params.push(f.dateFrom); }
  if (f.dateTo) { where.push('s.time <= ?'); params.push(f.dateTo); }
  if (f.state) { where.push('p.state = ?'); params.push(f.state); }
  if (f.country) { where.push('p.country = ?'); params.push(f.country); }
  const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const res = await executeSql(
    `SELECT s.*, p.name as plate_name, p.state as plate_state, p.country as plate_country
     FROM Sighting s
     JOIN LicensePlate p ON p.plate_id = s.plate_id
     ${whereSql}
     ORDER BY s.time DESC, s.sighting_id DESC
     LIMIT ? OFFSET ?;`,
    [...params, f.limit, f.offset]
  );
  const rows: SightingListItem[] = [];
  for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
  return rows;
};

export const countSightings = async (f: Omit<SightingsFilter,'limit'|'offset'>): Promise<number> => {
  const where: string[] = [];
  const params: any[] = [];
  if (f.dateFrom) { where.push('s.time >= ?'); params.push(f.dateFrom); }
  if (f.dateTo) { where.push('s.time <= ?'); params.push(f.dateTo); }
  if (f.state) { where.push('p.state = ?'); params.push(f.state); }
  if (f.country) { where.push('p.country = ?'); params.push(f.country); }
  const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const res = await executeSql(
    `SELECT COUNT(*) as cnt
     FROM Sighting s
     JOIN LicensePlate p ON p.plate_id = s.plate_id
     ${whereSql};`,
    params
  );
  return res.rows.item(0).cnt as number;
};

// -------------------- Trip names -------------------

export const getAllTripNames = async (): Promise<string[]> => {
  const res = await executeSql(
    `SELECT DISTINCT TRIM(trip) as trip
     FROM Sighting
     WHERE trip IS NOT NULL AND TRIM(trip) <> ''
     ORDER BY LOWER(trip);`
  );
  const names: string[] = [];
  for (let i = 0; i < res.rows.length; i++) names.push(res.rows.item(i).trip as string);
  return names;
};

export const addTripName = async (name: string): Promise<void> => {
  const trimmed = (name || '').trim();
  if (!trimmed) return;
  await executeSql(`INSERT OR IGNORE INTO TripName(name) VALUES (?);`, [trimmed]);
};

export const getTripNames = async (): Promise<string[]> => {
  const res = await executeSql(`SELECT name FROM TripName ORDER BY LOWER(name);`);
  const out: string[] = [];
  for (let i = 0; i < res.rows.length; i++) out.push(res.rows.item(i).name as string);
  return out;
};