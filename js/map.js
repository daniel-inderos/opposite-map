const map = L.map('map').setView([0, 0], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

let marker, oppositeMarker, line;
let selectedLat, selectedLng;

// Map click event
map.on('click', function(e) {
    selectedLat = e.latlng.lat;
    selectedLng = e.latlng.lng;

    if (marker) map.removeLayer(marker);
    marker = L.marker([selectedLat, selectedLng]).addTo(map);

    updateInfo(selectedLat, selectedLng, null, null);
});

// Go to Opposite button
document.getElementById('goToOpposite').addEventListener('click', function() {
    if (selectedLat === undefined || selectedLng === undefined) {
        alert('Please select a point on the map first.');
        return;
    }

    const oppositeLat = -selectedLat;
    const oppositeLng = (selectedLng < 0) ? selectedLng + 180 : selectedLng - 180;

    if (oppositeMarker) map.removeLayer(oppositeMarker);
    oppositeMarker = L.marker([oppositeLat, oppositeLng]).addTo(map);

    // Draw line
    if (line) map.removeLayer(line);
    line = L.polyline([[selectedLat, selectedLng], [oppositeLat, oppositeLng]], {color: 'red'}).addTo(map);

    map.fitBounds(line.getBounds());

    updateInfo(selectedLat, selectedLng, oppositeLat, oppositeLng);
});

// Geolocation
document.getElementById('geolocate').addEventListener('click', function() {
    map.locate({setView: true, maxZoom: 16});
});

map.on('locationfound', function(e) {
    selectedLat = e.latlng.lat;
    selectedLng = e.latlng.lng;

    if (marker) map.removeLayer(marker);
    marker = L.marker(e.latlng).addTo(map);

    updateInfo(selectedLat, selectedLng, null, null);
});

map.on('locationerror', function(e) {
    alert("Unable to find your location. Please check your device settings.");
});

function updateInfo(lat1, lng1, lat2, lng2) {
    let info = `Selected: ${lat1.toFixed(4)}, ${lng1.toFixed(4)}<br>`;
    info += `Terrain: ${isOcean(lat1, lng1) ? 'Ocean' : 'Land'}<br>`;
    info += `Local Time: ${getLocalTime(lat1, lng1)}<br>`;
    info += `Day/Night: ${isDaytime(lat1, lng1) ? 'Day' : 'Night'}<br>`;

    if (lat2 !== null && lng2 !== null) {
        info += `<br>Opposite: ${lat2.toFixed(4)}, ${lng2.toFixed(4)}<br>`;
        info += `Terrain: ${isOcean(lat2, lng2) ? 'Ocean' : 'Land'}<br>`;
        info += `Local Time: ${getLocalTime(lat2, lng2)}<br>`;
        info += `Day/Night: ${isDaytime(lat2, lng2) ? 'Day' : 'Night'}<br>`;
        info += `<br>Distance: ${calculateDistance(lat1, lng1, lat2, lng2).toFixed(2)} km`;
    }

    document.getElementById('info').innerHTML = info;
}

function getLocalTime(lat, lng) {
    const offsetHours = Math.round(lng / 15);
    return moment.utc().utcOffset(offsetHours * 60).format('YYYY-MM-DD HH:mm:ss');
}

function isDaytime(lat, lng) {
    const date = new Date();
    let hour = date.getUTCHours() + (lng / 15);
    hour = (hour + 24) % 24; // normalize to 0-23 range
    return hour >= 6 && hour < 18;
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2-lat1);
    const dLon = deg2rad(lon2-lon1); 
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const d = R * c; // Distance in km
    return d;
}

function deg2rad(deg) {
    return deg * (Math.PI/180);
}

function isOcean(lat, lng) {
    // Major continents rough boundaries
    const landmasses = [
        // North America
        { minLat: 15, maxLat: 72, minLng: -168, maxLng: -52 },
        // South America
        { minLat: -56, maxLat: 12, minLng: -81, maxLng: -34 },
        // Europe and Asia
        { minLat: 35, maxLat: 70, minLng: -10, maxLng: 180 },
        { minLat: 0, maxLat: 35, minLng: 20, maxLng: 150 },
        // Africa
        { minLat: -35, maxLat: 37, minLng: -17, maxLng: 51 },
        // Australia
        { minLat: -44, maxLat: -10, minLng: 113, maxLng: 154 }
    ];

    // Normalize longitude to -180 to 180 range
    let normalizedLng = lng;
    while (normalizedLng > 180) normalizedLng -= 360;
    while (normalizedLng < -180) normalizedLng += 360;

    // Check if the point is within any landmass
    for (const landmass of landmasses) {
        if (lat >= landmass.minLat && lat <= landmass.maxLat &&
            normalizedLng >= landmass.minLng && normalizedLng <= landmass.maxLng) {
            return false; // Not ocean
        }
    }
    
    return true; // Ocean
} 