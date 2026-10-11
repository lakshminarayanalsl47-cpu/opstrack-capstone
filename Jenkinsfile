
pipeline {
    agent any

    options {
        timestamps()
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build and Test') {
            steps {
                sh './mvnw clean verify'
            }
        }

        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    sh '''
                        ./mvnw org.sonarsource.scanner.maven:sonar-maven-plugin:5.2.0.4988:sonar \
                        -Dsonar.projectKey=opstrack \
                        -Dsonar.projectName=OpsTrack
                    '''
                }
            }
        }
    }

    post {
        always {
            junit allowEmptyResults: true,
                 testResults: '**/target/surefire-reports/*.xml'

            archiveArtifacts artifacts: '**/target/*.jar',
                             allowEmptyArchive: true
        }
    }
}
