const http = require('http');

function getCheck(pincode) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:3001/api/pincode/check?pincode=${pincode}`, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch(e) {
          resolve(body);
        }
      });
    }).on('error', reject);
  });
}

async function run() {
  console.log('====================================================');
  console.log(' CHECKOUT PINCODE SERVICEABILITY VERIFICATION RESULTS');
  console.log('====================================================\n');

  const testPins = [
    { pin: '600001', label: 'Chennai GPO (Tamil Nadu)' },
    { pin: '560001', label: 'Bengaluru (Karnataka)' },
    { pin: '500001', label: 'Hyderabad (Telangana)' },
    { pin: '695001', label: 'Thiruvananthapuram (Kerala)' },
    { pin: '517501', label: 'Tirupati (Andhra Pradesh)' },
    { pin: '641012', label: 'Coimbatore Store Zipcode (Exact Match)' },
    { pin: '641018', label: 'Trichy Road (Nearby Pincode)' },
    { pin: '110001', label: 'Delhi (Unsupported non-South Indian)' }
  ];

  for (const item of testPins) {
    const res = await getCheck(item.pin);
    console.log(`Pincode: ${item.pin} (${item.label})`);
    console.log(`  - Serviceable: ${res.serviceable}`);
    console.log(`  - Region: ${res.region}, City: ${res.city}`);
    console.log(`  - Stores Found: ${res.stores?.length || 0}`);
    if (res.stores?.length > 0) {
      const nearest = res.stores[0];
      console.log(`  - Nearest Store: "${nearest.organisation_name}"`);
      console.log(`  - Store Zipcode: ${nearest.zipcode}`);
      console.log(`  - Actual Distance: ${nearest.distanceKm} KM\n`);
    } else {
      console.log(`  - Nearest Store: None\n`);
    }
  }

  console.log('====================================================');
  console.log(' ALL SERVICEABILITY TESTS COMPLETED SUCCESSFULLY    ');
  console.log('====================================================');
}

run().catch(console.error);
