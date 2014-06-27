/* jshint -W079 */
var Shelby = {};
/* jshint +W079 */

// Current version.
Shelby.version = "@@VERSION@@";

// All extensions are added into a custom "shelby" namespace to avoid poluating the 
// root of objects or observables.
Shelby.namespace = "shelby";

// When true, additional informations will be output to the console.
Shelby.debug = false;