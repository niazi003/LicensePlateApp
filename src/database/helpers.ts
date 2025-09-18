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
}


//--------------------------Plates----------------------------

export const getAllPlates = async (): Promise<Plate[]> => {
    const res = await executeSql('SELECT * FROM LicensePlate ORDER BY name COLLATE NOCASE;');
    const rows: Plate[] = [];
    for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
    return rows;
};

export const addPlate = async (p: Plate): Promise<Plate> => {
    const res = await executeSql(
        `INSERT INTO LicensePlate (
      external_id, state, country, name, years_available, available, base,
      primary_background_colors, all_colors, background_desc, text_field,
      features_tags, description, notes, images
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);`,
        [
            p.external_id, p.state, p.country, p.name, p.years_available,
            p.available ? 1 : 0, p.base ? 1 : 0, p.primary_background_colors,
            p.all_colors, p.background_desc, p.text_field, p.features_tags,
            p.description, p.notes, p.images,
        ],
    );
    return { ...p, plate_id: res.insertId };
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
        `INSERT INTO Sighting (plate_id, location, time, notes, image_uri) VALUES (?,?,?,?,?);`,
        [sighting.plate_id, sighting.location, sighting.time, sighting.notes, sighting.image_uri],
    );
    return { ...sighting, sighting_id: res.insertId };
};

export const updateSighting = async (sighting: Sighting): Promise<void> => {
    await executeSql(
        `UPDATE Sighting SET location=?, time=?, notes=?, image_uri=? WHERE sighting_id=?;`,
        [sighting.location, sighting.time, sighting.notes, sighting.image_uri, sighting.sighting_id],
    );
};

export const deleteSighting = async (sighting_id: number): Promise<void> => {
    await executeSql('DELETE FROM Sighting WHERE sighting_id=?;', [sighting_id]);
};