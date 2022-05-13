#!groovy
@Library('waluigi@v4.5.0') _

// NOTE: This Jenkinsfile relies on Tiny's internal infrastructure

def isReleaseBranch() {
    // The branch name could be in the BRANCH_NAME or GIT_BRANCH variable depending on the type of job
    def branchName = env.BRANCH_NAME ? env.BRANCH_NAME : env.GIT_BRANCH
    if (branchName =~ ~"release/\\d+\\.x") {
      return true;
    } else {
      // If branch name is null then just assume it's a release branch (which it is for things like regular pipeline builds)
      return branchName == null;
    }
}

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
    custom: '--config modules/sample/tsconfig.json --polyfills Promise Symbol'
  )

  if (isReleaseBranch()) {
    stage("publish") {
      exec('yarn lerna publish from-package --yes --ignore @ephox/bedrock-sample')
    }
  }
}
