(function(undefined) { 
    "use strict";

    describe("Shelby.components", function() {
        it("Can get a \"filters\" instance", function() {
            expect(Shelby.components.filters()).not.toBeNull();
        });

        it("Can get a \"propertyExtender\" instance", function() {
            expect(Shelby.components.propertyExtender()).not.toBeNull();
        });

        it("Can get a \"parser\" instance", function() {
            expect(Shelby.components.parser()).not.toBeNull();
        });

        it("Can get a \"ajax\" instance", function() {
            expect(Shelby.components.ajax()).not.toBeNull();
        });

        it("Can get a \"mapper\" instance", function() {
            expect(Shelby.components.mapper()).not.toBeNull();
        });
    });
})();