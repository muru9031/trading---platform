import requests
import json

# Replace with the actual URL and anon key from .env
URL = "https://pybxtdvlffkcsrurazwo.supabase.co/rest/v1/journal_entries?asset=eq.UNKNOWN"
HEADERS = {
    "apikey": "sb_publishable_jPgStXlLa2a1H00kJSpWig_muTxr084",
    "Authorization": "Bearer sb_publishable_jPgStXlLa2a1H00kJSpWig_muTxr084",
    "Prefer": "return=representation"
}

print("Attempting to delete all UNKNOWN trades...")
res = requests.delete(URL, headers=HEADERS)
print("Response code:", res.status_code)
if res.status_code == 200 or res.status_code == 204:
    print("Successfully deleted corrupted trades.")
else:
    print("Error:", res.text)
