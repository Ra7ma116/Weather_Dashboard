const apiKey = "86c84f88d137cf5a245c70b755fe2bef"; // Replace with your API key
const weatherDiv = document.getElementById("weather");
const forecastDiv = document.getElementById("forecast");

document.getElementById("searchBtn").addEventListener("click", () => {
    const city = document.getElementById("cityInput").value;
    if (city) getWeather(city);
});

document.getElementById("locBtn").addEventListener("click", () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;
            getWeatherByCoords(lat, lon);
        });
    } else {
        alert("Geolocation not supported.");
    }
});

async function getWeather(city) {
    const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`);
    const data = await res.json();
    displayWeather(data);
    getForecast(data.coord.lat, data.coord.lon);
}

async function getWeatherByCoords(lat, lon) {
    const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`);
    const data = await res.json();
    displayWeather(data);
    getForecast(lat, lon);
}

function displayWeather(data) {
    if (data.cod !== 200) {
        weatherDiv.innerHTML = `<p>City not found</p>`;
        return;
    }

    const tempC = Math.round(data.main.temp);
    const tempF = Math.round((tempC * 9 / 5) + 32);
    const color = tempC > 25 ? "#ff7f50" : tempC < 15 ? "#1e90ff" : "#f4a261";

    weatherDiv.innerHTML = `
        <div class="weather-card" style="background:${color}">
            <h2>${data.name}, ${data.sys.country}</h2>
            <p>${data.weather[0].description}</p>
            <h3>${tempC}°C / ${tempF}°F</h3>
            <img src="https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png" alt="Weather Icon">
        </div>
    `;
}

async function getForecast(lat, lon) {
    const res = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`);
    const data = await res.json();

    forecastDiv.innerHTML = `<h3>3-Day Forecast</h3><div class="forecast-container"></div>`;
    const container = forecastDiv.querySelector(".forecast-container");

    // Pick one forecast per day (noon)
    const daily = data.list.filter(item => item.dt_txt.includes("12:00:00")).slice(0, 3);

    daily.forEach(day => {
        const temp = Math.round(day.main.temp);
        const tempColor = temp > 25 ? "#ff7f50" : temp < 15 ? "#1e90ff" : "#f4a261";
        container.innerHTML += `
            <div class="forecast-item" style="background:${tempColor}">
                <p>${new Date(day.dt_txt).toLocaleDateString()}</p>
                <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}.png" alt="">
                <p>${temp}°C</p>
            </div>
        `;
    });
}
