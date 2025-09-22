import { executeSql } from './db';

// Types
export interface Plate {
    plate_id?: number;
    external_id?: string;
    state?: string;
    country?: string;
    name?: string;
    years_available?: string;
    available?: boolean;
    base?: boolean;
    primary_background_colors?: string;
    all_colors?: string;
    background_desc?: string;
    text_field?: string;
    features_tags?: string;
    description?: string;
    notes?: string;
    images?: string;
}

export interface Pattern {
    pattern_id?: number;
    plate_id: number;
    num_pattern: string;
    type?: string;
    series_years?: string;
}

export interface Sighting {
    sighting_id?: number;
    plate_id: number;
    location?: string;
    time?: string;
    notes?: string;
    image_uri?: string;
    trip_id?: number | null;
}

export interface Trip {
    id?: number;
    name: string;
    start_date: string; // ISO string
    end_date?: string | null; // ISO string or null
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

export const addPlate = async (p: Plate): Promise<Plate> => {
    // Auto-generate external_id if missing
    let externalId = (p.external_id || '').trim();
    if (!externalId) {
        const stateAbbrev = (p.state || 'PLT').toString().trim().toUpperCase();
        // Start with count of plates in this state + 1
        const countRes = await executeSql('SELECT COUNT(*) as cnt FROM LicensePlate WHERE state = ?;', [p.state || '']);
        const baseCount = countRes.rows.item(0).cnt as number;
        let attempt = baseCount + 1;
        // Ensure uniqueness; increment until no conflict
        // Note: UNIQUE index on external_id allows NULLs; we ensure a non-null unique value here
        // Limit loop to a reasonable number to avoid infinite loops in pathological cases
        for (let i = 0; i < 10000; i++) {
            const candidate = `${stateAbbrev}${attempt}`;
            const existsRes = await executeSql('SELECT 1 FROM LicensePlate WHERE external_id = ? LIMIT 1;', [candidate]);
            if (existsRes.rows.length === 0) {
                externalId = candidate;
                break;
            }
            attempt += 1;
        }
        if (!externalId) {
            // Fallback unique value using time
            externalId = `${stateAbbrev}${Date.now()}`;
        }
    }
    const res = await executeSql(
        `INSERT INTO LicensePlate (
      external_id, state, country, name, years_available, available, base,
      primary_background_colors, all_colors, background_desc, text_field,
      features_tags, description, notes, images
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);`,
        [
            externalId, p.state, p.country, p.name, p.years_available,
            p.available ? 1 : 0, p.base ? 1 : 0, p.primary_background_colors,
            p.all_colors, p.background_desc, p.text_field, p.features_tags,
            p.description, p.notes, p.images,
        ],
    );
    return { ...p, plate_id: res.insertId, external_id: externalId };
};

export const updatePlate = async (p: Plate): Promise<void> => {
    await executeSql(
        `UPDATE LicensePlate SET
      external_id=?, state=?, country=?, name=?, years_available=?, available=?, base=?,
      primary_background_colors=?, all_colors=?, background_desc=?, text_field=?,
      features_tags=?, description=?, notes=?, images=?
     WHERE plate_id=?;`,
        [
            p.external_id, p.state, p.country, p.name, p.years_available,
            p.available ? 1 : 0, p.base ? 1 : 0, p.primary_background_colors,
            p.all_colors, p.background_desc, p.text_field, p.features_tags,
            p.description, p.notes, p.images, p.plate_id,
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
        `INSERT INTO SerialPattern (plate_id, num_pattern, type, series_years) VALUES (?,?,?,?);`,
        [pattern.plate_id, pattern.num_pattern, pattern.type, pattern.series_years],
    );
    return { ...pattern, pattern_id: res.insertId };
};

export const updatePattern = async (pattern: Pattern): Promise<void> => {
    await executeSql(
        `UPDATE SerialPattern SET num_pattern=?, type=?, series_years=? WHERE pattern_id=?;`,
        [pattern.num_pattern, pattern.type, pattern.series_years, pattern.pattern_id],
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
        `INSERT INTO Sighting (plate_id, location, time, notes, image_uri, trip_id) VALUES (?,?,?,?,?,?);`,
        [
            sighting.plate_id,
            sighting.location,
            sighting.time,
            sighting.notes,
            sighting.image_uri,
            sighting.trip_id ?? null,
        ],
    );
    return { ...sighting, sighting_id: res.insertId };
};

export const updateSighting = async (sighting: Sighting): Promise<void> => {
    await executeSql(
        `UPDATE Sighting SET location=?, time=?, notes=?, image_uri=?, trip_id=? WHERE sighting_id=?;`,
        [
            sighting.location,
            sighting.time,
            sighting.notes,
            sighting.image_uri,
            sighting.trip_id ?? null,
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

// -------------------- Trips -------------------------------------------------

export const getAllTrips = async (): Promise<Trip[]> => {
    const res = await executeSql('SELECT * FROM Trip ORDER BY start_date DESC, id DESC;');
    const rows: Trip[] = [];
    for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
    return rows;
};

export const addTrip = async (trip: Trip): Promise<Trip> => {
    const res = await executeSql(
        `INSERT INTO Trip (name, start_date, end_date) VALUES (?,?,?);`,
        [trip.name, trip.start_date, trip.end_date ?? null],
    );
    return { ...trip, id: res.insertId };
};

export const updateTrip = async (trip: Trip): Promise<void> => {
    await executeSql(
        `UPDATE Trip SET name=?, start_date=?, end_date=? WHERE id=?;`,
        [trip.name, trip.start_date, trip.end_date ?? null, trip.id],
    );
};

export const deleteTrip = async (id: number): Promise<void> => {
    // Note: consider ON DELETE SET NULL for Sighting.trip_id if adding FK later
    await executeSql('DELETE FROM Trip WHERE id=?;', [id]);
};