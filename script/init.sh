#!/bin/bash
mkdir -p ../view/static/backstage/{multimedia/audio,multimedia/video,multimedia/img,video,other/mailtemplate/,css,js,fonts,common/fonts}
mkdir -p ../view/static/frontend/{app/css,app/fonts,app/js,app/img,app/libs,app/grunt,m/grunt,m/libs,m/css,m/js,m/img,m/fonts,pc/libs,pc/grunt,pc/css,pc/fonts,pc/img,pc/js}
mkdir -p ../view/static/frontend/multimedia/{audio,img,video}
npm install
git clean -x -f