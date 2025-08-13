// API configuration
const API_KEY = '86c84f88d137cf5a245c70b755fe2bef'; // Replace with your actual API key
let currentUnit = 'metric'; // Default to Celsius

// DOM elements
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const weatherContainer = document.getElementById('weather-container');
const celsiusBtn = document.getElementById('celsius-btn');
const fahrenheitBtn = document.getElementById('fahrenheit-btn');
const currentDateTime = document.getElementById('current-date-time');

// Update current date and time
function updateDateTime() {
    const now = new Date();
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    currentDateTime.textContent = now.toLocaleDateString('en-US', options);
}

// Update time every minute
updateDateTime();
setInterval(updateDateTime, 60000);

// Default cities to display
const defaultCities = ['Istanbul', 'New York', 'Tokyo', 'Paris', 'Sydney'];

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', () => {
    // Load default cities
    defaultCities.forEach(city => {
        fetchWeatherData(city);
    });

    // Try to get user's location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const { latitude, longitude } = position.coords;

                // For Cairo area specifically (approximate coordinates)
                if (latitude > 29.8 && latitude < 30.2 && longitude > 31.1 && longitude < 31.4) {
                    // Just show Cairo directly without reverse geocoding
                    fetchWeatherData("Cairo");
                } else {
                    fetchWeatherByCoords(latitude, longitude);
                }
            },
            error => {
                console.log('Geolocation error:', error);
                // Fallback to Cairo if geolocation fails
                fetchWeatherData("Cairo");
            }
        );
    } else {
        // If geolocation not supported, show Cairo by default
        fetchWeatherData("Cairo");
    }
});

// Event listeners
searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) {
        fetchWeatherData(city);
        cityInput.value = '';
    }
});

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const city = cityInput.value.trim();
        if (city) {
            fetchWeatherData(city);
            cityInput.value = '';
        }
    }
});

celsiusBtn.addEventListener('click', () => {
    if (currentUnit !== 'metric') {
        currentUnit = 'metric';
        celsiusBtn.classList.add('active');
        fahrenheitBtn.classList.remove('active');
        updateAllWeatherDisplays();
    }
});

fahrenheitBtn.addEventListener('click', () => {
    if (currentUnit !== 'imperial') {
        currentUnit = 'imperial';
        fahrenheitBtn.classList.add('active');
        celsiusBtn.classList.remove('active');
        updateAllWeatherDisplays();
    }
});

// Fetch weather data by city name
async function fetchWeatherData(city) {
    // Check if city already exists
    if (document.getElementById(`weather-${city.toLowerCase().replace(/\s+/g, '-')}`)) {
        alert('This city is already displayed');
        return;
    }

    // Show loading state
    const loadingId = `loading-${Date.now()}`;
    weatherContainer.insertAdjacentHTML('beforeend', `
           <div id="${loadingId}" class="weather-card loading">
               Loading weather for ${city}...
           </div>
       `);

    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=${currentUnit}`
        );

        if (!response.ok) {
            throw new Error('City not found');
        }

        const currentData = await response.json();

        // Fetch forecast data
        const forecastResponse = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=${currentUnit}`
        );

        if (!forecastResponse.ok) {
            throw new Error('Forecast not available');
        }

        const forecastData = await forecastResponse.json();

        // Fetch UV index (requires One Call API)
        let uvIndex = 'N/A';
        try {
            const uvResponse = await fetch(
                `https://api.openweathermap.org/data/2.5/uvi?lat=${currentData.coord.lat}&lon=${currentData.coord.lon}&appid=${API_KEY}`
            );
            if (uvResponse.ok) {
                const uvData = await uvResponse.json();
                uvIndex = uvData.value.toFixed(1);
            }
        } catch (e) {
            console.log('UV index not available');
        }

        // Remove loading element
        document.getElementById(loadingId).remove();

        // Create weather card
        createWeatherCard(currentData, forecastData, uvIndex);
    } catch (error) {
        document.getElementById(loadingId).remove();
        alert(`Error: ${error.message}`);
    }
}

// Fetch weather data by coordinates
async function fetchWeatherByCoords(lat, lon) {
    const loadingId = `loading-${Date.now()}`;
    weatherContainer.insertAdjacentHTML('beforeend', `
           <div id="${loadingId}" class="weather-card loading">
               Loading weather for your location...
           </div>
       `);

    try {
        // First try to get the city name from reverse geocoding
        const reverseGeoResponse = await fetch(
            `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`
        );

        let cityName = "Your Location";
        if (reverseGeoResponse.ok) {
            const geoData = await reverseGeoResponse.json();
            if (geoData.length > 0) {
                // For Cairo specifically, we'll force the name we want
                if (geoData[0].country === "EG" && geoData[0].state === "Cairo Governorate") {
                    cityName = "Cairo, EG";
                } else {
                    cityName = `${geoData[0].name}, ${geoData[0].country}`;
                }
            }
        }

        // Now fetch weather data
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${currentUnit}`
        );

        if (!response.ok) {
            throw new Error('Location not found');
        }

        const currentData = await response.json();

        // Override the city name with our determined name
        currentData.name = cityName.split(",")[0];
        currentData.sys.country = cityName.split(",")[1] ? cityName.split(",")[1].trim() : "";

        // Fetch forecast data
        const forecastResponse = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${currentUnit}`
        );

        if (!forecastResponse.ok) {
            throw new Error('Forecast not available');
        }

        const forecastData = await forecastResponse.json();

        // Fetch UV index
        let uvIndex = 'N/A';
        try {
            const uvResponse = await fetch(
                `https://api.openweathermap.org/data/2.5/uvi?lat=${lat}&lon=${lon}&appid=${API_KEY}`
            );
            if (uvResponse.ok) {
                const uvData = await uvResponse.json();
                uvIndex = uvData.value.toFixed(1);
            }
        } catch (e) {
            console.log('UV index not available');
        }

        // Remove loading element
        document.getElementById(loadingId).remove();

        // Create weather card
        createWeatherCard(currentData, forecastData, uvIndex);
    } catch (error) {
        document.getElementById(loadingId).remove();
        console.log(`Error: ${error.message}`);
    }
}

// Create a weather card
function createWeatherCard(currentData, forecastData, uvIndex) {
    const city = currentData.name;
    const country = currentData.sys.country;
    const temp = Math.round(currentData.main.temp);
    const feelsLike = Math.round(currentData.main.feels_like);
    const description = currentData.weather[0].description;
    const iconCode = currentData.weather[0].icon;
    const humidity = currentData.main.humidity;
    const windSpeed = currentData.wind.speed;
    const pressure = currentData.main.pressure;
    const visibility = currentData.visibility ? (currentData.visibility / 1000).toFixed(1) : 'N/A';

    // Get sunrise and sunset times
    const sunrise = new Date(currentData.sys.sunrise * 1000);
    const sunset = new Date(currentData.sys.sunset * 1000);
    const sunriseTime = sunrise.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const sunsetTime = sunset.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Get temperature class for color
    const tempClass = getTemperatureClass(temp, currentUnit);

    // Process forecast data (group by day and get midday forecast)
    const dailyForecasts = processForecastData(forecastData);

    // Create HTML for the weather card
    const cardId = `weather-${city.toLowerCase().replace(/\s+/g, '-')}`;
    const cardHTML = `
           <div id="${cardId}" class="weather-card">
               <button class="remove-btn" onclick="removeWeatherCard('${cardId}')">×</button>
               
               <div class="current-weather">
                   <div>
                       <div class="location">
                           <span class="city-name">${city}</span>
                           <span class="country">${country}</span>
                       </div>
                       <div class="weather-description">${capitalizeFirstLetter(description)}</div>
                       <div class="temperature-container">
                           <span class="temperature ${tempClass}">${temp}</span>
                           <span class="unit">°${currentUnit === 'metric' ? 'C' : 'F'}</span>
                       </div>
                   </div>
                   <img class="weather-icon" src="https://openweathermap.org/img/wn/${iconCode}@2x.png" alt="${description}">
               </div>
               
               <div class="details">
                   <div class="detail-item">
                       <div class="detail-icon">🌡️</div>
                       <div>
                           <div class="detail-label">Feels Like</div>
                           <div class="detail-value">${feelsLike}°${currentUnit === 'metric' ? 'C' : 'F'}</div>
                       </div>
                   </div>
                   <div class="detail-item">
                       <div class="detail-icon">💧</div>
                       <div>
                           <div class="detail-label">Humidity</div>
                           <div class="detail-value">${humidity}%</div>
                       </div>
                   </div>
                   <div class="detail-item">
                       <div class="detail-icon">🌬️</div>
                       <div>
                           <div class="detail-label">Wind</div>
                           <div class="detail-value">${windSpeed} ${currentUnit === 'metric' ? 'm/s' : 'mph'}</div>
                       </div>
                   </div>
                   <div class="detail-item">
                       <div class="detail-icon">⏲️</div>
                       <div>
                           <div class="detail-label">Pressure</div>
                           <div class="detail-value">${pressure} hPa</div>
                       </div>
                   </div>
                   <div class="detail-item">
                       <div class="detail-icon">👁️</div>
                       <div>
                           <div class="detail-label">Visibility</div>
                           <div class="detail-value">${visibility} km</div>
                       </div>
                   </div>
                   <div class="detail-item">
                       <div class="detail-icon">☀️</div>
                       <div>
                           <div class="detail-label">UV Index</div>
                           <div class="detail-value">${uvIndex}</div>
                       </div>
                   </div>
               </div>
               
               <div class="sun-info">
                   <div class="sun-item">
                       <span class="sun-icon sunrise-icon">🌅</span>
                       <span>Sunrise: ${sunriseTime}</span>
                   </div>
                   <div class="sun-item">
                       <span class="sun-icon sunset-icon">🌇</span>
                       <span>Sunset: ${sunsetTime}</span>
                   </div>
               </div>
               
               <div class="forecast">
                   ${dailyForecasts.map(day => `
                       <div class="forecast-day">
                           <div class="forecast-day-name">${day.day}</div>
                           <img class="forecast-icon" src="https://openweathermap.org/img/wn/${day.icon}@2x.png" alt="${day.description}">
                           <div class="forecast-temp ${getTemperatureClass(day.temp, currentUnit)}">
                               ${day.temp}°${currentUnit === 'metric' ? 'C' : 'F'}
                           </div>
                       </div>
                   `).join('')}
               </div>
           </div>
       `;

    weatherContainer.insertAdjacentHTML('beforeend', cardHTML);
}

// Process forecast data to get daily forecasts
function processForecastData(forecastData) {
    const forecasts = {};

    // Group forecasts by date
    forecastData.list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const dateStr = date.toLocaleDateString('en-US', { weekday: 'short' });

        // Use midday forecast (around 12:00) for simplicity
        if (!forecasts[dateStr] || date.getHours() === 12) {
            forecasts[dateStr] = {
                day: dateStr,
                temp: Math.round(item.main.temp),
                description: item.weather[0].description,
                icon: item.weather[0].icon
            };
        }
    });

    // Convert to array and limit to 3 days
    return Object.values(forecasts).slice(0, 3);
}

// Get temperature class for styling
function getTemperatureClass(temp, unit) {
    // Convert to Celsius if in Fahrenheit for consistent classification
    const tempC = unit === 'imperial' ? (temp - 32) * 5 / 9 : temp;

    if (tempC < 0) return 'temp-freezing';
    if (tempC < 10) return 'temp-cold';
    if (tempC < 20) return 'temp-cool';
    if (tempC < 25) return 'temp-mild';
    if (tempC < 30) return 'temp-warm';
    return 'temp-hot';
}

// Update all weather displays when unit changes
function updateAllWeatherDisplays() {
    const cards = document.querySelectorAll('.weather-card:not(.loading)');

    cards.forEach(card => {
        // Get all temperature elements in this card
        const tempElements = card.querySelectorAll('.temperature, .forecast-temp, .detail-value');

        tempElements.forEach(element => {
            // Skip if this element doesn't contain temperature (like humidity or wind)
            if (!element.textContent.includes('°')) return;

            // Get the numeric value and current unit
            const parts = element.textContent.split('°');
            const tempValue = parseFloat(parts[0]);
            const currentUnit = parts[1][0]; // C or F

            // Only convert if needed
            if ((currentUnit === 'C' && currentUnit === 'metric') ||
                (currentUnit === 'F' && currentUnit === 'imperial')) {
                return;
            }

            // Convert the temperature
            let newTemp, newUnit;
            if (currentUnit === 'C') {
                // Convert C to F
                newTemp = Math.round((tempValue * 9 / 5) + 32);
                newUnit = 'F';
            } else {
                // Convert F to C
                newTemp = Math.round((tempValue - 32) * 5 / 9);
                newUnit = 'C';
            }

            // Update the display
            element.textContent = `${newTemp}°${newUnit}`;

            // Update temperature class for color coding
            if (element.classList.contains('temperature') || element.classList.contains('forecast-temp')) {
                // Remove all temperature classes
                element.classList.remove('temp-freezing', 'temp-cold', 'temp-cool', 'temp-mild', 'temp-warm', 'temp-hot');
                // Add the appropriate class
                element.classList.add(getTemperatureClass(newTemp, currentUnit === 'C' ? 'imperial' : 'metric'));
            }
        });

        // Update "Feels like" temperature unit
        const feelsLikeElement = card.querySelector('.detail-value:first-child');
        if (feelsLikeElement && feelsLikeElement.textContent.includes('°')) {
            const parts = feelsLikeElement.textContent.split('°');
            const tempValue = parseFloat(parts[0]);
            const newTemp = currentUnit === 'metric' ?
                Math.round((tempValue * 9 / 5) + 32) :
                Math.round((tempValue - 32) * 5 / 9);
            feelsLikeElement.textContent = `${newTemp}°${currentUnit === 'metric' ? 'F' : 'C'}`;
        }

        // Update wind speed unit
        const windElement = card.querySelector('.detail-value:nth-child(3)');
        if (windElement) {
            const parts = windElement.textContent.split(' ');
            const speedValue = parseFloat(parts[0]);
            const newSpeed = currentUnit === 'metric' ?
                (speedValue * 2.237).toFixed(1) : // m/s to mph
                (speedValue / 2.237).toFixed(1);  // mph to m/s
            windElement.textContent = `${newSpeed} ${currentUnit === 'metric' ? 'mph' : 'm/s'}`;
        }
    });
}

// Remove a weather card
function removeWeatherCard(cardId) {
    const card = document.getElementById(cardId);
    if (card) {
        card.remove();
    }
}

// Helper function to capitalize first letter
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Make removeWeatherCard available globally
window.removeWeatherCard = removeWeatherCard;
