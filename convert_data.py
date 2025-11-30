import csv
import json
from datetime import datetime, timedelta

def convert_csv_to_json(csv_file_path, json_file_path):
    data = []
    start_date = datetime(2021, 10, 21)
    
    with open(csv_file_path, 'r', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        
        for i, row in enumerate(reader):
            text = row.get('Answer', '')
            
            # Identify emotion columns (starting with Answer.f1.) and check if they are TRUE
            emotions = []
            for key, value in row.items():
                if key.startswith('Answer.f1.') and value.upper() == 'TRUE':
                    # Extract emotion name from key (e.g., Answer.f1.afraid.raw -> afraid)
                    parts = key.split('.')
                    if len(parts) >= 3:
                        emotion = parts[2]
                        emotions.append(emotion)
            
            # Append emotions to text if any exist
            if emotions:
                text += f"\n\nEmotions: {', '.join(emotions)}"
            
            # Generate date
            current_date = start_date + timedelta(days=i)
            date_str = current_date.strftime('%Y-%m-%d')
            
            entry = {
                "date": date_str,
                "text": text
            }
            data.append(entry)
            
    with open(json_file_path, 'w', encoding='utf-8') as jsonfile:
        json.dump(data, jsonfile, indent=4)

    print(f"Successfully converted {len(data)} rows to {json_file_path}")

if __name__ == "__main__":
    convert_csv_to_json('data.csv', 'data.json')
