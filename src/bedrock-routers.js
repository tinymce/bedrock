(function () {
	var server = require('serve-static');
	var base = server('./');

	var routing = function (prefix, source) {
		var router = server(source);


		var matches = function (url) {
			return url.indexOf(prefix) === 0;
		};

		var go = function (request, response, done) {
			request.url = request.url.substring(prefix.length);
			router(request, response, done);
		};

		return {
			matches: matches,
			go: go
		};
	};

	var route = function (routes, request, response, done) {
		request.originalUrl = request.url;
		var match = null;
		for (var i in routes) {
			var candidate = routes[i];
			if (candidate.matches(request.url) && match === null) match = candidate;
		}

		if (match === null) {
			request.url = '/demo/index.html';
			base(request, response, done);
		} else {
			match.go(request, response, done);
		}
	};

	module.exports = {
		routing: routing,
		route: route
	};
})();