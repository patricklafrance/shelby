// Shelby.Filters
// ---------------------------------

(function(namespace, extend, utils) {
    Shelby.Filters = function() {
    };

    Shelby.Filters.prototype = {
        getExtendablePropertyFilter: function() {
            return function(key, value) {
                // Object must be added to the filter, otherwise if they are rejected, their child properties would be ignored.
                return key !== namespace && (ko.isObservable(value) || utils.isObject(value));
            };
        },

        getExtendedPropertyFilter: function() {
            return function(key, value) {
                // Object must be added to the filter, otherwise if they are rejected, their child properties would be ignored.
                return key !== namespace && ((ko.isObservable(value) || utils.isObject(value)) && utils.isImplementingShelby(value));
            };
        },

        getPathFilter: function(includePaths, excludePaths) {
            if ($.isArray(includePaths)) {
                return this._getIncludePathFilter(includePaths);
            }
            else if ($.isArray(excludePaths)) {
                return this._getExcludePathFilter(excludePaths);
            }
            else {
                return this._getDefaultPathFilter();
            }
        },

        _getIncludePathFilter: function(paths) {
            var that = this;
            var evaluators = this._computeEvaluators(paths);

            return function(path) {
                var result = null;
                var hasImperfectMatch = false;

                var comparer = function(evaluator) {
                    result = evaluator(path);

                    // To support any order for the inclusion filters, we loop until we find a perfect 
                    // match. This will support a case where an array item filter is specified before 
                    // an inclusion filter on the array itself.
                    if (result.isValid && !result.isPerfectMatch) {
                        hasImperfectMatch = true;

                        return false;
                    }

                    return result.isValid;
                };

                if (utils.arrayIndexOf(evaluators, path, comparer) === -1) {
                    if (hasImperfectMatch) {
                        return that._createImperfectMatchEvaluationResult();
                    }

                    return that._createInvalidEvaluationResult();
                }

                return result;
            };
        },

        _getExcludePathFilter: function(paths) {
            var that = this;
            var evaluators = this._computeEvaluators(paths);

            return function(path) {
                var comparer = function(evaluator) {
                    var result = evaluator(path);

                    return result.isValid && result.isPerfectMatch;
                };

                if (utils.arrayIndexOf(evaluators, path, comparer) === -1) {
                    return that._createPerfectMatchEvaluationResult();
                }

                return that._createInvalidEvaluationResult();
            };
        },

        _getDefaultPathFilter: function() {
            var that = this;

            return function() {
                return that._createPerfectMatchEvaluationResult();
            };
        },

        _computeEvaluators: function(paths) {
            var that = this;

            return utils.arrayMap(paths, function(path) {
                // If this is a path matching array items, create a function that use a regular expression to match the current paths representing array items properties,
                // otherwise create a function that use the equality operator to match the current paths against the path.
                if (utils.stringEndsWith(path, "/i")) {
                    // Transform "/i" into regex expression [^]+ (means that everything is accepted).
                    var pattern = null;

                    try {
                        pattern = new RegExp(path.replace(/\/i/g, "[^]+"));
                    }
                    catch (e) {
                        // IE8 cause a RegExpError exception when the ']' character is not escaped.
                        pattern = new RegExp(path.replace(/\/i/g, "[^]]+"));
                    }

                    return function(current) {
                        if (pattern.test(current)) {
                            return that._createPerfectMatchEvaluationResult();
                        }
                        else if (that._isArrayPath(path, current)) {
                            return that._createImperfectMatchEvaluationResult();
                        }

                        return that._createInvalidEvaluationResult();
                    };
                }
                else {
                    return function(current) {
                        if (path === current) {
                            return that._createPerfectMatchEvaluationResult();
                        }
                        else if (that._isArrayPath(path, current)) {
                            return that._createImperfectMatchEvaluationResult();
                        }

                        return that._createInvalidEvaluationResult();
                    };
                }
            });
        },

        _createInvalidEvaluationResult: function() {
            return this._createEvaluationResult(false, false);
        },

        _createImperfectMatchEvaluationResult: function() {
            return this._createEvaluationResult(true, false);
        },

        _createPerfectMatchEvaluationResult: function() {
            return this._createEvaluationResult(true, true);
        },

        _createEvaluationResult: function(isValid, isPerfectMatch) {
            return {
                isValid: isValid,
                isPerfectMatch: isPerfectMatch
            };
        },

        _isArrayPath: function(path, current) {
            return path.indexOf(current + "/i") !== -1;
        }
    };

    Shelby.Filters.extend = extend;
})(Shelby.namespace,
   Shelby.extend,
   Shelby.utils);