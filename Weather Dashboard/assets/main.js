const API_KEY = '86c84f88d137cf5a245c70b755fe2bef';
let currentUnit = 'metric';

const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const weatherContainer = document.getElementById('weather-container');
const celsiusBtn = document.getElementById('celsius-btn');
const fahrenheitBtn = document.getElementById('fahrenheit-btn');
const currentDateTime = document.getElementById('current-date-time');

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

updateDateTime();
setInterval(updateDateTime, 60000);

const defaultCities = ['Istanbul', 'New York', 'Tokyo', 'Paris', 'Sydney'];

document.addEventListener('DOMContentLoaded', () => {
    defaultCities.forEach(city => {
        fetchWeatherData(city);
    });

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const { latitude, longitude } = position.coords;

                if (latitude > 29.8 && latitude < 30.2 && longitude > 31.1 && longitude < 31.4) {
                    fetchWeatherData("Cairo");
                } else {
                    fetchWeatherByCoords(latitude, longitude);
                }
            },
            error => {
                console.log('Geolocation error:', error);
                fetchWeatherData("Cairo");
            }
        );
    } else {
        fetchWeatherData("Cairo");
    }
});

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

async function fetchWeatherData(city) {
    if (document.getElementById(`weather-${city.toLowerCase().replace(/\s+/g, '-')}`)) {
        alert('This city is already displayed');
        return;
    }

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

        const forecastResponse = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=${currentUnit}`
        );

        if (!forecastResponse.ok) {
            throw new Error('Forecast not available');
        }

        const forecastData = await forecastResponse.json();

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

        document.getElementById(loadingId).remove();

        createWeatherCard(currentData, forecastData, uvIndex);
    } catch (error) {
        document.getElementById(loadingId).remove();
        alert(`Error: ${error.message}`);
    }
}

async function fetchWeatherByCoords(lat, lon) {
    const loadingId = `loading-${Date.now()}`;
    weatherContainer.insertAdjacentHTML('beforeend', `
           <div id="${loadingId}" class="weather-card loading">
               Loading weather for your location...
           </div>
       `);

    try {
        const reverseGeoResponse = await fetch(
            `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`
        );

        let cityName = "Your Location";
        if (reverseGeoResponse.ok) {
            const geoData = await reverseGeoResponse.json();
            if (geoData.length > 0) {
                if (geoData[0].country === "EG" && geoData[0].state === "Cairo Governorate") {
                    cityName = "Cairo, EG";
                } else {
                    cityName = `${geoData[0].name}, ${geoData[0].country}`;
                }
            }
        }

        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${currentUnit}`
        );

        if (!response.ok) {
            throw new Error('Location not found');
        }

        const currentData = await response.json();

        currentData.name = cityName.split(",")[0];
        currentData.sys.country = cityName.split(",")[1] ? cityName.split(",")[1].trim() : "";

        const forecastResponse = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${currentUnit}`
        );

        if (!forecastResponse.ok) {
            throw new Error('Forecast not available');
        }

        const forecastData = await forecastResponse.json();

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

        document.getElementById(loadingId).remove();

        createWeatherCard(currentData, forecastData, uvIndex);
    } catch (error) {
        document.getElementById(loadingId).remove();
        console.log(`Error: ${error.message}`);
    }
}

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

    const sunrise = new Date(currentData.sys.sunrise * 1000);
    const sunset = new Date(currentData.sys.sunset * 1000);
    const sunriseTime = sunrise.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const sunsetTime = sunset.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const tempClass = getTemperatureClass(temp, currentUnit);

    const dailyForecasts = processForecastData(forecastData);

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

function processForecastData(forecastData) {
    const forecasts = {};

    forecastData.list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const dateStr = date.toLocaleDateString('en-US', { weekday: 'short' });

        if (!forecasts[dateStr] || date.getHours() === 12) {
            forecasts[dateStr] = {
                day: dateStr,
                temp: Math.round(item.main.temp),
                description: item.weather[0].description,
                icon: item.weather[0].icon
            };
        }
    });

    return Object.values(forecasts).slice(0, 3);
}

function getTemperatureClass(temp, unit) {
    const tempC = unit === 'imperial' ? (temp - 32) * 5 / 9 : temp;

    if (tempC < 0) return 'temp-freezing';
    if (tempC < 10) return 'temp-cold';
    if (tempC < 20) return 'temp-cool';
    if (tempC < 25) return 'temp-mild';
    if (tempC < 30) return 'temp-warm';
    return 'temp-hot';
}

function updateAllWeatherDisplays() {
    const cards = document.querySelectorAll('.weather-card:not(.loading)');

    cards.forEach(card => {
        const tempElements = card.querySelectorAll('.temperature, .forecast-temp, .detail-value');

        tempElements.forEach(element => {
            if (!element.textContent.includes('°')) return;

            const parts = element.textContent.split('°');
            const tempValue = parseFloat(parts[0]);
            const currentUnit = parts[1][0];

            if ((currentUnit === 'C' && currentUnit === 'metric') ||
                (currentUnit === 'F' && currentUnit === 'imperial')) {
                return;
            }

            let newTemp, newUnit;
            if (currentUnit === 'C') {
                newTemp = Math.round((tempValue * 9 / 5) + 32);
                newUnit = 'F';
            } else {
                newTemp = Math.round((tempValue - 32) * 5 / 9);
                newUnit = 'C';
            }

            element.textContent = `${newTemp}°${newUnit}`;

            if (element.classList.contains('temperature') || element.classList.contains('forecast-temp')) {
                element.classList.remove('temp-freezing', 'temp-cold', 'temp-cool', 'temp-mild', 'temp-warm', 'temp-hot');
                element.classList.add(getTemperatureClass(newTemp, currentUnit === 'C' ? 'imperial' : 'metric'));
            }
        });

        const feelsLikeElement = card.querySelector('.detail-value:first-child');
        if (feelsLikeElement && feelsLikeElement.textContent.includes('°')) {
            const parts = feelsLikeElement.textContent.split('°');
            const tempValue = parseFloat(parts[0]);
            const newTemp = currentUnit === 'metric' ?
                Math.round((tempValue * 9 / 5) + 32) :
                Math.round((tempValue - 32) * 5 / 9);
            feelsLikeElement.textContent = `${newTemp}°${currentUnit === 'metric' ? 'F' : 'C'}`;
        }

        const windElement = card.querySelector('.detail-value:nth-child(3)');
        if (windElement) {
            const parts = windElement.textContent.split(' ');
            const speedValue = parseFloat(parts[0]);
            const newSpeed = currentUnit === 'metric' ?
                (speedValue * 2.237).toFixed(1) :
                (speedValue / 2.237).toFixed(1);
            windElement.textContent = `${newSpeed} ${currentUnit === 'metric' ? 'mph' : 'm/s'}`;
        }
    });
}

function removeWeatherCard(cardId) {
    const card = document.getElementById(cardId);
    if (card) {
        card.remove();
    }
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

window.removeWeatherCard = removeWeatherCard;
