const map2D = L.map('map').setView([0, 0], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map2D);

const map3D = WE.map('globe');
WE.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map3D);
map3D.setView([0, 0], 2);

let marker2D, oppositeMarker2D, line2D;
let marker3D, oppositeMarker3D, line3D;
let selectedLat, selectedLng, oppositeLat, oppositeLng;
let currentMode = '2D';

// Initialize favorites on load
populateFavorites();

function switchTo2D() {
    document.getElementById('globe').style.display = 'none';
    document.getElementById('map').style.display = 'block';
    currentMode = '2D';
    renderMarkers();
    document.getElementById('toggleMode').innerText = 'Switch to 3D';
}

function switchTo3D() {
    document.getElementById('map').style.display = 'none';
    document.getElementById('globe').style.display = 'block';
    currentMode = '3D';
    renderMarkers();
    document.getElementById('toggleMode').innerText = 'Switch to 2D';
}

// Search form submission
document.getElementById('searchForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const query = document.getElementById('searchInput').value.trim();
    if (!query) return;

    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`)
        .then(res => res.json())
        .then(data => {
            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lon = parseFloat(data[0].lon);
                handleMapClick(lat, lon);
                
                if (currentMode === '2D') {
                    map2D.setView([lat, lon], 12);
                } else {
                    map3D.setView([lat, lon], 3);
                }
                
                updateURL(lat, lon);
            } else {
                alert('Location not found.');
            }
        })
        .catch(() => alert('Error fetching location.'));
});

// Check query parameters on load
const params = new URLSearchParams(window.location.search);
const paramLat = parseFloat(params.get('lat'));
const paramLng = parseFloat(params.get('lng'));
if (!isNaN(paramLat) && !isNaN(paramLng)) {
    selectedLat = paramLat;
    selectedLng = paramLng;
    if (currentMode === '2D') {
        map2D.setView([selectedLat, selectedLng], 6);
    } else {
        map3D.setView([selectedLat, selectedLng], 3);
    }
    renderMarkers();
    updateInfo(selectedLat, selectedLng, null, null);
}

function updateURL(lat, lng) {
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set('lat', lat);
    urlParams.set('lng', lng);
    const newUrl = window.location.pathname + '?' + urlParams.toString();
    history.replaceState({}, '', newUrl);
}

document.getElementById('toggleMode').addEventListener('click', function() {
    if (currentMode === '2D') {
        switchTo3D();
    } else {
        switchTo2D();
    }
});

function handleMapClick(lat, lng) {
    selectedLat = lat;
    selectedLng = lng;
    oppositeLat = null;
    oppositeLng = null;
    renderMarkers();
    fetchWeather(selectedLat, selectedLng).then(weather => {
        updateInfo(selectedLat, selectedLng, null, null, weather);
    });
    updateURL(selectedLat, selectedLng);
}

map2D.on('click', function(e) {
    handleMapClick(e.latlng.lat, e.latlng.lng);
});

map3D.on('click', function(e) {
    handleMapClick(e.latlng.lat, e.latlng.lng);
});

// Save Favorite button
document.getElementById('saveFavorite').addEventListener('click', function() {
    if (!selectedLat || !selectedLng) {
        alert('Please select a point on the map first.');
        return;
    }

    const oppLat = -selectedLat;
    const oppLng = (selectedLng < 0) ? selectedLng + 180 : selectedLng - 180;

    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    favorites.push({ lat: selectedLat, lng: selectedLng, oppLat: oppLat, oppLng: oppLng });
    localStorage.setItem('favorites', JSON.stringify(favorites));

    populateFavorites();
});

document.getElementById('goToOpposite').addEventListener('click', async function() {
    if (selectedLat == null || selectedLng == null) {
        alert('Please select a point on the map first.');
        return;
    }
    oppositeLat = -selectedLat;
    oppositeLng = (selectedLng < 0) ? selectedLng + 180 : selectedLng - 180;
    
    const [weather1, weather2] = await Promise.all([
        fetchWeather(selectedLat, selectedLng),
        fetchWeather(oppositeLat, oppositeLng)
    ]);
    
    renderMarkers();
    updateInfo(selectedLat, selectedLng, oppositeLat, oppositeLng, weather1, weather2);
});

document.getElementById('geolocate').addEventListener('click', function() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(pos) {
            handleMapClick(pos.coords.latitude, pos.coords.longitude);
            if (currentMode === '2D') {
                map2D.setView([selectedLat, selectedLng], 16);
            } else {
                map3D.setView([selectedLat, selectedLng], 3);
            }
        }, function() {
            alert('Unable to find your location. Please check your device settings.');
        });
    } else {
        alert('Geolocation is not supported by your browser.');
    }
});

document.getElementById('share').addEventListener('click', function() {
    navigator.clipboard.writeText(window.location.href)
        .then(() => alert('URL copied to clipboard!'))
        .catch(() => alert('Failed to copy URL.'));
});

function renderMarkers() {
    if (currentMode === '2D') {
        if (marker2D) map2D.removeLayer(marker2D);
        if (selectedLat != null) {
            marker2D = L.marker([selectedLat, selectedLng]).addTo(map2D);
        }
        if (oppositeMarker2D) map2D.removeLayer(oppositeMarker2D);
        if (line2D) map2D.removeLayer(line2D);
        if (oppositeLat != null) {
            oppositeMarker2D = L.marker([oppositeLat, oppositeLng]).addTo(map2D);
            line2D = L.polyline([[selectedLat, selectedLng], [oppositeLat, oppositeLng]], { color: 'red' }).addTo(map2D);
            map2D.fitBounds(line2D.getBounds());
        }
    } else {
        if (marker3D) map3D.removeLayer(marker3D);
        if (selectedLat != null) {
            marker3D = WE.marker([selectedLat, selectedLng]).addTo(map3D);
        }
        if (oppositeMarker3D) map3D.removeLayer(oppositeMarker3D);
        if (line3D) map3D.removeLayer(line3D);
        if (oppositeLat != null) {
            oppositeMarker3D = WE.marker([oppositeLat, oppositeLng]).addTo(map3D);
            line3D = WE.polyline([[selectedLat, selectedLng], [oppositeLat, oppositeLng]], { color: 'red' }).addTo(map3D);
            map3D.setView([selectedLat, selectedLng], map3D.getZoom());
        }
    }
}

function updateInfo(lat1, lng1, lat2, lng2, weather1, weather2) {
    let info = `Selected: ${lat1.toFixed(4)}, ${lng1.toFixed(4)}<br>`;
    info += `Terrain: ${isOcean(lat1, lng1) ? 'Ocean' : 'Land'}<br>`;
    info += `Local Time: ${getLocalTime(lat1, lng1)}<br>`;
    info += `Day/Night: ${isDaytime(lat1, lng1) ? 'Day' : 'Night'}<br>`;
    info += `Weather: ${weather1 ? weather1 : 'Weather unavailable'}<br>`;

    if (lat2 !== null && lng2 !== null) {
        info += `<br>Opposite: ${lat2.toFixed(4)}, ${lng2.toFixed(4)}<br>`;
        info += `Terrain: ${isOcean(lat2, lng2) ? 'Ocean' : 'Land'}<br>`;
        info += `Local Time: ${getLocalTime(lat2, lng2)}<br>`;
        info += `Day/Night: ${isDaytime(lat2, lng2) ? 'Day' : 'Night'}<br>`;
        info += `Weather: ${weather2 ? weather2 : 'Weather unavailable'}<br>`;
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

async function fetchWeather(lat, lng) {
    try {
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        if (data && data.current_weather && typeof data.current_weather.temperature !== 'undefined') {
            return `${data.current_weather.temperature}\u00B0C`;
        }
    } catch (err) {
        console.error('Weather fetch error:', err);
    }
    return null;
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

function isOcean(lat, lng) {
    const landmasses = [
        { minLat: 15, maxLat: 72, minLng: -168, maxLng: -52 },
        { minLat: -56, maxLat: 12, minLng: -81, maxLng: -34 },
        { minLat: 35, maxLat: 70, minLng: -10, maxLng: 180 },
        { minLat: 0, maxLat: 35, minLng: 20, maxLng: 150 },
        { minLat: -35, maxLat: 37, minLng: -17, maxLng: 51 },
        { minLat: -44, maxLat: -10, minLng: 113, maxLng: 154 }
    ];

    let normalizedLng = lng;
    while (normalizedLng > 180) normalizedLng -= 360;
    while (normalizedLng < -180) normalizedLng += 360;

    for (const landmass of landmasses) {
        if (
            lat >= landmass.minLat &&
            lat <= landmass.maxLat &&
            normalizedLng >= landmass.minLng &&
            normalizedLng <= landmass.maxLng
        ) {
            return false;
        }
    }

    return true; // Ocean
}

function populateFavorites() {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const select = document.getElementById('favoritesList');
    if (!select) return;
    select.innerHTML = '';
    const placeholder = document.createElement('option');
    placeholder.textContent = 'Select favorite';
    placeholder.disabled = true;
    placeholder.selected = true;
    select.appendChild(placeholder);
    favorites.forEach((fav, idx) => {
        const opt = document.createElement('option');
        opt.value = idx;
        opt.textContent = `${fav.lat.toFixed(4)}, ${fav.lng.toFixed(4)}`;
        select.appendChild(opt);
    });
}

document.getElementById('favoritesList').addEventListener('change', function() {
    const index = parseInt(this.value, 10);
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const fav = favorites[index];
    if (!fav) return;

    selectedLat = fav.lat;
    selectedLng = fav.lng;
    oppositeLat = fav.oppLat;
    oppositeLng = fav.oppLng;

    if (currentMode === '2D') {
        map2D.setView([selectedLat, selectedLng], 6);
    } else {
        map3D.setView([selectedLat, selectedLng], 3);
    }
    
    renderMarkers();
    updateInfo(selectedLat, selectedLng, oppositeLat, oppositeLng);
});
