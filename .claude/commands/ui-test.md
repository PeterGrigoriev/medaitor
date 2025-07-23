# UI Test Command

## Description
Opens the Mediator application in a browser and performs basic UI functionality tests.

## Usage
```
/ui-test
```

## What it does
1. Checks if the application is running on localhost:8000
2. Opens the browser using Puppeteer MCP
3. Navigates to the Mediator homepage
4. Tests basic UI functionality:
   - Page loads correctly
   - Navigation elements are present
   - Room creation form is visible
   - API endpoints respond correctly
5. Takes screenshots of key pages
6. Reports test results

## Prerequisites
- Application must be running (use `./run-app-docker.sh` or `./run-app.sh`)
- Puppeteer MCP server must be available

## Test Coverage
- ✅ Homepage loads
- ✅ Navigation menu works
- ✅ Room creation form
- ✅ API health check
- ✅ Version endpoint
- ✅ WebSocket connection capability
- ✅ Responsive design check

## Output
- Test results summary
- Screenshots of tested pages
- Performance metrics
- Any errors or issues found