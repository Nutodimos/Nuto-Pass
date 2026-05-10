// ============================================================
// config.h — WiFi & Server Configuration for ESP32
// ============================================================
#pragma once

// ── WiFi Credentials ────────────────────────────────────────
// TODO: Update these with your actual WiFi credentials
const char* ssid     = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// ── NTP Time Settings ───────────────────────────────────────
// TODO: Update gmtOffset for your timezone (in seconds)
// Example: WAT (West Africa Time) = +1 hour = 3600
const long  gmtOffset       = 3600;
const int   daylightOffset  = 0;

// ── Next.js Server Settings ─────────────────────────────────
// TODO: Update with your deployed Next.js URL
// For local dev: "http://192.168.x.x:3000"
// For production: "https://your-app.vercel.app"
const char* SERVER_URL    = "http://192.168.1.100:3000";
const char* DEVICE_SECRET = "your-device-secret-here";

// API endpoint path
const char* API_PATH = "/api/esp32";
