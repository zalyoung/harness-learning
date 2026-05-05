const fs = require('fs');
const path = require('path');
const { graphqlQuery, fetchTopProducts, validateSchema } = require('./fetch');

const OUTPUT_FILE = path.join(__dirname, '..', 'producthunt-daily.json');

async function smokeTest() {
  console.log('=== ProductHunt Daily Smoke Test ===\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✓ ${message}`);
      passed++;
    } else {
      console.error(`✗ ${message}`);
      failed++;
    }
  }

  // Test 1: GraphQL API works
  console.log('\n1. Testing GraphQL API...');
  try {
    const data = await graphqlQuery('{ posts(first: 1) { edges { node { name } } } }');
    assert(data.posts && data.posts.edges, 'GraphQL API responds correctly');
  } catch (error) {
    assert(false, `GraphQL API failed: ${error.message}`);
  }

  // Test 2: fetchTopProducts returns products
  console.log('\n2. Testing fetchTopProducts...');
  try {
    const products = await fetchTopProducts(3);
    assert(Array.isArray(products), 'Returns array');
    assert(products.length === 3, `Got ${products.length} products`);

    if (products.length > 0) {
      const first = products[0];
      assert(typeof first.name === 'string' && first.name.length > 0, `Name: "${first.name}"`);
      assert(typeof first.description === 'string', `Description is string`);
      assert(typeof first.upvote === 'number' && first.upvote > 0, `Upvote: ${first.upvote}`);
      assert(typeof first.reviews_star === 'number', `Reviews star is number`);
      assert(typeof first.website_url === 'string', `Website URL is string`);
    }
  } catch (error) {
    assert(false, `fetchTopProducts failed: ${error.message}`);
  }

  // Test 3: validateSchema works
  console.log('\n3. Testing schema validation...');
  const valid = [{ name: 'Test', description: 'Desc', upvote: 100, reviews_star: 4.5, website_url: 'https://example.com' }];
  assert(validateSchema(valid).length === 0, 'Valid data passes');

  const invalid = [{ name: 123 }];
  assert(validateSchema(invalid).length > 0, 'Invalid data fails');

  // Test 4: Output file
  console.log('\n4. Testing output file...');
  if (fs.existsSync(OUTPUT_FILE)) {
    const data = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
    assert(Array.isArray(data) && data.length > 0, `Output has ${data.length} products`);

    const hasVotes = data.some(p => p.upvote > 0);
    assert(hasVotes, 'Products have upvote data');
  } else {
    console.log('  (Run npm run fetch first)');
  }

  // Summary
  console.log('\n=== Test Summary ===');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) process.exit(1);
}

if (require.main === module) {
  smokeTest().catch(error => {
    console.error('Smoke test failed:', error);
    process.exit(1);
  });
}

module.exports = smokeTest;
