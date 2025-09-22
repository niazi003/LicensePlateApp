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
            reject(error);
            return false;
          },
        );
      },
      (error: any) => reject(error),
    );
  });
};

const getUserVersion = async (): Promise<number> => {
  const res = await executeSql('PRAGMA user_version;');
  // @ts-ignore: sqlite returns a row with key user_version
  const version = res.rows.item(0).user_version as number;
  return version || 0;
};

const setUserVersion = async (version: number): Promise<void> => {
  await executeSql(`PRAGMA user_version = ${version};`);
};

const columnExists = async (table: string, column: string): Promise<boolean> => {
  const res = await executeSql(`PRAGMA table_info(${table});`);
  for (let i = 0; i < res.rows.length; i++) {
    const row = res.rows.item(i);
    if (row.name === column) return true;
  }
  return false;
};

const tableExists = async (table: string): Promise<boolean> => {
  const res = await executeSql(
    `SELECT name FROM sqlite_master WHERE type='table' AND name = ?;`,
    [table],
  );
  return res.rows.length > 0;
};

// Initialize DB schema with migrations
export const initDB = async (): Promise<void> => {
  // Enforce foreign keys
  await executeSql('PRAGMA foreign_keys = ON;');

  // Base tables (idempotent creates for fresh installs)
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

  await executeSql(`
    CREATE TABLE IF NOT EXISTS Sighting (
      sighting_id INTEGER PRIMARY KEY AUTOINCREMENT,
      plate_id INTEGER NOT NULL,
      location TEXT,
      time TEXT,
      notes TEXT,
      image_uri TEXT,
      FOREIGN KEY (plate_id) REFERENCES LicensePlate(plate_id) ON DELETE CASCADE
    );
  `);

  // Always-present helpful indexes
  await executeSql(`CREATE INDEX IF NOT EXISTS idx_plate_state ON LicensePlate(state);`);
  await executeSql(`CREATE INDEX IF NOT EXISTS idx_pattern_plate ON SerialPattern(plate_id);`);
  await executeSql(`CREATE INDEX IF NOT EXISTS idx_sighting_plate ON Sighting(plate_id);`);

  // Migrations
  const currentVersion = await getUserVersion();

  // v1 -> v2: add Trips table, add Sighting.trip_id, unique index on LicensePlate.external_id
  if (currentVersion < 2) {
    // Create Trips table
    await executeSql(`
      CREATE TABLE IF NOT EXISTS Trip (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT
      );
    `);

    // Add column Sighting.trip_id if missing
    const hasTripId = await columnExists('Sighting', 'trip_id');
    if (!hasTripId) {
      await executeSql(`ALTER TABLE Sighting ADD COLUMN trip_id INTEGER;`);
      await executeSql(
        `CREATE INDEX IF NOT EXISTS idx_sighting_trip ON Sighting(trip_id);`
      );
    }

    // Ensure LicensePlate.external_id column exists (legacy safety)
    const hasExternalId = await columnExists('LicensePlate', 'external_id');
    if (!hasExternalId) {
      await executeSql(`ALTER TABLE LicensePlate ADD COLUMN external_id TEXT;`);
    }

    // De-duplicate non-null external_id values before creating UNIQUE index
    // Strategy: for any duplicated external_id, set duplicates (keep the lowest plate_id) to NULL
    await executeSql(`
      WITH dups AS (
        SELECT external_id
        FROM LicensePlate
        WHERE external_id IS NOT NULL AND TRIM(external_id) <> ''
        GROUP BY external_id
        HAVING COUNT(*) > 1
      )
      UPDATE LicensePlate
      SET external_id = NULL
      WHERE external_id IN (SELECT external_id FROM dups)
        AND plate_id NOT IN (
          SELECT MIN(plate_id) FROM LicensePlate
          WHERE external_id IN (SELECT external_id FROM dups)
          GROUP BY external_id
        );
    `);

    // Create unique index (NULLs allowed, uniqueness enforced on non-NULL)
    await executeSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS ux_plate_external_id ON LicensePlate(external_id);`
    );

    await setUserVersion(2);
  }
};

export default db;
