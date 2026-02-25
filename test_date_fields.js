const { 
  getAllUniqueDateFields, 
  addDefaultDateFieldsToProducts,
  formatPlanDate 
} = require('./src/utils/getPrdPlan');

// Test data similar to the example provided
const testProducts = [
  {
    "item_code": "10010101036    ",
    "item_name": "ฟ้าไทยผงปรุงหมู 165g 6แถม1",
    "blfplus": null,
    "bl12t": 695,
    "wh_111": 695,
    "wh_109": null,
    "wh_106": null,
    "wh_105": null,
    "wh_104": null,
    "wh_103": null,
    "wh_102": null,
    "wh_101": null
  },
  {
    "item_code": "10010101050    ",
    "item_name": "ฟ้าไทยผงปรุงหมู 1500g",
    "blfplus": null,
    "bl12t": 1591,
    "wh_111": 143,
    "wh_109": 374,
    "wh_106": 323,
    "wh_105": 312,
    "wh_104": 67,
    "wh_103": 230,
    "wh_102": 142,
    "wh_101": null,
    "13-jul": "0",
    "14-jul": "0",
    "15-jul": "0",
    "16-jul": "0",
    "17-jul": "0",
    "18-jul": "0",
    "19-jul": "770"
  }
];

// Test data with prd_plan_data
const testProductsWithPrdData = [
  {
    "item_code": "10010101036    ",
    "item_name": "ฟ้าไทยผงปรุงหมู 165g 6แถม1",
    "blfplus": null,
    "bl12t": 695,
    "wh_111": 695,
    "wh_109": null,
    "wh_106": null,
    "wh_105": null,
    "wh_104": null,
    "wh_103": null,
    "wh_102": null,
    "wh_101": null,
    "prd_plan_data": [
      { "plan_date": "13-jul", "plat_count": "0" },
      { "plan_date": "14-jul", "plat_count": "0" },
      { "plan_date": "15-jul", "plat_count": "0" },
      { "plan_date": "16-jul", "plat_count": "0" },
      { "plan_date": "17-jul", "plat_count": "0" },
      { "plan_date": "18-jul", "plat_count": "0" },
      { "plan_date": "19-jul", "plat_count": "0" }
    ]
  },
  {
    "item_code": "10010101050    ",
    "item_name": "ฟ้าไทยผงปรุงหมู 1500g",
    "blfplus": null,
    "bl12t": 1591,
    "wh_111": 143,
    "wh_109": 374,
    "wh_106": 323,
    "wh_105": 312,
    "wh_104": 67,
    "wh_103": 230,
    "wh_102": 142,
    "wh_101": null,
    "13-jul": "0",
    "14-jul": "0",
    "15-jul": "0",
    "16-jul": "0",
    "17-jul": "0",
    "18-jul": "0",
    "19-jul": "770",
    "prd_plan_data": [
      { "plan_date": "13-jul", "plat_count": "0" },
      { "plan_date": "14-jul", "plat_count": "0" },
      { "plan_date": "15-jul", "plat_count": "0" },
      { "plan_date": "16-jul", "plat_count": "0" },
      { "plan_date": "17-jul", "plat_count": "0" },
      { "plan_date": "18-jul", "plat_count": "0" },
      { "plan_date": "19-jul", "plat_count": "770" }
    ]
  }
];

console.log('=== Testing Date Fields Functionality ===\n');

// Test 1: Extract unique date fields
console.log('1. Testing getAllUniqueDateFields:');
const uniqueDateFields = getAllUniqueDateFields(testProducts);
console.log('Unique date fields found:', uniqueDateFields);
console.log('Expected: ["13-jul", "14-jul", "15-jul", "16-jul", "17-jul", "18-jul", "19-jul"]');
console.log('');

// Test 2: Add default date fields to products
console.log('2. Testing addDefaultDateFieldsToProducts:');
const enrichedProducts = addDefaultDateFieldsToProducts(testProducts, uniqueDateFields);
console.log('Products after adding default date fields:');
enrichedProducts.forEach((product, index) => {
  console.log(`Product ${index + 1} (${product.item_code.trim()}):`);
  console.log('  Date fields:', Object.keys(product).filter(key => key.match(/^\d{1,2}-[a-z]{3}$/i)));
  console.log('  Sample date values:');
  uniqueDateFields.slice(0, 3).forEach(dateField => {
    console.log(`    ${dateField}: "${product[dateField]}"`);
  });
  console.log('');
});

// Test 3: Test with products that have prd_plan_data
console.log('3. Testing with products that have prd_plan_data:');
const enrichedProductsWithPrdData = addDefaultDateFieldsToProducts(testProductsWithPrdData);
console.log('Products with prd_plan_data after adding default date fields:');
enrichedProductsWithPrdData.forEach((product, index) => {
  console.log(`Product ${index + 1} (${product.item_code.trim()}):`);
  console.log('  Date fields:', Object.keys(product).filter(key => key.match(/^\d{1,2}-[a-z]{3}$/i)));
  console.log('  Sample date values:');
  uniqueDateFields.slice(0, 3).forEach(dateField => {
    console.log(`    ${dateField}: "${product[dateField]}"`);
  });
  console.log('');
});

// Test 4: Test formatPlanDate function
console.log('4. Testing formatPlanDate function:');
const testDates = ['13072025', '14072025', '15072025', '16072025', '17072025', '18072025', '19072025'];
testDates.forEach(date => {
  const formatted = formatPlanDate(date);
  console.log(`  ${date} -> ${formatted}`);
});

console.log('\n=== Test Completed ===');
console.log('All products should now have the required date fields with "0" as default values.'); 