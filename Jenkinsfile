properties([
  disableConcurrentBuilds(),
  pipelineTriggers([])
])

node("primary") {
  stage ("Checkout SCM") {
    checkout scm
    sh "mkdir -p jenkins-plumbing"
    dir ("jenkins-plumbing") {
      git([branch: "master", url:'ssh://git@stash:7999/van/jenkins-plumbing.git', credentialsId: '8aa93893-84cc-45fc-a029-a42f21197bb3'])
    }
  }

  def ex = load("jenkins-plumbing/execHandle.groovy")

  def runBuild = load("jenkins-plumbing/standard-build.groovy")

  notifyBitbucket()
  try {
    runBuild({
      def successful = ex("yarn test")
      junit allowEmptyResults: true, testResults: 'scratch/*.xml'

      if (!successful) {
        currentBuild.result = "UNSTABLE"
      } else {
        dir("lib") {
          deleteDir()
        }
        dir("dist") {
          deleteDir()
        }
      }
    })

    // bitbucket plugin requires the result to explicitly be success
    if (currentBuild.resultIsBetterOrEqualTo("SUCCESS")) {
      currentBuild.result = "SUCCESS"
    }
  } catch (err) {
    currentBuild.result = "FAILED"
  }
  notifyBitbucket()
}
