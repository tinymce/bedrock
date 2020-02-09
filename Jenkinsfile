#!groovy
@Library('waluigi@v1.0.0') _

// NOTE: This Jenkinsfile relies on Tiny's internal infrastructure

properties([
  disableConcurrentBuilds(),
  pipelineTriggers([])
])

node("primary") {
  echo "Clean workspace"
  cleanWs()

  stage ("Checkout SCM") {
    checkout localBranch(scm)
  }

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
      sh 'yarn lerna publish from-package --yes --ignore @ephox/bedrock-sample'
    }
  }
}
