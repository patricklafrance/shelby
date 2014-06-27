(function($) {
    "use strict";

    $.ajaxSetup({
        cache: true
    });
    
    function runJasmine() {
        var env = jasmine.getEnv();
        env.updateInterval = 250;

        var htmlReporter = new jasmine.HtmlReporter();
        env.addReporter(htmlReporter);

        env.specFilter = function(spec) {
            return htmlReporter.specFilter(spec);
        };

        env.execute();
    }

    $(document).ready(function() {
        runJasmine();
    });
})(jQuery);