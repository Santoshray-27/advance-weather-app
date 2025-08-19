// API Configuration
const API_KEY = 'fed9a0d317c7050c352139eeda0571d1';
let currentUnit = 'metric'; // Default to Celsius
let currentWeatherData = null;
let currentForecastData = null;

// DOM Elements
const weatherContent = document.getElementById('weather-content');
const searchBtn = document.getElementById('search-btn');
const searchInput = document.getElementById('search-input');
const celsiusBtn = document.getElementById('celsius-btn');
const fahrenheitBtn = document.getElementById('fahrenheit-btn');
const themeToggle = document.getElementById('theme-toggle');

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    // Get user's location if allowed
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const { latitude, longitude } = position.coords;
                fetchWeatherDataByCoords(latitude, longitude);
            },
            error => {
                console.error('Geolocation error:', error);
                // Default to New York if location access is denied
                fetchWeatherData('New York');
            }
        );
    } else {
        // Geolocation not supported
        fetchWeatherData('New York');
    }

    // Set up event listeners
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });

    celsiusBtn.addEventListener('click', () => {
        if (currentUnit !== 'metric') {
            currentUnit = 'metric';
            celsiusBtn.classList.add('active');
            fahrenheitBtn.classList.remove('active');
            if (currentWeatherData) {
                updateWeatherUI();
            }
        }
    });

    fahrenheitBtn.addEventListener('click', () => {
        if (currentUnit !== 'imperial') {
            currentUnit = 'imperial';
            fahrenheitBtn.classList.add('active');
            celsiusBtn.classList.remove('active');
            if (currentWeatherData) {
                updateWeatherUI();
            }
        }
    });

    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const themeIcon = themeToggle.querySelector('i');

        if (document.body.classList.contains('dark-mode')) {
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
            showNotification('Dark mode enabled', 'success');
        } else {
            themeIcon.classList.remove('fa-sun');
            themeIcon.classList.add('fa-moon');
            showNotification('Light mode enabled', 'success');
        }
    });
});

// Handle search functionality
function handleSearch() {
    const city = searchInput.value.trim();
    if (city) {
        fetchWeatherData(city);
        searchInput.value = '';
    }
}

// Fetch weather data by city name
function fetchWeatherData(city) {
    showLoading();

    // Fetch current weather
    fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=${currentUnit}`)
        .then(response => {
            if (!response.ok) throw new Error('City not found');
            return response.json();
        })
        .then(data => {
            currentWeatherData = data;
            // Fetch forecast data using coordinates from current weather
            return fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${data.coord.lat}&lon=${data.coord.lon}&appid=${API_KEY}&units=${currentUnit}`);
        })
        .then(response => {
            if (!response.ok) throw new Error('Forecast data unavailable');
            return response.json();
        })
        .then(forecastData => {
            currentForecastData = forecastData;
            updateWeatherUI();
            showNotification(`Weather data for ${currentWeatherData.name} loaded`, 'success');
        })
        .catch(error => {
            showError(error.message);
        });
}

// Fetch weather data by coordinates
function fetchWeatherDataByCoords(lat, lon) {
    showLoading();

    // Fetch current weather
    fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${currentUnit}`)
        .then(response => {
            if (!response.ok) throw new Error('Location not found');
            return response.json();
        })
        .then(data => {
            currentWeatherData = data;
            // Fetch forecast data
            return fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${currentUnit}`);
        })
        .then(response => {
            if (!response.ok) throw new Error('Forecast data unavailable');
            return response.json();
        })
        .then(forecastData => {
            currentForecastData = forecastData;
            updateWeatherUI();
        })
        .catch(error => {
            showError(error.message);
        });
}

// Update UI with weather data
function updateWeatherUI() {
    if (!currentWeatherData || !currentForecastData) return;

    const weatherHTML = `
                <div class="main-content">
                    <div class="current-weather">
                        <div class="location-info">
                            <h2>${currentWeatherData.name}, ${currentWeatherData.sys.country}</h2>
                            <p>${formatDate(new Date())}</p>
                        </div>
                        
                        <div class="weather-icon">
                            <img src="https://openweathermap.org/img/wn/${currentWeatherData.weather[0].icon}@2x.png" alt="${currentWeatherData.weather[0].description}">
                        </div>
                        
                        <div class="temperature">${Math.round(currentWeatherData.main.temp)}°${currentUnit === 'metric' ? 'C' : 'F'}</div>
                        <div class="weather-description">${currentWeatherData.weather[0].description}</div>
                        
                        <div class="weather-details">
                            <div class="detail-item">
                                <i class="fas fa-wind"></i>
                                <div class="detail-info">
                                    <h4>Wind</h4>
                                    <p>${currentWeatherData.wind.speed} ${currentUnit === 'metric' ? 'm/s' : 'mph'}</p>
                                </div>
                            </div>
                            
                            <div class="detail-item">
                                <i class="fas fa-tint"></i>
                                <div class="detail-info">
                                    <h4>Humidity</h4>
                                    <p>${currentWeatherData.main.humidity}%</p>
                                </div>
                            </div>
                            
                            <div class="detail-item">
                                <i class="fas fa-compress-alt"></i>
                                <div class="detail-info">
                                    <h4>Pressure</h4>
                                    <p>${currentWeatherData.main.pressure} hPa</p>
                                </div>
                            </div>
                            
                            <div class="detail-item">
                                <i class="fas fa-eye"></i>
                                <div class="detail-info">
                                    <h4>Visibility</h4>
                                    <p>${(currentWeatherData.visibility / 1000).toFixed(1)} km</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="forecast">
                        <div class="section-title">
                            <i class="fas fa-calendar-alt"></i>
                            <h3>5-Day Forecast</h3>
                        </div>
                        
                        <div class="forecast-container">
                            ${generateForecastItems()}
                        </div>
                    </div>
                </div>
                
                <div class="additional-info">
                    <div class="info-card">
                        <div class="section-title">
                            <i class="fas fa-clock"></i>
                            <h3>Hourly Forecast</h3>
                        </div>
                        
                        <div class="hourly-forecast-container">
                            ${generateHourlyItems()}
                        </div>
                    </div>
                    
                   
                    
                    <div class="info-card">
                        <div class="section-title">
                            <i class="fas fa-info-circle"></i>
                            <h3>Air Quality</h3>
                        </div>
                        
                        <div class="air-quality">
                            <div class="quality-index">Good</div>
                            <div class="quality-scale">
                                <div class="scale-bar" style="width: 30%; background: var(--success);"></div>
                            </div>
                            <div class="quality-details">
                                <div class="quality-item">
                                    <span>PM2.5</span>
                                    <span>12 μg/m³</span>
                                </div>
                                <div class="quality-item">
                                    <span>PM10</span>
                                    <span>24 μg/m³</span>
                                </div>
                                <div class="quality-item">
                                    <span>NO₂</span>
                                    <span>18 μg/m³</span>
                                </div>
                                <div class="quality-item">
                                    <span>O₃</span>
                                    <span>62 μg/m³</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

    weatherContent.innerHTML = weatherHTML;
}

// Generate forecast items HTML
function generateForecastItems() {
    if (!currentForecastData) return '';

    // Group forecast by day
    const dailyForecast = {};
    currentForecastData.list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const day = date.toLocaleDateString('en-US', { weekday: 'long' });

        if (!dailyForecast[day]) {
            dailyForecast[day] = {
                temps: [],
                icons: [],
                descriptions: []
            };
        }

        dailyForecast[day].temps.push(item.main.temp);
        dailyForecast[day].icons.push(item.weather[0].icon);
        dailyForecast[day].descriptions.push(item.weather[0].description);
    });

    // Get the next 5 days
    const forecastDays = Object.keys(dailyForecast).slice(0, 5);

    return forecastDays.map(day => {
        const temps = dailyForecast[day].temps;
        const maxTemp = Math.round(Math.max(...temps));
        const minTemp = Math.round(Math.min(...temps));

        // Use the icon from the middle of the day
        const iconIndex = Math.floor(dailyForecast[day].icons.length / 2);
        const icon = dailyForecast[day].icons[iconIndex];

        return `
                    <div class="forecast-item">
                        <div class="forecast-day">${day}</div>
                        <div class="forecast-icon"><img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${dailyForecast[day].descriptions[iconIndex]}"></div>
                        <div class="forecast-temp">
                            <span class="max-temp">${maxTemp}°</span>
                            <span class="min-temp">${minTemp}°</span>
                        </div>
                    </div>
                `;
    }).join('');
}

// Generate hourly items HTML
function generateHourlyItems() {
    if (!currentForecastData) return '';

    // Get the next 24 hours (8 forecast items as each is 3 hours apart)
    const hourlyItems = currentForecastData.list.slice(0, 8);

    return hourlyItems.map(item => {
        const date = new Date(item.dt * 1000);
        const time = date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });

        return `
                    <div class="hourly-item">
                        <div class="hourly-time">${time}</div>
                        <div class="hourly-icon"><img src="https://openweathermap.org/img/wn/${item.weather[0].icon}.png" alt="${item.weather[0].description}"></div>
                        <div class="hourly-temp">${Math.round(item.main.temp)}°</div>
                    </div>
                `;
    }).join('');
}

// Format date for display
function formatDate(date) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return date.toLocaleDateString('en-US', options);
}

// Show loading state
function showLoading() {
    weatherContent.innerHTML = `
                <div class="loading">
                    <i class="fas fa-spinner"></i>
                    <span>Loading weather data...</span>
                </div>
            `;
}

// Show error message
function showError(message) {
    weatherContent.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <h3>Error: ${message}</h3>
                    <p>Please try searching for a different location.</p>
                </div>
            `;

    showNotification(`Error: ${message}`, 'error');
}

// Show notification
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
                <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
                <span>${message}</span>
            `;

    document.body.appendChild(notification);

    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);

    // Hide after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}