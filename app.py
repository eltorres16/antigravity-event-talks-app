import os
import requests
import xml.etree.ElementTree as ET
from flask import Flask, render_template, jsonify
from bs4 import BeautifulSoup

app = Flask(__name__)

# Route to serve the main frontend dashboard
@app.route('/')
def index():
    return render_template('index.html')

# API endpoint to fetch and parse the BigQuery release notes
@app.route('/api/releases')
def get_releases():
    url = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"
    try:
        response = requests.get(url, timeout=10)
        if response.status_code != 200:
            return jsonify({"error": f"Failed to fetch feed from Google Cloud. Status: {response.status_code}"}), 502
    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"Network error fetching feed: {str(e)}"}), 502

    try:
        # Parse XML
        root = ET.fromstring(response.content)
        # Atom feed namespace
        ns = {'atom': 'http://www.w3.org/2005/Atom'}
        
        parsed_entries = []
        entries = root.findall('atom:entry', ns)
        
        for entry in entries:
            # Extract basic entry metadata
            title = entry.find('atom:title', ns)
            date_str = title.text if title is not None else "Unknown Date"
            
            id_elem = entry.find('atom:id', ns)
            entry_id = id_elem.text if id_elem is not None else "no-id"
            
            updated_elem = entry.find('atom:updated', ns)
            updated_str = updated_elem.text if updated_elem is not None else ""
            
            link_elem = entry.find('atom:link', ns)
            link_url = link_elem.attrib.get('href') if link_elem is not None else "https://cloud.google.com/bigquery/docs/release-notes"
            
            content_elem = entry.find('atom:content', ns)
            content_html = content_elem.text if content_elem is not None else ""
            
            # Parse HTML content into individual update chunks grouped by <h3> tags
            updates = []
            if content_html:
                soup = BeautifulSoup(content_html, 'html.parser')
                current_update = None
                
                for child in soup.children:
                    # Skip whitespace-only strings
                    if isinstance(child, str) and not child.strip():
                        continue
                    
                    if child.name == 'h3':
                        # If we have an existing update, save it
                        if current_update:
                            # Clean up and finalize the HTML / text content
                            current_update['description_html'] = current_update['description_html'].strip()
                            current_update['description_text'] = current_update['description_text'].strip()
                            updates.append(current_update)
                        
                        # Start new update chunk
                        current_update = {
                            'category': child.get_text().strip(),
                            'description_html': '',
                            'description_text': ''
                        }
                    else:
                        # If content appears before any <h3>, initialize a default "General" category
                        if current_update is None:
                            current_update = {
                                'category': 'General',
                                'description_html': '',
                                'description_text': ''
                            }
                        
                        current_update['description_html'] += str(child)
                        current_update['description_text'] += child.get_text().strip() + '\n'
                
                # Append the last update
                if current_update:
                    current_update['description_html'] = current_update['description_html'].strip()
                    current_update['description_text'] = current_update['description_text'].strip()
                    updates.append(current_update)
            
            parsed_entries.append({
                "id": entry_id,
                "date": date_str,
                "updated": updated_str,
                "link": link_url,
                "updates": updates
            })
            
        return jsonify(parsed_entries)
        
    except ET.ParseError as e:
        return jsonify({"error": f"Failed to parse XML feed: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500

if __name__ == '__main__':
    # Get port from environment or default to 5000
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
