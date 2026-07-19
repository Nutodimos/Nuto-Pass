/*
 * NutoPass Attendance v5.0 — AS608 Fingerprint Sensor
 * On-device DSP matching with 2-scan enrollment for high accuracy.
 * Syncs attendance to NutoPass web app via WiFi.
 *
 * Wiring (AS608 → ESP32):
 *   VCC  → 3.3V (some modules need 5V — check yours)
 *   GND  → GND
 *   TX   → GPIO16 (FP_RX — sensor TX to ESP RX)
 *   RX   → GPIO17 (FP_TX — sensor RX to ESP TX)
 *   TOUCH → Not connected (optional wake wire)
 */
#include "globals.h"

// ══════════ Globals ══════════
HardwareSerial fpSerial(2);
Adafruit_Fingerprint finger = Adafruit_Fingerprint(&fpSerial);
Mode currentMode = MODE_DEFAULT;
EnrollState enrollState = ENROLL_IDLE;
bool wifiConnected=false, sdReady=false, sensorReady=false, cloudReady=false, ntpSynced=false;
unsigned long lastWifiCheck=0, lastTick=0, lastSyncAttempt=0, lastHeartbeat=0;
int lastVerifiedID=-1; unsigned long lastVerifyTime=0;
int pressCount=0; bool btnWasDown=false, longPressHandled=false;
unsigned long lastPressTime=0, btnDownTime=0;
int enrollNewID=-1; unsigned long enrollTimeout=0;
unsigned long bootTime=0;

// ══════════ LED / Buzzer ══════════
void setLED(bool r,bool g,bool b){digitalWrite(LED_RED,r);digitalWrite(LED_GREEN,g);digitalWrite(LED_BLUE,b);}
void ledOff(){setLED(0,0,0);} void ledWhite(){setLED(1,1,1);} void ledBlue(){setLED(0,0,1);}
void ledGreen(){setLED(0,1,0);} void ledRed(){setLED(1,0,0);} void ledYellow(){setLED(1,1,0);}
void ledOrange(){setLED(1,0,0);digitalWrite(LED_GREEN,HIGH);} void ledPurple(){setLED(1,0,1);}
void blinkWhite(int t,int on,int off){for(int i=0;i<t;i++){ledWhite();delay(on);ledOff();delay(off);}}
void blinkBlue(int t,int on,int off){for(int i=0;i<t;i++){ledBlue();delay(on);ledOff();delay(off);}}
void beep(int ms){digitalWrite(BUZZER_PIN,HIGH);delay(ms);digitalWrite(BUZZER_PIN,LOW);}
void beepTimes(int n,int ms,int gap){for(int i=0;i<n;i++){beep(ms);if(i<n-1)delay(gap);}}

String makeUserID(int rawID){char buf[10];snprintf(buf,sizeof(buf),"USER%03d",rawID);return String(buf);}

const char* modeToString(Mode m){
  switch(m){
    case MODE_DEFAULT: return "DEFAULT";
    case MODE_VERIFICATION: return "VERIFICATION";
    case MODE_REGISTRATION: return "REGISTRATION";
    case MODE_SLEEP: return "SLEEP";
    default: return "UNKNOWN";
  }
}

// ══════════ Event POST ══════════
bool postToServer(String event, int id, String status) {
  if (!wifiConnected) return false;
  HTTPClient http;
  String url = String(SERVER_URL) + String(API_PATH);
  http.begin(url); http.addHeader("Content-Type","application/json"); http.setTimeout(8000);
  char ts[24]="unknown"; struct tm t;
  if(getLocalTime(&t)) snprintf(ts,sizeof(ts),"%04d-%02d-%02dT%02d:%02d:%02d",t.tm_year+1900,t.tm_mon+1,t.tm_mday,t.tm_hour,t.tm_min,t.tm_sec);
  String json="{\"deviceSecret\":\""+String(DEVICE_SECRET)+"\",\"event\":\""+event+"\",\"userID\":\""+makeUserID(id)+"\",\"status\":\""+status+"\",\"timestamp\":\""+String(ts)+"\"}";
  Serial.println("[POST] "+url); int code=http.POST(json); http.end();
  return(code>=200&&code<300);
}

// ══════════ Heartbeat ══════════
void sendHeartbeat() {
  if (!wifiConnected) return;
  HTTPClient http;
  String url = String(SERVER_URL) + "/api/esp32/heartbeat";
  http.begin(url); http.addHeader("Content-Type","application/json"); http.setTimeout(5000);
  unsigned long up = (millis() - bootTime) / 1000;
  int rssi = WiFi.RSSI(); int heap = ESP.getFreeHeap();
  int stored = finger.templateCount; // AS608 reports stored template count
  String json = "{\"deviceSecret\":\""+String(DEVICE_SECRET)+"\",\"deviceId\":\"ESP32_MAIN\",\"mode\":\""+String(modeToString(currentMode))+"\",\"rssi\":"+String(rssi)+",\"freeHeap\":"+String(heap)+",\"sdReady\":"+String(sdReady?"true":"false")+",\"sensorStatus\":"+String(sensorReady?"true":"false")+",\"uptime\":"+String(up)+"}";
  int code = http.POST(json);
  if (code == 200) {
    String response = http.getString();
    int cmdIdx = response.indexOf("\"command\":\"");
    if (cmdIdx > 0) {
      int si = cmdIdx + 11; int ei = response.indexOf("\"", si);
      if (ei > si) {
        String cmd = response.substring(si, ei);
        if (cmd == "none") { /* noop */ }
        else if ((cmd.startsWith("ENROLL:") || cmd.startsWith("CLOUD_ENROLL:")) && currentMode != MODE_REGISTRATION) {
          int colonIdx = cmd.indexOf(':');
          int slot = cmd.substring(colonIdx + 1).toInt();
          if (slot > 0 && slot <= AS608_MAX_TEMPLATES) {
            enrollNewID = slot; currentMode = MODE_REGISTRATION; enrollState = ENROLL_IDLE;
            Serial.printf("[REMOTE] ENROLL slot %d\n", slot); ledPurple(); beep(150);
          }
        }
        else if (cmd == "VERIFY:START" && currentMode != MODE_VERIFICATION) {
          currentMode = MODE_VERIFICATION; Serial.println("[REMOTE] VERIFY:START"); ledYellow(); beep(80);
        }
        else if (cmd == "VERIFY:STOP" && currentMode == MODE_VERIFICATION) {
          currentMode = MODE_DEFAULT; Serial.println("[REMOTE] VERIFY:STOP"); ledBlue(); beep(60);
        }
        else if (cmd == "EMPTY_ALL") {
          Serial.println("[REMOTE] Clearing sensor..."); finger.emptyDatabase(); ledBlue(); beep(100);
        }
        else if (cmd != "none") { Serial.printf("[REMOTE] Unknown: %s\n", cmd.c_str()); }
      }
    }
  }
  http.end();
  if (code != 200) Serial.printf("[HEARTBEAT] FAILED: %d\n", code);
}

// ══════════ SD Logging ══════════
void logToSD(String event,int id,String status,bool synced){
  if(!sdReady)return; struct tm t; char ts[24]="unknown";
  if(getLocalTime(&t)) snprintf(ts,sizeof(ts),"%04d-%02d-%02d %02d:%02d:%02d",t.tm_year+1900,t.tm_mon+1,t.tm_mday,t.tm_hour,t.tm_min,t.tm_sec);
  File f=SD.open("/log.csv",FILE_APPEND);
  if(f){f.printf("%s,%s,%s,%s,%s\n",ts,event.c_str(),makeUserID(id).c_str(),status.c_str(),synced?"YES":"NO");f.close();}
}

// ══════════════════════════════════════════════════════════════════
// AS608 TWO-SCAN ENROLLMENT
//
// The proper enrollment process captures TWO fingerprint images
// and combines them into a single, high-accuracy template.
// This dramatically reduces false rejections compared to
// single-scan enrollment.
//
// Flow:
//   IDLE → WAIT_FINGER_1 → CAPTURE_1 → WAIT_LIFT →
//   WAIT_FINGER_2 → CAPTURE_2 → CREATE_MODEL → STORE → SUCCESS
// ══════════════════════════════════════════════════════════════════
void handleEnrollment(){
  unsigned long now = millis();
  switch(enrollState){

    // ── Start: Validate slot ID ──
    case ENROLL_IDLE:
      if (enrollNewID <= 0 || enrollNewID > AS608_MAX_TEMPLATES) {
        Serial.println("[ENROLL] Invalid slot!"); ledRed(); beepTimes(3,100,80); delay(2000);
        postToServer("ENROLL", enrollNewID, "FAILED");
        enrollNewID=-1; currentMode=MODE_DEFAULT; ledBlue(); return;
      }
      Serial.printf("\n[ENROLL] ═══ Slot %d ═══\n", enrollNewID);
      Serial.println("[ENROLL] SCAN 1 of 2 — Place finger on sensor...");
      ledPurple(); beep(100); enrollTimeout=now; enrollState=ENROLL_WAIT_FINGER_1; break;

    // ── Wait for first finger placement ──
    case ENROLL_WAIT_FINGER_1:
      if (now - enrollTimeout > ENROLL_TIMEOUT_MS) {
        Serial.println("[ENROLL] Timeout — no finger detected");
        postToServer("ENROLL", enrollNewID, "FAILED");
        enrollNewID=-1; currentMode=MODE_DEFAULT; ledBlue(); enrollState=ENROLL_IDLE; return;
      }
      if (finger.getImage() == FINGERPRINT_OK) {
        Serial.println("[ENROLL] ✓ Finger detected (scan 1)");
        ledWhite(); beep(80);
        enrollState = ENROLL_CAPTURE_1;
      }
      break;

    // ── Process first scan ──
    case ENROLL_CAPTURE_1:
      if (finger.image2Tz(1) != FINGERPRINT_OK) {
        Serial.println("[ENROLL] ✕ Feature extraction failed (scan 1)");
        enrollState = ENROLL_FAIL; break;
      }
      Serial.println("[ENROLL] ✓ Scan 1 stored in buffer");
      Serial.println("[ENROLL] Remove finger from sensor...");
      ledBlue(); beepTimes(2, 60, 60);
      enrollTimeout = now; enrollState = ENROLL_WAIT_LIFT; break;

    // ── Wait for finger to be lifted ──
    case ENROLL_WAIT_LIFT:
      if (now - enrollTimeout > ENROLL_TIMEOUT_MS) {
        Serial.println("[ENROLL] Timeout — finger not removed");
        enrollState = ENROLL_FAIL; break;
      }
      if (finger.getImage() == FINGERPRINT_NOFINGER) {
        Serial.println("[ENROLL] SCAN 2 of 2 — Place SAME finger again...");
        ledPurple(); beep(100);
        enrollTimeout = now; enrollState = ENROLL_WAIT_FINGER_2;
      }
      break;

    // ── Wait for second finger placement ──
    case ENROLL_WAIT_FINGER_2:
      if (now - enrollTimeout > ENROLL_TIMEOUT_MS) {
        Serial.println("[ENROLL] Timeout — second scan not detected");
        enrollState = ENROLL_FAIL; break;
      }
      if (finger.getImage() == FINGERPRINT_OK) {
        Serial.println("[ENROLL] ✓ Finger detected (scan 2)");
        ledWhite(); beep(80);
        enrollState = ENROLL_CAPTURE_2;
      }
      break;

    // ── Process second scan ──
    case ENROLL_CAPTURE_2:
      if (finger.image2Tz(2) != FINGERPRINT_OK) {
        Serial.println("[ENROLL] ✕ Feature extraction failed (scan 2)");
        enrollState = ENROLL_FAIL; break;
      }
      Serial.println("[ENROLL] ✓ Scan 2 stored in buffer");
      enrollState = ENROLL_CREATE_MODEL; break;

    // ── Merge both scans into one template ──
    case ENROLL_CREATE_MODEL:
      if (finger.createModel() != FINGERPRINT_OK) {
        Serial.println("[ENROLL] ✕ Scans don't match — try again with the same finger");
        ledOrange(); beepTimes(4, 80, 60); delay(2000);
        enrollState = ENROLL_FAIL; break;
      }
      Serial.println("[ENROLL] ✓ Template created from both scans");

      // Store the combined template in the AS608's flash
      if (finger.storeModel(enrollNewID) != FINGERPRINT_OK) {
        Serial.println("[ENROLL] ✕ Failed to store template in flash");
        enrollState = ENROLL_FAIL; break;
      }
      enrollState = ENROLL_SUCCESS; break;

    // ── Enrollment succeeded ──
    case ENROLL_SUCCESS: {
      logToSD("ENROLL", enrollNewID, "SUCCESS", wifiConnected);
      postToServer("ENROLL", enrollNewID, "SUCCESS");
      Serial.printf("[ENROLL] ✓ SUCCESS — Slot %d saved (%d templates total)\n",
                    enrollNewID, finger.templateCount);
      ledGreen(); beepTimes(2,150,100); delay(3000);
      enrollNewID=-1; currentMode=MODE_DEFAULT; ledBlue(); enrollState=ENROLL_IDLE; break; }

    // ── Enrollment failed ──
    case ENROLL_FAIL: {
      logToSD("ENROLL", enrollNewID, "FAILED", wifiConnected);
      postToServer("ENROLL", enrollNewID, "FAILED");
      Serial.println("[ENROLL] ✕ ENROLLMENT FAILED");
      ledRed(); beepTimes(3,100,80); delay(3000);
      enrollNewID=-1; currentMode=MODE_DEFAULT; ledBlue(); enrollState=ENROLL_IDLE; break; }

    default:
      enrollNewID=-1; currentMode=MODE_DEFAULT; ledBlue(); enrollState=ENROLL_IDLE; break;
  }
}

// ══════════════════════════════════════════════════════════════════
// AS608 VERIFICATION
//
// Captures a fingerprint, extracts features, and searches the
// sensor's on-chip flash library for a match.
// On match: posts VERIFY/SUCCESS to web app for attendance.
// ══════════════════════════════════════════════════════════════════
void handleVerification(){
  if(finger.getImage()!=FINGERPRINT_OK) return;

  Serial.println("[VERIFY] Finger detected...");
  ledWhite(); beep(100);

  // Extract features into buffer slot 1
  if(finger.image2Tz() != FINGERPRINT_OK){
    Serial.println("[VERIFY] Feature extraction failed");
    ledRed(); beepTimes(2,80,80); delay(2000); ledYellow(); return;
  }

  // Search the AS608's internal flash for a matching template
  if(finger.fingerFastSearch() != FINGERPRINT_OK){
    Serial.println("[VERIFY] ✕ NO MATCH");
    ledRed(); beepTimes(2,80,80); delay(2000); ledYellow(); return;
  }

  int foundID = finger.fingerID;
  int confidence = finger.confidence;
  Serial.printf("[VERIFY] ✓ MATCH — Slot %d (confidence: %d)\n", foundID, confidence);

  // Optional: Reject low-confidence matches
  if(confidence < MIN_MATCH_CONFIDENCE){
    Serial.printf("[VERIFY] ✕ Confidence too low (%d < %d)\n", confidence, MIN_MATCH_CONFIDENCE);
    ledOrange(); beepTimes(2,100,80); delay(2000); ledYellow(); return;
  }

  // Duplicate guard — prevent same student scanning twice within 10s
  if(foundID == lastVerifiedID && (millis() - lastVerifyTime) < DUPLICATE_GUARD_MS){
    Serial.println("[VERIFY] Duplicate scan — already recorded");
    ledBlue(); beep(40); delay(1000); ledYellow(); return;
  }
  lastVerifiedID = foundID; lastVerifyTime = millis();

  // Post attendance event to NutoPass web app
  bool posted = postToServer("VERIFY", foundID, "SUCCESS");
  logToSD("VERIFY", foundID, "SUCCESS", posted);

  if(posted){
    Serial.println("[VERIFY] ✓ Attendance posted to server");
  } else {
    Serial.println("[VERIFY] ⚠ Server post failed — logged to SD");
  }

  ledGreen(); beepTimes(1,120,0); delay(2500);
  ledYellow();
}

// ══════════ Sleep ══════════
void enterSleepMode(){
  Serial.println("[SLEEP] Entering deep sleep...");
  ledOff(); delay(200);
  esp_sleep_enable_ext0_wakeup((gpio_num_t)BUTTON_PIN, 0);
  esp_deep_sleep_start();
}

// ══════════════════════════════════════════════════════════════════
// SETUP
// ══════════════════════════════════════════════════════════════════
void setup(){
  Serial.begin(115200); delay(200);
  bootTime = millis();
  Serial.println("\n╔════════════════════════════════╗");
  Serial.println("║   NutoPass Attendance v5.0     ║");
  Serial.println("║   AS608 On-Device Matching     ║");
  Serial.println("╚════════════════════════════════╝\n");

  pinMode(SD_CS,OUTPUT); digitalWrite(SD_CS,HIGH);
  pinMode(BUTTON_PIN,INPUT_PULLUP); pinMode(BUZZER_PIN,OUTPUT);
  pinMode(LED_RED,OUTPUT); pinMode(LED_GREEN,OUTPUT); pinMode(LED_BLUE,OUTPUT);
  digitalWrite(BUZZER_PIN,LOW); ledOff();
  blinkWhite(3,150,100); ledWhite();

  // ── SD Card ──
  SPI.begin(SPI_SCK,SPI_MISO,SPI_MOSI); delay(50);
  sdReady = SD.begin(SD_CS,SPI);
  Serial.printf("[INIT] SD Card: %s\n", sdReady?"OK":"FAILED");
  if(sdReady){ledGreen();beep(60);}else{ledRed();beepTimes(2,100,80);}
  delay(300);

  // ── AS608 Fingerprint Sensor ──
  fpSerial.begin(AS608_BAUD, SERIAL_8N1, FP_RX, FP_TX);
  finger.begin(AS608_BAUD);
  if(finger.verifyPassword()){
    finger.getTemplateCount();
    Serial.printf("[INIT] AS608 sensor: OK (%d templates stored)\n", finger.templateCount);
    sensorReady = true; ledGreen(); beep(60);

    // Print sensor parameters for debugging
    finger.getParameters();
    Serial.printf("[INIT] AS608 capacity: %d | Security: %d | Baud: %d\n",
                  finger.capacity, finger.security_level, AS608_BAUD);
  } else {
    Serial.println("[INIT] AS608 sensor: FAILED (Check wiring!)");
    Serial.println("  → VCC=3.3V, GND, TX→GPIO16, RX→GPIO17");
    sensorReady = false; ledRed(); beepTimes(3,100,80);
  }
  delay(300);

  // ── WiFi ──
  Serial.printf("[INIT] Connecting to WiFi: %s\n", ssid);
  WiFi.begin(ssid, password);
  int attempts = 0;
  while(WiFi.status()!=WL_CONNECTED && attempts<20){
    delay(500); Serial.print("."); attempts++;
    ledYellow(); delay(100); ledOff(); delay(100);
  }
  if(WiFi.status()==WL_CONNECTED){
    wifiConnected = true;
    Serial.printf("\n[INIT] WiFi connected! IP: %s\n", WiFi.localIP().toString().c_str());
    configTime(gmtOffset, daylightOffset, "pool.ntp.org", "time.nist.gov");
    ntpSynced=true; cloudReady=true;
    ledGreen(); beepTimes(2,60,60);
  } else {
    Serial.println("\n[INIT] WiFi FAILED — online features disabled");
    ledRed(); beepTimes(3,100,80);
  }
  delay(500);

  currentMode = MODE_DEFAULT;
  Serial.println("\n[READY] Mode: DEFAULT (Blue LED)");
  Serial.println("  AS608 on-device matching active");
  Serial.println("  Button: 1 press = VERIFICATION mode | Long press = SLEEP");
  Serial.printf("  Enrolled: %d/%d slots used\n\n", finger.templateCount, AS608_MAX_TEMPLATES);
  ledBlue(); beep(100);
  lastTick=millis(); lastWifiCheck=millis(); lastSyncAttempt=millis(); lastHeartbeat=millis();
}

// ══════════════════════════════════════════════════════════════════
// LOOP
// ══════════════════════════════════════════════════════════════════
void loop(){
  unsigned long now = millis();

  // WiFi health check every 5s
  if(now-lastWifiCheck>=5000){
    lastWifiCheck=now; bool was=wifiConnected;
    wifiConnected = (WiFi.status()==WL_CONNECTED);
    if(!was && wifiConnected){
      Serial.println("[WIFI] Reconnected!");
      configTime(gmtOffset,daylightOffset,"pool.ntp.org","time.nist.gov");
      ntpSynced=true; cloudReady=true; ledBlue();
    }
    if(was && !wifiConnected){
      Serial.println("[WIFI] Disconnected — attempting reconnect...");
      cloudReady=false; WiFi.begin(ssid,password);
    }
  }

  // Heartbeat every 5s
  if(wifiConnected && now-lastHeartbeat>=HEARTBEAT_INTERVAL_MS){
    lastHeartbeat=now; sendHeartbeat();
  }

  // Button logic (single press = toggle mode, long press = sleep)
  bool btnDown = (digitalRead(BUTTON_PIN)==LOW);
  if(btnDown && !btnWasDown){btnWasDown=true; btnDownTime=now; longPressHandled=false;}
  if(btnWasDown && btnDown && !longPressHandled){
    if(now-btnDownTime>=LONG_PRESS_MS){
      longPressHandled=true; pressCount=0;
      currentMode=MODE_SLEEP; enterSleepMode();
    }
  }
  if(!btnDown && btnWasDown){
    btnWasDown=false;
    if(!longPressHandled){ pressCount++; lastPressTime=now; }
  }
  if(!btnDown && pressCount>0 && (now-lastPressTime>=MULTI_PRESS_WINDOW_MS) && !longPressHandled){
    int count=pressCount; pressCount=0;
    if(count==1){
      if(currentMode==MODE_DEFAULT){
        currentMode=MODE_VERIFICATION;
        Serial.println("[MODE] → VERIFICATION (Yellow LED)"); ledYellow(); beep(80);
      } else if(currentMode==MODE_VERIFICATION){
        currentMode=MODE_DEFAULT;
        Serial.println("[MODE] → DEFAULT (Blue LED)"); ledBlue(); beep(60);
      }
    }
  }

  // ── Verification mode ──
  if(currentMode==MODE_VERIFICATION && sensorReady){
    handleVerification();
  }

  // ── Registration mode (triggered by web app) ──
  if(currentMode==MODE_REGISTRATION){ handleEnrollment(); }
}
