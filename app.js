// ============================================
// Configuration & Constants
// ============================================
const CONFIG = {
    GEOCODING_API: 'https://geocoding-api.open-meteo.com/v1/search',
    WEATHER_API: 'https://api.open-meteo.com/v1/forecast'
};

console.log('🌤️ Weather App Initialized (Open-Meteo Version)');

// ============================================
// DOM Elements
// ============================================
const elements = {
    cityInput: document.getElementById('cityInput'),
    searchBtn: document.getElementById('searchBtn'),
    retryBtn: document.getElementById('retryBtn'),

    // Sections
    currentWeatherSection: document.getElementById('currentWeatherSection'),
    forecastSection: document.getElementById('forecastSection'),
    loadingState: document.getElementById('loadingState'),
    errorState: document.getElementById('errorState'),
    emptyState: document.getElementById('emptyState'),

    // Current Weather Elements
    locationName: document.getElementById('locationName'),
    currentDate: document.getElementById('currentDate'),
    weatherIcon: document.getElementById('weatherIcon'),
    currentTemp: document.getElementById('currentTemp'),
    weatherCondition: document.getElementById('weatherCondition'),
    feelsLike: document.getElementById('feelsLike'),
    humidity: document.getElementById('humidity'),
    windSpeed: document.getElementById('windSpeed'),
    pressure: document.getElementById('pressure'),
    visibility: document.getElementById('visibility'),

    // Forecast Elements
    forecastContainer: document.getElementById('forecastContainer'),
    errorMessage: document.getElementById('errorMessage')
};

// ============================================
// WMO Weather Codes Interpretation
// ============================================
const weatherCodes = {
    0: { description: 'Trời quang', icon: '☀️' },
    1: { description: 'Chủ yếu là nắng', icon: '🌤️' },
    2: { description: 'Có mây rải rác', icon: '⛅' },
    3: { description: 'Nhiều mây', icon: '☁️' },
    45: { description: 'Sương mù', icon: '🌫️' },
    48: { description: 'Sương muối', icon: '🌫️' },
    51: { description: 'Mưa phùn nhẹ', icon: '🌦️' },
    53: { description: 'Mưa phùn vừa', icon: '🌦️' },
    55: { description: 'Mưa phùn nặng', icon: '🌧️' },
    56: { description: 'Mưa phùn đóng băng nhẹ', icon: '🌧️' },
    57: { description: 'Mưa phùn đóng băng nặng', icon: '🌧️' },
    61: { description: 'Mưa nhỏ', icon: '🌧️' },
    63: { description: 'Mưa vừa', icon: '🌧️' },
    65: { description: 'Mưa to', icon: '⛈️' },
    66: { description: 'Mưa đá nhẹ', icon: '🌧️' },
    67: { description: 'Mưa đá nặng', icon: '⛈️' },
    71: { description: 'Tuyết rơi nhẹ', icon: '🌨️' },
    73: { description: 'Tuyết rơi vừa', icon: '🌨️' },
    75: { description: 'Tuyết rơi nặng', icon: '❄️' },
    77: { description: 'Hạt tuyết', icon: '❄️' },
    80: { description: 'Mưa rào nhẹ', icon: '🌦️' },
    81: { description: 'Mưa rào vừa', icon: '🌧️' },
    82: { description: 'Mưa rào xối xả', icon: '⛈️' },
    85: { description: 'Mưa tuyết nhẹ', icon: '🌨️' },
    86: { description: 'Mưa tuyết nặng', icon: '❄️' },
    95: { description: 'Giông bão', icon: '⛈️' },
    96: { description: 'Giông bão kèm mưa đá', icon: '⛈️' },
    99: { description: 'Giông bão kèm mưa đá lớn', icon: '⛈️' }
};

// ============================================
// Utility Functions
// ============================================

function showState(stateName) {
    const states = {
        loading: elements.loadingState,
        error: elements.errorState,
        empty: elements.emptyState,
        weather: [elements.currentWeatherSection, elements.forecastSection]
    };

    // Hide all
    Object.values(states).flat().forEach(el => el?.classList.add('hidden'));

    // Show requested
    if (stateName === 'weather') {
        states.weather.forEach(el => el?.classList.remove('hidden'));
    } else if (states[stateName]) {
        states[stateName].classList.remove('hidden');
    }
}

function getWeatherInfo(code) {
    return weatherCodes[code] || { description: 'Không xác định', icon: '❓' };
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function getDayName(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', { weekday: 'short' });
}

function getShortDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' });
}

// ============================================
// API Functions
// ============================================

/**
 * Step 1: Get Lat/Lon from City Name (Geocoding)
 */
async function getCoordinates(cityName) {
    console.log(`\n🌍 Fetching coordinates for: "${cityName}"`);

    const url = `${CONFIG.GEOCODING_API}?name=${encodeURIComponent(cityName)}&count=1&language=vi&format=json`;
    console.log(`🔗 URL: ${url}`);

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Geocoding API missing');

        const data = await response.json();
        console.log('✅ Geocoding result:', data);

        if (!data.results || data.results.length === 0) {
            throw new Error('City not found');
        }

        return {
            name: data.results[0].name,
            country: data.results[0].country,
            lat: data.results[0].latitude,
            lon: data.results[0].longitude
        };
    } catch (error) {
        console.error('❌ Geocoding error:', error);
        throw error;
    }
}

/**
 * Step 2: Get Weather Data from Lat/Lon
 */
async function getWeatherData(lat, lon) {
    console.log(`\n☁️ Fetching weather for Lat: ${lat}, Lon: ${lon}`);

    const params = new URLSearchParams({
        latitude: lat,
        longitude: lon,
        current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,pressure_msl,visibility',
        daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum',
        timezone: 'auto'
    });

    const url = `${CONFIG.WEATHER_API}?${params.toString()}`;
    console.log(`🔗 URL: ${url}`);

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Weather API error');

        const data = await response.json();
        console.log('✅ Weather data:', data);
        return data;
    } catch (error) {
        console.error('❌ Weather API error:', error);
        throw error;
    }
}

// ============================================
// UI Update Functions
// ============================================

function updateUI(locationData, weatherData) {
    console.log('\n🎨 Updating UI...');

    // --- Current Weather ---
    const current = weatherData.current;
    const weatherInfo = getWeatherInfo(current.weather_code);

    elements.locationName.textContent = `${locationData.name}, ${locationData.country}`;
    elements.currentDate.textContent = formatDate(new Date());

    elements.currentTemp.textContent = Math.round(current.temperature_2m);
    elements.weatherIcon.textContent = weatherInfo.icon;
    elements.weatherCondition.textContent = weatherInfo.description;
    elements.feelsLike.textContent = `Cảm giác như ${Math.round(current.apparent_temperature)}°C`;

    elements.humidity.textContent = `${current.relative_humidity_2m}%`;
    elements.windSpeed.textContent = `${current.wind_speed_10m} km/h`;
    elements.pressure.textContent = `${Math.round(current.pressure_msl)} hPa`;
    elements.visibility.textContent = `${(current.visibility / 1000).toFixed(1)} km`;

    // --- Forecast ---
    const daily = weatherData.daily;
    elements.forecastContainer.innerHTML = '';

    // Skip today (index 0) usually, show next 5 days
    // But Open-Meteo returns today as index 0. Let's show today + next 4 or next 5.
    // Let's show next 5 days (index 1 to 5).

    for (let i = 1; i <= 5; i++) {
        // Safety check if data exists
        if (!daily.time[i]) break;

        const dateStr = daily.time[i];
        const code = daily.weather_code[i];
        const minTemp = Math.round(daily.temperature_2m_min[i]);
        const maxTemp = Math.round(daily.temperature_2m_max[i]);
        const precip = daily.precipitation_sum[i];

        const info = getWeatherInfo(code);
        const dayName = getDayName(dateStr);
        const shortDate = getShortDate(dateStr);

        const card = document.createElement('article');
        card.className = 'weather-card forecast-card';
        card.innerHTML = `
            <div class="forecast-date">${dayName}</div>
            <div class="forecast-day">${shortDate}</div>
            <div class="forecast-icon">${info.icon}</div>
            <div class="forecast-temp">${maxTemp}°C</div>
            <div class="forecast-description">${info.description}</div>
            <div class="forecast-details">
                <div>📉 ${minTemp}°C</div>
                <div>💧 ${precip}mm</div>
            </div>
        `;
        elements.forecastContainer.appendChild(card);
    }

    showState('weather');
}

// ============================================
// Main Logic
// ============================================

async function handleSearch() {
    const rawInput = elements.cityInput.value.trim();
    if (!rawInput) return;

    console.log(`\n🔍 Search initiated for: "${rawInput}"`);
    showState('loading');
    elements.cityInput.blur(); // Dismiss keyboard on mobile

    try {
        // Step 1: Geocoding
        const location = await getCoordinates(rawInput);

        // Step 2: Weather Data
        const weather = await getWeatherData(location.lat, location.lon);

        // Step 3: Update UI
        updateUI(location, weather);

    } catch (error) {
        let msg = 'Đã xảy ra lỗi. Vui lòng thử lại.';
        if (error.message === 'City not found') {
            msg = `Không tìm thấy thành phố "${rawInput}". Vui lòng kiểm tra lại chính tả.`;
        }
        elements.errorMessage.textContent = msg;
        showState('error');
    }
}

// ============================================
// Events
// ============================================

elements.searchBtn.addEventListener('click', handleSearch);

elements.cityInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSearch();
});

elements.retryBtn.addEventListener('click', () => {
    showState('empty');
    elements.cityInput.focus();
    elements.cityInput.value = '';
});

// Init
elements.cityInput.focus();
