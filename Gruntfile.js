module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),

    concat: {
      arale: {
        src: [
          "src/intro.js",
          "src/util.js",
          "src/limiter.js",
          "src/validator.js",
          "src/outro.js"
        ],
        dest: "dist/validator-debug.js"
      }
    }
  })

  grunt.loadTasks("tools/grunt-tasks")
  grunt.loadNpmTasks("grunt-contrib-concat")
  grunt.registerTask("default", ["concat"])

}