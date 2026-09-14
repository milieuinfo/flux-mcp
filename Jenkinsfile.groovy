@Library('Cumulus@1.3-stable') _

String buildPod() {
    '''
spec:
  containers:
    - name: node
      image: acd-docker.repository.milieuinfo.be/cypress/included:15.4.0
      command:
        - cat
      tty: true
      env:
        - name: NO_COLOR
          value: "1"
      volumeMounts:
        # registry-configuratie, ook gelezen door pnpm: pnpm zelf en de Code Connect CLI komen via deze registry.
        - mountPath: /root/.npmrc
          subPath: .npmrc
          name: js-settings
      resources:
        requests:
          memory: "1Gi"
          cpu: "1"
        limits:
          memory: "2Gi"
  volumes:
    - name: js-settings
      secret:
        secretName: jenkins-secrets
'''
}

// Bij de allereerste build kent Jenkins de parameters nog niet; dan is de parameter null.
String action() {
    params.ACTION ?: 'dry run'
}

pipeline {
    agent {
        kubernetes {
            inheritFrom 'jenkins-jenkins-agent'
            yaml podBuilder.from([buildPod()])
        }
    }
    parameters {
        choice(
                name: 'ACTION',
                choices: ['dry run', 'publish', 'unpublish'],
                description: 'Werkt op de templates in catalog/figma/code-connect. dry run controleert ze zonder ' +
                        'iets te wijzigen. publish zet de snippets in Figma en vervangt wat er voor die nodes ' +
                        'stond. unpublish haalt ze weg.')
    }
    stages {
        stage('code connect') {
            steps {
                container('node') {
                    sh './resources/ci/install-pnpm.sh'
                    sh 'pnpm install --frozen-lockfile --network-concurrency 5'
                    withCredentials([string(
                            credentialsId: 'flux-mcp/figma_cli',
                            variable: 'FIGMA_TOKEN')]) {
                        script {
                            currentBuild.description = action()
                            if (action() == 'publish') {
                                sh 'pnpm run figma:code-connect:publish'
                            } else if (action() == 'unpublish') {
                                sh 'pnpm run figma:code-connect:unpublish'
                            } else {
                                sh 'pnpm run figma:code-connect:publish --dry-run'
                            }
                        }
                    }
                }
            }
        }
    }
    post {
        always {
            script {
                pipelineSummary([:])
            }
        }
    }
}
