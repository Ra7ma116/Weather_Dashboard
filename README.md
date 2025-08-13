# WeatherSphere
A responsive, real-time weather dashboard providing current conditions and a three-day forecast for multiple cities.

## ✨ Features
Real-time Weather Data: Displays current temperature, description, humidity, wind speed, pressure, visibility, and UV index.

3-Day Forecast: Provides an at-a-glance forecast for the next three days.

Location-Aware: Automatically fetches weather for the user's current location upon load.

City Search: Allows users to search for weather information for any city globally.

Unit Conversion: Easily switch between Celsius (°C) and Fahrenheit (°F) for temperature display.

Dynamic UI: Weather cards adapt styling (e.g., color) based on temperature conditions.

Multi-City Display: Add and remove multiple weather cards to track different locations.

Responsive Design: Ensures optimal viewing and interaction across various devices (mobile, tablet, desktop).

## 🛠️ Technologies Used
HTML5

CSS3 (Custom styles for a modern look)

JavaScript (Vanilla JS for DOM manipulation and API calls)

OpenWeatherMap API

## 📂 Project Structure
   ```

├── index.html                  # Main application file
└── assets/
    ├── main.js                 # (Not used in the current version, logic integrated into index.html)
    └── style.css               # (Not used in the current version, styles integrated into index.html)
   ```

## 📦 How to Use
Clone the repository:
   ```

git clone https://github.com/Ra7ma116/WeatherSphere.git
   ```

Navigate to the project directory:
   ```

cd WeatherSphere
   ```

Obtain an OpenWeatherMap API Key:

Go to OpenWeatherMap and sign up for a free account.

Generate a new API key from your account dashboard.

Update the API Key:

Open index.html in a text editor.

Locate the line const API_KEY = '86c84f88d137cf5a245c70b755fe2bef'; and replace the placeholder value with your newly generated API key.

Open the Application:

Simply open the index.html file directly in your web browser. No server setup is required.

## 🤝 Contributing
Fork the project

Create your feature branch (git checkout -b feature/AmazingFeature)

Commit your changes (git commit -m 'Add some amazing feature')

Push to the branch (git push origin feature/AmazingFeature)

Open a Pull Request
