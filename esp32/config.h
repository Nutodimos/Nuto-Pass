#ifndef CONFIG_H
#define CONFIG_H

// ── WiFi Credentials ──
const char* ssid = "YOUR_WIFI_NAME";
const char* password = "YOUR_WIFI_PASSWORD";

// ── Server Configuration ──
const char* SERVER_URL = "https://your-webapp-url.vercel.app"; // No trailing slash
const char* API_PATH = "/api/esp32";
const char* DEVICE_SECRET = "esp32-nutopass-secret-change-me";

// ── NTP Settings ──
const long gmtOffset = 3600;      // Adjust for your timezone (e.g., 3600 for GMT+1)
const int daylightOffset = 0;

#endif // CONFIG_H
