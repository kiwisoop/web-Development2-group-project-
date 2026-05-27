# MLB Pitch Data Inspection Endpoint — Design Spec

**Date:** 2026-05-20
**Branch:** BASEBALL
**Phase:** 3D-0

---

## Goal

MLB `feed/live` API의 pitchData 구조를 검사하는 임시 admin 엔드포인트를 만든다. strike zone chart UI 구현 전에 좌표 필드 가용성을 확인하기 위한 목적이다.

---

## Scope

**포함:**
- `GET /api/admin/mlb/test-pitches/{gamePk}` 엔드포인트 추가
- `MlbSyncController.java` 수정 (메서드 1개 추가)
- 프론트엔드 빌드 + 백엔드 컴파일 검증

**제외:**
- strike zone chart UI
- pitch 데이터 DB 저장
- hot/cold zone
- git commit
- 새 DTO 클래스 (기존 Map 패턴 사용)

---

## Architecture

기존 `MlbSyncController`에 `testPitches` 메서드 추가. `mlbApiService.fetchGameFeedLive(gamePk)` 재사용. `Map<String, Object>` 응답 (기존 `test-detail` 엔드포인트 패턴 동일). 인증: `authService.requireAdmin(session)`.

---

## Endpoint

```
GET /api/admin/mlb/test-pitches/{gamePk}
Authorization: admin session required
```

---

## MLB feed/live JSON 구조 (관련 부분)

```json
{
  "liveData": {
    "plays": {
      "allPlays": [
        {
          "about": { "inning": 1, "halfInning": "top" },
          "matchup": {
            "batter": { "fullName": "..." },
            "pitcher": { "fullName": "..." }
          },
          "playEvents": [
            {
              "type": "pitch",
              "pitchData": {
                "startSpeed": 94.5,
                "endSpeed": 87.2,
                "strikeZoneTop": 3.5,
                "strikeZoneBottom": 1.6,
                "zone": 14,
                "coordinates": {
                  "x": 123.4,
                  "y": 200.5,
                  "pX": -0.5,
                  "pZ": 2.3,
                  "aX": ..., "aY": ..., "aZ": ...,
                  "pfxX": ..., "pfxZ": ...,
                  "vX0": ..., "vY0": ..., "vZ0": ...,
                  "x0": ..., "y0": ..., "z0": ...
                }
              },
              "details": {
                "type": { "description": "Four-Seam Fastball" },
                "description": "Ball",
                "call": { "description": "Ball" },
                "isBall": true,
                "isStrike": false,
                "isInPlay": false
              }
            }
          ]
        }
      ]
    }
  }
}
```

---

## Response Structure

```json
{
  "gamePk": 745528,
  "totalPlays": 82,
  "totalPitches": 295,
  "pitchesWithCoordinates": 292,
  "samplePitches": [
    {
      "inning": 1,
      "halfInning": "top",
      "batterName": "Shohei Ohtani",
      "pitcherName": "Gerrit Cole",
      "pitchType": "Four-Seam Fastball",
      "pitchDescription": "Ball",
      "callDescription": "Ball",
      "isBall": true,
      "isStrike": false,
      "isInPlay": false,
      "zone": 14,
      "strikeZoneTop": 3.49,
      "strikeZoneBottom": 1.62,
      "coordinatesPresent": true,
      "x": 123.4,
      "y": 200.5,
      "plateX": -0.51,
      "plateZ": 2.31,
      "startSpeed": 96.8,
      "endSpeed": 89.1
    }
  ]
}
```

**규칙:**
- `samplePitches`: coordinatesPresent=true인 pitch 최대 50개
- coordinatesPresent=false인 pitch는 totalPitches/pitchesWithCoordinates 카운트에는 포함, samplePitches에서는 제외
- `x/y`: TV 픽셀 좌표 (`coordinates.x`, `coordinates.y`)
- `plateX/plateZ`: 실제 공 위치 (`coordinates.pX`, `coordinates.pZ`)

---

## Implementation

**파일:** `src/main/java/com/sport/web_sport/baseball/controller/MlbSyncController.java`

**추가 메서드:**

```java
@GetMapping("/test-pitches/{gamePk}")
public ApiResponse<Map<String, Object>> testPitches(
        @PathVariable long gamePk,
        HttpSession session) {
    authService.requireAdmin(session);

    JsonNode feed = mlbApiService.fetchGameFeedLive(gamePk);
    Map<String, Object> result = new LinkedHashMap<>();
    result.put("gamePk", gamePk);

    if (feed == null) {
        result.put("error", "feed/live returned null");
        return ApiResponse.ok(result);
    }

    JsonNode allPlays = feed.path("liveData").path("plays").path("allPlays");
    int totalPlays = allPlays.isArray() ? allPlays.size() : 0;
    int totalPitches = 0;
    int pitchesWithCoords = 0;
    List<Map<String, Object>> samples = new ArrayList<>();

    if (allPlays.isArray()) {
        for (JsonNode play : allPlays) {
            String halfInning = play.path("about").path("halfInning").asText();
            int inning = play.path("about").path("inning").asInt();
            String batterName = play.path("matchup").path("batter").path("fullName").asText();
            String pitcherName = play.path("matchup").path("pitcher").path("fullName").asText();

            for (JsonNode event : play.path("playEvents")) {
                if (!"pitch".equals(event.path("type").asText())) continue;
                totalPitches++;

                JsonNode pd = event.path("pitchData");
                JsonNode coords = pd.path("coordinates");
                JsonNode details = event.path("details");

                boolean hasCoords = !coords.isMissingNode() && !coords.isEmpty()
                        && (coords.has("pX") || coords.has("x"));
                if (hasCoords) pitchesWithCoords++;

                if (hasCoords && samples.size() < 50) {
                    Map<String, Object> s = new LinkedHashMap<>();
                    s.put("inning", inning);
                    s.put("halfInning", halfInning);
                    s.put("batterName", batterName);
                    s.put("pitcherName", pitcherName);
                    s.put("pitchType", details.path("type").path("description").asText(null));
                    s.put("pitchDescription", details.path("description").asText(null));
                    s.put("callDescription", details.path("call").path("description").asText(null));
                    s.put("isBall", details.path("isBall").asBoolean(false));
                    s.put("isStrike", details.path("isStrike").asBoolean(false));
                    s.put("isInPlay", details.path("isInPlay").asBoolean(false));
                    s.put("zone", pd.has("zone") ? pd.path("zone").asInt() : null);
                    s.put("strikeZoneTop", pd.has("strikeZoneTop") ? pd.path("strikeZoneTop").asDouble() : null);
                    s.put("strikeZoneBottom", pd.has("strikeZoneBottom") ? pd.path("strikeZoneBottom").asDouble() : null);
                    s.put("coordinatesPresent", true);
                    s.put("x", coords.has("x") ? coords.path("x").asDouble() : null);
                    s.put("y", coords.has("y") ? coords.path("y").asDouble() : null);
                    s.put("plateX", coords.has("pX") ? coords.path("pX").asDouble() : null);
                    s.put("plateZ", coords.has("pZ") ? coords.path("pZ").asDouble() : null);
                    s.put("startSpeed", pd.has("startSpeed") ? pd.path("startSpeed").asDouble() : null);
                    s.put("endSpeed", pd.has("endSpeed") ? pd.path("endSpeed").asDouble() : null);
                    samples.add(s);
                }
            }
        }
    }

    result.put("totalPlays", totalPlays);
    result.put("totalPitches", totalPitches);
    result.put("pitchesWithCoordinates", pitchesWithCoords);
    result.put("samplePitches", samples);
    return ApiResponse.ok(result);
}
```

---

## 검증

```powershell
cd frontend; npm run build
cd ..; .\mvnw.cmd compile
```

서버 실행 후:
```
GET /api/admin/mlb/test-pitches/{gamePk}
```
