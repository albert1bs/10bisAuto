# 10bis Automation - GitHub Actions Setup Guide

This guide will help you migrate from server-based automation to GitHub Actions, where your 10bis tokens will be securely stored in GitHub secrets and the automation will run automatically in the cloud.

## Overview

The GitHub Actions setup provides:
- **Automatic token refresh** every 10 minutes
- **Daily credit loading** at 10:00 AM Israel time (weekdays only)
- **Secure token storage** in GitHub secrets
- **Automatic token updates** when refreshed
- **Manual testing** capabilities
- **Detailed logging** with artifact storage

## Prerequisites

1. **GitHub Repository**: Your code must be in a GitHub repository
2. **GitHub Personal Access Token**: Required for updating secrets automatically
3. **10bis Credentials**: Your initial access token, refresh token, amount, and money card ID

## Step-by-Step Setup

### 1. Push Your Code to GitHub

If you haven't already, push your code to a GitHub repository:

```bash
git init
git add .
git commit -m "Initial commit - 10bis automation"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

### 2. Create a GitHub Personal Access Token

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a descriptive name like "10bis-automation-secrets"
4. Select the following scopes:
   - `repo` (Full control of private repositories)
   - `workflow` (Update GitHub Action workflows)
5. Click "Generate token"
6. **Copy the token immediately** - you won't be able to see it again

### 3. Set Up GitHub Secrets

**Step-by-step to find GitHub Secrets (available on free accounts):**

1. **Go to your GitHub repository** (the one where you pushed your code)
2. **Click the "Settings" tab** at the top of your repository (next to "Code", "Issues", "Pull requests", etc.)
3. **Scroll down in the left sidebar** and look for "Secrets and variables"
4. **Click "Secrets and variables"** to expand it
5. **Click "Actions"** (this is where repository secrets are stored)
6. **Click the "New repository secret" button**

**If you don't see "Settings" tab:**
- Make sure you're the owner of the repository, or have admin access
- If it's a forked repository, you need to use your own fork

Add the following **Repository secrets** (one by one):

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `ACCESS_TOKEN` | Your 10bis access token | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `REFRESH_TOKEN` | Your 10bis refresh token | `def50200a1b2c3d4e5f6...` |
| `AMOUNT` | Credit amount to load daily | `100` |
| `MONEYCARD_ID` | Your money card ID (legacy v1 API) | `12345678` |
| `ENCRYPTED_MONEYCARD_ID` | Your encrypted money card ID — when set, the v3 API is used instead of v1 | `reqNAypWc234seeCmFiSQ==` |
| `PERSONAL_ACCESS_TOKEN` | GitHub PAT from step 2 | `ghp_xxxxxxxxxxxxxxxxxxxx` |

**Visual Guide - What you should see:**
```
Your Repository Page
├── Code (tab)
├── Issues (tab)
├── Pull requests (tab)
├── Actions (tab)
├── Projects (tab)
├── Security (tab)
├── Insights (tab)
└── Settings (tab) ← Click here!

Settings Page (left sidebar):
├── General
├── Access
├── Code and automation
│   ├── Branches
│   ├── Tags
│   ├── Actions
│   │   ├── General
│   │   ├── Runners
│   │   └── Runner groups
│   └── Webhooks
├── Security
│   ├── Code security and analysis
│   ├── Deploy keys
│   └── Secrets and variables ← Click here!
│       └── Actions ← Click here!
└── Integrations
```

**For each secret:**
1. Click "New repository secret"
2. Enter the "Name" (e.g., `ACCESS_TOKEN`)
3. Enter the "Secret" (the actual value)
4. Click "Add secret"
5. Repeat for all 5 secrets

### 4. How to Get Your 10bis Tokens

1. **Login to 10bis website** in your browser
2. **Open Developer Tools** (F12)
3. **Go to Network tab**
4. **Navigate around** the 10bis site (view account, etc.)
5. **Find a request** to `api.10bis.co.il`
6. **Look at the request headers**:
   - `Authorization: Bearer YOUR_ACCESS_TOKEN` (copy the part after "Bearer ")
   - In cookies, look for `RefreshToken=YOUR_REFRESH_TOKEN`
7. **Find your Money Card ID**:
   - Load credit once manually on the site
   - Click the `LoadTenbisCredit` request (`/api/v3/Payments/LoadTenbisCredit`)
   - Copy the `encryptedMoneycardIdToCharge` value from the request payload → save as `ENCRYPTED_MONEYCARD_ID`
   - (Legacy v1: the numeric `moneycardIdToCharge` → `MONEYCARD_ID`)

### 5. Verify the Setup

Once you've added all secrets, the GitHub Actions will start running automatically. You can:

1. **Check the Actions tab** in your repository
2. **Manually trigger a test** by going to Actions → "10bis Automation" → "Run workflow"
3. **View logs** to see if everything is working

## How It Works

### Automatic Scheduling

- **Token Refresh**: Runs every 10 minutes to keep your tokens fresh
- **Credit Loading**: Runs daily at 10:00 AM Israel time, Monday through Friday
- **Weekend Skip**: Automatically skips Friday and Saturday

### Token Management

- When tokens are refreshed, the new tokens are automatically encrypted and stored back in GitHub secrets
- This ensures your tokens stay valid without manual intervention
- All sensitive values are masked in logs for security

### Manual Testing

You can manually test the system:

1. Go to your repository's **Actions** tab
2. Click on **"10bis Automation"**
3. Click **"Run workflow"**
4. This will run both configuration tests and token refresh

## Monitoring and Troubleshooting

### Viewing Logs

1. Go to **Actions** tab in your repository
2. Click on any workflow run
3. Click on the job name to see detailed logs
4. Download log artifacts for offline analysis

### Common Issues

#### 1. "Missing required configuration fields"
- **Cause**: One or more GitHub secrets are not set or are empty
- **Solution**: Check that all required secrets are added in repository settings

#### 2. "Authentication error detected"
- **Cause**: Your access token has expired
- **Solution**: Update the `ACCESS_TOKEN` secret with a fresh token from 10bis

#### 3. "HTTP 401: Unauthorized"
- **Cause**: Both access and refresh tokens are invalid
- **Solution**: Get fresh tokens from 10bis website and update both secrets

#### 4. "Secrets updated successfully" but tokens not working
- **Cause**: The `PERSONAL_ACCESS_TOKEN` might not have the right permissions
- **Solution**: Ensure your GitHub PAT has `repo` and `workflow` scopes

#### 5. "Can't find GitHub Secrets / Settings tab"
- **Cause**: You might not have the right permissions or looking in the wrong place
- **Solutions**:
  - Make sure you're the **owner** of the repository
  - Look for the "Settings" tab at the **repository level** (not your account settings)
  - The Settings tab should be next to "Code", "Issues", "Pull requests"
  - If you forked the repository, create your own repository instead
  - Try refreshing the page or logging out and back in

#### 6. "Repository secrets not available"
- **Cause**: GitHub Secrets are available on all plans, including free
- **Solutions**:
  - Make sure you're in the right repository
  - Check that you have admin access to the repository
  - Try using a different browser or clearing cache
  - Contact GitHub support if the feature is genuinely missing

### Checking Secret Updates

The workflow automatically updates your `ACCESS_TOKEN` and `REFRESH_TOKEN` secrets when they're refreshed. You can verify this by:

1. Checking the workflow logs for "Secrets updated successfully"
2. Looking at the repository secrets (values will be hidden, but timestamps show when they were last updated)

## Security Features

- **Encrypted Storage**: All secrets are encrypted by GitHub
- **Masked Logging**: Sensitive values are automatically hidden in logs
- **Automatic Rotation**: Tokens are refreshed and updated automatically
- **No Server Required**: No need to maintain a server or worry about security updates

## Migration from Server Setup

If you're migrating from the server-based setup:

1. **Stop your server cron jobs**:
   ```bash
   crontab -e
   # Comment out or remove the 10bis automation lines
   ```

2. **Keep your server files as backup** until you confirm GitHub Actions is working

3. **Monitor the first few runs** to ensure everything works correctly

4. **Decommission your server** once you're confident in the GitHub Actions setup

## Backup and Recovery

### Backing Up Your Configuration

Your configuration is now stored in GitHub secrets, but you should keep a backup:

1. **Document your settings** (amounts, money card ID, etc.)
2. **Keep a copy of your tokens** in a secure location
3. **Export your repository** if needed

### Recovery Process

If something goes wrong:

1. **Check the Actions logs** for error messages
2. **Update secrets** with fresh tokens if needed
3. **Manually trigger a test run** to verify fixes
4. **Revert to server setup** if necessary (using your backup files)

## Advanced Configuration

### Customizing the Schedule

To change when the automation runs, edit [`.github/workflows/10bis-automation.yml`](.github/workflows/10bis-automation.yml):

```yaml
on:
  schedule:
    # Token refresh every 5 minutes instead of 10
    - cron: '*/5 * * * *'
    # Credit loading at 9:00 AM instead of 10:00 AM
    - cron: '0 6 * * 0,1,2,3,4'  # 6 AM UTC = 9 AM Israel time
```

### Adding Notifications

You can add Slack, email, or other notifications by extending the workflow. See [GitHub Actions documentation](https://docs.github.com/en/actions) for examples.

## Cost Considerations

GitHub Actions provides:
- **2,000 free minutes per month** for private repositories
- **Unlimited minutes** for public repositories
- This automation uses approximately **50-100 minutes per month**

## Support

If you encounter issues:

1. **Check the Actions logs** for detailed error messages
2. **Verify all secrets are set correctly**
3. **Test with fresh tokens** from the 10bis website
4. **Review this documentation** for troubleshooting steps

## Files Overview

The GitHub Actions setup includes these new files:

- [`.github/workflows/10bis-automation.yml`](.github/workflows/10bis-automation.yml) - Main workflow definition
- [`github-actions-utils.js`](github-actions-utils.js) - Utilities for GitHub Actions compatibility
- [`github-refresh-token.js`](github-refresh-token.js) - Token refresh script for GitHub Actions
- [`github-load-credit.js`](github-load-credit.js) - Credit loading script for GitHub Actions

The original files (`load-credit.js`, `refresh-token.js`, `utils.js`) are preserved for local development and server deployments.