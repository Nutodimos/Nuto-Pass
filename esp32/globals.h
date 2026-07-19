#ifndef GLOBALS_H
#define GLOBALS_H

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <SPI.h>
#include <SD.h>
#include <Adafruit_Fingerprint.h>
#include "esp_sleep.h"

// ── Pin Definitions ──
#define SD_CS     13
#define FP_RX     16
#define FP_TX     17
#define SPI_SCK   18
#define SPI_MISO  19
#define SPI_MOSI  23
#define BUTTON_PIN  15
#define BUZZER_PIN  12
#define LED_RED    25
#define LED_GREEN  26
#define LED_BLUE   27

// ── AS608 Sensor Configuration ──
#define AS608_BAUD            57600   // Default baud for AS608
#define AS608_MAX_TEMPLATES   127     // AS608 supports up to 127 (some: 162 or 300)
#define MIN_MATCH_CONFIDENCE  50      // Reject matches below this confidence score

// ── Enums ──
enum Mode { MODE_DEFAULT, MODE_VERIFICATION, MODE_REGISTRATION, MODE_SLEEP };
enum EnrollState {
  ENROLL_IDLE,
  ENROLL_WAIT_FINGER_1,   // Waiting for first finger placement
  ENROLL_CAPTURE_1,       // Processing first scan
  ENROLL_WAIT_LIFT,       // Waiting for finger to be lifted
  ENROLL_WAIT_FINGER_2,   // Waiting for second finger placement
  ENROLL_CAPTURE_2,       // Processing second scan
  ENROLL_CREATE_MODEL,    // Merging both scans into one template
  ENROLL_SUCCESS,
  ENROLL_FAIL
};

// ── Timing Constants ──
#define DUPLICATE_GUARD_MS    10000UL   // Block same student scanning twice within 10s
#define MULTI_PRESS_WINDOW_MS 1000      // Multi-press detection window
#define LONG_PRESS_MS         3000      // Long press to enter sleep
#define HEARTBEAT_INTERVAL_MS 5000UL    // Heartbeat to web app every 5s
#define ENROLL_TIMEOUT_MS     30000UL   // Timeout for each enrollment step

// ── Include Config AFTER types are defined ──
#include "config.h"

// ── Global Hardware Objects ──
extern HardwareSerial fpSerial;
extern Adafruit_Fingerprint finger;

// ── Global State ──
extern Mode currentMode;
extern EnrollState enrollState;
extern bool wifiConnected, sdReady, sensorReady, cloudReady, ntpSynced;
extern unsigned long lastWifiCheck, lastTick, lastSyncAttempt, lastHeartbeat;
extern int lastVerifiedID;
extern unsigned long lastVerifyTime;
extern int pressCount;
extern bool btnWasDown, longPressHandled;
extern unsigned long lastPressTime, btnDownTime;
extern int enrollNewID;
extern unsigned long enrollTimeout;
extern unsigned long bootTime;

// ── Function Declarations ──
void setLED(bool r, bool g, bool b);
void ledOff(); void ledWhite(); void ledBlue();
void ledGreen(); void ledRed(); void ledYellow();
void ledOrange(); void ledPurple();
void blinkWhite(int times, int onMs, int offMs);
void blinkBlue(int times, int onMs, int offMs);
void beep(int ms);
void beepTimes(int n, int ms, int gap);
String makeUserID(int rawID);
const char* modeToString(Mode m);
bool postToServer(String event, int id, String status);
void sendHeartbeat();
void logToSD(String event, int id, String status, bool synced);
void handleEnrollment();
void handleVerification();
void enterSleepMode();

#endif // GLOBALS_H
