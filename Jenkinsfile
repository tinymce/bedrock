#!groovy
@Library('waluigi@release/7') _

// NOTE: This Jenkinsfile relies on Tiny's internal infrastructure

standardProperties()

timestamps {
  tinyPods.node(
    tag: '20',
    resourceRequestMemory: '2Gi',
    resourceLimitMemory: '2Gi'
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
      [ browser: 'chrome', provider: 'lambdatest', os: 'macOS Sonoma', buckets: 1],
      [ browser: 'edge', provider: 'lambdatest', buckets: 1],
      [ browser: 'chrome', provider: 'aws', buckets: 2 ],
      [ browser: 'firefox', provider: 'aws', buckets: 2 ],
    ]

    def processes = [:]

    def cleanBranchName = (env.BRANCH_NAME ?: "").split('/').last()
    def testPrefix =  "Bedrock_${cleanBranchName}-b${env.BUILD_NUMBER}"


    for ( int i = 0; i < platforms.size(); i++) {
      def platform = platforms.get(i)
      def buckets = platform.buckets ?: 1
      def os = String.valueOf(platform.os).startsWith('mac') ? 'Mac' : 'Win'
      for ( int bucket = 1; bucket <= buckets; bucket++) {
        def c_bucket = bucket
        def suffix = buckets == 1 ? '' : "-${c_bucket}"
        def name = "${os}-${platform.browser}-${platform.provider}${suffix}"
        def testName = "${testPrefix}_${os}-${platform.browser}${suffix}"
        processes[name] = {
          stage("test-${name}") {
            //
            bedrockRemoteTools.tinyWorkSishTunnel()
            bedrockRemoteTools.withRemoteCreds(platform.provider) {
              // run tests
              def customArgs = '--config modules/sample/tsconfig.json --customRoutes modules/sample/routes.json';
              if (platform.provider == 'aws') {
                customArgs = customArgs + " --sishDomain \"sish.osu.tiny.work\""
              }
              if (platform.os) {
                customArgs = customArgs + " --platformName \"${platform.os}\""
              }
              def testDirs = [ 'modules/sample/src/test/ts/**/pass' ]
              def testDirsSsv = testDirs.collect { '"' + it + '"' }.join(' ')
              def bedrockCmd = "yarn bedrock-auto -b \"${platform.browser}\" --remote \"${platform.provider}\" --testdirs ${testDirsSsv} --name \"${testName}\" --bucket \"${c_bucket}\" --buckets \"${buckets}\" ${customArgs}".toString()
              def testStatus = exec(script: bedrockCmd, returnStatus: true)

              junit allowEmptyResults: true, testResults: "scratch/TEST-${name}.xml"
              if (testStatus == 4) {
                unstable("Tests failed for ${name}")
              } else if (testStatus != 0) {
                error("Unexpected error running tests for ${name} so passing failure as exist code")
              }
            }
            //
          }
        }
      }
    }

    parallel(processes)

    stage("publish") {
      if (isReleaseBranch()) {
        echo "Publish?"
        // tinyNpm.withNpmPublishCredentials {
        //   // We need to tell git to ignore the changes to .npmrc when publishing
        //   exec('git update-index --assume-unchanged .npmrc')
        //   // Re-evaluate whether we still need the `--no-verify-access` flag after upgrading Lerna (TINY-13539)
        //   exec('yarn lerna publish from-package --yes --no-git-reset --ignore @ephox/bedrock-sample')
        // }
      } else {
        echo "No release branch: nothing to publish"
      }
    }
  }

  // Testing
  // stage("bedrock testing") {
  //   bedrockRemoteBrowsers(
  //     testContainer: [
  //       resourceRequestMemory: '2Gi',
  //       resourceLimitMemory: '2Gi',
  //     ],
  //     platforms: [
  //       [ browser: 'chrome', provider: 'aws', buckets: 2 ],
  //       [ browser: 'firefox', provider: 'aws', buckets: 2 ],
  //       [ browser: 'edge', provider: 'lambdatest', buckets: 1 ],
  //       [ browser: 'chrome', provider: 'lambdatest', os: 'macOS Sonoma', buckets: 1 ],
  //       [ browser: 'firefox', provider: 'lambdatest', os: 'macOS Sonoma', buckets: 1 ],
  //       [ browser: 'safari', provider: 'lambdatest', os: 'macOS Sonoma', buckets: 1 ],
  //     ],
  //     prepareTests: {
  //       yarnInstall()
  //       sh 'yarn build'
  //     },
  //     testDirs: [ 'modules/sample/src/test/ts/**/pass' ],
  //     custom: '--config modules/sample/tsconfig.json --customRoutes modules/sample/routes.json'
  //   )
  // }

  // Publish
  // if (isReleaseBranch()) {
  //   stage("publish") {
  //     tinyPods.node() {
  //       yarnInstall()
  //       sh 'yarn build'
  //       tinyNpm.withNpmPublishCredentials {
  //         // We need to tell git to ignore the changes to .npmrc when publishing
  //         exec('git update-index --assume-unchanged .npmrc')
  //         // Re-evaluate whether we still need the `--no-verify-access` flag after upgrading Lerna (TINY-13539)
  //         exec('yarn lerna publish from-package --yes --no-git-reset --ignore @ephox/bedrock-sample --no-verify-access')
  //       }
  //     }
  //   }
  // }
}
