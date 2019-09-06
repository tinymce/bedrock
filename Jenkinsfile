properties([
  disableConcurrentBuilds(),
  pipelineTriggers([])
])

node("primary") {
  echo "Clean workspace"
  cleanWs()

  stage ("Checkout SCM") {
    checkout scm
    sh "mkdir -p jenkins-plumbing"
    dir ("jenkins-plumbing") {
      git([branch: "master", url:'ssh://git@stash:7999/van/jenkins-plumbing.git', credentialsId: '8aa93893-84cc-45fc-a029-a42f21197bb3'])
    }
  }

  def runBuild = load("jenkins-plumbing/standard-build.groovy")

  notifyBitbucket()
  try {
    runBuild()

    // bitbucket plugin requires the result to explicitly be success
    if (currentBuild.resultIsBetterOrEqualTo("SUCCESS")) {
      currentBuild.result = "SUCCESS"
    }
  } catch (err) {
    currentBuild.result = "FAILED"
  }
  notifyBitbucket()
}
