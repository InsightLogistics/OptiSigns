let KCCIChart;
let SCFIChart;
let WCIChart;
let IACIChart;
let blankSailingChart;
let FBXChart;
let XSIChart;
let MBCIChart;
let exchangeRateChart;

const DATA_JSON_URL = 'data/crawling_data.json';

document.addEventListener('DOMContentLoaded', () => {
    const setupChart = (chartId, type, datasets, additionalOptions = {}, isAggregated = false) => {
        const ctx = document.getElementById(chartId);
        if (ctx) {
            if (Chart.getChart(chartId)) {
                Chart.getChart(chartId).destroy();
            }

            const defaultOptions = {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: false // X축 타이틀 제거
                        },
                        type: 'time',
                        time: {
                            unit: 'month', // 가로축 단위를 월별로 고정
                            displayFormats: {
                                month: 'MM/01/yy' // 월별 형식 변경
                            },
                            tooltipFormat: 'M/d/yyyy'
                        },
                        ticks: {
                            source: 'auto',
                            autoSkipPadding: 10,
                            maxTicksLimit: 12 // 지난 1년 기준 월별 12개 눈금 배치
                        },
                        grid: {
                            display: false // 가로축 보조선은 유지
                        }
                    },
                    y: {
                        beginAtZero: true,
                        title: {
                            display: false // Y축 타이틀 제거
                        },
                        ticks: {
                            count: 5 // 세로 기준 5개 유지
                        },
                        grid: {
                            display: true, // 세로축 보조선 표시
                            color: 'rgba(0, 0, 0, 0.1)' // 보조선 색상 설정
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'right',
                        labels: {
                            // boxWidth: 20, // 기본값으로 두거나 필요한 경우 조정
                            // boxHeight: 10, // 기본값으로 두거나 필요한 경우 조정
                            usePointStyle: false, // 여전히 false 유지

                            // 범례 아이템을 커스터마이징하는 함수
                            generateLabels: function(chart) {
                                const originalLabels = Chart.defaults.plugins.legend.labels.generateLabels(chart);
                                return originalLabels.map(label => {
                                    // 각 범례 아이템에 대해
                                    label.lineWidth = 0; // 범례 상자의 테두리 두께를 0으로 설정
                                    label.strokeStyle = 'transparent'; // 범례 상자의 테두리 색상을 투명으로 설정
                                    // 중요: 데이터셋의 borderColor는 그대로 유지하되,
                                    // 범례 아이콘을 그릴 때만 테두리를 없앱니다.

                                    return label;
                                });
                            }
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                elements: {
                    point: {
                        radius: 0
                    }
                }
            };

            const options = { ...defaultOptions, ...additionalOptions };
            if (options.scales && additionalOptions.scales) {
                options.scales = { ...defaultOptions.scales, ...additionalOptions.scales };
                if (options.scales.x && additionalOptions.scales.x) {
                    options.scales.x = { ...defaultOptions.scales.x, ...additionalOptions.scales.x };
                }
                if (options.scales.y && additionalOptions.scales.y) {
                    options.scales.y = { ...defaultOptions.scales.y, ...additionalOptions.scales.y };
                    if (!additionalOptions.scales.y.ticks || !additionalOptions.scales.y.ticks.hasOwnProperty('count')) {
                        options.scales.y.ticks.count = defaultOptions.scales.y.ticks.count;
                    }
                }
            }

            let chartData = { datasets: datasets };
            if (type === 'bar' && additionalOptions.labels) {
                chartData = { labels: additionalOptions.labels, datasets: datasets };
                delete additionalOptions.labels;
            }

            return new Chart(ctx, {
                type: type,
                data: chartData,
                options: options
            });
        }
        return null;
    };

    // 차트 각 지수 색깔 다양화 - 더 많은 색상 추가
    const colors = [
        'rgba(0, 101, 126, 0.8)',   // Dark Teal
        'rgba(0, 58, 82, 0.8)',    // Darker Blue
        'rgba(40, 167, 69, 0.8)',   // Green
        'rgba(253, 126, 20, 0.8)',  // Orange
        'rgba(111, 66, 193, 0.8)',  // Purple
        'rgba(220, 53, 69, 0.8)',   // Red
        'rgba(23, 162, 184, 0.8)',  // Cyan
        'rgba(108, 117, 125, 0.8)', // Gray
        'rgba(255, 193, 7, 0.8)',   // Yellow
        'rgba(52, 58, 64, 0.8)',    // Dark Gray
        'rgba(200, 100, 0, 0.8)',   // Brown
        'rgba(0, 200, 200, 0.8)',   // Light Blue
        'rgba(150, 50, 100, 0.8)',  // Plum
        'rgba(50, 150, 50, 0.8)',   // Forest Green
        'rgba(250, 100, 150, 0.8)', // Pink
        'rgba(100, 100, 200, 0.8)'  // Medium Blue
    ];

    const borderColors = [
        '#00657e',
        '#003A52',
        '#218838',
        '#e68a00',
        '#5a32b2',
        '#c82333',
        '#138496',
        '#6c757d',
        '#ffc107',
        '#343a40',
        '#c86400',
        '#00c8c8',
        '#963264',
        '#329632',
        '#fa6496',
        '#6464c8'
    ];

    let colorIndex = 0;
    const getNextColor = () => {
        const color = colors[colorIndex % colors.length];
        colorIndex++;
        return color;
    };
    const getNextBorderColor = () => {
        const color = borderColors[colorIndex % borderColors.length];
        return color;
    };

    const aggregateDataByMonth = (data, numMonths = 12) => {
        if (data.length === 0) return { aggregatedData: [], monthlyLabels: [] };

        data.sort((a, b) => new Date(a.date) - new Date(b.date));

        const monthlyDataMap = new Map();

        const latestDate = new Date(data[data.length - 1].date);
        const startDate = new Date(latestDate);
        startDate.setMonth(latestDate.getMonth() - (numMonths - 1));

        const allMonthKeys = [];
        let currentMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
        while (currentMonth <= latestDate) {
            allMonthKeys.push(`${currentMonth.getFullYear()}-${(currentMonth.getMonth() + 1).toString().padStart(2, '0')}`);
            currentMonth.setMonth(currentMonth.getMonth() + 1);
        }

        data.forEach(item => {
            const date = new Date(item.date);
            const yearMonth = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;

            if (!monthlyDataMap.has(yearMonth)) {
                monthlyDataMap.set(yearMonth, {});
            }
            const monthEntry = monthlyDataMap.get(yearMonth);

            for (const key in item) {
                if (key !== 'date' && item[key] !== null && !isNaN(item[key])) {
                    if (!monthEntry[key]) {
                        monthEntry[key] = { sum: 0, count: 0 };
                    }
                    monthEntry[key].sum += item[key];
                    monthEntry[key].count++;
                }
            }
        });

        const aggregatedData = [];
        const monthlyLabels = [];

        const allDataKeys = new Set();
        if (data.length > 0) {
            Object.keys(data[0]).forEach(key => {
                if (key !== 'date') allDataKeys.add(key);
            });
        }

        allMonthKeys.forEach(yearMonth => {
            const monthEntry = monthlyDataMap.get(yearMonth);
            const newEntry = { date: yearMonth + '-01' };

            allDataKeys.forEach(key => {
                newEntry[key] = monthEntry && monthEntry[key] && monthEntry[key].count > 0
                                        ? monthEntry[key].sum / monthEntry[key].count
                                        : null;
            });
            
            aggregatedData.push(newEntry);
            monthlyLabels.push(yearMonth + '-01');
        });

        return { aggregatedData: aggregatedData, monthlyLabels: monthlyLabels };
    };

    const setupSlider = (slidesSelector, intervalTime) => {
        const slides = document.querySelectorAll(slidesSelector);
        let currentSlide = 0;

        const showSlide = (index) => {
            slides.forEach((slide, i) => {
                if (i === index) {
                    slide.classList.add('active');
                } else {
                    slide.classList.remove('active');
                }
            });
        };

        const nextSlide = () => {
            currentSlide = (currentSlide + 1) % slides.length;
            showSlide(currentSlide);
        };

        if (slides.length > 0) {
            showSlide(currentSlide);
            if (slides.length > 1) {
                // 기존 인터벌이 있다면 클리어 (슬라이더 중복 실행 방지)
                if (slides[0].dataset.intervalId) {
                    clearInterval(parseInt(slides[0].dataset.intervalId));
                }
                const intervalId = setInterval(nextSlide, intervalTime);
                slides[0].dataset.intervalId = intervalId.toString(); // 첫 번째 슬라이드에 인터벌 ID 저장
            }
        }
    };

    const cityTimezones = {
        'la': 'America/Los_Angeles',
        'ny': 'America/New_York',
        'paris': 'Europe/Paris',
        'shanghai': 'Asia/Shanghai',
        'seoul': 'Asia/Seoul',
        'sydney': 'Australia/Sydney'
    };

    function updateWorldClocks() {
        const now = new Date();
        for (const cityKey in cityTimezones) {
            const timezone = cityTimezones[cityKey];
            const options = {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
                timeZone: timezone
            };
            const timeString = new Intl.DateTimeFormat('en-US', options).format(now);
            const elementId = `time-${cityKey}`;
            const timeElement = document.getElementById(elementId);
            if (timeElement) {
                timeElement.textContent = timeString;
            }
        }
    }

    // 날짜 포맷팅 헬퍼 함수
    const formatDateForTable = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date)) return ''; // Invalid date
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${month}-${day}-${year}`;
    };

    // renderTable 함수 수정: headerDates 인자 추가
    const renderTable = (containerId, headers, rows, headerDates = {}) => {
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn(`Table container with ID ${containerId} not found.`);
            return;
        }

        container.innerHTML = '';

        if (!headers || headers.length === 0 || !rows || rows.length === 0) {
            container.innerHTML = '<p class="text-gray-600 text-center">No data available for this table.</p>';
            return;
        }

        const table = document.createElement('table');
        table.classList.add('data-table');

        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        headers.forEach(headerText => {
            const th = document.createElement('th');
            // 헤더에 날짜 정보 추가
            if (headerText.includes('Current Index') && headerDates.currentIndexDate) {
                th.innerHTML = `Current Index<br><span class="table-date-header">${headerDates.currentIndexDate}</span>`;
            } else if (headerText.includes('Previous Index') && headerDates.previousIndexDate) {
                th.innerHTML = `Previous Index<br><span class="table-date-header">${headerDates.previousIndexDate}</span>`;
            } else {
                th.textContent = headerText;
            }
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        rows.forEach(rowData => {
            const tr = document.createElement('tr');
            headers.forEach(header => {
                const td = document.createElement('td');
                let content = '';
                let colorClass = '';

                if (header.includes('Weekly Change')) {
                    const weeklyChange = rowData.weekly_change;
                    content = weeklyChange?.value !== undefined && weeklyChange?.percentage !== undefined
                                    ? `${weeklyChange.value} (${weeklyChange.percentage})`
                                    : '-';
                    colorClass = weeklyChange?.color_class || '';
                    td.textContent = content;
                    if (colorClass) {
                        td.classList.add(colorClass);
                    }
                } else if (header.includes('Current Index')) {
                    content = rowData.current_index ?? '-';
                    td.textContent = content; // 값만 표시, 날짜는 헤더로 이동
                } else if (header.includes('Previous Index')) {
                    content = rowData.previous_index ?? '-';
                    td.textContent = content; // 값만 표시, 날짜는 헤더로 이동
                } else if (header.includes('항로') || header.includes('route')) {
                    const displayRouteName = rowData.route ? rowData.route.split('_').slice(1).join('_') : '-';
                    td.textContent = displayRouteName;
                } else {
                    td.textContent = rowData[header.toLowerCase().replace(/\s/g, '_')] ?? '-';
                }
                
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        container.appendChild(table);
    };

    const routeToDataKeyMap = {
        KCCI: {
            "종합지수": "KCCI_Composite_Index",
            "미주서안": "KCCI_US_West_Coast",
            "미주동안": "KCCI_US_East_Coast",
            "유럽": "KCCI_Europe",
            "지중해": "KCCI_Mediterranean",
            "중동": "KCCI_Middle_East",
            "호주": "KCCI_Australia",
            "남미동안": "KCCI_South_America_East_Coast",
            "남미서안": "KCCI_South_America_West_Coast",
            "남아프리카": "KCCI_South_Africa",
            "서아프리카": "KCCI_West_Africa",
            "중국": "KCCI_China",
            "일본": "KCCI_Japan",
            "동남아시아": "KCCI_Southeast_Asia"
        },
        SCFI: {
            "종합지수": "SCFI_Composite_Index",
            "미주서안": "SCFI_US_West_Coast",
            "미주동안": "SCFI_US_East_Coast",
            "북유럽": "SCFI_North_Europe",
            "지중해": "SCFI_Mediterranean",
            "동남아시아": "SCFI_Southeast_Asia",
            "중동": "SCFI_Middle_East",
            "호주/뉴질랜드": "SCFI_Australia_New_Zealand",
            "남아메리카": "SCFI_South_America",
            "일본서안": "SCFI_Japan_West_Coast",
            "일본동안": "SCFI_Japan_East_Coast",
            "한국": "SCFI_Korea",
            "동부/서부 아프리카": "SCFI_East_West_Africa",
            "남아공": "SCFI_South_Africa"
        },
        WCI: {
            "종합지수": "WCI_Composite_Index",
            "상하이 → 로테르담": "WCI_Shanghai_Rotterdam",
            "로테르담 → 상하이": "WCI_Rotterdam_Shanghai",
            "상하이 → 제노바": "WCI_Shanghai_Genoa",
            "상하이 → 로스엔젤레스": "WCI_Shanghai_to_Los_Angeles",
            "로스엔젤레스 → 상하이": "WCI_Los_Angeles_to_Shanghai",
            "상하이 → 뉴욕": "WCI_Shanghai_New_York",
            "뉴욕 → 로테르담": "WCI_New_York_Rotterdam",
            "로테르담 → 뉴욕": "WCI_Rotterdam_New_York",
        },
        IACI: {
            "종합지수": "IACI_Composite_Index"
        },
        BLANK_SAILING: {
            "Gemini Cooperation": "BLANK_SAILING_Gemini_Cooperation",
            "MSC": "BLANK_SAILING_MSC",
            "OCEAN Alliance": "BLANK_SAILING_OCEAN_Alliance",
            "Premier Alliance": "BLANK_SAILING_Premier_Alliance",
            "Others/Independent": "BLANK_SAILING_Others_Independent",
            "Total": "BLANK_SAILING_Total"
        },
        FBX: {
            "종합지수": "FBX_Composite_Index",
            "중국/동아시아 → 미주서안": "FBX_China_EA_US_West_Coast",
            "미주서안 → 중국/동아시아": "FBX_US_West_Coast_China_EA",
            "중국/동아시아 → 미주동안": "FBX_China_EA_US_East_Coast",
            "미주동안 → 중국/동아시아": "FBX_US_East_Coast_China_EA",
            "중국/동아시아 → 북유럽": "FBX_China_EA_North_Europe",
            "북유럽 → 중국/동아시아": "FBX_North_Europe_China_EA",
            "중국/동아시아 → 지중해": "FBX_China_EA_Mediterranean",
            "지중해 → 중국/동아시아": "FBX_Mediterranean_China_EA",
            "미주동안 → 북유럽": "FBX_US_East_Coast_North_Europe",
            "북유럽 → 미주동안": "FBX_North_Europe_US_East_Coast",
            "유럽 → 남미동안": "FBX_Europe_South_America_East_Coast",
            "유럽 → 남미서안": "FBX_Europe_South_America_West_Coast"
        },
        XSI: {
            "동아시아 → 북유럽": "XSI_East_Asia_North_Europe",
            "북유럽 → 동아시아": "XSI_North_Europe_East_Asia",
            "동아시아 → 미주서안": "XSI_East_Asia_US_West_Coast",
            "미주서안 → 동아시아": "XSI_US_West_Coast_East_Asia",
            "동아시아 → 남미동안": "XSI_East_Asia_South_America_East_Coast",
            "북유럽 → 미주동안": "XSI_North_Europe_US_East_Coast",
            "미주동안 → 북유럽": "XSI_US_East_Coast_North_Europe",
            "북유럽 → 남미동안": "XSI_North_Europe_South_America_East_Coast"
        },
        MBCI: {
            "MBCI": "MBCI_Value"
        }
    };

    const createDatasetsFromTableRows = (indexType, chartData, tableRows) => {
        const datasets = [];
        const mapping = routeToDataKeyMap[indexType];
        if (!mapping) {
            console.warn(`No data key mapping found for index type: ${indexType}`);
            return datasets;
        }
    
        // 각 차트 유형마다 색상 인덱스를 초기화하여 색상 할당이 일관되도록 합니다.
        colorIndex = 0; 
    
        tableRows.forEach(row => {
            const originalRouteName = row.route.split('_').slice(1).join('_');
            const dataKey = mapping[originalRouteName];
            
            if (dataKey !== null && dataKey !== undefined && row.current_index !== "") { 
                const mappedData = chartData.map(item => {
                    const xVal = item.date;
                    const yVal = item[dataKey];
                    return { x: xVal, y: yVal };
                });
    
                const filteredMappedData = mappedData.filter(point => point.y !== null && point.y !== undefined);
    
                if (filteredMappedData.length > 0) {
                    // borderColors 배열에서 하나의 색상을 가져와서
                    // 차트 라인 색상(borderColor)과 범례 채우기 색상(backgroundColor) 모두에 사용합니다.
                    const sharedColor = borderColors[colorIndex % borderColors.length]; 
                    colorIndex++; 
    
                    datasets.push({
                        label: originalRouteName,
                        data: filteredMappedData,
                        backgroundColor: sharedColor, // 범례 채우기 색상 (테두리 없음)
                        borderColor: sharedColor,     // 차트 라인 색상
                        borderWidth: (originalRouteName.includes('종합지수') || originalRouteName.includes('글로벌 컨테이너 운임 지수') || originalRouteName.includes('US$/40ft') || originalRouteName.includes('Index(종합지수)')) ? 2 : 1,
                        fill: false
                    });
                } else {
                    console.warn(`WARNING: No valid data points found for ${indexType} - route: '${originalRouteName}' (dataKey: '${dataKey}'). Skipping dataset.`);
                }
            } else if (dataKey === null) {
                console.info(`INFO: Skipping chart dataset for route '${row.route}' in ${indexType} as it's explicitly mapped to null (no chart data expected).`);
            } else {
                console.warn(`WARNING: No dataKey found or current_index is empty for ${indexType} - route: '${row.route}'. Skipping dataset.`);
            }
        });
        return datasets;
    };

    // 날씨 아이콘 매핑
    const weatherIconMapping = {
        'clear': '01d', '맑음': '01d',
        'clouds': '02d', '구름': '02d',
        'partly cloudy': '02d',
        'scattered clouds': '03d',
        'broken clouds': '04d',
        'shower rain': '09d',
        'rain': '10d', '비': '10d',
        'thunderstorm': '11d',
        'snow': '13d', '눈': '13d',
        'mist': '50d',
        'fog': '50d',
        'haze': '50d',
        'drizzle': '09d'
    };

    const weatherIconUrl = (status) => {
        if (!status) return `https://placehold.co/80x80/cccccc/ffffff?text=Icon`;
        const lowerStatus = status.toLowerCase();
        let iconCode = null;

        for (const key in weatherIconMapping) {
            if (lowerStatus.includes(key)) {
                iconCode = weatherIconMapping[key];
                break;
            }
        }
        
        if (iconCode) {
            return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
        }
        return `https://placehold.co/80x80/cccccc/ffffff?text=Icon`; // Default placeholder if no match
    };

async function loadAndDisplayData() {
    let allDashboardData = {};
    try {
        const response = await fetch(DATA_JSON_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        allDashboardData = await response.json();
        console.log("Loaded all dashboard data:", allDashboardData);

        const chartDataBySection = allDashboardData.chart_data || {};
        const tableDataBySection = allDashboardData.table_data || {};
        const weatherData = allDashboardData.weather_data || {};
        const exchangeRatesData = allDashboardData.exchange_rate || [];

        console.log("Chart Data:", chartDataBySection);
        console.log("Table Data:", tableDataBySection);

        // 날씨 및 환율 데이터 처리 (기존 코드 유지)
        const currentWeatherData = weatherData.current || {};
        const forecastWeatherData = weatherData.forecast || [];

        const tempCurrent = document.getElementById('temperature-current');
        if (tempCurrent) tempCurrent.textContent = currentWeatherData.LA_Temperature ? `${currentWeatherData.LA_Temperature}°F` : '--°F';
        
        const statusCurrent = document.getElementById('status-current');
        if (statusCurrent) statusCurrent.textContent = currentWeatherData.LA_WeatherStatus || 'Loading...';
        
        const weatherIcon = document.getElementById('weather-icon-current');
        if (weatherIcon) weatherIcon.src = weatherIconUrl(currentWeatherData.LA_WeatherStatus);

        const humidityCurrent = document.getElementById('humidity-current');
        if (humidityCurrent) humidityCurrent.textContent = currentWeatherData.LA_Humidity ? `${currentWeatherData.LA_Humidity}%` : '--%';
        
        const windSpeedCurrent = document.getElementById('wind-speed-current');
        if (windSpeedCurrent) windSpeedCurrent.textContent = currentWeatherData.LA_WindSpeed ? `${currentWeatherData.LA_WindSpeed} mph` : '-- mph';
        
        const pressureCurrent = document.getElementById('pressure-current');
        if (pressureCurrent) pressureCurrent.textContent = currentWeatherData.LA_Pressure ? `${currentWeatherData.LA_Pressure} hPa` : '-- hPa';
        
        const visibilityCurrent = document.getElementById('visibility-current');
        if (visibilityCurrent) visibilityCurrent.textContent = currentWeatherData.LA_Visibility ? `${currentWeatherData.LA_Visibility} mile` : '-- mile';
        
        const sunriseTime = document.getElementById('sunrise-time');
        if (sunriseTime) sunriseTime.textContent = currentWeatherData.LA_Sunrise || '--';
        
        const sunsetTime = document.getElementById('sunset-time');
        if (sunsetTime) sunsetTime.textContent = currentWeatherData.LA_Sunset || '--';

        const forecastTableContainer = document.getElementById('forecast-table-container');
        if (forecastTableContainer) {
            forecastTableContainer.innerHTML = '';
            if (forecastWeatherData.length > 0) {
                const table = document.createElement('table');
                table.classList.add('data-table', 'forecast-table');
                const colgroup = document.createElement('colgroup');
                const col1 = document.createElement('col'); col1.style.width = '20%'; colgroup.appendChild(col1);
                for (let i = 0; i < 5; i++) { const col = document.createElement('col'); col.style.width = '16%'; colgroup.appendChild(col); }
                table.appendChild(colgroup);
                const thead = document.createElement('thead');
                const headerRow = document.createElement('tr'); headerRow.insertCell().textContent = '';
                const displayForecast = forecastWeatherData.slice(0, 5);
                for (let i = 0; i < 5; i++) {
                    const day = displayForecast[i] || {};
                    const th = document.createElement('th');
                    th.className = 'text-sm font-semibold whitespace-nowrap leading-tight';
                    th.textContent = day.date ? `${day.date.split('/')[0]}/${day.date.split('/')[1]}` : '--';
                    headerRow.appendChild(th);
                }
                thead.appendChild(headerRow); table.appendChild(thead);
                const tbody = document.createElement('tbody');
                const maxRow = document.createElement('tr'); maxRow.insertCell().textContent = 'Max (°F)';
                for (let i = 0; i < 5; i++) {
                    const day = displayForecast[i] || {};
                    const td = document.createElement('td');
                    td.textContent = day.max_temp != null ? `${day.max_temp}` : '--';
                    maxRow.appendChild(td);
                }
                tbody.appendChild(maxRow);
                const minRow = document.createElement('tr'); minRow.insertCell().textContent = 'Min (°F)';
                for (let i = 0; i < 5; i++) {
                    const day = displayForecast[i] || {};
                    const td = document.createElement('td');
                    td.textContent = day.min_temp != null ? `${day.min_temp}` : '--';
                    minRow.appendChild(td);
                }
                tbody.appendChild(minRow);
                const weatherStatusRow = document.createElement('tr'); weatherStatusRow.insertCell().textContent = 'Weather';
                for (let i = 0; i < 5; i++) {
                    const day = displayForecast[i] || {};
                    const td = document.createElement('td');
                    td.textContent = day.status ? day.status.replace(/\s*\(.*\)/, '').trim() : '--';
                    weatherStatusRow.appendChild(td);
                }
                tbody.appendChild(weatherStatusRow);
                table.appendChild(tbody); forecastTableContainer.appendChild(table);
            } else {
                forecastTableContainer.innerHTML = '<p class="text-gray-600 text-center">No forecast data available.</p>';
            }
        }

        const currentExchangeRate = exchangeRatesData.length > 0 ? exchangeRatesData[exchangeRatesData.length - 1].rate : null;
        const currentExchangeRateElement = document.getElementById('current-exchange-rate-value');
        if (currentExchangeRateElement) {
            currentExchangeRateElement.textContent = currentExchangeRate ? `${currentExchangeRate.toFixed(2)} KRW` : 'Loading...';
        }

        if (exchangeRateChart) exchangeRateChart.destroy();
        const exchangeRateDatasets = [{
            label: 'USD/KRW Exchange Rate',
            data: exchangeRatesData.map(item => ({ x: item.date, y: item.rate })),
            backgroundColor: 'rgba(253, 126, 20, 0.5)',
            borderColor: '#e68a00',
            borderWidth: 2,
            fill: false,
            pointRadius: 0
        }];
        exchangeRateChart = setupChart(
            'exchangeRateChartCanvas', 'line',
            exchangeRateDatasets,
            {
                scales: {
                    x: { type: 'time', time: { unit: 'day', displayFormats: { day: 'MM/dd' }, tooltipFormat: 'M/d/yyyy' }, ticks: { autoSkipPadding: 10 }, title: { display: false } },
                    y: { beginAtZero: false, ticks: { count: 5 }, grid: { display: true, color: 'rgba(0, 0, 0, 0.1)' }, title: { display: false } }
                },
                plugins: { legend: { display: false } }
            },
            false
        );

        // 차트와 테이블 렌더링 함수 (중복 선언 제거)
        function renderChartAndTable(indexType, chartId, tableId, chartData, tableData) {
            console.log(`Rendering ${indexType}:`, { chartId, tableId });

            const chartCanvas = document.getElementById(chartId);
            const tableContainer = document.getElementById(tableId);
            if (!chartCanvas) {
                console.error(`Chart canvas '${chartId}' not found in HTML.`);
                return;
            }
            if (!tableContainer) {
                console.error(`Table container '${tableId}' not found in HTML.`);
                return;
            }

            const data = chartData || [];
            const tableRows = tableData ? tableData.rows : [];
            if (data.length === 0 || tableRows.length === 0) {
                console.warn(`No data for ${indexType}. Chart/Table not rendered.`);
                tableContainer.innerHTML = '<p class="text-gray-600 text-center">No data available.</p>';
                return;
            }

            const datasets = createDatasetsFromTableRows(indexType, data, tableRows);
            if (datasets.length === 0) {
                console.warn(`No datasets for ${indexType}. Check routeToDataKeyMap or data.`);
                tableContainer.innerHTML = '<p class="text-gray-600 text-center">No data available.</p>';
                return;
            }

            const chart = setupChart(chartId, indexType === 'BLANK_SAILING' ? 'bar' : 'line', datasets, {}, indexType === 'BLANK_SAILING');
            if (chart) {
                console.log(`${indexType} Chart rendered.`);
            } else {
                console.error(`${indexType} Chart failed to render.`);
            }

            const { latestDate, previousDate } = getLatestAndPreviousDates(data);
            renderTable(tableId, tableData.headers, tableRows, {
                currentIndexDate: formatDateForTable(latestDate),
                previousIndexDate: formatDateForTable(previousDate)
            });
            console.log(`${indexType} Table rendered.`);
        }

        // 각 지수 렌더링
        renderChartAndTable('KCCI', 'KCCIChart', 'KCCITableContainer', chartDataBySection.KCCI, tableDataBySection.KCCI);
        renderChartAndTable('SCFI', 'SCFIChart', 'SCFITableContainer', chartDataBySection.SCFI, tableDataBySection.SCFI);
        renderChartAndTable('WCI', 'WCIChart', 'WCITableContainer', chartDataBySection.WCI, tableDataBySection.WCI);
        renderChartAndTable('IACI', 'IACIChart', 'IACITableContainer', chartDataBySection.IACI, tableDataBySection.IACI);
        renderChartAndTable('BLANK_SAILING', 'blankSailingChart', 'BLANK_SAILINGTableContainer', chartDataBySection.BLANK_SAILING, tableDataBySection.BLANK_SAILING);
        renderChartAndTable('FBX', 'FBXChart', 'FBXTableContainer', chartDataBySection.FBX, tableDataBySection.FBX);
        renderChartAndTable('XSI', 'XSIChart', 'XSITableContainer', chartDataBySection.XSI, tableDataBySection.XSI);
        renderChartAndTable('MBCI', 'MBCIChart', 'MBCITableContainer', chartDataBySection.MBCI, tableDataBySection.MBCI);

        // 슬라이더 설정
        const chartSlides = document.querySelectorAll('.chart-slider-container > .chart-slide');
        console.log("Chart Slides Found:", chartSlides.length);
        if (chartSlides.length === 0) {
            console.error("No .chart-slide elements found in .chart-slider-container.");
        }
        setupSlider('.chart-slider-container > .chart-slide', 10000);
        setupSlider('.top-info-slider-container > .top-info-slide', 10000);

        // 세계 시간 업데이트
        updateWorldClocks();
        setInterval(updateWorldClocks, 1000);

    } catch (error) {
        console.error('Failed to load dashboard data:', error);
        const chartSliderContainer = document.querySelector('.chart-slider-container');
        if (chartSliderContainer) {
            chartSliderContainer.innerHTML = '<p class="text-red-500 text-center">Error loading data. Please try again later.</p>';
        }
    }
}

    loadAndDisplayData();
});
