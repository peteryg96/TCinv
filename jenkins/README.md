# Jenkins Setup for Inventory Management System

## Initial Setup

1. **Start Jenkins:**
```bash
cd jenkins
docker-compose up -d
```

2. **Get initial admin password:**
```bash
docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

3. **Access Jenkins:**
   - URL: http://localhost:8080
   - Enter the admin password

4. **Configure Jenkins:**
   - Install suggested plugins
   - Create admin user
   - Configure Jenkins URL

## Required Credentials

Add these credentials in Jenkins (Manage Jenkins → Credentials):

1. **Docker Hub** (Username with password)
   - ID: `docker-hub-credentials`
   - Username: Your Docker Hub username
   - Password: Your Docker Hub token

2. **Staging SSH** (SSH Username with private key)
   - ID: `staging-ssh-key`
   - Username: staging username
   - Private Key: staging SSH key

3. **Production SSH** (SSH Username with private key)
   - ID: `production-ssh-key`
   - Username: production username
   - Private Key: production SSH key

4. **Slack** (Secret text) - Optional
   - ID: `slack-token`
   - Secret: Slack webhook URL

## Create Pipeline

1. New Item → Pipeline
2. Name: `inventory-management-pipeline`
3. Pipeline definition: Pipeline script from SCM
4. SCM: Git
5. Repository URL: Your repo URL
6. Script Path: `Jenkinsfile`
7. Branches to build: `*/develop`, `*/main`

## Configure Webhooks

### GitHub Webhook:
- URL: `http://your-jenkins-url:8080/github-webhook/`
- Content type: `application/json`
- Events: Push, Pull Request

### Manual Trigger:
Build can also be triggered manually from Jenkins UI

## Environment Variables

Set these in Jenkins (Manage Jenkins → Configure System → Global properties):
```
DOCKER_USERNAME=your_docker_username
STAGING_HOST=staging.yourdomain.com
STAGING_USERNAME=deploy
PRODUCTION_HOST=yourdomain.com
PRODUCTION_USERNAME=deploy
```