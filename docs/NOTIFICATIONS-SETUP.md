# Notifications Setup Guide

This guide explains how to set up Slack and Discord notifications for the Mobigen CI/CD pipelines.

## Overview

The Mobigen project sends automated notifications for:
- ✅ **CI Success** - When all CI checks pass on main/master branch
- ❌ **CI Failure** - When any CI check fails
- ⚠️ **Certification Failures** - When template certification fails to achieve Silver level

## Notification Channels

You can configure one or both notification channels:
- **Slack** - Sends rich attachments with color-coded status
- **Discord** - Sends embeds with detailed workflow information

---

## Setting Up Slack Notifications

### Step 1: Create a Slack Incoming Webhook

1. Go to your Slack workspace settings
2. Navigate to **Apps** → **Manage** → **Custom Integrations** → **Incoming Webhooks**
3. Click **Add to Slack**
4. Select the channel where you want to receive notifications (e.g., `#mobigen-ci`)
5. Click **Add Incoming WebHooks Integration**
6. Copy the **Webhook URL** (format: `your-slack-webhook-url`)

### Step 2: Add Webhook to GitHub Secrets

1. Go to your GitHub repository: `https://github.com/YOUR_ORG/mobigen`
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `SLACK_WEBHOOK_URL`
5. Value: Paste the webhook URL from Step 1
6. Click **Add secret**

### Step 3: Test the Integration

Push a commit to trigger the CI workflow and verify notifications appear in your Slack channel.

---

## Setting Up Discord Notifications

### Step 1: Create a Discord Webhook

1. Open your Discord server
2. Go to **Server Settings** → **Integrations** → **Webhooks**
3. Click **New Webhook**
4. Configure the webhook:
   - **Name**: `Mobigen CI` (or your preferred name)
   - **Channel**: Select the channel for notifications (e.g., `#ci-notifications`)
5. Copy the **Webhook URL** (it looks like: `your-discord-webhook-url`)

### Step 2: Add Webhook to GitHub Secrets

1. Go to your GitHub repository: `https://github.com/YOUR_ORG/mobigen`
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `DISCORD_WEBHOOK_URL`
5. Value: Paste the webhook URL from Step 1
6. Click **Add secret**

### Step 3: Test the Integration

Push a commit to trigger the CI workflow and verify notifications appear in your Discord channel.

---

## Required Repository Secrets

| Secret Name | Description | Required |
|-------------|-------------|----------|
| `SLACK_WEBHOOK_URL` | Slack incoming webhook URL | Optional (if using Slack) |
| `DISCORD_WEBHOOK_URL` | Discord webhook URL | Optional (if using Discord) |

**Note:** You can configure one, both, or neither webhook. If a webhook is not configured, that notification channel will be skipped.

---

## Notification Examples

### Slack Notification Format

#### Success Notification
```
✅ CI Pipeline Passed

All CI checks passed successfully for branch `main`.

Jobs Completed: lint, typecheck, test, build

Repository: mobigen/mobigen
Branch: main
Commit: abc1234
Author: John Doe
Workflow: View Workflow Run
```

#### Failure Notification
```
❌ CI Pipeline Failed

The CI pipeline has failed for branch `feature-branch`.

Failed Jobs: test, build

Repository: mobigen/mobigen
Branch: feature-branch
Commit: def5678
Author: Jane Smith
Workflow: View Workflow Run
```

#### Certification Failure Notification
```
⚠️ Template Certification Failed

One or more templates failed to achieve Silver certification.

Failed Templates:
- ecommerce: Level bronze (5 errors)
- loyalty: Level none (12 errors)

Templates must achieve at least Silver (Tier 2) certification to be production-ready.

Repository: mobigen/mobigen
Branch: feature/new-template
Commit: ghi9012
Author: Dev Team
Workflow: View Workflow Run
```

### Discord Notification Format

Discord notifications use embeds with color-coded status:
- 🟢 **Green** - Success
- 🔴 **Red** - Failure
- 🟡 **Yellow** - Warning

Each embed includes:
- **Title** - Brief status message
- **Description** - Detailed message
- **Fields**:
  - Repository (with link)
  - Branch
  - Commit (with link to commit)
  - Author
  - Commit Message
  - Workflow Run (with link)
- **Footer** - "GitHub Actions • Mobigen CI/CD"
- **Timestamp** - When the notification was sent

---

## Notification Triggers

### CI Success Notification
- **When:** All CI checks pass (lint, typecheck, test, build)
- **Branch:** Only on `main` or `master` branch
- **Sent to:** Both Slack and Discord (if configured)

### CI Failure Notification
- **When:** Any CI check fails (lint, typecheck, test, or build)
- **Branch:** Any branch
- **Sent to:** Both Slack and Discord (if configured)
- **Details:** Lists which specific jobs failed

### Certification Failure Notification
- **When:** Template certification fails to achieve Silver level
- **Branch:** Any pull request that modifies templates
- **Sent to:** Both Slack and Discord (if configured)
- **Details:** Lists which templates failed and their certification level

---

## Customization

### Modifying Notification Messages

Notification messages are defined in the workflow files:

1. **CI Notifications**: `.github/workflows/ci.yml`
   - Success: `notify-success` job
   - Failure: `notify-failure` job

2. **Certification Notifications**: `.github/workflows/certify.yml`
   - Failure: `notify-certification-failure` job

### Adding Custom Fields

You can add custom fields to notifications by modifying the `fields` input in the notification workflow call:

```yaml
- name: Send notification
  uses: ./.github/workflows/notifications.yml
  with:
    type: success
    title: "✅ Custom Title"
    message: "Custom message here"
    color: success
    fields: |
      {
        "custom_field": "custom_value"
      }
  secrets:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
    DISCORD_WEBHOOK_URL: ${{ secrets.DISCORD_WEBHOOK_URL }}
```

### Changing Notification Colors

Available color options:
- `success` - Green (for successful operations)
- `failure` - Red (for failures)
- `warning` - Yellow (for warnings)
- `info` - Blue (for informational messages)

---

## Troubleshooting

### Notifications Not Appearing

1. **Check webhook secrets are configured:**
   ```bash
   # In repository settings, verify secrets exist:
   # - SLACK_WEBHOOK_URL
   # - DISCORD_WEBHOOK_URL
   ```

2. **Verify webhook URLs are correct:**
   - Slack webhooks start with `your-slack-webhook-urlvices/`
   - Discord webhooks start with `https://discord.com/api/webhooks/`

3. **Check workflow logs:**
   - Go to Actions tab in GitHub
   - Find the workflow run
   - Check the "Send Notification" step for errors

4. **Test webhook manually:**
   ```bash
   # Slack
   curl -X POST -H 'Content-Type: application/json' \
     -d '{"text":"Test message"}' \
     YOUR_SLACK_WEBHOOK_URL

   # Discord
   curl -X POST -H 'Content-Type: application/json' \
     -d '{"content":"Test message"}' \
     YOUR_DISCORD_WEBHOOK_URL
   ```

### Duplicate Notifications

If you receive duplicate notifications, check that:
- Webhook secrets are not duplicated
- The workflow is not triggered multiple times

### Notifications Missing Information

If commit information is missing:
- Ensure the workflow has access to commit data
- Check that `github.event.head_commit` is available

---

## Advanced Configuration

### Notification Throttling

To avoid notification spam, consider adding conditions:

```yaml
# Only notify on working hours
if: |
  always() &&
  needs.ci-status.outputs.status == 'failure' &&
  github.event.head_commit.timestamp > startOfDay &&
  github.event.head_commit.timestamp < endOfDay
```

### Custom Notification Channels

You can route different notification types to different channels by creating multiple webhooks:

```yaml
secrets:
  SLACK_WEBHOOK_URL_SUCCESS: ${{ secrets.SLACK_WEBHOOK_URL_SUCCESS }}
  SLACK_WEBHOOK_URL_FAILURE: ${{ secrets.SLACK_WEBHOOK_URL_FAILURE }}
```

### Daily Summary Notifications (Future Enhancement)

A daily summary notification could aggregate:
- Total CI runs
- Success rate
- Failed jobs breakdown
- Template certification status

This would require a scheduled workflow:

```yaml
# .github/workflows/daily-summary.yml
name: Daily Summary

on:
  schedule:
    - cron: '0 18 * * *'  # 6 PM daily

jobs:
  summary:
    runs-on: ubuntu-latest
    steps:
      # Aggregate data from past 24 hours
      # Send summary notification
```

---

## Security Considerations

### Protecting Webhook URLs

- ✅ **DO**: Store webhook URLs in GitHub Secrets
- ✅ **DO**: Restrict repository access to trusted users
- ✅ **DO**: Rotate webhooks if compromised
- ❌ **DON'T**: Commit webhook URLs to code
- ❌ **DON'T**: Share webhook URLs in logs or outputs

### Webhook Permissions

- Slack webhooks can only post to the configured channel
- Discord webhooks can only post to the configured channel
- Neither can read messages or perform other actions

### Revoking Access

If a webhook is compromised:

1. **Slack**: Go to workspace settings → Custom Integrations → Delete the webhook
2. **Discord**: Go to server settings → Integrations → Webhooks → Delete the webhook
3. **GitHub**: Remove the secret from repository settings

---

## Support

For issues or questions:
1. Check the [GitHub Actions documentation](https://docs.github.com/en/actions)
2. Review workflow run logs in the Actions tab
3. Create an issue in the repository

---

## Related Documentation

- [CI/CD Pipeline Documentation](./CI-CD.md)
- [Template Certification Guide](./CERTIFICATION.md)
- [GitHub Actions Workflows](./.github/workflows/)
