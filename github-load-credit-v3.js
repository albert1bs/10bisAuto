#!/usr/bin/env node

const utils = require('./github-actions-utils');
const TeamsWebhookNotifier = require('./teams-webhook-notifier');

// v3 LoadTenbisCredit: requires the encrypted moneycard ID (ENCRYPTED_MONEYCARD_ID). github-load-credit.js keeps the legacy v1 call.
class GitHubCreditLoaderV3 {
    constructor() {
        this.logFile = 'credit.log';
        this.teamsNotifier = null;
    }

    getConfig() {
        const config = utils.getConfig();
        config.EncryptedMoneycardId = process.env.ENCRYPTED_MONEYCARD_ID || config.EncryptedMoneycardId;
        return config;
    }

    /**
     * Initialize Teams notifier if configuration is available
     */
    async initializeTeamsWebhook() {
        try {
            if (process.env.TEAMS_WEBHOOK_URL) {
                this.teamsNotifier = new TeamsWebhookNotifier(process.env.TEAMS_WEBHOOK_URL, utils);
                await utils.log('Teams webhook notifier initialized - notifications will be sent to Teams channel');
            } else {
                await utils.log('Teams webhook not configured - notifications disabled');
                await utils.log('Required: TEAMS_WEBHOOK_URL environment variable');
            }
        } catch (error) {
            await utils.log(`Failed to initialize Teams webhook: ${error.message}`, 'error.log');
        }
    }

    /**
     * Main function to load 10bis credit
     */
    async loadCredit() {
        const timestamp = utils.getCurrentTimeIsrael();
        let amount = 'Unknown';
        
        try {
            await utils.log('Starting credit loading process', this.logFile);
            
            // Initialize Teams webhook notifications
            await this.initializeTeamsWebhook();
            
            // Check if today is weekend (Friday or Saturday)
            if (utils.isWeekend()) {
                await utils.log('Skipping credit loading - today is weekend (Friday or Saturday)', this.logFile);
                if (process.env.GITHUB_ACTIONS) {
                    await utils.setOutput('credit_loaded', 'skipped_weekend');
                }
                return;
            }
            
            // Read current configuration
            const config = this.getConfig();
            amount = config.Amount;

            // Validate required fields for credit loading
            utils.validateConfig(config, ['AccessToken', 'RefreshToken', 'Amount', 'EncryptedMoneycardId']);
            
            // Mask sensitive values
            utils.maskValue(config.AccessToken);
            utils.maskValue(config.RefreshToken);
            
            // Prepare request options based on your specifications
            const requestOptions = {
                method: 'PATCH',
                url: 'https://api.10bis.co.il/api/v3/Payments/LoadTenbisCredit',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json, text/plain, */*',
                    'Language': 'he',
                    'X-App-Type': 'web',
                    'Authorization': `Bearer ${config.AccessToken}`,
                    'Origin': 'https://www.10bis.co.il',
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
                    'Cookie': `_gcl_au=1.1.283592624.1745399880; _ga=GA1.1.901790421.1745399881; Authorization=${config.AccessToken}; RefreshToken=${config.RefreshToken}`
                },
                data: {
                    amount: String(config.Amount),
                    encryptedMoneycardIdToCharge: config.EncryptedMoneycardId
                }
            };

            await utils.log(`Attempting to load credit (v3): Amount=${config.Amount}, EncryptedMoneycardId=${config.EncryptedMoneycardId}`, this.logFile);
            
            // Make the API request
            const response = await utils.makeHttpRequest(requestOptions);
            
            // Log successful response
            await utils.log(`Credit loading API response status: ${response.status}`, this.logFile);
            
            // Check if the response indicates success (200 or 201 status codes)
            if (response.status === 200 || response.status === 201) {
                await utils.log('Credit loaded successfully!', this.logFile);
                
                // Log response data if present
                if (response.data) {
                    await utils.log(`Credit loading response: ${JSON.stringify(response.data)}`, this.logFile);
                } else {
                    await utils.log('Credit loading completed - no response data (this is normal for 10bis API)', this.logFile);
                }
                
                if (process.env.GITHUB_ACTIONS) {
                    await utils.setOutput('credit_loaded', 'success');
                    await utils.setOutput('amount_loaded', config.Amount);
                }
                
                // Send success Teams notification
                if (this.teamsNotifier) {
                    await this.teamsNotifier.sendSuccessNotification(amount, timestamp);
                }
            } else {
                await utils.log(`Unexpected response status: ${response.status}`, this.logFile);
                if (process.env.GITHUB_ACTIONS) {
                    await utils.setOutput('credit_loaded', 'unexpected_status');
                    await utils.setOutput('response_status', response.status.toString());
                }
                
                // Send failure Teams notification
                if (this.teamsNotifier) {
                    await this.teamsNotifier.sendFailureNotification(amount, timestamp, `Unexpected response status: ${response.status}`);
                }
            }
            
        } catch (error) {
            const errorMessage = `Credit loading failed: ${error.message}`;
            await utils.log(errorMessage, 'error.log');
            await utils.log(errorMessage, this.logFile);
            
            // Set failure output for GitHub Actions
            if (process.env.GITHUB_ACTIONS) {
                await utils.setOutput('credit_loaded', 'failed');
                await utils.setOutput('error', error.message);
            }
            
            // Send failure Teams notification
            if (this.teamsNotifier) {
                await this.teamsNotifier.sendFailureNotification(amount, timestamp, error.message);
            }
            
            // If it's an authentication error, suggest token refresh
            if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                await utils.log('Authentication error detected - tokens may need refresh', this.logFile);
                if (process.env.GITHUB_ACTIONS) {
                    await utils.setOutput('auth_error', 'true');
                }
            }
            
            // Exit with error code for monitoring
            process.exit(1);
        }
    }

    /**
     * Run the credit loading with proper error handling
     */
    async run() {
        try {
            await utils.log(`=== Credit Loading Started at ${utils.getCurrentTimeIsrael()} ===`, this.logFile);
            await this.loadCredit();
            await utils.log(`=== Credit Loading Completed at ${utils.getCurrentTimeIsrael()} ===`, this.logFile);
            process.exit(0);
        } catch (error) {
            await utils.log(`=== Credit Loading Failed at ${utils.getCurrentTimeIsrael()}: ${error.message} ===`, this.logFile);
            process.exit(1);
        }
    }

    /**
     * Test function to check configuration without making API call
     */
    async testConfiguration() {
        try {
            await utils.log('Testing configuration for credit loading', this.logFile);
            
            const config = this.getConfig();
            utils.validateConfig(config, ['AccessToken', 'RefreshToken', 'Amount', 'EncryptedMoneycardId']);

            await utils.log('Configuration test passed - all required fields present', this.logFile);
            await utils.log(`Amount: ${config.Amount}`, this.logFile);
            await utils.log(`EncryptedMoneycardId: ${config.EncryptedMoneycardId}`, this.logFile);
            await utils.log(`AccessToken: ${config.AccessToken ? 'Present' : 'Missing'}`, this.logFile);
            await utils.log(`RefreshToken: ${config.RefreshToken ? 'Present' : 'Missing'}`, this.logFile);
            
            if (process.env.GITHUB_ACTIONS) {
                await utils.setOutput('config_test', 'passed');
            }
            
            return true;
        } catch (error) {
            await utils.log(`Configuration test failed: ${error.message}`, this.logFile);
            if (process.env.GITHUB_ACTIONS) {
                await utils.setOutput('config_test', 'failed');
                await utils.setOutput('config_error', error.message);
            }
            return false;
        }
    }
}

// Run the script if called directly
if (require.main === module) {
    const creditLoader = new GitHubCreditLoaderV3();
    
    // Check if running in test mode
    if (process.argv.includes('--test')) {
        creditLoader.testConfiguration().then(success => {
            process.exit(success ? 0 : 1);
        });
    } else {
        creditLoader.run();
    }
}

module.exports = GitHubCreditLoaderV3;