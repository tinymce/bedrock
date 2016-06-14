(function () {
  var div = document.createElement('div');

  var testName = document.createElement('span');
  testName.classList.add('testing');

  var results = document.createElement('textarea');
  results.classList.add('results');
  // results.style.setProperty('visibility', 'hidden');


  var failures = [ ];

  var totalPassed = 0;
  var totalFailed = 0;

  QUnit.log(function (details) {
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
  });

  var currentModule = '';


  testName.innerHTML = 'Test 1';
  div.appendChild(testName);
  // document.body.appendChild(results);


  var sendJson = function (url, data) {
    var request = new XMLHttpRequest();
    request.open('POST', url, true);
    request.setRequestHeader('Content-Type', 'application/json');
    // request.setRequestHeader('dataType', 'json');
    request.setRequestHeader('Accept', 'application/json');
    request.send(JSON.stringify(data));
  };


  document.body.appendChild(div);

  // // alert(10);
  // QUnit.begin(function (details) {
  //   sendJson('/tests/progress', {
  //     test: currentModule,
  //     numPassed: totalPassed,
  //     numFailed: totalFailed,
  //     totalFiles: 100
  //   });
  // });

  QUnit.moduleStart(function (details) {
    // alert('Module start: ' + JSON.stringify(details));
    currentModule = details.name;
  });

  QUnit.testStart(function (details) {
    testName.innerHTML = currentModule + ':' + details.name;
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
    // alert(JSON.stringify(details));
  });

  QUnit.done(function (details) {
    results.innerHTML = JSON.stringify({
      results: failures
    });
    setTimeout(function () {
      div.appendChild(results);
    }, 400);
  });

  setTimeout(function () {

    QUnit.start();
  }, 1000);
})();