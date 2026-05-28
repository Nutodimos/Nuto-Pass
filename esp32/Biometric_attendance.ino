/*
 * NutoPass Attendance v4.0 — Sensor Upgrade Ready
 * Cloud matching engine removed. R307 DSP used for on-device matching.
 * Ready for new sensor integration.
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
        else if (cmd.startsWith("ENROLL:") && currentMode != MODE_REGISTRATION) {
          int slot = cmd.substring(7).toInt();
          if (slot > 0 && slot <= 127) {
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

// ══════════ DSP Enrollment (R307 On-Device) ══════════
void handleEnrollment(){
  unsigned long now = millis();
  switch(enrollState){
    case ENROLL_IDLE:
      if (enrollNewID <= 0 || enrollNewID > 127) {
        Serial.println("[ENROLL] Invalid slot!"); ledRed(); beepTimes(3,100,80); delay(2000);
        postToServer("ENROLL", enrollNewID, "FAILED");
        enrollNewID=-1; currentMode=MODE_DEFAULT; ledBlue(); return;
      }
      Serial.printf("[ENROLL] Slot %d — PLACE FINGER on sensor\n", enrollNewID);
      ledPurple(); beep(100); enrollTimeout=now; enrollState=ENROLL_WAIT_FINGER; break;

    case ENROLL_WAIT_FINGER:
      if (now - enrollTimeout > 30000) {
        Serial.println("[ENROLL] Timeout"); postToServer("ENROLL", enrollNewID, "FAILED");
        enrollNewID=-1; currentMode=MODE_DEFAULT; ledBlue(); enrollState=ENROLL_IDLE; return;
      }
      if (finger.getImage() == FINGERPRINT_OK) {
        Serial.println("[ENROLL] Finger detected — processing...");
        ledWhite(); beep(100);

        // Convert image to template in slot 1
        if (finger.image2Tz(1) != FINGERPRINT_OK) {
          Serial.println("[ENROLL] Failed to extract features");
          enrollState = ENROLL_FAIL; break;
        }

        // Store template
        if (finger.storeModel(enrollNewID) != FINGERPRINT_OK) {
          Serial.println("[ENROLL] Failed to store template");
          enrollState = ENROLL_FAIL; break;
        }

        enrollState = ENROLL_SUCCESS;
      }
      break;

    case ENROLL_SUCCESS: {
      logToSD("ENROLL", enrollNewID, "SUCCESS", wifiConnected);
      postToServer("ENROLL", enrollNewID, "SUCCESS");
      Serial.printf("[ENROLL] ✓ SUCCESS: slot %d stored on sensor\n", enrollNewID);
      ledGreen(); beepTimes(2,150,100); delay(3000);
      enrollNewID=-1; currentMode=MODE_DEFAULT; ledBlue(); enrollState=ENROLL_IDLE; break; }

    case ENROLL_FAIL: {
      logToSD("ENROLL", enrollNewID, "FAILED", wifiConnected);
      postToServer("ENROLL", enrollNewID, "FAILED");
      Serial.println("[ENROLL] ✕ FAILED");
      ledRed(); beepTimes(3,100,80); delay(3000);
      enrollNewID=-1; currentMode=MODE_DEFAULT; ledBlue(); enrollState=ENROLL_IDLE; break; }

    default:
      enrollNewID=-1; currentMode=MODE_DEFAULT; ledBlue(); enrollState=ENROLL_IDLE; break;
  }
}

// ══════════ DSP Verification (R307 On-Device) ══════════
void handleVerification(){
  if(finger.getImage()!=FINGERPRINT_OK) return;
  
  Serial.println("[VERIFY] Finger detected...");
  ledWhite(); beep(100);

  if(finger.image2Tz() != FINGERPRINT_OK){
    Serial.println("[VERIFY] Feature extraction failed");
    ledRed(); beepTimes(2,80,80); delay(2000); ledYellow(); return;
  }

  if(finger.fingerFastSearch() != FINGERPRINT_OK){
    Serial.println("[VERIFY] ✕ NO MATCH");
    ledRed(); beepTimes(2,80,80); delay(2000); ledYellow(); return;
  }

  int foundID = finger.fingerID;
  int confidence = finger.confidence;
  Serial.printf("[VERIFY] ✓ MATCH — Slot %d (confidence: %d)\n", foundID, confidence);

  // Duplicate guard
  if(foundID == lastVerifiedID && (millis() - lastVerifyTime) < DUPLICATE_GUARD_MS){
    Serial.println("[VERIFY] Duplicate — skipping"); ledYellow(); return;
  }
  lastVerifiedID = foundID; lastVerifyTime = millis();

  // Post to server
  bool posted = postToServer("VERIFY", foundID, "SUCCESS");
  logToSD("VERIFY", foundID, "SUCCESS", posted);

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

// ══════════ SETUP ══════════
void setup(){
  Serial.begin(115200); delay(200);
  bootTime = millis();
  Serial.println("\n============================");
  Serial.println("  NutoPass Attendance v4.0");
  Serial.println("  On-Device Matching Mode");
  Serial.println("============================\n");

  pinMode(SD_CS,OUTPUT); digitalWrite(SD_CS,HIGH);
  pinMode(BUTTON_PIN,INPUT_PULLUP); pinMode(BUZZER_PIN,OUTPUT);
  pinMode(LED_RED,OUTPUT); pinMode(LED_GREEN,OUTPUT); pinMode(LED_BLUE,OUTPUT);
  digitalWrite(BUZZER_PIN,LOW); ledOff();
  blinkWhite(3,150,100); ledWhite();

  // SD Card
  SPI.begin(SPI_SCK,SPI_MISO,SPI_MOSI); delay(50);
  sdReady = SD.begin(SD_CS,SPI);
  Serial.printf("[INIT] SD Card: %s\n", sdReady?"OK":"FAILED");
  if(sdReady){ledGreen();beep(60);}else{ledRed();beepTimes(2,100,80);}
  delay(300);

  // Fingerprint sensor
  fpSerial.begin(57600, SERIAL_8N1, FP_RX, FP_TX);
  finger.begin(57600);
  if(finger.verifyPassword()){
    Serial.println("[INIT] Fingerprint sensor: OK");
    sensorReady = true; ledGreen(); beep(60);
  } else {
    Serial.println("[INIT] Fingerprint sensor: FAILED (Check wiring!)");
    sensorReady = false; ledRed(); beepTimes(3,100,80);
  }
  delay(300);

  // WiFi
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
  Serial.println("[READY] Mode: DEFAULT (Blue LED)");
  Serial.println("  On-device matching via sensor DSP");
  Serial.println("  Button: 1 press = toggle VERIFICATION | Long press = SLEEP");
  ledBlue(); beep(100);
  lastTick=millis(); lastWifiCheck=millis(); lastSyncAttempt=millis(); lastHeartbeat=millis();
}

// ══════════ LOOP ══════════
void loop(){
  unsigned long now = millis();

  // WiFi check every 5s
  if(now-lastWifiCheck>=5000){
    lastWifiCheck=now; bool was=wifiConnected;
    wifiConnected = (WiFi.status()==WL_CONNECTED);
    if(!was && wifiConnected){
      Serial.println("[WIFI] Reconnected!");
      configTime(gmtOffset,daylightOffset,"pool.ntp.org","time.nist.gov");
      ntpSynced=true; cloudReady=true; ledBlue();
    }
    if(was && !wifiConnected){
      Serial.println("[WIFI] Disconnected"); cloudReady=false; WiFi.begin(ssid,password);
    }
  }

  // Heartbeat every 5s
  if(wifiConnected && now-lastHeartbeat>=HEARTBEAT_INTERVAL_MS){
    lastHeartbeat=now; sendHeartbeat();
  }

  // Button logic
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
        Serial.println("[MODE] -> VERIFICATION (Yellow LED)"); ledYellow(); beep(80);
      } else if(currentMode==MODE_VERIFICATION){
        currentMode=MODE_DEFAULT;
        Serial.println("[MODE] -> DEFAULT (Blue LED)"); ledBlue(); beep(60);
      }
    }
  }

  // ── On-Device Verification ──
  if(currentMode==MODE_VERIFICATION && sensorReady){
    handleVerification();
  }

  // ── Registration ──
  if(currentMode==MODE_REGISTRATION){ handleEnrollment(); }
}
