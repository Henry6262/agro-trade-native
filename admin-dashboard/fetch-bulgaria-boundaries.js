import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Color mapping for Bulgarian regions
const colorMap = {
  'BG31': '#4CAF50',  // North-Western - Green
  'BG32': '#2196F3',  // North-Central - Blue
  'BG33': '#FF9800',  // North-Eastern - Orange
  'BG34': '#9C27B0',  // South-Eastern - Purple
  'BG41': '#F44336',  // South-Western - Red
  'BG42': '#00BCD4',  // South-Central - Cyan
};

// English names for Bulgarian regions
const englishNames = {
  'BG31': 'North-Western',
  'BG32': 'North-Central',
  'BG33': 'North-Eastern',
  'BG34': 'South-Eastern',
  'BG41': 'South-Western',
  'BG42': 'South-Central',
};

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      let data = '';

      response.on('data', (chunk) => {
        data += chunk;
      });

      response.on('end', () => {
        if (response.statusCode === 200) {
          resolve(data);
        } else {
          reject(new Error(`HTTP error! status: ${response.statusCode}`));
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

async function fetchBulgariaBoundaries() {
  console.log('🌍 Fetching European NUTS-2 boundaries from Eurostat GISCO...');

  const url = 'https://gisco-services.ec.europa.eu/distribution/v2/nuts/geojson/NUTS_RG_03M_2024_4326_LEVL_2.geojson';

  try {
    const responseData = await fetchUrl(url);
    console.log('✅ Downloaded European NUTS-2 data');

    const allNutsData = JSON.parse(responseData);
    console.log(`📊 Total NUTS-2 regions in Europe: ${allNutsData.features.length}`);

    // Filter for Bulgarian regions only (CNTR_CODE === 'BG')
    const bulgarianRegions = allNutsData.features.filter(feature => {
      return feature.properties.CNTR_CODE === 'BG';
    });

    console.log(`🇧🇬 Filtered Bulgarian NUTS-2 regions: ${bulgarianRegions.length}`);

    // Add color coding and English names
    bulgarianRegions.forEach(feature => {
      const nutsId = feature.properties.NUTS_ID;
      feature.properties.color = colorMap[nutsId] || '#666666';
      feature.properties.NAME_EN = englishNames[nutsId] || nutsId;
    });

    // Create output GeoJSON
    const outputGeoJSON = {
      type: 'FeatureCollection',
      features: bulgarianRegions
    };

    // Ensure public/data directory exists
    const publicDataDir = path.join(__dirname, 'public', 'data');
    if (!fs.existsSync(publicDataDir)) {
      fs.mkdirSync(publicDataDir, { recursive: true });
      console.log('📁 Created public/data directory');
    }

    // Save to public/data/bulgaria-nuts2.geojson
    const outputPath = path.join(publicDataDir, 'bulgaria-nuts2.geojson');
    fs.writeFileSync(outputPath, JSON.stringify(outputGeoJSON, null, 2));

    const fileSizeKB = (fs.statSync(outputPath).size / 1024).toFixed(2);
    console.log(`✅ Saved Bulgarian boundaries to ${outputPath}`);
    console.log(`📦 File size: ${fileSizeKB} KB`);

    // List the regions saved
    console.log('\n📋 Regions saved:');
    bulgarianRegions.forEach(feature => {
      const props = feature.properties;
      console.log(`   ${props.NUTS_ID}: ${props.NAME_EN} (${props.NUTS_NAME})`);
    });

    return outputPath;
  } catch (error) {
    console.error('❌ Error fetching Bulgaria boundaries:', error);
    throw error;
  }
}

// Run the script
fetchBulgariaBoundaries()
  .then(path => {
    console.log('\n🎉 Successfully fetched and saved Bulgarian NUTS-2 boundaries!');
    console.log(`   Use this file in your map component: /data/bulgaria-nuts2.geojson`);
  })
  .catch(error => {
    console.error('\n💥 Failed to fetch boundaries:', error.message);
    process.exit(1);
  });
