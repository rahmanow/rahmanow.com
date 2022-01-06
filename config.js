module.exports = {
	config: {
		tailwindjs: "./tailwind.config.js",
		port: 9050,
	},
	deploy: {
		gitURL: 'https://github.com/rahmanow/gulp-starter-pack.git',
		gitBranch: 'master',
		gitCommitMessage: '-Auto commit by Gulp',
		surgeUrl: 'same-uncle.surge.sh'
	},
	paths: {
		root: "./",
		src: {
			base: "./src",
			scss: "./src/scss",
			js: "./src/js",
			img: "./src/img"
		},
		dist: {
			base: "./dist",
			css: "./dist/css",
			js: "./dist/js",
			img: "./dist/img"
		},
		build: {
			base: "./build",
			css: "./build/css",
			js: "./build/js",
			img: "./build/img"
		}
	}
}