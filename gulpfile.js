"use strict";

var pkg = require('./package.json');

var fs = require("fs");
var util = require("util");

var gulp = require("gulp");
var clean = require("gulp-clean");
var runSequence = require("run-sequence");
var concat = require("gulp-concat");
var replace = require("gulp-replace");
var header = require("gulp-header");
var uglify = require("gulp-uglify");
var jshint = require("gulp-jshint");
var jscs = require("gulp-jscs");

var folders = {
	build: "dist"
};

var paths = {
	scripts: [
		"src/vars.js",
		"src/utils.js",
		"src/extend.js",
		"src/factory.js",
		"src/parser.js",
		"src/filter.js",
		"src/extender.core.js",
		"src/extender.subscribe.js",
		"src/extender.edit.js",
		"src/extender.utility.js",
		"src/ajax.js",
		"src/mapper.js",
		"src/viewmodel.js",
		"src/mediator.js"
	],
	banner: "src/fragments/banner.js"
};

gulp.task("clean", function() {
    return gulp
    	.src(folders.build, { read: false })
    	.pipe(clean());
});

gulp.task("build-scripts", function() {
	var pre = ["src/fragments/intro.js"];
	var post = ["src/fragments/export.js", "src/fragments/outro.js"];

	var banner = util.format("%s%s", fs.readFileSync(paths.banner), "\r\n\r\n");
	var debugFileName = util.format("shelby-%s.js", pkg.version);
	var minFileName = util.format("shelby-%s.min.js", pkg.version);

	return gulp
		.src(pre.concat(paths.scripts.slice(0)).concat(post))
		.pipe(concat(debugFileName, {newLine: "\r\n\r\n"}))
		.pipe(replace("@@VERSION@@", pkg.version))
		.pipe(header(banner, { pkg: pkg }))
		.pipe(gulp.dest(folders.build))
		.pipe(uglify())
		.pipe(concat(minFileName))
		.pipe(gulp.dest(folders.build));
});

gulp.task("jscs", function() {
    return gulp
    	.src(paths.scripts)
    	.pipe(jscs());
});

gulp.task("lint", function() {
	var reporterOptions = {
		verbose: true,
		reasonCol: "cyan,bold"
	};

	return gulp
    	.src(paths.scripts)
        .pipe(jshint())
		.pipe(jshint.reporter("jshint-summary", reporterOptions))
		.pipe(jshint.reporter("fail"));
});

gulp.task("build", function(callback) {
	runSequence("clean", "lint", "jscs", "build-scripts", callback);
});

gulp.task("watch", function() {
	gulp.watch(paths.scripts, ["build-scripts"]);
});

////////////////////////////////////////////////////////

// Default task
gulp.task("default", function() {
	gulp.start("build");
});

// Development task
gulp.task("dev", ["build-scripts"], function() {
	gulp.start("watch");
});