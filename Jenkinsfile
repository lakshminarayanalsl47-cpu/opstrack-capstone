
pipeline {
    agent any

    tools {
        jdk 'JDK21'
    }

    environment {
        SONAR_PROJECT_KEY = 'opstrack'
        SONAR_PROJECT_NAME = 'OpsTrack'
        DOCKER_IMAGE = 'opstrack:latest'
        DOCKER_CONTAINER = 'opstrack-app'
        APP_PORT = '8082'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build and Test') {
            steps {
                sh '''
                    chmod +x mvnw
                    ./mvnw clean verify
                '''
            }
            post {
                always {
                    junit allowEmptyResults: true,
                          testResults: '**/target/surefire-reports/*.xml'
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    sh '''
                        ./mvnw org.sonarsource.scanner.maven:sonar-maven-plugin:5.2.0.4988:sonar \
                          -Dsonar.projectKey=${SONAR_PROJECT_KEY} \
                          -Dsonar.projectName=${SONAR_PROJECT_NAME}
                    '''
                }
            }
        }

        stage('Verify JAR') {
            steps {
                sh '''
                    echo "Checking packaged application..."
                    test -f target/opstrack-0.0.1-SNAPSHOT.jar
                    ls -lh target/opstrack-0.0.1-SNAPSHOT.jar
                '''
            }
        }

        stage('Archive Artifact') {
            steps {
                archiveArtifacts artifacts: 'target/*.jar',
                                 fingerprint: true
            }
        }

        stage('Build Docker Image') {
            steps {
                sh '''
                    echo "Building OpsTrack Docker image..."
                    docker build -t "$DOCKER_IMAGE" .
                '''
            }
        }

        stage('Deploy to Docker') {
            steps {
                sh '''
                    set -eu

                    echo "Removing previous OpsTrack container if present..."
                    docker rm -f "$DOCKER_CONTAINER" 2>/dev/null || true

                    echo "Starting new OpsTrack container..."
                    docker run -d \
                      --name "$DOCKER_CONTAINER" \
                      --restart unless-stopped \
                      -p "${APP_PORT}:8080" \
                      "$DOCKER_IMAGE"

                    echo "Waiting for the application to initialize..."
                    sleep 10

                    if [ "$(docker inspect -f '{{.State.Running}}' "$DOCKER_CONTAINER")" != "true" ]; then
                        echo "Deployment failed. Container is not running."
                        docker logs "$DOCKER_CONTAINER" || true
                        exit 1
                    fi

                    echo "OpsTrack container is running."
                    docker ps --filter "name=$DOCKER_CONTAINER"
                '''
            }
        }

        stage('Verify Deployment') {
            steps {
                sh '''
                    set -eu

                    echo "Checking application response..."

                    if command -v curl >/dev/null 2>&1; then
                        curl --retry 10 \
                             --retry-delay 3 \
                             --retry-connrefused \
                             --fail \
                             http://host.docker.internal:${APP_PORT}/
                    else
                        echo "curl is unavailable; checking container status instead."
                        test "$(docker inspect -f '{{.State.Running}}' "$DOCKER_CONTAINER")" = "true"
                    fi

                    echo "Deployment verification completed."
                '''
            }
        }
    }

    post {
        success {
            echo 'OpsTrack CI/CD pipeline completed successfully.'
            echo 'Application URL: http://localhost:8082'
        }
        failure {
            echo 'OpsTrack CI/CD pipeline failed. Check the stage logs.'
        }
        always {
            echo 'Pipeline execution finished.'
        }
    }
}
