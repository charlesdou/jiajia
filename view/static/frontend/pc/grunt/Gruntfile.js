module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    meta: {
        sassPath: '../css/_sass/',
        cssSourcePath: '../css/_source/',
        cssPath: '../css/',
        jsSourcePath: '../js/_source/',
        jsPath: '../js/'
    },
    uglify: {
      dist: {
        // options: {
        //   banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
        //     '<%= grunt.template.today("yyyy-mm-dd") %> */'
        // },
        files: {
            '<%=meta.jsPath%>effect.min.js': ['<%=meta.jsSourcePath%>*.js']
        }
      }
    },
    sass:{
      dist: {
        options:{
            style:'compact',
            noCache:true,
            sourcemap:'none'
        },
        files:[{
            expand: true,
            cwd: '<%=meta.sassPath%>',
            src: ['*.scss'],
            dest:'<%=meta.cssSourcePath%>',
            ext:'.css'
        }]
      }
    },
    cssmin: {
      dist: {
        options:{
          compatibility: 'ie8',
          noAdvanced: true
        },
        files: [{
          expand: true,
          cwd: '<%=meta.cssSourcePath%>',
          src: ['*.css'],
          dest: '<%=meta.cssPath%>',
          ext: '.css'
        }]
      }
    },
    watch:{
      uglify:{
        files: ['<%=meta.jsSourcePath%>*.js'],
        tasks: ['uglify']
      },
      sass: {
        files: ['<%=meta.sassPath%>*.scss','<%=meta.sassPath%>**/*.scss','<%=meta.sassPath%>**/**/*.scss'],
        tasks: ['sass']
      },
      cssmin: {
        files: ['<%=meta.cssSourcePath%>*.css'],
        tasks: ['cssmin']
      }
    }
  });
  
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.registerTask('default', ['uglify','sass','cssmin','watch']);
};