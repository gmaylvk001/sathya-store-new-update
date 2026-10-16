/**
 * Standalone Developer Script: admin permissions + "Admin" / "Unilet Admin" role seeder
 *
 * Reads every admin module from lib/adminModules.js and creates a permission for each in
 * `ecom_permissions_infos` (Permissions page). Then seeds the roles in `ecom_roles_infos` (Roles page),
 * leaving out PERMISSION_ONLY_GROUPS (Product, Category) from every role:
 *   - Admin: every seeded permission. Only adds missing ones, never removes.
 *   - Unilet Admin: only the modules in its `groups`. Its permission list is set to exactly these,
 *     so anything else on that role is removed.
 * Safe to run again: existing permissions (same module, slug or name) are reused and roles are
 * created only once.
 *
 * Usage:
 *   node scripts/seedUniletPermissions.js
 *   npm run seed:allPermission
 */

const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

// Top-level menu labels in lib/adminModules.js whose permissions are seeded but never given to any role.
const PERMISSION_ONLY_GROUPS = ["Product", "Category"];

// groups: top-level menu labels whose modules the role gets (null = every seeded module).
// exact: true sets the role to exactly these permissions; false only adds missing ones.
const ROLES = [
  {
    name: "Admin",
    slug: "admin",
    description: "All admin modules except Product and Category",
    groups: null,
    exact: false,
  },
  {
    name: "Unilet Admin",
    slug: "unilet-admin",
    description: "Unilet store admin: Sales, Unilet Products, New Unilet Product and Stores",
    groups: ["Sales", "Unilet Products", "New Unilet Product", "Stores"],
    exact: true,
  },
];

// Same collections Mongoose uses for the ecom_permissions_info / ecom_roles_info models.
const PERMISSIONS_COLLECTION = "ecom_permissions_infos";
const ROLES_COLLECTION = "ecom_roles_infos";

// lib/adminModules.js is an ES module with no imports, so load it as a data: URL module from this CommonJS script.
async function loadAdminMenuItems() {
  const source = fs.readFileSync(path.resolve(__dirname, "..", "lib", "adminModules.js"), "utf8");
  const mod = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
  return mod.adminMenuItems;
}

// module = permission key from lib/adminModules.js (what hasPermission() checks); group = top-level menu label.
async function getSeedPermissions() {
  const items = await loadAdminMenuItems();
  const list = [];

  for (const item of items) {
    if (item.link) {
      list.push({ name: item.label, module: item.permission || item.link, group: item.label });
    }
    for (const sub of item.submenu || []) {
      list.push({ name: `${item.label} / ${sub.label}`, module: sub.permission || sub.link, group: item.label });
    }
  }

  return list;
}

function getMongoUri() {
  const envFiles = [".env", ".env.local"];
  for (const file of envFiles) {
    const fullPath = path.resolve(process.cwd(), file);
    if (!fs.existsSync(fullPath)) continue;
    const lines = fs.readFileSync(fullPath, "utf8").split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("#") || !trimmed) continue;
      if (trimmed.startsWith("MONGODB_URI=")) {
        const val = trimmed.replace(/^MONGODB_URI=/, "").trim();
        return val.replace(/^["']|["']$/g, "");
      }
    }
  }
  throw new Error("❌ Active MONGODB_URI not found in .env or .env.local");
}

// Same slug rule as app/api/permissions/add/route.js
function createSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Returns [{ id, group }] for every seeded module, reusing existing permissions.
async function seedPermissions(db, seedList) {
  const permissions = db.collection(PERMISSIONS_COLLECTION);
  const seeded = [];

  for (const item of seedList) {
    const slug = createSlug(item.name);
    const existing = await permissions.findOne({
      $or: [{ module: item.module }, { slug }, { name: item.name }],
    });

    if (existing) {
      const note = existing.module === item.module ? "" : ` (module is "${existing.module || ""}")`;
      console.log(`⏭️  Permission exists: ${existing.name}${note}`);
      seeded.push({ id: existing._id, group: item.group });
      continue;
    }

    const now = new Date();
    const { insertedId } = await permissions.insertOne({
      name: item.name,
      slug,
      module: item.module,
      description: "",
      status: "Active",
      createdAt: now,
      updatedAt: now,
      __v: 0,
    });
    console.log(`✅ Permission created: ${item.name} → module "${item.module}"`);
    seeded.push({ id: insertedId, group: item.group });
  }

  return seeded;
}

function uniqueIds(ids) {
  const seen = new Set();
  return ids.filter((id) => {
    const key = String(id);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function seedRole(db, role, seeded) {
  const roles = db.collection(ROLES_COLLECTION);
  const permissionIds = uniqueIds(
    seeded
      .filter((p) => !PERMISSION_ONLY_GROUPS.includes(p.group))
      .filter((p) => !role.groups || role.groups.includes(p.group))
      .map((p) => p.id)
  );
  const existing = await roles.findOne({ $or: [{ slug: role.slug }, { name: role.name }] });

  if (!existing) {
    const now = new Date();
    await roles.insertOne({
      name: role.name,
      slug: role.slug,
      description: role.description,
      permissions: permissionIds,
      createdAt: now,
      updatedAt: now,
      __v: 0,
    });
    console.log(`✅ Role created: ${role.name} with ${permissionIds.length} permissions`);
    return;
  }

  const current = (existing.permissions || []).map((id) => String(id));
  const wanted = new Set(permissionIds.map((id) => String(id)));

  if (role.exact) {
    const removed = current.filter((id) => !wanted.has(id)).length;
    const added = permissionIds.filter((id) => !current.includes(String(id))).length;
    if (removed === 0 && added === 0) {
      console.log(`⏭️  Role exists: ${existing.name} already has exactly ${permissionIds.length} permissions`);
      return;
    }
    await roles.updateOne(
      { _id: existing._id },
      { $set: { permissions: permissionIds, description: role.description, updatedAt: new Date() } }
    );
    console.log(`✅ Role updated: ${existing.name} → ${permissionIds.length} permissions (+${added}, -${removed})`);
    return;
  }

  const missing = permissionIds.filter((id) => !current.includes(String(id)));
  if (missing.length === 0) {
    console.log(`⏭️  Role exists: ${existing.name} already has all seeded permissions`);
    return;
  }
  await roles.updateOne(
    { _id: existing._id },
    { $addToSet: { permissions: { $each: missing } }, $set: { updatedAt: new Date() } }
  );
  console.log(`✅ Role updated: ${existing.name} +${missing.length} permissions`);
}

async function main() {
  const uri = getMongoUri();
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 20000, family: 4 });
  console.log(`🔌 Connected: ${mongoose.connection.name}`);

  const seedList = await getSeedPermissions();
  console.log(`📋 ${seedList.length} modules to seed (permission only, no role: ${PERMISSION_ONLY_GROUPS.join(", ")})`);

  const db = mongoose.connection.db;
  const seeded = await seedPermissions(db, seedList);
  for (const role of ROLES) {
    await seedRole(db, role, seeded);
  }

  console.log("🎉 Permission seeding finished");
}

main()
  .catch((err) => {
    console.error("❌ Seeder failed:", err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
