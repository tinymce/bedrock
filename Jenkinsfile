#!groovy
@Library('waluigi@release/7') _

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
    }
  }

  // Testing
  stage("bedrock testing") {
    bedrockRemoteBrowsers(
      platforms: [
        [ browser: 'chrome', provider: 'aws', buckets: 2 ],
        [ browser: 'firefox', provider: 'aws', buckets: 2 ],
        [ browser: 'edge', provider: 'lambdatest', buckets: 1 ],
        [ browser: 'chrome', provider: 'lambdatest', os: 'macOS Sonoma', buckets: 1 ],
        [ browser: 'firefox', provider: 'lambdatest', os: 'macOS Sonoma', buckets: 1 ],
        [ browser: 'safari', provider: 'lambdatest', os: 'macOS Sonoma', buckets: 1 ],
      ],
      prepareTests: {},
      testDirs: [ 'modules/sample/src/test/ts/**/pass' ],
      custom: '--config modules/sample/tsconfig.json --customRoutes modules/sample/routes.json --polyfills Promise Symbol'
    )
  }

  // Publish
  if (isReleaseBranch()) {
    stage("publish") {
      tinyPods.node() {
        yarnInstall()
        sh 'yarn build'
        tinyNpm.withNpmPublishCredentials {
          // We need to tell git to ignore the changes to .npmrc when publishing
          exec('git update-index --assume-unchanged .npmrc')
          exec('yarn lerna publish from-package --yes --no-git-reset --ignore @ephox/bedrock-sample')
        }
      }
    }
  }
}
