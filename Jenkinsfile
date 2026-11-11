#!groovy
@Library('waluigi@release/7') _

// NOTE: This Jenkinsfile relies on Tiny's internal infrastructure

standardProperties()

timestamps {
  tinyPods.nodeBrowser(
    tag: '24',
    resourceRequestMemory: '4Gi',
    resourceLimitMemory: '4Gi'
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
      testDirs: [ 'modules/sample/src/test/ts/**/pass' ],
      custom: '--config modules/sample/tsconfig.json --customRoutes modules/sample/routes.json',
      platforms: platforms,
      prefix: testPrefix
    )
  }
}
