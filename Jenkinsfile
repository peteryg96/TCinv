pipeline {
    agent any
    
    environment {
        NODE_VERSION = '18'
        DOCKER_REGISTRY = 'docker.io'
        DOCKER_IMAGE_BACKEND = "${env.DOCKER_USERNAME}/inventory-backend"
        DOCKER_IMAGE_FRONTEND = "${env.DOCKER_USERNAME}/inventory-frontend"
        MONGODB_URI = 'mongodb://test:test123@mongodb:27017/test?authSource=admin'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    env.GIT_COMMIT_SHORT = sh(
                        script: "git rev-parse --short HEAD",
                        returnStdout: true
                    ).trim()
                    env.BRANCH_NAME = env.GIT_BRANCH.replaceAll('origin/', '')
                }
            }
        }
        
        stage('Setup') {
            parallel {
                stage('Backend Dependencies') {
                    steps {
                        dir('backend') {
                            sh 'npm ci'
                        }
                    }
                }
                stage('Frontend Dependencies') {
                    steps {
                        dir('frontend') {
                            sh 'npm ci'
                        }
                    }
                }
            }
        }
        
        stage('Lint') {
            parallel {
                stage('Backend Lint') {
                    steps {
                        dir('backend') {
                            sh 'npm run lint || echo "Linting not configured"'
                        }
                    }
                }
                stage('Frontend Lint') {
                    steps {
                        dir('frontend') {
                            sh 'npm run lint'
                        }
                    }
                }
            }
        }
        
        stage('Test') {
            parallel {
                stage('Backend Tests') {
                    steps {
                        dir('backend') {
                            sh '''
                                export NODE_ENV=test
                                npm run test:ci
                            '''
                        }
                    }
                    post {
                        always {
                            junit 'backend/coverage/junit.xml'
                            publishHTML([
                                allowMissing: false,
                                alwaysLinkToLastBuild: true,
                                keepAll: true,
                                reportDir: 'backend/coverage',
                                reportFiles: 'index.html',
                                reportName: 'Backend Coverage Report'
                            ])
                        }
                    }
                }
                stage('Frontend Tests') {
                    steps {
                        dir('frontend') {
                            sh 'npm run test:coverage'
                        }
                    }
                    post {
                        always {
                            publishHTML([
                                allowMissing: false,
                                alwaysLinkToLastBuild: true,
                                keepAll: true,
                                reportDir: 'frontend/coverage',
                                reportFiles: 'index.html',
                                reportName: 'Frontend Coverage Report'
                            ])
                        }
                    }
                }
            }
        }
        
        stage('Security Scan') {
            steps {
                script {
                    // NPM Audit
                    sh '''
                        cd backend && npm audit --json > npm-audit-backend.json || true
                        cd ../frontend && npm audit --json > npm-audit-frontend.json || true
                    '''
                    
                    // Trivy scan
                    sh '''
                        docker run --rm -v $(pwd):/src aquasec/trivy fs --format json --output /src/trivy-results.json /src || true
                    '''
                }
            }
            post {
                always {
                    archiveArtifacts artifacts: '**/npm-audit-*.json,trivy-results.json', allowEmptyArchive: true
                }
            }
        }
        
        stage('Build Docker Images') {
            when {
                anyOf {
                    branch 'develop'
                    branch 'main'
                }
            }
            steps {
                script {
                    docker.withRegistry("https://${DOCKER_REGISTRY}", 'docker-hub-credentials') {
                        // Build Backend
                        def backendImage = docker.build(
                            "${DOCKER_IMAGE_BACKEND}:${BRANCH_NAME}-${GIT_COMMIT_SHORT}",
                            "-f backend/Dockerfile ./backend"
                        )
                        backendImage.push()
                        backendImage.push("${BRANCH_NAME}-latest")
                        
                        // Build Frontend
                        def frontendImage = docker.build(
                            "${DOCKER_IMAGE_FRONTEND}:${BRANCH_NAME}-${GIT_COMMIT_SHORT}",
                            "-f frontend/Dockerfile ./frontend"
                        )
                        frontendImage.push()
                        frontendImage.push("${BRANCH_NAME}-latest")
                    }
                }
            }
        }
        
        stage('Deploy to Staging') {
            when {
                branch 'develop'
            }
            steps {
                script {
                    sshagent(['staging-ssh-key']) {
                        sh """
                            ssh -o StrictHostKeyChecking=no ${STAGING_USERNAME}@${STAGING_HOST} '
                                cd /opt/inventory-app && \
                                docker-compose pull && \
                                docker-compose up -d && \
                                docker system prune -f
                            '
                        """
                    }
                }
            }
        }
        
        stage('Deploy to Production') {
            when {
                branch 'main'
            }
            steps {
                input message: 'Deploy to Production?', ok: 'Deploy'
                script {
                    sshagent(['production-ssh-key']) {
                        sh """
                            ssh -o StrictHostKeyChecking=no ${PRODUCTION_USERNAME}@${PRODUCTION_HOST} '
                                cd /opt/inventory-app && \
                                docker-compose -f docker-compose.prod.yml pull && \
                                docker-compose -f docker-compose.prod.yml up -d && \
                                docker system prune -f
                            '
                        """
                    }
                }
            }
        }
        
        stage('Smoke Tests') {
            when {
                anyOf {
                    branch 'develop'
                    branch 'main'
                }
            }
            steps {
                script {
                    def targetUrl = env.BRANCH_NAME == 'main' ? 
                        "https://${PRODUCTION_HOST}" : 
                        "https://${STAGING_HOST}"
                    
                    sh """
                        curl -f ${targetUrl}/api/health || exit 1
                        echo "Health check passed!"
                    """
                }
            }
        }
    }
    
    post {
        always {
            cleanWs()
        }
        success {
            slackSend(
                color: 'good',
                message: "✅ Build ${env.BUILD_NUMBER} succeeded for ${env.BRANCH_NAME}\nCommit: ${env.GIT_COMMIT_SHORT}"
            )
        }
        failure {
            slackSend(
                color: 'danger',
                message: "❌ Build ${env.BUILD_NUMBER} failed for ${env.BRANCH_NAME}\nCommit: ${env.GIT_COMMIT_SHORT}"
            )
        }
    }
}