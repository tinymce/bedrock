#!groovy
@Library('waluigi@release/7') _

// NOTE: This Jenkinsfile relies on Tiny's internal infrastructure

standardProperties()

timestamps {
  tinyPods.nodeBrowser(
    tag: '20',
    resourceRequestMemory: '3Gi',
    resourceLimitMemory: '3Gi'
) {
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

    def platforms = [
      [ browser: 'chrome', provider: 'aws', buckets: 2 ],
      [ browser: 'firefox', provider: 'aws', buckets: 2 ],
      [ browser: 'edge', provider: 'lambdatest' ],
      [ browser: 'chrome', provider: 'lambdatest', os: 'macOS Sonoma' ],
      [ browser: 'firefox', provider: 'lambdatest', os: 'macOS Sonoma' ],
      [ browser: 'safari', provider: 'lambdatest', os: 'macOS Sonoma' ],
      [ browser: 'chrome', provider: 'headless' ]
    ]

    def cleanBranchName = (env.BRANCH_NAME ?: "").split('/').last()
    def testPrefix = "Bedrock_${cleanBranchName}-b${env.BUILD_NUMBER}"

    bedrockLocalBrowsers(
      testDirs: [ 'modules/sample/src/test/ts/**/pass' ]
      custom: '--config modules/sample/tsconfig.json --customRoutes modules/sample/routes.json'
      platforms: platforms,
      prefix: testPrefix
    )

    if (isReleaseBranch()) {
      stage("publish") {
        tinyPods.node() {
          yarnInstall()
          sh 'yarn build'
          tinyNpm.withNpmPublishCredentials {
            // We need to tell git to ignore the changes to .npmrc when publishing
            exec('git update-index --assume-unchanged .npmrc')
            // Re-evaluate whether we still need the `--no-verify-access` flag after upgrading Lerna (TINY-13539)
            exec('yarn lerna publish from-package --yes --no-git-reset --ignore @ephox/bedrock-sample --no-verify-access')
          }
        }
      }
    }
  }
}
