import requests
import json

URL = "https://pybxtdvlffkcsrurazwo.supabase.co/rest/v1/trades?limit=1"
HEADERS = {
    "apikey": "sb_publishable_jPgStXlLa2a1H00kJSpWig_muTxr084",
    "Authorization": "Bearer sb_publishable_jPgStXlLa2a1H00kJSpWig_muTxr084"
}

res = requests.get(URL, headers=HEADERS)
print("Trades Table:", res.status_code, res.text)

URL2 = "https://pybxtdvlffkcsrurazwo.supabase.co/rest/v1/journal_entries?limit=1"
res2 = requests.get(URL2, headers=HEADERS)
print("Journal Entries Table:", res2.status_code, res2.text)
