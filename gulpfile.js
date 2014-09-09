"use strict";

var pkg = require('./package.json');

var fs = require("fs");
var util = require("util");

var sequence = require("run-sequence");
var browserify = require("browserify");
var source = require("vinyl-source-stream");

var gulp = require("gulp");
var rimraf = require("gulp-rimraf");
var concat = require("gulp-concat");
var rename = require("gulp-rename");
var replace = require("gulp-replace");
var header = require("gulp-header");
var uglify = require("gulp-uglify");
var jshint = require("gulp-jshint");
var jscs = require("gulp-jscs");

var filenames = {
	shelby: {
		build: "shelby.js",
		debug: util.format("shelby-%s.js", pkg.version),
		minified: util.format("shelby-%s.min.js", pkg.version)
	},
	test: {
		specifications: "test.specifications.js",
		browserify: "test.browserify.js"
	}
};

var folders = {
	build: "build",
	release: "dist"
};

var paths = {
	scripts: {
		library: [
			"lib/*.js"
		],
		src: [
			"src/vars.js",
			"src/utils.js",
			"src/extend.js",
			"src/factory.js",
			"src/parser.js",
			"src/filters.js",
			"src/extender.core.js",
			"src/extender.subscribe.js",
			"src/extender.edit.js",
			"src/extender.utility.js",
			"src/ajax.js",
			"src/mapper.js",
			"src/viewmodel.namespace.js",
			"src/viewmodel.bindable.js",
			"src/viewmodel.disposable.js",
			"src/viewmodel.extendable.js",
			"src/viewmodel.http.js",
			"src/viewmodel.http.notifications.js",
			"src/viewmodel.js",
			"src/viewmodel.component.js"
		],
		test: {
			specifications: [
				"test/utils.js",
				"test/extend.js",
				"test/parser.js",
				"test/extender.core.js",
				"test/extender.subscribe.js",
				"test/extender.edit.js",
				"test/extender.utility.js",
				"test/ajax.js",
				"test/viewmodel.js",
				"test/runner.html.js",
			],
			browsersify: ["./test/exports/browserify.main.js"]
		}
	},
	fragments: {
		pre: ["build/fragments/intro.js"],
		post: ["build/fragments/export.js", "build/fragments/outro.js"],
		banner: "build/fragments/banner.js"
	}
};

gulp.task("clean-build", function() {
	var files = [util.format("%s/*.js", folders.build), util.format("!%s/fragments", folders.build)];

    return gulp
    	.src(files, { read: false })
    	.pipe(rimraf());
});

gulp.task("clean-release", function() {
    return gulp
    	.src(folders.release, { read: false })
    	.pipe(rimraf());
});

gulp.task("build-src-scripts", function() {
	return gulp
		.src(paths.fragments.pre.concat(paths.scripts.src.slice(0)).concat(paths.fragments.post))
		.pipe(concat(filenames.shelby.build, { newLine: "\r\n\r\n" }))
		.pipe(replace("@@VERSION@@", pkg.version))
		.pipe(gulp.dest(folders.build));
});

gulp.task("build-specifications-scripts", function() {
	return gulp
		.src(paths.scripts.test.specifications)
		.pipe(concat(filenames.test.specifications, { newLine: "\r\n\r\n" }))
		.pipe(gulp.dest(folders.build));
});

gulp.task("build-browsersify-tests-scripts", function() {
	return browserify(paths.scripts.test.browsersify)
		.bundle({ debug: true })
      	.pipe(source(filenames.test.browserify))
      	.pipe(gulp.dest(folders.build));
});

gulp.task("build-release-scripts", function() {
	var sourceFile = util.format("%s/%s", folders.build, filenames.shelby.build);
	var banner = util.format("%s%s", fs.readFileSync(paths.fragments.banner), "\r\n\r\n");

	return gulp
		.src(sourceFile)
		.pipe(header(banner, { pkg: pkg }))
		.pipe(rename(filenames.shelby.debug))
		.pipe(gulp.dest(folders.release))
		.pipe(uglify())
		.pipe(header(banner, { pkg: pkg }))
		.pipe(rename(filenames.shelby.minified))
		.pipe(gulp.dest(folders.release));
});

gulp.task("copy-external-libraries-to-release", function() {
	var dest = util.format("%s/lib", folders.release);

	return gulp
 		.src(paths.scripts.library)
 		.pipe(gulp.dest(dest));
});

gulp.task("jscs", function() {
    return gulp
    	.src(paths.scripts.src)
    	.pipe(jscs());
});

gulp.task("lint", function() {
	var reporterOptions = {
		verbose: true,
		reasonCol: "cyan,bold"
	};

	return gulp
    	.src(paths.scripts.src)
        .pipe(jshint())
		.pipe(jshint.reporter("jshint-summary", reporterOptions))
		.pipe(jshint.reporter("fail"));
});

gulp.task("build", function(callback) {
	sequence("clean-build", "build-src-scripts", "build-specifications-scripts", "build-browsersify-tests-scripts", callback);
});

gulp.task("release", function(callback) {
	sequence("clean-release", "lint", "jscs", "build", "build-release-scripts", "copy-external-libraries-to-release", callback);
});

gulp.task("watch", function() {
	gulp.watch(paths.scripts.src.concat(paths.scripts.test.specifications), ["build"]);
});

////////////////////////////////////////////////////////

// Default task
gulp.task("default", function() {
	return gulp.start("release");
});

// Development task
gulp.task("dev", ["build"], function() {
	return gulp.start("watch");
});