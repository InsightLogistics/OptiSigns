// IIFE (Immediately Invoked Function Expression)를 사용하여 전역 스코프 오염 방지
// 이는 스크립트가 여러 번 로드되거나 실행될 때 변수 중복 선언 오류를 방지합니다.
(function() {
    // Chart 인스턴스를 저장할 변수들 (전역 스코프 내에서 관리)
    let KCCIChartInstance;
    let SCFIChartInstance;
    let WCIChartInstance;
    let IACIChartInstance;
    let blankSailingChartInstance;
    let FBXChartInstance;
    let XSIChartInstance;
    let MBCIChartInstance;
    let exchangeRateChartInstance; // 환율 차트는 항상 표시되므로 즉시 초기화

    const DATA_JSON_URL = 'data/crawling_data.json';
    let allDashboardData = {}; // 모든 대시보드 데이터를 저장할 변수

    document.addEventListener('DOMContentLoaded', async () => { // async 추가
        // Chart.js 라이브러리 로딩 확인 (선택 사항이지만 디버깅에 유용)
        // 이 부분은 이미 추가되어 있으나, 오류 메시지가 계속 나온다면 로딩 타이밍 문제일 수 있습니다.
        if (typeof Chart === 'undefined') {
            console.error("Chart.js library is not loaded. Please ensure script tags are correct.");
            return;
        }
        if (typeof Chart.adapters === 'undefined' || typeof Chart.adapters.date === 'undefined') {
            console.error("Chart.js Date Adapter is not loaded. Please ensure script tags are correct.");
            return;
        }

        const setupChart = (chartId, type, datasets, additionalOptions = {}) => {
            const ctx = document.getElementById(chartId);
            if (ctx) {
                // 기존 HTML 속성 및 인라인 스타일을 제거하여 충돌 방지
                // 이전에 HTML에 하드코딩된 width/height나 style 속성이 있다면 제거합니다.
                ctx.removeAttribute('width');
                ctx.removeAttribute('height');
                ctx.style.width = '';
                ctx.style.height = '';

                const parentContainer = ctx.parentElement; // 이 요소는 .chart-container 입니다.
                let parentWidth = 800; // 폴백 값
                let parentHeight = 450; // 폴백 값

                if (parentContainer) {
                    // 부모 컨테이너가 display:none이 아닌지 확인 후 크기 가져오기
                    // 이 부분이 중요합니다. 요소가 실제로 렌더링될 때 정확한 크기를 가져옵니다.
                    const computedStyle = window.getComputedStyle(parentContainer);
                    parentWidth = parseFloat(computedStyle.width) || parentContainer.offsetWidth || 800;
                    parentHeight = parseFloat(computedStyle.height) || parentContainer.offsetHeight || 450;

                    if (parentWidth === 0 || parentHeight === 0) {
                        console.warn(`Canvas parent dimensions are zero for ${chartId}. Computed: w=${computedStyle.width}, h=${computedStyle.height}. Offset: w=${parentContainer.offsetWidth}, h=${parentContainer.offsetHeight}. This might affect chart rendering.`);
                        // 만약 여전히 0이라면, 최소한의 크기를 보장하여 차트가 아예 안 그려지는 것을 방지
                        parentWidth = 800;
                        parentHeight = 450;
                    }
                } else {
                    console.warn(`Canvas parent not found for ${chartId}. Using fallback dimensions.`);
                }

                ctx.width = parentWidth;
                ctx.height = parentHeight;

                // 기존 차트 인스턴스가 있다면 파괴하여 메모리 누수 방지
                if (Chart.getChart(chartId)) {
                    Chart.getChart(chartId).destroy();
                    console.log(`Destroyed existing chart: ${chartId}`);
                }

                const defaultOptions = {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            display: true, // X축 라벨(날짜) 표시 유지
                            title: { display: false }, // X축 타이틀 제거
                            type: 'time',
                            time: {
                                unit: 'month', // 가로축 단위를 월별로 고정
                                displayFormats: { month: 'MM/01/yy' }, // 월별 형식 변경
                                tooltipFormat: 'M/d/yyyy'
                            },
                            ticks: { source: 'auto', autoSkipPadding: 10, maxTicksLimit: 12 }, // 지난 1년 기준 월별 12개 눈금 배치
                            grid: { display: false } // 가로축 보조선은 유지
                        },
                        y: {
                            beginAtZero: true,
                            title: { display: false }, // Y축 타이틀 제거
                            ticks: { count: 5 }, // 세로 기준 5개 유지
                            grid: { display: true, color: 'rgba(0, 0, 0, 0.1)' } // 세로축 보조선 표시
                        }
                    },
                    plugins: {
                        legend: {
                            display: true,
                            position: 'right',
                            labels: {
                                boxWidth: 20,
                                boxHeight: 10,
                                usePointStyle: false,
                                boxStrokeStyle: 'transparent',
                                boxLineWidth: 0,
                            }
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false
                        }
                    },
                    elements: {
                        point: { radius: 0 }
                    }
                };

                const options = { ...defaultOptions, ...additionalOptions };
                if (additionalOptions.scales) {
                    options.scales = { ...defaultOptions.scales, ...additionalOptions.scales };
                    if (additionalOptions.scales.x) {
                        options.scales.x = { ...defaultOptions.scales.x, ...additionalOptions.scales.x };
                    }
                    if (additionalOptions.scales.y) {
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

                const newChartInstance = new Chart(ctx, {
                    type: type,
                    data: chartData,
                    options: options
                });
                console.log(`Chart ${chartId} initialized successfully.`);
                return newChartInstance;
            }
            console.warn(`Canvas element with ID ${chartId} not found.`);
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
            '#00657e', '#003A52', '#218838', '#e68a00', '#5a32b2', '#c82333',
            '#138496', '#6c757d', '#ffc107', '#343a40', '#c86400', '#00c8c8',
            '#963264', '#329632', '#fa6496', '#6464c8'
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

            allMonthKeys.forEach(yearMonth => {
                const monthEntry = monthlyDataMap.get(yearMonth);
                const newEntry = { date: yearMonth + '-01' };

                const allDataKeys = new Set();
                if (data.length > 0) {
                    Object.keys(data[0]).forEach(key => {
                        if (key !== 'date') allDataKeys.add(key);
                    });
                }

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

        // 슬라이더 설정 함수 (차트 초기화 콜백 추가)
        const setupSlider = (slidesSelector, intervalTime, chartSetupCallback = null) => {
            const slides = document.querySelectorAll(slidesSelector);
            let currentSlide = 0;

            const showSlide = (index) => {
                slides.forEach((slide, i) => {
                    if (i === index) {
                        slide.classList.add('active');
                        // 슬라이드가 활성화될 때만 차트 초기화 콜백 호출
                        if (chartSetupCallback && slide.id.startsWith('chart-slide-')) {
                            const chartCanvas = slide.querySelector('.chart-container canvas');
                            const tableContainer = slide.querySelector('.table-section');
                            if (chartCanvas && tableContainer) {
                                chartSetupCallback(chartCanvas.id, tableContainer.id);
                            }
                        }
                    } else {
                        // 슬라이드가 비활성화될 때 해당 차트 파괴 (메모리 관리)
                        if (slide.id.startsWith('chart-slide-')) {
                            const chartCanvas = slide.querySelector('.chart-container canvas');
                            if (chartCanvas && Chart.getChart(chartCanvas.id)) {
                                Chart.getChart(chartCanvas.id).destroy();
                                console.log(`Destroyed chart on inactive slide: ${chartCanvas.id}`);
                            }
                        }
                        slide.classList.remove('active');
                    }
                });
            };

            const nextSlide = () => {
                console.log(`Slider: Moving to next slide for selector: ${slidesSelector}`);
                currentSlide = (currentSlide + 1) % slides.length;
                showSlide(currentSlide);
            };

            if (slides.length > 0) {
                console.log(`Slider: Found ${slides.length} slides for selector: ${slidesSelector}`);
                showSlide(currentSlide); // 첫 번째 슬라이드와 해당 차트/테이블을 즉시 표시
                if (slides.length > 1) {
                    if (slides[0].dataset.intervalId) {
                        clearInterval(parseInt(slides[0].dataset.intervalId));
                        console.log(`Slider: Cleared existing interval for selector: ${slidesSelector}`);
                    }
                    const intervalId = setInterval(nextSlide, intervalTime);
                    slides[0].dataset.intervalId = intervalId.toString();
                    console.log(`Slider: Started new interval (${intervalId}) for selector: ${slidesSelector} with ${intervalTime}ms`);
                } else {
                    console.log(`Slider: Only one slide found for selector: ${slidesSelector}, no auto-slide.`);
                }
            } else {
                console.warn(`Slider: No slides found for selector: ${slidesSelector}`);
            }
        };

        const cityTimezones = {
            'la': 'America/Los_Angeles', 'ny': 'America/New_York', 'paris': 'Europe/Paris',
            'shanghai': 'Asia/Shanghai', 'seoul': 'Asia/Seoul', 'sydney': 'Australia/Sydney'
        };

        function updateWorldClocks() {
            const now = new Date();
            for (const cityKey in cityTimezones) {
                const timezone = cityTimezones[cityKey];
                const options = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: timezone };
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
                "종합지수": "KCCI_Composite_Index", "미주서안": "KCCI_US_West_Coast", "미주동안": "KCCI_US_East_Coast",
                "유럽": "KCCI_Europe", "지중해": "KCCI_Mediterranean", "중동": "KCCI_Middle_East",
                "호주": "KCCI_Australia", "남미동안": "KCCI_South_America_East_Coast", "남미서안": "KCCI_South_America_West_Coast",
                "남아프리카": "KCCI_South_Africa", "서아프리카": "KCCI_West_Africa", "중국": "KCCI_China",
                "일본": "KCCI_Japan", "동남아시아": "KCCI_Southeast_Asia"
            },
            SCFI: {
                "종합지수": "SCFI_Composite_Index", "미주서안": "SCFI_US_West_Coast", "미주동안": "SCFI_US_East_Coast",
                "북유럽": "SCFI_North_Europe", "지중해": "SCFI_Mediterranean", "동남아시아": "SCFI_Southeast_Asia",
                "중동": "SCFI_Middle_East", "호주/뉴질랜드": "SCFI_Australia_New_Zealand", "남아메리카": "SCFI_South_America",
                "일본서안": "SCFI_Japan_West_Coast", "일본동안": "SCFI_Japan_East_Coast", "한국": "SCFI_Korea",
                "동부/서부 아프리카": "SCFI_East_West_Africa", "남아공": "SCFI_South_Africa"
            },
            WCI: {
                "종합지수": "WCI_Composite_Index", "상하이 → 로테르담": "WCI_Shanghai_Rotterdam", "로테르담 → 상하이": "WCI_Rotterdam_Shanghai",
                "상하이 → 제노바": "WCI_Shanghai_Genoa", "상하이 → 로스엔젤레스": "WCI_Shanghai_to_Los_Angeles",
                "로스엔젤레스 → 상하이": "WCI_Los_Angeles_to_Shanghai", "상하이 → 뉴욕": "WCI_Shanghai_New_York",
                "뉴욕 → 로테르담": "WCI_New_York_Rotterdam", "로테르담 → 뉴욕": "WCI_Rotterdam_New_York",
            },
            IACI: { "종합지수": "IACI_Composite_Index" },
            BLANK_SAILING: {
                "Gemini Cooperation": "BLANK_SAILING_Gemini_Cooperation", "MSC": "BLANK_SAILING_MSC",
                "OCEAN Alliance": "BLANK_SAILING_OCEAN_Alliance", "Premier Alliance": "BLANK_SAILING_Premier_Alliance",
                "Others/Independent": "BLANK_SAILING_Others_Independent", "Total": "BLANK_SAILING_Total"
            },
            FBX: {
                "종합지수": "FBX_Composite_Index", "중국/동아시아 → 미주서안": "FBX_China_EA_US_West_Coast", "미주서안 → 중국/동아시아": "FBX_US_West_Coast_China_EA",
                "중국/동아시아 → 미주동안": "FBX_China_EA_US_East_Coast", "미주동안 → 중국/동아시아": "FBX_US_East_Coast_China_EA",
                "중국/동아시아 → 북유럽": "FBX_China_EA_North_Europe", "북유럽 → 중국/동아시아": "FBX_North_Europe_China_EA",
                "중국/동아시아 → 지중해": "FBX_China_EA_Mediterranean", "지중해 → 중국/동아시아": "FBX_Mediterranean_China_EA",
                "미주동안 → 북유럽": "FBX_US_East_Coast_North_Europe", "북유럽 → 미주동안": "FBX_North_Europe_US_East_Coast",
                "유럽 → 남미동안": "FBX_Europe_South_America_East_Coast", "유럽 → 남미서안": "FBX_Europe_South_America_West_Coast"
            },
            XSI: {
                "동아시아 → 북유럽": "XSI_East_Asia_North_Europe", "북유럽 → 동아시아": "XSI_North_Europe_East_Asia",
                "동아시아 → 미주서안": "XSI_East_Asia_US_West_Coast", "미주서안 → 동아시아": "XSI_US_West_Coast_East_Asia",
                "동아시아 → 남미동안": "XSI_East_Asia_South_America_East_Coast", "북유럽 → 미주동안": "XSI_North_Europe_US_East_Coast",
                "미주동안 → 북유럽": "XSI_US_East_Coast_North_Europe", "북유럽 → 남미동안": "XSI_North_Europe_South_America_East_Coast"
            },
            MBCI: { "MBCI": "MBCI_Value" }
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
                
                console.log(`[${indexType}] Processing route: '${originalRouteName}', mapped dataKey: '${dataKey}'`);

                if (dataKey !== null && dataKey !== undefined && row.current_index !== "") { 
                    const mappedData = chartData.map(item => {
                        const xVal = item.date;
                        const yVal = item[dataKey];
                        return { x: xVal, y: yVal };
                    });

                    const filteredMappedData = mappedData.filter(point => point.y !== null && point.y !== undefined);

                    console.log(`[${indexType}] Route: '${originalRouteName}', dataKey: '${dataKey}', filteredMappedData length: ${filteredMappedData.length}`);
                    if (filteredMappedData.length > 0) {
                        console.log(`[${indexType}] Route: '${originalRouteName}', Sample filteredMappedData (first 5):`, filteredMappedData.slice(0, 5));
                    }

                    if (filteredMappedData.length > 0) {
                        datasets.push({
                            label: originalRouteName,
                            data: filteredMappedData,
                            backgroundColor: getNextColor(),
                            borderColor: 'transparent',
                            borderWidth: 0,
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
            console.log(`[${indexType}] Final datasets before Chart setup:`, datasets);
            return datasets;
        };

        // 각 지수별 최신/이전 날짜를 가져오는 헬퍼 함수
        const getLatestAndPreviousDates = (chartData) => {
            if (!chartData || chartData.length < 2) return { latestDate: null, previousDate: null };
            const sortedData = [...chartData].sort((a, b) => new Date(b.date) - new Date(a.date));
            const latestDate = sortedData[0] ? new Date(sortedData[0].date) : null;
            const previousDate = sortedData[1] ? new Date(sortedData[1].date) : null;
            return { latestDate, previousDate };
        };

        // 날씨 아이콘 매핑
        const weatherIconMapping = {
            'clear': '01d', '맑음': '01d', 'clouds': '02d', '구름': '02d', 'partly cloudy': '02d',
            'scattered clouds': '03d', 'broken clouds': '04d', 'shower rain': '09d', 'rain': '10d', '비': '10d',
            'thunderstorm': '11d', 'snow': '13d', '눈': '13d', 'mist': '50d', 'fog': '50d',
            'haze': '50d', 'drizzle': '09d'
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

        // 특정 슬라이드의 차트와 테이블을 초기화하는 함수
        const initializeChartAndTableForSlide = (chartId, tableId) => {
            let indexType;
            // chartId를 기반으로 indexType 결정
            if (chartId === 'KCCIChart') indexType = 'KCCI';
            else if (chartId === 'SCFIChart') indexType = 'SCFI';
            else if (chartId === 'WCIChart') indexType = 'WCI';
            else if (chartId === 'IACIChart') indexType = 'IACI';
            else if (chartId === 'blankSailingChart') indexType = 'BLANK_SAILING';
            else if (chartId === 'FBXChart') indexType = 'FBX';
            else if (chartId === 'XSIChart') indexType = 'XSI';
            else if (chartId === 'MBCIChart') indexType = 'MBCI';
            else {
                console.warn(`Unknown chartId: ${chartId}. Cannot initialize chart and table.`);
                return;
            }

            const chartData = allDashboardData.chart_data[indexType] || [];
            const tableData = allDashboardData.table_data[indexType] || {};
            const tableRows = tableData.rows || [];
            const tableHeaders = tableData.headers || [];

            const { latestDate, previousDate } = getLatestAndPreviousDates(chartData);

            let datasets;
            if (indexType === 'BLANK_SAILING') {
                const { aggregatedData } = aggregateDataByMonth(chartData, 12);
                datasets = [
                    { label: "Gemini Cooperation", data: aggregatedData.map(item => ({ x: item.date, y: item.BLANK_SAILING_Gemini_Cooperation })), backgroundColor: getNextColor(), borderColor: 'transparent', borderWidth: 0 },
                    { label: "MSC", data: aggregatedData.map(item => ({ x: item.date, y: item.BLANK_SAILING_MSC })), backgroundColor: getNextColor(), borderColor: 'transparent', borderWidth: 0 },
                    { label: "OCEAN Alliance", data: aggregatedData.map(item => ({ x: item.date, y: item.BLANK_SAILING_OCEAN_Alliance })), backgroundColor: getNextColor(), borderColor: 'transparent', borderWidth: 0 },
                    { label: "Premier Alliance", data: aggregatedData.map(item => ({ x: item.date, y: item.BLANK_SAILING_Premier_Alliance })), backgroundColor: getNextColor(), borderColor: 'transparent', borderWidth: 0 },
                    { label: "Others/Independent", data: aggregatedData.map(item => ({ x: item.date, y: item.BLANK_SAILING_Others_Independent })), backgroundColor: getNextColor(), borderColor: 'transparent', borderWidth: 0 },
                    { label: "Total", data: aggregatedData.map(item => ({ x: item.date, y: item.BLANK_SAILING_Total })), backgroundColor: getNextColor(), borderColor: 'transparent', borderWidth: 0 }
                ].filter(dataset => dataset.data.some(point => point.y !== null && point.y !== undefined));
                blankSailingChartInstance = setupChart(chartId, 'bar', datasets, {
                    scales: {
                        x: { stacked: true, type: 'time', time: { unit: 'month', displayFormats: { month: 'MM/01/yy' }, tooltipFormat: 'M/d/yyyy' }, title: { display: false } },
                        y: { stacked: true, beginAtZero: true, title: { display: false } }
                    }
                });
            } else {
                datasets = createDatasetsFromTableRows(indexType, chartData, tableRows);
                // 각 차트 인스턴스를 해당 변수에 할당
                if (chartId === 'KCCIChart') KCCIChartInstance = setupChart(chartId, 'line', datasets);
                else if (chartId === 'SCFIChart') SCFIChartInstance = setupChart(chartId, 'line', datasets);
                else if (chartId === 'WCIChart') WCIChartInstance = setupChart(chartId, 'line', datasets);
                else if (chartId === 'IACIChart') IACIChartInstance = setupChart(chartId, 'line', datasets);
                else if (chartId === 'FBXChart') FBXChartInstance = setupChart(chartId, 'line', datasets);
                else if (chartId === 'XSIChart') XSIChartInstance = setupChart(chartId, 'line', datasets);
                else if (chartId === 'MBCIChart') MBCIChartInstance = setupChart(chartId, 'line', datasets);
            }

            renderTable(tableId, tableHeaders, tableRows, {
                currentIndexDate: formatDateForTable(latestDate),
                previousIndexDate: formatDateForTable(previousDate)
            });
        };


        // 데이터 로드 및 초기 설정
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

            // 날씨 정보 업데이트
            const currentWeatherData = weatherData.current || {};
            const forecastWeatherData = weatherData.forecast || [];
            document.getElementById('temperature-current').textContent = currentWeatherData.LA_Temperature ? `${currentWeatherData.LA_Temperature}°F` : '--°F';
            document.getElementById('status-current').textContent = currentWeatherData.LA_WeatherStatus || 'Loading...';
            document.getElementById('weather-icon-current').src = weatherIconUrl(currentWeatherData.LA_WeatherStatus);
            document.getElementById('humidity-current').textContent = currentWeatherData.LA_Humidity ? `${currentWeatherData.LA_Humidity}%` : '--%';
            document.getElementById('wind-speed-current').textContent = currentWeatherData.LA_WindSpeed ? `${currentWeatherData.LA_WindSpeed} mph` : '-- mph';
            document.getElementById('pressure-current').textContent = currentWeatherData.LA_Pressure ? `${currentWeatherData.LA_Pressure} hPa` : '-- hPa';
            document.getElementById('visibility-current').textContent = currentWeatherData.LA_Visibility ? `${currentWeatherData.LA_Visibility} mile` : '-- mile';
            document.getElementById('sunrise-time').textContent = currentWeatherData.LA_Sunrise || '--';
            document.getElementById('sunset-time').textContent = currentWeatherData.LA_Sunset || '--';

            const forecastBody = document.getElementById('forecast-body');
            if (forecastBody) {
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

            // 환율 정보 업데이트 및 차트 초기화 (환율 차트는 항상 표시)
            const currentExchangeRate = exchangeRatesData.length > 0 ? exchangeRatesData[exchangeRatesData.length - 1].rate : null;
            document.getElementById('current-exchange-rate-value').textContent = currentExchangeRate ? `${currentExchangeRate.toFixed(2)} KRW` : 'Loading...';

            const exchangeRateDatasets = [{
                label: 'USD/KRW Exchange Rate',
                data: exchangeRatesData.map(item => ({ x: item.date, y: item.rate })),
                backgroundColor: 'rgba(253, 126, 20, 0.5)',
                borderColor: 'transparent', borderWidth: 0, fill: false, pointRadius: 0
            }];
            console.log("Exchange Rate Chart Datasets (before setup):", exchangeRateDatasets);
            console.log("Exchange Rate Chart Data Sample (first 5 points):", exchangeRateDatasets[0].data.slice(0, 5));

            exchangeRateChartInstance = setupChart(
                'exchangeRateChartCanvas', 'line',
                exchangeRateDatasets,
                {
                    scales: {
                        x: {
                            type: 'time', unit: 'day', displayFormats: { day: 'MM/dd' }, tooltipFormat: 'M/d/yyyy'
                        },
                        y: { beginAtZero: false, ticks: { count: 5 }, grid: { display: true, color: 'rgba(0, 0, 0, 0.1)' }, title: { display: false } }
                    },
                    plugins: { legend: { display: false } }
                }
            );

            // 슬라이더 초기화 (차트 초기화 콜백 함수 전달)
            setupSlider('.chart-slider-container > .chart-slide', 10000, initializeChartAndTableForSlide);
            setupSlider('.top-info-slider-container > .top-info-slide', 10000);

            // 세계 시간 업데이트 시작
            updateWorldClocks();
            setInterval(updateWorldClocks, 1000); // 1초마다 업데이트
            
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            const chartSliderContainer = document.querySelector('.chart-slider-container');
            if (chartSliderContainer) {
                chartSliderContainer.innerHTML = '<p class="placeholder-text text-red-500">Error loading data. Please try again later.</p>';
            }
        }
    });
})(); // IIFE
