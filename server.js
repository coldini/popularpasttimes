const express = require("express");
const path = require("path");
const { findNearbyActivities, findLocation } = require("./locationModule");

const app = express();

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
        filtered = filtered.filter((activity) => activity.cost === 'free' || activity.price === 0);
      } else if (cost === '$0-$10') {
        filtered = filtered.filter((activity) => activity.price >= 0 && activity.price <= 10);
      } else if (cost === '$10-$25') {
        filtered = filtered.filter((activity) => activity.price >= 10 && activity.price <= 25);
      } else if (cost === '$25-$50') {
        filtered = filtered.filter((activity) => activity.price >= 25 && activity.price <= 50);
      } else if (cost === '$50+') {
        filtered = filtered.filter((activity) => activity.price > 50);
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
      filtered = filtered.filter((activity) =>
        activity.type?.toLowerCase().includes(activityType.toLowerCase()) ||
        activity.category?.toLowerCase().includes(activityType.toLowerCase())
      );
    }

    // Duration filter
    if (duration) {
      if (duration === 'short') {
        filtered = filtered.filter((activity) => activity.duration && activity.duration < 60); // minutes
      } else if (duration === 'medium') {
        filtered = filtered.filter((activity) => activity.duration && activity.duration >= 60 && activity.duration <= 180);
      } else if (duration === 'long') {
        filtered = filtered.filter((activity) => activity.duration && activity.duration > 180);
      }
    }

    // Rating filter
    if (rating) {
      const minRating = parseFloat(rating.replace('+', ''));
      filtered = filtered.filter((activity) => activity.rating && activity.rating >= minRating);
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