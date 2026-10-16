const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config({ path: '.env.local' });

function parseStoreCoordinates(store) {
  if (
    store.location_map &&
    typeof store.location_map.lat === 'number' &&
    store.location_map.lat !== 0 &&
    typeof store.location_map.lng === 'number' &&
    store.location_map.lng !== 0
  ) {
    return {
      lat: store.location_map.lat,
      lng: store.location_map.lng,
      method: 'existing_location_map_preserved',
    };
  }

  const url = (store.website || '').trim();

  // 1. Google Maps place pin: !8m2!3d{lat}!4d{lng}
  let m = url.match(/!8m2!3d([0-9.-]+)!4d([0-9.-]+)/);
  if (m) {
    return { lat: parseFloat(m[1]), lng: parseFloat(m[2]), method: 'google_place_pin_params' };
  }

  // 2. Google Maps destination point: !2m2!1d{lng}!2d{lat}
  m = url.match(/!2m2!1d([0-9.-]+)!2d([0-9.-]+)/);
  if (m) {
    return { lat: parseFloat(m[2]), lng: parseFloat(m[1]), method: 'google_dir_destination_params' };
  }

  // 3. Google Maps query parameter: q=lat,lng
  m = url.match(/q=([0-9.-]+),([0-9.-]+)/);
  if (m) {
    return { lat: parseFloat(m[1]), lng: parseFloat(m[2]), method: 'google_query_param' };
  }

  // 4. Plain lat,lng,zoom string (e.g. 11.020152,76.960893,855m)
  m = url.match(/^([0-9.]+),([0-9.]+)/);
  if (m) {
    return { lat: parseFloat(m[1]), lng: parseFloat(m[2]), method: 'plain_coord_string' };
  }

  // 5. Viewport center fallback in Google Maps URL: @lat,lng
  m = url.match(/@([0-9.-]+),([0-9.-]+)/);
  if (m) {
    return { lat: parseFloat(m[1]), lng: parseFloat(m[2]), method: 'google_viewport_center' };
  }

  // Fallbacks for 2 stores missing URL coordinates based on exact branch pincode geocoding:
  if (store.zipcode === '641041') {
    return { lat: 11.0267, lng: 76.9022, method: 'branch_pincode_geocoding' };
  }
  if (store.zipcode === '638111') {
    return { lat: 11.1098, lng: 77.7214, method: 'branch_pincode_geocoding' };
  }

  return null;
}

async function executeMigration() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB.');

  const Stores = mongoose.connection.collection('stores');
  const allStores = await Stores.find({ status: 'Active' }).toArray();

  // 1. Backup all affected store documents
  const backupPath = path.join(process.cwd(), 'scratch', 'stores_backup_before_migration.json');
  fs.writeFileSync(backupPath, JSON.stringify(allStores, null, 2));
  console.log(`[BACKUP CREATED] ${allStores.length} store documents backed up to: ${backupPath}`);

  // 2. Ambiguity check
  let ambiguous = [];
  let updates = [];

  for (const store of allStores) {
    const coords = parseStoreCoordinates(store);
    if (!coords) {
      ambiguous.push(store.organisation_name);
    } else {
      updates.push({
        store,
        coords
      });
    }
  }

  if (ambiguous.length > 0) {
    console.error(`[ABORTED] Ambiguous/unresolvable stores found: ${ambiguous.join(', ')}`);
    process.exit(1);
  }

  console.log(`[VERIFIED] 0 ambiguous matches found. Proceeding with database updates for ${updates.length} stores...`);

  // 3. Execute updates
  const auditLog = [];
  for (const item of updates) {
    const s = item.store;
    const c = item.coords;

    await Stores.updateOne(
      { _id: s._id },
      {
        $set: {
          'location_map.lat': c.lat,
          'location_map.lng': c.lng,
          'location_map.address': s.address || ''
        }
      }
    );

    auditLog.push({
      storeId: s._id.toString(),
      name: s.organisation_name,
      zipcode: s.zipcode,
      updatedAt: new Date().toISOString(),
      lat: c.lat,
      lng: c.lng,
      method: c.method
    });
  }

  const auditPath = path.join(process.cwd(), 'scratch', 'store_coordinate_migration_audit.json');
  fs.writeFileSync(auditPath, JSON.stringify(auditLog, null, 2));
  console.log(`[COMPLETED] Database updated successfully for ${auditLog.length} stores.`);
  console.log(`[AUDIT LOG CREATED] ${auditPath}`);

  await mongoose.disconnect();
}

executeMigration().catch(console.error);
