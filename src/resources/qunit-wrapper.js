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

  QUnit.log(function (detail) {
    alert('Fail: ' + JSON.stringify(detail));
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

  // alert(10);
  QUnit.begin(function (details) {
    alert('Beginning');
  });

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
      numFailed: totalFailed
    });
    // alert(JSON.stringify(details));
  });

  QUnit.done(function (details) {
    results.innerHTML = JSON.stringify({
      results: details
    });
    div.appendChild(results);
  });
})();