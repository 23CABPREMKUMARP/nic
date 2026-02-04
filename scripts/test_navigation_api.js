const http = require('http');

function postRequest(path, body) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body)
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({ statusCode: res.statusCode, body: parsed });
                } catch (e) {
                    resolve({ statusCode: res.statusCode, body: data });
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.write(body);
        req.end();
    });
}

async function testNavigation() {
    console.log("🚀 Starting API-Only Navigation Test...\n");

    const validPayload = JSON.stringify({
        start: { lat: 11.4050, lng: 76.6960 }, // Bus Stand
        end: { lat: 11.4120, lng: 76.6850 },   // Finger Post (Short real route)
        vehicle: "car"
    });

    try {
        console.log("Test 1: Standard API Route (Online Check)");
        const res = await postRequest('/api/navigation/route', validPayload);

        if (res.statusCode === 200 && res.body.success) {
            console.log("✅ Success: API returned 200 OK");
            console.log(`   Distance: ${res.body.route.distance} km`);
            console.log(`   Duration: ${res.body.route.duration} min`);
            console.log(`   Source: ${res.body.route.source}`); // Should be 'graphhopper'

            if (res.body.route.source === 'graphhopper') {
                console.log("✅ Verified: Route came from GraphHopper API");
            } else {
                console.log("⚠️ Warning: Route source is", res.body.route.source);
            }

        } else {
            console.error("❌ Failed:", res.statusCode);
            console.error("   Error:", res.body.error || res.body);
        }

    } catch (e) {
        console.error("❌ Connection Failed:", e.message);
    }
}

testNavigation();
