#!groovy
@Library('waluigi@v3.1.0') _

// NOTE: This Jenkinsfile relies on Tiny's internal infrastructure

standardProperties()

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
    yarnInstall() 
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
