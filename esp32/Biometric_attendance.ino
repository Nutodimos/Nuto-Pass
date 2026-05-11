/*
 * Smart Attendance System — ESP32 (Headless)
 * TFT display removed. Feedback via LED + Buzzer only.
 * Communicates directly with Next.js API via HTTP.
 */
#include "globals.h"

// ══════════ Global Variable Definitions ══════════
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

// ══════════ LED / Buzzer Helpers ══════════
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

// ══════════ HTTP POST to Next.js API ══════════
bool postToServer(String event, int id, String status) {
  if (!wifiConnected) return false;
  HTTPClient http;
  String url = String(SERVER_URL) + String(API_PATH);
  http.begin(url); http.addHeader("Content-Type","application/json"); http.setTimeout(8000);
  char ts[24]="unknown"; struct tm t;
  if(getLocalTime(&t)) snprintf(ts,sizeof(ts),"%04d-%02d-%02dT%02d:%02d:%02d",t.tm_year+1900,t.tm_mon+1,t.tm_mday,t.tm_hour,t.tm_min,t.tm_sec);
  String json="{\"deviceSecret\":\""+String(DEVICE_SECRET)+"\",\"event\":\""+event+"\",\"userID\":\""+makeUserID(id)+"\",\"status\":\""+status+"\",\"timestamp\":\""+String(ts)+"\"}";
  Serial.println("[POST] "+url+" → "+json);
  int code=http.POST(json); http.end();
  Serial.printf("[POST] Response: %d\n", code);
  return(code>=200&&code<300);
}

// ══════════ Heartbeat Ping ══════════
void sendHeartbeat() {
  if (!wifiConnected) return;
  HTTPClient http;
  String url = String(SERVER_URL) + "/api/esp32/heartbeat";
  http.begin(url); http.addHeader("Content-Type","application/json"); http.setTimeout(5000);
  unsigned long uptimeSec = (millis() - bootTime) / 1000;
  int rssi = WiFi.RSSI();
  int heap = ESP.getFreeHeap();
  finger.getTemplateCount(); // Update the count before sending
  String json = "{\"deviceSecret\":\""+String(DEVICE_SECRET)+"\",\"deviceId\":\"ESP32_MAIN\",\"mode\":\""+String(modeToString(currentMode))+"\",\"rssi\":"+String(rssi)+",\"freeHeap\":"+String(heap)+",\"sdReady\":"+String(sdReady?"true":"false")+",\"sensorStatus\":"+String(sensorReady?"true":"false")+",\"uptime\":"+String(uptimeSec)+",\"templateCount\":"+String(finger.templateCount)+"}";
  int code = http.POST(json);
  if (code == 200) {
    String response = http.getString();
    int cmdIdx = response.indexOf("\"command\":\"");
    if (cmdIdx > 0) {
      int startIdx = cmdIdx + 11;
      int endIdx = response.indexOf("\"", startIdx);
      if (endIdx > startIdx) {
        String cmd = response.substring(startIdx, endIdx);

        // Skip "none" — it's not a real command
        if (cmd == "none") {
          // do nothing
        }
        // ── ENROLL:N — enter registration mode for slot N ──
        else if (cmd.startsWith("ENROLL:") && currentMode != MODE_REGISTRATION) {
          int slot = cmd.substring(7).toInt();
          if (slot > 0 && slot <= 127) {
            enrollNewID = slot;
            currentMode = MODE_REGISTRATION;
            enrollState = ENROLL_IDLE;
            Serial.printf("[REMOTE] Command: ENROLL slot %d\n", slot);
            ledPurple(); beep(150);
          }
        }
        // ── VERIFY:START — enter verification mode for attendance ──
        else if (cmd == "VERIFY:START" && currentMode != MODE_VERIFICATION) {
          currentMode = MODE_VERIFICATION;
          Serial.println("[REMOTE] Command: VERIFY:START");
          ledYellow(); beep(80);
        }
        // ── VERIFY:STOP — return to idle ──
        else if (cmd == "VERIFY:STOP" && currentMode == MODE_VERIFICATION) {
          currentMode = MODE_DEFAULT;
          Serial.println("[REMOTE] Command: VERIFY:STOP");
          ledBlue(); beep(60);
        }
        // ── DELETE:N — erase fingerprint from sensor slot N ──
        else if (cmd.startsWith("DELETE:")) {
          // Extract numeric slot from "DELETE:USER003" or "DELETE:3"
          String arg = cmd.substring(7);
          int slot = 0;
          if (arg.startsWith("USER")) {
            slot = arg.substring(4).toInt();
          } else {
            slot = arg.toInt();
          }
          if (slot > 0 && slot <= 127) {
            uint8_t p = finger.deleteModel(slot);
            Serial.printf("[REMOTE] DELETE slot %d → %s\n", slot, p==FINGERPRINT_OK?"OK":"FAIL");
            ledWhite(); beep(100); delay(500);
            if (currentMode == MODE_VERIFICATION) ledYellow();
            else ledBlue();
          }
        }
        // ── EMPTY_ALL — wipe all templates from sensor ──
        else if (cmd == "EMPTY_ALL") {
          Serial.println("[REMOTE] Clearing all templates...");
          ledWhite();
          uint8_t p = finger.emptyDatabase();
          if (p == FINGERPRINT_OK) {
            finger.getTemplateCount();
            Serial.printf("[REMOTE] SUCCESS: All templates erased. Count: %d\n", finger.templateCount);
            beepTimes(3,100,80);
          } else {
            Serial.printf("[REMOTE] FAILED to clear database (code %d)\n", p);
            beepTimes(5,50,50);
          }
          delay(1000);
          if (currentMode == MODE_VERIFICATION) ledYellow();
          else ledBlue();
        }
        else {
          Serial.printf("[REMOTE] Unknown command: %s\n", cmd.c_str());
        }
      }
    }
  }
  http.end();
  if (code != 200) {
    Serial.printf("[HEARTBEAT] FAILED: %d\n", code);
  }
}

// ══════════ SD Card Logging ══════════
void logToSD(String event,int id,String status,bool synced){
  if(!sdReady)return; struct tm t; char ts[24]="unknown";
  if(getLocalTime(&t)) snprintf(ts,sizeof(ts),"%04d-%02d-%02d %02d:%02d:%02d",t.tm_year+1900,t.tm_mon+1,t.tm_mday,t.tm_hour,t.tm_min,t.tm_sec);
  File f=SD.open("/log.csv",FILE_APPEND);
  if(f){f.printf("%s,%s,%s,%s,%s\n",ts,event.c_str(),makeUserID(id).c_str(),status.c_str(),synced?"YES":"NO");f.close();}
}

// ══════════ Sync Offline Records to Server ══════════
void autoSyncToServer(){
  if(!sdReady||!wifiConnected)return;
  File src=SD.open("/log.csv",FILE_READ); if(!src)return;
  String lines[256]; int lineCount=0; bool hasUnsynced=false;
  while(src.available()&&lineCount<256){String line=src.readStringUntil('\n');line.trim();if(line.length()==0)continue;lines[lineCount++]=line;if(line.endsWith(",NO"))hasUnsynced=true;}
  src.close(); if(!hasUnsynced)return;
  Serial.println("[SYNC] Starting offline sync...");
  blinkWhite(2,150,100); ledWhite();
  HTTPClient http; String url=String(SERVER_URL)+String(API_PATH);
  http.begin(url); http.addHeader("Content-Type","application/json"); http.setTimeout(15000);
  String json="{\"deviceSecret\":\""+String(DEVICE_SECRET)+"\",\"records\":["; int added=0;
  SD.remove("/log_tmp.csv"); File dst=SD.open("/log_tmp.csv",FILE_WRITE); if(!dst){ledBlue();return;}
  for(int i=0;i<lineCount;i++){
    if(i==0){dst.println(lines[i]);continue;}
    if(lines[i].endsWith(",NO")){
      if(added>0)json+=",";
      json+="{\"event\":\"SYNC\",\"userID\":\"unknown\",\"status\":\"PENDING\",\"raw\":\""+lines[i]+"\"}";
      added++; String synced=lines[i].substring(0,lines[i].lastIndexOf(","))+",YES"; dst.println(synced);
    }else{dst.println(lines[i]);}
  }
  json+="]}"; if(added>0)http.POST(json); http.end(); dst.close();
  SD.remove("/log.csv");
  File in2=SD.open("/log_tmp.csv",FILE_READ); File out2=SD.open("/log.csv",FILE_WRITE);
  if(in2&&out2){while(in2.available())out2.write(in2.read());}
  if(in2)in2.close(); if(out2)out2.close(); SD.remove("/log_tmp.csv");
  Serial.printf("[SYNC] Complete. %d records synced.\n", added);
  blinkWhite(2,100,80); delay(500); ledBlue();
}

// ══════════ Enrollment FSM ══════════
void handleEnrollment(){
  unsigned long now=millis();
  switch(enrollState){
    case ENROLL_IDLE:
      if (enrollNewID <= 0 || enrollNewID > 127) {
        Serial.println("[ENROLL] Invalid slot ID!");
        ledRed();beepTimes(3,100,80);delay(2000);
        if(wifiConnected) postToServer("ENROLL", enrollNewID, "FAILED");
        enrollNewID=-1; currentMode=MODE_DEFAULT; ledBlue(); return;
      }
      // Clear the slot first in case old data exists
      finger.deleteModel(enrollNewID);
      Serial.printf("[ENROLL] Slot %d (%s) — PLACE FINGER on sensor\n", enrollNewID, makeUserID(enrollNewID).c_str());
      ledPurple();beep(100);
      enrollTimeout=now; enrollState=ENROLL_WAIT_FIRST; break;

    case ENROLL_WAIT_FIRST:
      if(now-enrollTimeout>30000){
        Serial.println("[ENROLL] Timed out waiting for first scan");
        beepTimes(2,60,60);
        if(wifiConnected) postToServer("ENROLL", enrollNewID, "FAILED");
        enrollNewID=-1; currentMode=MODE_DEFAULT; ledBlue(); enrollState=ENROLL_IDLE; return;
      }
      if(finger.getImage()==FINGERPRINT_OK) enrollState=ENROLL_FIRST_SCAN;
      break;

    case ENROLL_FIRST_SCAN:{
      uint8_t conv=finger.image2Tz(1);
      if(conv==FINGERPRINT_OK){
        Serial.println("[ENROLL] ✓ First scan captured!");
        Serial.println("[ENROLL] LIFT finger off sensor now...");
        ledGreen();beepTimes(1,150);
        // Mandatory 3-second pause — gives user time to lift finger
        // We don't rely on FINGERPRINT_NOFINGER because some R307 sensors
        // never report it reliably (residual heat/moisture on sensor surface)
        delay(3000);
        Serial.println("[ENROLL] Now PLACE SAME FINGER again for second scan");
        beepTimes(2,80,100);ledPurple();
        enrollTimeout=now; enrollState=ENROLL_WAIT_SECOND;
      }else{
        Serial.println("[ENROLL] Poor quality first scan — try again");
        ledRed();beep(150);delay(500);ledPurple();
        enrollTimeout=now; enrollState=ENROLL_WAIT_FIRST;
      }break;}

    case ENROLL_WAIT_SECOND:
      if(now-enrollTimeout>30000){
        Serial.println("[ENROLL] Timed out waiting for second scan");
        beepTimes(2,60,60);
        if(wifiConnected) postToServer("ENROLL", enrollNewID, "FAILED");
        enrollNewID=-1; currentMode=MODE_DEFAULT; ledBlue(); enrollState=ENROLL_IDLE; return;
      }
      if(finger.getImage()==FINGERPRINT_OK) enrollState=ENROLL_SECOND_SCAN;
      break;

    case ENROLL_SECOND_SCAN:{
      uint8_t conv=finger.image2Tz(2);
      if(conv==FINGERPRINT_OK){
        Serial.println("[ENROLL] ✓ Second scan captured — creating template...");
        enrollState=ENROLL_PROCESS;
      }else{
        Serial.println("[ENROLL] Poor quality second scan — try again");
        ledRed();beep(150);delay(500);ledPurple();
        enrollTimeout=now; enrollState=ENROLL_WAIT_SECOND;
      }break;}

    case ENROLL_PROCESS:{
      uint8_t p = finger.createModel();
      if(p != FINGERPRINT_OK){
        Serial.printf("[ENROLL] createModel FAILED (code %d) — fingerprints didn't match\n", p);
        enrollState=ENROLL_FAIL; break;
      }
      p = finger.storeModel(enrollNewID);
      if(p != FINGERPRINT_OK){
        Serial.printf("[ENROLL] storeModel FAILED (code %d)\n", p);
        enrollState=ENROLL_FAIL; break;
      }
      // Self-test: immediately try to find the just-stored template
      Serial.println("[ENROLL] Running self-verification test...");
      delay(200);
      p = finger.loadModel(enrollNewID);
      if(p == FINGERPRINT_OK){
        finger.getTemplateCount();
        Serial.printf("[ENROLL] Self-test PASSED — template stored. Total templates: %d\n", finger.templateCount);
        enrollState=ENROLL_SUCCESS;
      }else{
        Serial.printf("[ENROLL] Self-test FAILED — loadModel returned %d\n", p);
        enrollState=ENROLL_FAIL;
      }
      break;}

    case ENROLL_SUCCESS:{
      String uid=makeUserID(enrollNewID);
      bool online=wifiConnected;
      logToSD("ENROLL",enrollNewID,"SUCCESS",online);
      if(online) postToServer("ENROLL",enrollNewID,"SUCCESS");
      Serial.printf("[ENROLL] ✓ SUCCESS: %s stored in sensor memory\n", uid.c_str());
      ledGreen();beepTimes(2,150,100);delay(3000);
      enrollNewID=-1; currentMode=MODE_DEFAULT; ledBlue(); enrollState=ENROLL_IDLE;
      break;}

    case ENROLL_FAIL:{
      bool online=wifiConnected;
      logToSD("ENROLL",enrollNewID,"FAILED",online);
      if(online) postToServer("ENROLL",enrollNewID,"FAILED");
      Serial.println("[ENROLL] ✕ FAILED — could not store fingerprint");
      ledRed();beepTimes(3,100,80);delay(3000);
      enrollNewID=-1; currentMode=MODE_DEFAULT; ledBlue(); enrollState=ENROLL_IDLE;
      break;}

    default:
      Serial.printf("[ENROLL] Unknown state %d — resetting\n", enrollState);
      enrollNewID=-1; currentMode=MODE_DEFAULT; ledBlue(); enrollState=ENROLL_IDLE;
      break;
  }
}

// ══════════ Sleep Mode ══════════
void enterSleepMode(){
  Serial.println("[SLEEP] Entering deep sleep. Press button to wake.");
  ledOff();delay(200);
  esp_sleep_enable_ext0_wakeup((gpio_num_t)BUTTON_PIN,0);
  esp_deep_sleep_start();
}

// ══════════ SETUP ══════════
void setup(){
  Serial.begin(115200);delay(200);
  bootTime = millis();
  Serial.println("\n============================");
  Serial.println("  NutoPass Attendance v2.0");
  Serial.println("============================\n");

  pinMode(SD_CS,OUTPUT);digitalWrite(SD_CS,HIGH);
  pinMode(BUTTON_PIN,INPUT_PULLUP);pinMode(BUZZER_PIN,OUTPUT);
  pinMode(LED_RED,OUTPUT);pinMode(LED_GREEN,OUTPUT);pinMode(LED_BLUE,OUTPUT);
  digitalWrite(BUZZER_PIN,LOW);ledOff();

  // Boot sequence
  blinkWhite(3,150,100);ledWhite();

  // SD Card
  SPI.begin(SPI_SCK,SPI_MISO,SPI_MOSI);delay(50);
  sdReady=SD.begin(SD_CS,SPI);
  Serial.printf("[INIT] SD Card: %s\n", sdReady?"OK":"FAILED");
  if(sdReady){ledGreen();beep(60);}else{ledRed();beepTimes(2,100,80);}
  delay(300);

  // Fingerprint sensor
  fpSerial.begin(57600,SERIAL_8N1,FP_RX,FP_TX);
  finger.begin(57600);
  if(finger.verifyPassword()){
    Serial.println("[INIT] Fingerprint sensor: OK");
    sensorReady=true;
    // Lower security level for more reliable matching (1=least strict, 5=most strict)
    finger.setSecurityLevel(2);
    Serial.println("[INIT] Security level set to 2 (permissive)");
    // Print template count for diagnostics
    finger.getTemplateCount();
    Serial.printf("[INIT] Stored fingerprints: %d\n", finger.templateCount);
    ledGreen();beep(60);
  }else{
    Serial.println("[INIT] Fingerprint sensor: FAILED (Check wiring!)");
    sensorReady=false;
    ledRed();beepTimes(3,100,80);
  }
  delay(300);

  // WiFi
  Serial.printf("[INIT] Connecting to WiFi: %s\n", ssid);
  WiFi.begin(ssid,password);
  int attempts=0;
  while(WiFi.status()!=WL_CONNECTED && attempts<20){
    delay(500);Serial.print(".");attempts++;
    ledYellow();delay(100);ledOff();delay(100);
  }
  if(WiFi.status()==WL_CONNECTED){
    wifiConnected=true;
    Serial.printf("\n[INIT] WiFi connected! IP: %s\n", WiFi.localIP().toString().c_str());
    configTime(gmtOffset,daylightOffset,"pool.ntp.org","time.nist.gov");
    ntpSynced=true;cloudReady=true;
    ledGreen();beepTimes(2,60,60);
  }else{
    Serial.println("\n[INIT] WiFi FAILED — running offline");
    ledRed();beepTimes(3,100,80);
  }
  delay(500);

  // Ready
  currentMode=MODE_DEFAULT;
  Serial.println("[READY] Mode: DEFAULT (Blue LED)");
  Serial.println("  Button: 1 press = toggle VERIFICATION | Long press = SLEEP");
  ledBlue();beep(100);

  lastTick=millis();lastWifiCheck=millis();lastSyncAttempt=millis();lastHeartbeat=millis();
}

// ══════════ LOOP ══════════
void loop(){
  unsigned long now=millis();

  // ── WiFi check every 5s ──
  if(now-lastWifiCheck>=5000){
    lastWifiCheck=now;bool was=wifiConnected;
    wifiConnected=(WiFi.status()==WL_CONNECTED);
    if(!was&&wifiConnected){
      Serial.println("[WIFI] Reconnected!");
      configTime(gmtOffset,daylightOffset,"pool.ntp.org","time.nist.gov");
      ntpSynced=true;cloudReady=true;ledBlue();
    }
    if(was&&!wifiConnected){
      Serial.println("[WIFI] Disconnected — will retry");
      cloudReady=false;
      WiFi.begin(ssid,password);
    }
  }

  // ── Heartbeat every 5s ──
  if(wifiConnected&&now-lastHeartbeat>=HEARTBEAT_INTERVAL_MS){
    lastHeartbeat=now;sendHeartbeat();
  }

  // ── Auto sync every 30s ──
  if(wifiConnected&&now-lastSyncAttempt>=30000){lastSyncAttempt=now;autoSyncToServer();}

  // ── Button logic ──
  bool btnDown=(digitalRead(BUTTON_PIN)==LOW);
  if(btnDown&&!btnWasDown){btnWasDown=true;btnDownTime=now;longPressHandled=false;}
  if(btnWasDown&&btnDown&&!longPressHandled){
    if(now-btnDownTime>=LONG_PRESS_MS){
      longPressHandled=true;pressCount=0;
      currentMode=MODE_SLEEP;enterSleepMode();
    }
  }
  if(!btnDown&&btnWasDown){
    btnWasDown=false;
    if(!longPressHandled){
      pressCount++;
      lastPressTime=now;
      Serial.printf("[BUTTON] Press %d detected...\n", pressCount);
    }
  }

  if(!btnDown&&pressCount>0&&(now-lastPressTime>=MULTI_PRESS_WINDOW_MS)&&!longPressHandled){
    int count=pressCount;pressCount=0;
    if(count==1){
      if(currentMode==MODE_DEFAULT){
        currentMode=MODE_VERIFICATION;
        Serial.println("[MODE] → VERIFICATION (Yellow LED)");
        ledYellow();beep(80);
      }else if(currentMode==MODE_VERIFICATION){
        currentMode=MODE_DEFAULT;
        Serial.println("[MODE] → DEFAULT (Blue LED)");
        ledBlue();beep(60);
      }
    }else if(count==3){
        Serial.println("[MANUAL] Triple-click detected: WIPING SENSOR DATABASE...");
        ledWhite(); beepTimes(4,100,100);
        uint8_t p = finger.emptyDatabase();
        if(p == FINGERPRINT_OK){
          finger.getTemplateCount();
          Serial.printf("[MANUAL] SUCCESS: All templates erased. Count: %d\n", finger.templateCount);
          ledGreen(); beep(500);
        } else {
          Serial.printf("[MANUAL] FAILED to wipe (code %d)\n", p);
          ledRed(); beepTimes(5,50,50);
        }
        delay(2000);
        ledBlue();
    }else if(count>=2){
        Serial.println("[MODE] Double-click: No action defined.");
        beepTimes(2,80,100);ledBlue();
    }
  }

  // ── Verification ──
  if(currentMode==MODE_VERIFICATION){
    uint8_t img=finger.getImage();
    if(img==FINGERPRINT_OK){
      uint8_t conv=finger.image2Tz();
      if(conv==FINGERPRINT_IMAGEFAIL||conv==FINGERPRINT_IMAGEMESS){
        Serial.println("[VERIFY] Poor quality scan — try again");
        ledRed();beepTimes(2,80,80);delay(1500);ledYellow();return;
      }
      if(conv==FINGERPRINT_OK){
        // Search the full library for a match
        finger.getTemplateCount();
        Serial.printf("[VERIFY] Searching %d templates...\n", finger.templateCount);
        uint8_t searchResult = finger.fingerSearch();
        if(searchResult==FINGERPRINT_OK){
          int fid=finger.fingerID;
          int conf=finger.confidence;
          Serial.printf("[VERIFY] Match found: ID=%d  Confidence=%d\n", fid, conf);

          // Reject low-confidence matches
          if(conf < 20){
            Serial.println("[VERIFY] Confidence too low — rejected");
            ledOrange();beepTimes(2,50,50);delay(1500);ledYellow();return;
          }

          // Block rapid duplicate scans
          if(fid==lastVerifiedID&&(now-lastVerifyTime)<DUPLICATE_GUARD_MS){
            Serial.printf("[VERIFY] Duplicate blocked: %s (within %ds)\n", makeUserID(fid).c_str(), DUPLICATE_GUARD_MS/1000);
            ledOrange();beep(300);delay(1500);ledYellow();return;
          }
          lastVerifiedID=fid;lastVerifyTime=now;
          bool online=wifiConnected;
          logToSD("VERIFY",fid,"SUCCESS",online);
          if(online)postToServer("VERIFY",fid,"SUCCESS");
          Serial.printf("[VERIFY] ✓ %s — attendance recorded%s\n", makeUserID(fid).c_str(), online?" (online)":" (offline)");
          ledGreen();beepTimes(1,120);delay(2500);ledYellow();
        }else{
          logToSD("VERIFY",-1,"FAILED",false);
          Serial.printf("[VERIFY] ✕ Fingerprint not recognized (search code: %d)\n", searchResult);
          ledRed();beepTimes(2,80,80);delay(2000);ledYellow();
        }
      }
    }
  }

  // ── Registration ──
  if(currentMode==MODE_REGISTRATION){handleEnrollment();}
}
