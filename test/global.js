(function(undefined) {
    window.dataSampler = {
        alphaNumerics: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
    
        generateString: function(length) {
            var str = "";

            for (var i = 0; i < length; i++)
                str += this.alphaNumerics.charAt(Math.floor(Math.random() * this.alphaNumerics.length));

            return str;
        },

        generateInteger: function(maximum) {
            return Math.floor((Math.random() * maximum) + 1);
        }
    };

    window.isUndefined = function(value) {
        return value === undefined;
    };

    window.isNull = function(value) {
        return window.isUndefined(value) || value === null;
    };
    
    window.hasProperty = function(obj, propertyKey) {
        return propertyKey in obj;
    };
    
    window.areEquals = function(expected, actual) {
        if ((isNull(expected) && !isNull(actual)) || (!isNull(expected) && isNull(actual))) {
            return false;
        }
        
        if ((ko.isObservable(expected) && !ko.isObservable(actual)) || (!ko.isObservable(expected) && ko.isObservable(actual))) {
            return false;
        }
        
        // Make sure that all observables are unwraped.
        expected = ko.toJS(expected);
        actual = ko.toJS(actual);
        
        // Stringify excluded functions so we must do a property count to get more accurate results.
        return keys(expected).length === keys(actual).length && JSON.stringify(expected) === JSON.stringify(actual);
    }
    
    window.keys = function(obj) {
        var propertyKeys = [];
    
        for (var propertyKey in obj) {
            if (obj.hasOwnProperty(propertyKey)) {
                propertyKeys.push(propertyKey);
            }
        }
        
        return propertyKeys;
    }

    window.waits = function(waitFor, timeout, callback) {
        var done = false;

        runs(function() {
            setTimeout(function() {
                done = true;
            }, waitFor);
        });

        waitsFor(function() {
            return done;
        }, "", timeout);

        runs(callback);
    }
})();