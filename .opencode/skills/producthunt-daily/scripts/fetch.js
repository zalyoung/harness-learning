const https = require('https');
const fs = require('fs');
const path = require('path');

const OUTPUT_FILE = path.join(__dirname, '..', 'producthunt-daily.json');
const SCHEMA_FILE = path.join(__dirname, '..', 'schema.json');
const TOKEN_FILE = path.join(__dirname, '..', '.token');

function getToken() {
  // Priority: env var > .token file
  if (process.env.PH_TOKEN) return process.env.PH_TOKEN;
  if (fs.existsSync(TOKEN_FILE)) return fs.readFileSync(TOKEN_FILE, 'utf8').trim();
  throw new Error('No token found. Set PH_TOKEN env var or create .token file');
}

function graphqlQuery(query) {
  return new Promise((resolve, reject) => {
    const token = getToken();
    const body = JSON.stringify({ query });

    const options = {
      hostname: 'api.producthunt.com',
      path: '/v2/api/graphql',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.errors) {
            reject(new Error(json.errors.map(e => e.message).join(', ')));
            return;
          }
          resolve(json.data);
        } catch (e) {
          reject(new Error(`Invalid JSON response: ${data.substring(0, 200)}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    req.write(body);
    req.end();
  });
}

async function fetchTopProducts(count = 10) {
  const query = `{
    posts(first: ${count}, order: VOTES) {
      edges {
        node {
          name
          tagline
          votesCount
          reviewsRating
          website
          url
        }
      }
    }
  }`;

  const data = await graphqlQuery(query);
  return data.posts.edges.map(edge => ({
    name: edge.node.name,
    description: edge.node.tagline || 'No description',
    upvote: edge.node.votesCount || 0,
    reviews_star: edge.node.reviewsRating || 0,
    website_url: edge.node.website || edge.node.url || ''
  }));
}

function validateSchema(products) {
  const schema = JSON.parse(fs.readFileSync(SCHEMA_FILE, 'utf8'));
  const errors = [];
  const requiredFields = schema.items ? schema.items.required : ['name', 'description', 'upvote', 'reviews_star', 'website_url'];

  if (!Array.isArray(products)) {
    errors.push('Output must be an array');
    return errors;
  }

  products.forEach((product, i) => {
    requiredFields.forEach(field => {
      if (!(field in product)) {
        errors.push(`Product ${i}: missing required field "${field}"`);
      }
    });

    if (typeof product.name !== 'string') errors.push(`Product ${i}: "name" must be a string`);
    if (typeof product.description !== 'string') errors.push(`Product ${i}: "description" must be a string`);
    if (typeof product.upvote !== 'number') errors.push(`Product ${i}: "upvote" must be a number`);
    if (typeof product.reviews_star !== 'number') errors.push(`Product ${i}: "reviews_star" must be a number`);
    if (typeof product.website_url !== 'string') errors.push(`Product ${i}: "website_url" must be a string`);
  });

  return errors;
}

async function main() {
  console.log('Fetching Product Hunt top 10 via GraphQL API...');
  const startTime = Date.now();

  try {
    const products = await fetchTopProducts(10);
    console.log(`Fetched ${products.length} products in ${Date.now() - startTime}ms`);

    // Show summary
    products.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.name} - ${p.upvote} votes, ${p.reviews_star} stars`);
    });

    const errors = validateSchema(products);
    if (errors.length > 0) {
      throw new Error(`Schema validation failed:\n${errors.join('\n')}`);
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(products, null, 2));
    console.log(`\nSaved to ${OUTPUT_FILE}`);
    console.log(`Total time: ${Date.now() - startTime}ms`);

    return products;
  } catch (error) {
    console.error('Failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { graphqlQuery, fetchTopProducts, validateSchema };
