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
  latitude?: number | null;
  longitude?: number | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  full_address?: string | null;
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

export interface PlateFilters {
  name?: string;
  state?: string;
  country?: string;
  external_id?: string;
  years_available?: string;
  available?: boolean | 'all';
  base?: boolean | 'all';
  embossed?: boolean | 'all';
  county?: boolean | 'all';
  tags?: string;
  notes?: string;
  text?: string;
  colors?: string[];  // Array of selected colors (all_colors + primary_background_colors)
  primary_background_color?: string;  // Single background color
  pattern_font?: string;  // Number font
  state_font?: string;
  pattern_color?: string;  // Number color
  state_color?: string;
}

export const searchPlatesAdvanced = async (filters: PlateFilters): Promise<Plate[]> => {
  const where: string[] = [];
  const params: any[] = [];

  // Text-based filters (partial match)
  // Name filter: fuzzy search - each word must appear in the name
  if (filters.name?.trim()) {
    const words = filters.name.trim().split(/\s+/).filter(w => w.length > 0);
    if (words.length > 0) {
      const nameConditions = words.map(() => 'LOWER(name) LIKE LOWER(?)').join(' AND ');
      where.push(`(${nameConditions})`);
      words.forEach(word => {
        params.push(`%${word}%`);
      });
    }
  }
  if (filters.state?.trim()) {
    where.push('LOWER(state) LIKE LOWER(?)');
    params.push(`%${filters.state.trim()}%`);
  }
  if (filters.country?.trim()) {
    where.push('LOWER(country) LIKE LOWER(?)');
    params.push(`%${filters.country.trim()}%`);
  }
  if (filters.external_id?.trim()) {
    where.push('LOWER(external_id) LIKE LOWER(?)');
    params.push(`%${filters.external_id.trim()}%`);
  }
  if (filters.years_available?.trim()) {
    where.push('years_available LIKE ?');
    params.push(`%${filters.years_available.trim()}%`);
  }
  if (filters.tags?.trim()) {
    where.push('LOWER(tags) LIKE LOWER(?)');
    params.push(`%${filters.tags.trim()}%`);
  }
  if (filters.notes?.trim()) {
    where.push('LOWER(notes) LIKE LOWER(?)');
    params.push(`%${filters.notes.trim()}%`);
  }
  if (filters.text?.trim()) {
    where.push('LOWER(text) LIKE LOWER(?)');
    params.push(`%${filters.text.trim()}%`);
  }
  
  // Color filters - search in both all_colors and primary_background_colors
  if (filters.colors && filters.colors.length > 0) {
    const colorConditions = filters.colors.map(() => 
      '(LOWER(all_colors) LIKE LOWER(?) OR LOWER(primary_background_colors) LIKE LOWER(?))'
    ).join(' OR ');
    where.push(`(${colorConditions})`);
    filters.colors.forEach(color => {
      params.push(`%${color}%`, `%${color}%`);
    });
  }
  
  // Specific filters for plate properties
  if (filters.primary_background_color?.trim()) {
    where.push('LOWER(primary_background_colors) LIKE LOWER(?)');
    params.push(`%${filters.primary_background_color.trim()}%`);
  }
  if (filters.pattern_font?.trim()) {
    where.push('LOWER(pattern_font) LIKE LOWER(?)');
    params.push(`%${filters.pattern_font.trim()}%`);
  }
  if (filters.state_font?.trim()) {
    where.push('LOWER(state_font) LIKE LOWER(?)');
    params.push(`%${filters.state_font.trim()}%`);
  }
  if (filters.pattern_color?.trim()) {
    where.push('LOWER(pattern_color) LIKE LOWER(?)');
    params.push(`%${filters.pattern_color.trim()}%`);
  }
  if (filters.state_color?.trim()) {
    where.push('LOWER(state_color) LIKE LOWER(?)');
    params.push(`%${filters.state_color.trim()}%`);
  }

  // Boolean filters
  if (filters.available !== undefined && filters.available !== 'all') {
    where.push('available = ?');
    params.push(filters.available ? 1 : 0);
  }
  if (filters.base !== undefined && filters.base !== 'all') {
    where.push('base = ?');
    params.push(filters.base ? 1 : 0);
  }
  if (filters.embossed !== undefined && filters.embossed !== 'all') {
    where.push('embossed = ?');
    params.push(filters.embossed ? 1 : 0);
  }
  if (filters.county !== undefined && filters.county !== 'all') {
    where.push('county = ?');
    params.push(filters.county ? 1 : 0);
  }

  const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const res = await executeSql(
    `SELECT * FROM LicensePlate 
     ${whereSql}
     ORDER BY name COLLATE NOCASE
     LIMIT 200;`,
    params
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

export const getSightingById = async (sighting_id: number): Promise<Sighting | null> => {
  const res = await executeSql('SELECT * FROM Sighting WHERE sighting_id=?;', [sighting_id]);
  if (res.rows.length === 0) return null;
  return res.rows.item(0);
};

export const getSightingsByPlate = async (plate_id: number): Promise<Sighting[]> => {
  const res = await executeSql('SELECT * FROM Sighting WHERE plate_id=? ORDER BY time DESC;', [plate_id]);
  const rows: Sighting[] = [];
  for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
  return rows;
};

export const addSighting = async (sighting: Sighting): Promise<Sighting> => {
  const res = await executeSql(
    `INSERT INTO Sighting (plate_id, external_id, location, time, notes, image_uri, trip, latitude, longitude, city, state, country, full_address) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?);`,
    [
      sighting.plate_id,
      sighting.external_id,
      sighting.location,
      sighting.time,
      sighting.notes,
      sighting.image_uri,
      sighting.trip ?? null,
      sighting.latitude ?? null,
      sighting.longitude ?? null,
      sighting.city ?? null,
      sighting.state ?? null,
      sighting.country ?? null,
      sighting.full_address ?? null,
    ],
  );
  return { ...sighting, sighting_id: res.insertId };
};

export const updateSighting = async (sighting: Sighting): Promise<void> => {
  await executeSql(
    `UPDATE Sighting SET plate_id=?, external_id=?, location=?, time=?, notes=?, image_uri=?, trip=?, latitude=?, longitude=?, city=?, state=?, country=?, full_address=? WHERE sighting_id=?;`,
    [
      sighting.plate_id,
      sighting.external_id,
      sighting.location,
      sighting.time,
      sighting.notes,
      sighting.image_uri,
      sighting.trip ?? null,
      sighting.latitude ?? null,
      sighting.longitude ?? null,
      sighting.city ?? null,
      sighting.state ?? null,
      sighting.country ?? null,
      sighting.full_address ?? null,
      sighting.sighting_id,
    ],
  );
};

export const deleteSighting = async (sighting_id: number): Promise<void> => {
  await executeSql('DELETE FROM Sighting WHERE sighting_id=?;', [sighting_id]);
};

export interface SightingsFilter {
  month?: string;
  year?: string;
  state?: string;
  country?: string;
  location?: string;
}

export type SightingListItem = Sighting & {
  plate_name?: string;
  plate_state?: string;
  plate_country?: string;
};

export const getSightingsPaged = async (params: { filters?: SightingsFilter; limit: number; offset: number }): Promise<SightingListItem[]> => {
  const where: string[] = [];
  const sqlParams: any[] = [];
  const f = params.filters || {};
  
  // Month and year filtering
  // time format is typically "MM-DD-YYYY HH:MM" or similar
  if (f.month && f.year) {
    // Match both month and year - time should start with "MM-" and contain the year
    const monthPadded = f.month.padStart(2, '0');
    where.push('(SUBSTR(s.time, 1, 2) = ? AND s.time LIKE ?)');
    sqlParams.push(monthPadded, `%${f.year}%`);
  } else if (f.month && !f.year) {
    // Match only month - time should start with "MM-"
    const monthPadded = f.month.padStart(2, '0');
    where.push('SUBSTR(s.time, 1, 2) = ?');
    sqlParams.push(monthPadded);
  } else if (f.year && !f.month) {
    // Match only year
    where.push('s.time LIKE ?');
    sqlParams.push(`%${f.year}%`);
  }
  
  // State and country filtering (partial match on plate state/country)
  if (f.state) { 
    where.push('LOWER(p.state) LIKE LOWER(?)'); 
    sqlParams.push(`%${f.state}%`); 
  }
  if (f.country) { 
    where.push('LOWER(p.country) LIKE LOWER(?)'); 
    sqlParams.push(`%${f.country}%`); 
  }
  
  // Location filtering (partial match)
  if (f.location) { 
    where.push('(LOWER(s.location) LIKE LOWER(?) OR LOWER(s.city) LIKE LOWER(?) OR LOWER(s.state) LIKE LOWER(?) OR LOWER(s.country) LIKE LOWER(?))'); 
    const locationParam = `%${f.location}%`;
    sqlParams.push(locationParam, locationParam, locationParam, locationParam);
  }
  
  const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const res = await executeSql(
    `SELECT s.*, p.name as plate_name, p.state as plate_state, p.country as plate_country
     FROM Sighting s
     JOIN LicensePlate p ON p.plate_id = s.plate_id
     ${whereSql}
     ORDER BY s.time DESC, s.sighting_id DESC
     LIMIT ? OFFSET ?;`,
    [...sqlParams, params.limit, params.offset]
  );
  const rows: SightingListItem[] = [];
  for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
  return rows;
};

export const countSightings = async (filters?: SightingsFilter): Promise<number> => {
  const where: string[] = [];
  const params: any[] = [];
  const f = filters || {};
  
  // Month and year filtering
  if (f.month && f.year) {
    const monthPadded = f.month.padStart(2, '0');
    where.push('(SUBSTR(s.time, 1, 2) = ? AND s.time LIKE ?)');
    params.push(monthPadded, `%${f.year}%`);
  } else if (f.month && !f.year) {
    const monthPadded = f.month.padStart(2, '0');
    where.push('SUBSTR(s.time, 1, 2) = ?');
    params.push(monthPadded);
  } else if (f.year && !f.month) {
    where.push('s.time LIKE ?');
    params.push(`%${f.year}%`);
  }
  
  // State and country filtering (partial match)
  if (f.state) { 
    where.push('LOWER(p.state) LIKE LOWER(?)'); 
    params.push(`%${f.state}%`); 
  }
  if (f.country) { 
    where.push('LOWER(p.country) LIKE LOWER(?)'); 
    params.push(`%${f.country}%`); 
  }
  
  // Location filtering (partial match)
  if (f.location) { 
    where.push('(LOWER(s.location) LIKE LOWER(?) OR LOWER(s.city) LIKE LOWER(?) OR LOWER(s.state) LIKE LOWER(?) OR LOWER(s.country) LIKE LOWER(?))'); 
    const locationParam = `%${f.location}%`;
    params.push(locationParam, locationParam, locationParam, locationParam);
  }
  
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