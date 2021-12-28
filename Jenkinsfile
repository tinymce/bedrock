#!groovy
@Library('waluigi@v4.5.0') _

// NOTE: This Jenkinsfile relies on Tiny's internal infrastructure

standardProperties()

node("primary") {
  echo "Clean workspace"
  cleanWs()

  stage ("Checkout SCM") {
    checkout localBranch(scm)
  }

  stage("clean") {
    exec('yarn clean')
  }

  stage("install") {
    yarnInstall()
  }

  stage("build") {
    exec('yarn build')
  }

  stage("test") {
    exec('yarn test')
  }

  bedrockBrowsers(
    prepareTests: {
      yarnInstall()
      exec('yarn build')
    },
    testDirs: [ 'modules/sample/src/test/ts/**/pass' ],
    custom: '--config modules/sample/tsconfig.json --customRoutes modules/sample/routes.json --polyfills Promise Symbol'
  )

  if (isReleaseBranch()) {
    stage("publish") {
      exec('yarn lerna publish from-package --yes --ignore @ephox/bedrock-sample')
    }
  }
}
