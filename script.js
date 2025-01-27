
        let map;
        let currentLayer;

        // Initialize the map
        function initMap() {
          map = L.map('map').setView([0, 0], 2);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
          }).addTo(map);
        }

        // Calculate antipodal point
        function calculateOpposite(lat, lng) {
          let oppositeLng = lng + 180;
          if (oppositeLng > 180) oppositeLng -= 360;
          if (oppositeLng < -180) oppositeLng += 360;
          
          return {
            lat: lat,
            lng: oppositeLng
          };
        }

        // Geocode address using Nominatim
        async function geocodeAddress() {
          const address = document.getElementById('address').value;
          try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
            const data = await response.json();
            
            if (data.length === 0) {
              showError('Address not found');
              return;
            }

            const lat = parseFloat(data[0].lat);
            const lng = parseFloat(data[0].lon);
            
            displayResult(lat, lng, calculateOpposite(lat, lng));
          } catch (error) {
            showError('Failed to geocode address');
          }
        }

        // Display result with map markers
        function displayResult(originalLat, originalLng, opposite) {
          const resultDiv = document.getElementById('result');
          resultDiv.innerHTML = `
            <h3>Original Location:</h3>
            <p>Latitude: ${originalLat}</p>
            <p>Longitude: ${originalLng}</p>
            <h3>Opposite Location:</h3>
            <p>Latitude: ${opposite.lat}</p>
            <p>Longitude: ${opposite.lng}</p>
          `;

          // Clear previous markers
          if (currentLayer) map.removeLayer(currentLayer);

          // Add new markers
          currentLayer = L.layerGroup().addTo(map);
          addMarker(originalLat, originalLng, 'Original', currentLayer);
          addMarker(opposite.lat, opposite.lng, 'Opposite', currentLayer);

          map.setView([originalLat, originalLng], 5);
        }

        function addMarker(lat, lng, label, layer) {
          const marker = L.marker([lat, lng]).addTo(layer);
          marker.bindPopup(label).openPopup();
        }

        // Error handling
        function showError(message) {
          const resultDiv = document.getElementById('result');
          resultDiv.innerHTML = `
            <div style="color: red;">${message}</div>
          `;
        }

        // Initialize the map when the page loads
        window.onload = initMap;
      