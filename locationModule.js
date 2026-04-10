const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));

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
  else query += ', USA'; // default to USA if no country

  const geoURL = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`;
  const geoResponse = await fetch(geoURL);
  const geoData = await geoResponse.json();

  if (!geoData.length) throw new Error('Location not found');
  return {
    lat: Number(geoData[0].lat),
    lon: Number(geoData[0].lon),
  };
}

async function findNearbyActivities(lat, lon) {
  if (lat == null || lon == null) throw new Error('Latitude and longitude are required');

  const overpassQuery = `
  [out:json];
  (
    node["leisure"="park"](around:5000,${lat},${lon});
    node["leisure"="garden"](around:5000,${lat},${lon});
    node["tourism"="viewpoint"](around:5000,${lat},${lon});
    node["leisure"="miniature_golf"](around:5000,${lat},${lon});
    node["amenity"="restaurant"](around:5000,${lat},${lon});
    node["amenity"="fast_food"](around:5000,${lat},${lon});
    node["amenity"="cafe"](around:5000,${lat},${lon});
    node["amenity"="bar"](around:5000,${lat},${lon});
  );
  out;
  `;

  let data;
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: overpassQuery,
    });
    const text = await response.text();

    try {
      data = JSON.parse(text);
      break;
    } catch (err) {
      if (attempt === 2) {
        console.log('Overpass failed after 3 attempts:', text);
        throw new Error('Activity search temporarily unavailable');
      }
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  function normalizePlace(place) {
    let type = 'activity';
    let cost = 'medium';
    let groupMax = 8;

    if (place.tags.leisure === 'park') {
      type = 'park';
      cost = 'cheap';
      groupMax = 30;
    }
    if (place.tags.leisure === 'garden') {
      type = 'garden';
      cost = 'cheap';
      groupMax = 20;
    }
    if (place.tags.tourism === 'viewpoint') {
      type = 'viewpoint';
      cost = 'cheap';
      groupMax = 15;
    }
    if (place.tags.tourism === 'museum') {
      type = 'museum';
      cost = 'medium';
      groupMax = 40;
    }
    if (place.tags.leisure === 'miniature_golf') {
      type = 'miniature_golf';
      cost = 'medium';
      groupMax = 20;
    }
    if (place.tags.amenity === 'restaurant') {
      type = 'restaurant';
      cost = 'expensive';
      groupMax = 50;
    }
    if (place.tags.amenity === 'fast_food') {
      type = 'fast_food';
      cost = 'cheap';
      groupMax = 10;
    }
    if (place.tags.amenity === 'cafe') {
      type = 'cafe';
      cost = 'medium';
      groupMax = 12;
    }
    if (place.tags.amenity === 'bar' || place.tags.amenity === 'pub') {
      type = 'bar';
      cost = 'medium';
      groupMax = 20;
    }

    return {
      name: place.tags.name,
      type,
      cost,
      groupMax,
      lat: place.lat,
      lon: place.lon,
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
