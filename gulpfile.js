"use strict";

var pkg = require('./package.json');

var fs = require("fs");
var util = require("util");

var runSequence = require("run-sequence");

var gulp = require("gulp");
var rimraf = require("gulp-rimraf");
var concat = require("gulp-concat");
var rename = require("gulp-rename");
var replace = require("gulp-replace");
var header = require("gulp-header");
var uglify = require("gulp-uglify");
var jshint = require("gulp-jshint");
var jscs = require("gulp-jscs");
var browserify = require("gulp-browserify");

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
	release: "dist",
	node: {
		modules: "node_modules"
	}
};

var paths = {
	scripts: {
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
			"src/viewmodel.js"
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
			browsersify: ["test/exports/browserify.main.js"],
			node: {
				modules: ["test/exports/node_modules/**/*.js"]
			}
		}
	},
	fragments: {
		pre: ["build/fragments/intro.js"],
		post: ["build/fragments/export.js", "build/fragments/outro.js"],
		banner: "build/fragments/banner.js"
	}
};

gulp.task("clean-build", function() {
	var files = [
		util.format("%s/*.js", folders.build), util.format("!%s/fragments", folders.build),
		util.format("%s/%s", folders.build, folders.node.modules)
	];

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

gulp.task("copy-fake-node-modules", function() {
	var dest = util.format("%s/%s", folders.build, folders.node.modules);

	return gulp
		.src(paths.scripts.test.node.modules)
		.pipe(gulp.dest(dest));
});

gulp.task("build-browsersify-tests-scripts", ["copy-fake-node-modules"], function() {
    return gulp.src(paths.scripts.test.browsersify)
    	.pipe(browserify({ debug : true }))
    	.pipe(rename(filenames.test.browserify))
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
	runSequence("clean-build", "build-src-scripts", "build-specifications-scripts", "build-browsersify-tests-scripts", callback);
});

gulp.task("release", function(callback) {
	runSequence("clean-release", "lint", "jscs", "build", "build-release-scripts", callback);
});

gulp.task("watch", function() {
	gulp.watch(paths.scripts.src, ["build"]);
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