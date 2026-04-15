const fetch = globalThis.fetch
  ? (...args) => globalThis.fetch(...args)
  : (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const defaultFetchHeaders = {
  'Accept': 'application/json',
  'User-Agent': 'PopularPasttimes/1.0 (+https://popularpasttimes.web.app)',
  'Referer': 'https://popularpasttimes.web.app/'
};

// US state abbreviation mapping
const stateAbbreviations = {
  'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
  'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
  'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho',
  'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas',
  'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
  'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi',
  'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada',
  'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
  'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma',
  'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
  'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah',
  'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia',
  'WI': 'Wisconsin', 'WY': 'Wyoming', 'DC': 'District of Columbia'
};

// Normalize state abbreviations to full names
function normalizeState(state) {
  if (!state) return state;
  const trimmed = state.trim().toUpperCase();
  return stateAbbreviations[trimmed] || state; // Return full name if abbreviation exists, else return original
}

async function geocodeCity(city, state, country) {
  let query = city;
  if (state) query += ', ' + normalizeState(state);
  if (country) query += ', ' + country;
  else query += ', USA';

  const geoURL = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`;
  const geoResponse = await fetch(geoURL, {
    headers: {
      ...defaultFetchHeaders,
      'Content-Type': 'application/json'
    }
  });
  const geoText = await geoResponse.text();

  let geoData;
  try {
    geoData = JSON.parse(geoText);
  } catch (err) {
    throw new Error(`Geocoding service returned invalid response: ${geoText.substring(0, 200)}`);
  }

  if (!Array.isArray(geoData) || !geoData.length) {
    const message = (!geoResponse.ok && geoData && typeof geoData === 'object')
      ? (geoData.error || geoData.message || geoText)
      : geoText;
    if (!geoResponse.ok) {
      throw new Error(`Geocoding failed (${geoResponse.status}): ${message}`);
    }
    throw new Error('Location not found');
  }

  return {
    lat: Number(geoData[0].lat),
    lon: Number(geoData[0].lon),
  };
}

async function findNearbyActivities(lat, lon) {
  if (lat == null || lon == null) throw new Error('Latitude and longitude are required');

  const overpassQuery = `
  [out:json][timeout:25][maxsize:1073741824];
  (
    node["leisure"="park"](around:3000,${lat},${lon});
    way["leisure"="park"](around:3000,${lat},${lon});
    rel["leisure"="park"](around:3000,${lat},${lon});
    node["leisure"="garden"](around:3000,${lat},${lon});
    way["leisure"="garden"](around:3000,${lat},${lon});
    rel["leisure"="garden"](around:3000,${lat},${lon});
    node["tourism"="viewpoint"](around:3000,${lat},${lon});
    way["tourism"="viewpoint"](around:3000,${lat},${lon});
    rel["tourism"="viewpoint"](around:3000,${lat},${lon});
    node["tourism"="museum"](around:3000,${lat},${lon});
    way["tourism"="museum"](around:3000,${lat},${lon});
    rel["tourism"="museum"](around:3000,${lat},${lon});
    node["leisure"="miniature_golf"](around:3000,${lat},${lon});
    way["leisure"="miniature_golf"](around:3000,${lat},${lon});
    rel["leisure"="miniature_golf"](around:3000,${lat},${lon});
    node["amenity"="restaurant"](around:3000,${lat},${lon});
    way["amenity"="restaurant"](around:3000,${lat},${lon});
    rel["amenity"="restaurant"](around:3000,${lat},${lon});
    node["amenity"="fast_food"](around:3000,${lat},${lon});
    way["amenity"="fast_food"](around:3000,${lat},${lon});
    rel["amenity"="fast_food"](around:3000,${lat},${lon});
    node["amenity"="cafe"](around:3000,${lat},${lon});
    way["amenity"="cafe"](around:3000,${lat},${lon});
    rel["amenity"="cafe"](around:3000,${lat},${lon});
    node["amenity"="bar"](around:3000,${lat},${lon});
    way["amenity"="bar"](around:3000,${lat},${lon});
    rel["amenity"="bar"](around:3000,${lat},${lon});
    node["amenity"="pub"](around:3000,${lat},${lon});
    way["amenity"="pub"](around:3000,${lat},${lon});
    rel["amenity"="pub"](around:3000,${lat},${lon});
  );
  out center qt;
  `;

  const overpassEndpoints = [
    'https://lz4.overpass-api.de/api/interpreter',
    'https://overpass-api.de/api/interpreter',
    'https://overpass.openstreetmap.fr/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter'
  ];

  const headers = {
    'Content-Type': 'text/plain',
    'Accept': 'application/json',
    'User-Agent': 'PopularPasttimes/1.0 (+https://popularpasttimes.web.app)',
    'Referer': 'https://popularpasttimes.web.app/'
  };

  let data;
  const errors = [];
  const queryPayload = overpassQuery.trim();
  const queryString = `data=${encodeURIComponent(queryPayload)}`;

  for (let attempt = 0; attempt < 8; attempt++) {
    const endpoint = overpassEndpoints[attempt % overpassEndpoints.length];
    const usePost = attempt % 2 === 0;
    const requestUrl = usePost ? endpoint : `${endpoint}?${queryString}`;

    try {
      const response = await fetch(requestUrl, usePost ? {
        method: 'POST',
        headers,
        body: queryPayload,
      } : {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'User-Agent': headers['User-Agent'],
          Referer: headers.Referer,
        },
      });

      const text = await response.text();
      if (!response.ok) {
        throw new Error(`Overpass ${response.status} ${response.statusText}: ${text.substring(0, 200)}`);
      }

      try {
        data = JSON.parse(text);
      } catch (err) {
        throw new Error(`Overpass returned invalid JSON: ${text.substring(0, 200)}`);
      }

      if (!data || !Array.isArray(data.elements)) {
        throw new Error(`Overpass returned unexpected response format: ${text.substring(0, 200)}`);
      }
      break;
    } catch (err) {
      errors.push(`${endpoint} (${usePost ? 'POST' : 'GET'}) -> ${err.message}`);
      if (attempt === 7) {
        console.error('Overpass failed after 8 attempts:', errors.join(' | '));
        throw new Error('Activity search temporarily unavailable. Please try again later.');
      }
      await new Promise((r) => setTimeout(r, 1400));
    }
  }

  function normalizePlace(place) {
    let type = 'activity';
    let cost = 'medium';
    let groupMax = 8;
    let category = 'other';
    let price = 20;
    let duration = null;
    let rating = null;

    if (place.tags.leisure === 'park') {
      type = 'park';
      cost = 'cheap';
      groupMax = 30;
      category = 'outdoor';
      price = 0;
      duration = 90;
    }
    if (place.tags.leisure === 'garden') {
      type = 'garden';
      cost = 'cheap';
      groupMax = 20;
      category = 'outdoor';
      price = 0;
      duration = 90;
    }
    if (place.tags.tourism === 'viewpoint') {
      type = 'viewpoint';
      cost = 'cheap';
      groupMax = 15;
      category = 'outdoor';
      price = 0;
      duration = 45;
    }
    if (place.tags.tourism === 'museum') {
      type = 'museum';
      cost = 'medium';
      groupMax = 40;
      category = 'cultural';
      price = 15;
      duration = 120;
    }
    if (place.tags.leisure === 'miniature_golf') {
      type = 'miniature_golf';
      cost = 'medium';
      groupMax = 20;
      category = 'entertainment';
      price = 20;
      duration = 90;
    }
    if (place.tags.amenity === 'restaurant') {
      type = 'restaurant';
      cost = 'expensive';
      groupMax = 50;
      category = 'food';
      price = 30;
      duration = 90;
    }
    if (place.tags.amenity === 'fast_food') {
      type = 'fast_food';
      cost = 'cheap';
      groupMax = 10;
      category = 'food';
      price = 10;
      duration = 45;
    }
    if (place.tags.amenity === 'cafe') {
      type = 'cafe';
      cost = 'medium';
      groupMax = 12;
      category = 'food';
      price = 15;
      duration = 60;
    }
    if (place.tags.amenity === 'bar' || place.tags.amenity === 'pub') {
      type = 'bar';
      cost = 'medium';
      groupMax = 20;
      category = 'food';
      price = 20;
      duration = 90;
    }

    const location = {
      lat: typeof place.lat === 'number' ? place.lat : place.center?.lat,
      lon: typeof place.lon === 'number' ? place.lon : place.center?.lon,
    };

    return {
      name: place.tags.name,
      type,
      category,
      cost,
      price,
      groupMax,
      duration,
      rating,
      lat: location.lat,
      lon: location.lon,
    };
  }

  return (data.elements || [])
    .filter((place) => place.tags && place.tags.name)
    .map(normalizePlace)
    .slice(0, 30);
}
async function findLocation({ city, lat, lon, state, country }) {
  let co = { lat, lon };

  if (!co.lat || !co.lon) {
    if (!city) throw new Error('City or lat/lon required');
    co = await geocodeCity(city, state, country);
  }

  return findNearbyActivities(co.lat, co.lon);
}

module.exports = { findNearbyActivities, findLocation };
