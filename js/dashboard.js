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
    // 차트를 설정하고 생성하는 범용 함수
    const setupChart = (chartId, type, datasets, additionalOptions = {}, isAggregated = false) => {
        const ctx = document.getElementById(chartId);
        if (ctx) {
            // 기존 차트가 있다면 파괴하여 메모리 누수 방지
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
                            usePointStyle: false, // 사각형 스타일 유지
                            generateLabels: function(chart) {
                                const originalLabels = Chart.defaults.plugins.legend.labels.generateLabels(chart);
                                return originalLabels.map(label => {
                                    // 각 범례 아이템에 대해 테두리 두께와 색상을 투명하게 설정
                                    label.lineWidth = 0;
                                    label.strokeStyle = 'transparent';
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

    // 슬라이더를 설정하는 함수
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

    // 전 세계 시간대를 위한 도시 매핑
    const cityTimezones = {
        'la': 'America/Los_Angeles',
        'ny': 'America/New_York',
        'paris': 'Europe/Paris',
        'shanghai': 'Asia/Shanghai',
        'seoul': 'Asia/Seoul',
        'sydney': 'Australia/Sydney'
    };

    // 세계 시계를 업데이트하는 함수
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

    // 테이블을 렌더링하는 함수 (헤더에 날짜 정보 추가)
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

    // 항로-데이터 키 매핑
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

    // 테이블 행 데이터로부터 차트 데이터셋을 생성하는 함수
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
                    const sharedColor = borderColors[colorIndex % borderColors.length]; 
                    colorIndex++; 
    
                    datasets.push({
                        label: originalRouteName,
                        data: filteredMappedData,
                        backgroundColor: sharedColor, // 범례 채우기 색상 (테두리 없음)
                        borderColor: sharedColor,      // 차트 라인 색상
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

    // 날씨 상태에 따른 아이콘 URL 반환
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

    // JSON 데이터를 로드하고 모든 차트와 테이블을 표시하는 메인 함수
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
            const weatherData = allDashboardData.weather_data || {};
            const exchangeRatesData = allDashboardData.exchange_rate || [];
            const tableDataBySection = allDashboardData.table_data || {};

            const currentWeatherData = weatherData.current || {};
            const forecastWeatherData = weatherData.forecast || [];

            // 날씨 정보 업데이트 (요소 존재 여부 확인)
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

                    // --- colgroup 추가 (이 부분은 유지합니다) ---
                    const colgroup = document.createElement('colgroup');
                    
                    const col1 = document.createElement('col');
                    col1.style.width = '20%'; 
                    colgroup.appendChild(col1);

                    for (let i = 0; i < 5; i++) { 
                        const col = document.createElement('col');
                        col.style.width = '16%';
                        colgroup.appendChild(col);
                    }
                    table.appendChild(colgroup); 
                    // --- colgroup 추가 끝 ---
                    
                    const thead = document.createElement('thead');
                    const headerRow = document.createElement('tr');

                    headerRow.insertCell().textContent = ''; // 첫 번째 빈 셀

                    const displayForecast = forecastWeatherData.slice(0, 5);
                    const numForecastDays = 5; // 항상 5일 예보를 표시
                    
                    for (let i = 0; i < numForecastDays; i++) {
                        const day = displayForecast[i]; // 데이터가 없으면 undefined
                        const th = document.createElement('th');
                        th.className = 'text-sm font-semibold whitespace-nowrap leading-tight h-8'; 
                        
                        if (day && day.date) { // day 객체가 존재하고 date 속성이 있을 때만 처리
                            const dateParts = day.date.split('/');
                            if (dateParts.length === 3) {
                                const month = parseInt(dateParts[0], 10);
                                const dayNum = parseInt(dateParts[1], 10);
                                if (!isNaN(month) && !isNaN(dayNum)) {
                                    th.textContent = `${month}/${dayNum}`;
                                } else {
                                    th.textContent = '--';
                                }
                            } else {
                                th.textContent = '--';
                            }
                        } else {
                            th.textContent = '--'; // 데이터가 없으면 -- 표시
                        }
                        headerRow.appendChild(th);
                    }
                    thead.appendChild(headerRow);
                    table.appendChild(thead);
                    
                    const tbody = document.createElement('tbody');
                    
                    // Max(°F) 행 (데이터가 부족해도 5개를 모두 생성하도록 수정)
                    const maxRow = document.createElement('tr');
                    maxRow.insertCell().textContent = 'Max (°F)';
                    for (let i = 0; i < numForecastDays; i++) {
                        const day = displayForecast[i];
                        const td = document.createElement('td');
                        td.style.whiteSpace = 'pre-line'; 
                        
                        if (day && day.max_temp != null) {
                            td.textContent = `${day.max_temp}`;
                        } else {
                            td.textContent = '--';
                        }
                        maxRow.appendChild(td);
                    }
                    tbody.appendChild(maxRow);
                    
                    // Min(°F) 행 (데이터가 부족해도 5개를 모두 생성하도록 수정)
                    const minRow = document.createElement('tr');
                    minRow.insertCell().textContent = 'Min (°F)';
                    for (let i = 0; i < numForecastDays; i++) {
                        const day = displayForecast[i];
                        const td = document.createElement('td');
                        td.style.whiteSpace = 'pre-line';
                        
                        if (day && day.min_temp != null) {
                            td.textContent = `${day.min_temp}`;
                        } else {
                            td.textContent = '--';
                        }
                        minRow.appendChild(td);
                    }
                    tbody.appendChild(minRow);
                    
                    // Weather 상태 행 (데이터가 부족해도 5개를 모두 생성하도록 수정)
                    const weatherStatusRow = document.createElement('tr');
                    weatherStatusRow.insertCell().textContent = 'Weather';
                    for (let i = 0; i < numForecastDays; i++) {
                        const day = displayForecast[i];
                        const td = document.createElement('td');
                        if (day && day.status) {
                            td.textContent = day.status.replace(/\s*\(.*\)/, '').trim();
                        } else {
                            td.textContent = '--';
                        }
                        weatherStatusRow.appendChild(td);
                    }
                    tbody.appendChild(weatherStatusRow);
                    
                    table.appendChild(tbody);
                    forecastTableContainer.appendChild(table);
                    
                } else {
                    forecastTableContainer.innerHTML = '<p class="text-gray-600 text-center">No forecast data available.</p>';
                }
            } else {
                console.warn("Element with ID 'forecast-table-container' not found. Cannot render forecast table.");
            }

            const currentExchangeRate = exchangeRatesData.length > 0 ? exchangeRatesData[exchangeRatesData.length - 1].rate : null;
            const currentExchangeRateElement = document.getElementById('current-exchange-rate-value');
            if (currentExchangeRateElement) {
                currentExchangeRateElement.textContent = currentExchangeRate ? `${currentExchangeRate.toFixed(2)} KRW` : 'Loading...';
            } else {
                console.warn("Element with ID 'current-exchange-rate-value' not found.");
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
            console.log("Exchange Rate Datasets:", exchangeRateDatasets); // 여기에 console.log가 끊겨있었음.
            
            exchangeRateChart = setupChart('exchangeRateChart', 'line', exchangeRateDatasets, {
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'month',
                            displayFormats: {
                                month: 'MM/yy'
                            },
                            tooltipFormat: 'M/d/yyyy'
                        },
                        ticks: {
                            autoSkip: true,
                            maxTicksLimit: 12
                        }
                    },
                    y: {
                        beginAtZero: false
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(context.parsed.y);
                                }
                                return label;
                            }
                        }
                    }
                }
            });


            // 여기서부터 다른 차트들을 추가합니다.
            // 1. KCCI 차트
            if (tableDataBySection.KCCI && chartDataBySection.KCCI) {
                const kcciTableRows = tableDataBySection.KCCI.table_rows;
                const kcciChartData = chartDataBySection.KCCI.chart_data;
                const kcciHeaderDates = {
                    currentIndexDate: tableDataBySection.KCCI.latest_date,
                    previousIndexDate: tableDataBySection.KCCI.previous_date
                };

                const kcciHeaders = ["항로", "Current Index", "Previous Index", "Weekly Change"];
                renderTable('kcci-table-container', kcciHeaders, kcciTableRows, kcciHeaderDates);

                const kcciDatasets = createDatasetsFromTableRows('KCCI', kcciChartData, kcciTableRows);
                KCCIChart = setupChart('kcciChart', 'line', kcciDatasets);
            }

            // 2. SCFI 차트
            if (tableDataBySection.SCFI && chartDataBySection.SCFI) {
                const scfiTableRows = tableDataBySection.SCFI.table_rows;
                const scfiChartData = chartDataBySection.SCFI.chart_data;
                const scfiHeaderDates = {
                    currentIndexDate: tableDataBySection.SCFI.latest_date,
                    previousIndexDate: tableDataBySection.SCFI.previous_date
                };

                const scfiHeaders = ["항로", "Current Index", "Previous Index", "Weekly Change"];
                renderTable('scfi-table-container', scfiHeaders, scfiTableRows, scfiHeaderDates);

                const scfiDatasets = createDatasetsFromTableRows('SCFI', scfiChartData, scfiTableRows);
                SCFIChart = setupChart('scfiChart', 'line', scfiDatasets);
            }

            // 3. WCI 차트
            if (tableDataBySection.WCI && chartDataBySection.WCI) {
                const wciTableRows = tableDataBySection.WCI.table_rows;
                const wciChartData = chartDataBySection.WCI.chart_data;
                const wciHeaderDates = {
                    currentIndexDate: tableDataBySection.WCI.latest_date,
                    previousIndexDate: tableDataBySection.WCI.previous_date
                };

                const wciHeaders = ["항로", "Current Index", "Previous Index", "Weekly Change"];
                renderTable('wci-table-container', wciHeaders, wciTableRows, wciHeaderDates);

                const wciDatasets = createDatasetsFromTableRows('WCI', wciChartData, wciTableRows);
                WCIChart = setupChart('wciChart', 'line', wciDatasets);
            }

            // 4. IACI 차트
            if (tableDataBySection.IACI && chartDataBySection.IACI) {
                const iaciTableRows = tableDataBySection.IACI.table_rows;
                const iaciChartData = chartDataBySection.IACI.chart_data;
                const iaciHeaderDates = {
                    currentIndexDate: tableDataBySection.IACI.latest_date,
                    previousIndexDate: tableDataBySection.IACI.previous_date
                };

                const iaciHeaders = ["항로", "Current Index", "Previous Index", "Weekly Change"];
                renderTable('iaci-table-container', iaciHeaders, iaciTableRows, iaciHeaderDates);

                const iaciDatasets = createDatasetsFromTableRows('IACI', iaciChartData, iaciTableRows);
                IACIChart = setupChart('iaciChart', 'line', iaciDatasets);
            }
            
            // 5. Blank Sailing 차트
            if (chartDataBySection.BLANK_SAILING) {
                const blankSailingData = chartDataBySection.BLANK_SAILING.chart_data;
                const aggregatedData = aggregateDataByMonth(blankSailingData, 12);

                const blankSailingLabels = aggregatedData.monthlyLabels.map(label => {
                    const date = new Date(label);
                    return date.toLocaleString('en-US', { month: 'short', year: '2-digit' });
                });

                const datasets = [];
                colorIndex = 0; // 색상 인덱스 초기화
                for (const key in blankSailingData[0]) {
                    if (key !== 'date') {
                        const sharedColor = borderColors[colorIndex % borderColors.length];
                        colorIndex++;

                        datasets.push({
                            label: key.split('_').slice(2).join(' '),
                            data: aggregatedData.aggregatedData.map(item => item[key]),
                            backgroundColor: sharedColor,
                            borderColor: sharedColor,
                            borderWidth: 1
                        });
                    }
                }

                blankSailingChart = setupChart('blankSailingChart', 'bar', datasets, {
                    labels: blankSailingLabels,
                    scales: {
                        x: {
                            type: 'category',
                            title: {
                                display: false
                            },
                            ticks: {
                                maxTicksLimit: 12
                            },
                            grid: {
                                display: false
                            }
                        },
                        y: {
                            beginAtZero: true,
                            title: {
                                display: false
                            },
                            ticks: {
                                count: 5
                            },
                            grid: {
                                display: true
                            }
                        }
                    }
                });
            }

            // 6. FBX 차트
            if (tableDataBySection.FBX && chartDataBySection.FBX) {
                const fbxTableRows = tableDataBySection.FBX.table_rows;
                const fbxChartData = chartDataBySection.FBX.chart_data;
                const fbxHeaderDates = {
                    currentIndexDate: tableDataBySection.FBX.latest_date,
                    previousIndexDate: tableDataBySection.FBX.previous_date
                };

                const fbxHeaders = ["항로", "Current Index", "Previous Index", "Weekly Change"];
                renderTable('fbx-table-container', fbxHeaders, fbxTableRows, fbxHeaderDates);

                const fbxDatasets = createDatasetsFromTableRows('FBX', fbxChartData, fbxTableRows);
                FBXChart = setupChart('fbxChart', 'line', fbxDatasets);
            }

            // 7. XSI 차트
            if (tableDataBySection.XSI && chartDataBySection.XSI) {
                const xsiTableRows = tableDataBySection.XSI.table_rows;
                const xsiChartData = chartDataBySection.XSI.chart_data;
                const xsiHeaderDates = {
                    currentIndexDate: tableDataBySection.XSI.latest_date,
                    previousIndexDate: tableDataBySection.XSI.previous_date
                };
                const xsiHeaders = ["항로", "Current Index", "Previous Index", "Weekly Change"];
                renderTable('xsi-table-container', xsiHeaders, xsiTableRows, xsiHeaderDates);

                const xsiDatasets = createDatasetsFromTableRows('XSI', xsiChartData, xsiTableRows);
                XSIChart = setupChart('xsiChart', 'line', xsiDatasets);
            }
            
            // 8. MBCI 차트
            if (tableDataBySection.MBCI && chartDataBySection.MBCI) {
                const mbciTableRows = tableDataBySection.MBCI.table_rows;
                const mbciChartData = chartDataBySection.MBCI.chart_data;
                const mbciHeaderDates = {
                    currentIndexDate: tableDataBySection.MBCI.latest_date,
                    previousIndexDate: tableDataBySection.MBCI.previous_date
                };
                const mbciHeaders = ["MBCI", "Current Index", "Previous Index", "Weekly Change"];
                renderTable('mbci-table-container', mbciHeaders, mbciTableRows, mbciHeaderDates);

                const mbciDatasets = createDatasetsFromTableRows('MBCI', mbciChartData, mbciTableRows);
                MBCIChart = setupChart('mbciChart', 'line', mbciDatasets);
            }
            
            // 슬라이더 및 세계 시계 업데이트
            setupSlider('.slider-container .slide', 3000);
            updateWorldClocks();
            setInterval(updateWorldClocks, 1000); // 1초마다 시계 업데이트

        } catch (error) {
            console.error("Error loading or processing data:", error);
            // 에러 메시지 표시
            const errorElement = document.getElementById('data-error-message');
            if(errorElement) {
                errorElement.textContent = `데이터를 불러오는 데 실패했습니다: ${error.message}`;
            }
        }
    }

    // 초기 데이터 로드 및 표시
    loadAndDisplayData();
});
