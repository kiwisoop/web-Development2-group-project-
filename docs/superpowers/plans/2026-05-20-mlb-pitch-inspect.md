# MLB Pitch Data Inspection Endpoint Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `GET /api/admin/mlb/test-pitches/{gamePk}` to inspect MLB pitch coordinate field availability before implementing the strike zone chart UI.

**Architecture:** Single method added to existing `MlbSyncController` using the same `Map<String, Object>` pattern as the existing `test-detail` endpoint. Calls `mlbApiService.fetchGameFeedLive(gamePk)` (already exists), iterates `liveData.plays.allPlays[].playEvents[]`, extracts up to 50 pitches with coordinates.

**Tech Stack:** Spring Boot 3.5, Java 25, Jackson JsonNode, Lombok, RestClient

> ⚠️ git commit 금지

---

## File Map

| 작업 | 경로 |
|------|------|
| Modify | `src/main/java/com/sport/web_sport/baseball/controller/MlbSyncController.java` |

---

## Task 1: Add testPitches endpoint to MlbSyncController

**Files:**
- Modify: `src/main/java/com/sport/web_sport/baseball/controller/MlbSyncController.java`

> **Context:** `MlbSyncController` is at `/api/admin/mlb`. It already has `test-detail/{gamePk}` that uses `Map<String, Object>` + `authService.requireAdmin(session)`. We follow the exact same pattern. No new imports needed beyond what's already at the top of the file (`ArrayList`, `LinkedHashMap`, `List`, `Map`, `JsonNode`).

- [ ] **Step 1: Add the `testPitches` method to `MlbSyncController`**

Open `src/main/java/com/sport/web_sport/baseball/controller/MlbSyncController.java`.

Insert the following method immediately after the closing brace of the `testDetail` method (before the `rhe` private helper method). The file currently ends at line 132. Insert starting at line 113, before the `private Map<String, Object> rhe(...)` line:

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
                int inning = play.path("about").path("inning").asInt();
                String halfInning = play.path("about").path("halfInning").asText();
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

- [ ] **Step 2: Frontend build verification**

```powershell
cd E:\web3\web-sport-react-rebuild\frontend
npm run build
```

Expected output ends with:
```
✓ built in ...s
```

If errors appear, fix them before continuing.

- [ ] **Step 3: Backend compile verification**

```powershell
cd E:\web3\web-sport-react-rebuild
.\mvnw.cmd compile
```

Expected output ends with:
```
[INFO] BUILD SUCCESS
```

If compile errors appear:
- `cannot find symbol`: check import section — all needed imports (`ArrayList`, `LinkedHashMap`, `List`, `Map`, `JsonNode`) are already present in the file at lines 15–19.
- `incompatible types`: verify `asDouble()` / `asInt()` / `asBoolean()` / `asText()` usage matches the JsonNode API.

---

## Self-Review Checklist

- [x] `gamePk` in response ✓
- [x] `totalPlays` ✓
- [x] `totalPitches` ✓
- [x] `pitchesWithCoordinates` ✓
- [x] `samplePitches` max 50 ✓
- [x] Each sample: inning, halfInning, batterName, pitcherName ✓
- [x] pitchType, pitchDescription, callDescription ✓
- [x] isBall, isStrike, isInPlay ✓
- [x] zone, strikeZoneTop, strikeZoneBottom ✓
- [x] coordinatesPresent, x, y, plateX (=pX), plateZ (=pZ) ✓
- [x] startSpeed, endSpeed ✓
- [x] Admin auth (`authService.requireAdmin(session)`) ✓
- [x] No git commit ✓
- [x] No full MLB JSON returned ✓
