// NOTE: This Jenkinsfile relies on Tiny's internal infrastructure

library identifier: 'jenkins-plumbing@master', retriever: modernSCM(
  [$class: 'GitSCMSource',
   remote: 'ssh://git@stash:7999/van/jenkins-plumbing.git',
   credentialsId: '8aa93893-84cc-45fc-a029-a42f21197bb3'])

properties([
  disableConcurrentBuilds(),
  pipelineTriggers([])
])

def isReleaseBranch() {
  // The branch name could be in the BRANCH_NAME or GIT_BRANCH variable depending on the type of job
  def branchName = env.BRANCH_NAME ? env.BRANCH_NAME : env.GIT_BRANCH
  return branchName == 'master' || branchName == 'origin/master';
}

node("primary") {
  echo "Clean workspace"
  cleanWs()

  stage ("Checkout SCM") {
    checkout localBranch(scm)
  }

  withBitbucket {
    stage("clean") {
      sh 'yarn clean'
    }

    stage("install") {
      sh 'yarn install'
    }

    stage("build") {
      sh 'yarn build'
    }

    stage("test") {
      sh 'yarn test'
    }

    if (isReleaseBranch()) {
      stage("publish") {
        sshagent(credentials: ['8aa93893-84cc-45fc-a029-a42f21197bb3']) {
          sh 'yarn lerna publish from-package --yes --ignore @ephox/bedrock-sample'
        }
      }
    }

  }
}
