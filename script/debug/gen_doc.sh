#!/bin/bash
mkdir -p doc
api_documents=$1
module_jsons=`ls $1`
module_api="doc/$1_api"

rm -rf  $module_api
echo -e "基础URL：http://www.sunrisin.com:8088\n" >> $module_api
echo -e "统一访问错误回复" >> $module_api
echo -e "{" >> $module_api
echo -e "\t\"errcode\":<int>,     错误码" >> $module_api
echo -e "\t\"errmsg\":<string>     错误描述" >> $module_api
echo -e "}\n" >> $module_api
echo -e "公共头:{" >> $module_api
echo -e "\tx-ua:<int>     1 iPhone 2 iPad 3 android-phone 4 android-pad 5 other\n\tx-sid:<string>     用户sessionid" >> $module_api
echo -e "}\n" >> $module_api

echo -e "path前缀: "${api_documents} >> $module_api
echo -e "" >> $module_api
for api in $module_jsons
do
    cat $1/$api >> $module_api
    echo -e "\n\n" >> $module_api
done
