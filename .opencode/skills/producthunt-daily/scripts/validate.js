const fs = require('fs');
const path = require('path');

const OUTPUT_FILE = path.join(__dirname, '..', 'producthunt-daily.json');
const SCHEMA_FILE = path.join(__dirname, '..', 'schema.json');

function validate() {
  if (!fs.existsSync(OUTPUT_FILE)) {
    console.error('Error: producthunt-daily.json not found. Run fetch.js first.');
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
  const schema = JSON.parse(fs.readFileSync(SCHEMA_FILE, 'utf8'));
  const errors = [];

  if (!Array.isArray(data)) {
    errors.push('Output must be an array');
  } else {
    if (data.length < schema.minItems) {
      errors.push(`Array must have at least ${schema.minItems} item`);
    }
    if (data.length > schema.maxItems) {
      errors.push(`Array must have at most ${schema.maxItems} items`);
    }

    data.forEach((product, i) => {
      schema.items.required.forEach(field => {
        if (!(field in product)) {
          errors.push(`Product ${i}: missing required field "${field}"`);
        }
      });

      const props = schema.items.properties;
      Object.keys(props).forEach(field => {
        if (field in product) {
          const expected = props[field].type;
          const actual = typeof product[field];
          if (expected === 'integer' && !Number.isInteger(product[field])) {
            errors.push(`Product ${i}: "${field}" must be an integer`);
          } else if (expected === 'number' && actual !== 'number') {
            errors.push(`Product ${i}: "${field}" must be a number`);
          } else if (expected === 'string' && actual !== 'string') {
            errors.push(`Product ${i}: "${field}" must be a string`);
          }
        }
      });
    });
  }

  if (errors.length > 0) {
    console.error('Validation failed:');
    errors.forEach(e => console.error(`  - ${e}`));
    process.exit(1);
  }

  console.log('Validation passed');
  console.log(`  Products: ${data.length}`);
  console.log(`  All required fields present`);
  console.log(`  All types correct`);
}

if (require.main === module) {
  validate();
}

module.exports = validate;
