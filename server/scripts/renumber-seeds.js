const fs = require('fs');
const path = require('path');

// ───────────────────────────────────────────────────────────
// CONFIG: only tell the script where each file should go.
// Order is inferred from the original development folder.
// ───────────────────────────────────────────────────────────

const SERVER_ROOT  = path.resolve(__dirname, '..');
const SEEDS_DIR    = path.join(SERVER_ROOT, 'src', 'database', 'seeds');
const ORIGINAL_DIR = path.join(SEEDS_DIR, 'development');

// Map: base filename (without numeric prefix) → target folder
const categoryOf = {
  // ─── reference ────────────────────────────────────────────
  'status.js':                       'reference',
  'roles.js':                        'reference',
  'users.js':                        'reference',
  'permissions.js':                  'reference',
  'role_permissions.js':             'reference',
  'sku_code_bases.js':               'reference',
  'location_types.js':               'reference',
  'locations.js':                    'reference',
  'pricing_types.js':                'reference',
  'pricing_groups.js':               'reference',
  'warehouse_type.js':               'reference',
  'batch_status.js':                 'reference',
  'inventory_status.js':             'reference',
  'inventory_action_types.js':       'reference',
  'lot_adjustment_types.js':         'reference',
  'order_types.js':                  'reference',
  'order_status.js':                 'reference',
  'tax_rates.js':                    'reference',
  'delivery_methods.js':             'reference',
  'inventory_allocation_status.js':  'reference',
  'auth_action_types.js':            'reference',
  'payment_methods.js':              'reference',
  'payment_status.js':               'reference',
  'fulfillment_status.js':           'reference',
  'shipment_status.js':              'reference',
  'transfer_order_item_status.js':   'reference',
  'batch_activity_types.js':         'reference',
  
  // ─── core ─────────────────────────────────────────────────
  'users_dummy_1.js':                'core',
  'user_auth.js':                    'core',
  'parts.js':                        'core',
  'products.js':                     'core',
  'boms.js':                         'core',
  'packaging_materials.js':          'core',
  'part_materials.js':               'core',
  'compliance_records_and_links.js': 'core',
  'pricing.js':                      'core',
  'bom_items.js':                    'core',
  'manufacturers.js':                'core',
  'suppliers.js':                    'core',
  'warehouses.js':                   'core',
  'packaging_material_suppliers.js': 'core',
  'product_batches.js':              'core',
  'packaging_material_batches.js':   'core',
  'batch_registry.js':               'core',
  'packaging_materials_inventory.js':'core',
  'products_inventory.js':           'core',
  'discounts.js':                    'core',
  'sku_images.js':                   'core',
  'customers.js':                    'core',
  'addresses.js':                    'core',
  'bom_item_materials.js':           'core',
  'user_images.js':                  'core',
};

// ─── Numbering ranges per folder ────────────────────────────
const RANGE_START = { reference: 1, core: 100 };
const PAD = 3;

// ─── Helpers ────────────────────────────────────────────────
const stripPrefix = (name) => name.replace(/^\d+_/, '');
const pad = (n) => String(n).padStart(PAD, '0');

// ─── Build target plan from original folder order ───────────
const originals = fs.readdirSync(ORIGINAL_DIR)
  .filter(f => f.endsWith('.js'))
  .sort();  // alphabetical = numeric order since they're all prefixed

const plan = { reference: [], core: [] };
const missing = [];

for (const filename of originals) {
  const base = stripPrefix(filename);
  const cat  = categoryOf[base];
  if (!cat) {
    missing.push(filename);
    continue;
  }
  plan[cat].push(base);
}

if (missing.length) {
  console.warn('⚠️  Files in original folder but not in categoryOf map:');
  missing.forEach(f => console.warn(`     ${f}`));
  console.warn('   Add them to categoryOf or confirm they should be skipped.\n');
}

// ─── Apply the plan ─────────────────────────────────────────
for (const folder of ['reference', 'core']) {
  const dir = path.join(SEEDS_DIR, folder);
  if (!fs.existsSync(dir)) {
    console.error(`✗  Folder does not exist: ${dir}`);
    process.exit(1);
  }
  
  const existing = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
  const startNum = RANGE_START[folder];
  
  // Step 1: temp-rename to avoid collisions
  for (const f of existing) {
    fs.renameSync(path.join(dir, f), path.join(dir, `TEMP_${f}`));
  }
  
  // Step 2: rename to final names in plan order
  plan[folder].forEach((base, idx) => {
    const num = pad(startNum + idx);
    const newName = `${num}_${base}`;
    const tempFile = fs.readdirSync(dir).find(f => f.endsWith(`_${base}`));
    
    if (!tempFile) {
      console.warn(`⚠️  Expected ${base} in ${folder}/ but it's not there. Skipping.`);
      return;
    }
    
    fs.renameSync(path.join(dir, tempFile), path.join(dir, newName));
    console.log(`✓  ${folder}/${newName}`);
  });
  
  // Step 3: warn about leftovers
  const leftovers = fs.readdirSync(dir).filter(f => f.startsWith('TEMP_'));
  if (leftovers.length) {
    console.warn(`⚠️  In ${folder}/, these files weren't in the plan:`);
    leftovers.forEach(f => console.warn(`     ${f.replace('TEMP_', '')}`));
  }
}

console.log('\nDone.');
