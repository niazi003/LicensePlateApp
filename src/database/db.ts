import { openDatabase, ResultSet, SQLError } from 'react-native-sqlite-storage';

const db: any = openDatabase({ name: 'plates.db', location: 'default' });

// Promise wrapper for SQL execution
export const executeSql = (sql: string, params: any[] = []): Promise<ResultSet> => {
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx: any) => {
        tx.executeSql(
          sql,
          params,
          (_: any, result: ResultSet) => resolve(result),
          (_: any, error: SQLError) => {
            const enriched = new Error(
              `${error?.message || 'SQL error'} | SQL: ${sql} | Params: ${JSON.stringify(params)}`
            );
            // @ts-ignore attach original error
            enriched.original = error;
            reject(enriched as any);
            return false;
          }
        );
      },
      (error: any) => reject(error),
    );
  });
};

// Initialize DB schema (latest, no migrations)
export const initDB = async (): Promise<void> => {
  // Enforce foreign keys
  await executeSql('PRAGMA foreign_keys = ON;');

  // LicensePlate table
  await executeSql(`
    CREATE TABLE IF NOT EXISTS LicensePlate (
      plate_id INTEGER PRIMARY KEY AUTOINCREMENT,
      external_id TEXT,
      state TEXT,
      country TEXT,
      name TEXT UNIQUE,
      years_available TEXT,
      available INTEGER DEFAULT 1,
      base INTEGER DEFAULT 0,
      primary_background_colors TEXT,
      all_colors TEXT,
      background_desc TEXT,
      text_field TEXT,
      features_tags TEXT,
      description TEXT,
      notes TEXT,
      images TEXT
    );
  `);

  // SerialPattern table
  await executeSql(`
    CREATE TABLE IF NOT EXISTS SerialPattern (
      pattern_id INTEGER PRIMARY KEY AUTOINCREMENT,
      plate_id INTEGER NOT NULL,
      num_pattern TEXT NOT NULL,
      type TEXT,
      series_years TEXT,
      FOREIGN KEY (plate_id) REFERENCES LicensePlate(plate_id) ON DELETE CASCADE
    );
  `);

  // Sighting table
  await executeSql(`
    CREATE TABLE IF NOT EXISTS Sighting (
      sighting_id INTEGER PRIMARY KEY AUTOINCREMENT,
      plate_id INTEGER NOT NULL,
      location TEXT,
      time TEXT,
      notes TEXT,
      image_uri TEXT,
      trip TEXT,
      FOREIGN KEY (plate_id) REFERENCES LicensePlate(plate_id) ON DELETE CASCADE
    );
  `);

  // TripName table
  await executeSql(`
    CREATE TABLE IF NOT EXISTS TripName (
      name TEXT PRIMARY KEY
    );
  `);

  // Helpful indexes
  await executeSql(`CREATE INDEX IF NOT EXISTS idx_plate_state ON LicensePlate(state);`);
  await executeSql(`CREATE INDEX IF NOT EXISTS idx_pattern_plate ON SerialPattern(plate_id);`);
  await executeSql(`CREATE INDEX IF NOT EXISTS idx_sighting_plate ON Sighting(plate_id);`);
  await executeSql(`CREATE UNIQUE INDEX IF NOT EXISTS ux_plate_external_id ON LicensePlate(external_id);`);

  // Seed TripName table from Sighting
  await executeSql(`
    INSERT OR IGNORE INTO TripName(name)
    SELECT DISTINCT TRIM(trip) as name FROM Sighting
    WHERE trip IS NOT NULL AND TRIM(trip) <> '';
  `);
};

export default db;
