(function () {
  var div = document.createElement('div');


  div.classList.add('bedrock-qunit');
  div.style.setProperty('visibility', 'hidden');

  var runningTest = document.createElement('span');
  runningTest.classList.add('test', 'running');

  var testName = document.createElement('span');
  testName.classList.add('name');

  var testProgress = document.createElement('span');
  testProgress.classList.add('progress');

  runningTest.appendChild(testName);
  runningTest.appendChild(testProgress);

  div.appendChild(runningTest);

  var results = document.createElement('textarea');
  results.classList.add('results');

  document.body.appendChild(div);


  var failures = [ ];

  var totalPassed = 0;
  var totalFailed = 0;

  var testCounter = 0;

  var logDetails = function (details) {
    if (details.result === false) {

      var message = details.message !== undefined ? details.message : '';
      var expected = details.expected !== undefined ? 'Expected: ' + details.expected +
        ', but Actual: ' + details.actual : '';
      var source = details.source !== undefined ? details.source : '';

      var error = [ message, expected, source ].join('\n');

      failures.push({
        test: details.module + ':' + details.name,
        passed: false,
        error: error
      });
    }
  };



  var currentModule = '';

  var sendJson = function (url, data) {
    var request = new XMLHttpRequest();
    request.open('POST', url, true);
    request.setRequestHeader('Content-Type', 'application/json');
    request.setRequestHeader('Accept', 'application/json');
    request.send(JSON.stringify(data));
  };




  // // alert(10);
  // QUnit.begin(function (details) {
  //   sendJson('/tests/progress', {
  //     test: currentModule,
  //     numPassed: totalPassed,
  //     numFailed: totalFailed,
  //     totalFiles: 100
  //   });
  // });

  QUnit.log(logDetails);

  QUnit.moduleStart(function (details) {
    currentModule = details.name;
  });

  QUnit.testStart(function (details) {
    testCounter++;
    testName.innerHTML = currentModule + ':' + details.name;
    testProgress.innerHTML = testCounter;
  });

  QUnit.moduleDone(function (details) {
    totalPassed += details.passed;
    totalFailed += details.failed;
    sendJson('/tests/progress', {
      test: currentModule,
      numPassed: totalPassed,
      numFailed: totalFailed,
      totalFiles: QUnit.config.stats.all
    });
  });

  QUnit.done(function (details) {
    // Only add the textarea at the end. It seems to interfere with tests.
    div.appendChild(results);
    results.innerHTML = JSON.stringify({
      results: failures
    });
    div.classList.add('done');
  });

  QUnit.start();
})();