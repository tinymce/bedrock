#!groovy
@Library('waluigi@v6.0.1') _

// NOTE: This Jenkinsfile relies on Tiny's internal infrastructure

standardProperties()

timestamps {
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
          // We need to tell git to ignore the changes to .npmrc when publishing
          exec('git update-index --assume-unchanged .npmrc')
          exec('yarn lerna publish from-package --yes --no-git-reset --ignore @ephox/bedrock-sample')
        }
      }
    }
  }
}
