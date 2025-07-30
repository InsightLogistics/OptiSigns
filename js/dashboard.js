let KCCIChart;
let SCFIChart;
let WCIChart;
let IACIChart;
let blankSailingChart;
let FBXChart;
let XSIChart;
let MBCIChart; // MBCI Chart 변수 선언
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
                            display: true,
                            text: 'Date'
                        },
                        type: 'time',
                        time: {
                            unit: isAggregated ? 'month' : 'day',
                            displayFormats: {
                                month: 'MM/01/yyyy', // 변경: 가로축 날짜 형식을 MM/01/yyyy로 변경
                                day: 'M/dd'
                            },
                            tooltipFormat: 'M/d/yyyy'
                        },
                        ticks: {
                            source: 'auto',
                            autoSkipPadding: 10
                        },
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Value'
                        },
                        ticks: {
                            count: 5
                        },
                        grid: {
                            display: true, // 변경: 세로축 보조선 표시
                            color: 'rgba(200, 200, 200, 0.5)' // 추가: 세로축 보조선 색상을 회색으로 설정
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'right',
                        labels: {
                            boxWidth: 12,  // 색상 박스 너비
                            padding: 20,   // 범례 간 간격
                            usePointStyle: true,  // 포인트 스타일 사용
                            pointStyle: 'circle', // 원형 스타일 지정
                            font: {
                                size: 12
                            },
                            // 테두리 관련 설정
                            boxBorderWidth: 0,    // 박스 테두리 두께
                            borderWidth: 0,       // 텍스트 테두리 두께
                            lineWidth: 0          // 라인 두께
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

            if (isAggregated) {
                defaultOptions.scales.x.ticks.maxTicksLimit = 12;
            } else {
                delete defaultOptions.scales.x.ticks.maxTicksLimit;
            }

            // 옵션 병합 로직을 간소화하여 중복을 피하고 기본값 재정의를 보장
            const options = {
                ...defaultOptions,
                ...additionalOptions,
                scales: {
                    ...defaultOptions.scales,
                    ...additionalOptions.scales,
                    x: {
                        ...defaultOptions.scales.x,
                        ...(additionalOptions.scales && additionalOptions.scales.x),
                        time: {
                            ...defaultOptions.scales.x.time,
                            ...(additionalOptions.scales && additionalOptions.scales.x && additionalOptions.scales.x.time),
                            displayFormats: {
                                ...defaultOptions.scales.x.time.displayFormats,
                                ...(additionalOptions.scales && additionalOptions.scales.x && additionalOptions.scales.x.time && additionalOptions.scales.x.time.displayFormats)
                            }
                        }
                    },
                    y: {
                        ...defaultOptions.scales.y,
                        ...(additionalOptions.scales && additionalOptions.scales.y),
                        grid: {
                            ...defaultOptions.scales.y.grid,
                            ...(additionalOptions.scales && additionalOptions.scales.y && additionalOptions.scales.y.grid)
                        }
                    }
                },
                plugins: {
                    ...defaultOptions.plugins,
                    ...additionalOptions.plugins,
                    legend: {
                        ...defaultOptions.plugins.legend,
                        ...(additionalOptions.plugins && additionalOptions.plugins.legend),
                        labels: {
                            ...defaultOptions.plugins.legend.labels,
                            ...(additionalOptions.plugins && additionalOptions.plugins.legend && additionalOptions.plugins.legend.labels)
                        }
                    }
                }
            };

            // 병합 후 집계된 차트에 대해 maxTicksLimit 다시 적용
            if (isAggregated) {
                options.scales.x.ticks.maxTicksLimit = 12;
            } else {
                delete options.scales.x.ticks.maxTicksLimit;
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

    const colors = [
        'rgba(0, 101, 126, 0.8)',
        'rgba(0, 58, 82, 0.8)',
        'rgba(40, 167, 69, 0.8)',
        'rgba(253, 126, 20, 0.8)',
        'rgba(111, 66, 193, 0.8)',
        'rgba(220, 53, 69, 0.8)',
        'rgba(23, 162, 184, 0.8)',
        'rgba(108, 117, 125, 0.8)'
    ];

    const borderColors = [
        '#00657e',
        '#003A52',
        '#218838',
        '#e68a00',
        '#5a32b2',
        '#c82333',
        '#138496',
        '#6c757d'
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
            if (slides.length > 1) { // 슬라이드가 1개 이상일 때만 인터벌 설정
                setInterval(nextSlide, intervalTime);
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

    const renderTable = (containerId, headers, rows) => {
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
            th.textContent = headerText;
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
                } else if (header.includes('Current Index')) {
                    content = rowData.current_index ?? '-';
                } else if (header.includes('Previous Index')) {
                    content = rowData.previous_index ?? '-';
                } else if (header.includes('항로') || header.includes('route')) {
                    const displayRouteName = rowData.route ? rowData.route.split('_').slice(1).join('_') : '-';
                    content = displayRouteName;
                } else {
                    content = rowData[header.toLowerCase().replace(/\s/g, '_')] ?? '-';
                }
                
                td.textContent = content;
                if (colorClass) {
                    td.classList.add(colorClass);
                }
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        container.appendChild(table);
    };
            // 이 아래 부분은 죽어도 건드리지말고 토씨하나 빠뜨리면 안되고 그대로 사용해야함 이 주석또한 절대로 지우지 말라
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
            "상하이 → 로스엔젤레스": "WCI_Shanghai_to_Los_Angeles", // Changed to match fetch_chart_data.py
            "로스엔젤레스 → 상하이": "WCI_Los_Angeles_to_Shanghai", // Changed to match fetch_chart_data.py
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
            "종합지수": "FBX_Composite_Index", // Changed to match fetch_chart_data.py
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
                    datasets.push({
                        label: originalRouteName,
                        data: filteredMappedData,
                        backgroundColor: getNextColor(),
                        borderColor: getNextBorderColor(),
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

            if (Object.keys(chartDataBySection).length === 0) {
                console.warn("No chart data sections found in the JSON file.");
                const chartSliderContainer = document.querySelector('.chart-slider-container');
                if (chartSliderContainer) {
                    chartSliderContainer.innerHTML = '<p class="placeholder-text">No chart data available.</p>';
                }
                return;
            }

            const currentWeatherData = weatherData.current || {};
            const forecastWeatherData = weatherData.forecast || [];

            // 날씨 정보 업데이트 (요소 존재 여부 확인)
            const tempCurrent = document.getElementById('temperature-current');
            if (tempCurrent) tempCurrent.textContent = currentWeatherData.LA_Temperature ? `${currentWeatherData.LA_Temperature}°F` : '--°F';
            
            const statusCurrent = document.getElementById('status-current');
            if (statusCurrent) statusCurrent.textContent = currentWeatherData.LA_WeatherStatus || 'Loading...';
            
            const weatherIcon = document.getElementById('weather-icon-current');
            // 변경: 날씨 아이콘 URL을 OpenWeatherMap API 형식으로 변경
            const weatherIconUrl = (iconCode) => {
                if (iconCode) {
                    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
                }
                return 'https://placehold.co/80x80/cccccc/ffffff?text=Icon'; // 아이콘 코드가 없을 경우 대체 이미지
            };
            // LA_WeatherIcon 데이터를 사용하여 아이콘 설정
            if (weatherIcon) weatherIcon.src = weatherIconUrl(currentWeatherData.LA_WeatherIcon);

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

            const forecastBody = document.getElementById('forecast-body');
            if (forecastBody) { // Check if forecastBody exists before manipulating
                forecastBody.innerHTML = '';
                if (forecastWeatherData.length > 0) {
                    forecastWeatherData.slice(0, 7).forEach(day => {
                        const row = forecastBody.insertRow();
                        row.insertCell().textContent = day.date || '--';
                        row.insertCell().textContent = day.min_temp ? `${day.min_temp}°F` : '--';
                        row.insertCell().textContent = day.max_temp ? `${day.max_temp}°F` : '--';
                        row.insertCell().textContent = day.status || '--';
                    });
                } else {
                    forecastBody.innerHTML = '<tr><td colspan="4">No forecast data available.</td></tr>';
                }
            } else {
                console.warn("Element with ID 'forecast-body' not found. Cannot render forecast table.");
            }


            const currentExchangeRate = exchangeRatesData.length > 0 ? exchangeRatesData[exchangeRatesData.length - 1].rate : null;
            const currentExchangeRateElement = document.getElementById('current-exchange-rate-value');
            if (currentExchangeRateElement) { // Check if element exists
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
            console.log("Exchange Rate Chart Datasets (before setup):", exchangeRateDatasets);
            console.log("Exchange Rate Chart Data Sample (first 5 points):", exchangeRateDatasets[0].data.slice(0, 5));


            exchangeRateChart = setupChart(
                'exchangeRateChartCanvas', 'line',
                exchangeRateDatasets,
                {
                    scales: {
                        x: {
                            type: 'time',
                            time: { 
                                unit: 'day', 
                                displayFormats: { day: 'MM/dd' },
                                tooltipFormat: 'M/d/yyyy'
                            },
                            ticks: { autoSkipPadding: 10 }
                        },
                        y: {
                            beginAtZero: false,
                            ticks: { count: 5 },
                            grid: { display: false }
                        }
                    },
                    plugins: {
                        legend: { display: false }
                    }
                },
                false
            );

            colorIndex = 0;

            const KCCIData = chartDataBySection.KCCI || [];
            KCCIData.sort((a, b) => new Date(a.date) - new Date(b.date));
            const KCCITableRows = tableDataBySection.KCCI ? tableDataBySection.KCCI.rows : [];
            const KCCIDatasets = createDatasetsFromTableRows('KCCI', KCCIData, KCCITableRows);
            KCCIChart = setupChart('KCCIChart', 'line', KCCIDatasets, {}, false);
            renderTable('KCCITableContainer', tableDataBySection.KCCI.headers, KCCITableRows);


            colorIndex = 0;
            const SCFIData = chartDataBySection.SCFI || [];
            SCFIData.sort((a, b) => new Date(a.date) - new Date(b.date));
            const SCFITableRows = tableDataBySection.SCFI ? tableDataBySection.SCFI.rows : [];
            const SCFIDatasets = createDatasetsFromTableRows('SCFI', SCFIData, SCFITableRows);
            SCFIChart = setupChart('SCFIChart', 'line', SCFIDatasets, {}, false);
            renderTable('SCFITableContainer', tableDataBySection.SCFI.headers, SCFITableRows);


            colorIndex = 0;
            const WCIData = chartDataBySection.WCI || [];
            WCIData.sort((a, b) => new Date(a.date) - new Date(b.date));
            const WCITableRows = tableDataBySection.WCI ? tableDataBySection.WCI.rows : [];
            const WCIDatasets = createDatasetsFromTableRows('WCI', WCIData, WCITableRows);
            WCIChart = setupChart('WCIChart', 'line', WCIDatasets, {}, false);
            renderTable('WCITableContainer', tableDataBySection.WCI.headers, WCITableRows);


            colorIndex = 0;
            const IACIData = chartDataBySection.IACI || [];
            IACIData.sort((a, b) => new Date(a.date) - new Date(b.date));
            const IACITableRows = tableDataBySection.IACI ? tableDataBySection.IACI.rows : [];
            const IACIDatasets = createDatasetsFromTableRows('IACI', IACIData, IACITableRows);
            IACIChart = setupChart('IACIChart', 'line', IACIDatasets, {}, false);
            renderTable('IACITableContainer', tableDataBySection.IACI.headers, IACITableRows);


            const blankSailingRawData = chartDataBySection.BLANK_SAILING || [];
            const { aggregatedData: aggregatedBlankSailingData, monthlyLabels: blankSailingChartDates } = aggregateDataByMonth(blankSailingRawData, 12);
            
            colorIndex = 0;
            const blankSailingDatasets = [
                {
                    label: "Gemini Cooperation",
                    data: aggregatedBlankSailingData.map(item => ({ x: item.date, y: item.BLANK_SAILING_Gemini_Cooperation })),
                    backgroundColor: getNextColor(),
                    borderColor: getNextBorderColor(),
                    borderWidth: 1
                },
                {
                    label: "MSC",
                    data: aggregatedBlankSailingData.map(item => ({ x: item.date, y: item.BLANK_SAILING_MSC })),
                    backgroundColor: getNextColor(),
                    borderColor: getNextBorderColor(),
                    borderWidth: 1
                },
                {
                    label: "OCEAN Alliance",
                    data: aggregatedBlankSailingData.map(item => ({ x: item.date, y: item.BLANK_SAILING_OCEAN_Alliance })),
                    backgroundColor: getNextColor(),
                    borderColor: getNextBorderColor(),
                    borderWidth: 1
                },
                {
                    label: "Premier Alliance",
                    data: aggregatedBlankSailingData.map(item => ({ x: item.date, y: item.BLANK_SAILING_Premier_Alliance })),
                    backgroundColor: getNextColor(),
                    borderColor: getNextBorderColor(),
                    borderWidth: 1
                },
                {
                    label: "Others/Independent",
                    data: aggregatedBlankSailingData.map(item => ({ x: item.date, y: item.BLANK_SAILING_Others_Independent })),
                    backgroundColor: getNextColor(),
                    borderColor: getNextBorderColor(),
                    borderWidth: 1
                },
                {
                    label: "Total",
                    data: aggregatedBlankSailingData.map(item => ({ x: item.date, y: item.BLANK_SAILING_Total })),
                    backgroundColor: getNextColor(),
                    borderColor: getNextBorderColor(),
                    borderWidth: 1
                }
            ].filter(dataset => dataset.data.some(point => point.y !== null && point.y !== undefined));

            blankSailingChart = setupChart(
                'blankSailingChart', 'bar',
                blankSailingDatasets,
                {
                    scales: {
                        x: {
                            stacked: true,
                            type: 'time',
                            time: {
                                unit: 'month',
                                displayFormats: { month: 'MMM \'yy' },
                                tooltipFormat: 'M/d/yyyy'
                            },
                            title: { display: true, text: 'Month' }
                        },
                        y: {
                            stacked: true,
                            beginAtZero: true,
                            title: { display: true, text: 'Blank Sailings' }
                        }
                    }
                },
                true
            );
            const blankSailingTableRows = tableDataBySection.BLANK_SAILING ? tableDataBySection.BLANK_SAILING.rows : [];
            renderTable('BLANK_SAILINGTableContainer', tableDataBySection.BLANK_SAILING.headers, blankSailingTableRows);


            colorIndex = 0;
            const FBXData = chartDataBySection.FBX || [];
            FBXData.sort((a, b) => new Date(a.date) - new Date(b.date));
            const FBXTableRows = tableDataBySection.FBX ? tableDataBySection.FBX.rows : [];
            const FBXDatasets = createDatasetsFromTableRows('FBX', FBXData, FBXTableRows);
            FBXChart = setupChart('FBXChart', 'line', FBXDatasets, {}, false);
            renderTable('FBXTableContainer', tableDataBySection.FBX.headers, FBXTableRows);


            colorIndex = 0;
            const XSIData = chartDataBySection.XSI || [];
            XSIData.sort((a, b) => new Date(a.date) - new Date(b.date));
            const XSITableRows = tableDataBySection.XSI ? tableDataBySection.XSI.rows : [];
            const XSIDatasets = createDatasetsFromTableRows('XSI', XSIData, XSITableRows);
            XSIChart = setupChart('XSIChart', 'line', XSIDatasets, {}, false);
            renderTable('XSITableContainer', tableDataBySection.XSI.headers, XSITableRows);


            // MBCI 차트 및 테이블 설정 추가
            colorIndex = 0;
            const MBCIData = chartDataBySection.MBCI || [];
            MBCIData.sort((a, b) => new Date(a.date) - new Date(b.date));
            const MBCITableRows = tableDataBySection.MBCI ? tableDataBySection.MBCI.rows : [];
            const MBCIDatasets = createDatasetsFromTableRows('MBCI', MBCIData, MBCITableRows);
            MBCIChart = setupChart('MBCIChart', 'line', MBCIDatasets, {}, false);
            renderTable('MBCITableContainer', tableDataBySection.MBCI.headers, MBCITableRows);
            // 이 위 부분은 죽어도 건드리지말고 토씨하나 빠뜨리면 안되고 그대로 사용해야함 이 주석또한 절대로 지우지 말라
        } catch (error) {
            console.error("Failed to load and display data:", error);
            // Fallback for elements if data loading fails
            document.querySelectorAll('[id^="temperature-"], [id^="status-"], [id^="humidity-"], [id^="wind-speed-"], [id^="pressure-"], [id^="visibility-"], [id^="sunrise-"], [id^="sunset-"], #current-exchange-rate-value').forEach(el => {
                if (el.tagName === 'IMG') {
                    el.src = 'https://placehold.co/80x80/cccccc/ffffff?text=Error';
                } else {
                    el.textContent = 'Failed to load';
                }
            });
            const forecastBody = document.getElementById('forecast-body');
            if (forecastBody) {
                forecastBody.innerHTML = '<tr><td colspan="4">Failed to load forecast data.</td></tr>';
            }
            const chartSliderContainer = document.querySelector('.chart-slider-container');
            if (chartSliderContainer) {
                chartSliderContainer.innerHTML = '<p class="placeholder-text">Failed to load chart data.</p>';
            }
            document.querySelectorAll('.data-table-container').forEach(container => {
                container.innerHTML = '<p class="text-gray-600 text-center">Failed to load table data.</p>';
            });
        }

        updateWorldClocks();
        setInterval(updateWorldClocks, 1000);
        setupSlider('.chart-slide', 5000);
        setupSlider('.data-table-slide', 5000);
        setupSlider('.top-info-slide', 5000); // 추가: 날씨/환율 슬라이더 작동을 위한 호출
    }

    loadAndDisplayData();
});
