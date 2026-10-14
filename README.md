# OpsTrack --- DevOps CI/CD Capstone

A beginner-friendly, end-to-end DevOps project demonstrating how a Java
application moves from GitHub through automated build, testing, code
analysis, Docker image creation, and container deployment using Jenkins.

-   **GitHub:**
    https://github.com/lakshminarayanalsl47-cpu/opstrack-capstone
-   **OpsTrack:** http://localhost:8082
-   **Jenkins:** http://localhost:8080
-   **SonarQube:** http://localhost:9000

------------------------------------------------------------------------

## 1. What is OpsTrack?

OpsTrack is a Spring Boot web application with a dashboard and
task-management functionality. This capstone demonstrates both
application development and automation of the build-and-deployment
workflow.

When a developer pushes code to GitHub, a configured webhook can notify
Jenkins. Jenkins reads the repository's `Jenkinsfile` and runs the
pipeline:

1.  Check out the source code.
2.  Build and test the application with Maven.
3.  Analyze the code with SonarQube.
4.  Verify and archive the JAR artifact.
5.  Build a Docker image.
6.  Replace the running OpsTrack container.
7.  Verify the container and attempt an HTTP response check.

**Important:** Automatic deployment depends on a working GitHub webhook,
a correctly configured Jenkins job, working Docker access, and
successful pipeline stages. Seeing the dashboard alone does not prove
that CD automation worked.

## 2. Architecture

``` text
Developer edits code in VS Code
             |
             v
       git commit / push
             |
             v
      GitHub repository
             |
             | Push webhook
             v
       Jenkins pipeline
             |
             +--> Checkout source
             +--> Maven clean verify
             +--> SonarQube analysis
             +--> Verify and archive JAR
             +--> Build Docker image
             +--> Replace OpsTrack container
             +--> Verify deployment
                         |
                         v
              http://localhost:8082
```

### CI versus CD

-   **Continuous Integration (CI):** checkout, compile, test, and code
    analysis.
-   **Continuous Delivery/Deployment (CD):** package the application
    into a Docker image and deploy a container.

## 3. Tools used

  Tool             Role
  ---------------- -----------------------------------------------------
  Git              Tracks code changes and commits.
  GitHub           Stores source code and sends webhook notifications.
  Java 21          Java runtime and development tools.
  Maven Wrapper    Runs the project's Maven build consistently.
  Jenkins          Orchestrates the pipeline from `Jenkinsfile`.
  SonarQube        Static code analysis and code-quality reporting.
  Docker           Builds images and runs containers.
  Docker Desktop   Runs the Docker engine on Windows.
  VS Code          Edits the application and configuration files.

## 4. Repository files

The exact file list can evolve. Important files in this workflow
include:

``` text
opstrack-capstone/
├── Jenkinsfile          # CI/CD pipeline stages
├── Dockerfile           # Packages the OpsTrack application JAR
├── Dockerfile.jenkins   # Custom Jenkins image with Docker CLI
├── pom.xml              # Maven project settings and dependencies
├── mvnw                 # Maven Wrapper for Linux/macOS
├── mvnw.cmd             # Maven Wrapper for Windows
├── src/
│   ├── main/
│   │   ├── java/        # Spring Boot source
│   │   └── resources/
│   │       └── static/  # Dashboard HTML, CSS and JavaScript
│   └── test/            # Automated tests
└── README.md
```

-   `pom.xml` declares dependencies, plugins, and Maven build settings.
-   `mvnw` and `mvnw.cmd` run Maven without requiring a separate Maven
    installation.
-   `Dockerfile` describes how to build the application image from the
    JAR.
-   `Dockerfile.jenkins` installs Docker CLI in the custom Jenkins
    image. It does not automatically grant engine access.
-   `Jenkinsfile` defines the stages Jenkins executes.
-   `src/test/` contains automated tests.

## 5. Prerequisites

For the local Windows lab, configure:

1.  Git.
2.  Docker Desktop, running with Linux containers.
3.  Java 21.
4.  A GitHub account with access to the repository.
5.  Jenkins with Pipeline, Git, JUnit, and SonarQube integration as
    required.
6.  SonarQube, reachable from Jenkins.
7.  A Jenkins Pipeline job named `opstrack-ci`.
8.  Docker CLI inside Jenkins and working access from Jenkins to the
    Docker engine.

### Ports used

  Service              Host port Purpose
  ------------------ ----------- ---------------------------------
  Jenkins                 `8080` Jenkins web UI
  SonarQube               `9000` SonarQube web UI
  OpsTrack                `8082` Application on the Windows host
  App in container        `8080` Spring Boot container port

Use different ports if your local setup requires them, and update the
pipeline consistently.

## 6. Clone the repository

Run these commands in PowerShell or the VS Code terminal:

``` powershell
git clone https://github.com/lakshminarayanalsl47-cpu/opstrack-capstone.git
cd opstrack-capstone
```

If already cloned:

``` powershell
git pull origin main
git branch
git status
```

-   `git clone` downloads a repository.
-   `cd` changes the current directory.
-   `git pull origin main` brings in updates from `main`.
-   `git status` shows modified, staged, and untracked files.

Run project commands from the root folder containing `pom.xml`,
`Jenkinsfile`, and `Dockerfile`.

## 7. Build and test with Maven

### Windows

``` powershell
.\mvnw.cmd clean verify
```

### Linux/macOS

``` bash
chmod +x mvnw
./mvnw clean verify
```

`clean` removes old build output. `verify` runs the Maven lifecycle
through verification, including compilation and configured tests.

Check the JAR:

``` powershell
Get-ChildItem .\target\*.jar
```

The current Jenkinsfile expects:

``` text
target/opstrack-0.0.1-SNAPSHOT.jar
```

If Maven produces a differently named JAR, update both the expected path
in `Jenkinsfile` and the source filename in `Dockerfile`.

**Expected result:** Maven reports `BUILD SUCCESS`, tests pass, and the
JAR exists under `target/`.

## 8. Build and run Docker manually

This is a useful initial diagnostic step; it should not be necessary for
every future code change after CD works.

Build the image from the project root:

``` powershell
docker build -t opstrack:1.0 .
```

`-t` gives the image a name and tag. The final `.` means the current
directory is the Docker build context.

Run a container:

``` powershell
docker run -d --name opstrack-app -p 8082:8080 opstrack:1.0
```

-   `-d`: run in the background.
-   `--name`: assign a container name.
-   `-p 8082:8080`: map host port 8082 to container port 8080.

Open http://localhost:8082.

Inspect it:

``` powershell
docker ps
docker logs --tail 50 opstrack-app
docker inspect opstrack-app
```

Stop or remove the container:

``` powershell
docker stop opstrack-app
docker rm opstrack-app
```

**Warning:** Removing a container can lose data stored only inside it.
Configure persistent storage for any database data that must survive
container replacement.

## 9. Configure SonarQube

The lab's SonarQube UI is at http://localhost:9000 when the service is
running.

Check running containers:

``` powershell
docker ps
```

In Jenkins, open **Manage Jenkins → System** and configure a SonarQube
server entry named exactly `SonarQube`. Configure a URL reachable from
inside the Jenkins container; this lab used
`http://host.docker.internal:9000`. Add the SonarQube token as a Jenkins
credential and select that credential in the server configuration.

The pipeline invokes the scanner:

``` groovy
withSonarQubeEnv('SonarQube') {
    sh '''
        ./mvnw org.sonarsource.scanner.maven:sonar-maven-plugin:5.2.0.4988:sonar \
          -Dsonar.projectKey=${SONAR_PROJECT_KEY} \
          -Dsonar.projectName=${SONAR_PROJECT_NAME}
    '''
}
```

The name in `withSonarQubeEnv` must match the Jenkins server
configuration. Never commit a token or password to GitHub.

## 10. Configure Jenkins

Open http://localhost:8080.

1.  Under **Manage Jenkins → Tools**, configure a JDK named exactly
    `JDK21`, as referenced by the pipeline.
2.  Create or open the Pipeline job `opstrack-ci`.
3.  Configure it to use **Pipeline script from SCM**.
4.  Choose Git, enter the repository URL, set the branch (for example,
    `*/main`), and set script path to `Jenkinsfile`.
5.  Configure SonarQube as described above.
6.  Ensure Docker CLI and engine access work from the running Jenkins
    container.

### Verify Docker access from Jenkins

From Windows PowerShell:

``` powershell
docker exec Jenkins-container docker version
```

A successful result displays both **Client** and **Server** sections. If
only Client appears with a socket error, the CLI is installed but the
Jenkins process cannot access the Docker engine.

### Docker-enabled Jenkins image

The lab used `opstrack-jenkins:docker-cli`. The `Dockerfile.jenkins`
used was:

``` dockerfile
FROM opstrack-jenkins:lts

USER root

RUN apt-get update \
    && apt-get install -y --no-install-recommends docker-cli \
    && docker --version \
    && rm -rf /var/lib/apt/lists/*

USER jenkins
```

Build it:

``` powershell
docker build --no-cache -f Dockerfile.jenkins -t opstrack-jenkins:docker-cli .
```

Verify the CLI:

``` powershell
docker run --rm --entrypoint docker opstrack-jenkins:docker-cli --version
```

This verifies the CLI only; it does not verify access to the Docker
engine.

**Security warning:** Mounting `/var/run/docker.sock` into Jenkins and
granting access to it provides powerful control over Docker and
potentially the host. Restrict access to trusted users. For shared or
production environments, prefer an isolated deployment agent and a
carefully controlled deployment design.

If recreating the Jenkins container, reuse its existing
`/var/jenkins_home` volume to preserve jobs, credentials, plugins, and
configuration. Do not delete that volume during troubleshooting.

## 11. Configure the GitHub webhook

A webhook lets GitHub notify Jenkins when code is pushed.

### In Jenkins

1.  Open `opstrack-ci` and select **Configure**.
2.  Under **Build Triggers**, enable **GitHub hook trigger for GITScm
    polling**.
3.  Save.

### In GitHub

1.  Open the repository → **Settings → Webhooks → Add webhook**.
2.  Set the payload URL to the reachable Jenkins URL ending with
    `/github-webhook/`.
3.  Select content type `application/json`.
4.  Select push events and save.

GitHub cannot normally reach a Jenkins instance available only at
`localhost`. For a local lab, a temporary HTTPS tunnel such as ngrok can
provide a reachable URL. Keep the tunnel running and update the webhook
if the URL changes. Do not expose Jenkins publicly without appropriate
access controls.

Verify under **Settings → Webhooks → your webhook → Recent Deliveries**.
A successful delivery usually returns a `200`-series status; also verify
that Jenkins actually starts a build.

## 12. Understand the Jenkins pipeline

The pipeline stages are:

  -----------------------------------------------------------------------
  Stage                               Purpose
  ----------------------------------- -----------------------------------
  Checkout                            Retrieves source code from the
                                      configured SCM.

  Build and Test                      Runs `./mvnw clean verify`.

  SonarQube Analysis                  Sends code analysis to SonarQube.

  Verify JAR                          Fails if the expected JAR is
                                      missing.

  Archive Artifact                    Stores `target/*.jar` with the
                                      Jenkins build.

  Build Docker Image                  Builds `opstrack:latest` from
                                      `Dockerfile`.

  Deploy to Docker                    Removes the previous `opstrack-app`
                                      container and starts the new image
                                      on `8082:8080`.

  Verify Deployment                   Checks container state and attempts
                                      an HTTP request if `curl` is
                                      available.
  -----------------------------------------------------------------------

The deployment stage removes the old container before starting the new
one. This is acceptable for a learning lab, but it is not zero-downtime
deployment. If the new container fails, the old container may already be
gone.

A future improvement is to start a candidate container, run a health
check, and switch traffic only when it is healthy. Database persistence
and rollback should be designed before production use.

## 13. Run the pipeline

### Initial test

1.  Confirm Docker Desktop, Jenkins, and SonarQube are running.
2.  Open Jenkins and select `opstrack-ci`.
3.  Click **Build Now**.
4.  Open the latest build's **Console Output**.
5.  Confirm all stages succeed, especially Docker build, deployment, and
    verification.
6.  Open http://localhost:8082.

### Subsequent code changes

After initial setup is complete, edit the application and push the
change:

``` powershell
git status
git add .
git commit -m "Describe the change"
git push origin main
```

If the webhook is configured, Jenkins should start automatically. If
not, inspect GitHub's Recent Deliveries, the Jenkins trigger setting,
and Jenkins logs.

The intended automated flow is:

``` text
git push
   |
   v
GitHub webhook
   |
   v
Jenkins reads Jenkinsfile
   |
   v
Build + test + SonarQube
   |
   v
Build Docker image
   |
   v
Replace application container
   |
   v
Verify deployment
```

## 14. Command reference

### Git

``` powershell
git status
git branch
git pull origin main
git add .
git commit -m "Your commit message"
git push origin main
```

### Maven

``` powershell
.\mvnw.cmd clean verify
Get-ChildItem .\target\*.jar
```

### Docker

``` powershell
docker ps
docker ps -a
docker image ls
docker build -t opstrack:1.0 .
docker run -d --name opstrack-app -p 8082:8080 opstrack:1.0
docker logs --tail 50 opstrack-app
docker inspect opstrack-app
docker stop opstrack-app
docker rm opstrack-app
docker exec Jenkins-container docker version
```

### Jenkins container

``` powershell
docker ps --filter "name=Jenkins-container"
docker logs --tail 100 Jenkins-container
docker inspect Jenkins-container --format '{{.Config.Image}}'
docker inspect Jenkins-container --format '{{json .Mounts}}'
```

### Test application response from Windows

``` powershell
curl.exe -I http://localhost:8082
```

An HTTP response indicates that something answered at the URL. Use
pipeline logs and application-specific checks to confirm that the
expected version is deployed.

## 15. Troubleshooting

### Maven fails

``` powershell
java -version
.\mvnw.cmd clean verify
```

Read the first meaningful error. Confirm Java 21 locally and a Jenkins
JDK tool named `JDK21`.

### JAR not found

``` powershell
Get-ChildItem .\target\*.jar
```

Ensure the filename matches the Jenkinsfile check and Dockerfile `COPY`
source.

### SonarQube connection or authorization failure

Check that SonarQube is running, its URL is reachable from Jenkins, the
Jenkins server entry is named `SonarQube`, and the stored token is
valid. Do not put tokens in source control.

### Docker command missing in Jenkins

``` powershell
docker inspect Jenkins-container --format '{{.Config.Image}}'
docker exec Jenkins-container docker --version
```

The intended custom image is `opstrack-jenkins:docker-cli`.

### Docker permission denied

``` powershell
docker exec -u root Jenkins-container ls -l /var/run/docker.sock
docker exec Jenkins-container docker version
```

If the second command fails with a socket permission error, the CLI
exists but the Jenkins process cannot access the engine. Do not blindly
loosen socket permissions; Docker access is highly privileged.

### Port already allocated

``` powershell
docker ps
```

Look for another container using host port `8082`. Stop or reconfigure
the conflicting service before redeploying.

### Container exits

``` powershell
docker ps -a --filter "name=opstrack-app"
docker logs --tail 100 opstrack-app
```

Check Java startup errors, configuration, missing files, and database
access.

### GitHub push does not trigger Jenkins

Check the Jenkins job trigger option, GitHub Recent Deliveries, the
payload URL, and whether the local HTTPS tunnel is still running.

### Dashboard loads but no new deployment happened

The browser may be showing a manually started or old container. Confirm
that the latest Jenkins build completed the Docker deployment stages and
that `opstrack-app` was replaced by the pipeline.

## 16. Security and reliability

This is a local learning project. Before production use:

-   Never commit tokens, passwords, or private keys.
-   Restrict Jenkins access and credentials.
-   Treat Docker socket access as highly privileged.
-   Do not expose Docker's API on an unauthenticated network port.
-   Persist database data that must survive container replacement.
-   Add health checks and rollback before replacing a working version.
-   Pin images and dependencies for controlled builds.
-   Review test results and SonarQube findings.
-   Use an isolated build/deployment agent for shared environments.

## 17. Future improvements

1.  Persist database data using a volume or a dedicated database.
2.  Add health checks and rollback.
3.  Push versioned images to a container registry.
4.  Enforce a SonarQube Quality Gate before deployment.
5.  Use Jenkins credentials or a secrets manager.
6.  Add build and deployment notifications.
7.  Add monitoring and log aggregation.
8.  Extend the project to Kubernetes after the Docker workflow is
    understood.

## 18. Completion checklist

-   [ ] Maven build succeeds.
-   [ ] Automated tests pass.
-   [ ] SonarQube analysis completes.
-   [ ] Jenkins archives the JAR.
-   [ ] Jenkins can access the Docker engine.
-   [ ] Jenkins builds `opstrack:latest`.
-   [ ] Jenkins deploys `opstrack-app`.
-   [ ] OpsTrack opens at `http://localhost:8082`.
-   [ ] GitHub webhook triggers Jenkins after a push.
-   [ ] A visible dashboard change is deployed automatically.
-   [ ] No credentials or local database files are committed.

## 19. Summary

OpsTrack demonstrates this DevOps workflow:

**Code → GitHub → Jenkins → Maven tests → SonarQube → Docker image →
Docker container → running application.**

The `Jenkinsfile` makes the workflow repeatable. After the one-time
configuration of tools, credentials, Docker access, and the GitHub
webhook, normal code changes can be built, tested, analyzed, and
deployed by pushing to GitHub.

The strongest end-to-end demonstration is to make a visible change, push
it, watch Jenkins complete every stage, and confirm the updated
application is running.
