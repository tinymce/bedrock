#!groovy
@Library('waluigi@v6.0.1') _

// NOTE: This Jenkinsfile relies on Tiny's internal infrastructure

standardProperties()

tinyPods.node() {
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

    bedrockBrowsers(
      prepareTests: {
        yarnInstall()
        exec('yarn build')
      },
      testDirs: [ 'modules/sample/src/test/ts/**/pass' ],
      custom: '--config modules/sample/tsconfig.json --customRoutes modules/sample/routes.json --polyfills Promise Symbol'
    )
  }

  if (isReleaseBranch()) {
    stage("publish") {
      tinyNpm.withNpmPublishCredentials {
        exec('yarn lerna publish from-package --yes --ignore @ephox/bedrock-sample')
      }
    }
  }
}
