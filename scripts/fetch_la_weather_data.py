import gspread
import json
import os
from datetime import datetime
import traceback

# WEATHER_WORKSHEET_NAME을 전역으로 정의
WEATHER_WORKSHEET_NAME = "LA날씨"

def get_weather_icon_code(status):
    """날씨 상태 문자열을 OpenWeatherMap 아이콘 코드로 변환"""
    if not status:
        return "01d"
    
    status = status.lower()
    if "clear" in status:
        return "01d"
    elif "cloud" in status:
        return "03d"
    elif "overcast" in status:
        return "04d"
    elif "rain" in status:
        return "10d"
    elif "thunder" in status:
        return "11d"
    else:
        return "01d"

def fetch_la_weather_data(spreadsheet: gspread.Spreadsheet):
    print(f"DEBUG: fetch_la_weather_data.py - WEATHER_WORKSHEET_NAME: {WEATHER_WORKSHEET_NAME} (inside function)")
    try:
        weather_worksheet = spreadsheet.worksheet(WEATHER_WORKSHEET_NAME)
        weather_data_raw = weather_worksheet.get_all_values()

        current_weather = {}
        forecast_weather = []

        # 현재 날씨 데이터 처리
        if len(weather_data_raw) > 2:
            current_weather_values_row_idx = 2
            current_weather_values = weather_data_raw[current_weather_values_row_idx]
            
            # 날씨 상태 (B1 셀)
            weather_status = weather_data_raw[0][1].strip() if len(weather_data_raw) > 0 and len(weather_data_raw[0]) > 1 else ""
            
            current_weather = {
                "LA_Temperature": current_weather_values[1].strip() if len(current_weather_values) > 1 else None,
                "LA_WeatherStatus": weather_status,
                "LA_WeatherIcon": get_weather_icon_code(weather_status),  # 아이콘 코드 추가
                "LA_Humidity": weather_data_raw[3][1].strip() if len(weather_data_raw) > 3 and len(weather_data_raw[3]) > 1 else None,
                "LA_WindSpeed": weather_data_raw[4][1].strip() if len(weather_data_raw) > 4 and len(weather_data_raw[4]) > 1 else None,
                "LA_Pressure": weather_data_raw[5][1].strip() if len(weather_data_raw) > 5 and len(weather_data_raw[5]) > 1 else None,
                "LA_Visibility": weather_data_raw[6][1].strip() if len(weather_data_raw) > 6 and len(weather_data_raw[6]) > 1 else None,
                "LA_Sunrise": weather_data_raw[7][1].strip() if len(weather_data_raw) > 7 and len(weather_data_raw[7]) > 1 else None,
                "LA_Sunset": weather_data_raw[8][1].strip() if len(weather_data_raw) > 8 and len(weather_data_raw[8]) > 1 else None,
            }

        # 예보 데이터 처리
        if len(weather_data_raw) > 11:
            for row_idx in range(11, len(weather_data_raw)):
                row_values = weather_data_raw[row_idx]
                if len(row_values) >= 4:
                    status = row_values[3].strip()
                    forecast_day = {
                        "date": row_values[0].strip(),
                        "min_temp": row_values[1].strip(),
                        "max_temp": row_values[2].strip(),
                        "status": status,
                        "icon": get_weather_icon_code(status)  # 예보에도 아이콘 코드 추가
                    }
                    forecast_weather.append(forecast_day)
        
        print(f"DEBUG: Current Weather Data: {current_weather}")
        print(f"DEBUG: Forecast Weather Data (first 3): {forecast_weather[:3]}")
        return {
            "current": current_weather,
            "forecast": forecast_weather
        }

    except Exception as e:
        print(f"날씨 데이터를 가져오는 중 오류 발생: {e}")
        traceback.print_exc()
        return {"current": {}, "forecast": []}

if __name__ == "__main__":
    pass
