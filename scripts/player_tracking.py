from ultralytics import YOLO
import cv2
import json
import os
import math
import torch

# ==========================================
# 기본 경로 설정
# ==========================================

BASE_DIR = r"E:\team project"

input_video = os.path.join(BASE_DIR, "videos", "custom_clip_01_hq.mp4")
output_video = os.path.join(BASE_DIR, "outputs", "custom_clip_01_tracked_temp.avi")
output_json = os.path.join(BASE_DIR, "outputs", "custom_clip_01_tracking.json")
tracker_config = os.path.join(BASE_DIR, "scripts", "bytetrack_custom.yaml")

# ==========================================
# 추적 설정
# ==========================================

MAX_DISPLAY_PLAYERS = 22

CONFIDENCE_THRESHOLD = 0.18
IMAGE_SIZE = 1600

MIN_BOX_WIDTH = 6
MIN_BOX_HEIGHT = 14

# 선수가 잠깐 사라졌다가 다시 잡혔을 때 같은 번호를 재사용할 프레임 수
# 30fps 기준 90프레임 = 약 3초
REUSE_GRACE_FRAMES = 90

# 이전 위치와 새 위치가 이 거리 이하면 같은 선수로 보고 번호 재사용
# fieldPosition 기준 0~100 좌표
REUSE_DISTANCE_THRESHOLD = 12.0

# ==========================================
# GPU 확인
# ==========================================

if torch.cuda.is_available():
    device = 0
    print("CUDA 사용 가능:", torch.cuda.get_device_name(0))
else:
    device = "cpu"
    print("CUDA 사용 불가: CPU로 실행합니다.")

# ==========================================
# YOLO 모델 로드
# ==========================================

# 정확도 우선: yolov8m.pt
# 너무 느리면 yolov8s.pt로 바꿔도 됨
model = YOLO("yolov8m.pt")

if device != "cpu":
    model.to("cuda")

# ==========================================
# 영상 열기
# ==========================================

cap = cv2.VideoCapture(input_video)

if not cap.isOpened():
    raise RuntimeError(f"영상 파일을 열 수 없습니다: {input_video}")

fps = cap.get(cv2.CAP_PROP_FPS)
width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

print("입력 영상:", input_video)
print("FPS:", fps)
print("해상도:", width, "x", height)
print("전체 프레임:", total_frames)

os.makedirs(os.path.dirname(output_video), exist_ok=True)

fourcc = cv2.VideoWriter_fourcc(*"MJPG")
out = cv2.VideoWriter(output_video, fourcc, fps, (width, height))

if not out.isOpened():
    raise RuntimeError(f"출력 영상 파일을 만들 수 없습니다: {output_video}")

# ==========================================
# 표시 번호 관리
# ==========================================

# raw trackId -> display number
track_to_display = {}

# display number -> 상태 정보
display_states = {}

def distance(p1, p2):
    return math.sqrt((p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2)

def assign_display_number(raw_track_id, field_position, frame_index, used_display_numbers):
    """
    raw_track_id는 YOLO/ByteTrack 내부 ID
    display_number는 화면에 보여줄 P1~P22 번호
    """

    # 이미 매핑된 trackId면 기존 번호 사용
    if raw_track_id in track_to_display:
        num = track_to_display[raw_track_id]
        if num not in used_display_numbers:
            return num

    # 새 trackId인데, 최근 사라진 선수 위치와 가까우면 기존 번호 재사용
    best_num = None
    best_dist = float("inf")

    for num, state in display_states.items():
        if num in used_display_numbers:
            continue

        last_seen = state["lastSeenFrame"]
        last_pos = state["fieldPosition"]

        if frame_index - last_seen > REUSE_GRACE_FRAMES:
            continue

        dist = distance(field_position, last_pos)

        if dist < best_dist and dist <= REUSE_DISTANCE_THRESHOLD:
            best_dist = dist
            best_num = num

    if best_num is not None:
        old_track_id = display_states[best_num].get("rawTrackId")

        if old_track_id in track_to_display:
            del track_to_display[old_track_id]

        track_to_display[raw_track_id] = best_num
        return best_num

    # 비어 있는 번호 찾기
    for num in range(1, MAX_DISPLAY_PLAYERS + 1):
        if num in used_display_numbers:
            continue

        if num not in display_states:
            track_to_display[raw_track_id] = num
            return num

        # 오래전에 사라진 번호는 재사용
        if frame_index - display_states[num]["lastSeenFrame"] > REUSE_GRACE_FRAMES:
            old_track_id = display_states[num].get("rawTrackId")

            if old_track_id in track_to_display:
                del track_to_display[old_track_id]

            track_to_display[raw_track_id] = num
            return num

    # 22명 초과면 표시하지 않음
    return None

def draw_player_id(frame, display_number, center_x, y1, box_height):
    display_id = f"P{display_number}"

    label_x = center_x
    label_y = max(y1 - 14, 22)

    if box_height < 35:
        radius = 12
        font_scale = 0.38
        thickness = 1
    else:
        radius = 18
        font_scale = 0.55
        thickness = 2

    cv2.circle(frame, (label_x, label_y), radius, (0, 0, 0), -1)

    text_size, _ = cv2.getTextSize(
        display_id,
        cv2.FONT_HERSHEY_SIMPLEX,
        font_scale,
        thickness
    )

    text_w, text_h = text_size
    text_x = int(label_x - text_w / 2)
    text_y = int(label_y + text_h / 2)

    cv2.putText(
        frame,
        display_id,
        (text_x, text_y),
        cv2.FONT_HERSHEY_SIMPLEX,
        font_scale,
        (255, 255, 255),
        thickness
    )

# ==========================================
# JSON 구조
# ==========================================

tracking_data = {
    "videoFile": "custom_clip_01_hq.mp4",
    "trackedVideoFile": "custom_clip_01_tracked_web.mp4",
    "tempTrackedVideoFile": "custom_clip_01_tracked_temp.avi",
    "fps": fps,
    "width": width,
    "height": height,
    "coordinateType": "image_normalized",
    "description": "displayId는 P1~P22로 제한된 표시 번호입니다. rawTrackId는 YOLO/ByteTrack 내부 추적 ID입니다.",
    "frames": []
}

frame_index = 0

# ==========================================
# 프레임 처리
# ==========================================

while True:
    ret, frame = cap.read()

    if not ret:
        break

    time_sec = frame_index / fps if fps > 0 else 0

    results = model.track(
        frame,
        persist=True,
        device=device,
        verbose=False,
        tracker=tracker_config,
        classes=[0],
        conf=CONFIDENCE_THRESHOLD,
        imgsz=IMAGE_SIZE
    )

    raw_players = []

    if results and results[0].boxes is not None:
        boxes = results[0].boxes

        for box in boxes:
            if box.id is None:
                continue

            raw_track_id = int(box.id[0])
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            conf = float(box.conf[0])

            x1, y1, x2, y2 = map(int, [x1, y1, x2, y2])

            box_width = x2 - x1
            box_height = y2 - y1

            if box_width < MIN_BOX_WIDTH or box_height < MIN_BOX_HEIGHT:
                continue

            center_x = int((x1 + x2) / 2)
            foot_y = int(y2)

            field_x = round(center_x / width * 100, 2)
            field_y = round(foot_y / height * 100, 2)

            # 점수: 신뢰도 + 박스 크기 기준
            area = box_width * box_height
            quality_score = conf * area

            raw_players.append({
                "rawTrackId": raw_track_id,
                "confidence": conf,
                "bbox": [x1, y1, x2, y2],
                "boxWidth": box_width,
                "boxHeight": box_height,
                "imageCenter": [center_x, foot_y],
                "fieldPosition": [field_x, field_y],
                "qualityScore": quality_score
            })

    # 가장 확실한 선수부터 처리
    raw_players.sort(key=lambda p: p["qualityScore"], reverse=True)

    players_for_frame = []
    used_display_numbers = set()

    for raw_player in raw_players:
        raw_track_id = raw_player["rawTrackId"]
        field_position = raw_player["fieldPosition"]

        display_number = assign_display_number(
            raw_track_id,
            field_position,
            frame_index,
            used_display_numbers
        )

        if display_number is None:
            continue

        used_display_numbers.add(display_number)

        x1, y1, x2, y2 = raw_player["bbox"]
        center_x, foot_y = raw_player["imageCenter"]
        box_height = raw_player["boxHeight"]

        draw_player_id(frame, display_number, center_x, y1, box_height)

        display_id = f"P{display_number}"

        player = {
            "displayNumber": display_number,
            "displayId": display_id,
            "rawTrackId": raw_track_id,
            "confidence": round(raw_player["confidence"], 3),
            "bbox": raw_player["bbox"],
            "imageCenter": raw_player["imageCenter"],
            "fieldPosition": raw_player["fieldPosition"]
        }

        players_for_frame.append(player)

        display_states[display_number] = {
            "rawTrackId": raw_track_id,
            "lastSeenFrame": frame_index,
            "fieldPosition": field_position
        }

    tracking_data["frames"].append({
        "frame": frame_index,
        "time": round(time_sec, 3),
        "players": players_for_frame
    })

    out.write(frame)
    frame_index += 1

    if frame_index % 30 == 0:
        percent = frame_index / total_frames * 100 if total_frames > 0 else 0
        print(f"{frame_index}/{total_frames} 프레임 처리 중... {percent:.1f}%")

# ==========================================
# 종료 및 저장
# ==========================================

cap.release()
out.release()

with open(output_json, "w", encoding="utf-8") as f:
    json.dump(tracking_data, f, ensure_ascii=False, indent=2)

print("추적 영상 생성 완료:", output_video)
print("추적 JSON 생성 완료:", output_json)
print("다음 명령어로 웹용 MP4 변환:")
print('ffmpeg -i "outputs\\custom_clip_01_tracked_temp.avi" -c:v h264_nvenc -cq 18 -preset p4 -pix_fmt yuv420p -movflags +faststart "outputs\\custom_clip_01_tracked_web.mp4"')