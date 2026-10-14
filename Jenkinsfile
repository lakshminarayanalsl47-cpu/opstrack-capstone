
pipeline {
    agent any

    tools {
        jdk 'JDK21'
    }

    environment {
        SONAR_PROJECT_KEY = 'opstrack'
        SONAR_PROJECT_NAME = 'OpsTrack'
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
    }

    post {
        success {
            echo 'OpsTrack CI pipeline completed successfully.'
        }
        failure {
            echo 'OpsTrack CI pipeline failed. Check the stage logs.'
        }
        always {
            echo 'Pipeline execution finished.'
        }
    }
}
