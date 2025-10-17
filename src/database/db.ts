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

// Seed initial counties from static data
const seedInitialCounties = async (): Promise<void> => {
  try {
    // Import the counties data
    const { COUNTIES_BY_STATE } = await import('../data/counties');
    
    // Insert counties for each state
    for (const [state, counties] of Object.entries(COUNTIES_BY_STATE)) {
      for (const county of counties) {
        try {
          await executeSql(
            'INSERT OR IGNORE INTO CountyName (state, name) VALUES (?, ?);',
            [state, county]
          );
        } catch (error) {
          // Ignore duplicate errors due to UNIQUE constraint
          console.log(`County ${county} in ${state} already exists or error occurred`);
        }
      }
    }
    console.log('Initial counties seeded successfully');
  } catch (error) {
    console.log('Error seeding initial counties:', error);
  }
};

// Initialize DB schema (latest, no migrations)
export const initDB = async (): Promise<void> => {
  // Enforce foreign keys
  await executeSql('PRAGMA foreign_keys = ON;');

  // LicensePlate table
  console.log('Creating LicensePlate table...');
  await executeSql(`
    CREATE TABLE IF NOT EXISTS LicensePlate (
      plate_id INTEGER PRIMARY KEY AUTOINCREMENT,
      external_id TEXT UNIQUE,
      state TEXT,
      country TEXT,
      name TEXT,
      years_available TEXT,
      available INTEGER DEFAULT 1,
      base INTEGER DEFAULT 0,
      embossed INTEGER DEFAULT 0,
      pattern_font TEXT,
      pattern_color TEXT,
      state_font TEXT,
      state_color TEXT,
      state_location TEXT,
      primary_background_colors TEXT,
      all_colors TEXT,
      background_description TEXT,
      county INTEGER DEFAULT 0,
      county_name TEXT,
      url INTEGER DEFAULT 0,
      text TEXT,
      tags TEXT,
      additional_description TEXT,
      notes TEXT,
      image_uri TEXT
    );
  `);
  console.log('LicensePlate table created successfully');

  // PlateImages table for storing multiple images per plate
  console.log('Creating PlateImages table...');
  await executeSql(`
    CREATE TABLE IF NOT EXISTS PlateImages (
      image_id INTEGER PRIMARY KEY AUTOINCREMENT,
      plate_id INTEGER NOT NULL,
      image_uri TEXT NOT NULL,
      image_name TEXT,
      image_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (plate_id) REFERENCES LicensePlate (plate_id) ON DELETE CASCADE
    );
  `);
  console.log('PlateImages table created successfully');

  // SerialPattern table
  await executeSql(`
    CREATE TABLE IF NOT EXISTS SerialPattern (
      pattern_id INTEGER PRIMARY KEY AUTOINCREMENT,
      plate_id INTEGER NOT NULL,
      external_id TEXT,
      serial_id TEXT,
      unique_id TEXT UNIQUE,
      pattern TEXT NOT NULL,
      separator TEXT,
      type TEXT,
      series_years TEXT,
      FOREIGN KEY ( plate_id ) REFERENCES LicensePlate( plate_id ) ON DELETE CASCADE
    );
  `);

  // Sighting table
  await executeSql(`
    CREATE TABLE IF NOT EXISTS Sighting (
      sighting_id INTEGER PRIMARY KEY AUTOINCREMENT,
      plate_id INTEGER NOT NULL,
      pattern_id INTEGER,
      external_id TEXT,
      location TEXT,
      time TEXT,
      notes TEXT,
      image_uri TEXT,
      trip TEXT,
      latitude REAL,
      longitude REAL,
      FOREIGN KEY ( plate_id ) REFERENCES LicensePlate( plate_id ) ON DELETE CASCADE,
      FOREIGN KEY ( pattern_id ) REFERENCES SerialPattern( pattern_id ) ON DELETE SET NULL
    );
  `);

  // TripName table
  await executeSql(`
    CREATE TABLE IF NOT EXISTS TripName (
      name TEXT PRIMARY KEY
    );
  `);

  // CountyName table
  await executeSql(`
    CREATE TABLE IF NOT EXISTS CountyName (
      county_id INTEGER PRIMARY KEY AUTOINCREMENT,
      state TEXT NOT NULL,
      name TEXT NOT NULL,
      UNIQUE(state, name)
    );
  `);

  // TagName table - similar to TripName but for tags
  await executeSql(`
    CREATE TABLE IF NOT EXISTS TagName (
      name TEXT PRIMARY KEY
    );
  `);

  // PlateTag table - many-to-many relationship between plates and tags
  await executeSql(`
    CREATE TABLE IF NOT EXISTS PlateTag (
      plate_id INTEGER NOT NULL,
      tag_name TEXT NOT NULL,
      PRIMARY KEY (plate_id, tag_name),
      FOREIGN KEY (plate_id) REFERENCES LicensePlate(plate_id) ON DELETE CASCADE,
      FOREIGN KEY (tag_name) REFERENCES TagName(name) ON DELETE CASCADE
    );
  `);

  // Helpful indexes
  await executeSql(`CREATE INDEX IF NOT EXISTS idx_plate_state ON LicensePlate(state);`);
  await executeSql(`CREATE INDEX IF NOT EXISTS idx_pattern_plate ON SerialPattern(plate_id);`);
  await executeSql(`CREATE INDEX IF NOT EXISTS idx_sighting_plate ON Sighting(plate_id);`);
  await executeSql(`CREATE UNIQUE INDEX IF NOT EXISTS ux_plate_external_id ON LicensePlate(external_id);`);
  await executeSql(`CREATE INDEX IF NOT EXISTS idx_county_state ON CountyName(state);`);
  await executeSql(`CREATE INDEX IF NOT EXISTS idx_plate_tag_plate ON PlateTag(plate_id);`);
  await executeSql(`CREATE INDEX IF NOT EXISTS idx_plate_tag_tag ON PlateTag(tag_name);`);


  // Add coordinate columns to existing Sighting table if they don't exist
  try {
    await executeSql('ALTER TABLE Sighting ADD COLUMN latitude REAL;');
  } catch (error) {
    // Column might already exist, ignore error
    console.log('latitude column might already exist');
  }
  
  try {
    await executeSql('ALTER TABLE Sighting ADD COLUMN longitude REAL;');
  } catch (error) {
    // Column might already exist, ignore error
    console.log('longitude column might already exist');
  }

  // Add geocoding columns to existing Sighting table if they don't exist
  try {
    await executeSql('ALTER TABLE Sighting ADD COLUMN city TEXT;');
  } catch (error) {
    // Column might already exist, ignore error
    console.log('city column might already exist');
  }
  
  try {
    await executeSql('ALTER TABLE Sighting ADD COLUMN state TEXT;');
  } catch (error) {
    // Column might already exist, ignore error
    console.log('state column might already exist');
  }
  
  try {
    await executeSql('ALTER TABLE Sighting ADD COLUMN country TEXT;');
  } catch (error) {
    // Column might already exist, ignore error
    console.log('country column might already exist');
  }
  
  try {
    await executeSql('ALTER TABLE Sighting ADD COLUMN full_address TEXT;');
  } catch (error) {
    // Column might already exist, ignore error
    console.log('full_address column might already exist');
  }

  // Add image_uri column to existing LicensePlate table if it doesn't exist
  try {
    await executeSql('ALTER TABLE LicensePlate ADD COLUMN image_uri TEXT;');
  } catch (error) {
    // Column might already exist, ignore error
    console.log('image_uri column might already exist');
  }


  // Seed TripName table from Sighting (only if Sighting table has data)
  try {
    await executeSql(`
      INSERT OR IGNORE INTO TripName(name)
      SELECT DISTINCT TRIM(trip) as name FROM Sighting
      WHERE trip IS NOT NULL AND TRIM(trip) <> '';
    `);
  } catch (error) {
    // If Sighting table doesn't exist or has no data, that's fine
    console.log('No existing trip data to seed from Sighting table');
  }

  // Seed TagName table and migrate existing tags from LicensePlate.tags string to PlateTag table
  try {
    // First, get all plates with tags
    const platesWithTags = await executeSql(`
      SELECT plate_id, tags FROM LicensePlate 
      WHERE tags IS NOT NULL AND TRIM(tags) <> ''
    `);
    
    for (let i = 0; i < platesWithTags.rows.length; i++) {
      const row = platesWithTags.rows.item(i);
      const plateId = row.plate_id;
      const tagsString = row.tags;
      
      if (tagsString) {
        // Parse tags from the string format (semicolon and comma separated)
        const tags = tagsString
          .split(/[;,]/)
          .map((tag: string) => tag.trim())
          .filter((tag: string) => tag.length > 0);
        
        for (const tag of tags) {
          // Add to TagName table
          await executeSql(`INSERT OR IGNORE INTO TagName(name) VALUES (?);`, [tag]);
          
          // Add to PlateTag table
          await executeSql(`INSERT OR IGNORE INTO PlateTag(plate_id, tag_name) VALUES (?, ?);`, [plateId, tag]);
        }
      }
    }
    
    console.log('Tag migration completed successfully');
  } catch (error) {
    console.log('Error during tag migration:', error);
  }

  // Seed CountyName table with initial data
  await seedInitialCounties();
};

export default db;
