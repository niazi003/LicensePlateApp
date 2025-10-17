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
  county_name?: string;
  url?: boolean;
  text?: string;
  tags?: string;   // maps to "tags"
  additional_description?: string; // maps to "additional_description"
  notes?: string;
  image_uri?: string;
}

export interface Pattern {
  pattern_id?: number;
  plate_id: number;
  external_id?: string;
  serial_id?: string;
  unique_id?: string;
  pattern: string;
  separator?: string;
  type?: string;
  series_years?: string;
}

export interface Sighting {
  sighting_id?: number;
  plate_id: number;
  pattern_id?: number | null;
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
  universalSearch?: string;  // Searches across multiple string fields with OR logic
  name?: string;
  state?: string;
  country?: string;
  external_id?: string;
  years_available?: string;
  available?: boolean | 'all';
  base?: boolean | 'all';
  embossed?: boolean | 'all';
  county?: boolean | 'all';
  tags?: string[];  // Array of selected tags for multi-tag search
  notes?: string;
  text?: string;
  colors?: string[];  // Array of selected colors (all_colors + primary_background_colors)
  primary_background_colors?: string[];  // Array of background colors
  pattern_font?: string;  // Number font
  state_font?: string;
  pattern_colors?: string[];  // Array of pattern colors
  state_colors?: string[];  // Array of state colors
  // Pattern filters
  pattern_text?: string;  // Search pattern text (exact match by default, use * for partial: *[T/R]*)
  pattern_type?: string;  // Search pattern type (e.g., Passenger, Truck)
  pattern_separator?: string;  // Search pattern separator
  trip?: string;  // Filter plates that have sightings from this trip
}

export const searchPlatesAdvanced = async (filters: PlateFilters): Promise<Plate[]> => {
  const where: string[] = [];
  const params: any[] = [];

  // Universal search - fuzzy search across multiple string fields with OR logic
  // Each word can match any of the searchable fields
  if (filters.universalSearch?.trim()) {
    const words = filters.universalSearch.trim().split(/\s+/).filter(w => w.length > 0);
    if (words.length > 0) {
      // For each word, create conditions that check if it appears in any field
      const wordConditions = words.map(() => {
        const fieldConditions = [
          'LOWER(name) LIKE LOWER(?)',
          'LOWER(state) LIKE LOWER(?)',
          'LOWER(country) LIKE LOWER(?)',
          'LOWER(external_id) LIKE LOWER(?)',
          'LOWER(tags) LIKE LOWER(?)',
          'LOWER(notes) LIKE LOWER(?)',
          'LOWER(text) LIKE LOWER(?)',
        ];
        return `(${fieldConditions.join(' OR ')})`;
      });
      
      // All words must match (AND), but each word can match any field (OR)
      where.push(`(${wordConditions.join(' AND ')})`);
      
      // Add parameters: for each word, add it once for each field condition
      words.forEach(word => {
        const wildcardWord = `%${word}%`;
        // 7 fields = 7 parameters per word
        params.push(wildcardWord, wildcardWord, wildcardWord, wildcardWord, wildcardWord, wildcardWord, wildcardWord);
      });
    }
  }

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
  // Tag filters - multi-select using PlateTag table
  if (filters.tags && filters.tags.length > 0) {
    const tagConditions = filters.tags.map(() => 
      'EXISTS (SELECT 1 FROM PlateTag pt WHERE pt.plate_id = LicensePlate.plate_id AND LOWER(pt.tag_name) = LOWER(?))'
    ).join(' AND ');
    where.push(`(${tagConditions})`);
    filters.tags.forEach(tag => {
      params.push(tag.trim());
    });
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
  
  // Background color filters - multi-select
  if (filters.primary_background_colors && filters.primary_background_colors.length > 0) {
    const bgColorConditions = filters.primary_background_colors.map(() => 
      'LOWER(primary_background_colors) LIKE LOWER(?)'
    ).join(' OR ');
    where.push(`(${bgColorConditions})`);
    filters.primary_background_colors.forEach(color => {
      params.push(`%${color}%`);
    });
  }
  if (filters.pattern_font?.trim()) {
    where.push('LOWER(pattern_font) LIKE LOWER(?)');
    params.push(`%${filters.pattern_font.trim()}%`);
  }
  if (filters.state_font?.trim()) {
    where.push('LOWER(state_font) LIKE LOWER(?)');
    params.push(`%${filters.state_font.trim()}%`);
  }
  // Pattern color filters - multi-select
  if (filters.pattern_colors && filters.pattern_colors.length > 0) {
    const patternColorConditions = filters.pattern_colors.map(() => 
      'LOWER(pattern_color) LIKE LOWER(?)'
    ).join(' OR ');
    where.push(`(${patternColorConditions})`);
    filters.pattern_colors.forEach(color => {
      params.push(`%${color}%`);
    });
  }
  // State color filters - multi-select
  if (filters.state_colors && filters.state_colors.length > 0) {
    const stateColorConditions = filters.state_colors.map(() => 
      'LOWER(state_color) LIKE LOWER(?)'
    ).join(' OR ');
    where.push(`(${stateColorConditions})`);
    filters.state_colors.forEach(color => {
      params.push(`%${color}%`);
    });
  }

  // Pattern filters - join with SerialPattern table
  if (filters.pattern_text?.trim() || filters.pattern_type?.trim() || 
      filters.pattern_separator?.trim()) {
    // Add pattern filter conditions
    const patternConditions: string[] = [];
    
    if (filters.pattern_text?.trim()) {
      const patternText = filters.pattern_text.trim();

      let sqlPattern = patternText;
      const isActual = (patternText.indexOf('a') === -1) &&
                       (patternText.indexOf('#') === -1) &&
                       (patternText.indexOf('?') === -1);

      if (isActual) {
        sqlPattern = sqlPattern.replace(/[A-Z]/g,'a').replace(/[0-9]/g, '#');
      }

      var replaceMap : { [key: string]: any } = {
        '[':'\\[',
        ']':'\\]',
        '*':'.*',
        '?':'[A-Za0-9#?]',
        a:'[A-Za?]',
        '#':'[0-9#?]',
      };

      sqlPattern = '^' + sqlPattern.replace(/\[|\]|\*|\?|a|#/g, function(matched) {
        return replaceMap[matched];
      }) + '$';
      patternConditions.push('LOWER(sp.pattern) REGEXP LOWER(?)');
      params.push(sqlPattern);
    }
    if (filters.pattern_type?.trim()) {
      patternConditions.push('LOWER(sp.type) LIKE LOWER(?)');
      params.push(`%${filters.pattern_type.trim()}%`);
    }
    if (filters.pattern_separator?.trim()) {
      patternConditions.push('LOWER(sp.separator) LIKE LOWER(?)');
      params.push(`%${filters.pattern_separator.trim()}%`);
    }
    
    if (patternConditions.length > 0) {
      where.push(`EXISTS (
        SELECT 1 FROM SerialPattern sp 
        WHERE sp.plate_id = LicensePlate.plate_id 
        AND ${patternConditions.join(' AND ')}
      )`);
    }
  }

  // Trip filter - find plates that have sightings from this trip
  if (filters.trip?.trim()) {
    where.push(`EXISTS (
      SELECT 1 FROM Sighting s 
      WHERE s.plate_id = LicensePlate.plate_id 
      AND LOWER(s.trip) LIKE LOWER(?)
    )`);
    params.push(`%${filters.trip.trim()}%`);
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
    await executeSql('SELECT 1 as test;');
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
    county_name: sanitizeValue(p.county_name),
    url: p.url ? 1 : 0,
    text: sanitizeValue(p.text),
    tags: sanitizeValue(p.tags),
    additional_description: sanitizeValue(p.additional_description),
    notes: sanitizeValue(p.notes),
    image_uri: sanitizeValue(p.image_uri),
  };

  try {
    const columns = [
      'external_id', 'state', 'country', 'name', 'years_available', 'available', 'base', 'embossed',
      'pattern_font', 'pattern_color', 'state_font', 'state_color', 'state_location',
      'primary_background_colors', 'all_colors', 'background_description',
      'county', 'url', 'text', 'tags', 'additional_description', 'notes', 'image_uri'
    ];
    
    const values = [
      sanitizedPlate.external_id, sanitizedPlate.state, sanitizedPlate.country, sanitizedPlate.name, sanitizedPlate.years_available,
      sanitizedPlate.available, sanitizedPlate.base, sanitizedPlate.embossed,
      sanitizedPlate.pattern_font, sanitizedPlate.pattern_color, sanitizedPlate.state_font, sanitizedPlate.state_color, sanitizedPlate.state_location,
      sanitizedPlate.primary_background_colors, sanitizedPlate.all_colors, sanitizedPlate.background_description,
      sanitizedPlate.county, sanitizedPlate.url, sanitizedPlate.text, sanitizedPlate.tags,
      sanitizedPlate.additional_description, sanitizedPlate.notes, sanitizedPlate.image_uri,
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
      county=?, county_name=?, url=?, text=?, tags=?, additional_description=?, notes=?, image_uri=?
     WHERE plate_id=?;`,
    [
      sanitizeValue(p.state), sanitizeValue(p.country), sanitizeValue(p.name), sanitizeValue(p.years_available),
      p.available ? 1 : 0, p.base ? 1 : 0, p.embossed ? 1 : 0,
      sanitizeValue(p.pattern_font), sanitizeValue(p.pattern_color), sanitizeValue(p.state_font), sanitizeValue(p.state_color), sanitizeValue(p.state_location),
      sanitizeValue(p.primary_background_colors), sanitizeValue(p.all_colors), sanitizeValue(p.background_description),
      p.county ? 1 : 0, sanitizeValue(p.county_name), p.url ? 1 : 0, sanitizeValue(p.text), sanitizeValue(p.tags),
      sanitizeValue(p.additional_description), sanitizeValue(p.notes), sanitizeValue(p.image_uri), p.plate_id,
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
  try {
    // If unique_id is not provided, generate it safely
    let uniqueId = pattern.unique_id;
    if (!uniqueId && pattern.plate_id && pattern.serial_id) {
      uniqueId = await generateUniqueIdSafe(pattern.plate_id, pattern.serial_id);
    }

    const res = await executeSql(
      `INSERT INTO SerialPattern (plate_id, external_id, serial_id, unique_id, pattern, separator, type, series_years) VALUES (?,?,?,?,?,?,?,?);`,
      [pattern.plate_id, pattern.external_id, pattern.serial_id, uniqueId, pattern.pattern, pattern.separator, pattern.type, pattern.series_years],
    );
    return { ...pattern, pattern_id: res.insertId, unique_id: uniqueId };
  } catch (error: any) {
    // Check if it's a unique constraint violation
    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      console.error('Unique constraint violation when adding pattern:', error.message);
      throw new Error(`Pattern with this unique ID already exists. Please try again or contact support if the issue persists.`);
    }
    // Re-throw other errors
    throw error;
  }
};

export const updatePattern = async (pattern: Pattern): Promise<void> => {
  await executeSql(
    `UPDATE SerialPattern SET external_id=?, serial_id=?, unique_id=?, pattern=?, separator=?, type=?, series_years=? WHERE pattern_id=?;`,
    [pattern.external_id, pattern.serial_id, pattern.unique_id, pattern.pattern, pattern.separator, pattern.type, pattern.series_years, pattern.pattern_id],
  );
};

export const deletePattern = async (pattern_id: number): Promise<void> => {
  await executeSql('DELETE FROM SerialPattern WHERE pattern_id=?;', [pattern_id]);
};

// Helper function to get next serial_id for a plate
export const getNextSerialId = async (plate_id: number): Promise<string> => {
  const res = await executeSql(
    'SELECT MAX(CAST(serial_id AS INTEGER)) as max_serial FROM SerialPattern WHERE plate_id = ?;',
    [plate_id]
  );
  const maxSerial = res.rows.item(0).max_serial;
  // If no patterns exist, maxSerial will be null, so start with 1
  return maxSerial ? (maxSerial + 1).toString() : '1';
};

// Helper function to generate unique_id from plate's external_id and serial_id
export const generateUniqueId = async (plate_id: number, serial_id: string): Promise<string> => {
  const plateRes = await executeSql(
    'SELECT external_id FROM LicensePlate WHERE plate_id = ? LIMIT 1;',
    [plate_id]
  );
  if (plateRes.rows.length === 0) {
    throw new Error('Plate not found');
  }
  const external_id = plateRes.rows.item(0).external_id as string;
  return `${external_id}-${serial_id}`;
};

// Helper function to generate a unique_id that doesn't conflict with existing ones
export const generateUniqueIdSafe = async (plate_id: number, serial_id: string): Promise<string> => {
  const baseUniqueId = await generateUniqueId(plate_id, serial_id);
  
  // Check if this unique_id already exists
  const existingRes = await executeSql(
    'SELECT 1 FROM SerialPattern WHERE unique_id = ? LIMIT 1;',
    [baseUniqueId]
  );
  
  if (existingRes.rows.length === 0) {
    // No conflict, return the base unique_id
    return baseUniqueId;
  }
  
  // Conflict exists, try with timestamp suffix
  const timestamp = Date.now();
  const uniqueIdWithTimestamp = `${baseUniqueId}-${timestamp}`;
  
  // Check if this one also exists (very unlikely but safe)
  const conflictRes = await executeSql(
    'SELECT 1 FROM SerialPattern WHERE unique_id = ? LIMIT 1;',
    [uniqueIdWithTimestamp]
  );
  
  if (conflictRes.rows.length === 0) {
    return uniqueIdWithTimestamp;
  }
  
  // Extremely unlikely case - use random suffix
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `${baseUniqueId}-${randomSuffix}`;
};

// Renumber all patterns for a plate (recalculate serial_id and unique_id)
export const renumberPatternsForPlate = async (plate_id: number): Promise<void> => {
  // Get plate's external_id
  const plateRes = await executeSql(
    'SELECT external_id FROM LicensePlate WHERE plate_id = ? LIMIT 1;',
    [plate_id]
  );
  if (plateRes.rows.length === 0) return;
  const external_id = plateRes.rows.item(0).external_id as string;

  // Get all patterns for this plate, ordered by pattern_id
  const patternsRes = await executeSql(
    'SELECT pattern_id FROM SerialPattern WHERE plate_id = ? ORDER BY pattern_id ASC;',
    [plate_id]
  );

  // Renumber each pattern sequentially
  for (let i = 0; i < patternsRes.rows.length; i++) {
    const pattern_id = patternsRes.rows.item(i).pattern_id as number;
    const new_serial_id = (i + 1).toString();
    const new_unique_id = `${external_id}-${new_serial_id}`;
    
    await executeSql(
      'UPDATE SerialPattern SET serial_id = ?, unique_id = ? WHERE pattern_id = ?;',
      [new_serial_id, new_unique_id, pattern_id]
    );
  }
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
    `INSERT INTO Sighting (plate_id, pattern_id, external_id, location, time, notes, image_uri, trip, latitude, longitude, city, state, country, full_address) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?);`,
    [
      sighting.plate_id,
      sighting.pattern_id ?? null,
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
    `UPDATE Sighting SET plate_id=?, pattern_id=?, external_id=?, location=?, time=?, notes=?, image_uri=?, trip=?, latitude=?, longitude=?, city=?, state=?, country=?, full_address=? WHERE sighting_id=?;`,
    [
      sighting.plate_id,
      sighting.pattern_id ?? null,
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
  trip?: string;
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
  
  // Trip filtering (partial match)
  if (f.trip) {
    where.push('LOWER(s.trip) LIKE LOWER(?)');
    sqlParams.push(`%${f.trip}%`);
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
  
  // Trip filtering (partial match)
  if (f.trip) {
    where.push('LOWER(s.trip) LIKE LOWER(?)');
    params.push(`%${f.trip}%`);
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
  try {
    const res = await executeSql(
      `SELECT DISTINCT TRIM(trip) as trip
       FROM Sighting
       WHERE trip IS NOT NULL AND TRIM(trip) <> ''
       ORDER BY LOWER(trip);`
    );
    const names: string[] = [];
    for (let i = 0; i < res.rows.length; i++) names.push(res.rows.item(i).trip as string);
    return names;
  } catch (error) {
    console.error('Error loading trips:', error);
    // Return empty array if Sighting table doesn't exist or query fails
    return [];
  }
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

// County management functions
export const getCountiesForState = async (state: string): Promise<string[]> => {
  const res = await executeSql(
    'SELECT name FROM CountyName WHERE state = ? ORDER BY LOWER(name);',
    [state]
  );
  const counties: string[] = [];
  for (let i = 0; i < res.rows.length; i++) {
    counties.push(res.rows.item(i).name as string);
  }
  return counties;
};

export const addCounty = async (state: string, countyName: string): Promise<void> => {
  await executeSql(
    'INSERT OR IGNORE INTO CountyName (state, name) VALUES (?, ?);',
    [state, countyName]
  );
};

// -------------------- Tag management -------------------

export const getAllTagNames = async (): Promise<string[]> => {
  try {
    const res = await executeSql(
      `SELECT DISTINCT TRIM(tag_name) as tag_name
       FROM PlateTag
       WHERE tag_name IS NOT NULL AND TRIM(tag_name) <> ''
       ORDER BY LOWER(tag_name);`
    );
    const names: string[] = [];
    for (let i = 0; i < res.rows.length; i++) names.push(res.rows.item(i).tag_name as string);
    return names;
  } catch (error) {
    console.error('Error loading tags:', error);
    return [];
  }
};

export const getTagNames = async (): Promise<string[]> => {
  const res = await executeSql(`SELECT name FROM TagName ORDER BY LOWER(name);`);
  const out: string[] = [];
  for (let i = 0; i < res.rows.length; i++) out.push(res.rows.item(i).name as string);
  return out;
};

export const addTagName = async (name: string): Promise<void> => {
  const trimmed = (name || '').trim();
  if (!trimmed) return;
  await executeSql(`INSERT OR IGNORE INTO TagName(name) VALUES (?);`, [trimmed]);
};

export const getTagsForPlate = async (plate_id: number): Promise<string[]> => {
  const res = await executeSql(
    'SELECT tag_name FROM PlateTag WHERE plate_id = ? ORDER BY LOWER(tag_name);',
    [plate_id]
  );
  const tags: string[] = [];
  for (let i = 0; i < res.rows.length; i++) {
    tags.push(res.rows.item(i).tag_name as string);
  }
  return tags;
};

export const setTagsForPlate = async (plate_id: number, tags: string[]): Promise<void> => {
  // First, remove all existing tags for this plate
  await executeSql('DELETE FROM PlateTag WHERE plate_id = ?;', [plate_id]);
  
  // Then add the new tags
  for (const tag of tags) {
    const trimmed = (tag || '').trim();
    if (trimmed) {
      // Add to TagName table first (ignore if exists)
      await addTagName(trimmed);
      // Add to PlateTag table
      await executeSql(
        'INSERT OR IGNORE INTO PlateTag (plate_id, tag_name) VALUES (?, ?);',
        [plate_id, trimmed]
      );
    }
  }
};

// Debug function to check tag migration status
export const debugTagMigration = async (): Promise<void> => {
  try {
    console.log('=== Tag Migration Debug ===');
    
    // Check plates with tags in old format
    const platesWithOldTags = await executeSql(`
      SELECT plate_id, name, tags FROM LicensePlate 
      WHERE tags IS NOT NULL AND TRIM(tags) <> ''
      LIMIT 5
    `);
    console.log('Plates with old format tags:', platesWithOldTags.rows.length);
    for (let i = 0; i < platesWithOldTags.rows.length; i++) {
      const row = platesWithOldTags.rows.item(i);
      console.log(`  Plate ${row.plate_id} (${row.name}): "${row.tags}"`);
    }
    
    // Check TagName table
    const tagNames = await executeSql('SELECT COUNT(*) as count FROM TagName');
    console.log('Tags in TagName table:', tagNames.rows.item(0).count);
    
    // Check PlateTag table
    const plateTags = await executeSql('SELECT COUNT(*) as count FROM PlateTag');
    console.log('Relationships in PlateTag table:', plateTags.rows.item(0).count);
    
    // Show some sample tags
    const sampleTags = await executeSql('SELECT name FROM TagName LIMIT 10');
    console.log('Sample tags:');
    for (let i = 0; i < sampleTags.rows.length; i++) {
      console.log(`  - ${sampleTags.rows.item(i).name}`);
    }
    
    console.log('=== End Debug ===');
  } catch (error) {
    console.error('Debug error:', error);
  }
};

// Test function to verify tag search is working
export const testTagSearch = async (): Promise<void> => {
  try {
    console.log('=== Tag Search Test ===');
    
    // Test searching for "Solid" tag
    const testFilters: PlateFilters = {
      tags: ['Solid']
    };
    
    console.log('Testing search for "Solid" tag...');
    const results = await searchPlatesAdvanced(testFilters);
    console.log(`Found ${results.length} plates with "Solid" tag`);
    
    for (let i = 0; i < Math.min(results.length, 5); i++) {
      const plate = results[i];
      console.log(`  - Plate ${plate.plate_id}: ${plate.name}`);
    }
    
    // Test searching for "Sun" tag
    const testFilters2: PlateFilters = {
      tags: ['Sun']
    };
    
    console.log('Testing search for "Sun" tag...');
    const results2 = await searchPlatesAdvanced(testFilters2);
    console.log(`Found ${results2.length} plates with "Sun" tag`);
    
    for (let i = 0; i < Math.min(results2.length, 5); i++) {
      const plate = results2[i];
      console.log(`  - Plate ${plate.plate_id}: ${plate.name}`);
    }
    
    console.log('=== End Tag Search Test ===');
  } catch (error) {
    console.error('Tag search test error:', error);
  }
};

// -------------------- Unidentified Plate -------------------

export const ensureUnidentifiedPlateExists = async (): Promise<Plate> => {
  // Check if "Unidentified Plate" already exists
  const existingRes = await executeSql(
    'SELECT * FROM LicensePlate WHERE name = ? AND external_id = ? LIMIT 1;',
    ['Unidentified Plate', 'UNIDENTIFIED-PLATE']
  );
  
  if (existingRes.rows.length > 0) {
    return existingRes.rows.item(0);
  }
  
  // Create the unidentified plate if it doesn't exist
  const unidentifiedPlate: Plate = {
    external_id: 'UNIDENTIFIED-PLATE',
    name: 'Unidentified Plate',
    state: 'Unknown',
    country: 'Unknown',
    available: true,
    base: false,
    embossed: false,
    county: false,
    url: false,
    notes: 'Default plate for sightings where the specific plate is not known'
  };
  
  return await addPlate(unidentifiedPlate);
};