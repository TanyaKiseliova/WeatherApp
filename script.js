const apiKey = "b1e831b93cfc4c93d8ee881ff34e6939";

const searchBtn = document.querySelector(".menu__send");
const cityInput = document.querySelector(".menu__input");
const weatherTemp = document.querySelector(".weather__temp");
const weatherTempN = document.querySelector(".weather__temp-night");
const weatherTitle = document.querySelector(".weather__title");
const weatherIcon = document.querySelector(".weather__icon ");
const historyList = document.querySelector(".history__list");
const weekDays = document.querySelectorAll(".week__day");
const loadingIndicator = document.querySelector(".loader");
const searchHistory = [];
const weatherSpeed = document.querySelector(".weather__speed");
const weatherDirection = document.querySelector(".weather__direction");
const weatherFavBut = document.querySelector(".weather__fav-but");
const weatherFavButDel = document.querySelector(".weather__del-but");
const FavList = document.querySelector(".fav__list");

const mainPageBtn = document.querySelector('.main-btn')
const graphPageBtn = document.querySelector('.graph-btn')
const mainPage = document.querySelector('.weather__main')
const graphPage = document.querySelector('.weather__graph')


const feel = document.querySelector('.weather__feel')
const hum = document.querySelector('.weather__hum')
const press = document.querySelector('.weather__press')
const sunset = document.querySelector('.weather__sunset')
const sunrize = document.querySelector('.weather__sunrize')

let temperatureChart = null
let temperatureChart2 = null

let favHistory = JSON.parse(localStorage.getItem("weatherFavorites")) || [];

const WEATHER_ICONS_MAP = {
  Clear: '<i class="fa-solid fa-sun"></i>',
  Clouds: '<i class="fa-solid fa-cloud"></i>',
  Rain: '<i class="fa-solid fa-cloud-rain"></i>',
  Snow: '<i class="fa-solid fa-snowflake"></i>',
  Thunderstorm: '<i class="fa-solid fa-bolt"></i>',
  Drizzle: '<i class="fa-solid fa-cloud-rain"></i>',
  Mist: '<i class="fa-solid fa-smog"></i>',
  Fog: '<i class="fa-solid fa-smog"></i>',
  Tornado: '<i class="fa-solid fa-tornado"></i>',
};

function getWeatherData(city) {

  const isValidName = /^[a-zA-Zа-яА-ЯёЁ\s\-']+$/.test(city);
  if (!isValidName) {
    showMessage("Invalid city name format");
    return;
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

  showLoading();

  fetch(url)
    .then((res) => {
      if (res.status === 401) throw new Error(" API-key is wrong");
      if (res.status === 429)
        throw new Error(" Request limit exceeded. Try again later");
      if (!res.ok) throw new Error("Town is not found");
      return res.json();
    })
    .then((data) => {
      console.log(data);

      const cityName = data.name;
      const country = data.sys.country;

      displayWeather(data);
      addToSearchHistory(cityName, country);
    })
    .catch((error) => {
      console.log(`Error: ${error.message}`);
      showMessage(error.message);
    })

    .finally(() => {
      hideLoading();
    });
}

const getWeatherForWeek = (city) => {
  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric&lang=ru`;

  fetch(url)
    .then((response) => {
      if (!response.ok) console.log("Npt found");
      return response.json();
    })
    .then((data) => {
      displayWeatherForecast(data);
      drawTemperatureChart(data);

      const chartDataDay = {
        dates: [],
        temps: [],
      };

      const chartDataNight = {
        dates: [],
        temps: [],
      };

      for (let i = 0; i < data.list.length; i++) {
        const item = data.list[i];
        const timeString = item.dt_txt.split(" ")[1]; //  формат "HH:MM:SS"

        if (timeString === "12:00:00") {
          //денб
          const dateLabel = new Date(item.dt * 1000).toLocaleDateString(
            "ru-RU",
            { weekday: "short" }
          );
          const temp = Math.round(item.main.temp);

          chartDataDay.dates.push(dateLabel);
          chartDataDay.temps.push(temp);
        }

        if (timeString === "00:00:00") {
          //ночь
          const temp = Math.round(item.main.temp);
          chartDataNight.temps.push(temp);
        }
      }

      renderTemperatureChart({
        dates: chartDataDay.dates,
        dayTemps: chartDataDay.temps,
        nightTemps: chartDataNight.temps,
      });

      const chartDataDay2 = {
        dates2: [],
        temps2: [],
      };

      for (let i = 0; i < 8; i++) {
        const item = data.list[i];
        const timeString = item.dt_txt.split(" ")[1]; //  формат "HH:MM:SS"

        const temp = Math.round(item.main.temp);
        chartDataDay2.dates2.push(timeString);
        chartDataDay2.temps2.push(temp);
      }

      renderTemperatureChart2({
        dates2: chartDataDay2.dates2,
        dayTemps2: chartDataDay2.temps2,
      });
    })

    .catch((error) => {
      console.log(error.message);
    });
};


const displayWeather = (data) => {
  const currentTemp = Math.floor(data.main.temp);
  const cityAndCountry = `${data.name}, ${data.sys.country}`;
  const weatherCondition = data.weather[0].main;

  if (currentTemp > 0) weatherTemp.innerText = `+${currentTemp}°`;
  else weatherTemp.innerText = `${currentTemp}°`;

  weatherTitle.innerText = cityAndCountry;
  weatherIcon.innerHTML = WEATHER_ICONS_MAP[weatherCondition];

  const speed = data.wind.speed;
  let direction = data.wind.deg;

  if (direction > 340 || direction <= 25) direction = "North";
  else if (direction > 25 || direction <= 70) direction = "North-East";
  else if (direction > 70 || direction <= 115) direction = "East";
  else if (direction > 115 || direction <= 160) direction = "South-East";
  else if (direction > 160 || direction <= 205) direction = "South";
  else if (direction > 205 || direction <= 250) direction = "South-West";
  else if (direction > 250 || direction <= 295) direction = "South-East";
  else if (direction > 295 || direction <= 340) direction = "South";

  weatherSpeed.innerText = `wind speed:   ${speed} m/s`;
  weatherDirection.innerText = `wind direction:   ${direction}`;

  weatherFavBut.addEventListener("click", () => {
    getWeatherToFav(data.name, data.sys.country);
    console.log(data.name, data.sys.country);
  });

  additionInfo(data);
};

function displayWeatherForecast(data) {
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const firstForecastTimestamp = data.list[0].dt; // timestamp в секундах типо вместо фильтрации по времени
  const firstForecastDateInMs = firstForecastTimestamp * 1000; //перевод в милисек
  const firstForecastDate = new Date(firstForecastDateInMs); // новый объект Date из timestamp
  const firstForecastDayOfWeek = firstForecastDate.getDay(); //получим день нделти

  let weatherNight = Math.round(data.list[3].main.temp);

  if (weatherNight > 0) weatherTempN.innerText = `+${weatherNight}°`;
  else weatherTempN.innerText = `${weatherNight}°`;

  console.log(data);

  for (let i = 0; i < 5; i++) {
    const forecastIndex = i * 8; // тк в сутках 24 часа а прогнозщ тут на каждый 3 выдается т.е 3*8 и юудет сутки
    const dailyForecast = data.list[forecastIndex];

    const weatherCondition = dailyForecast.weather[0].main;
    const temp = Math.round(dailyForecast.main.temp);

    const dayIndex = (firstForecastDayOfWeek + i) % 7;
    const dayName = dayNames[dayIndex];

    weekDays[i].innerHTML = "";

    const nameEl = document.createElement("div");
    nameEl.className = "day-name";
    nameEl.textContent = dayName;

    const iconEl = document.createElement("div");
    iconEl.className = "day-icon";
    iconEl.innerHTML = WEATHER_ICONS_MAP[weatherCondition];

    const tempEl = document.createElement("div");
    tempEl.className = "day-temp";
    if (temp > 0) {
      tempEl.textContent = `+${temp}°`;
    } else {
      tempEl.textContent = `${temp}°`;
    }

    weekDays[i].appendChild(nameEl);
    weekDays[i].appendChild(iconEl);
    weekDays[i].appendChild(tempEl);
  }
}

function addToSearchHistory(city, country, temp) {
  searchHistory.unshift({
    city,
    country,
  });

  historyList.innerHTML = "";

  for (let i = 0; i < searchHistory.length; i++) {
    const item = searchHistory[i];
    const li = document.createElement("li");

    li.textContent = `${item.country}, ${item.city}`;

    li.addEventListener("click", () => {
      cityInput.value = item.city;
      getWeatherData(item.city);
      getWeatherForWeek(item.city);
    });

    historyList.appendChild(li);
  }
}

function getWeatherToFav(city, country) {
  let isDuplicate = false;
  for (let i = 0; i < favHistory.length; i++) {
    if (favHistory[i].city.toLowerCase() === city.toLowerCase()) {
      isDuplicate = true;
      break;
    }
  }

  if (isDuplicate) return;

  favHistory.unshift({
    city,
    country,
  });

  localStorage.setItem("weatherFavorites", JSON.stringify(favHistory));
  loadFavorites();
}

function loadFavorites() {
  FavList.innerHTML = "";
  for (let i = 0; i < favHistory.length; i++) {
    const item = favHistory[i];
    const li = document.createElement("li");

    li.textContent = `${item.country}, ${item.city}`;

    li.addEventListener("click", () => {
      cityInput.value = item.city;
      getWeatherData(item.city);
      getWeatherForWeek(item.city);
    });

    FavList.appendChild(li);
  }
}

searchBtn.addEventListener("click", () => {
  const currentCity = cityInput.value;
  getWeatherData(currentCity);
  getWeatherForWeek(currentCity);
});

function showMessage(text) {
  const msg = document.createElement("div");
  msg.textContent = text;
  msg.style.position = "fixed";
  msg.style.top = "50%";
  msg.style.width = "400px";
  msg.style.height = "200px";
  msg.style.left = "50%";
  msg.style.transform = "translate(-50%, -50%)";
  msg.style.backgroundColor = "rgba(249, 249, 249, 0.93)";
  msg.style.color = "rgba(0, 21, 70, 0.93)";
  msg.style.padding = "10px 20px";
  msg.style.borderRadius = "10px";
  msg.style.zIndex = "100";
  msg.style.fontSize = "40px";
  msg.style.display = "flex";
  msg.style.justifyContent = "center";
  msg.style.border = "7px solid black";
  msg.style.alignItems = "center";
  msg.style.textAlign = "center";

  document.body.appendChild(msg);

  setTimeout(() => {
    msg.remove();
  }, 5000);
}

const showLoading = () => {
  loadingIndicator.style.display = "flex";
};

const hideLoading = () => {
  loadingIndicator.style.display = "none";
};

const themeBtn = document.getElementById("switch");

const body = document.body;

themeBtn.addEventListener("click", function () {
  body.classList.toggle("light-theme");
});

loadFavorites();

const canvas = document.getElementById("temperatureChart");
const ctx = canvas.getContext("2d"); //контент рисования 2д графика


function drawTemperatureChart(data) {
  const temperatures = [];

  for (let i = 0; i < 40; i++) {
    //делается массив  из температур з массива того из 40 значений га 5 дней с промежутком в 3 часа
    const item = data.list[i];
    const temp = Math.round(item.main.temp);
    temperatures.push(temp);
  }

  const padding = 30; // внутренний отступ от краекв холста
  const chartWidth = canvas.width - padding * 2;//метоо на графике для сомаого графика т.е без учета отступов
  const chartHeight = canvas.height - padding * 2;
  const stepX = chartWidth / (temperatures.length - 1);//расстояние м-ду соседними точками 
  const maxTemp = Math.max(...temperatures);// из всех элементов массива берем их по одиночке и ищем max
  const minTemp = Math.min(...temperatures);

  ctx.clearRect(0, 0, canvas.width, canvas.height); //очистка холтса чтобы новый график был с 0 а не на уже нарисованным clearRect(x, y, width, height)

  ctx.beginPath();//начало рисввания графика т,е линии
  ctx.moveTo(padding, padding);//начальная точка
  ctx.lineTo(padding, canvas.height - padding); // по x т.е  линию от текущей позиции до  точки
  ctx.lineTo(canvas.width - padding, canvas.height - padding); // по y ось те прямую линию от текущей позиции до  точки
  ctx.strokeStyle = "#333"; //цвет линии
  ctx.stroke(); //вывод линии на экран

  ctx.beginPath();

  for (let i = 0; i < temperatures.length; i++) {
    const temp = temperatures[i];

    const x = padding + i * stepX; //позиция точки по x  // i * stepX  шаг между точками по x

   const normalized = (temp - minTemp) / (maxTemp - minTemp);//нормализация т.е к диапазону 0-1
    const pixelOffset = normalized * chartHeight;//пересчет этого на высоту холста
    const y = canvas.height - padding - pixelOffset;// поворот оси т.е по ум верзний левый, 
    // а привычно как бы нижний левый как начало координат те оси у чтобы не вниз шла, а вверх

    ctx.arc(x, y, 2, 0, 2 * Math.PI); //arc(x, y, radius, startAngle, endAngle) те для отрисовку  точку в виде окружности
    //x, y — координаты центра
    //radius — радиус круга
    //startAngle, endAngle — угол от начала до конца, в радианах.чтобы нарисовался полный кружочек надо 2pi
  }

  ctx.strokeStyle = "#220954";
  ctx.stroke();

  ctx.fillText(`${maxTemp}°`, padding - 30, padding + 5);//вывод температуры около оси слева сверху т.к она максимальная
  ctx.fillText(`${minTemp}°`, padding - 30, canvas.height - padding + 5);// тоже но с минимальной
}



const renderTemperatureChart = (data) => {
  const ctx2 = document.getElementById("tempChart").getContext("2d");

  const gradientDay = ctx2.createLinearGradient(0, 0, 0, 300);
  gradientDay.addColorStop(0, "rgba(128, 0, 128, 0.5)");  
  gradientDay.addColorStop(1, "rgba(128, 0, 128, 0)");  

  const gradientNight = ctx2.createLinearGradient(0, 0, 0, 300);
  gradientNight.addColorStop(0, "rgba(0, 255, 255, 0.5)");
  gradientNight.addColorStop(1, "rgba(0, 255, 255, 0)");

  if (temperatureChart) {
    temperatureChart.destroy();
  }

  temperatureChart = new Chart(ctx2, {
    type: "line",
    data: {
      labels: data.dates,
      datasets: [
        {
          label: "Day",
          data: data.dayTemps,
          borderColor: "purple",
          backgroundColor: gradientDay,
          fill: true,
          tension: 0.5,
          pointRadius: 4,
        },
        {
          label: "Night",
          data: data.nightTemps,
          borderColor: "aqua",
          backgroundColor: gradientNight,
          fill: true,
          tension: 0.5,
          borderDash: [5, 5],
        },
      ],
    },

    options: {
      animation: {
        duration: 7000,
      },

      scales: {
        y: {
          title: {
            display: true,
            text: "Temperature (°C)",
          },
        },
        x: {
          title: {
            display: true,
            text: "Day",
          },
        },
      },
    },
  });
};




const renderTemperatureChart2 = (data) => {
  const ctx2 = document.getElementById("tempChart2").getContext("2d");

  const gradientDay = ctx2.createLinearGradient(0, 0, 0, 300);
  gradientDay.addColorStop(0, "rgba(128, 128, 128, 0.5)");  
  gradientDay.addColorStop(1, "rgba(255, 255, 255, 0)");  


  if (temperatureChart2) {
    temperatureChart2.destroy();
  }

  temperatureChart2 = new Chart(ctx2, {
    type: "line",
    data: {
      labels: data.dates2,
      datasets: [
        {
          label: "twenty-four hours",
          data: data.dayTemps2,
          borderColor: "gray",
          backgroundColor: gradientDay,
          fill: true,
          tension: 0.5,
          pointRadius: 4,
        },
      ],
    },

    options: {
      animation: {
        duration: 5000,
      },

      scales: {
        y: {
          title: {
            display: true,
            text: "Temperature (°C)",
          },
        },
        x: {
          title: {
            display: true,
            text: "time",
          },
        },
      },
    },
  });
};

const showMainPage = () => {
	mainPage.classList.add('active')
	graphPage.classList.remove('active')
	graphPageBtn.classList.remove('active')
	mainPageBtn.classList.add('active')
}

const showGraphPage = () => {
	graphPage.classList.add('active')
	mainPage.classList.remove('active')
	graphPageBtn.classList.add('active')
	mainPageBtn.classList.remove('active')
}

mainPageBtn.addEventListener('click', showMainPage)
graphPageBtn.addEventListener('click', showGraphPage)


function additionInfo(data) {
  feel.innerHTML = `<i class="bi bi-person-lines-fill"></i>  current weather feels like: ${Math.round(data.main.feels_like)} °`;
  hum.innerHTML = `<i class="bi bi-moisture"></i>  humidity: ${Math.round(data.main.humidity)}`;
  press.innerHTML = `<i class="bi bi-thermometer"></i>  preassure: ${Math.round(data.main.pressure)}`;

  const sr = new Date(data.sys.sunrise * 1000);
  const formatted = sr.toLocaleTimeString([], {timeStyle: "short",});
  sunrize.innerHTML = `<i class="bi bi-sunrise"></i> sunrize: ${formatted} `;

  const ss = new Date(data.sys.sunset * 1000);
  const format = ss.toLocaleTimeString([], {timeStyle: "short",});
  sunset.innerHTML = `<i class="bi bi-sunset"></i>  sunset: ${format} `;
}