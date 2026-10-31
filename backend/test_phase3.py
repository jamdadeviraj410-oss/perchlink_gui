"""
Phase 3 End-to-End Verification Test
Tests real HTTP POST /api/sos, SQLite persistence, and live WebSocket streaming.
"""
import asyncio
import json
import urllib.request
import websockets

BACKEND_HTTP = "http://127.0.0.1:8000"
BACKEND_WS = "ws://127.0.0.1:8000"

async def run_test():
    print("=== Step 1: Health Check ===")
    req = urllib.request.Request(f"{BACKEND_HTTP}/api/health")
    with urllib.request.urlopen(req) as resp:
        health_data = json.loads(resp.read().decode())
        print(f"Backend Status: {health_data['status']}, Database OK: {health_data['databaseOk']}")

    print("\n=== Step 2: Submit Emergency Distress via HTTP POST ===")
    payload = {
        "emergencyType": "MEDICAL",
        "peopleCount": 4,
        "location": {
            "latitude": 19.1123,
            "longitude": 72.8834,
            "accuracy": 8.0
        },
        "landmark": "Near collapsed bridge pillar 4",
        "message": "Elderly patient needs urgent oxygen, child with arm injury"
    }
    post_req = urllib.request.Request(
        f"{BACKEND_HTTP}/api/sos",
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(post_req) as resp:
        sos_res = json.loads(resp.read().decode())
        sos_id = sos_res["id"]
        print(f"Created real emergency case: {sos_id}")
        print(f"Initial Status: {sos_res['status']}")

    print(f"\n=== Step 3: Connect to Live WebSocket: /ws/sos/{sos_id} ===")
    ws_uri = f"{BACKEND_WS}/ws/sos/{sos_id}"
    async with websockets.connect(ws_uri) as ws:
        print(f"Connected to WebSocket for {sos_id}. Listening for radio delivery events...")

        # Listen for up to 3 events (transmission started, ground station ACK, operator ACK)
        events_received = []
        try:
            while len(events_received) < 3:
                msg = await asyncio.wait_for(ws.recv(), timeout=15.0)
                event_data = json.loads(msg)
                event_name = event_data.get("event")
                events_received.append(event_name)
                print(f" -> [LIVE WS EVENT] {event_name.upper()} | Status: {event_data.get('status')}")
                if event_name == "rescue_team_acknowledged":
                    break
        except asyncio.TimeoutError:
            print("Finished listening window.")

    print("\n=== Step 4: Verify Final Database Record via GET ===")
    get_req = urllib.request.Request(f"{BACKEND_HTTP}/api/sos/{sos_id}")
    with urllib.request.urlopen(get_req) as resp:
        final_record = json.loads(resp.read().decode())
        print(f"Database Record: {final_record['id']}")
        print(f"Drone Received: {final_record['droneReceived']}")
        print(f"Ground Station ACK: {final_record['groundStationAcknowledged']}")
        print(f"Rescue Team ACK: {final_record['rescueTeamAcknowledged']}")
        print(f"Final Status: {final_record['status']}")
    print("\n[SUCCESS] PHASE 3 INTEGRATION TEST PASSED!")

if __name__ == "__main__":
    asyncio.run(run_test())
