
pipeline {
    agent any

    options {
        timestamps()
        skipDefaultCheckout(true)
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
                    withCredentials([
                        string(
                            credentialsId: 'sonarqube-token',
                            variable: 'SONAR_TOKEN'
                        )
                    ]) {
                        sh '''
                            ./mvnw org.sonarsource.scanner.maven:sonar-maven-plugin:5.2.0.4988:sonar \
                              -Dsonar.projectKey=opstrack \
                              -Dsonar.projectName=OpsTrack
                        '''
                    }
                }
            }
        }

        stage('Verify JAR Artifact') {
            steps {
                sh '''
                    echo "Checking generated JAR..."
                    test -f target/opstrack-0.0.1-SNAPSHOT.jar
                    ls -lh target/opstrack-0.0.1-SNAPSHOT.jar
                '''
            }
        }
    }

    post {
        always {
            junit(
                allowEmptyResults: true,
                testResults: '**/target/surefire-reports/*.xml'
            )
        }

        success {
            archiveArtifacts(
                artifacts: 'target/*.jar',
                fingerprint: true
            )

            echo 'Pipeline completed successfully.'
            echo 'JAR artifact is archived in Jenkins.'
        }

        failure {
            echo 'Pipeline failed. Check the Console Output.'
        }

        cleanup {
            echo 'Pipeline execution finished.'
        }
    }
}
