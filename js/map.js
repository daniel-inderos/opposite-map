
// ... existing code ...

function updateInfo(lat1, lng1, lat2, lng2) {
    const infoPanel = document.getElementById('infoContent');
    const loadingSpinner = document.querySelector('.loading-spinner');
    
    // Show loading spinner
    loadingSpinner.style.display = 'block';
    infoPanel.style.opacity = '0';
    
    // Simulate API call delay
    setTimeout(() => {
        const infoHTML = `
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Selected Location</div>
                    <div class="info-value">${lat1.toFixed(4)}, ${lng1.toFixed(4)}</div>
                    <div class="info-label">Terrain</div>
                    <div class="info-value">${isOcean(lat1, lng1) ? 'Ocean' : 'Land'}</div>
                    <div class="info-label">Local Time</div>
                    <div class="info-value">${getLocalTime(lat1, lng1)}</div>
                    <div class="info-label">Day/Night</div>
                    <div class="info-value">${isDaytime(lat1, lng1) ? 'Day' : 'Night'}</div>
                </div>
                ${lat2 !== null && lng2 !== null ? `
                <div class="info-item">
                    <div class="info-label">Opposite Location</div>
                    <div class="info-value">${lat2.toFixed(4)}, ${lng2.toFixed(4)}</div>
                    <div class="info-label">Terrain</div>
                    <div class="info-value">${isOcean(lat2, lng2) ? 'Ocean' : 'Land'}</div>
                    <div class="info-label">Local Time</div>
                    <div class="info-value">${getLocalTime(lat2, lng2)}</div>
                    <div class="info-label">Day/Night</div>
                    <div class="info-value">${isDaytime(lat2, lng2) ? 'Day' : 'Night'}</div>
                    <div class="info-label">Distance</div>
                    <div class="info-value">${calculateDistance(lat1, lng1, lat2, lng2).toFixed(2)} km</div>
                </div>
                ` : ''}
            </div>
        `;
        
        // Hide loading spinner and show info
        loadingSpinner.style.display = 'none';
        infoPanel.innerHTML = infoHTML;
        infoPanel.style.opacity = '1';
        infoPanel.style.transition = 'opacity 0.3s ease';
    }, 500);
}

// ... rest of the code ...
      