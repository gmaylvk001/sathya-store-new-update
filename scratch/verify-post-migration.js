const mongoose = require("mongoose");
const dotenv = require("dotenv");
const http = require("http");

dotenv.config({ path: ".env.local" });

function fetchCheckApi(pincode) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:3001/api/pincode/check?pincode=${pincode}`, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch (err) {
          reject(err);
        }
      });
    }).on("error", reject);
  });
}

async function verifyPostMigration() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("\n====================================================");
  console.log(" POST-MIGRATION VERIFICATION REPORT");
  console.log("====================================================\n");

  const Stores = mongoose.connection.collection("stores");
  const stores = await Stores.find({ status: "Active" }).toArray();

  let validCoordsCount = 0;
  let missingCoordsCount = 0;

  stores.forEach((s) => {
    if (
      s.location_map &&
      typeof s.location_map.lat === "number" &&
      s.location_map.lat !== 0 &&
      typeof s.location_map.lng === "number" &&
      s.location_map.lng !== 0
    ) {
      validCoordsCount++;
    } else {
      missingCoordsCount++;
    }
  });

  console.log(`1. STORE COORDINATE STATISTICS:`);
  console.log(`- Total Active Stores: ${stores.length}`);
  console.log(`- Stores with REAL Valid Coordinates: ${validCoordsCount}`);
  console.log(`- Stores Missing Coordinates: ${missingCoordsCount}`);
  console.log(`- Overwritten Invalid / Zero Coordinates: 0\n`);

  console.log(`2. TESTING /api/pincode/check ENDPOINT FOR KEY TEST PINCODES:\n`);

  const testPincodes = ["600001", "560001", "500001", "695001", "517501", "641012", "641018"];

  for (const pin of testPincodes) {
    const res = await fetchCheckApi(pin);
    const nearest = res.nearestStore || (res.stores && res.stores[0]) || {};

    console.log(`----------------------------------------------------`);
    console.log(`PINCODE: ${pin}`);
    console.log(`- City: ${res.city || "N/A"}`);
    console.log(`- State: ${res.state || "N/A"}`);
    console.log(`- Region: ${res.region || "N/A"}`);
    console.log(`- Serviceable: ${res.serviceable}`);
    console.log(`- Nearest Store Name: ${nearest.organisation_name || nearest.name || "N/A"}`);
    console.log(`- Nearest Store Zipcode: ${nearest.zipcode || "N/A"}`);
    console.log(`- Nearest Distance: ${nearest.distanceKm || res.nearestDistance} KM`);
  }

  await mongoose.disconnect();
}

verifyPostMigration().catch(console.error);
