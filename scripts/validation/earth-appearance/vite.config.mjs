export default {
 root:'/proof',cacheDir:'/tmp/vite-cache',publicDir:'/proof/public',server:{host:'0.0.0.0',port:4192,strictPort:true,fs:{allow:['/proof','/hub','/source']}},
 resolve:{alias:[{find:/^cesium$/,replacement:'/source/node_modules/cesium/Source/Cesium.js'},{find:/^cesium\/(.*)$/,replacement:'/source/node_modules/cesium/$1'}]},
 define:{CESIUM_BASE_URL:JSON.stringify('/cesium/')},
};
