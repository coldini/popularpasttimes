// public/location.js
// Shared location + mapping utilities for map.html and webapp/main.html

let map = null;
let markers = [];

function initMap(defaultLat = 35.68, defaultLon = 139.76, defaultZoom = 12) {
  if (map) return map;

  // Create the map with a default view
  map = L.map('map').setView([defaultLat, defaultLon], defaultZoom);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  return map;
}

function clearMarkers() {
  markers.forEach((marker) => map.removeLayer(marker));
  markers = [];
}

function renderMarkers(data, center) {
  if (!map) initMap();
  clearMarkers();

  if (center) {
    map.setView(center, 13);
  }

  if (!Array.isArray(data) || data.length === 0) {
    alert('No activities found around this location.');
    return;
  }

  data.forEach((place, index) => {
    const marker = L.marker([place.lat, place.lon])
      .addTo(map)
      .bindPopup(`<strong>${place.name}</strong><br>${place.type}`);

    markers.push(marker);

    if (index === 0 && !center) {
      map.setView([place.lat, place.lon], 13);
    }
  });
}

async function fetchActivities(params) {
  const query = new URLSearchParams(params);
  const response = await fetch(`/findLocation?${query.toString()}`);
  const data = await response.json();

  if (data.error) {
    throw new Error(data.error);
  }

  return data;
}

function getFilters() {
  const cost = document.getElementById('costFilter')?.value || 'any';
  const groupSize = document.getElementById('groupFilter')?.value || '';
  const state = document.getElementById('state')?.value?.trim() || '';
  const country = document.getElementById('country')?.value?.trim() || '';
  const activityType = document.getElementById('activityType')?.value || '';
  const duration = document.getElementById('duration')?.value || '';
  const rating = document.getElementById('rating')?.value || '';
  return { cost, groupSize, state, country, activityType, duration, rating };
}

async function searchByCity() {
  const city = document.getElementById('city')?.value?.trim();
  if (!city) return alert('Please enter a city');

  const { cost, groupSize, state, country } = getFilters();

  try {
    const data = await fetchActivities({ city, cost, groupSize, state, country });
    renderMarkers(data);
  } catch (err) {
    alert('Search failed: ' + err.message);
    console.error(err);
  }
}

function searchByGeolocation() {
  if (!navigator.geolocation) {
    alert('Geolocation is not supported by this browser.');
    return;
  }

  const { cost, groupSize } = getFilters();

  navigator.geolocation.getCurrentPosition(async (position) => {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;

    try {
      const data = await fetchActivities({ lat, lon, cost, groupSize });
      renderMarkers(data, [lat, lon]);
    } catch (err) {
      alert('Search failed: ' + err.message);
      console.error(err);
    }
  }, (err) => {
    alert('Could not access location: ' + err.message);
  });
}

window.initMap = initMap;
window.searchByCity = searchByCity;
window.searchByGeolocation = searchByGeolocation;
