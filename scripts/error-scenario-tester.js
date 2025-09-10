#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const http = require('http');
const express = require('express');
const puppeteer = require('puppeteer');

/**
 * Comprehensive Error Scenario Testing Suite
 * Tests all error handling scenarios with automated browser testing
 */

class ErrorScenarioTester {
    constructor() {
        this.testResults = {
            timestamp: new Date().toISOString(),
            scenarios: [],
            summary: {
                total: 0,
                passed: 0,
                failed: 0,
                skipped: 0
            }
        };
        this.mockServer = null;
        this.browser = null;
        this.page = null;
    }

    // Start mock server for error simulation
    async startMockServer() {
        return new Promise((resolve) => {
            const app = express();
            app.use(express.static('.'));
            
            // Mock successful config endpoint
            app.get('/api/config/success.json', (req, res) => {
                res.json({
                    version: '1.0.0',
                    data: {
                        cards: [
                            {
                                id: 1,
                                name: 'Test Card',
                                card_fields: []
                            }
                        ],
                        visualObjects: {},
                        formulas: []
                    }
                });
            });

            // Mock network error (delayed response)
            app.get('/api/config/slow.json', (req, res) => {
                setTimeout(() => {
                    res.status(500).json({ error: 'Internal Server Error' });
                }, 5000);
            });

            // Mock 404 error
            app.get('/api/config/missing.json', (req, res) => {
                res.status(404).json({ error: 'Config not found' });
            });

            // Mock CORS error
            app.get('/api/config/cors.json', (req, res) => {
                // Simulate CORS by not sending proper headers
                res.status(200).json({ data: 'blocked' });
            });

            // Mock malformed JSON
            app.get('/api/config/malformed.json', (req, res) => {
                res.setHeader('Content-Type', 'application/json');
                res.send('{ invalid json syntax }');
            });

            // Mock empty/invalid data
            app.get('/api/config/invalid-data.json', (req, res) => {
                res.json({
                    version: '1.0.0',
                    data: {
                        // Missing cards array
                        visualObjects: {},
                        formulas: []
                    }
                });
            });

            // Mock timeout scenario
            app.get('/api/config/timeout.json', (req, res) => {
                // Never respond to simulate timeout
            });

            // Mock dependency error
            app.get('/missing-script.js', (req, res) => {
                res.status(404).send('Script not found');
            });

            this.mockServer = app.listen(3001, () => {
                console.log('🚀 Mock server started on port 3001');
                resolve();
            });
        });
    }

    // Stop mock server
    stopMockServer() {
        if (this.mockServer) {
            this.mockServer.close();
            console.log('🛑 Mock server stopped');
        }
    }

    // Setup browser for testing
    async setupBrowser() {
        this.browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        this.page = await this.browser.newPage();
        
        // Listen for console messages
        this.page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log('🔴 Browser Error:', msg.text());
            }
        });

        // Set up error event listener
        await this.page.evaluateOnNewDocument(() => {
            window.errorEvents = [];
            window.addEventListener('e1-calculator-error', (event) => {
                window.errorEvents.push({
                    type: 'error',
                    detail: event.detail,
                    timestamp: Date.now()
                });
            });
        });
    }

    // Cleanup browser
    async cleanupBrowser() {
        if (this.page) {
            await this.page.close();
        }
        if (this.browser) {
            await this.browser.close();
        }
    }

    // Create test page with widget
    generateTestPage(scenario) {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Error Test: ${scenario.name}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
        }
        .test-info {
            background: #e1f5fe;
            padding: 15px;
            border-radius: 4px;
            margin-bottom: 20px;
        }
        #error-log {
            background: #f5f5f5;
            padding: 10px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 12px;
            margin-top: 20px;
            max-height: 200px;
            overflow-y: auto;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="test-info">
            <h2>Error Scenario Test: ${scenario.name}</h2>
            <p><strong>Description:</strong> ${scenario.description}</p>
            <p><strong>Expected Result:</strong> ${scenario.expectedResult}</p>
        </div>
        
        <div id="widget-container" ${scenario.attributes || ''}></div>
        
        <div id="error-log">
            <strong>Error Log:</strong><br>
        </div>
    </div>

    <script src="dist/e1-calculator-widget.min.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', async () => {
            const errorLog = document.getElementById('error-log');
            const logMessage = (message) => {
                errorLog.innerHTML += new Date().toISOString() + ': ' + message + '<br>';
                errorLog.scrollTop = errorLog.scrollHeight;
            };

            // Listen for widget events
            const container = document.getElementById('widget-container');
            container.addEventListener('e1-calculator-error', (event) => {
                logMessage('ERROR EVENT: ' + JSON.stringify(event.detail, null, 2));
            });

            container.addEventListener('e1-calculator-ready', (event) => {
                logMessage('READY EVENT: Widget initialized successfully');
            });

            try {
                logMessage('Initializing widget with config: ${JSON.stringify(scenario.config)}');
                
                const instance = await E1Calculator.init('widget-container', ${JSON.stringify(scenario.config)});
                
                if (instance) {
                    logMessage('Widget instance created successfully');
                } else {
                    logMessage('Widget instance creation returned null');
                }
                
            } catch (error) {
                logMessage('INITIALIZATION ERROR: ' + error.message);
            }
        });
    </script>
</body>
</html>
        `;
    }

    // Test scenario runner
    async runScenario(scenario) {
        console.log(`🧪 Testing scenario: ${scenario.name}`);
        
        const result = {
            name: scenario.name,
            description: scenario.description,
            expectedResult: scenario.expectedResult,
            status: 'pending',
            actualResult: '',
            errorsCaught: [],
            retryAttempts: 0,
            duration: 0,
            timestamp: new Date().toISOString()
        };

        const startTime = Date.now();

        try {
            // Create test page
            const testPageContent = this.generateTestPage(scenario);
            const testPagePath = path.join(__dirname, `../test-pages/error-scenario-${scenario.id}.html`);
            
            // Ensure test-pages directory exists
            const testPagesDir = path.dirname(testPagePath);
            if (!fs.existsSync(testPagesDir)) {
                fs.mkdirSync(testPagesDir, { recursive: true });
            }
            
            fs.writeFileSync(testPagePath, testPageContent);

            // Navigate to test page
            await this.page.goto(`file://${testPagePath}`, { 
                waitUntil: 'networkidle0',
                timeout: scenario.timeout || 15000
            });

            // Wait for widget initialization or error
            await new Promise((resolve) => {
                setTimeout(resolve, scenario.waitTime || 5000);
            });

            // Check for errors in browser
            const errorEvents = await this.page.evaluate(() => window.errorEvents || []);
            result.errorsCaught = errorEvents;

            // Check for error display in DOM
            const errorDisplays = await this.page.$$('.e1-error-display, .e1-error-compact, .e1-widget-error');
            const hasErrorDisplay = errorDisplays.length > 0;

            // Get error display content
            if (hasErrorDisplay) {
                const errorContent = await this.page.evaluate(() => {
                    const errorElements = document.querySelectorAll('.e1-error-display, .e1-error-compact, .e1-widget-error');
                    return Array.from(errorElements).map(el => ({
                        className: el.className,
                        textContent: el.textContent.trim(),
                        hasRetryButton: el.querySelector('button[class*="retry"]') !== null
                    }));
                });
                result.actualResult = `Error display found: ${JSON.stringify(errorContent)}`;
            }

            // Check for retry attempts
            const retryButtons = await this.page.$$('button[class*="retry"]');
            if (retryButtons.length > 0 && scenario.testRetry) {
                console.log('  🔄 Testing retry functionality...');
                
                // Click retry button
                await retryButtons[0].click();
                
                // Wait for retry
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // Check for retry events
                const newErrorEvents = await this.page.evaluate(() => window.errorEvents || []);
                result.retryAttempts = newErrorEvents.filter(e => e.detail?.retryCount).length;
            }

            // Evaluate test result
            const shouldHaveError = scenario.expectError !== false;
            const hasExpectedError = hasErrorDisplay || errorEvents.length > 0;

            if (shouldHaveError) {
                if (hasExpectedError) {
                    result.status = 'passed';
                    result.actualResult += ' ✅ Error handling working as expected';
                } else {
                    result.status = 'failed';
                    result.actualResult = '❌ Expected error but none was displayed';
                }
            } else {
                if (!hasExpectedError) {
                    result.status = 'passed';
                    result.actualResult = '✅ No errors as expected';
                } else {
                    result.status = 'failed';
                    result.actualResult = '❌ Unexpected error occurred';
                }
            }

            // Check specific error type if specified
            if (scenario.expectedErrorType && hasExpectedError) {
                const hasCorrectErrorType = result.actualResult.includes(scenario.expectedErrorType) ||
                    errorEvents.some(e => e.detail?.error?.type === scenario.expectedErrorType);
                
                if (!hasCorrectErrorType) {
                    result.status = 'failed';
                    result.actualResult += ` ❌ Expected error type '${scenario.expectedErrorType}' not found`;
                }
            }

            console.log(`  ${result.status === 'passed' ? '✅' : '❌'} ${result.actualResult}`);

        } catch (error) {
            result.status = 'failed';
            result.actualResult = `Test execution failed: ${error.message}`;
            console.log(`  ❌ ${error.message}`);
        } finally {
            result.duration = Date.now() - startTime;
        }

        this.testResults.scenarios.push(result);
        this.testResults.summary[result.status]++;
        this.testResults.summary.total++;

        return result;
    }

    // Define all test scenarios
    getTestScenarios() {
        return [
            {
                id: 'network-error',
                name: 'Network Error',
                description: 'Test network connectivity issues',
                config: {
                    configUrl: 'http://localhost:3001/api/config/slow.json',
                    enableRetry: true
                },
                expectedResult: 'Should show network error with retry button',
                expectedErrorType: 'network',
                testRetry: true,
                timeout: 20000
            },
            {
                id: '404-error',
                name: 'Config Not Found (404)',
                description: 'Test missing configuration file',
                config: {
                    configUrl: 'http://localhost:3001/api/config/missing.json'
                },
                expectedResult: 'Should show config error with retry button',
                expectedErrorType: 'config',
                testRetry: true
            },
            {
                id: 'malformed-json',
                name: 'Malformed JSON',
                description: 'Test invalid JSON response',
                config: {
                    configUrl: 'http://localhost:3001/api/config/malformed.json'
                },
                expectedResult: 'Should show config/validation error',
                expectedErrorType: 'config'
            },
            {
                id: 'invalid-data',
                name: 'Invalid Data Structure',
                description: 'Test data without required cards array',
                config: {
                    configUrl: 'http://localhost:3001/api/config/invalid-data.json'
                },
                expectedResult: 'Should show validation error',
                expectedErrorType: 'validation'
            },
            {
                id: 'timeout',
                name: 'Request Timeout',
                description: 'Test request timeout handling',
                config: {
                    configUrl: 'http://localhost:3001/api/config/timeout.json'
                },
                expectedResult: 'Should show timeout error with retry',
                expectedErrorType: 'timeout',
                testRetry: true,
                timeout: 25000,
                waitTime: 15000
            },
            {
                id: 'successful-load',
                name: 'Successful Load',
                description: 'Test successful widget initialization',
                config: {
                    configUrl: 'http://localhost:3001/api/config/success.json'
                },
                expectedResult: 'Should load successfully without errors',
                expectError: false
            },
            {
                id: 'retry-success',
                name: 'Retry Success',
                description: 'Test successful retry after initial failure',
                config: {
                    configUrl: 'http://localhost:3001/api/config/missing.json',
                    enableRetry: true,
                    maxRetries: 2
                },
                expectedResult: 'Should show error initially, then allow retry',
                expectedErrorType: 'config',
                testRetry: true
            },
            {
                id: 'no-config-url',
                name: 'No Config URL',
                description: 'Test widget with no data or config URL provided',
                config: {},
                expectedResult: 'Should show configuration error',
                expectedErrorType: 'config'
            }
        ];
    }

    // Generate comprehensive test report
    generateReport() {
        const reportPath = path.join(__dirname, '../error-handling-test-report.html');
        
        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>E1 Calculator - Error Handling Test Report</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f8f9fa;
        }
        .header {
            background: linear-gradient(135deg, #dc3545 0%, #fd7e14 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            margin-bottom: 30px;
        }
        .summary-card {
            background: white;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
        }
        .test-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 20px;
        }
        .test-card {
            background: white;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 20px;
        }
        .test-passed { border-left: 4px solid #28a745; }
        .test-failed { border-left: 4px solid #dc3545; }
        .test-skipped { border-left: 4px solid #6c757d; }
        .test-details {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 4px;
            margin: 10px 0;
        }
        .error-log {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            padding: 10px;
            font-family: monospace;
            font-size: 12px;
            overflow-x: auto;
        }
        pre { margin: 0; white-space: pre-wrap; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .skipped { color: #6c757d; }
    </style>
</head>
<body>
    <div class="header">
        <h1>E1 Calculator Error Handling Test Report</h1>
        <p>Generated: ${this.testResults.timestamp}</p>
    </div>
    
    <div class="summary">
        <div class="summary-card">
            <h3>Total Tests</h3>
            <div style="font-size: 2em; font-weight: bold;">${this.testResults.summary.total}</div>
        </div>
        <div class="summary-card">
            <h3>Passed</h3>
            <div style="font-size: 2em; font-weight: bold; color: #28a745;">${this.testResults.summary.passed}</div>
        </div>
        <div class="summary-card">
            <h3>Failed</h3>
            <div style="font-size: 2em; font-weight: bold; color: #dc3545;">${this.testResults.summary.failed}</div>
        </div>
        <div class="summary-card">
            <h3>Skipped</h3>
            <div style="font-size: 2em; font-weight: bold; color: #6c757d;">${this.testResults.summary.skipped}</div>
        </div>
    </div>
    
    <div class="test-grid">
        ${this.testResults.scenarios.map(scenario => `
            <div class="test-card test-${scenario.status}">
                <h3>${scenario.name} ${scenario.status === 'passed' ? '✅' : scenario.status === 'failed' ? '❌' : '⚠️'}</h3>
                <div class="test-details">
                    <p><strong>Description:</strong> ${scenario.description}</p>
                    <p><strong>Expected:</strong> ${scenario.expectedResult}</p>
                    <p><strong>Actual:</strong> ${scenario.actualResult}</p>
                    <p><strong>Duration:</strong> ${scenario.duration}ms</p>
                    ${scenario.retryAttempts > 0 ? `<p><strong>Retry Attempts:</strong> ${scenario.retryAttempts}</p>` : ''}
                    ${scenario.errorsCaught.length > 0 ? `
                        <details>
                            <summary>Error Events (${scenario.errorsCaught.length})</summary>
                            <div class="error-log">
                                <pre>${JSON.stringify(scenario.errorsCaught, null, 2)}</pre>
                            </div>
                        </details>
                    ` : ''}
                </div>
            </div>
        `).join('')}
    </div>
    
    <details style="margin-top: 30px; background: white; padding: 20px; border-radius: 8px;">
        <summary><h2 style="margin: 0;">Full Test Results (JSON)</h2></summary>
        <div class="error-log">
            <pre>${JSON.stringify(this.testResults, null, 2)}</pre>
        </div>
    </details>
</body>
</html>
        `;

        fs.writeFileSync(reportPath, html);
        console.log(`📋 Test report generated: ${reportPath}`);
        return reportPath;
    }

    // Main test runner
    async runAllTests() {
        console.log('🚀 Starting Error Handling Test Suite...\n');

        try {
            // Start mock server
            await this.startMockServer();

            // Setup browser
            await this.setupBrowser();

            // Run all test scenarios
            const scenarios = this.getTestScenarios();
            
            for (const scenario of scenarios) {
                await this.runScenario(scenario);
                console.log(''); // Empty line for readability
            }

            // Generate report
            this.generateReport();

            // Print summary
            console.log('📊 ERROR HANDLING TEST SUMMARY');
            console.log('================================');
            console.log(`Total Tests: ${this.testResults.summary.total}`);
            console.log(`✅ Passed: ${this.testResults.summary.passed}`);
            console.log(`❌ Failed: ${this.testResults.summary.failed}`);
            console.log(`⚠️ Skipped: ${this.testResults.summary.skipped}`);
            console.log('');
            
            const successRate = (this.testResults.summary.passed / this.testResults.summary.total * 100).toFixed(1);
            console.log(`Success Rate: ${successRate}%`);

        } catch (error) {
            console.error('❌ Test suite failed:', error);
        } finally {
            // Cleanup
            await this.cleanupBrowser();
            this.stopMockServer();
        }
    }
}

// Run tests if this script is called directly
if (require.main === module) {
    const tester = new ErrorScenarioTester();
    tester.runAllTests().catch(console.error);
}

module.exports = ErrorScenarioTester;