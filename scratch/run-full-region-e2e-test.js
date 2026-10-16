const http = require("http");

function fetchApi(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = `http://localhost:3000${path}`;
    const bodyStr = options.body ? (typeof options.body === "string" ? options.body : JSON.stringify(options.body)) : null;
    const reqHeaders = { ...(options.headers || {}) };
    if (bodyStr) {
      reqHeaders["Content-Length"] = Buffer.byteLength(bodyStr);
    }

    const reqOptions = {
      method: options.method || "GET",
      headers: reqHeaders,
    };

    const req = http.request(url, reqOptions, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on("error", reject);

    if (bodyStr) {
      req.write(bodyStr);
    }
    req.end();
  });
}

async function runComprehensiveTests() {
  console.log("\n====================================================");
  console.log(" COMPREHENSIVE REGION MANAGEMENT E2E TEST SUITE");
  console.log("====================================================\n");

  const testResults = {
    pincodeMapping: false,
    topBanners: false,
    categoryBanners: false,
    brandBanners: false,
    ownerProductRegions: false,
    security: false,
  };

  // ----------------------------------------------------
  // A. PINCODE STATE MAPPING TEST
  // ----------------------------------------------------
  console.log("--- A. Testing Pincode State Mapping ---");
  const testPincodes = [
    { pin: "600001", expected: "tamilnadu", name: "Tamil Nadu" },
    { pin: "560001", expected: "karnataka", name: "Karnataka" },
    { pin: "500001", expected: "telangana", name: "Telangana" },
    { pin: "695001", expected: "kerala", name: "Kerala" },
    { pin: "517501", expected: "andhra", name: "Andhra Pradesh" },
  ];

  let pinPass = true;
  for (const item of testPincodes) {
    const res = await fetchApi(`/api/pincode/check-delivery?pincode=${item.pin}`);
    const region = res.body?.region || res.body?.data?.region;
    const match = region === item.expected;
    console.log(`- Pincode ${item.pin} (${item.name}) => Resolved Region: "${region}" [${match ? "PASS ✅" : "FAIL ❌"}]`);
    if (!match) pinPass = false;
  }
  testResults.pincodeMapping = pinPass;

  // ----------------------------------------------------
  // B. TOP BANNER TESTS FOR ALL REGIONS & FALLBACK
  // ----------------------------------------------------
  console.log("\n--- B. Testing Top Banner Region Isolation & Fallback ---");
  const regions = ["tamilnadu", "karnataka", "andhra", "kerala", "telangana"];
  let topBannerPass = true;

  for (const r of regions) {
    const getRes = await fetchApi(`/api/topbanner?region=${r}`);
    const ok = getRes.status === 200 && Array.isArray(getRes.body?.banners);
    console.log(`- Top Banners for "${r}" => Status: ${getRes.status}, Count: ${getRes.body?.banners?.length ?? 0} [${ok ? "PASS ✅" : "FAIL ❌"}]`);
    if (!ok) topBannerPass = false;
  }

  const fallbackRes = await fetchApi(`/api/topbanner?region=unknown_region`);
  const fallOk = fallbackRes.status === 200 && fallbackRes.body?.region === "tamilnadu";
  console.log(`- Top Banner Fallback Query => Resolved: "${fallbackRes.body?.region}", Status: ${fallbackRes.status} [${fallOk ? "PASS ✅" : "FAIL ❌"}]`);
  if (!fallOk) topBannerPass = false;
  testResults.topBanners = topBannerPass;

  // ----------------------------------------------------
  // C. CATEGORY BANNER TESTS FOR ALL REGIONS
  // ----------------------------------------------------
  console.log("\n--- C. Testing Category Banner API Across Regions ---");
  let catPass = true;
  for (const r of [...regions, "all"]) {
    const catRes = await fetchApi(`/api/categories/banner?region=${r}`);
    const ok = catRes.status === 200 && Array.isArray(catRes.body?.categories);
    console.log(`- Category Banners for "${r}" => Status: ${catRes.status}, Categories: ${catRes.body?.categories?.length ?? 0} [${ok ? "PASS ✅" : "FAIL ❌"}]`);
    if (!ok) catPass = false;
  }
  testResults.categoryBanners = catPass;

  // ----------------------------------------------------
  // D. BRAND BANNER TESTS FOR ALL REGIONS
  // ----------------------------------------------------
  console.log("\n--- D. Testing Brand Banner API Across Regions ---");
  let brandPass = true;
  for (const r of [...regions, "all"]) {
    const brandRes = await fetchApi(`/api/brand/banner?region=${r}`);
    const ok = brandRes.status === 200 && Array.isArray(brandRes.body?.brands);
    console.log(`- Brand Banners for "${r}" => Status: ${brandRes.status}, Brands: ${brandRes.body?.brands?.length ?? 0} [${ok ? "PASS ✅" : "FAIL ❌"}]`);
    if (!ok) brandPass = false;
  }
  testResults.brandBanners = brandPass;

  // ----------------------------------------------------
  // E. OWNER PRODUCT REGION FILTERING & ISOLATION
  // ----------------------------------------------------
  console.log("\n--- E. Testing OwnerProduct Region Admin Management ---");
  let ownerPass = true;
  for (const r of [...regions, "all"]) {
    const getRes = await fetchApi(`/api/admin/owner-product?region=${r}`);
    const ok = getRes.status === 200;
    console.log(`- OwnerProduct GET for region "${r}" => Status: ${getRes.status} [${ok ? "PASS ✅" : "FAIL ❌"}]`);
    if (!ok) ownerPass = false;
  }
  testResults.ownerProductRegions = ownerPass;

  // ----------------------------------------------------
  // F. SECURITY CHECKS
  // ----------------------------------------------------
  console.log("\n--- F. Testing Security & Authorization Verification ---");
  let secPass = true;

  const unauthHeaders = { "Content-Type": "application/json" };

  // 1. OwnerProduct POST without admin auth
  const unauthOwner = await fetchApi("/api/admin/owner-product", {
    method: "POST",
    headers: unauthHeaders,
    body: JSON.stringify({ product_id: "507f1f77bcf86cd799439011", price: 100 }),
  });
  console.log(`- OwnerProduct Unauth POST => Status: ${unauthOwner.status}, Body: ${JSON.stringify(unauthOwner.body)} [${unauthOwner.status === 401 ? "PASS ✅" : "FAIL ❌"}]`);
  if (unauthOwner.status !== 401) secPass = false;

  // 2. TopBanner DELETE without admin auth
  const unauthBanner = await fetchApi("/api/topbanner", {
    method: "DELETE",
    headers: unauthHeaders,
    body: JSON.stringify({ id: "507f1f77bcf86cd799439011" }),
  });
  console.log(`- TopBanner Unauth DELETE => Status: ${unauthBanner.status}, Body: ${JSON.stringify(unauthBanner.body)} [${unauthBanner.status === 401 ? "PASS ✅" : "FAIL ❌"}]`);
  if (unauthBanner.status !== 401) secPass = false;

  // 3. Category Banner DELETE without admin auth
  const unauthCat = await fetchApi("/api/categories/banner", {
    method: "DELETE",
    headers: unauthHeaders,
    body: JSON.stringify({ categoryId: "507f1f77bcf86cd799439011" }),
  });
  console.log(`- Category Banner Unauth DELETE => Status: ${unauthCat.status}, Body: ${JSON.stringify(unauthCat.body)} [${unauthCat.status === 401 ? "PASS ✅" : "FAIL ❌"}]`);
  if (unauthCat.status !== 401) secPass = false;

  // 4. Brand Banner DELETE without admin auth
  const unauthBrand = await fetchApi("/api/brand/banner", {
    method: "DELETE",
    headers: unauthHeaders,
    body: JSON.stringify({ brandId: "507f1f77bcf86cd799439011" }),
  });
  console.log(`- Brand Banner Unauth DELETE => Status: ${unauthBrand.status}, Body: ${JSON.stringify(unauthBrand.body)} [${unauthBrand.status === 401 ? "PASS ✅" : "FAIL ❌"}]`);
  if (unauthBrand.status !== 401) secPass = false;

  testResults.security = secPass;

  // ----------------------------------------------------
  // SUMMARY REPORT
  // ----------------------------------------------------
  console.log("\n====================================================");
  console.log(" E2E TEST SUMMARY");
  console.log("====================================================");
  console.log(`1. Pincode State Mapping: ${testResults.pincodeMapping ? "PASS ✅" : "FAIL ❌"}`);
  console.log(`2. Top Banners (All Regions + Fallback): ${testResults.topBanners ? "PASS ✅" : "FAIL ❌"}`);
  console.log(`3. Category Banners (All Regions): ${testResults.categoryBanners ? "PASS ✅" : "FAIL ❌"}`);
  console.log(`4. Brand Banners (All Regions): ${testResults.brandBanners ? "PASS ✅" : "FAIL ❌"}`);
  console.log(`5. OwnerProduct Admin (All Regions): ${testResults.ownerProductRegions ? "PASS ✅" : "FAIL ❌"}`);
  console.log(`6. Security & Authorization Checks: ${testResults.security ? "PASS ✅" : "FAIL ❌"}`);
  console.log("====================================================\n");
}

runComprehensiveTests().catch(console.error);
