const express = require("express");
const path = require("path");
const { findNearbyActivities, findLocation } = require("./locationModule");

const app = express();

function getPrice(activity) {
  if (typeof activity.price === 'number') return activity.price;
  if (activity.cost === 'cheap') return 5;
  if (activity.cost === 'medium') return 20;
  if (activity.cost === 'expensive') return 40;
  return 20;
}

function matchesActivityType(activity, activityType) {
  const requested = (activityType || '').toLowerCase();
  const type = (activity.type || '').toLowerCase();
  const category = (activity.category || '').toLowerCase();

  if (!requested) return true;
  if (type.includes(requested) || category.includes(requested)) return true;

  switch (requested) {
    case 'outdoor':
      return category === 'outdoor' || ['park', 'garden', 'viewpoint', 'miniature_golf'].includes(type);
    case 'food':
      return category === 'food' || ['restaurant', 'fast_food', 'cafe', 'bar'].includes(type);
    case 'cultural':
      return category === 'cultural' || type === 'museum';
    case 'educational':
      return category === 'cultural' || type === 'museum';
    case 'entertainment':
      return category === 'entertainment' || ['bar', 'cafe', 'restaurant', 'miniature_golf', 'viewpoint'].includes(type);
    case 'indoor':
      return ['museum', 'restaurant', 'cafe', 'bar', 'fast_food'].includes(type);
    default:
      return false;
  }
}

// serve static files from public and webapp folders
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "webapp")));

// make main.html accessible directly
app.get("/main.html", (req, res) => {
  res.sendFile(path.join(__dirname, "webapp", "main.html"));
});

// optional root to main page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "webapp", "main.html"));
});

// activity search by city (existing route)
app.get("/activities", async (req, res) => {
  const city = req.query.city;

  if (!city) {
    return res.json({ error: "Please provide a city like ?city=Tokyo" });
  }

  try {
    const activities = await findNearbyActivities(city);
    res.json(activities);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// location-based activity search, supports {city} or {lat,lon}
app.get("/findLocation", async (req, res) => {
  const { city, lat, lon, cost = 'any', groupSize, state, country, activityType, duration, rating } = req.query;

  try {
    const activities = await findLocation({ city, lat: lat ? Number(lat) : null, lon: lon ? Number(lon) : null, state, country });

    let filtered = activities;

    // Cost filter
    if (cost && cost !== 'any') {
      if (cost === 'free') {
        filtered = filtered.filter((activity) => getPrice(activity) === 0);
      } else if (cost === '$0-$10') {
        filtered = filtered.filter((activity) => {
          const price = getPrice(activity);
          return price >= 0 && price <= 10;
        });
      } else if (cost === '$10-$25') {
        filtered = filtered.filter((activity) => {
          const price = getPrice(activity);
          return price >= 10 && price <= 25;
        });
      } else if (cost === '$25-$50') {
        filtered = filtered.filter((activity) => {
          const price = getPrice(activity);
          return price >= 25 && price <= 50;
        });
      } else if (cost === '$50+') {
        filtered = filtered.filter((activity) => getPrice(activity) > 50);
      } else {
        filtered = filtered.filter((activity) => activity.cost === cost);
      }
    }

    // Group size filter
    if (groupSize) {
      if (groupSize === '1-2') {
        filtered = filtered.filter((activity) => activity.groupMax >= 1 && activity.groupMax <= 2);
      } else if (groupSize === '3-5') {
        filtered = filtered.filter((activity) => activity.groupMax >= 3 && activity.groupMax <= 5);
      } else if (groupSize === '6-10') {
        filtered = filtered.filter((activity) => activity.groupMax >= 6 && activity.groupMax <= 10);
      } else if (groupSize === '10+') {
        filtered = filtered.filter((activity) => activity.groupMax >= 10);
      } else {
        const numericGroup = Number(groupSize);
        if (!isNaN(numericGroup)) {
          filtered = filtered.filter((activity) => activity.groupMax >= numericGroup);
        }
      }
    }

    // Activity type filter
    if (activityType) {
      filtered = filtered.filter((activity) => matchesActivityType(activity, activityType));
    }

    // Duration filter
    if (duration) {
      filtered = filtered.filter((activity) => {
        if (typeof activity.duration !== 'number') return false;
        if (duration === 'short') return activity.duration < 60;
        if (duration === 'medium') return activity.duration >= 60 && activity.duration <= 180;
        if (duration === 'long') return activity.duration > 180;
        return false;
      });
    }

    // Rating filter
    if (rating) {
      const minRating = parseFloat(rating.replace('+', ''));
      filtered = filtered.filter((activity) => typeof activity.rating === 'number' && activity.rating >= minRating);
    }

    res.json(filtered);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// start server
app.listen(3000, () => {
  console.log("Server running on port 3000");
});