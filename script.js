import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js';
import { getFirestore, collection, addDoc, getDocs, GeoPoint } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyD5UxLdEGzpzi4agytbzmICJln3jaPhsXc",
  authDomain: "clm-pins-8bdf1.firebaseapp.com",
  projectId: "clm-pins-8bdf1",
  storageBucket: "clm-pins-8bdf1.firebasestorage.app",
  messagingSenderId: "311808248170",
  appId: "1:311808248170:web:0f73c2c2c87e10c98f3d13"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Initialize Mapbox
mapboxgl.accessToken = 'pk.eyJ1IjoidGlueXBvcGUiLCJhIjoiY205ZWpmcjRzMWVtYzJqcHZvZjh4ZHNicSJ9.RZdMZyElBD18vmbvPupP7Q';

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v11',
  center: [-98.5795, 39.8283], 
  zoom: 5,
});


const bounds = [
  [-130.0, 22], 
  [-60.0, 53] 
];

map.setMaxBounds(bounds);


map.setMinZoom(3); 
map.setMaxZoom(20); 

map.addControl(new mapboxgl.GeolocateControl());
map.addControl(new mapboxgl.NavigationControl());

// Star marker function
const createStarMarker = (longitude, latitude) => {
  const star = document.createElement('div');
  star.className = 'star-marker';
  star.innerHTML = '★';
  star.style.fontSize = '50px';
  star.style.cursor = 'pointer';

  new mapboxgl.Marker({ element: star })
    .setLngLat([longitude, latitude])
    .addTo(map);
};

// Autocomplete address input
const addressInput = document.getElementById('address');
const suggestionsContainer = document.getElementById('suggestions-container');

console.log('Suggestions container:', suggestionsContainer);

addressInput.addEventListener('input', () => {
  const query = addressInput.value.trim();
  if (query.length === 0) {
    suggestionsContainer.innerHTML = '';
    return;
  }

  fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxgl.accessToken}&country=us`)
    .then(response => response.json())
    .then(data => {
      suggestionsContainer.innerHTML = '';

      data.features.forEach(feature => {
        const div = document.createElement('div');
        div.classList.add('suggestion');
        div.textContent = feature.place_name;
        div.addEventListener('click', () => {
          addressInput.value = feature.place_name;
          suggestionsContainer.innerHTML = '';
        });
        suggestionsContainer.appendChild(div);
      });
    })
    .catch(err => {
      console.error('Error fetching suggestions:', err);
    });
});

// Handle form submission
document.getElementById('addressForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const address = addressInput.value;

  fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${mapboxgl.accessToken}`)
    .then(response => response.json())
    .then(data => {
      if (data.features.length > 0) {
        const [longitude, latitude] = data.features[0].geometry.coordinates;

        const star = document.createElement('div');
        star.className = 'star-marker';
        star.innerHTML = '★';
        star.style.fontSize = '50px';
        star.style.cursor = 'pointer';

        new mapboxgl.Marker({ element: star })
          .setLngLat([longitude, latitude])
          .addTo(map);

        addDoc(collection(db, "locations"), {
          address: address,
          coordinates: new GeoPoint(latitude, longitude),
        }).then(() => {
          console.log('Location added to Firestore');
        }).catch((error) => {
          console.error('Error adding location to Firestore:', error);
        });

        addressInput.value = '';
      } else {
        alert('Address not found');
      }
    })
    .catch(error => {
      console.error('Error fetching geolocation data:', error);
      alert('Error fetching location');
    });
});

// Hide suggestions when clicking outside
document.addEventListener('click', (e) => {
  if (!addressInput.contains(e.target) && !suggestionsContainer.contains(e.target)) {
    suggestionsContainer.innerHTML = '';
  }
});

// Fetch locations and add markers when page loads
const fetchLocations = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "locations"));
    querySnapshot.forEach(doc => {
      const data = doc.data();
      const { address, coordinates } = data;
      const latitude = coordinates.latitude;
      const longitude = coordinates.longitude;
      
      createStarMarker(longitude, latitude);
    });
  } catch (error) {
    console.error("Error fetching locations: ", error);
  }
};

// Call the function when the page loads
window.onload = () => {
  fetchLocations();
};
