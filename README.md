# Monitoring Frontend

Angular dashboard for monitoring blocked attacks and traffic analytics.

## Features
- Register and login
- CSV upload to ingest requests
- KPI cards:
  - Total Requests
  - Blocked Requests
  - High Risk
  - Block Rate
- Traffic Overview (24h/7d/30d)
- Attack Types pie chart
- Hourly Traffic (Last 24 Hours)
- Recent Activity (Last 5 Minutes)
- Top Blocked IP Addresses
- Alerts list (email sent/not sent)

## Installation
```bash
cd monitoringfrontend
npm install
```

## Run
```bash
cd monitoringfrontend
npm start
```

Frontend URL: `http://localhost:4200`  
Backend URL expected: `http://localhost:5050`
