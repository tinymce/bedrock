(function () {
	var timeoutExit = function (limit, s) {
		var start = s;

		var hasExpired = function (current) {
			return (current - start) >= limit;
		};

		var reset = function (current) {
			start = current;
		};

		var diff = function (current) {
			return current - start;
		};

		return {
			hasExpired: hasExpired,
			reset: reset,
			diff: diff
		};
	};

	exports.timeoutExit = timeoutExit;

})();