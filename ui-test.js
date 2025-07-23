const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class MediatorUITest {
    constructor() {
        this.browser = null;
        this.page = null;
        this.testResults = {
            tests: [],
            screenshots: [],
            errors: [],
            performance: {},
            overallStatus: 'PENDING'
        };
        this.baseUrl = 'http://localhost:8000';
        this.screenshotDir = './test-screenshots';
    }

    async initialize() {
        console.log('🚀 Initializing Puppeteer browser...');
        
        // Create screenshots directory if it doesn't exist
        if (!fs.existsSync(this.screenshotDir)) {
            fs.mkdirSync(this.screenshotDir, { recursive: true });
        }

        // Launch browser
        this.browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });
        
        this.page = await this.browser.newPage();
        
        // Set viewport for consistent screenshots
        await this.page.setViewport({ width: 1280, height: 800 });
        
        console.log('✅ Browser initialized successfully');
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
            console.log('🧹 Browser closed');
        }
    }

    async takeScreenshot(name, description) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `${timestamp}-${name}.png`;
        const filepath = path.join(this.screenshotDir, filename);
        
        await this.page.screenshot({ 
            path: filepath,
            fullPage: true 
        });
        
        this.testResults.screenshots.push({
            name,
            description,
            filename,
            filepath,
            timestamp
        });
        
        console.log(`📸 Screenshot taken: ${filename}`);
        return filepath;
    }

    async addTestResult(testName, status, details, error = null) {
        const result = {
            name: testName,
            status,
            details,
            timestamp: new Date().toISOString(),
            error: error ? error.message : null
        };
        
        this.testResults.tests.push(result);
        
        const statusIcon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
        console.log(`${statusIcon} ${testName}: ${status}`);
        if (details) console.log(`   ${details}`);
        if (error) {
            console.log(`   Error: ${error.message}`);
            this.testResults.errors.push({
                test: testName,
                error: error.message,
                stack: error.stack
            });
        }
    }

    async testHomepageNavigation() {
        try {
            console.log('\n🧪 Testing homepage navigation...');
            
            const startTime = Date.now();
            const response = await this.page.goto(this.baseUrl, { 
                waitUntil: 'networkidle2' 
            });
            const loadTime = Date.now() - startTime;
            
            this.testResults.performance.homepageLoadTime = loadTime;
            
            if (!response.ok()) {
                throw new Error(`HTTP ${response.status()}: ${response.statusText()}`);
            }
            
            await this.addTestResult(
                'Homepage Navigation',
                'PASS',
                `Page loaded successfully in ${loadTime}ms with status ${response.status()}`
            );
            
            // Take screenshot of homepage
            await this.takeScreenshot('homepage', 'Main homepage view');
            
            return true;
        } catch (error) {
            await this.addTestResult('Homepage Navigation', 'FAIL', null, error);
            return false;
        }
    }

    async testPageTitle() {
        try {
            console.log('\n🧪 Testing page title...');
            
            const title = await this.page.title();
            const containsMediator = title.toLowerCase().includes('mediator');
            
            if (containsMediator) {
                await this.addTestResult(
                    'Page Title Check',
                    'PASS',
                    `Title contains 'Mediator': "${title}"`
                );
                return true;
            } else {
                await this.addTestResult(
                    'Page Title Check',
                    'FAIL',
                    `Title does not contain 'Mediator': "${title}"`
                );
                return false;
            }
        } catch (error) {
            await this.addTestResult('Page Title Check', 'FAIL', null, error);
            return false;
        }
    }

    async testNavigationElements() {
        try {
            console.log('\n🧪 Testing navigation elements...');
            
            // Check for navigation bar
            const nav = await this.page.$('nav');
            if (!nav) {
                throw new Error('Navigation bar not found');
            }
            
            // Check for app name in nav
            const appName = await this.page.$eval('nav h1', el => el.textContent);
            
            // Check for navigation links
            const homeLink = await this.page.$('a[href="/"]');
            const rulesLink = await this.page.$('a[href="/api/rules"]');
            
            const navElements = {
                navbar: !!nav,
                appName: appName,
                homeLink: !!homeLink,
                rulesLink: !!rulesLink
            };
            
            await this.addTestResult(
                'Navigation Elements',
                'PASS',
                `Navigation elements found: ${JSON.stringify(navElements)}`
            );
            
            return true;
        } catch (error) {
            await this.addTestResult('Navigation Elements', 'FAIL', null, error);
            return false;
        }
    }

    async testRoomCreationForm() {
        try {
            console.log('\n🧪 Testing room creation form...');
            
            // Check for room creation form
            const roomForm = await this.page.$('form');
            if (!roomForm) {
                throw new Error('Room creation form not found');
            }
            
            // Check for room name input
            const roomNameInput = await this.page.$('#roomName');
            if (!roomNameInput) {
                throw new Error('Room name input not found');
            }
            
            // Check for create button
            const createButton = await this.page.$('button[type="submit"]');
            if (!createButton) {
                throw new Error('Create room button not found');
            }
            
            // Check for quick join section
            const quickJoinInput = await this.page.$('#roomId');
            const joinButton = await this.page.$eval('button[onclick="joinRoom()"]', el => el.textContent);
            
            const formElements = {
                form: !!roomForm,
                roomNameInput: !!roomNameInput,
                createButton: !!createButton,
                quickJoinInput: !!quickJoinInput,
                joinButton: joinButton
            };
            
            await this.addTestResult(
                'Room Creation Form',
                'PASS',
                `Form elements found: ${JSON.stringify(formElements)}`
            );
            
            // Take screenshot of form area
            await this.takeScreenshot('room-form', 'Room creation form interface');
            
            return true;
        } catch (error) {
            await this.addTestResult('Room Creation Form', 'FAIL', null, error);
            return false;
        }
    }

    async testHealthEndpoint() {
        try {
            console.log('\n🧪 Testing /health API endpoint...');
            
            const healthUrl = `${this.baseUrl}/health`;
            const response = await this.page.goto(healthUrl, { waitUntil: 'networkidle2' });
            
            if (!response.ok()) {
                throw new Error(`HTTP ${response.status()}: ${response.statusText()}`);
            }
            
            const content = await this.page.content();
            const jsonMatch = content.match(/<pre[^>]*>(.*?)<\/pre>/s);
            
            let healthData;
            if (jsonMatch) {
                healthData = JSON.parse(jsonMatch[1]);
            } else {
                // Try to get JSON directly from page
                const jsonText = await this.page.evaluate(() => document.body.textContent);
                healthData = JSON.parse(jsonText);
            }
            
            const isHealthy = healthData.status === 'healthy';
            
            await this.addTestResult(
                'Health Endpoint',
                isHealthy ? 'PASS' : 'FAIL',
                `Health check returned: ${JSON.stringify(healthData)}`
            );
            
            // Take screenshot of health endpoint
            await this.takeScreenshot('health-endpoint', 'Health endpoint response');
            
            return isHealthy;
        } catch (error) {
            await this.addTestResult('Health Endpoint', 'FAIL', null, error);
            return false;
        }
    }

    async testVersionEndpoint() {
        try {
            console.log('\n🧪 Testing /api/version endpoint...');
            
            const versionUrl = `${this.baseUrl}/api/version`;
            const response = await this.page.goto(versionUrl, { waitUntil: 'networkidle2' });
            
            if (!response.ok()) {
                throw new Error(`HTTP ${response.status()}: ${response.statusText()}`);
            }
            
            const content = await this.page.content();
            const jsonMatch = content.match(/<pre[^>]*>(.*?)<\/pre>/s);
            
            let versionData;
            if (jsonMatch) {
                versionData = JSON.parse(jsonMatch[1]);
            } else {
                // Try to get JSON directly from page
                const jsonText = await this.page.evaluate(() => document.body.textContent);
                versionData = JSON.parse(jsonText);
            }
            
            const hasRequiredFields = versionData.app && versionData.description;
            
            await this.addTestResult(
                'Version Endpoint',
                hasRequiredFields ? 'PASS' : 'FAIL',
                `Version info: ${JSON.stringify(versionData)}`
            );
            
            // Take screenshot of version endpoint
            await this.takeScreenshot('version-endpoint', 'Version endpoint response');
            
            return hasRequiredFields;
        } catch (error) {
            await this.addTestResult('Version Endpoint', 'FAIL', null, error);
            return false;
        }
    }

    async testPageContent() {
        try {
            console.log('\n🧪 Testing page content...');
            
            // Go back to homepage
            await this.page.goto(this.baseUrl, { waitUntil: 'networkidle2' });
            
            // Check for key content elements
            const heroTitle = await this.page.$eval('h2', el => el.textContent);
            const featuresSection = await this.page.$$('.grid .bg-white');
            
            // Check for specific features
            const features = await this.page.evaluate(() => {
                const featureCards = Array.from(document.querySelectorAll('.grid .bg-white h4'));
                return featureCards.map(card => card.textContent);
            });
            
            const expectedFeatures = [
                'Real-time Transcription',
                'Speaker Identification', 
                'Community Rules'
            ];
            
            const allFeaturesPresent = expectedFeatures.every(feature => 
                features.some(actualFeature => actualFeature.includes(feature))
            );
            
            await this.addTestResult(
                'Page Content',
                allFeaturesPresent ? 'PASS' : 'FAIL',
                `Hero: "${heroTitle}", Features: [${features.join(', ')}]`
            );
            
            // Take screenshot of full page content
            await this.takeScreenshot('full-content', 'Complete page content view');
            
            return allFeaturesPresent;
        } catch (error) {
            await this.addTestResult('Page Content', 'FAIL', null, error);
            return false;
        }
    }

    async testResponsiveness() {
        try {
            console.log('\n🧪 Testing responsive design...');
            
            const viewports = [
                { width: 1280, height: 800, name: 'Desktop' },
                { width: 768, height: 1024, name: 'Tablet' },
                { width: 375, height: 667, name: 'Mobile' }
            ];
            
            for (const viewport of viewports) {
                await this.page.setViewport(viewport);
                await this.page.goto(this.baseUrl, { waitUntil: 'networkidle2' });
                
                // Take screenshot for each viewport
                await this.takeScreenshot(
                    `responsive-${viewport.name.toLowerCase()}`,
                    `${viewport.name} view (${viewport.width}x${viewport.height})`
                );
            }
            
            // Reset to default viewport
            await this.page.setViewport({ width: 1280, height: 800 });
            
            await this.addTestResult(
                'Responsive Design',
                'PASS',
                'Screenshots taken for desktop, tablet, and mobile viewports'
            );
            
            return true;
        } catch (error) {
            await this.addTestResult('Responsive Design', 'FAIL', null, error);
            return false;
        }
    }

    async runAllTests() {
        console.log('🧪 Starting Mediator UI Test Suite');
        console.log('=====================================\n');
        
        try {
            await this.initialize();
            
            const testMethods = [
                this.testHomepageNavigation,
                this.testPageTitle,
                this.testNavigationElements,
                this.testRoomCreationForm,
                this.testHealthEndpoint,
                this.testVersionEndpoint,
                this.testPageContent,
                this.testResponsiveness
            ];
            
            let passCount = 0;
            
            for (const testMethod of testMethods) {
                try {
                    const result = await testMethod.call(this);
                    if (result) passCount++;
                } catch (error) {
                    console.error(`Unexpected error in test: ${error.message}`);
                }
            }
            
            // Determine overall status
            const totalTests = this.testResults.tests.length;
            const failCount = totalTests - passCount;
            
            if (failCount === 0) {
                this.testResults.overallStatus = 'PASS';
            } else if (passCount > 0) {
                this.testResults.overallStatus = 'PARTIAL';
            } else {
                this.testResults.overallStatus = 'FAIL';
            }
            
            // Add performance summary
            this.testResults.performance.testDuration = Date.now() - this.startTime;
            
        } finally {
            await this.cleanup();
        }
        
        return this.testResults;
    }

    generateReport() {
        const { tests, screenshots, errors, performance, overallStatus } = this.testResults;
        const passCount = tests.filter(t => t.status === 'PASS').length;
        const failCount = tests.filter(t => t.status === 'FAIL').length;
        
        let report = `
# Mediator UI Test Report
Generated: ${new Date().toISOString()}

## Overall Status: ${overallStatus}
- Total Tests: ${tests.length}
- Passed: ${passCount}
- Failed: ${failCount}
- Success Rate: ${((passCount / tests.length) * 100).toFixed(1)}%

## Performance Metrics
- Homepage Load Time: ${performance.homepageLoadTime || 'N/A'}ms
- Total Test Duration: ${performance.testDuration || 'N/A'}ms

## Test Results
`;

        tests.forEach(test => {
            const status = test.status === 'PASS' ? '✅' : '❌';
            report += `
### ${status} ${test.name}
- Status: ${test.status}
- Details: ${test.details || 'No details'}
- Timestamp: ${test.timestamp}
${test.error ? `- Error: ${test.error}` : ''}
`;
        });

        if (screenshots.length > 0) {
            report += `\n## Screenshots Taken (${screenshots.length})\n`;
            screenshots.forEach(screenshot => {
                report += `- ${screenshot.name}: ${screenshot.description} (${screenshot.filename})\n`;
            });
        }

        if (errors.length > 0) {
            report += `\n## Errors Encountered (${errors.length})\n`;
            errors.forEach(error => {
                report += `
### ${error.test}
\`\`\`
${error.error}
\`\`\`
`;
            });
        }

        report += `
## Test Environment
- Base URL: ${this.baseUrl}
- Browser: Puppeteer (Chromium)
- Screenshots Directory: ${this.screenshotDir}

## Summary
${overallStatus === 'PASS' 
    ? '🎉 All tests passed! The Mediator application UI is working correctly.' 
    : overallStatus === 'PARTIAL'
    ? '⚠️ Some tests failed. Please review the failed tests and fix the issues.'
    : '🚨 All tests failed. The application may not be running or has critical issues.'
}
`;

        return report;
    }
}

// Main execution
async function main() {
    const tester = new MediatorUITest();
    tester.startTime = Date.now();
    
    try {
        const results = await tester.runAllTests();
        const report = tester.generateReport();
        
        console.log('\n' + '='.repeat(50));
        console.log(report);
        
        // Write report to file
        const reportPath = './ui-test-report.md';
        require('fs').writeFileSync(reportPath, report);
        console.log(`\n📄 Detailed report saved to: ${reportPath}`);
        
        // Exit with appropriate code
        process.exit(results.overallStatus === 'PASS' ? 0 : 1);
        
    } catch (error) {
        console.error('❌ Test suite failed to run:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = MediatorUITest;