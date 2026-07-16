/******/ (function(modules) { // webpackBootstrap
/******/ 	// install a JSONP callback for chunk loading
/******/ 	function webpackJsonpCallback(data) {
/******/ 		var chunkIds = data[0];
/******/ 		var moreModules = data[1];
/******/ 		var executeModules = data[2];
/******/
/******/ 		// add "moreModules" to the modules object,
/******/ 		// then flag all "chunkIds" as loaded and fire callback
/******/ 		var moduleId, chunkId, i = 0, resolves = [];
/******/ 		for(;i < chunkIds.length; i++) {
/******/ 			chunkId = chunkIds[i];
/******/ 			if(Object.prototype.hasOwnProperty.call(installedChunks, chunkId) && installedChunks[chunkId]) {
/******/ 				resolves.push(installedChunks[chunkId][0]);
/******/ 			}
/******/ 			installedChunks[chunkId] = 0;
/******/ 		}
/******/ 		for(moduleId in moreModules) {
/******/ 			if(Object.prototype.hasOwnProperty.call(moreModules, moduleId)) {
/******/ 				modules[moduleId] = moreModules[moduleId];
/******/ 			}
/******/ 		}
/******/ 		if(parentJsonpFunction) parentJsonpFunction(data);
/******/
/******/ 		while(resolves.length) {
/******/ 			resolves.shift()();
/******/ 		}
/******/
/******/ 		// add entry modules from loaded chunk to deferred list
/******/ 		deferredModules.push.apply(deferredModules, executeModules || []);
/******/
/******/ 		// run deferred modules when all chunks ready
/******/ 		return checkDeferredModules();
/******/ 	};
/******/ 	function checkDeferredModules() {
/******/ 		var result;
/******/ 		for(var i = 0; i < deferredModules.length; i++) {
/******/ 			var deferredModule = deferredModules[i];
/******/ 			var fulfilled = true;
/******/ 			for(var j = 1; j < deferredModule.length; j++) {
/******/ 				var depId = deferredModule[j];
/******/ 				if(installedChunks[depId] !== 0) fulfilled = false;
/******/ 			}
/******/ 			if(fulfilled) {
/******/ 				deferredModules.splice(i--, 1);
/******/ 				result = __webpack_require__(__webpack_require__.s = deferredModule[0]);
/******/ 			}
/******/ 		}
/******/
/******/ 		return result;
/******/ 	}
/******/
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// object to store loaded and loading chunks
/******/ 	// undefined = chunk not loaded, null = chunk preloaded/prefetched
/******/ 	// Promise = chunk loading, 0 = chunk loaded
/******/ 	var installedChunks = {
/******/ 		"app": 0
/******/ 	};
/******/
/******/ 	var deferredModules = [];
/******/
/******/ 	// script path function
/******/ 	function jsonpScriptSrc(chunkId) {
/******/ 		return __webpack_require__.p + "js/" + ({}[chunkId]||chunkId) + "." + {"chunk-2d2253ec":"1c11398a"}[chunkId] + ".js"
/******/ 	}
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/ 	// This file contains only the entry chunk.
/******/ 	// The chunk loading function for additional chunks
/******/ 	__webpack_require__.e = function requireEnsure(chunkId) {
/******/ 		var promises = [];
/******/
/******/
/******/ 		// JSONP chunk loading for javascript
/******/
/******/ 		var installedChunkData = installedChunks[chunkId];
/******/ 		if(installedChunkData !== 0) { // 0 means "already installed".
/******/
/******/ 			// a Promise means "currently loading".
/******/ 			if(installedChunkData) {
/******/ 				promises.push(installedChunkData[2]);
/******/ 			} else {
/******/ 				// setup Promise in chunk cache
/******/ 				var promise = new Promise(function(resolve, reject) {
/******/ 					installedChunkData = installedChunks[chunkId] = [resolve, reject];
/******/ 				});
/******/ 				promises.push(installedChunkData[2] = promise);
/******/
/******/ 				// start chunk loading
/******/ 				var script = document.createElement('script');
/******/ 				var onScriptComplete;
/******/
/******/ 				script.charset = 'utf-8';
/******/ 				script.timeout = 120;
/******/ 				if (__webpack_require__.nc) {
/******/ 					script.setAttribute("nonce", __webpack_require__.nc);
/******/ 				}
/******/ 				script.src = jsonpScriptSrc(chunkId);
/******/
/******/ 				// create error before stack unwound to get useful stacktrace later
/******/ 				var error = new Error();
/******/ 				onScriptComplete = function (event) {
/******/ 					// avoid mem leaks in IE.
/******/ 					script.onerror = script.onload = null;
/******/ 					clearTimeout(timeout);
/******/ 					var chunk = installedChunks[chunkId];
/******/ 					if(chunk !== 0) {
/******/ 						if(chunk) {
/******/ 							var errorType = event && (event.type === 'load' ? 'missing' : event.type);
/******/ 							var realSrc = event && event.target && event.target.src;
/******/ 							error.message = 'Loading chunk ' + chunkId + ' failed.\n(' + errorType + ': ' + realSrc + ')';
/******/ 							error.name = 'ChunkLoadError';
/******/ 							error.type = errorType;
/******/ 							error.request = realSrc;
/******/ 							chunk[1](error);
/******/ 						}
/******/ 						installedChunks[chunkId] = undefined;
/******/ 					}
/******/ 				};
/******/ 				var timeout = setTimeout(function(){
/******/ 					onScriptComplete({ type: 'timeout', target: script });
/******/ 				}, 120000);
/******/ 				script.onerror = script.onload = onScriptComplete;
/******/ 				document.head.appendChild(script);
/******/ 			}
/******/ 		}
/******/ 		return Promise.all(promises);
/******/ 	};
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "/oras-sky-engine/";
/******/
/******/ 	// on error function for async loading
/******/ 	__webpack_require__.oe = function(err) { console.error(err); throw err; };
/******/
/******/ 	var jsonpArray = this["webpackJsonp"] = this["webpackJsonp"] || [];
/******/ 	var oldJsonpFunction = jsonpArray.push.bind(jsonpArray);
/******/ 	jsonpArray.push = webpackJsonpCallback;
/******/ 	jsonpArray = jsonpArray.slice();
/******/ 	for(var i = 0; i < jsonpArray.length; i++) webpackJsonpCallback(jsonpArray[i]);
/******/ 	var parentJsonpFunction = oldJsonpFunction;
/******/
/******/
/******/ 	// add entry module to deferred list
/******/ 	deferredModules.push([0,"chunk-vendors"]);
/******/ 	// run deferred modules when ready
/******/ 	return checkDeferredModules();
/******/ })
/************************************************************************/
/******/ ({

/***/ 0:
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__("56d7");


/***/ }),

/***/ "00b8":
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__.p + "img/btn-cst-art.e7785b5a.svg";

/***/ }),

/***/ "034f":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var _node_modules_mini_css_extract_plugin_dist_loader_js_ref_7_oneOf_1_0_node_modules_css_loader_dist_cjs_js_ref_7_oneOf_1_1_node_modules_vue_loader_lib_loaders_stylePostLoader_js_node_modules_postcss_loader_src_index_js_ref_7_oneOf_1_2_node_modules_cache_loader_dist_cjs_js_ref_1_0_node_modules_vue_loader_lib_index_js_vue_loader_options_App_vue_vue_type_style_index_0_lang_css___WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("85ec");
/* harmony import */ var _node_modules_mini_css_extract_plugin_dist_loader_js_ref_7_oneOf_1_0_node_modules_css_loader_dist_cjs_js_ref_7_oneOf_1_1_node_modules_vue_loader_lib_loaders_stylePostLoader_js_node_modules_postcss_loader_src_index_js_ref_7_oneOf_1_2_node_modules_cache_loader_dist_cjs_js_ref_1_0_node_modules_vue_loader_lib_index_js_vue_loader_options_App_vue_vue_type_style_index_0_lang_css___WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_mini_css_extract_plugin_dist_loader_js_ref_7_oneOf_1_0_node_modules_css_loader_dist_cjs_js_ref_7_oneOf_1_1_node_modules_vue_loader_lib_loaders_stylePostLoader_js_node_modules_postcss_loader_src_index_js_ref_7_oneOf_1_2_node_modules_cache_loader_dist_cjs_js_ref_1_0_node_modules_vue_loader_lib_index_js_vue_loader_options_App_vue_vue_type_style_index_0_lang_css___WEBPACK_IMPORTED_MODULE_0__);
/* unused harmony reexport * */


/***/ }),

/***/ "0bbb":
/***/ (function(module, exports, __webpack_require__) {

// extracted by mini-css-extract-plugin

/***/ }),

/***/ "0c3e":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var _node_modules_mini_css_extract_plugin_dist_loader_js_ref_7_oneOf_1_0_node_modules_css_loader_dist_cjs_js_ref_7_oneOf_1_1_node_modules_vue_loader_lib_loaders_stylePostLoader_js_node_modules_postcss_loader_src_index_js_ref_7_oneOf_1_2_node_modules_cache_loader_dist_cjs_js_ref_1_0_node_modules_vue_loader_lib_index_js_vue_loader_options_planets_visibility_vue_vue_type_style_index_0_lang_css___WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("24fc");
/* harmony import */ var _node_modules_mini_css_extract_plugin_dist_loader_js_ref_7_oneOf_1_0_node_modules_css_loader_dist_cjs_js_ref_7_oneOf_1_1_node_modules_vue_loader_lib_loaders_stylePostLoader_js_node_modules_postcss_loader_src_index_js_ref_7_oneOf_1_2_node_modules_cache_loader_dist_cjs_js_ref_1_0_node_modules_vue_loader_lib_index_js_vue_loader_options_planets_visibility_vue_vue_type_style_index_0_lang_css___WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_mini_css_extract_plugin_dist_loader_js_ref_7_oneOf_1_0_node_modules_css_loader_dist_cjs_js_ref_7_oneOf_1_1_node_modules_vue_loader_lib_loaders_stylePostLoader_js_node_modules_postcss_loader_src_index_js_ref_7_oneOf_1_2_node_modules_cache_loader_dist_cjs_js_ref_1_0_node_modules_vue_loader_lib_index_js_vue_loader_options_planets_visibility_vue_vue_type_style_index_0_lang_css___WEBPACK_IMPORTED_MODULE_0__);
/* unused harmony reexport * */


/***/ }),

/***/ "0ff8":
/***/ (function(module, exports, __webpack_require__) {

// extracted by mini-css-extract-plugin

/***/ }),

/***/ "13ba":
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__.p + "img/btn-night-mode.bc3006ed.svg";

/***/ }),

/***/ "1541":
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__.p + "img/btn-equatorial-grid.37de933f.svg";

/***/ }),

/***/ "1640":
/***/ (function(module, exports) {

function webpackEmptyContext(req) {
	var e = new Error("Cannot find module '" + req + "'");
	e.code = 'MODULE_NOT_FOUND';
	throw e;
}
webpackEmptyContext.keys = function() { return []; };
webpackEmptyContext.resolve = webpackEmptyContext;
module.exports = webpackEmptyContext;
webpackEmptyContext.id = "1640";

/***/ }),

/***/ "202c":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var _node_modules_mini_css_extract_plugin_dist_loader_js_ref_7_oneOf_1_0_node_modules_css_loader_dist_cjs_js_ref_7_oneOf_1_1_node_modules_vue_loader_lib_loaders_stylePostLoader_js_node_modules_postcss_loader_src_index_js_ref_7_oneOf_1_2_node_modules_cache_loader_dist_cjs_js_ref_1_0_node_modules_vue_loader_lib_index_js_vue_loader_options_selected_object_info_vue_vue_type_style_index_0_lang_css___WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("b7a9");
/* harmony import */ var _node_modules_mini_css_extract_plugin_dist_loader_js_ref_7_oneOf_1_0_node_modules_css_loader_dist_cjs_js_ref_7_oneOf_1_1_node_modules_vue_loader_lib_loaders_stylePostLoader_js_node_modules_postcss_loader_src_index_js_ref_7_oneOf_1_2_node_modules_cache_loader_dist_cjs_js_ref_1_0_node_modules_vue_loader_lib_index_js_vue_loader_options_selected_object_info_vue_vue_type_style_index_0_lang_css___WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_mini_css_extract_plugin_dist_loader_js_ref_7_oneOf_1_0_node_modules_css_loader_dist_cjs_js_ref_7_oneOf_1_1_node_modules_vue_loader_lib_loaders_stylePostLoader_js_node_modules_postcss_loader_src_index_js_ref_7_oneOf_1_2_node_modules_cache_loader_dist_cjs_js_ref_1_0_node_modules_vue_loader_lib_index_js_vue_loader_options_selected_object_info_vue_vue_type_style_index_0_lang_css___WEBPACK_IMPORTED_MODULE_0__);
/* unused harmony reexport * */


/***/ }),

/***/ "2435":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var _node_modules_mini_css_extract_plugin_dist_loader_js_ref_7_oneOf_1_0_node_modules_css_loader_dist_cjs_js_ref_7_oneOf_1_1_node_modules_vue_loader_lib_loaders_stylePostLoader_js_node_modules_postcss_loader_src_index_js_ref_7_oneOf_1_2_node_modules_cache_loader_dist_cjs_js_ref_1_0_node_modules_vue_loader_lib_index_js_vue_loader_options_bottom_button_vue_vue_type_style_index_0_lang_css___WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("e0fc");
/* harmony import */ var _node_modules_mini_css_extract_plugin_dist_loader_js_ref_7_oneOf_1_0_node_modules_css_loader_dist_cjs_js_ref_7_oneOf_1_1_node_modules_vue_loader_lib_loaders_stylePostLoader_js_node_modules_postcss_loader_src_index_js_ref_7_oneOf_1_2_node_modules_cache_loader_dist_cjs_js_ref_1_0_node_modules_vue_loader_lib_index_js_vue_loader_options_bottom_button_vue_vue_type_style_index_0_lang_css___WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_mini_css_extract_plugin_dist_loader_js_ref_7_oneOf_1_0_node_modules_css_loader_dist_cjs_js_ref_7_oneOf_1_1_node_modules_vue_loader_lib_loaders_stylePostLoader_js_node_modules_postcss_loader_src_index_js_ref_7_oneOf_1_2_node_modules_cache_loader_dist_cjs_js_ref_1_0_node_modules_vue_loader_lib_index_js_vue_loader_options_bottom_button_vue_vue_type_style_index_0_lang_css___WEBPACK_IMPORTED_MODULE_0__);
/* unused harmony reexport * */


/***/ }),

/***/ "24fc":
/***/ (function(module, exports, __webpack_require__) {

// extracted by mini-css-extract-plugin

/***/ }),

/***/ "3617":
/***/ (function(module, exports, __webpack_require__) {

// extracted by mini-css-extract-plugin

/***/ }),

/***/ "3658":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var _node_modules_mini_css_extract_plugin_dist_loader_js_ref_7_oneOf_1_0_node_modules_css_loader_dist_cjs_js_ref_7_oneOf_1_1_node_modules_vue_loader_lib_loaders_stylePostLoader_js_node_modules_postcss_loader_src_index_js_ref_7_oneOf_1_2_node_modules_cache_loader_dist_cjs_js_ref_1_0_node_modules_vue_loader_lib_index_js_vue_loader_options_toolbar_vue_vue_type_style_index_0_lang_css___WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("5a9f");
/* harmony import */ var _node_modules_mini_css_extract_plugin_dist_loader_js_ref_7_oneOf_1_0_node_modules_css_loader_dist_cjs_js_ref_7_oneOf_1_1_node_modules_vue_loader_lib_loaders_stylePostLoader_js_node_modules_postcss_loader_src_index_js_ref_7_oneOf_1_2_node_modules_cache_loader_dist_cjs_js_ref_1_0_node_modules_vue_loader_lib_index_js_vue_loader_options_toolbar_vue_vue_type_style_index_0_lang_css___WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_mini_css_extract_plugin_dist_loader_js_ref_7_oneOf_1_0_node_modules_css_loader_dist_cjs_js_ref_7_oneOf_1_1_node_modules_vue_loader_lib_loaders_stylePostLoader_js_node_modules_postcss_loader_src_index_js_ref_7_oneOf_1_2_node_modules_cache_loader_dist_cjs_js_ref_1_0_node_modules_vue_loader_lib_index_js_vue_loader_options_toolbar_vue_vue_type_style_index_0_lang_css___WEBPACK_IMPORTED_MODULE_0__);
/* unused harmony reexport * */


/***/ }),

/***/ "395a":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";

// EXPORTS
__webpack_require__.d(__webpack_exports__, "a", function() { return /* reexport */ render; });
__webpack_require__.d(__webpack_exports__, "b", function() { return /* reexport */ staticRenderFns; });

// CONCATENATED MODULE: ./node_modules/cache-loader/dist/cjs.js?{"cacheDirectory":"node_modules/.cache/vue-loader","cacheIdentifier":"dec867b4-vue-loader-template"}!./node_modules/vue-loader/lib/loaders/templateLoader.js??vue-loader-options!./node_modules/cache-loader/dist/cjs.js??ref--1-0!./node_modules/vue-loader/lib??vue-loader-options!./src/components/data-credits-dialog.vue?vue&type=template&id=48f464ef&
var render = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('v-dialog',{attrs:{"scrollable":"","max-width":"600"},model:{value:(_vm.$store.state.showDataCreditsDialog),callback:function ($$v) {_vm.$set(_vm.$store.state, "showDataCreditsDialog", $$v)},expression:"$store.state.showDataCreditsDialog"}},[(_vm.$store.state.showDataCreditsDialog)?_c('v-card',[_c('v-card-title',[_c('div',{staticClass:"text-h5"},[_vm._v("Data Credits")])]),_c('v-card-text',{staticStyle:{"height":"600px"}},[_c('h3',[_vm._v("Stars")]),_c('p',[_vm._v("Combination of the following catalogues: "),_c('ul',{staticClass:"data-credits"},[_c('li',[_vm._v("Gaia DR2: "),_c('i',[_vm._v("This work has made use of data from the European Space Agency (ESA) mission Gaia ("),_c('a',{attrs:{"href":"https://www.cosmos.esa.int/gaia","target":"_blank","rel":"noopener"}},[_vm._v("https://www.cosmos.esa.int/gaia")]),_vm._v("), processed by the Gaia Data Processing and Analysis Consortium (DPAC, "),_c('a',{attrs:{"href":"https://www.cosmos.esa.int/web/gaia/dpac/consortium","target":"_blank","rel":"noopener"}},[_vm._v("https://www.cosmos.esa.int/web/gaia/dpac/consortium")]),_vm._v("). Funding for the DPAC has been provided by national institutions, in particular the institutions participating in the Gaia Multilateral Agreement.")]),_c('br'),_vm._v("Gaia Collaboration et al. ("),_c('a',{attrs:{"href":"https://gea.esac.esa.int/archive/documentation/GDR2/bib.html#bib173","target":"_blank","rel":"noopener"}},[_vm._v("2016")]),_vm._v("): Description of the Gaia mission (spacecraft, instruments, survey and measurement principles, and operations) "),_c('br'),_vm._v("Gaia Collaboration et al. ("),_c('a',{attrs:{"href":"https://gea.esac.esa.int/archive/documentation/GDR2/bib.html#bib15","target":"_blank","rel":"noopener"}},[_vm._v("2018b")]),_vm._v("): Summary of the contents and survey properties. ")]),_c('li',[_vm._v("Hipparcos: The Hipparcos star catalog From ESA (European Space Agency) and the Hipparcos mission."),_c('br'),_vm._v(" ref. ESA, 1997, The Hipparcos and Tycho Catalogues, ESA SP-1200 "),_c('a',{attrs:{"href":"http://cdsweb.u-strasbg.fr/ftp/cats/I/239","target":"_blank","rel":"noopener"}},[_vm._v("http://cdsweb.u-strasbg.fr/ftp/cats/I/239")])]),_c('li',[_vm._v("Brigh Stars Catalogue: Bright Star Catalogue, 5th Revised Ed. (Hoffleit+, 1991)"),_c('br'),_c('a',{attrs:{"href":"http://cdsarc.u-strasbg.fr/ftp/pub/cats/V/50/","target":"_blank","rel":"noopener"}},[_vm._v("http://cdsarc.u-strasbg.fr/ftp/pub/cats/V/50/")])])])]),_c('h3',[_vm._v("Deep Sky Objects")]),_c('p',[_vm._v("Combination of the following catalogues: "),_c('ul',{staticClass:"data-credits"},[_c('li',[_vm._v("HyperLeda database, "),_c('i',[_vm._v("Makarov et al.")]),_vm._v(" "),_c('a',{attrs:{"href":"http://adsabs.harvard.edu/abs/2014A%26A...570A..13M","target":"_blank","rel":"noopener"}},[_vm._v("2014, A&A, 570, A13")]),_vm._v(": "),_c('a',{attrs:{"href":"http://leda.univ-lyon1.fr","target":"_blank","rel":"noopener"}},[_vm._v("http://leda.univ-lyon1.fr")]),_vm._v(".")]),_c('li',[_vm._v("Queries from Simbad, especially for the objects cross matching: "),_c('i',[_vm._v("This research has made use of the SIMBAD database, operated at CDS, Strasbourg, France ")]),_c('br'),_c('a',{attrs:{"href":"http://adsabs.harvard.edu/abs/2000A%26AS..143....9W","target":"_blank","rel":"noopener"}},[_vm._v("2000,A&AS,143,9")]),_vm._v(", \"The SIMBAD astronomical database\", Wenger et al.")]),_c('li',[_vm._v("Open NGC Database: Mattia Verga "),_c('a',{attrs:{"href":"https://github.com/mattiaverga/OpenNGC","target":"_blank","rel":"noopener"}},[_vm._v("https://github.com/mattiaverga/OpenNGC")])]),_c('li',[_vm._v("Caldwell Catalogue: "),_c('a',{attrs:{"href":"https://fr.wikipedia.org/wiki/Liste_des_objets_de_Caldwell","target":"_blank","rel":"noopener"}},[_vm._v("from wikipedia")])]),_c('li',[_vm._v("Descriptions and some data taken from wikipedia")])])]),_c('h3',[_vm._v("Background Image")]),_c('p',[_vm._v("Digitized Sky Survey: "),_c('ul',{staticClass:"data-credits"},[_c('li',[_vm._v("STScI/NASA "),_c('a',{attrs:{"href":"http://archive.stsci.edu/dss/copyright.html","target":"_blank","rel":"noopener"}},[_vm._v("http://archive.stsci.edu/dss/copyright.html")]),_vm._v(", Colored & Healpixed by CDS. This HiPS survey is based on 2 others HiPS surveys, respectively DSS2-red and DSS2-blue HiPS, both of them directly generated from original scanned plates downloaded from STScI site. The red component has been built from POSS-II F, AAO-SES,SR and SERC-ER plates. The blue component has been build from POSS-II J and SERC-J,EJ. The green component is based on the mean of other components. Three missing plates from red survey (253, 260, 359) has been replaced by pixels from the DSSColor STScI jpeg survey. The 11 missing blue plates (mainly in galactic plane) have not been replaced (only red component).")]),_c('li',[_c('i',[_vm._v("The Digitized Sky Surveys were produced at the Space Telescope Science Institute under U.S. Government grant NAG W-2166. The images of these surveys are based on photographic data obtained using the Oschin Schmidt Telescope on Palomar Mountain and the UK Schmidt Telescope. The plates were processed into the present compressed digital form with the permission of these institutions. The National Geographic Society - Palomar Observatory Sky Atlas (POSS-I) was made by the California Institute of Technology with grants from the National Geographic Society. The Second Palomar Observatory Sky Survey (POSS-II) was made by the California Institute of Technology with funds from the National Science Foundation, the National Geographic Society, the Sloan Foundation, the Samuel Oschin Foundation, and the Eastman Kodak Corporation. The Oschin Schmidt Telescope is operated by the California Institute of Technology and Palomar Observatory. The UK Schmidt Telescope was operated by the Royal Observatory Edinburgh, with funding from the UK Science and Engineering Research Council (later the UK Particle Physics and Astronomy Research Council), until 1988 June, and thereafter by the Anglo-Australian Observatory. The blue plates of the southern Sky Atlas and its Equatorial Extension (together known as the SERC-J), as well as the Equatorial Red (ER), and the Second Epoch [red] Survey (SES) were all taken with the UK Schmidt. Supplemental funding for sky-survey work at the ST ScI is provided by the European Southern Observatory.")])])])]),_c('h3',[_vm._v("Planets Image")]),_c('p',[_vm._v("All images from NASA & JPL under public domain license: "),_c('a',{attrs:{"href":"http://www.jpl.nasa.gov/images/policy/index.cfm","target":"_blank","rel":"noopener"}},[_vm._v("http://www.jpl.nasa.gov/images/policy/index.cfm")])]),_c('p',[_c('br')]),_c('h3',[_vm._v("Minor Planets")]),_c('p',[_vm._v("All data comes from the IAU Minor Planet Center "),_c('a',{attrs:{"href":"https://www.minorplanetcenter.net/data","target":"_blank","rel":"noopener"}},[_vm._v("https://www.minorplanetcenter.net/data")]),_vm._v(". "),_c('i',[_vm._v("This research has made use of data and/or services provided by the International Astronomical Union's Minor Planet Center.")])]),_c('h3',[_vm._v("Others")]),_c('p',[_vm._v("Landscape images by Fabien Chereau")]),_c('p',[_vm._v("Constellation lines by Fabien Chereau")]),_c('p',[_vm._v("All other graphics by "),_c('a',{attrs:{"href":"https://stellarium-labs.com","target":"_blank","rel":"noopener"}},[_vm._v("Stellarium Labs")])])]),_c('v-card-actions',[_c('v-spacer'),_c('v-btn',{staticClass:"blue--text darken-1",attrs:{"text":""},nativeOn:{"click":function($event){_vm.$store.state.showDataCreditsDialog = false}}},[_vm._v("Close")])],1)],1):_vm._e()],1)}
var staticRenderFns = []


// CONCATENATED MODULE: ./src/components/data-credits-dialog.vue?vue&type=template&id=48f464ef&


/***/ }),

/***/ "3cdf":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var _node_modules_mini_css_extract_plugin_dist_loader_js_ref_7_oneOf_1_0_node_modules_css_loader_dist_cjs_js_ref_7_oneOf_1_1_node_modules_vue_loader_lib_loaders_stylePostLoader_js_node_modules_postcss_loader_src_index_js_ref_7_oneOf_1_2_node_modules_cache_loader_dist_cjs_js_ref_1_0_node_modules_vue_loader_lib_index_js_vue_loader_options_date_time_picker_vue_vue_type_style_index_0_lang_css___WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("76c2");
/* harmony import */ var _node_modules_mini_css_extract_plugin_dist_loader_js_ref_7_oneOf_1_0_node_modules_css_loader_dist_cjs_js_ref_7_oneOf_1_1_node_modules_vue_loader_lib_loaders_stylePostLoader_js_node_modules_postcss_loader_src_index_js_ref_7_oneOf_1_2_node_modules_cache_loader_dist_cjs_js_ref_1_0_node_modules_vue_loader_lib_index_js_vue_loader_options_date_time_picker_vue_vue_type_style_index_0_lang_css___WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_mini_css_extract_plugin_dist_loader_js_ref_7_oneOf_1_0_node_modules_css_loader_dist_cjs_js_ref_7_oneOf_1_1_node_modules_vue_loader_lib_loaders_stylePostLoader_js_node_modules_postcss_loader_src_index_js_ref_7_oneOf_1_2_node_modules_cache_loader_dist_cjs_js_ref_1_0_node_modules_vue_loader_lib_index_js_vue_loader_options_date_time_picker_vue_vue_type_style_index_0_lang_css___WEBPACK_IMPORTED_MODULE_0__);
/* unused harmony reexport * */


/***/ }),

/***/ "41a1":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var _data_credits_dialog_vue_vue_type_template_id_48f464ef___WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("395a");
/* harmony import */ var _data_credits_dialog_vue_vue_type_script_lang_js___WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__("9531");
/* harmony import */ var _data_credits_dialog_vue_vue_type_style_index_0_lang_css___WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__("6142");
/* harmony import */ var _node_modules_vue_loader_lib_runtime_componentNormalizer_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__("2877");
/* harmony import */ var _node_modules_vuetify_loader_lib_runtime_installComponents_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__("6544");
/* harmony import */ var _node_modules_vuetify_loader_lib_runtime_installComponents_js__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_node_modules_vuetify_loader_lib_runtime_installComponents_js__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var vuetify_lib_components_VBtn__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__("8336");
/* harmony import */ var vuetify_lib_components_VCard__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__("b0af");
/* harmony import */ var vuetify_lib_components_VCard__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__("99d9");
/* harmony import */ var vuetify_lib_components_VDialog__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__("169a");
/* harmony import */ var vuetify_lib_components_VGrid__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__("2fa4");






/* normalize component */

var component = Object(_node_modules_vue_loader_lib_runtime_componentNormalizer_js__WEBPACK_IMPORTED_MODULE_3__[/* default */ "a"])(
  _data_credits_dialog_vue_vue_type_script_lang_js___WEBPACK_IMPORTED_MODULE_1__["default"],
  _data_credits_dialog_vue_vue_type_template_id_48f464ef___WEBPACK_IMPORTED_MODULE_0__[/* render */ "a"],
  _data_credits_dialog_vue_vue_type_template_id_48f464ef___WEBPACK_IMPORTED_MODULE_0__[/* staticRenderFns */ "b"],
  false,
  null,
  null,
  null
  
)

/* harmony default export */ __webpack_exports__["default"] = (component.exports);

/* vuetify-loader */








_node_modules_vuetify_loader_lib_runtime_installComponents_js__WEBPACK_IMPORTED_MODULE_4___default()(component, {VBtn: vuetify_lib_components_VBtn__WEBPACK_IMPORTED_MODULE_5__[/* default */ "a"],VCard: vuetify_lib_components_VCard__WEBPACK_IMPORTED_MODULE_6__[/* default */ "a"],VCardActions: vuetify_lib_components_VCard__WEBPACK_IMPORTED_MODULE_7__[/* VCardActions */ "a"],VCardText: vuetify_lib_components_VCard__WEBPACK_IMPORTED_MODULE_7__[/* VCardText */ "c"],VCardTitle: vuetify_lib_components_VCard__WEBPACK_IMPORTED_MODULE_7__[/* VCardTitle */ "d"],VDialog: vuetify_lib_components_VDialog__WEBPACK_IMPORTED_MODULE_8__[/* default */ "a"],VSpacer: vuetify_lib_components_VGrid__WEBPACK_IMPORTED_MODULE_9__[/* default */ "a"]})


/***/ }),

/***/ "4654":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var _node_modules_mini_css_extract_plugin_dist_loader_js_ref_7_oneOf_1_0_node_modules_css_loader_dist_cjs_js_ref_7_oneOf_1_1_node_modules_vue_loader_lib_loaders_stylePostLoader_js_node_modules_postcss_loader_src_index_js_ref_7_oneOf_1_2_node_modules_cache_loader_dist_cjs_js_ref_1_0_node_modules_vue_loader_lib_index_js_vue_loader_options_target_search_vue_vue_type_style_index_0_lang_css___WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("c885");
/* harmony import */ var _node_modules_mini_css_extract_plugin_dist_loader_js_ref_7_oneOf_1_0_node_modules_css_loader_dist_cjs_js_ref_7_oneOf_1_1_node_modules_vue_loader_lib_loaders_stylePostLoader_js_node_modules_postcss_loader_src_index_js_ref_7_oneOf_1_2_node_modules_cache_loader_dist_cjs_js_ref_1_0_node_modules_vue_loader_lib_index_js_vue_loader_options_target_search_vue_vue_type_style_index_0_lang_css___WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_mini_css_extract_plugin_dist_loader_js_ref_7_oneOf_1_0_node_modules_css_loader_dist_cjs_js_ref_7_oneOf_1_1_node_modules_vue_loader_lib_loaders_stylePostLoader_js_node_modules_postcss_loader_src_index_js_ref_7_oneOf_1_2_node_modules_cache_loader_dist_cjs_js_ref_1_0_node_modules_vue_loader_lib_index_js_vue_loader_options_target_search_vue_vue_type_style_index_0_lang_css___WEBPACK_IMPORTED_MODULE_0__);
/* unused harmony reexport * */


/***/ }),

/***/ "4678":
/***/ (function(module, exports, __webpack_require__) {

var map = {
	"./af": "2bfb",
	"./af.js": "2bfb",
	"./ar": "8e73",
	"./ar-dz": "a356",
	"./ar-dz.js": "a356",
	"./ar-kw": "423e",
	"./ar-kw.js": "423e",
	"./ar-ly": "1cfd",
	"./ar-ly.js": "1cfd",
	"./ar-ma": "0a84",
	"./ar-ma.js": "0a84",
	"./ar-sa": "8230",
	"./ar-sa.js": "8230",
	"./ar-tn": "6d83",
	"./ar-tn.js": "6d83",
	"./ar.js": "8e73",
	"./az": "485c",
	"./az.js": "485c",
	"./be": "1fc1",
	"./be.js": "1fc1",
	"./bg": "84aa",
	"./bg.js": "84aa",
	"./bm": "a7fa",
	"./bm.js": "a7fa",
	"./bn": "9043",
	"./bn-bd": "9686",
	"./bn-bd.js": "9686",
	"./bn.js": "9043",
	"./bo": "d26a",
	"./bo.js": "d26a",
	"./br": "6887",
	"./br.js": "6887",
	"./bs": "2554",
	"./bs.js": "2554",
	"./ca": "d716",
	"./ca.js": "d716",
	"./cs": "3c0d",
	"./cs.js": "3c0d",
	"./cv": "03ec",
	"./cv.js": "03ec",
	"./cy": "9797",
	"./cy.js": "9797",
	"./da": "0f14",
	"./da.js": "0f14",
	"./de": "b469",
	"./de-at": "b3eb",
	"./de-at.js": "b3eb",
	"./de-ch": "bb71",
	"./de-ch.js": "bb71",
	"./de.js": "b469",
	"./dv": "598a",
	"./dv.js": "598a",
	"./el": "8d47",
	"./el.js": "8d47",
	"./en-au": "0e6b",
	"./en-au.js": "0e6b",
	"./en-ca": "3886",
	"./en-ca.js": "3886",
	"./en-gb": "39a6",
	"./en-gb.js": "39a6",
	"./en-ie": "e1d3",
	"./en-ie.js": "e1d3",
	"./en-il": "7333",
	"./en-il.js": "7333",
	"./en-in": "ec2e",
	"./en-in.js": "ec2e",
	"./en-nz": "6f50",
	"./en-nz.js": "6f50",
	"./en-sg": "b7e9",
	"./en-sg.js": "b7e9",
	"./eo": "65db",
	"./eo.js": "65db",
	"./es": "898b",
	"./es-do": "0a3c",
	"./es-do.js": "0a3c",
	"./es-mx": "b5b7",
	"./es-mx.js": "b5b7",
	"./es-us": "55c9",
	"./es-us.js": "55c9",
	"./es.js": "898b",
	"./et": "ec18",
	"./et.js": "ec18",
	"./eu": "0ff2",
	"./eu.js": "0ff2",
	"./fa": "8df4",
	"./fa.js": "8df4",
	"./fi": "81e9",
	"./fi.js": "81e9",
	"./fil": "d69a",
	"./fil.js": "d69a",
	"./fo": "0721",
	"./fo.js": "0721",
	"./fr": "9f26",
	"./fr-ca": "d9f8",
	"./fr-ca.js": "d9f8",
	"./fr-ch": "0e49",
	"./fr-ch.js": "0e49",
	"./fr.js": "9f26",
	"./fy": "7118",
	"./fy.js": "7118",
	"./ga": "5120",
	"./ga.js": "5120",
	"./gd": "f6b4",
	"./gd.js": "f6b4",
	"./gl": "8840",
	"./gl.js": "8840",
	"./gom-deva": "aaf2",
	"./gom-deva.js": "aaf2",
	"./gom-latn": "0caa",
	"./gom-latn.js": "0caa",
	"./gu": "e0c5",
	"./gu.js": "e0c5",
	"./he": "c7aa",
	"./he.js": "c7aa",
	"./hi": "dc4d",
	"./hi.js": "dc4d",
	"./hr": "4ba9",
	"./hr.js": "4ba9",
	"./hu": "5b14",
	"./hu.js": "5b14",
	"./hy-am": "d6b6",
	"./hy-am.js": "d6b6",
	"./id": "5038",
	"./id.js": "5038",
	"./is": "0558",
	"./is.js": "0558",
	"./it": "6e98",
	"./it-ch": "6f12",
	"./it-ch.js": "6f12",
	"./it.js": "6e98",
	"./ja": "079e",
	"./ja.js": "079e",
	"./jv": "b540",
	"./jv.js": "b540",
	"./ka": "201b",
	"./ka.js": "201b",
	"./kk": "6d79",
	"./kk.js": "6d79",
	"./km": "e81d",
	"./km.js": "e81d",
	"./kn": "3e92",
	"./kn.js": "3e92",
	"./ko": "22f8",
	"./ko.js": "22f8",
	"./ku": "2421",
	"./ku.js": "2421",
	"./ky": "9609",
	"./ky.js": "9609",
	"./lb": "440c",
	"./lb.js": "440c",
	"./lo": "b29d",
	"./lo.js": "b29d",
	"./lt": "26f9",
	"./lt.js": "26f9",
	"./lv": "b97c",
	"./lv.js": "b97c",
	"./me": "293c",
	"./me.js": "293c",
	"./mi": "688b",
	"./mi.js": "688b",
	"./mk": "6909",
	"./mk.js": "6909",
	"./ml": "02fb",
	"./ml.js": "02fb",
	"./mn": "958b",
	"./mn.js": "958b",
	"./mr": "39bd",
	"./mr.js": "39bd",
	"./ms": "ebe4",
	"./ms-my": "6403",
	"./ms-my.js": "6403",
	"./ms.js": "ebe4",
	"./mt": "1b45",
	"./mt.js": "1b45",
	"./my": "8689",
	"./my.js": "8689",
	"./nb": "6ce3",
	"./nb.js": "6ce3",
	"./ne": "3a39",
	"./ne.js": "3a39",
	"./nl": "facd",
	"./nl-be": "db29",
	"./nl-be.js": "db29",
	"./nl.js": "facd",
	"./nn": "b84c",
	"./nn.js": "b84c",
	"./oc-lnc": "167b",
	"./oc-lnc.js": "167b",
	"./pa-in": "f3ff",
	"./pa-in.js": "f3ff",
	"./pl": "8d57",
	"./pl.js": "8d57",
	"./pt": "f260",
	"./pt-br": "d2d4",
	"./pt-br.js": "d2d4",
	"./pt.js": "f260",
	"./ro": "972c",
	"./ro.js": "972c",
	"./ru": "957c",
	"./ru.js": "957c",
	"./sd": "6784",
	"./sd.js": "6784",
	"./se": "ffff",
	"./se.js": "ffff",
	"./si": "eda5",
	"./si.js": "eda5",
	"./sk": "7be6",
	"./sk.js": "7be6",
	"./sl": "8155",
	"./sl.js": "8155",
	"./sq": "c8f3",
	"./sq.js": "c8f3",
	"./sr": "cf1e",
	"./sr-cyrl": "13e9",
	"./sr-cyrl.js": "13e9",
	"./sr.js": "cf1e",
	"./ss": "52bd",
	"./ss.js": "52bd",
	"./sv": "5fbd",
	"./sv.js": "5fbd",
	"./sw": "74dc",
	"./sw.js": "74dc",
	"./ta": "3de5",
	"./ta.js": "3de5",
	"./te": "5cbb",
	"./te.js": "5cbb",
	"./tet": "576c",
	"./tet.js": "576c",
	"./tg": "3b1b",
	"./tg.js": "3b1b",
	"./th": "10e8",
	"./th.js": "10e8",
	"./tk": "5aff",
	"./tk.js": "5aff",
	"./tl-ph": "0f38",
	"./tl-ph.js": "0f38",
	"./tlh": "cf75",
	"./tlh.js": "cf75",
	"./tr": "0e81",
	"./tr.js": "0e81",
	"./tzl": "cf51",
	"./tzl.js": "cf51",
	"./tzm": "c109",
	"./tzm-latn": "b53d",
	"./tzm-latn.js": "b53d",
	"./tzm.js": "c109",
	"./ug-cn": "6117",
	"./ug-cn.js": "6117",
	"./uk": "ada2",
	"./uk.js": "ada2",
	"./ur": "5294",
	"./ur.js": "5294",
	"./uz": "2e8c",
	"./uz-latn": "010e",
	"./uz-latn.js": "010e",
	"./uz.js": "2e8c",
	"./vi": "2921",
	"./vi.js": "2921",
	"./x-pseudo": "fd7e",
	"./x-pseudo.js": "fd7e",
	"./yo": "7f33",
	"./yo.js": "7f33",
	"./zh-cn": "5c3a",
	"./zh-cn.js": "5c3a",
	"./zh-hk": "49ab",
	"./zh-hk.js": "49ab",
	"./zh-mo": "3a6c",
	"./zh-mo.js": "3a6c",
	"./zh-tw": "90ea",
	"./zh-tw.js": "90ea"
};


function webpackContext(req) {
	var id = webpackContextResolve(req);
	return __webpack_require__(id);
}
function webpackContextResolve(req) {
	if(!__webpack_require__.o(map, req)) {
		var e = new Error("Cannot find module '" + req + "'");
		e.code = 'MODULE_NOT_FOUND';
		throw e;
	}
	return map[req];
}
webpackContext.keys = function webpackContextKeys() {
	return Object.keys(map);
};
webpackContext.resolve = webpackContextResolve;
module.exports = webpackContext;
webpackContext.id = "4678";

/***/ }),

/***/ "49e1":
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__.p + "img/btn-atmosphere.26bed3a1.svg";

/***/ }),

/***/ "49f8":
/***/ (function(module, exports, __webpack_require__) {

var map = {
	"./de.json": "6ce2",
	"./en.json": "edd4",
	"./fr.json": "f693"
};


function webpackContext(req) {
	var id = webpackContextResolve(req);
	return __webpack_require__(id);
}
function webpackContextResolve(req) {
	if(!__webpack_require__.o(map, req)) {
		var e = new Error("Cannot find module '" + req + "'");
		e.code = 'MODULE_NOT_FOUND';
		throw e;
	}
	return map[req];
}
webpackContext.keys = function webpackContextKeys() {
	return Object.keys(map);
};
webpackContext.resolve = webpackContextResolve;
module.exports = webpackContext;
webpackContext.id = "49f8";

/***/ }),

/***/ "4ca5":
/***/ (function(module, exports, __webpack_require__) {

// extracted by mini-css-extract-plugin

/***/ }),

/***/ "4d1c":
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__.p + "img/fullscreen_exit.c223388f.svg";

/***/ }),

/***/ "4f57":
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__.p + "img/point_to.4133dbcc.svg";

/***/ }),

/***/ "5318":
/***/ (function(module, exports, __webpack_require__) {

// extracted by mini-css-extract-plugin

/***/ }),

/***/ "56d7":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXTERNAL MODULE: ./node_modules/core-js/modules/es.array.iterator.js
var es_array_iterator = __webpack_require__("e260");

// EXTERNAL MODULE: ./node_modules/core-js/modules/es.promise.js
var es_promise = __webpack_require__("e6cf");

// EXTERNAL MODULE: ./node_modules/core-js/modules/es.object.assign.js
var es_object_assign = __webpack_require__("cca6");

// EXTERNAL MODULE: ./node_modules/core-js/modules/es.promise.finally.js
var es_promise_finally = __webpack_require__("a79d");

// EXTERNAL MODULE: ./node_modules/core-js/modules/es.object.to-string.js
var es_object_to_string = __webpack_require__("d3b7");

// EXTERNAL MODULE: ./node_modules/core-js/modules/web.dom-collections.iterator.js
var web_dom_collections_iterator = __webpack_require__("ddb0");

// EXTERNAL MODULE: ./node_modules/core-js/modules/web.dom-collections.for-each.js
var web_dom_collections_for_each = __webpack_require__("159b");

// EXTERNAL MODULE: ./node_modules/core-js/modules/es.string.match.js
var es_string_match = __webpack_require__("466d");

// EXTERNAL MODULE: ./node_modules/core-js/modules/es.regexp.exec.js
var es_regexp_exec = __webpack_require__("ac1f");

// EXTERNAL MODULE: ./node_modules/core-js/modules/es.array.concat.js
var es_array_concat = __webpack_require__("99af");

// EXTERNAL MODULE: ./node_modules/vue/dist/vue.esm.js
var vue_esm = __webpack_require__("a026");

// CONCATENATED MODULE: ./node_modules/cache-loader/dist/cjs.js?{"cacheDirectory":"node_modules/.cache/vue-loader","cacheIdentifier":"dec867b4-vue-loader-template"}!./node_modules/vue-loader/lib/loaders/templateLoader.js??vue-loader-options!./node_modules/cache-loader/dist/cjs.js??ref--1-0!./node_modules/vue-loader/lib??vue-loader-options!./src/App.vue?vue&type=template&id=3cc3ed3c&
var render = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('v-app',[_c('oras-catalog-status-dialog',{model:{value:(_vm.showCatalogPacks),callback:function ($$v) {_vm.showCatalogPacks=$$v},expression:"showCatalogPacks"}}),_c('oras-dense-stars-status-dialog',{model:{value:(_vm.showDenseStars),callback:function ($$v) {_vm.showDenseStars=$$v},expression:"showDenseStars"}}),_c('v-navigation-drawer',{attrs:{"app":"","stateless":"","width":"300"},model:{value:(_vm.nav),callback:function ($$v) {_vm.nav=$$v},expression:"nav"}},[_c('v-layout',{attrs:{"column":"","fill-height":""}},[_c('v-list',{attrs:{"dense":""}},[_vm._l((_vm.menuItems),function(item,i){return [(_vm.$store.state[item.store_show_menu_item] === false)?void 0:(item.header)?_c('v-subheader',{key:i,staticClass:"grey--text text--darken-1",domProps:{"textContent":_vm._s(item.header)}}):(item.divider)?_c('v-divider',{key:i,staticClass:"divider_menu"}):(item.switch)?_c('v-list-item',{key:i,on:{"click":function($event){$event.stopPropagation();return _vm.toggleStoreValue(item.store_var_name)}}},[_c('v-list-item-action',[_c('v-switch',{attrs:{"value":"","input-value":_vm.getStoreValue(item.store_var_name),"label":""}})],1),_c('v-list-item-content',[_c('v-list-item-title',[_vm._v(_vm._s(item.title))])],1)],1):[(item.link)?_c('v-list-item',{key:i,attrs:{"target":"_blank","rel":"noopener","href":item.link}},[_c('v-list-item-icon',[_c('v-icon',[_vm._v(_vm._s(item.icon))])],1),_c('v-list-item-title',{domProps:{"textContent":_vm._s(item.title)}}),_c('v-icon',{attrs:{"disabled":""}},[_vm._v("mdi-open-in-new")])],1):(item.footer===undefined)?_c('v-list-item',{key:i,on:{"click":function($event){$event.stopPropagation();return _vm.handleMenuItemClick(item)}}},[_c('v-list-item-icon',[_c('v-icon',[_vm._v(_vm._s(item.icon))])],1),_c('v-list-item-title',{domProps:{"textContent":_vm._s(item.title)}})],1):_vm._e()]]})],2),_vm._l((_vm.menuComponents),function(item,i){return [_c(item,{key:i,tag:"component"})]}),_c('v-spacer'),_c('v-list',{attrs:{"dense":""}},[_c('v-divider',{staticClass:"divider_menu"}),_vm._l((_vm.menuItems),function(item,i){return [(item.footer)?_c('v-list-item',{key:i,on:{"click":function($event){$event.stopPropagation();return _vm.toggleStoreValue(item.store_var_name)}}},[_c('v-list-item-icon',[_c('v-icon',[_vm._v(_vm._s(item.icon))])],1),_c('v-list-item-title',{domProps:{"textContent":_vm._s(item.title)}})],1):_vm._e()]})],2)],2)],1),_c('v-main',[_c('v-container',{staticClass:"fill-height",staticStyle:{"padding":"0"},attrs:{"fluid":""}},[_c('div',{class:{ right_panel: _vm.$store.state.showSidePanel },attrs:{"id":"stel"}},[_c('div',{staticStyle:{"position":"relative","width":"100%","height":"100%"}},[_c(_vm.guiComponent,{tag:"component"}),_c('canvas',{ref:"stelCanvas",attrs:{"id":"stel-canvas"}})],1)])])],1)],1)}
var staticRenderFns = []


// CONCATENATED MODULE: ./src/App.vue?vue&type=template&id=3cc3ed3c&

// EXTERNAL MODULE: ./node_modules/@babel/runtime/helpers/esm/slicedToArray.js + 3 modules
var slicedToArray = __webpack_require__("3835");

// EXTERNAL MODULE: ./node_modules/@babel/runtime/helpers/esm/createForOfIteratorHelper.js
var createForOfIteratorHelper = __webpack_require__("b85c");

// EXTERNAL MODULE: ./node_modules/core-js/modules/web.url.js
var web_url = __webpack_require__("2b3d");

// EXTERNAL MODULE: ./node_modules/core-js/modules/es.string.iterator.js
var es_string_iterator = __webpack_require__("3ca3");

// EXTERNAL MODULE: ./node_modules/core-js/modules/es.array.includes.js
var es_array_includes = __webpack_require__("caad");

// EXTERNAL MODULE: ./node_modules/core-js/modules/es.string.starts-with.js
var es_string_starts_with = __webpack_require__("2ca0");

// EXTERNAL MODULE: ./node_modules/core-js/modules/es.number.constructor.js
var es_number_constructor = __webpack_require__("a9e3");

// EXTERNAL MODULE: ./node_modules/core-js/modules/es.string.trim.js
var es_string_trim = __webpack_require__("498a");

// EXTERNAL MODULE: ./node_modules/core-js/modules/es.number.is-finite.js
var es_number_is_finite = __webpack_require__("f00c");

// EXTERNAL MODULE: ./node_modules/lodash/lodash.js
var lodash = __webpack_require__("2ef0");
var lodash_default = /*#__PURE__*/__webpack_require__.n(lodash);

// CONCATENATED MODULE: ./node_modules/cache-loader/dist/cjs.js?{"cacheDirectory":"node_modules/.cache/vue-loader","cacheIdentifier":"dec867b4-vue-loader-template"}!./node_modules/vue-loader/lib/loaders/templateLoader.js??vue-loader-options!./node_modules/cache-loader/dist/cjs.js??ref--1-0!./node_modules/vue-loader/lib??vue-loader-options!./src/components/gui.vue?vue&type=template&id=28d988c2&
var guivue_type_template_id_28d988c2_render = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{staticClass:"click-through",staticStyle:{"position":"absolute","width":"100%","height":"100%","display":"flex","align-items":"flex-end"}},[(_vm.$store.state.showMainToolBar)?_c('toolbar',{staticClass:"get-click"}):_vm._e(),_c('observing-panel'),_vm._l((_vm.pluginsGuiComponents),function(item,i){return [_c(item,{key:i,tag:"component"})]}),_vm._l((_vm.dialogs),function(item,i){return [_c(item,{key:i + _vm.pluginsGuiComponents.length,tag:"component"})]}),_c('selected-object-info',{staticClass:"get-click",staticStyle:{"position":"absolute","top":"48px","left":"0px","width":"380px","max-width":"calc(100vw - 12px)","margin":"6px"}}),_c('progress-bars',{staticStyle:{"position":"absolute","bottom":"54px","right":"12px"}}),_c('bottom-bar',{staticClass:"get-click",staticStyle:{"position":"absolute","width":"100%","justify-content":"center","bottom":"0","display":"flex","margin-bottom":"0px"}})],2)}
var guivue_type_template_id_28d988c2_staticRenderFns = []


// CONCATENATED MODULE: ./src/components/gui.vue?vue&type=template&id=28d988c2&

// EXTERNAL MODULE: ./node_modules/core-js/modules/es.array.map.js
var es_array_map = __webpack_require__("d81d");

// EXTERNAL MODULE: ./node_modules/core-js/modules/es.function.name.js
var es_function_name = __webpack_require__("b0c0");

// CONCATENATED MODULE: ./node_modules/cache-loader/dist/cjs.js?{"cacheDirectory":"node_modules/.cache/vue-loader","cacheIdentifier":"dec867b4-vue-loader-template"}!./node_modules/vue-loader/lib/loaders/templateLoader.js??vue-loader-options!./node_modules/cache-loader/dist/cjs.js??ref--1-0!./node_modules/vue-loader/lib??vue-loader-options!./src/components/toolbar.vue?vue&type=template&id=6acce61a&
var toolbarvue_type_template_id_6acce61a_render = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{attrs:{"id":"toolbar-image"}},[_c('v-toolbar',{staticClass:"transparent",attrs:{"dense":""}},[_c('v-app-bar-nav-icon',{on:{"click":_vm.toggleNavigationDrawer}}),_c('span',{staticClass:"tbtitle"},[_vm._v("ORAS Sky-Engine")]),_c('v-spacer'),_c('target-search'),_c('v-spacer'),(_vm.$store.state.showFPS)?_c('div',{staticClass:"subheader grey--text hidden-sm-and-down pr-2",staticStyle:{"user-select":"none"}},[_vm._v("FPS "+_vm._s(_vm.$store.state.stel ? _vm.$store.state.stel.fps.toFixed(1) : '?'))]):_vm._e(),_c('div',{staticClass:"subheader grey--text hidden-sm-and-down",staticStyle:{"user-select":"none"}},[_vm._v("FOV "+_vm._s(_vm.fov))]),(!_vm.$store.state.showSidePanel)?_c('v-btn',{staticClass:"transparent",attrs:{"to":"/p"}},[_vm._v(_vm._s(_vm.$t('Observe'))),_c('v-icon',[_vm._v("mdi-chevron-down")])],1):_vm._e()],1)],1)}
var toolbarvue_type_template_id_6acce61a_staticRenderFns = []


// CONCATENATED MODULE: ./src/components/toolbar.vue?vue&type=template&id=6acce61a&

// CONCATENATED MODULE: ./node_modules/cache-loader/dist/cjs.js?{"cacheDirectory":"node_modules/.cache/vue-loader","cacheIdentifier":"dec867b4-vue-loader-template"}!./node_modules/vue-loader/lib/loaders/templateLoader.js??vue-loader-options!./node_modules/cache-loader/dist/cjs.js??ref--1-0!./node_modules/vue-loader/lib??vue-loader-options!./src/components/target-search.vue?vue&type=template&id=5d761524&
var target_searchvue_type_template_id_5d761524_render = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{staticClass:"tsearch"},[_c('skysource-search',{attrs:{"floatingList":"true"},model:{value:(_vm.obsSkySource),callback:function ($$v) {_vm.obsSkySource=$$v},expression:"obsSkySource"}})],1)}
var target_searchvue_type_template_id_5d761524_staticRenderFns = []


// CONCATENATED MODULE: ./src/components/target-search.vue?vue&type=template&id=5d761524&

// CONCATENATED MODULE: ./node_modules/cache-loader/dist/cjs.js?{"cacheDirectory":"node_modules/.cache/vue-loader","cacheIdentifier":"dec867b4-vue-loader-template"}!./node_modules/vue-loader/lib/loaders/templateLoader.js??vue-loader-options!./node_modules/cache-loader/dist/cjs.js??ref--1-0!./node_modules/vue-loader/lib??vue-loader-options!./src/components/skysource-search.vue?vue&type=template&id=829e5c8c&
var skysource_searchvue_type_template_id_829e5c8c_render = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{directives:[{name:"click-outside",rawName:"v-click-outside",value:(_vm.resetSearch),expression:"resetSearch"}],staticStyle:{"position":"relative"}},[_c('v-text-field',{attrs:{"prepend-icon":"mdi-magnify","label":_vm.$t('Search...'),"hide-details":"","single-line":""},nativeOn:{"keyup":function($event){if(!$event.type.indexOf('key')&&_vm._k($event.keyCode,"esc",27,$event.key,["Esc","Escape"])){ return null; }return _vm.resetSearch()}},model:{value:(_vm.searchText),callback:function ($$v) {_vm.searchText=$$v},expression:"searchText"}}),(_vm.showList)?_c('v-list',{style:(_vm.listStyle),attrs:{"dense":"","two-line":""}},_vm._l((_vm.autoCompleteChoices),function(source){return _c('v-list-item',{key:source.names[0],on:{"click":function($event){return _vm.sourceClicked(source)}}},[_c('v-list-item-action',[_c('img',{attrs:{"src":_vm.iconForSkySource(source)}})]),_c('v-list-item-content',[_c('v-list-item-title',[_vm._v(_vm._s(_vm.nameForSkySource(source)))]),_c('v-list-item-subtitle',[_vm._v(" "+_vm._s(_vm.subtitleForSkySource(source))+" "),(source.catalog)?_c('v-chip',{staticClass:"ml-1",attrs:{"x-small":"","outlined":""}},[_vm._v(_vm._s(source.catalog))]):_vm._e(),(source.pack_id || source.source_attribution)?_c('v-chip',{staticClass:"ml-1",attrs:{"x-small":"","color":"cyan darken-3","text-color":"white"}},[_vm._v("ORAS Enhanced")]):_vm._e()],1)],1)],1)}),1):_vm._e()],1)}
var skysource_searchvue_type_template_id_829e5c8c_staticRenderFns = []


// CONCATENATED MODULE: ./src/components/skysource-search.vue?vue&type=template&id=829e5c8c&

// EXTERNAL MODULE: ./node_modules/@babel/runtime/helpers/esm/toConsumableArray.js + 3 modules
var toConsumableArray = __webpack_require__("2909");

// EXTERNAL MODULE: ./node_modules/core-js/modules/es.array.filter.js
var es_array_filter = __webpack_require__("4de4");

// EXTERNAL MODULE: ./node_modules/core-js/modules/es.string.ends-with.js
var es_string_ends_with = __webpack_require__("8a79");

// EXTERNAL MODULE: ./node_modules/core-js/modules/es.string.replace.js
var es_string_replace = __webpack_require__("5319");

// EXTERNAL MODULE: ./node_modules/core-js/modules/es.number.to-fixed.js
var es_number_to_fixed = __webpack_require__("b680");

// EXTERNAL MODULE: ./node_modules/core-js/modules/es.array.slice.js
var es_array_slice = __webpack_require__("fb6a");

// EXTERNAL MODULE: ./node_modules/core-js/modules/es.array.find.js
var es_array_find = __webpack_require__("7db0");

// EXTERNAL MODULE: ./node_modules/core-js/modules/es.string.includes.js
var es_string_includes = __webpack_require__("2532");

// EXTERNAL MODULE: ./node_modules/core-js/modules/es.string.search.js
var es_string_search = __webpack_require__("841c");

// EXTERNAL MODULE: ./node_modules/core-js/modules/es.set.js
var es_set = __webpack_require__("6062");

// EXTERNAL MODULE: ./node_modules/core-js/modules/es.array.join.js
var es_array_join = __webpack_require__("a15b");

// EXTERNAL MODULE: ./src/assets/js/stellarium-web-engine.js
var stellarium_web_engine = __webpack_require__("c074");

// EXTERNAL MODULE: ./node_modules/moment/moment.js
var moment = __webpack_require__("c1df");
var moment_default = /*#__PURE__*/__webpack_require__.n(moment);

// EXTERNAL MODULE: ./node_modules/@babel/runtime/helpers/esm/typeof.js
var esm_typeof = __webpack_require__("53ca");

// EXTERNAL MODULE: ./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js
var asyncToGenerator = __webpack_require__("1da1");

// EXTERNAL MODULE: ./node_modules/regenerator-runtime/runtime.js
var runtime = __webpack_require__("96cf");

// EXTERNAL MODULE: ./node_modules/core-js/modules/es.regexp.to-string.js
var es_regexp_to_string = __webpack_require__("25f0");

// CONCATENATED MODULE: ./src/assets/oras_data_config.js























var ORAS_DATA_ROOT = '/oras-sky-engine/skydata';
var ORAS_BUNDLED_DSS_SURVEY_ROOT = ORAS_DATA_ROOT + '/surveys/dss/v1';
var ORAS_BUNDLED_GAIA_SURVEY_ROOT = ORAS_DATA_ROOT + '/surveys/gaia/v1';
var ORAS_PACKS_ROOT = ORAS_DATA_ROOT + '/packs';
var ORAS_SEARCH_API = '/api/sky/search';
var ORAS_OBJECT_API_ROOT = '/api/sky/object';
var ORAS_CATALOG_STATUS_API = '/api/sky/catalog/status';
var ORAS_RUNTIME_MODE = 'oras-local';
var ORAS_OBJECT_MEDIA_ROOT = ORAS_DATA_ROOT + '/object-media';
var ORAS_DEFAULT_DSS_SURVEY_KEY = 'oras-hd-auto';
var ORAS_DEFAULT_SURVEY_MIN_COVERAGE = 0.99;
var ORAS_DSS_SURVEY_PROVIDERS = [{
  key: ORAS_DEFAULT_DSS_SURVEY_KEY,
  label: 'ORAS HD auto',
  source: 'auto',
  isDefault: true,
  preferredProviderKeys: ['panstarrs-dr1-color-z-zg-g']
}, {
  key: 'dss',
  label: 'DSS colored',
  url: ORAS_BUNDLED_DSS_SURVEY_ROOT,
  source: 'bundled'
}, {
  key: 'dss-colored',
  label: 'DSS colored',
  url: ORAS_BUNDLED_DSS_SURVEY_ROOT,
  source: 'bundled',
  aliasFor: 'dss'
}, {
  key: 'panstarrs-dr1-color-z-zg-g',
  label: 'Pan-STARRS DR1 color z-zg-g',
  url: 'https://alasky.cds.unistra.fr/Pan-STARRS/DR1/color-z-zg-g',
  hipsOrder: 11,
  tileFormat: 'jpeg',
  coverage: 0.78125,
  source: 'external-query-only'
}, {
  key: 'panstarrs-dr1-color-i-r-g',
  label: 'Pan-STARRS DR1 color i-r-g',
  url: 'https://alasky.cds.unistra.fr/Pan-STARRS/DR1/color-i-r-g',
  hipsOrder: 11,
  tileFormat: 'jpeg',
  coverage: 0.76386,
  source: 'external-query-only'
}];
var GAIA_SOURCE_ALIAS_RE = /^\s*gaia\s+([0-9]+)\s*$/i;
var GAIA_DISPLAY_NAME_RE = /^Gaia DR2 ([0-9]+)$/;
var MESSIER_ID_RE = /^M\s*([0-9]+)$/i;

function buildOrasNames(result, displayName, sourceId, isGaiaResult) {
  var names = [displayName];

  if (isGaiaResult && sourceId) {
    names.push(buildOrasGaiaAlias(sourceId));
    return names;
  }

  if (sourceId && MESSIER_ID_RE.test(sourceId)) {
    var messierId = String(sourceId).replace(/\s+/g, '').toUpperCase();
    var messierNumber = messierId.slice(1);
    names.push(messierId);
    names.push('M ' + messierNumber);
  }

  if (result && ['Bright Stars (local)', 'Bright Star Catalog (local)'].includes(result.catalog)) {
    names.push('NAME ' + displayName);
  }

  return names.filter(function (name, index, array) {
    return name && array.indexOf(name) === index;
  });
}

function normalizeOrasSearchQuery(query) {
  if (typeof query !== 'string') {
    return '';
  }

  var trimmed = query.trim();

  if (!trimmed) {
    return '';
  }

  return trimmed.replace(GAIA_SOURCE_ALIAS_RE, 'Gaia DR2 $1');
}
function buildOrasSearchUrl(query) {
  var normalized = normalizeOrasSearchQuery(query);

  if (!normalized) {
    return undefined;
  }

  var params = new URLSearchParams({
    q: normalized
  });
  return ORAS_SEARCH_API + '?' + params.toString();
}
function buildOrasObjectLookupUrl(_ref) {
  var catalog = _ref.catalog,
      sourceId = _ref.sourceId,
      model = _ref.model,
      time = _ref.time,
      lat = _ref.lat,
      lng = _ref.lng,
      elev = _ref.elev;
  var normalizedCatalog = typeof catalog === 'string' ? catalog.trim() : '';
  var normalizedSourceId = sourceId == null ? '' : String(sourceId).trim();
  var normalizedModel = typeof model === 'string' ? model.trim() : '';

  if (!normalizedCatalog || !normalizedSourceId || !normalizedModel) {
    return undefined;
  }

  var params = new URLSearchParams({
    catalog: normalizedCatalog,
    source_id: normalizedSourceId,
    model: normalizedModel
  });

  if (time != null && String(time).trim() !== '') {
    params.set('time', String(time).trim());
  }

  if (lat != null && String(lat).trim() !== '') {
    params.set('lat', String(lat).trim());
  }

  if (lng != null && String(lng).trim() !== '') {
    params.set('lng', String(lng).trim());
  }

  if (elev != null && String(elev).trim() !== '') {
    params.set('elev', String(elev).trim());
  }

  return ORAS_OBJECT_API_ROOT + '?' + params.toString();
}
function listOrasDssSurveyProviders() {
  return ORAS_DSS_SURVEY_PROVIDERS.map(function (provider) {
    return Object.assign({}, provider);
  });
}
function getOrasDssSurveyProvider(requestedKey) {
  var normalizedKey = typeof requestedKey === 'string' ? requestedKey.trim().toLowerCase() : '';

  if (!normalizedKey) {
    return ORAS_DSS_SURVEY_PROVIDERS.find(function (provider) {
      return provider.isDefault;
    });
  }

  return ORAS_DSS_SURVEY_PROVIDERS.find(function (provider) {
    return provider.key === normalizedKey;
  }) || ORAS_DSS_SURVEY_PROVIDERS.find(function (provider) {
    return provider.key === 'dss';
  });
}

function isProviderSafeForDefault(provider) {
  return provider && provider.source === 'external-query-only' && Number(provider.coverage) >= ORAS_DEFAULT_SURVEY_MIN_COVERAGE;
}

function probeOrasSurveyProvider(_x, _x2) {
  return _probeOrasSurveyProvider.apply(this, arguments);
}

function _probeOrasSurveyProvider() {
  _probeOrasSurveyProvider = Object(asyncToGenerator["a" /* default */])( /*#__PURE__*/regeneratorRuntime.mark(function _callee(provider, fetchImpl) {
    var response;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (!(!provider || !provider.url)) {
              _context.next = 2;
              break;
            }

            return _context.abrupt("return", undefined);

          case 2:
            if (!(provider.source !== 'external-query-only')) {
              _context.next = 4;
              break;
            }

            return _context.abrupt("return", provider.url);

          case 4:
            if (!(typeof fetchImpl !== 'function')) {
              _context.next = 6;
              break;
            }

            return _context.abrupt("return", provider.url);

          case 6:
            _context.prev = 6;
            _context.next = 9;
            return fetchImpl(provider.url + '/properties', {
              method: 'GET'
            });

          case 9:
            response = _context.sent;

            if (!(response && response.ok)) {
              _context.next = 12;
              break;
            }

            return _context.abrupt("return", provider.url);

          case 12:
            _context.next = 16;
            break;

          case 14:
            _context.prev = 14;
            _context.t0 = _context["catch"](6);

          case 16:
            return _context.abrupt("return", undefined);

          case 17:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[6, 14]]);
  }));
  return _probeOrasSurveyProvider.apply(this, arguments);
}

function resolveOrasAutoDssSurveyUrl(_x3, _x4, _x5) {
  return _resolveOrasAutoDssSurveyUrl.apply(this, arguments);
}

function _resolveOrasAutoDssSurveyUrl() {
  _resolveOrasAutoDssSurveyUrl = Object(asyncToGenerator["a" /* default */])( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(provider, fetchImpl, localSurveyRoot) {
    var preferredProviderKeys, _iterator, _step, _loop, _ret;

    return regeneratorRuntime.wrap(function _callee2$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            preferredProviderKeys = Array.isArray(provider.preferredProviderKeys) ? provider.preferredProviderKeys : [];
            _iterator = Object(createForOfIteratorHelper["a" /* default */])(preferredProviderKeys);
            _context3.prev = 2;
            _loop = /*#__PURE__*/regeneratorRuntime.mark(function _loop() {
              var preferredProviderKey, preferredProvider, surveyUrl;
              return regeneratorRuntime.wrap(function _loop$(_context2) {
                while (1) {
                  switch (_context2.prev = _context2.next) {
                    case 0:
                      preferredProviderKey = _step.value;
                      preferredProvider = ORAS_DSS_SURVEY_PROVIDERS.find(function (item) {
                        return item.key === preferredProviderKey;
                      });

                      if (isProviderSafeForDefault(preferredProvider)) {
                        _context2.next = 4;
                        break;
                      }

                      return _context2.abrupt("return", "continue");

                    case 4:
                      _context2.next = 6;
                      return probeOrasSurveyProvider(preferredProvider, fetchImpl);

                    case 6:
                      surveyUrl = _context2.sent;

                      if (!surveyUrl) {
                        _context2.next = 9;
                        break;
                      }

                      return _context2.abrupt("return", {
                        v: surveyUrl
                      });

                    case 9:
                    case "end":
                      return _context2.stop();
                  }
                }
              }, _loop);
            });

            _iterator.s();

          case 5:
            if ((_step = _iterator.n()).done) {
              _context3.next = 14;
              break;
            }

            return _context3.delegateYield(_loop(), "t0", 7);

          case 7:
            _ret = _context3.t0;

            if (!(_ret === "continue")) {
              _context3.next = 10;
              break;
            }

            return _context3.abrupt("continue", 12);

          case 10:
            if (!(Object(esm_typeof["a" /* default */])(_ret) === "object")) {
              _context3.next = 12;
              break;
            }

            return _context3.abrupt("return", _ret.v);

          case 12:
            _context3.next = 5;
            break;

          case 14:
            _context3.next = 19;
            break;

          case 16:
            _context3.prev = 16;
            _context3.t1 = _context3["catch"](2);

            _iterator.e(_context3.t1);

          case 19:
            _context3.prev = 19;

            _iterator.f();

            return _context3.finish(19);

          case 22:
            return _context3.abrupt("return", resolveOrasBundledDssSurveyUrl(fetchImpl, localSurveyRoot));

          case 23:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee2, null, [[2, 16, 19, 22]]);
  }));
  return _resolveOrasAutoDssSurveyUrl.apply(this, arguments);
}

function resolveOrasBundledDssSurveyUrl(_x6, _x7) {
  return _resolveOrasBundledDssSurveyUrl.apply(this, arguments);
}

function _resolveOrasBundledDssSurveyUrl() {
  _resolveOrasBundledDssSurveyUrl = Object(asyncToGenerator["a" /* default */])( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(fetchImpl, localSurveyRoot) {
    var response;
    return regeneratorRuntime.wrap(function _callee3$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            if (!(typeof fetchImpl === 'function')) {
              _context4.next = 11;
              break;
            }

            _context4.prev = 1;
            _context4.next = 4;
            return fetchImpl(localSurveyRoot + '/properties', {
              method: 'HEAD'
            });

          case 4:
            response = _context4.sent;

            if (!(response && response.ok)) {
              _context4.next = 7;
              break;
            }

            return _context4.abrupt("return", localSurveyRoot);

          case 7:
            _context4.next = 11;
            break;

          case 9:
            _context4.prev = 9;
            _context4.t0 = _context4["catch"](1);

          case 11:
            return _context4.abrupt("return", undefined);

          case 12:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee3, null, [[1, 9]]);
  }));
  return _resolveOrasBundledDssSurveyUrl.apply(this, arguments);
}

function resolveOrasDssSurveyUrl() {
  return _resolveOrasDssSurveyUrl.apply(this, arguments);
}

function _resolveOrasDssSurveyUrl() {
  _resolveOrasDssSurveyUrl = Object(asyncToGenerator["a" /* default */])( /*#__PURE__*/regeneratorRuntime.mark(function _callee4() {
    var requestedKeyOrOptions,
        maybeOptions,
        options,
        requestedKey,
        provider,
        fetchImpl,
        localSurveyRoot,
        requestedSurveyUrl,
        _args5 = arguments;
    return regeneratorRuntime.wrap(function _callee4$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            requestedKeyOrOptions = _args5.length > 0 && _args5[0] !== undefined ? _args5[0] : undefined;
            maybeOptions = _args5.length > 1 && _args5[1] !== undefined ? _args5[1] : {};
            options = requestedKeyOrOptions && Object(esm_typeof["a" /* default */])(requestedKeyOrOptions) === 'object' ? requestedKeyOrOptions : maybeOptions;
            requestedKey = typeof requestedKeyOrOptions === 'string' ? requestedKeyOrOptions : undefined;
            provider = getOrasDssSurveyProvider(requestedKey);
            fetchImpl = options.fetchImpl || (typeof fetch === 'function' ? fetch : undefined);
            localSurveyRoot = options.localSurveyRoot || ORAS_BUNDLED_DSS_SURVEY_ROOT;

            if (!(provider && provider.source === 'auto')) {
              _context5.next = 9;
              break;
            }

            return _context5.abrupt("return", resolveOrasAutoDssSurveyUrl(provider, fetchImpl, localSurveyRoot));

          case 9:
            if (!(provider && provider.source === 'bundled')) {
              _context5.next = 11;
              break;
            }

            return _context5.abrupt("return", resolveOrasBundledDssSurveyUrl(fetchImpl, localSurveyRoot));

          case 11:
            _context5.next = 13;
            return probeOrasSurveyProvider(provider, fetchImpl);

          case 13:
            requestedSurveyUrl = _context5.sent;

            if (!requestedSurveyUrl) {
              _context5.next = 16;
              break;
            }

            return _context5.abrupt("return", requestedSurveyUrl);

          case 16:
            if (!(!provider || provider.source === 'external-query-only')) {
              _context5.next = 18;
              break;
            }

            return _context5.abrupt("return", resolveOrasBundledDssSurveyUrl(fetchImpl, localSurveyRoot));

          case 18:
            return _context5.abrupt("return", undefined);

          case 19:
          case "end":
            return _context5.stop();
        }
      }
    }, _callee4);
  }));
  return _resolveOrasDssSurveyUrl.apply(this, arguments);
}

function buildOrasGaiaAlias(sourceId) {
  return 'GAIA ' + sourceId;
}

function preferDisplayNameFirst(names, displayName) {
  var orderedNames = [displayName];

  if (Array.isArray(names)) {
    orderedNames.push.apply(orderedNames, Object(toConsumableArray["a" /* default */])(names));
  }

  return orderedNames.filter(function (name, index, array) {
    return name && array.indexOf(name) === index;
  });
}

function normalizeOrasSkySourceTypes(types, model) {
  var normalizedTypes = Array.isArray(types) && types.length ? types : undefined;
  var normalizedModel = String(model || '').toLowerCase();

  if (normalizedModel === 'dso') {
    if (!normalizedTypes) {
      return ['G'];
    }

    return normalizedTypes.map(function (type) {
      return String(type).toLowerCase() === 'dso' ? 'G' : type;
    });
  }

  return normalizedTypes || ['*'];
}

function numberOrNull(value) {
  if (value == null) {
    return null;
  }

  var number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function buildOrasModelData(result, model, sourceId) {
  var normalizedModel = String(model || '').toLowerCase();
  var resultModelData = result.model_data && Object(esm_typeof["a" /* default */])(result.model_data) === 'object' ? result.model_data : undefined;
  var modelData = {
    source_id: sourceId == null ? null : sourceId,
    phot_g_mean_mag: result.phot_g_mean_mag == null ? null : result.phot_g_mean_mag,
    bp_rp: result.bp_rp == null ? null : result.bp_rp,
    parallax: result.parallax == null ? null : result.parallax,
    pmra: result.pmra == null ? null : result.pmra,
    pmdec: result.pmdec == null ? null : result.pmdec,
    oras_catalog: result.catalog || null,
    oras_status: result.status || null,
    oras_indexed: Boolean(result.indexed),
    provenance: result.provenance || null
  };
  if (result.pack_id) modelData.oras_pack_id = result.pack_id;
  if (result.pack_version) modelData.oras_pack_version = result.pack_version;
  if (result.category) modelData.oras_category = result.category;
  if (result.source_attribution) modelData.oras_source_attribution = result.source_attribution;

  if (normalizedModel === 'tle_satellite' && resultModelData) {
    Object.assign(modelData, resultModelData);
  }

  if (normalizedModel === 'star') {
    var ra = numberOrNull(result.ra);
    var de = numberOrNull(result.dec);
    var vmag = numberOrNull(result.phot_g_mean_mag == null ? result.magnitude : result.phot_g_mean_mag);
    var plx = numberOrNull(result.parallax);
    var pmRa = numberOrNull(result.pmra);
    var pmDe = numberOrNull(result.pmdec);
    if (ra != null) modelData.ra = ra;
    if (de != null) modelData.de = de;
    if (vmag != null) modelData.Vmag = vmag;
    if (plx != null) modelData.plx = plx;
    if (pmRa != null) modelData.pm_ra = pmRa;
    if (pmDe != null) modelData.pm_de = pmDe;
    if (result.spectral_type) modelData.spect_t = result.spectral_type;
    if (numberOrNull(result.color_index) != null) modelData.color_index = numberOrNull(result.color_index);
    if (numberOrNull(result.mass_solar) != null) modelData.mass_solar = numberOrNull(result.mass_solar);
    if (numberOrNull(result.radius_solar) != null) modelData.radius_solar = numberOrNull(result.radius_solar);
    if (numberOrNull(result.temperature_k) != null) modelData.temperature_k = numberOrNull(result.temperature_k);
    modelData.epoch = 2000;
  }

  if (normalizedModel === 'dso') {
    if (resultModelData) {
      Object.assign(modelData, resultModelData);
    }

    var _ra = numberOrNull(result.ra);

    var _de = numberOrNull(result.dec);

    var _vmag = numberOrNull(result.phot_g_mean_mag == null ? result.magnitude : result.phot_g_mean_mag);

    var angularSize = result.angular_size && Object(esm_typeof["a" /* default */])(result.angular_size) === 'object' ? result.angular_size : {};
    var dimx = numberOrNull(angularSize.major_arcmin);
    var dimy = numberOrNull(angularSize.minor_arcmin);
    var angle = numberOrNull(angularSize.position_angle_deg);
    if (_ra != null && numberOrNull(modelData.ra) == null) modelData.ra = _ra;
    if (_de != null && numberOrNull(modelData.de) == null) modelData.de = _de;
    if (_vmag != null && numberOrNull(modelData.Vmag) == null) modelData.Vmag = _vmag;
    if (dimx != null && numberOrNull(modelData.dimx) == null) modelData.dimx = dimx;
    if (dimy != null && numberOrNull(modelData.dimy) == null) modelData.dimy = dimy;
    if (angle != null && numberOrNull(modelData.angle) == null) modelData.angle = angle;
  }

  return modelData;
}

function listOrasPackRoots() {
  return [ORAS_PACKS_ROOT + '/minimal', ORAS_PACKS_ROOT + '/base', ORAS_PACKS_ROOT + '/extended'];
}
function toOrasSkySource(result) {
  if (!result || !result.display_name) {
    return undefined;
  }

  var displayName = String(result.display_name).trim();
  var displayNameMatch = displayName.match(GAIA_DISPLAY_NAME_RE);
  var sourceId = displayNameMatch ? displayNameMatch[1] : result.source_id == null ? undefined : String(result.source_id).trim();
  var isGaiaResult = Boolean(displayNameMatch || String(result.catalog || '').toLowerCase().includes('gaia'));
  var isLocalMessierResult = String(result.catalog || '').toLowerCase().includes('messier');
  var skySourceModel = isLocalMessierResult ? 'dso' : 'star';
  var model = result.model || skySourceModel;
  var enrichedNames = [].concat(Object(toConsumableArray["a" /* default */])(Array.isArray(result.names) ? result.names : []), Object(toConsumableArray["a" /* default */])(Array.isArray(result.aliases) ? result.aliases : []), Object(toConsumableArray["a" /* default */])(Array.isArray(result.common_names) ? result.common_names : []), Object(toConsumableArray["a" /* default */])(Array.isArray(result.catalog_ids) ? result.catalog_ids : []));
  var names = enrichedNames.length ? preferDisplayNameFirst(enrichedNames, displayName) : buildOrasNames(result, displayName, sourceId, isGaiaResult);
  var types = normalizeOrasSkySourceTypes(result.types, model);
  var skySource = {
    match: displayName,
    names: names,
    types: types,
    model: model,
    model_data: buildOrasModelData(result, model, sourceId),
    catalog: result.catalog || null,
    source_id: sourceId == null ? null : sourceId,
    display_name: displayName,
    ra: result.ra == null ? null : result.ra,
    dec: result.dec == null ? null : result.dec,
    phot_g_mean_mag: result.phot_g_mean_mag == null ? result.magnitude == null ? null : result.magnitude : result.phot_g_mean_mag,
    indexed: Boolean(result.indexed),
    status: result.status || null,
    message: result.message || null,
    provenance: result.provenance || null
  };
  var enrichmentFields = ['aliases', 'common_names', 'catalog_ids', 'category', 'object_type', 'source_attribution', 'pack_id', 'pack_version', 'pack_sources', 'magnitude', 'magnitude_band', 'color_index', 'spectral_type', 'parallax', 'distance_pc', 'proper_motion_ra', 'proper_motion_dec', 'radial_velocity_km_s', 'temperature_k', 'mass_solar', 'radius_solar', 'variability', 'angular_size', 'double_star', 'period_seconds', 'redshift', 'flux', 'candidate_status', 'description'];
  enrichmentFields.forEach(function (field) {
    if (result[field] != null) skySource[field] = result[field];
  });
  return skySource;
}
function withOrasRouteIdentityFallback(skySource, identity) {
  if (!skySource || !identity) {
    return skySource;
  }

  var routeRa = numberOrNull(identity.ra);
  var routeDec = numberOrNull(identity.dec);
  var skySourceRa = numberOrNull(skySource.ra);
  var skySourceDec = numberOrNull(skySource.dec);
  var hasRouteCoordinates = routeRa != null && routeDec != null;
  var needsRouteCoordinates = hasRouteCoordinates && (skySourceRa == null || skySourceDec == null);

  if (!needsRouteCoordinates) {
    return skySource;
  }

  var exactSkySource = Object.assign({}, skySource, {
    ra: skySourceRa == null ? routeRa : skySource.ra,
    dec: skySourceDec == null ? routeDec : skySource.dec,
    model_data: Object.assign({}, skySource.model_data || {})
  });
  var exactModel = String(exactSkySource.model || '').toLowerCase();

  if (exactModel === 'star') {
    if (numberOrNull(exactSkySource.model_data.ra) == null) {
      exactSkySource.model_data.ra = exactSkySource.ra;
    }

    if (numberOrNull(exactSkySource.model_data.de) == null) {
      exactSkySource.model_data.de = exactSkySource.dec;
    }

    if (exactSkySource.model_data.epoch == null) {
      exactSkySource.model_data.epoch = 2000;
    }
  }

  if (exactModel === 'dso') {
    if (numberOrNull(exactSkySource.model_data.ra) == null) {
      exactSkySource.model_data.ra = exactSkySource.ra;
    }

    if (numberOrNull(exactSkySource.model_data.de) == null) {
      exactSkySource.model_data.de = exactSkySource.dec;
    }
  }

  return exactSkySource;
}
// EXTERNAL MODULE: ./node_modules/core-js/modules/es.string.split.js
var es_string_split = __webpack_require__("1276");

// EXTERNAL MODULE: ./node_modules/core-js/modules/es.array.from.js
var es_array_from = __webpack_require__("a630");

// EXTERNAL MODULE: ./node_modules/core-js/modules/es.typed-array.uint8-array.js
var es_typed_array_uint8_array = __webpack_require__("5cc6");

// EXTERNAL MODULE: ./node_modules/core-js/modules/es.typed-array.copy-within.js
var es_typed_array_copy_within = __webpack_require__("9a8c");

// EXTERNAL MODULE: ./node_modules/core-js/modules/es.typed-array.every.js
var es_typed_array_every = __webpack_require__("a975");

// EXTERNAL MODULE: ./node_modules/core-js/modules/es.typed-array.fill.js
var es_typed_array_fill = __webpack_require__("735e");

// EXTERNAL MODULE: ./node_modules/core-js/modules/es.typed-array.filter.js
var es_typed_array_filter = __webpack_require__("c1ac");

// EXTERNAL MODULE: ./node_modules/core-js/modules/es.typed-array.find.js
var es_typed_array_find = __webpack_require__("d139");

// EXTERNAL MODULE: ./node_modules/core-js/modules/es.typed-array.find-index.js
var es_typed_array_find_index = __webpack_require__("3a7b");

// EXTERNAL MODULE: ./node_modules/core-js/modules/es.typed-array.for-each.js
var es_typed_array_for_each = __webpack_require__("d5d6");

// EXTERNAL MODULE: ./node_modules/core-js/modules/es.typed-array.includes.js
var es_typed_array_includes = __webpack_require__("82f8");

// EXTERNAL MODULE: ./node_modules/core-js/modules/es.typed-array.index-of.js
var es_typed_array_index_of = __webpack_require__("e91f");

// EXTERNAL MODULE: ./node_modules/core-js/modules/es.typed-array.iterator.js
var es_typed_array_iterator = __webpack_require__("60bd");

// EXTERNAL MODULE: ./node_modules/core-js/modules/es.typed-array.join.js
var es_typed_array_join = __webpack_require__("5f96");

// EXTERNAL MODULE: ./node_modules/core-js/modules/es.typed-array.last-index-of.js
var es_typed_array_last_index_of = __webpack_require__("3280");

// EXTERNAL MODULE: ./node_modules/core-js/modules/es.typed-array.map.js
var es_typed_array_map = __webpack_require__("3fcc");

// EXTERNAL MODULE: ./node_modules/core-js/modules/es.typed-array.reduce.js
var es_typed_array_reduce = __webpack_require__("ca91");

// EXTERNAL MODULE: ./node_modules/core-js/modules/es.typed-array.reduce-right.js
var es_typed_array_reduce_right = __webpack_require__("25a1");

// EXTERNAL MODULE: ./node_modules/core-js/modules/es.typed-array.reverse.js
var es_typed_array_reverse = __webpack_require__("cd26");

// EXTERNAL MODULE: ./node_modules/core-js/modules/es.typed-array.set.js
var es_typed_array_set = __webpack_require__("3c5d");

// EXTERNAL MODULE: ./node_modules/core-js/modules/es.typed-array.slice.js
var es_typed_array_slice = __webpack_require__("2954");

// EXTERNAL MODULE: ./node_modules/core-js/modules/es.typed-array.some.js
var es_typed_array_some = __webpack_require__("649e");

// EXTERNAL MODULE: ./node_modules/core-js/modules/es.typed-array.sort.js
var es_typed_array_sort = __webpack_require__("219c");

// EXTERNAL MODULE: ./node_modules/core-js/modules/es.typed-array.subarray.js
var es_typed_array_subarray = __webpack_require__("170b");

// EXTERNAL MODULE: ./node_modules/core-js/modules/es.typed-array.to-locale-string.js
var es_typed_array_to_locale_string = __webpack_require__("b39a");

// EXTERNAL MODULE: ./node_modules/core-js/modules/es.typed-array.to-string.js
var es_typed_array_to_string = __webpack_require__("72f7");

// EXTERNAL MODULE: ./node_modules/core-js/modules/es.array-buffer.slice.js
var es_array_buffer_slice = __webpack_require__("ace4");

// EXTERNAL MODULE: ./node_modules/core-js/modules/es.string.pad-start.js
var es_string_pad_start = __webpack_require__("4d90");

// CONCATENATED MODULE: ./src/assets/oras_catalog_packs.js





















































var ORAS_CATALOG_PACKS_ROOT = '/oras-sky-engine/skydata/catalog-packs';

function emptySnapshot() {
  var phase = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'idle';
  return {
    phase: phase,
    mounted: false,
    releaseVersion: null,
    generatedAt: null,
    objectCount: 0,
    packs: []
  };
}

function createOrasCatalogPackManager() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var root = String(options.root || ORAS_CATALOG_PACKS_ROOT).replace(/\/$/, '');
  var fetchImpl = options.fetchImpl || (typeof window !== 'undefined' && typeof window.fetch === 'function' ? window.fetch.bind(window) : undefined);
  var digestImpl = options.digestImpl || digestText;
  var loadRecords = options.loadRecords === true;
  var snapshot = emptySnapshot();
  var records = [];
  var searchCandidates = [];
  var loadingPromise;
  var listeners = new Set();

  function publish(nextSnapshot) {
    snapshot = Object.assign({}, nextSnapshot, {
      packs: (nextSnapshot.packs || []).map(function (pack) {
        return Object.assign({}, pack);
      })
    });
    listeners.forEach(function (listener) {
      return listener(getSnapshot());
    });
    return getSnapshot();
  }

  function getSnapshot() {
    return Object.assign({}, snapshot, {
      packs: snapshot.packs.map(function (pack) {
        return Object.assign({}, pack);
      })
    });
  }

  function load() {
    return _load.apply(this, arguments);
  }

  function _load() {
    _load = Object(asyncToGenerator["a" /* default */])( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              if (!loadingPromise) {
                _context.next = 2;
                break;
              }

              return _context.abrupt("return", loadingPromise);

            case 2:
              loadingPromise = loadRelease().finally(function () {
                loadingPromise = undefined;
              });
              return _context.abrupt("return", loadingPromise);

            case 4:
            case "end":
              return _context.stop();
          }
        }
      }, _callee);
    }));
    return _load.apply(this, arguments);
  }

  function loadRelease() {
    return _loadRelease.apply(this, arguments);
  }

  function _loadRelease() {
    _loadRelease = Object(asyncToGenerator["a" /* default */])( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
      var manifestResponse, manifest, packStatuses, _iterator2, _step2, pack, status, loadedCount;

      return regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              publish(Object.assign(emptySnapshot('loading'), {
                mounted: snapshot.mounted
              }));
              records = [];
              searchCandidates = [];

              if (!(typeof fetchImpl !== 'function')) {
                _context2.next = 5;
                break;
              }

              return _context2.abrupt("return", publish(emptySnapshot('not-mounted')));

            case 5:
              _context2.prev = 5;
              _context2.next = 8;
              return fetchImpl(root + '/manifest.json', {
                cache: 'no-store'
              });

            case 8:
              manifestResponse = _context2.sent;
              _context2.next = 14;
              break;

            case 11:
              _context2.prev = 11;
              _context2.t0 = _context2["catch"](5);
              return _context2.abrupt("return", publish(emptySnapshot('not-mounted')));

            case 14:
              if (!(!manifestResponse || !manifestResponse.ok)) {
                _context2.next = 16;
                break;
              }

              return _context2.abrupt("return", publish(emptySnapshot('not-mounted')));

            case 16:
              _context2.prev = 16;
              _context2.t1 = JSON;
              _context2.next = 20;
              return manifestResponse.text();

            case 20:
              _context2.t2 = _context2.sent;
              manifest = _context2.t1.parse.call(_context2.t1, _context2.t2);
              validateManifest(manifest);
              _context2.next = 28;
              break;

            case 25:
              _context2.prev = 25;
              _context2.t3 = _context2["catch"](16);
              return _context2.abrupt("return", publish(Object.assign(emptySnapshot('failed'), {
                mounted: true,
                packs: [{
                  packId: 'manifest',
                  label: 'Catalog manifest',
                  status: 'failed',
                  error: _context2.t3.message
                }]
              })));

            case 28:
              packStatuses = loadRecords ? [] : manifest.packs.map(function (pack) {
                return manifestPackStatus(pack);
              });

              if (!loadRecords) {
                _context2.next = 49;
                break;
              }

              _iterator2 = Object(createForOfIteratorHelper["a" /* default */])(manifest.packs);
              _context2.prev = 31;

              _iterator2.s();

            case 33:
              if ((_step2 = _iterator2.n()).done) {
                _context2.next = 41;
                break;
              }

              pack = _step2.value;
              _context2.next = 37;
              return loadPack(pack);

            case 37:
              status = _context2.sent;
              packStatuses.push(status);

            case 39:
              _context2.next = 33;
              break;

            case 41:
              _context2.next = 46;
              break;

            case 43:
              _context2.prev = 43;
              _context2.t4 = _context2["catch"](31);

              _iterator2.e(_context2.t4);

            case 46:
              _context2.prev = 46;

              _iterator2.f();

              return _context2.finish(46);

            case 49:
              loadedCount = loadRecords ? packStatuses.reduce(function (total, pack) {
                return total + pack.loadedObjectCount;
              }, 0) : Number(manifest.object_count) || packStatuses.reduce(function (total, pack) {
                return total + pack.loadedObjectCount;
              }, 0);
              return _context2.abrupt("return", publish({
                phase: packStatuses.some(function (pack) {
                  return pack.status === 'failed';
                }) ? 'degraded' : 'loaded',
                mounted: true,
                releaseVersion: String(manifest.release_version),
                generatedAt: manifest.generated_at || null,
                objectCount: loadedCount,
                packs: packStatuses
              }));

            case 51:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2, null, [[5, 11], [16, 25], [31, 43, 46, 49]]);
    }));
    return _loadRelease.apply(this, arguments);
  }

  function manifestPackStatus(pack) {
    return {
      packId: String(pack.pack_id),
      label: String(pack.label || pack.pack_id),
      category: String(pack.category || 'unknown'),
      version: String(pack.version || ''),
      generatedAt: pack.generated_at || null,
      declaredObjectCount: Number(pack.object_count) || 0,
      loadedObjectCount: Number(pack.object_count) || 0,
      sources: Array.isArray(pack.sources) ? pack.sources.map(function (source) {
        return Object.assign({}, source);
      }) : [],
      status: 'loaded',
      error: null
    };
  }

  function loadPack(_x) {
    return _loadPack.apply(this, arguments);
  }

  function _loadPack() {
    _loadPack = Object(asyncToGenerator["a" /* default */])( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(pack) {
      var status, packRecords, _records, _searchCandidates, _iterator3, _step3, chunk, chunkPath, chunkResponse, text, byteSize, digest, chunkRecords, existingIdentities, packIdentities;

      return regeneratorRuntime.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              status = Object.assign(manifestPackStatus(pack), {
                loadedObjectCount: 0
              });
              packRecords = [];
              _context3.prev = 2;
              _iterator3 = Object(createForOfIteratorHelper["a" /* default */])(pack.chunks || []);
              _context3.prev = 4;

              _iterator3.s();

            case 6:
              if ((_step3 = _iterator3.n()).done) {
                _context3.next = 31;
                break;
              }

              chunk = _step3.value;
              chunkPath = validateChunkPath(chunk.path);
              _context3.next = 11;
              return fetchImpl(root + '/' + chunkPath, {
                cache: 'no-store'
              });

            case 11:
              chunkResponse = _context3.sent;

              if (!(!chunkResponse || !chunkResponse.ok)) {
                _context3.next = 14;
                break;
              }

              throw new Error('chunk request failed: ' + chunkPath);

            case 14:
              _context3.next = 16;
              return chunkResponse.text();

            case 16:
              text = _context3.sent;
              byteSize = new TextEncoder().encode(text).byteLength;

              if (!(byteSize !== Number(chunk.byte_size))) {
                _context3.next = 20;
                break;
              }

              throw new Error('byte size mismatch: ' + chunkPath);

            case 20:
              _context3.next = 22;
              return digestImpl(text);

            case 22:
              digest = _context3.sent;

              if (!(digest !== chunk.sha256)) {
                _context3.next = 25;
                break;
              }

              throw new Error('checksum mismatch: ' + chunkPath);

            case 25:
              chunkRecords = text.split('\n').filter(Boolean).map(function (line) {
                return JSON.parse(line);
              });

              if (!(chunkRecords.length !== Number(chunk.object_count))) {
                _context3.next = 28;
                break;
              }

              throw new Error('object count mismatch: ' + chunkPath);

            case 28:
              chunkRecords.forEach(function (record) {
                return packRecords.push(validateRecord(record, pack));
              });

            case 29:
              _context3.next = 6;
              break;

            case 31:
              _context3.next = 36;
              break;

            case 33:
              _context3.prev = 33;
              _context3.t0 = _context3["catch"](4);

              _iterator3.e(_context3.t0);

            case 36:
              _context3.prev = 36;

              _iterator3.f();

              return _context3.finish(36);

            case 39:
              if (!(packRecords.length !== status.declaredObjectCount)) {
                _context3.next = 41;
                break;
              }

              throw new Error('pack object count mismatch');

            case 41:
              existingIdentities = new Set(records.map(identityKey));
              packIdentities = packRecords.map(identityKey);

              if (!(new Set(packIdentities).size !== packIdentities.length || packIdentities.some(function (key) {
                return existingIdentities.has(key);
              }))) {
                _context3.next = 45;
                break;
              }

              throw new Error('duplicate catalog identity');

            case 45:
              (_records = records).push.apply(_records, packRecords);

              (_searchCandidates = searchCandidates).push.apply(_searchCandidates, Object(toConsumableArray["a" /* default */])(packRecords.map(function (record) {
                return {
                  record: record,
                  aliases: recordAliases(record).map(normalizeSearchText)
                };
              })));

              status.loadedObjectCount = packRecords.length;
              _context3.next = 54;
              break;

            case 50:
              _context3.prev = 50;
              _context3.t1 = _context3["catch"](2);
              status.status = 'failed';
              status.error = _context3.t1.message;

            case 54:
              return _context3.abrupt("return", status);

            case 55:
            case "end":
              return _context3.stop();
          }
        }
      }, _callee3, null, [[2, 50], [4, 33, 36, 39]]);
    }));
    return _loadPack.apply(this, arguments);
  }

  function search(query) {
    var limit = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 10;
    var normalizedQuery = normalizeSearchText(query);
    if (!normalizedQuery || limit < 1) return [];
    return searchCandidates.map(function (candidate) {
      return {
        record: candidate.record,
        score: candidate.aliases.reduce(function (best, alias) {
          if (alias === normalizedQuery) return Math.max(best, 4);
          if (alias.startsWith(normalizedQuery)) return Math.max(best, 3);
          if (normalizedQuery.length >= 3 && alias.includes(normalizedQuery)) return Math.max(best, 2);
          return best;
        }, 0)
      };
    }).filter(function (candidate) {
      return candidate.score > 0;
    }).sort(function (a, b) {
      return b.score - a.score || magnitude(a.record) - magnitude(b.record) || a.record.display_name.localeCompare(b.record.display_name);
    }).slice(0, limit).map(function (candidate) {
      return Object.assign({}, candidate.record);
    });
  }

  function find(identity) {
    var key = identityKey({
      catalog: identity && identity.catalog,
      source_id: identity && (identity.sourceId == null ? identity.source_id : identity.sourceId),
      model: identity && identity.model
    });
    var match = records.find(function (record) {
      return identityKey(record) === key;
    });
    return match ? Object.assign({}, match) : undefined;
  }

  function overlayRecords() {
    var results = [];

    var _iterator = Object(createForOfIteratorHelper["a" /* default */])(snapshot.packs.filter(function (pack) {
      return pack.status === 'loaded';
    })),
        _step;

    try {
      var _loop = function _loop() {
        var pack = _step.value;
        var manifestPack = records.filter(function (record) {
          return record.pack_id === pack.packId;
        });
        var limit = manifestPack.length ? Number(manifestPack[0].pack_overlay_limit) || 0 : 0;
        results.push.apply(results, Object(toConsumableArray["a" /* default */])(manifestPack.filter(function (record) {
          return record.render_hint !== 'hidden';
        }).sort(function (a, b) {
          return magnitude(a) - magnitude(b) || a.display_name.localeCompare(b.display_name);
        }).slice(0, limit).map(function (record) {
          return Object.assign({}, record);
        })));
      };

      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        _loop();
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }

    return results;
  }

  function subscribe(listener) {
    listeners.add(listener);
    listener(getSnapshot());
    return function () {
      return listeners.delete(listener);
    };
  }

  return {
    load: load,
    search: search,
    find: find,
    overlayRecords: overlayRecords,
    subscribe: subscribe,
    getSnapshot: getSnapshot
  };
}

function validateManifest(manifest) {
  if (!manifest || manifest.schema_version !== 1) throw new Error('unsupported catalog manifest schema');
  if (!Array.isArray(manifest.packs)) throw new Error('catalog manifest packs must be a list');
  if (!manifest.release_version) throw new Error('catalog release version is required');
}

function validateRecord(record, pack) {
  if (!record || Object(esm_typeof["a" /* default */])(record) !== 'object') throw new Error('catalog record must be an object');

  for (var _i = 0, _arr = ['catalog', 'source_id', 'model', 'display_name', 'category']; _i < _arr.length; _i++) {
    var field = _arr[_i];

    if (typeof record[field] !== 'string' || !record[field].trim()) {
      throw new Error('catalog record identity fields must be strings');
    }
  }

  if (!Array.isArray(record.source_attribution) || !record.source_attribution.length) {
    throw new Error('catalog record source attribution is required');
  }

  if (!Number.isFinite(Number(record.ra)) || !Number.isFinite(Number(record.dec))) {
    throw new Error('catalog record coordinates are required');
  }

  var ra = Number(record.ra);
  var dec = Number(record.dec);

  if (ra < 0 || ra >= 360 || dec < -90 || dec > 90) {
    throw new Error('catalog record coordinates are out of range');
  }

  return Object.assign({}, record, {
    source_id: String(record.source_id),
    ra: ra,
    dec: dec,
    pack_id: String(pack.pack_id),
    pack_version: String(pack.version),
    pack_overlay_limit: Number(pack.overlay_limit) || 0,
    pack_sources: Array.isArray(pack.sources) ? pack.sources.map(function (source) {
      return Object.assign({}, source);
    }) : [],
    indexed: true,
    status: 'indexed',
    provenance: {
      source_key: 'oras_catalog_pack',
      pack_id: String(pack.pack_id),
      pack_version: String(pack.version)
    }
  });
}

function validateChunkPath(value) {
  var text = String(value || '').trim();

  if (!text || text.startsWith('/') || text.includes('\\') || text.split('/').includes('..')) {
    throw new Error('unsafe chunk path');
  }

  return text;
}

function recordAliases(record) {
  return uniqueStrings([record.display_name, record.source_id, record.catalog + ' ' + record.source_id].concat(Object(toConsumableArray["a" /* default */])(record.names || []), Object(toConsumableArray["a" /* default */])(record.aliases || []), Object(toConsumableArray["a" /* default */])(record.common_names || []), Object(toConsumableArray["a" /* default */])(record.catalog_ids || [])));
}

function identityKey(record) {
  return [record.catalog, record.source_id, record.model].map(function (value) {
    return String(value || '').trim().toLowerCase();
  }).join("\0");
}

function normalizeSearchText(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function uniqueStrings(values) {
  return values.map(function (value) {
    return String(value || '').trim();
  }).filter(function (value, index, all) {
    return value && all.indexOf(value) === index;
  });
}

function magnitude(record) {
  var value = Number(record.magnitude);
  return Number.isFinite(value) ? value : 99;
}

function digestText(_x2) {
  return _digestText.apply(this, arguments);
}

function _digestText() {
  _digestText = Object(asyncToGenerator["a" /* default */])( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(text) {
    var digest;
    return regeneratorRuntime.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            if (!(typeof window === 'undefined' || !window.crypto || !window.crypto.subtle)) {
              _context4.next = 2;
              break;
            }

            throw new Error('Web Crypto is unavailable');

          case 2:
            _context4.next = 4;
            return window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));

          case 4:
            digest = _context4.sent;
            return _context4.abrupt("return", Array.from(new Uint8Array(digest)).map(function (value) {
              return value.toString(16).padStart(2, '0');
            }).join(''));

          case 6:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4);
  }));
  return _digestText.apply(this, arguments);
}

var orasCatalogPacks = createOrasCatalogPackManager();
// CONCATENATED MODULE: ./src/assets/sw_helpers.js






















// Stellarium Web - Copyright (c) 2022 - Stellarium Labs SRL
//
// This program is licensed under the terms of the GNU AGPL v3, or
// alternatively under a commercial licence.
//
// The terms of the AGPL v3 license can be found in the main directory of this
// repository.






var DDDate = Date;

DDDate.prototype.getJD = function () {
  return this.getTime() / 86400000 + 2440587.5;
};

DDDate.prototype.setJD = function (jd) {
  this.setTime((jd - 2440587.5) * 86400000);
};

DDDate.prototype.getMJD = function () {
  return this.getJD() - 2400000.5;
};

DDDate.prototype.setMJD = function (mjd) {
  this.setJD(mjd + 2400000.5);
};

var swh = {
  initStelWebEngine: function initStelWebEngine(store, wasmFile, canvasElem, callBackOnDone) {
    Object(stellarium_web_engine["a" /* default */])({
      wasmFile: wasmFile,
      canvas: canvasElem,
      translateFn: function translateFn(domain, str) {
        return str; // return i18next.t(str, {ns: domain});
      },
      onReady: function onReady(lstel) {
        store.commit('replaceStelWebEngine', lstel.getTree());
        lstel.onValueChanged(function (path, value) {
          var tree = store.state.stel;

          lodash_default.a.set(tree, path, value);

          store.commit('replaceStelWebEngine', tree);
        });
        vue_esm["a" /* default */].prototype.$stel = lstel;
        window.__ORAS_STEL = lstel;
        vue_esm["a" /* default */].prototype.$selectionLayer = lstel.createLayer({
          id: 'slayer',
          z: 50,
          visible: true
        });
        vue_esm["a" /* default */].prototype.$observingLayer = lstel.createLayer({
          id: 'obslayer',
          z: 40,
          visible: true
        });
        vue_esm["a" /* default */].prototype.$skyHintsLayer = lstel.createLayer({
          id: 'skyhintslayer',
          z: 38,
          visible: true
        });
        callBackOnDone();
      }
    });
  },
  monthNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  astroConstants: {
    // Light time for 1 au in s
    ERFA_AULT: 499.004782,
    // Seconds per day
    ERFA_DAYSEC: 86400.0,
    // Days per Julian year
    ERFA_DJY: 365.25,
    // Astronomical unit in m
    ERFA_DAU: 149597870000
  },
  iconForSkySourceTypes: function iconForSkySourceTypes(skySourceTypes) {
    // Array sorted by specificity, i.e. the most generic names at the end
    var iconForType = {
      // Stars
      'Pec?': 'star',
      '**?': 'double_star',
      '**': 'double_star',
      'V*': 'variable_star',
      'V*?': 'variable_star',
      '*': 'star',
      // Candidates
      'As?': 'group_of_stars',
      'SC?': 'group_of_galaxies',
      'Gr?': 'group_of_galaxies',
      'C?G': 'group_of_galaxies',
      'G?': 'galaxy',
      // Multiple objects
      reg: 'region_defined_in_the_sky',
      SCG: 'group_of_galaxies',
      ClG: 'group_of_galaxies',
      GrG: 'group_of_galaxies',
      IG: 'interacting_galaxy',
      PaG: 'pair_of_galaxies',
      'C?*': 'open_galactic_cluster',
      'Gl?': 'globular_cluster',
      GlC: 'globular_cluster',
      OpC: 'open_galactic_cluster',
      'Cl*': 'open_galactic_cluster',
      'As*': 'group_of_stars',
      mul: 'multiple_objects',
      // Interstellar matter
      'PN?': 'planetary_nebula',
      PN: 'planetary_nebula',
      SNR: 'planetary_nebula',
      'SR?': 'planetary_nebula',
      ISM: 'interstellar_matter',
      // Galaxies
      PoG: 'part_of_galaxy',
      QSO: 'quasar',
      G: 'galaxy',
      dso: 'deep_sky',
      // Solar System
      Asa: 'artificial_satellite',
      Moo: 'moon',
      Sun: 'sun',
      Pla: 'planet',
      DPl: 'planet',
      Com: 'comet',
      MPl: 'minor_planet',
      SSO: 'minor_planet',
      Con: 'constellation'
    };

    for (var i in skySourceTypes) {
      if (skySourceTypes[i] in iconForType) {
        return "/oras-sky-engine/" + 'images/svg/target_types/' + iconForType[skySourceTypes[i]] + '.svg';
      }
    }

    return "/oras-sky-engine/" + 'images/svg/target_types/unknown.svg';
  },
  iconForSkySource: function iconForSkySource(skySource) {
    return swh.iconForSkySourceTypes(skySource.types);
  },
  iconForObservation: function iconForObservation(obs) {
    if (obs && obs.target) {
      return this.iconForSkySource(obs.target);
    } else {
      return this.iconForSkySourceTypes(['reg']);
    }
  },
  cleanupOneSkySourceName: function cleanupOneSkySourceName(name, flags) {
    flags = flags || 4;
    return vue_esm["a" /* default */].prototype.$stel.designationCleanup(name, flags);
  },
  nameForSkySource: function nameForSkySource(skySource) {
    if (!skySource || !skySource.names) {
      return '?';
    }

    return this.cleanupOneSkySourceName(skySource.names[0]);
  },
  culturalNameToList: function culturalNameToList(cn) {
    var res = [];

    var formatNative = function formatNative(_cn) {
      if (cn.name_native && cn.name_pronounce) {
        return cn.name_native + ', <i>' + cn.name_pronounce + '</i>';
      }

      if (cn.name_native) {
        return cn.name_native;
      }

      if (cn.name_pronounce) {
        return cn.name_pronounce;
      }
    };

    var nativeName = formatNative(cn);

    if (cn.user_prefer_native && nativeName) {
      res.push(nativeName);
    }

    if (cn.name_translated) {
      res.push(cn.name_translated);
    }

    if (!cn.user_prefer_native && nativeName) {
      res.push(nativeName);
    }

    return res;
  },
  namesForSkySource: function namesForSkySource(ss, flags) {
    // Return a list of cleaned up names
    if (!ss || !ss.names) {
      return [];
    }

    if (!flags) flags = 10;
    var res = [];

    if (ss.culturalNames) {
      for (var i in ss.culturalNames) {
        res = res.concat(this.culturalNameToList(ss.culturalNames[i]));
      }
    }

    res = res.concat(ss.names.map(function (n) {
      return vue_esm["a" /* default */].prototype.$stel.designationCleanup(n, flags);
    })); // Remove duplicates, this can happen between * and V* catalogs

    res = res.filter(function (v, i) {
      return res.indexOf(v) === i;
    });
    res = res.filter(function (v, i) {
      return !v.startsWith('CON ');
    });
    return res;
  },
  nameForSkySourceType: function nameForSkySourceType(otype) {
    var $stel = vue_esm["a" /* default */].prototype.$stel;
    var res = $stel.otypeToStr(otype);
    return res || 'Unknown Type';
  },
  nameForGalaxyMorpho: function nameForGalaxyMorpho(morpho) {
    var galTab = {
      E: 'Elliptical',
      SB: 'Barred Spiral',
      SAB: 'Intermediate Spiral',
      SA: 'Spiral',
      S0: 'Lenticular',
      S: 'Spiral',
      Im: 'Irregular',
      dSph: 'Dwarf Spheroidal',
      dE: 'Dwarf Elliptical'
    };

    for (var morp in galTab) {
      if (morpho.startsWith(morp)) {
        return galTab[morp];
      }
    }

    return '';
  },
  getShareLink: function getShareLink(context) {
    var origin = typeof window !== 'undefined' && window.location ? window.location.origin : '';
    var basePath = "/oras-sky-engine/" || false;
    var link = origin + (basePath.endsWith('/') ? basePath : basePath + '/');
    var selectedObject = context.$store.state.selectedObject;

    if (selectedObject) {
      link += 'skysource/' + this.cleanupOneSkySourceName(selectedObject.names[0], 5).replace(/\s+/g, '');
    }

    link += '?';
    link += 'fov=' + (context.$store.state.stel.fov * 180 / Math.PI).toPrecision(5);
    var d = new Date();
    d.setMJD(context.$stel.core.observer.utc);
    link += '&date=' + new moment_default.a(d).utc().format();
    link += '&lat=' + (context.$stel.core.observer.latitude * 180 / Math.PI).toFixed(2);
    link += '&lng=' + (context.$stel.core.observer.longitude * 180 / Math.PI).toFixed(2);
    link += '&elev=' + context.$stel.core.observer.elevation;

    if (selectedObject) {
      if (selectedObject.catalog) {
        link += '&catalog=' + encodeURIComponent(selectedObject.catalog);
      }

      if (selectedObject.source_id != null) {
        link += '&source_id=' + encodeURIComponent(String(selectedObject.source_id));
      }

      if (selectedObject.model) {
        link += '&model=' + encodeURIComponent(selectedObject.model);
      }

      if (selectedObject.ra != null) {
        link += '&ra=' + encodeURIComponent(String(selectedObject.ra));
      }

      if (selectedObject.dec != null) {
        link += '&dec=' + encodeURIComponent(String(selectedObject.dec));
      }
    }

    if (!selectedObject) {
      link += '&az=' + (context.$stel.core.observer.yaw * 180 / Math.PI).toPrecision(5);
      link += '&alt=' + (context.$stel.core.observer.pitch * 180 / Math.PI).toPrecision(5);
    }

    return link;
  },
  // Return a SweObj matching a passed sky source JSON object if it's already instanciated in SWE
  skySource2SweObj: function skySource2SweObj(ss) {
    if (!ss || !ss.model) {
      return undefined;
    }

    var $stel = vue_esm["a" /* default */].prototype.$stel;
    var obj;

    if (ss.model === 'tle_satellite') {
      var id = 'NORAD ' + ss.model_data.norad_number;
      obj = $stel.getObj(id);
    } else if (ss.model === 'constellation' && ss.model_data.iau_abbreviation) {
      var _id = 'CON western ' + ss.model_data.iau_abbreviation;

      obj = $stel.getObj(_id);
    }

    if (!obj) {
      var baseNames = [];

      if (Array.isArray(ss.names)) {
        baseNames.push.apply(baseNames, Object(toConsumableArray["a" /* default */])(ss.names));
      }

      if (ss.display_name) {
        baseNames.push(ss.display_name);
      }

      if (ss.source_id != null) {
        baseNames.push(String(ss.source_id));
      }

      var candidateNames = [];
      var compactMessierPattern = /^M\d+$/i;

      for (var _i = 0, _baseNames = baseNames; _i < _baseNames.length; _i++) {
        var rawName = _baseNames[_i];
        var name = String(rawName || '').trim();

        if (!name) {
          continue;
        }

        candidateNames.push(name);
        candidateNames.push(this.cleanupOneSkySourceName(name, 5));
        candidateNames.push('NAME ' + name);
        candidateNames.push('* ' + name);
        var compactName = name.replace(/\s+/g, '');

        if (compactMessierPattern.test(compactName)) {
          var messierNumber = compactName.slice(1);
          candidateNames.push('M' + messierNumber);
          candidateNames.push('M ' + messierNumber);
        }

        candidateNames.push('M ' + name.replace(/^M\s*/i, ''));
        candidateNames.push('NGC ' + name.replace(/^NGC\s*/i, ''));
        candidateNames.push('IC ' + name.replace(/^IC\s*/i, ''));
      }

      obj = candidateNames.map(function (candidate) {
        return String(candidate || '').trim();
      }).filter(function (candidate, index, all) {
        return candidate !== '' && all.indexOf(candidate) === index;
      }).map(function (candidate) {
        return $stel.getObj(candidate);
      }).find(Boolean);
    }

    if (!obj && ss.names[0].startsWith('Gaia DR2 ')) {
      var gname = ss.names[0].replace(/^Gaia DR2 /, 'GAIA ');
      obj = $stel.getObj(gname);
    }

    if (obj === null) return undefined;
    return obj;
  },
  localSolarSystemCatalog: function localSolarSystemCatalog() {
    return [{
      match: 'Sun',
      names: ['NAME Sun', 'Sun']
    }, {
      match: 'Moon',
      names: ['NAME Moon', 'Moon']
    }, {
      match: 'Mercury',
      names: ['NAME Mercury', 'Mercury']
    }, {
      match: 'Venus',
      names: ['NAME Venus', 'Venus']
    }, {
      match: 'Earth',
      names: ['NAME Earth', 'Earth']
    }, {
      match: 'Mars',
      names: ['NAME Mars', 'Mars']
    }, {
      match: 'Jupiter',
      names: ['NAME Jupiter', 'Jupiter']
    }, {
      match: 'Saturn',
      names: ['NAME Saturn', 'Saturn']
    }, {
      match: 'Uranus',
      names: ['NAME Uranus', 'Uranus']
    }, {
      match: 'Neptune',
      names: ['NAME Neptune', 'Neptune']
    }];
  },
  localSkySourceFromSweObj: function localSkySourceFromSweObj(obj, match) {
    if (!obj) {
      return undefined;
    }

    var ss = Object.assign({}, obj.__orasSkySourceData || obj.jsonData || {});
    ss.match = match || ss.match || this.cleanupOneSkySourceName(ss.names && ss.names[0] || obj.designations()[0], 5);
    ss.names = ss.names || obj.designations();
    ss.types = ss.types || (obj.type ? [obj.type] : ['SSO']);
    ss.model = ss.model || 'jpl_sso';
    ss.model_data = ss.model_data || {};
    ss.culturalNames = obj.culturalDesignations();
    return ss;
  },
  localQueryResults: function localQueryResults(query, limit) {
    var results = [];
    var exactLocalResult = this.lookupSkySourceLocallyByName(query);

    if (exactLocalResult) {
      results.push(exactLocalResult);
    }

    var localMatches = this.queryLocalSkySources(query, limit);

    var _iterator = Object(createForOfIteratorHelper["a" /* default */])(localMatches),
        _step;

    try {
      var _loop = function _loop() {
        var localMatch = _step.value;

        if (!results.find(function (existing) {
          return existing.names[0] === localMatch.names[0];
        })) {
          results.push(localMatch);
        }
      };

      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        _loop();
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }

    return results.slice(0, limit || 10);
  },
  fetchOrasSkySearch: function fetchOrasSkySearch(query) {
    var normalized = normalizeOrasSearchQuery(query);
    var searchUrl = buildOrasSearchUrl(normalized);

    if (!searchUrl) {
      return Promise.resolve({
        results: [],
        recognizedQuery: false
      });
    }

    if (typeof fetch !== 'function') {
      return Promise.reject(new Error('fetch is not available'));
    }

    return fetch(searchUrl, {
      headers: {
        Accept: 'application/json'
      }
    }).then(function (response) {
      if (!response.ok) {
        throw new Error('ORAS sky search request failed with status ' + response.status);
      }

      return response.json();
    }).then(function (payload) {
      var data = payload && payload.data ? payload.data : {};
      var rawResults = Array.isArray(data.results) ? data.results : [];
      return {
        recognizedQuery: Boolean(data.recognized_query),
        results: rawResults.map(toOrasSkySource).filter(Boolean)
      };
    });
  },
  fetchOrasSkySourceByIdentity: function fetchOrasSkySourceByIdentity(_ref) {
    var catalog = _ref.catalog,
        sourceId = _ref.sourceId,
        model = _ref.model,
        time = _ref.time,
        lat = _ref.lat,
        lng = _ref.lng,
        elev = _ref.elev;
    var lookupUrl = buildOrasObjectLookupUrl({
      catalog: catalog,
      sourceId: sourceId,
      model: model,
      time: time,
      lat: lat,
      lng: lng,
      elev: elev
    });

    if (!lookupUrl) {
      return Promise.reject(new Error('Sky source identity is incomplete'));
    }

    if (typeof fetch !== 'function') {
      return Promise.reject(new Error('fetch is not available'));
    }

    return fetch(lookupUrl, {
      headers: {
        Accept: 'application/json'
      }
    }).then(function (response) {
      if (!response.ok) {
        throw new Error('ORAS sky object request failed with status ' + response.status);
      }

      return response.json();
    }).then(function (payload) {
      return toOrasSkySource(payload && payload.data ? payload.data : undefined);
    });
  },
  shouldPreferLocalSkySourceFallback: function shouldPreferLocalSkySourceFallback() {
    if (typeof window === 'undefined' || !window.location) {
      return false;
    }

    var hostname = window.location.hostname || '';
    return hostname === '127.0.0.1' || hostname === 'localhost';
  },
  lookupSkySourceLocallyByName: function lookupSkySourceLocallyByName(name) {
    var localResult = this.lookupLocalSkySourceByName(name);

    if (localResult) {
      return localResult;
    }

    var $stel = vue_esm["a" /* default */].prototype.$stel;

    if (!$stel || !name) {
      return undefined;
    }

    var candidates = [name, this.cleanupOneSkySourceName(name, 5), 'NAME ' + name, '*' + ' ' + name, 'M ' + name.replace(/^M\s*/i, ''), 'NGC ' + name.replace(/^NGC\s*/i, ''), 'IC ' + name.replace(/^IC\s*/i, '')].filter(Boolean);
    var obj = candidates.map(function (candidate) {
      return String(candidate).trim();
    }).filter(function (candidate, index, array) {
      return candidate !== '' && array.indexOf(candidate) === index;
    }).map(function (candidate) {
      return $stel.getObj(candidate);
    }).find(Boolean);
    return this.localSkySourceFromSweObj(obj, name);
  },
  lookupLocalSkySourceByName: function lookupLocalSkySourceByName(name) {
    var $stel = vue_esm["a" /* default */].prototype.$stel;

    if (!$stel || !name) {
      return undefined;
    }

    var normalized = String(name).trim().toUpperCase().replace(/\s+/g, '');
    var entry = this.localSolarSystemCatalog().find(function (candidate) {
      return candidate.names.some(function (candidateName) {
        return candidateName.toUpperCase().replace(/\s+/g, '') === normalized;
      }) || candidate.match.toUpperCase().replace(/\s+/g, '') === normalized;
    });

    if (!entry) {
      return undefined;
    }

    var obj = entry.names.map(function (candidateName) {
      return $stel.getObj(candidateName);
    }).find(Boolean);
    return this.localSkySourceFromSweObj(obj, entry.match);
  },
  queryLocalSkySources: function queryLocalSkySources(str, limit) {
    var _this = this;

    var $stel = vue_esm["a" /* default */].prototype.$stel;

    if (!$stel || !str) {
      return [];
    }

    var normalized = String(str).trim().toUpperCase().replace(/\s+/g, '');

    if (!normalized) {
      return [];
    }

    return this.localSolarSystemCatalog().filter(function (candidate) {
      return candidate.match.toUpperCase().replace(/\s+/g, '').includes(normalized) || candidate.names.some(function (candidateName) {
        return candidateName.toUpperCase().replace(/\s+/g, '').includes(normalized);
      });
    }).map(function (candidate) {
      var obj = candidate.names.map(function (candidateName) {
        return $stel.getObj(candidateName);
      }).find(Boolean);
      return _this.localSkySourceFromSweObj(obj, candidate.match);
    }).filter(Boolean).slice(0, limit || 10);
  },
  lookupSkySourceByName: function lookupSkySourceByName(name) {
    var _this2 = this;

    var normalized = normalizeOrasSearchQuery(name);

    if (!normalized) {
      return Promise.reject(new Error('Sky source name is required'));
    }

    var findLocalResult = function findLocalResult() {
      var localResult = _this2.lookupSkySourceLocallyByName(normalized);

      if (localResult) {
        return Promise.resolve(localResult);
      }

      return Promise.reject(new Error('Local sky source not found'));
    };

    return this.fetchOrasSkySearch(normalized).then(function (searchResponse) {
      if (searchResponse.results.length) {
        return searchResponse.results[0];
      }

      return findLocalResult();
    }, function () {
      return findLocalResult();
    });
  },
  querySkySources: function querySkySources(str, limit) {
    var _this3 = this;

    limit = limit || 10;
    var normalized = normalizeOrasSearchQuery(str);

    if (!normalized) {
      return Promise.resolve([]);
    }

    var packResults = orasCatalogPacks.search(normalized, limit).map(toOrasSkySource).filter(Boolean);
    return this.fetchOrasSkySearch(normalized).then(function (searchResponse) {
      return _this3.mergeSkySourceResults(searchResponse.results, packResults, _this3.localQueryResults(normalized, limit)).slice(0, limit);
    }, function () {
      return _this3.mergeSkySourceResults(packResults, _this3.localQueryResults(normalized, limit)).slice(0, limit);
    });
  },
  mergeSkySourceResults: function mergeSkySourceResults() {
    var results = [];
    var identities = new Set();

    for (var _len = arguments.length, groups = new Array(_len), _key = 0; _key < _len; _key++) {
      groups[_key] = arguments[_key];
    }

    for (var _i2 = 0, _groups = groups; _i2 < _groups.length; _i2++) {
      var group = _groups[_i2];

      var _iterator2 = Object(createForOfIteratorHelper["a" /* default */])(group || []),
          _step2;

      try {
        for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
          var result = _step2.value;
          var identity = [result.catalog, result.source_id, result.model].map(function (value) {
            return String(value || '').trim().toLowerCase();
          }).join("\0");
          var fallbackIdentity = String(result.names && result.names[0] || result.match || '').trim().toLowerCase();
          var key = identity === "\0\0" ? fallbackIdentity : identity;
          if (!key || identities.has(key)) continue;
          identities.add(key);
          results.push(result);
        }
      } catch (err) {
        _iterator2.e(err);
      } finally {
        _iterator2.f();
      }
    }

    return results;
  },
  skySourceMatchesIdentity: function skySourceMatchesIdentity(ss, identity) {
    if (!ss || !identity) {
      return false;
    }

    var ssCatalog = String(ss.catalog || '').trim().toLowerCase();
    var ssSourceId = ss.source_id == null ? '' : String(ss.source_id).trim().toLowerCase();
    var ssModel = String(ss.model || '').trim().toLowerCase();
    return ssCatalog === String(identity.catalog || '').trim().toLowerCase() && ssSourceId === String(identity.sourceId || '').trim().toLowerCase() && ssModel === String(identity.model || '').trim().toLowerCase();
  },
  sweObj2SkySource: function sweObj2SkySource(obj) {
    var names = obj.designations();
    var that = this;
    var exactSelection = this.exactSkySourceSelection;
    var currentSelection = vue_esm["a" /* default */].prototype.$stel && vue_esm["a" /* default */].prototype.$stel.core.selection;
    var isCurrentSelection = currentSelection === obj || currentSelection && obj && currentSelection.v === obj.v;

    if (exactSelection && isCurrentSelection) {
      exactSelection.culturalNames = obj.culturalDesignations();
      return Promise.resolve(exactSelection);
    }

    var buildLocalSkySource = function buildLocalSkySource(fallbackName) {
      var ss = that.localSkySourceFromSweObj(obj, fallbackName || names[0]);

      if (!ss) {
        return undefined;
      }

      if (!ss.model_data) {
        ss.model_data = {};
      }

      for (var i in ss.names) {
        if (ss.names[i].startsWith('GAIA')) {
          ss.names[i] = ss.names[i].replace(/^GAIA /, 'Gaia DR2 ');
        }
      }

      ss.culturalNames = obj.culturalDesignations();
      return ss;
    };

    if (obj.__orasSkySourceData && obj.__orasSkySourceData.catalog && obj.__orasSkySourceData.source_id && obj.__orasSkySourceData.model) {
      return Promise.resolve(buildLocalSkySource(obj.__orasSkySourceData.match || obj.__orasSkySourceData.display_name || names[0]));
    }

    if (!names || !names.length) {
      throw new Error("Can't find object without names");
    } // Several artifical satellites share the same common name, so we use
    // the unambiguous NORAD number instead


    for (var j in names) {
      if (names[j].startsWith('NORAD ')) {
        var tmpName = names[0];
        names[0] = names[j];
        names[j] = tmpName;
      }
    }

    var printErr = function printErr(n) {
      console.log("Couldn't find ORAS skysource data for name: " + n);
      return buildLocalSkySource(n);
    };

    return that.lookupSkySourceByName(names[0]).then(function (res) {
      return res;
    }, function () {
      if (names.length === 1) return printErr(names);
      return that.lookupSkySourceByName(names[1]).then(function (res) {
        return res;
      }, function () {
        if (names.length === 2) return printErr(names);
        return that.lookupSkySourceByName(names[2]).then(function (res) {
          return res;
        }, function () {
          return printErr(names[2]);
        });
      });
    }).then(function (res) {
      res.culturalNames = obj.culturalDesignations();
      return res;
    });
  },
  setSweObjAsSelection: function setSweObjAsSelection(obj, exactSkySource) {
    var $stel = vue_esm["a" /* default */].prototype.$stel;
    this.exactSkySourceSelection = exactSkySource || undefined;
    $stel.core.selection = obj;
    $stel.pointAndLock(obj);
  },
  // Get data for a SkySource from wikipedia
  getSkySourceSummaryFromWikipedia: function getSkySourceSummaryFromWikipedia(ss) {
    var aliases = [];

    for (var i in ss.names || []) {
      aliases.push(String(ss.names[i]).trim());
    }

    if (ss.display_name) aliases.push(String(ss.display_name).trim());
    if (ss.source_id) aliases.push('Gaia DR2 ' + String(ss.source_id).trim());
    if (!aliases.length) return Promise.reject(new Error('No aliases available for local summary lookup'));
    var url = ORAS_OBJECT_MEDIA_ROOT + '/summaries/index.json';
    return fetch(url).then(function (res) {
      if (!res.ok) throw new Error('No local summary for selection');
      return res.json();
    }).then(function (index) {
      var keyMap = index && index.alias_to_file ? index.alias_to_file : {};

      for (var _i3 = 0, _aliases = aliases; _i3 < _aliases.length; _i3++) {
        var alias = _aliases[_i3];
        var normalized = alias.toLowerCase();

        if (keyMap[normalized]) {
          return fetch(ORAS_OBJECT_MEDIA_ROOT + '/summaries/' + keyMap[normalized]).then(function (r) {
            if (!r.ok) throw new Error('Failed to read local summary file');
            return r.json();
          });
        }
      }

      throw new Error('No local summary for selection');
    });
  },
  getGeolocation: function getGeolocation() {
    console.log('Getting geolocalization');

    if (!navigator.geolocation) {
      return Promise.reject(new Error('Cannot detect position'));
    }

    return new Promise(function (resolve, reject) {
      navigator.geolocation.getCurrentPosition(function (position) {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      }, function () {
        reject(new Error('Cannot detect position'));
      }, {
        enableHighAccuracy: true
      });
    });
  },
  delay: function delay(t, v) {
    return new Promise(function (resolve) {
      setTimeout(resolve.bind(null, v), t);
    });
  },
  geoCodePosition: function geoCodePosition(pos, ctx) {
    console.log('Geocoding position... ');
    var ll = ctx.$t('Lat {0}° Lon {1}°', [pos.lat.toFixed(3), pos.lng.toFixed(3)]);
    var loc = {
      short_name: pos.accuracy > 500 ? ctx.$t('Near {0}', [ll]) : ll,
      country: 'Unknown',
      lng: pos.lng,
      lat: pos.lat,
      alt: pos.alt ? pos.alt : 0,
      accuracy: pos.accuracy,
      street_address: ''
    };
    return Promise.resolve(loc);
  },
  getDistanceFromLatLonInM: function getDistanceFromLatLonInM(lat1, lon1, lat2, lon2) {
    var deg2rad = function deg2rad(deg) {
      return deg * (Math.PI / 180);
    };

    var R = 6371000; // Radius of the earth in m

    var dLat = deg2rad(lat2 - lat1);
    var dLon = deg2rad(lon2 - lon1);
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in m

    return d;
  },
  // Look for the next time starting from now on when the night Sky is visible
  // i.e. when sun is more than 10 degree below horizon.
  // If no such time was found (e.g. in a northern country in summer),
  // we default to current time.
  getTimeAfterSunset: function getTimeAfterSunset(stel) {
    var sun = stel.getObj('NAME Sun');
    var obs = stel.observer.clone();
    var utc = Math.floor(obs.utc * 24 * 60 / 5) / (24 * 60 / 5);
    var i;

    for (i = 0; i < 24 * 60 / 5 + 1; i++) {
      obs.utc = utc + 1.0 / (24 * 60) * (i * 5);
      var sunRadec = sun.getInfo('RADEC', obs);
      var azalt = stel.convertFrame(obs, 'ICRF', 'OBSERVED', sunRadec);
      var alt = stel.anpm(stel.c2s(azalt)[1]);

      if (alt < -13 * Math.PI / 180) {
        break;
      }
    }

    if (i === 0 || i === 24 * 60 / 5 + 1) {
      return stel.observer.utc;
    }

    return obs.utc;
  },
  // Get the list of circumpolar stars in a given magnitude range
  //
  // Arguments:
  //   obs      - An observer.
  //   maxMag   - The maximum magnitude above which objects are discarded.
  //   filter   - a function called for each object returning false if the
  //              object must be filtered out.
  //
  // Return:
  //   An array SweObject. It is the responsibility of the caller to properly
  //   destroy all the objects of the list when they are not needed, by calling
  //   obj.destroy() on each of them.
  //
  // Example code:
  //   // Return all cicumpolar stars between mag -2 and 4
  //   let res = swh.getCircumpolarStars(this.$stel.observer, -2, 4)
  //   // Do something with the stars
  //   console.log(res.length)
  //   // Destroy the objects (don't forget this line!)
  //   res.map(e => e.destroy())
  getCircumpolarStars: function getCircumpolarStars(obs, minMag, maxMag) {
    var $stel = vue_esm["a" /* default */].prototype.$stel;

    var filter = function filter(obj) {
      if (obj.getInfo('vmag', obs) <= minMag) {
        return false;
      }

      var posJNOW = $stel.convertFrame(obs, 'ICRF', 'JNOW', obj.getInfo('radec'));
      var radecJNOW = $stel.c2s(posJNOW);
      var decJNOW = $stel.anpm(radecJNOW[1]);

      if (obs.latitude >= 0) {
        return decJNOW >= Math.PI / 2 - obs.latitude;
      } else {
        return decJNOW <= -Math.PI / 2 + obs.latitude;
      }
    };

    return $stel.core.stars.listObjs(obs, maxMag, filter);
  },
  circumpolarMask: undefined,
  showCircumpolarMask: function showCircumpolarMask(obs, show) {
    if (show === undefined) {
      show = true;
    }

    var layer = vue_esm["a" /* default */].prototype.$skyHintsLayer;
    var $stel = vue_esm["a" /* default */].prototype.$stel;

    if (this.circumpolarMask) {
      layer.remove(this.circumpolarMask);
      this.circumpolarMask = undefined;
    }

    if (show) {
      var diam = 2.0 * Math.PI - Math.abs(obs.latitude) * 2;
      var shapeParams = {
        pos: [0, 0, obs.latitude > 0 ? -1 : 1, 0],
        frame: $stel.FRAME_JNOW,
        size: [diam, diam],
        color: [0.1, 0.1, 0.1, 0.8],
        border_color: [0.1, 0.1, 0.6, 1]
      };
      this.circumpolarMask = layer.add('circle', shapeParams);
    }
  }
};
/* harmony default export */ var sw_helpers = (swh);
// EXTERNAL MODULE: ./node_modules/v-click-outside/dist/v-click-outside.umd.js
var v_click_outside_umd = __webpack_require__("c28b");
var v_click_outside_umd_default = /*#__PURE__*/__webpack_require__.n(v_click_outside_umd);

// CONCATENATED MODULE: ./node_modules/cache-loader/dist/cjs.js??ref--13-0!./node_modules/thread-loader/dist/cjs.js!./node_modules/babel-loader/lib!./node_modules/cache-loader/dist/cjs.js??ref--1-0!./node_modules/vue-loader/lib??vue-loader-options!./src/components/skysource-search.vue?vue&type=script&lang=js&



//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//



/* harmony default export */ var skysource_searchvue_type_script_lang_js_ = ({
  data: function data() {
    return {
      autoCompleteChoices: [],
      searchText: '',
      lastQuery: undefined
    };
  },
  props: ['value', 'floatingList'],
  watch: {
    searchText: function searchText() {
      if (this.searchText === '') {
        this.autoCompleteChoices = [];
        this.lastQuery = undefined;
        return;
      }

      this.refresh();
    }
  },
  computed: {
    listStyle: function listStyle() {
      return this.floatingList ? 'position: absolute; z-index: 1000; margin-top: 8px' : '';
    },
    showList: function showList() {
      return this.searchText.trim() !== '';
    }
  },
  methods: {
    sourceClicked: function sourceClicked(val) {
      this.$emit('input', val);
      this.resetSearch();
    },
    resetSearch: function resetSearch() {
      this.searchText = '';
    },
    refresh: lodash_default.a.debounce(function () {
      var that = this;
      var rawQuery = that.searchText.trim();

      if (!rawQuery) {
        that.autoCompleteChoices = [];
        that.lastQuery = undefined;
        return;
      }

      if (this.lastQuery === rawQuery) {
        return;
      }

      this.lastQuery = rawQuery;
      sw_helpers.querySkySources(rawQuery, 10).then(function (results) {
        if (rawQuery !== that.lastQuery) {
          console.log('Cancelled query: ' + rawQuery);
          return;
        }

        that.autoCompleteChoices = results;
      }, function (err) {
        console.log(err);
      });
    }, 200),
    nameForSkySource: function nameForSkySource(s) {
      var cn = sw_helpers.cleanupOneSkySourceName(s.match);
      var n = sw_helpers.nameForSkySource(s);

      if (cn === n) {
        return n;
      } else {
        return cn + ' (' + n + ')';
      }
    },
    typeToName: function typeToName(t) {
      return sw_helpers.nameForSkySourceType(t);
    },
    subtitleForSkySource: function subtitleForSkySource(s) {
      if (s && s.status === 'not_indexed') {
        return 'Not indexed in local ORAS catalog yet';
      }

      return this.typeToName(s.types[0]);
    },
    iconForSkySource: function iconForSkySource(s) {
      return sw_helpers.iconForSkySource(s);
    }
  },
  mounted: function mounted() {
    var that = this;

    var onClick = function onClick(e) {
      if (that.searchText !== '') {
        that.searchText = '';
      }
    };

    var guiParent = document.querySelector('stel') || document.body;
    guiParent.addEventListener('click', onClick, false);
    this.guiParent = guiParent;
    this.guiParentClickHandler = onClick;
  },
  beforeDestroy: function beforeDestroy() {
    if (this.guiParent && this.guiParentClickHandler) {
      this.guiParent.removeEventListener('click', this.guiParentClickHandler, false);
    }

    this.guiParent = undefined;
    this.guiParentClickHandler = undefined;
  },
  directives: {
    clickOutside: v_click_outside_umd_default.a.directive
  }
});
// CONCATENATED MODULE: ./src/components/skysource-search.vue?vue&type=script&lang=js&
 /* harmony default export */ var components_skysource_searchvue_type_script_lang_js_ = (skysource_searchvue_type_script_lang_js_); 
// EXTERNAL MODULE: ./node_modules/vue-loader/lib/runtime/componentNormalizer.js
var componentNormalizer = __webpack_require__("2877");

// EXTERNAL MODULE: ./node_modules/vuetify-loader/lib/runtime/installComponents.js
var installComponents = __webpack_require__("6544");
var installComponents_default = /*#__PURE__*/__webpack_require__.n(installComponents);

// EXTERNAL MODULE: ./node_modules/vuetify/lib/components/VChip/VChip.js
var VChip = __webpack_require__("cc20");

// EXTERNAL MODULE: ./node_modules/vuetify/lib/components/VList/VList.js
var VList = __webpack_require__("8860");

// EXTERNAL MODULE: ./node_modules/vuetify/lib/components/VList/VListItem.js
var VListItem = __webpack_require__("da13");

// EXTERNAL MODULE: ./node_modules/vuetify/lib/components/VList/VListItemAction.js
var VListItemAction = __webpack_require__("1800");

// EXTERNAL MODULE: ./node_modules/vuetify/lib/components/VList/index.js + 6 modules
var components_VList = __webpack_require__("5d23");

// EXTERNAL MODULE: ./node_modules/vuetify/lib/components/VTextField/VTextField.js + 3 modules
var VTextField = __webpack_require__("8654");

// EXTERNAL MODULE: ./node_modules/vuetify-loader/lib/runtime/installDirectives.js
var installDirectives = __webpack_require__("269a");
var installDirectives_default = /*#__PURE__*/__webpack_require__.n(installDirectives);

// EXTERNAL MODULE: ./node_modules/vuetify/lib/directives/click-outside/index.js
var click_outside = __webpack_require__("a293");

// CONCATENATED MODULE: ./src/components/skysource-search.vue





/* normalize component */

var component = Object(componentNormalizer["a" /* default */])(
  components_skysource_searchvue_type_script_lang_js_,
  skysource_searchvue_type_template_id_829e5c8c_render,
  skysource_searchvue_type_template_id_829e5c8c_staticRenderFns,
  false,
  null,
  null,
  null
  
)

/* harmony default export */ var skysource_search = (component.exports);

/* vuetify-loader */









installComponents_default()(component, {VChip: VChip["a" /* default */],VList: VList["a" /* default */],VListItem: VListItem["a" /* default */],VListItemAction: VListItemAction["a" /* default */],VListItemContent: components_VList["a" /* VListItemContent */],VListItemSubtitle: components_VList["b" /* VListItemSubtitle */],VListItemTitle: components_VList["c" /* VListItemTitle */],VTextField: VTextField["a" /* default */]})


/* vuetify-loader */


installDirectives_default()(component, {ClickOutside: click_outside["a" /* default */]})

// CONCATENATED MODULE: ./node_modules/cache-loader/dist/cjs.js??ref--13-0!./node_modules/thread-loader/dist/cjs.js!./node_modules/babel-loader/lib!./node_modules/cache-loader/dist/cjs.js??ref--1-0!./node_modules/vue-loader/lib??vue-loader-options!./src/components/target-search.vue?vue&type=script&lang=js&
//
//
//
//
//
//
//
//
//
//
//
//
//
//


/* harmony default export */ var target_searchvue_type_script_lang_js_ = ({
  data: function data() {
    return {
      obsSkySource: undefined
    };
  },
  watch: {
    obsSkySource: function obsSkySource(ss) {
      if (!ss) {
        return;
      }

      var obj = sw_helpers.skySource2SweObj(ss);

      if (!obj) {
        obj = this.$stel.createObj(ss.model, ss);

        if (obj) {
          this.$selectionLayer.add(obj);
        }
      }

      if (!obj) {
        var label = Array.isArray(ss.names) && ss.names.length ? ss.names[0] : ss.display_name || String(ss.source_id || 'unknown');
        console.warn("Can't find object in SWE: " + label);
        return;
      }

      obj.__orasSkySourceData = ss;
      sw_helpers.setSweObjAsSelection(obj, ss);
    }
  },
  components: {
    SkysourceSearch: skysource_search
  }
});
// CONCATENATED MODULE: ./src/components/target-search.vue?vue&type=script&lang=js&
 /* harmony default export */ var components_target_searchvue_type_script_lang_js_ = (target_searchvue_type_script_lang_js_); 
// EXTERNAL MODULE: ./src/components/target-search.vue?vue&type=style&index=0&lang=css&
var target_searchvue_type_style_index_0_lang_css_ = __webpack_require__("4654");

// CONCATENATED MODULE: ./src/components/target-search.vue






/* normalize component */

var target_search_component = Object(componentNormalizer["a" /* default */])(
  components_target_searchvue_type_script_lang_js_,
  target_searchvue_type_template_id_5d761524_render,
  target_searchvue_type_template_id_5d761524_staticRenderFns,
  false,
  null,
  null,
  null
  
)

/* harmony default export */ var target_search = (target_search_component.exports);
// CONCATENATED MODULE: ./node_modules/cache-loader/dist/cjs.js??ref--13-0!./node_modules/thread-loader/dist/cjs.js!./node_modules/babel-loader/lib!./node_modules/cache-loader/dist/cjs.js??ref--1-0!./node_modules/vue-loader/lib??vue-loader-options!./src/components/toolbar.vue?vue&type=script&lang=js&
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//

/* harmony default export */ var toolbarvue_type_script_lang_js_ = ({
  data: function data() {
    return {};
  },
  computed: {
    fov: function fov() {
      if (!this.$store.state.stel) return '-';
      var fov = this.$store.state.stel.fov * 180 / Math.PI;
      return fov.toPrecision(3) + '°';
    }
  },
  methods: {
    toggleNavigationDrawer: function toggleNavigationDrawer() {
      this.$store.commit('toggleBool', 'showNavigationDrawer');
    }
  },
  components: {
    TargetSearch: target_search
  }
});
// CONCATENATED MODULE: ./src/components/toolbar.vue?vue&type=script&lang=js&
 /* harmony default export */ var components_toolbarvue_type_script_lang_js_ = (toolbarvue_type_script_lang_js_); 
// EXTERNAL MODULE: ./src/components/toolbar.vue?vue&type=style&index=0&lang=css&
var toolbarvue_type_style_index_0_lang_css_ = __webpack_require__("3658");

// EXTERNAL MODULE: ./node_modules/vuetify/lib/components/VAppBar/VAppBarNavIcon.js
var VAppBarNavIcon = __webpack_require__("5bc1");

// EXTERNAL MODULE: ./node_modules/vuetify/lib/components/VBtn/VBtn.js
var VBtn = __webpack_require__("8336");

// EXTERNAL MODULE: ./node_modules/vuetify/lib/components/VIcon/VIcon.js
var VIcon = __webpack_require__("132d");

// EXTERNAL MODULE: ./node_modules/vuetify/lib/components/VGrid/VSpacer.js
var VSpacer = __webpack_require__("2fa4");

// EXTERNAL MODULE: ./node_modules/vuetify/lib/components/VToolbar/VToolbar.js
var VToolbar = __webpack_require__("71d9");

// CONCATENATED MODULE: ./src/components/toolbar.vue






/* normalize component */

var toolbar_component = Object(componentNormalizer["a" /* default */])(
  components_toolbarvue_type_script_lang_js_,
  toolbarvue_type_template_id_6acce61a_render,
  toolbarvue_type_template_id_6acce61a_staticRenderFns,
  false,
  null,
  null,
  null
  
)

/* harmony default export */ var toolbar = (toolbar_component.exports);

/* vuetify-loader */






installComponents_default()(toolbar_component, {VAppBarNavIcon: VAppBarNavIcon["a" /* default */],VBtn: VBtn["a" /* default */],VIcon: VIcon["a" /* default */],VSpacer: VSpacer["a" /* default */],VToolbar: VToolbar["a" /* default */]})

// CONCATENATED MODULE: ./node_modules/cache-loader/dist/cjs.js?{"cacheDirectory":"node_modules/.cache/vue-loader","cacheIdentifier":"dec867b4-vue-loader-template"}!./node_modules/vue-loader/lib/loaders/templateLoader.js??vue-loader-options!./node_modules/cache-loader/dist/cjs.js??ref--1-0!./node_modules/vue-loader/lib??vue-loader-options!./src/components/bottom-bar.vue?vue&type=template&id=0430beac&
var bottom_barvue_type_template_id_0430beac_render = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{staticStyle:{"position":"absolute","display":"flex","align-items":"flex-end"}},[(_vm.$store.state.showLocationButton)?_c('div',{staticClass:"tbtcontainer",staticStyle:{"max-width":"300px","display":"flex","align-items":"flex-end"}},[_c('v-btn',{staticClass:"tmenubt",attrs:{"color":"secondary"},nativeOn:{"click":function($event){$event.stopPropagation();return _vm.locationClicked()}}},[_c('v-icon',{staticClass:"hidden-sm-and-up"},[_vm._v("mdi-map-marker")]),_c('span',{staticClass:"hidden-xs-only"},[_vm._v(_vm._s(_vm.$store.state.currentLocation.short_name))])],1)],1):_vm._e(),_c('v-spacer'),(_vm.$store.state.showConstellationsLinesButton !== false)?_c('bottom-button',{attrs:{"label":_vm.$t('Constellations'),"img":__webpack_require__("d8fb"),"img_alt":"Constellations Button","toggled":_vm.$store.state.stel.constellations.lines_visible},on:{"clicked":function (b) { _vm.$stel.core.constellations.lines_visible = b; _vm.$stel.core.constellations.labels_visible = b }}}):_vm._e(),(_vm.$store.state.showConstellationsArtButton !== false)?_c('bottom-button',{attrs:{"label":_vm.$t('Constellations Art'),"img":__webpack_require__("00b8"),"img_alt":"Constellations Art Button","toggled":_vm.$store.state.stel.constellations.images_visible},on:{"clicked":function (b) { _vm.$stel.core.constellations.images_visible = b }}}):_vm._e(),(_vm.$store.state.showAtmosphereButton !== false)?_c('bottom-button',{attrs:{"label":_vm.$t('Atmosphere'),"img":__webpack_require__("49e1"),"img_alt":"Atmosphere Button","toggled":_vm.$store.state.stel.atmosphere.visible},on:{"clicked":function (b) { _vm.$stel.core.atmosphere.visible = b }}}):_vm._e(),(_vm.$store.state.showLandscapeButton !== false)?_c('bottom-button',{attrs:{"label":_vm.$t('Landscape'),"img":__webpack_require__("dbeb"),"img_alt":"Landscape Button","toggled":_vm.$store.state.stel.landscapes.visible},on:{"clicked":function (b) { _vm.$stel.core.landscapes.visible = b }}}):_vm._e(),(_vm.$store.state.showAzimuthalGridButton !== false)?_c('bottom-button',{attrs:{"label":_vm.$t('Azimuthal Grid'),"img":__webpack_require__("aca8"),"img_alt":"Azimuthal Button","toggled":_vm.$store.state.stel.lines.azimuthal.visible},on:{"clicked":function (b) { _vm.$stel.core.lines.azimuthal.visible = b }}}):_vm._e(),(_vm.$store.state.showEquatorialGridButton !== false)?_c('bottom-button',{attrs:{"label":_vm.$t('Equatorial Grid'),"img":__webpack_require__("1541"),"img_alt":"Equatorial Grid Button","toggled":_vm.$store.state.stel.lines.equatorial_jnow.visible},on:{"clicked":function (b) { _vm.$stel.core.lines.equatorial_jnow.visible = b }}}):_vm._e(),(_vm.$store.state.showEquatorialJ2000GridButton !== false)?_c('bottom-button',{attrs:{"label":_vm.$t('Equatorial J2000 Grid'),"img":__webpack_require__("1541"),"img_alt":"Equatorial J2000 Grid Button","toggled":_vm.$store.state.stel.lines.equatorial.visible},on:{"clicked":function (b) { _vm.$stel.core.lines.equatorial.visible = b }}}):_vm._e(),_c('bottom-button',{staticClass:"mr-auto",attrs:{"label":_vm.$t('Deep Sky Objects'),"img":__webpack_require__("5ae2"),"img_alt":"Deep Sky Objects Button","toggled":_vm.$store.state.stel.dsos.visible},on:{"clicked":function (b) { _vm.$stel.core.dsos.visible = b }}}),(_vm.$store.state.showNightmodeButton !== false)?_c('bottom-button',{staticClass:"mr-auto",attrs:{"label":_vm.$t('Night Mode'),"img":__webpack_require__("13ba"),"img_alt":"Night Mode Button","toggled":_vm.$store.state.nightmode},on:{"clicked":function (b) { _vm.setNightMode(b) }}}):_vm._e(),_c('bottom-button',{staticClass:"mr-auto hidden-xs-only",attrs:{"label":_vm.$t('Fullscreen'),"img":_vm.fullscreenBtnImage,"img_alt":"Fullscreen Button","toggled":_vm.$store.state.fullscreen},on:{"clicked":function (b) { _vm.setFullscreen(b) }}}),_c('v-spacer'),(_vm.$store.state.showTimeButtons)?_c('v-menu',{attrs:{"close-on-content-click":false,"transition":"v-slide-y-transition","offset-y":"","top":"","left":""},scopedSlots:_vm._u([{key:"activator",fn:function(ref){
var on = ref.on;
return [_c('v-btn',_vm._g({staticClass:"tmenubt",attrs:{"large":"","color":"secondary"}},on),[_c('v-icon',{staticClass:"hidden-sm-and-up"},[_vm._v("mdi-clock-outline")]),_c('span',{staticClass:"hidden-xs-only"},[_c('div',{staticClass:"text-subtitle-2"},[_vm._v(_vm._s(_vm.time))]),_c('div',{staticClass:"text-caption"},[_vm._v(_vm._s(_vm.date))])])],1)]}}],null,false,4035027993)},[_c('date-time-picker',{attrs:{"location":_vm.$store.state.currentLocation},model:{value:(_vm.pickerDate),callback:function ($$v) {_vm.pickerDate=$$v},expression:"pickerDate"}})],1):_vm._e()],1)}
var bottom_barvue_type_template_id_0430beac_staticRenderFns = []


// CONCATENATED MODULE: ./src/components/bottom-bar.vue?vue&type=template&id=0430beac&

// CONCATENATED MODULE: ./node_modules/cache-loader/dist/cjs.js?{"cacheDirectory":"node_modules/.cache/vue-loader","cacheIdentifier":"dec867b4-vue-loader-template"}!./node_modules/vue-loader/lib/loaders/templateLoader.js??vue-loader-options!./node_modules/cache-loader/dist/cjs.js??ref--1-0!./node_modules/vue-loader/lib??vue-loader-options!./src/components/bottom-button.vue?vue&type=template&id=54804bb2&
var bottom_buttonvue_type_template_id_54804bb2_render = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{staticClass:"bottom-button",class:{on: _vm.toggled}},[_c('a',{on:{"click":_vm.clicked}},[_c('img',{attrs:{"src":_vm.img,"alt":_vm.img_alt}})]),_c('div',{staticClass:"hint"},[_vm._v(_vm._s(_vm.label))])])}
var bottom_buttonvue_type_template_id_54804bb2_staticRenderFns = []


// CONCATENATED MODULE: ./src/components/bottom-button.vue?vue&type=template&id=54804bb2&

// CONCATENATED MODULE: ./node_modules/cache-loader/dist/cjs.js??ref--13-0!./node_modules/thread-loader/dist/cjs.js!./node_modules/babel-loader/lib!./node_modules/cache-loader/dist/cjs.js??ref--1-0!./node_modules/vue-loader/lib??vue-loader-options!./src/components/bottom-button.vue?vue&type=script&lang=js&
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
/* harmony default export */ var bottom_buttonvue_type_script_lang_js_ = ({
  name: 'bottom-button',
  props: ['label', 'img', 'toggled', 'img_alt'],
  methods: {
    clicked: function clicked() {
      var b = !this.toggled;
      this.$emit('clicked', b);
    }
  }
});
// CONCATENATED MODULE: ./src/components/bottom-button.vue?vue&type=script&lang=js&
 /* harmony default export */ var components_bottom_buttonvue_type_script_lang_js_ = (bottom_buttonvue_type_script_lang_js_); 
// EXTERNAL MODULE: ./src/components/bottom-button.vue?vue&type=style&index=0&lang=css&
var bottom_buttonvue_type_style_index_0_lang_css_ = __webpack_require__("2435");

// CONCATENATED MODULE: ./src/components/bottom-button.vue






/* normalize component */

var bottom_button_component = Object(componentNormalizer["a" /* default */])(
  components_bottom_buttonvue_type_script_lang_js_,
  bottom_buttonvue_type_template_id_54804bb2_render,
  bottom_buttonvue_type_template_id_54804bb2_staticRenderFns,
  false,
  null,
  null,
  null
  
)

/* harmony default export */ var bottom_button = (bottom_button_component.exports);
// CONCATENATED MODULE: ./node_modules/cache-loader/dist/cjs.js?{"cacheDirectory":"node_modules/.cache/vue-loader","cacheIdentifier":"dec867b4-vue-loader-template"}!./node_modules/vue-loader/lib/loaders/templateLoader.js??vue-loader-options!./node_modules/cache-loader/dist/cjs.js??ref--1-0!./node_modules/vue-loader/lib??vue-loader-options!./src/components/date-time-picker.vue?vue&type=template&id=003a55bb&
var date_time_pickervue_type_template_id_003a55bb_render = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('v-card',{attrs:{"width":"400"}},[_c('v-container',[_c('v-row',{staticClass:"ma-3",attrs:{"justify":"space-between","no-gutters":""}},[_c('div',[_c('v-btn',{staticClass:"up_down_bt",staticStyle:{"margin-left":"16px"},attrs:{"text":"","icon":""},on:{"mousedown":function($event){return _vm.incTime('years')},"touchstart":function($event){$event.preventDefault();return _vm.incTime('years')}}},[_c('v-icon',[_vm._v("mdi-menu-up")])],1),_c('v-btn',{staticClass:"up_down_bt",staticStyle:{"margin-left":"21px"},attrs:{"text":"","icon":""},on:{"mousedown":function($event){return _vm.incTime('months')},"touchstart":function($event){$event.preventDefault();return _vm.incTime('months')}}},[_c('v-icon',[_vm._v("mdi-menu-up")])],1),_c('v-btn',{staticClass:"up_down_bt",staticStyle:{"margin-left":"8px"},attrs:{"text":"","icon":""},on:{"mousedown":function($event){return _vm.incTime('days')},"touchstart":function($event){$event.preventDefault();return _vm.incTime('days')}}},[_c('v-icon',[_vm._v("mdi-menu-up")])],1),_c('h1',[_vm._v(_vm._s(_vm.date))]),_c('v-btn',{staticClass:"up_down_bt",staticStyle:{"margin-left":"16px"},attrs:{"text":"","icon":""},on:{"mousedown":function($event){return _vm.decTime('years')},"touchstart":function($event){$event.preventDefault();return _vm.decTime('years')}}},[_c('v-icon',[_vm._v("mdi-menu-down")])],1),_c('v-btn',{staticClass:"up_down_bt",staticStyle:{"margin-left":"21px"},attrs:{"text":"","icon":""},on:{"mousedown":function($event){return _vm.decTime('months')},"touchstart":function($event){$event.preventDefault();return _vm.decTime('months')}}},[_c('v-icon',[_vm._v("mdi-menu-down")])],1),_c('v-btn',{staticClass:"up_down_bt",staticStyle:{"margin-left":"8px"},attrs:{"text":"","icon":""},on:{"mousedown":function($event){return _vm.decTime('days')},"touchstart":function($event){$event.preventDefault();return _vm.decTime('days')}}},[_c('v-icon',[_vm._v("mdi-menu-down")])],1)],1),_c('div',[_c('div',[_c('v-tooltip',{attrs:{"top":""},scopedSlots:_vm._u([{key:"activator",fn:function(ref){
var on = ref.on;
return [_c('v-btn',_vm._g({staticStyle:{"margin-top":"5px"},attrs:{"text":"","icon":""},on:{"click":_vm.resetTime}},on),[_c('v-icon',[_vm._v("mdi-history")])],1)]}}])},[_c('span',[_vm._v(_vm._s(_vm.$t('Back to real time')))])])],1),_c('div',[_c('v-tooltip',{attrs:{"top":""},scopedSlots:_vm._u([{key:"activator",fn:function(ref){
var on = ref.on;
return [_c('v-btn',_vm._g({staticStyle:{"margin-top":"0px"},attrs:{"text":"","icon":""},on:{"click":_vm.togglePauseTime}},on),[_c('v-icon',[_vm._v(_vm._s(_vm.togglePauseTimeIcon))])],1)]}}])},[_c('span',[_vm._v(_vm._s(_vm.$t('Pause/unpause time')))])])],1)]),_c('div',[_c('v-btn',{staticClass:"up_down_bt",attrs:{"text":"","icon":""},on:{"mousedown":function($event){return _vm.incTime('hours')},"touchstart":function($event){$event.preventDefault();return _vm.incTime('hours')}}},[_c('v-icon',[_vm._v("mdi-menu-up")])],1),_c('v-btn',{staticClass:"up_down_bt ml-1",attrs:{"text":"","icon":""},on:{"mousedown":function($event){return _vm.incTime('minutes')},"touchstart":function($event){$event.preventDefault();return _vm.incTime('minutes')}}},[_c('v-icon',[_vm._v("mdi-menu-up")])],1),_c('v-btn',{staticClass:"up_down_bt ml-1",attrs:{"text":"","icon":""},on:{"mousedown":function($event){return _vm.incTime('seconds')},"touchstart":function($event){$event.preventDefault();return _vm.incTime('seconds')}}},[_c('v-icon',[_vm._v("mdi-menu-up")])],1),_c('h1',{staticClass:"ml-2"},[_vm._v(_vm._s(_vm.time))]),_c('v-btn',{staticClass:"up_down_bt",attrs:{"text":"","icon":""},on:{"mousedown":function($event){return _vm.decTime('hours')},"touchstart":function($event){$event.preventDefault();return _vm.decTime('hours')}}},[_c('v-icon',[_vm._v("mdi-menu-down")])],1),_c('v-btn',{staticClass:"up_down_bt ml-1",attrs:{"text":"","icon":""},on:{"mousedown":function($event){return _vm.decTime('minutes')},"touchstart":function($event){$event.preventDefault();return _vm.decTime('minutes')}}},[_c('v-icon',[_vm._v("mdi-menu-down")])],1),_c('v-btn',{staticClass:"up_down_bt ml-1",attrs:{"text":"","icon":""},on:{"mousedown":function($event){return _vm.decTime('seconds')},"touchstart":function($event){$event.preventDefault();return _vm.decTime('seconds')}}},[_c('v-icon',[_vm._v("mdi-menu-down")])],1)],1)])],1),_c('div',{staticStyle:{"padding":"20px"}},[_c('div',{staticStyle:{"position":"absolute"}},[_c('svg',{attrs:{"height":"30","width":"360"}},[_c('defs',[_c('linearGradient',{attrs:{"id":"grad1","x1":"0%","y1":"0%","x2":"100%","y2":"0%"}},_vm._l((_vm.stops),function(stop){return _c('stop',{key:stop.percent,style:(stop.style),attrs:{"offset":stop.percent}})}),1)],1),_c('rect',{attrs:{"width":"100%","height":"100%","fill":"url(#grad1)"}})])]),_c('v-slider',{staticStyle:{"padding":"0px","width":"360px"},attrs:{"min":"0","max":"1439","hint":_vm.sliderHint,"persistent-hint":""},model:{value:(_vm.timeMinute),callback:function ($$v) {_vm.timeMinute=$$v},expression:"timeMinute"}})],1)],1)}
var date_time_pickervue_type_template_id_003a55bb_staticRenderFns = []


// CONCATENATED MODULE: ./src/components/date-time-picker.vue?vue&type=template&id=003a55bb&

// EXTERNAL MODULE: ./node_modules/core-js/modules/es.math.log10.js
var es_math_log10 = __webpack_require__("6b93");

// CONCATENATED MODULE: ./node_modules/cache-loader/dist/cjs.js??ref--13-0!./node_modules/thread-loader/dist/cjs.js!./node_modules/babel-loader/lib!./node_modules/cache-loader/dist/cjs.js??ref--1-0!./node_modules/vue-loader/lib??vue-loader-options!./src/components/date-time-picker.vue?vue&type=script&lang=js&

//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//

var clickTimeout;
var nbClickRepeat = 0;
/* harmony default export */ var date_time_pickervue_type_script_lang_js_ = ({
  data: function data() {
    return {
      stops: [],
      stopCacheKey: {
        sliderStartTime: undefined,
        location: undefined
      }
    };
  },
  props: ['value', 'location'],
  computed: {
    // The MomentJS time in local time
    localTime: {
      get: function get() {
        var m = moment_default()(this.value);
        m.local();
        return m;
      },
      set: function set(newValue) {
        this.$emit('input', newValue.format());
      }
    },
    time: {
      get: function get() {
        return this.localTime.format('HH:mm:ss');
      }
    },
    date: {
      get: function get() {
        return this.localTime.format('YYYY-MM-DD');
      }
    },
    timeMinute: {
      get: function get() {
        // 0 means 12:00, 720 means midnight, 1440 (=24*60) means 12:00 the day after
        var t = this.localTime;
        return t.hours() < 12 ? (t.hours() + 12) * 60 + t.minutes() : (t.hours() - 12) * 60 + t.minutes();
      },
      set: function set(newValue) {
        var t = moment_default()(this.sliderStartTime);
        t.add(newValue, 'minutes');
        this.$emit('input', t.format());
      }
    },
    sliderStartTime: function sliderStartTime() {
      var t = this.localTime.clone();

      if (t.hours() < 12) {
        t.subtract(1, 'days');
      }

      t.hours(12);
      t.minutes(0);
      t.seconds(0);
      t.milliseconds(0);
      return t;
    },
    sliderHint: function sliderHint() {
      var tm = this.timeMinute;
      var stop = this.stops[Math.floor(tm * this.stops.length / 1440)];
      if (!stop) return '';

      if (stop.sunAlt > 0) {
        return this.$t('Daylight');
      }

      if (stop.sunAlt < -16) {
        return stop.moonAlt < 5 ? this.$t('Dark night') : this.$t('Moonlight');
      }

      return tm > 720 ? this.$t('Dawn') : this.$t('Twilight');
    },
    isTimePaused: function isTimePaused() {
      return this.$store.state.stel.time_speed === 0;
    },
    togglePauseTimeIcon: function togglePauseTimeIcon() {
      return this.isTimePaused ? 'mdi-play' : 'mdi-pause';
    }
  },
  methods: {
    resetTime: function resetTime() {
      var m = moment_default()();
      m.local();
      this.$emit('input', m.format());
    },
    togglePauseTime: function togglePauseTime() {
      this.$stel.core.time_speed = this.$stel.core.time_speed === 0 ? 1 : 0;
    },
    incTime: function incTime(unit) {
      this.startIncTime(1, unit);
    },
    decTime: function decTime(unit) {
      this.startIncTime(-1, unit);
    },
    startIncTime: function startIncTime(v, unit) {
      var _this = this;

      var that = this;
      clickTimeout = setTimeout(function (_) {
        var t = _this.localTime.clone();

        t.add(v, unit);

        _this.$emit('input', t.format());

        nbClickRepeat++;
        that.startIncTime(v, unit);
      }, nbClickRepeat === 0 ? 0 : nbClickRepeat === 1 ? 500 : nbClickRepeat < 10 ? 100 : nbClickRepeat < 100 ? 50 : 20);
    },
    stopIncTime: function stopIncTime() {
      if (clickTimeout) {
        clearTimeout(clickTimeout);
        clickTimeout = undefined;
        nbClickRepeat = 0;
      }
    },
    // 0 means 12:00, 720 means midnight, 1440 (=24*60) means 12:00 the day after
    timeMinuteRangeToUTC: function timeMinuteRangeToUTC(tm) {
      return this.sliderStartTime.toDate().getMJD() + tm * 1 / (24 * 60);
    },
    refreshStops: function refreshStops() {
      if (this.stopCacheKey.sliderStartTime === this.sliderStartTime.format() && this.stopCacheKey.location === JSON.stringify(this.location)) {
        return;
      }

      var res = [];
      var nbStop = 49;
      var obs = this.$stel.core.observer.clone();
      var sun = this.$stel.getObj('NAME Sun');
      var moon = this.$stel.getObj('NAME Moon');

      for (var i = 0; i <= nbStop; ++i) {
        obs.utc = this.timeMinuteRangeToUTC(1440 * i / nbStop);
        var sunAlt = this.$stel.anpm(this.$stel.c2s(this.$stel.convertFrame(obs, 'ICRF', 'OBSERVED', sun.getInfo('radec', obs)))[1]) * 180.0 / Math.PI;
        var moonAlt = this.$stel.anpm(this.$stel.c2s(this.$stel.convertFrame(obs, 'ICRF', 'OBSERVED', moon.getInfo('radec', obs)))[1]) * 180.0 / Math.PI;

        var brightnessForAltitude = function brightnessForAltitude(sunAlt, moonAlt) {
          var moonBrightness = moonAlt < 0 ? 0 : 2 / 35 * Math.min(20, moonAlt) / 20;
          if (sunAlt > 0) return Math.min(10, 1 + sunAlt) + moonBrightness;
          if (sunAlt < -16) return moonBrightness;
          if (sunAlt < -10) return 1 / 35 * (16 + sunAlt) / 6 + moonBrightness;
          return (1 - 1 / 35) * (10 + sunAlt) / 10 + 1 / 35 + moonBrightness;
        };

        var brightness = Math.log10(1 + brightnessForAltitude(sunAlt, moonAlt) * 10) / 2;
        res.push({
          percent: i / nbStop,
          style: 'stop-color:rgb(64,209,255);stop-opacity:' + brightness,
          sunAlt: sunAlt,
          moonAlt: moonAlt
        });
      }

      obs.destroy();
      this.stopCacheKey.sliderStartTime = this.sliderStartTime.format();
      this.stopCacheKey.location = JSON.stringify(this.location);
      this.stops = res;
    }
  },
  mounted: function mounted() {
    this.refreshStops();
    var that = this;
    window.addEventListener('mouseup', function (event) {
      that.stopIncTime();
    });
    window.addEventListener('touchend', function (event) {
      that.stopIncTime();
    });
  },
  watch: {
    sliderStartTime: function sliderStartTime() {
      this.refreshStops();
    },
    location: function location() {
      this.refreshStops();
    }
  }
});
// CONCATENATED MODULE: ./src/components/date-time-picker.vue?vue&type=script&lang=js&
 /* harmony default export */ var components_date_time_pickervue_type_script_lang_js_ = (date_time_pickervue_type_script_lang_js_); 
// EXTERNAL MODULE: ./src/components/date-time-picker.vue?vue&type=style&index=0&lang=css&
var date_time_pickervue_type_style_index_0_lang_css_ = __webpack_require__("3cdf");

// EXTERNAL MODULE: ./node_modules/vuetify/lib/components/VCard/VCard.js
var VCard = __webpack_require__("b0af");

// EXTERNAL MODULE: ./node_modules/vuetify/lib/components/VGrid/VContainer.js
var VContainer = __webpack_require__("a523");

// EXTERNAL MODULE: ./node_modules/vuetify/lib/components/VGrid/VRow.js
var VRow = __webpack_require__("0fd9");

// EXTERNAL MODULE: ./node_modules/vuetify/lib/components/VSlider/VSlider.js
var VSlider = __webpack_require__("ba0d");

// EXTERNAL MODULE: ./node_modules/vuetify/lib/components/VTooltip/VTooltip.js
var VTooltip = __webpack_require__("3a2f");

// CONCATENATED MODULE: ./src/components/date-time-picker.vue






/* normalize component */

var date_time_picker_component = Object(componentNormalizer["a" /* default */])(
  components_date_time_pickervue_type_script_lang_js_,
  date_time_pickervue_type_template_id_003a55bb_render,
  date_time_pickervue_type_template_id_003a55bb_staticRenderFns,
  false,
  null,
  null,
  null
  
)

/* harmony default export */ var date_time_picker = (date_time_picker_component.exports);

/* vuetify-loader */








installComponents_default()(date_time_picker_component, {VBtn: VBtn["a" /* default */],VCard: VCard["a" /* default */],VContainer: VContainer["a" /* default */],VIcon: VIcon["a" /* default */],VRow: VRow["a" /* default */],VSlider: VSlider["a" /* default */],VTooltip: VTooltip["a" /* default */]})

// CONCATENATED MODULE: ./node_modules/cache-loader/dist/cjs.js??ref--13-0!./node_modules/thread-loader/dist/cjs.js!./node_modules/babel-loader/lib!./node_modules/cache-loader/dist/cjs.js??ref--1-0!./node_modules/vue-loader/lib??vue-loader-options!./src/components/bottom-bar.vue?vue&type=script&lang=js&
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//



/* harmony default export */ var bottom_barvue_type_script_lang_js_ = ({
  components: {
    BottomButton: bottom_button,
    DateTimePicker: date_time_picker
  },
  data: function data() {
    return {};
  },
  computed: {
    time: {
      get: function get() {
        return this.getLocalTime().format('HH:mm:ss');
      }
    },
    date: {
      get: function get() {
        return this.getLocalTime().format('YYYY-MM-DD');
      }
    },
    fullscreenBtnImage: function fullscreenBtnImage() {
      return this.$store.state.fullscreen ? __webpack_require__("4d1c") : __webpack_require__("602b");
    },
    pickerDate: {
      get: function get() {
        var t = this.getLocalTime();
        t.milliseconds(0);
        return t.format();
      },
      set: function set(v) {
        var m = moment_default()(v);
        m.local();
        m.milliseconds(this.getLocalTime().milliseconds());
        this.$stel.core.observer.utc = m.toDate().getMJD();
      }
    }
  },
  methods: {
    // The MomentJS time in local time
    getLocalTime: function getLocalTime() {
      var d = new Date();
      d.setMJD(this.$store.state.stel.observer.utc);
      var m = moment_default()(d);
      m.local();
      return m;
    },
    locationClicked: function locationClicked() {
      this.$store.commit('toggleBool', 'showLocationDialog');
    },
    setFullscreen: function setFullscreen(b) {
      this.$fullscreen.toggle(document.body, {
        wrap: false,
        callback: this.onFullscreenChange
      });
    },
    setNightMode: function setNightMode(b) {
      this.$store.commit('toggleBool', 'nightmode');

      if (window.navigator.userAgent.indexOf('Edge') > -1) {
        document.getElementById('nightmode').style.opacity = b ? '0.5' : '0';
      }

      document.getElementById('nightmode').style.visibility = b ? 'visible' : 'hidden';
    },
    onFullscreenChange: function onFullscreenChange(b) {
      if (this.$store.state.fullscreen === b) return;
      this.$store.commit('toggleBool', 'fullscreen');
    }
  }
});
// CONCATENATED MODULE: ./src/components/bottom-bar.vue?vue&type=script&lang=js&
 /* harmony default export */ var components_bottom_barvue_type_script_lang_js_ = (bottom_barvue_type_script_lang_js_); 
// EXTERNAL MODULE: ./src/components/bottom-bar.vue?vue&type=style&index=0&lang=css&
var bottom_barvue_type_style_index_0_lang_css_ = __webpack_require__("85df");

// EXTERNAL MODULE: ./node_modules/vuetify/lib/components/VMenu/VMenu.js
var VMenu = __webpack_require__("e449");

// CONCATENATED MODULE: ./src/components/bottom-bar.vue






/* normalize component */

var bottom_bar_component = Object(componentNormalizer["a" /* default */])(
  components_bottom_barvue_type_script_lang_js_,
  bottom_barvue_type_template_id_0430beac_render,
  bottom_barvue_type_template_id_0430beac_staticRenderFns,
  false,
  null,
  null,
  null
  
)

/* harmony default export */ var bottom_bar = (bottom_bar_component.exports);

/* vuetify-loader */





installComponents_default()(bottom_bar_component, {VBtn: VBtn["a" /* default */],VIcon: VIcon["a" /* default */],VMenu: VMenu["a" /* default */],VSpacer: VSpacer["a" /* default */]})

// CONCATENATED MODULE: ./node_modules/cache-loader/dist/cjs.js?{"cacheDirectory":"node_modules/.cache/vue-loader","cacheIdentifier":"dec867b4-vue-loader-template"}!./node_modules/vue-loader/lib/loaders/templateLoader.js??vue-loader-options!./node_modules/cache-loader/dist/cjs.js??ref--1-0!./node_modules/vue-loader/lib??vue-loader-options!./src/components/selected-object-info.vue?vue&type=template&id=5611141b&
var selected_object_infovue_type_template_id_5611141b_render = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return (_vm.selectedObject)?_c('v-card',{staticStyle:{"background":"rgba(66, 66, 66, 0.3)"},attrs:{"transparent":""}},[_c('v-btn',{staticStyle:{"position":"absolute","right":"0"},attrs:{"icon":""},nativeOn:{"click":function($event){return _vm.unselect()}}},[_c('v-icon',[_vm._v("mdi-close")])],1),_c('v-card-title',{attrs:{"primary-title":""}},[_c('div',{staticStyle:{"width":"100%"}},[_c('img',{staticStyle:{"margin-top":"3px","margin-right":"10px"},attrs:{"src":_vm.icon,"height":"48","width":"48","align":"left"}}),_c('div',{staticStyle:{"overflow":"hidden","text-overflow":"ellipsis"}},[_c('div',{staticClass:"text-h5"},[_vm._v(_vm._s(_vm.title))]),_c('div',{staticClass:"grey--text text-body-2"},[_vm._v(_vm._s(_vm.type))])])])]),_c('v-card-text',{staticStyle:{"padding-bottom":"5px"}},[(_vm.otherNames.length > 1)?_c('v-row',{staticStyle:{"width":"100%"}},[_c('v-col',{attrs:{"cols":"12"}},[_c('span',{staticStyle:{"position":"absolute"}},[_vm._v(_vm._s(_vm.$t('Also known as')))]),_c('span',{staticStyle:{"padding-left":"33.3333%"}}),_vm._l((_vm.otherNames1to7),function(mname){return _c('span',{key:mname,staticClass:"text-caption white--text",staticStyle:{"margin-right":"15px","font-weight":"500"}},[_vm._v(_vm._s(mname))])}),(_vm.otherNames.length > 8)?_c('v-btn',{staticClass:"grey--text",staticStyle:{"margin-top":"-5px","margin-bottom":"-5px"},attrs:{"small":"","icon":""},nativeOn:{"click":function($event){_vm.showMinorNames = !_vm.showMinorNames}}},[_c('v-icon',[_vm._v("mdi-dots-horizontal")])],1):_vm._e(),_vm._l((_vm.otherNames8andMore),function(mname){return _c('span',{key:mname,staticClass:"text-caption white--text",staticStyle:{"margin-right":"15px","font-weight":"500"}},[_vm._v(_vm._s(mname))])})],2)],1):_vm._e()],1),(_vm.orasMetadata)?_c('v-card-text',{staticClass:"oras-enhanced-panel"},[_c('v-chip',{staticClass:"mb-2",attrs:{"x-small":"","color":"cyan darken-3","text-color":"white"}},[_vm._v("ORAS Enhanced")]),_c('v-row',{attrs:{"no-gutters":""}},[_c('v-col',{attrs:{"cols":"4"}},[_vm._v("Catalog IDs")]),_c('v-col',{staticClass:"white--text",attrs:{"cols":"8"}},[_vm._v(_vm._s(_vm.orasMetadata.catalogIds.join(', ')))])],1),_c('v-row',{attrs:{"no-gutters":""}},[_c('v-col',{attrs:{"cols":"4"}},[_vm._v("Source attribution")]),_c('v-col',{staticClass:"white--text",attrs:{"cols":"8"}},[_vm._v(_vm._s(_vm.orasMetadata.sources.join(', ')))])],1),(_vm.orasMetadata.pack)?_c('v-row',{attrs:{"no-gutters":""}},[_c('v-col',{attrs:{"cols":"4"}},[_vm._v("Catalog pack")]),_c('v-col',{staticClass:"white--text",attrs:{"cols":"8"}},[_vm._v(_vm._s(_vm.orasMetadata.pack))])],1):_vm._e(),_vm._l((_vm.orasProperties),function(property){return _c('v-row',{key:property.key,attrs:{"no-gutters":""}},[_c('v-col',{attrs:{"cols":"4"}},[_vm._v(_vm._s(property.key))]),_c('v-col',{staticClass:"white--text",attrs:{"cols":"8"}},[_vm._v(_vm._s(property.value))])],1)}),(_vm.orasProperties.length === 0)?_c('div',{staticClass:"grey--text text-caption mt-2"},[_vm._v(" Physical properties: Unavailable from mounted sources ")]):_vm._e()],2):_vm._e(),_c('v-card-text',[_vm._l((_vm.items),function(item){return [_c('v-row',{key:item.key,staticStyle:{"width":"100%"},attrs:{"no-gutters":""}},[_c('v-col',{staticStyle:{"color":"#dddddd"},attrs:{"cols":"4"}},[_vm._v(_vm._s(item.key))]),_c('v-col',{staticClass:"white--text",staticStyle:{"font-weight":"500"},attrs:{"cols":"8"}},[(item.html)?_c('span',{domProps:{"innerHTML":_vm._s(item.value)}}):_c('span',[_vm._v(_vm._s(item.value))])])],1)]}),_c('div',{staticClass:"white--text",staticStyle:{"margin-top":"15px"}},[_vm._v(_vm._s(_vm.wikipediaSummary))])],2),_c('v-card-actions',{staticStyle:{"margin-top":"-25px"}},[_c('v-spacer'),_vm._l((_vm.pluginsSelectedInfoExtraGuiComponents),function(item){return [_c(item,{key:item,tag:"component"})]})],2),_c('v-dialog',{attrs:{"width":"500px","absolute":""},model:{value:(_vm.showShareLinkDialog),callback:function ($$v) {_vm.showShareLinkDialog=$$v},expression:"showShareLinkDialog"}},[_c('v-card',{staticClass:"secondary white--text",staticStyle:{"height":"180px"}},[_c('v-card-title',{attrs:{"primary-title":""}},[_c('div',[_c('h3',{staticClass:"text-h5 mb-0"},[_vm._v("Share link")])])]),_c('v-card-text',{staticStyle:{"width":"100%"}},[_c('v-row',{staticStyle:{"width":"100%"}},[_c('v-text-field',{attrs:{"id":"link_inputid","label":"Link","solo":"","readonly":""},model:{value:(_vm.shareLink),callback:function ($$v) {_vm.shareLink=$$v},expression:"shareLink"}}),_c('v-btn',{nativeOn:{"click":function($event){$event.stopPropagation();return _vm.copyLink($event)}}},[_vm._v("Copy")])],1)],1)],1)],1),(_vm.$store.state.showSelectedInfoButtons)?_c('div',{staticStyle:{"position":"absolute","right":"0px","bottom":"-50px"}},[(!_vm.showPointToButton)?_c('v-btn',{attrs:{"fab":"","small":"","color":"transparent"},nativeOn:{"click":function($event){_vm.showShareLinkDialog = !_vm.showShareLinkDialog}}},[_c('v-icon',[_vm._v("mdi-link")])],1):_vm._e(),(_vm.showPointToButton)?_c('v-btn',{attrs:{"fab":"","small":"","color":"transparent"},nativeOn:{"click":function($event){return _vm.lockToSelection()}}},[_c('img',{staticStyle:{"min-height":"40px"},attrs:{"src":__webpack_require__("4f57"),"height":"40px"}})]):_vm._e(),(!_vm.showPointToButton)?_c('v-btn',{attrs:{"fab":"","small":"","color":"transparent"},on:{"mousedown":function($event){return _vm.zoomOutButtonClicked()}}},[_c('img',{class:{bt_disabled: !_vm.zoomOutButtonEnabled},staticStyle:{"min-height":"40px"},attrs:{"src":__webpack_require__("7aa7"),"height":"40px"}})]):_vm._e(),(!_vm.showPointToButton)?_c('v-btn',{attrs:{"fab":"","small":"","color":"transparent"},on:{"mousedown":function($event){return _vm.zoomInButtonClicked()}}},[_c('img',{class:{bt_disabled: !_vm.zoomInButtonEnabled},staticStyle:{"min-height":"40px"},attrs:{"src":__webpack_require__("f6ce"),"height":"40px"}})]):_vm._e()],1):_vm._e(),_c('v-snackbar',{attrs:{"bottom":"","left":"","timeout":2000,"color":"secondary"},model:{value:(_vm.copied),callback:function ($$v) {_vm.copied=$$v},expression:"copied"}},[_vm._v(" Link copied ")])],1):_vm._e()}
var selected_object_infovue_type_template_id_5611141b_staticRenderFns = []


// CONCATENATED MODULE: ./src/components/selected-object-info.vue?vue&type=template&id=5611141b&

// EXTERNAL MODULE: ./node_modules/core-js/modules/es.object.keys.js
var es_object_keys = __webpack_require__("b64b");

// CONCATENATED MODULE: ./node_modules/cache-loader/dist/cjs.js??ref--13-0!./node_modules/thread-loader/dist/cjs.js!./node_modules/babel-loader/lib!./node_modules/cache-loader/dist/cjs.js??ref--1-0!./node_modules/vue-loader/lib??vue-loader-options!./src/components/selected-object-info.vue?vue&type=script&lang=js&
















//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//


/* harmony default export */ var selected_object_infovue_type_script_lang_js_ = ({
  data: function data() {
    return {
      showMinorNames: false,
      wikipediaData: undefined,
      shareLink: undefined,
      showShareLinkDialog: false,
      copied: false,
      items: [],
      windowMouseupHandler: undefined,
      timer: undefined,
      zoomTimeout: undefined
    };
  },
  computed: {
    selectedObject: function selectedObject() {
      return this.$store.state.selectedObject;
    },
    stelSelectionId: function stelSelectionId() {
      return this.$store.state.stel && this.$store.state.stel.selection ? this.$store.state.stel.selection : undefined;
    },
    title: function title() {
      return this.selectedObject ? this.otherNames[0] : 'Selection';
    },
    otherNames: function otherNames() {
      return this.selectedObject ? sw_helpers.namesForSkySource(this.selectedObject, 26) : undefined;
    },
    otherNames1to7: function otherNames1to7() {
      return this.otherNames.slice(1, 8);
    },
    otherNames8andMore: function otherNames8andMore() {
      return this.showMinorNames ? this.otherNames.slice(8) : [];
    },
    orasMetadata: function orasMetadata() {
      var source = this.selectedObject;
      if (!source || !source.pack_id && !source.source_attribution) return undefined;
      var catalogIds = [source.catalog && source.source_id ? source.catalog + ' ' + source.source_id : undefined].concat(Object(toConsumableArray["a" /* default */])(source.catalog_ids || [])).filter(function (value, index, all) {
        return value && all.indexOf(value) === index;
      });
      var sources = (source.source_attribution || []).map(function (attribution) {
        return attribution.name;
      }).filter(function (value, index, all) {
        return value && all.indexOf(value) === index;
      });
      return {
        catalogIds: catalogIds,
        sources: sources.length ? sources : ['Unavailable'],
        pack: source.pack_id ? source.pack_id + ' ' + (source.pack_version || '') : undefined
      };
    },
    orasProperties: function orasProperties() {
      var _this = this;

      if (!this.selectedObject) return [];
      var fields = [['Spectral type', 'spectral_type'], ['Color index', 'color_index'], ['Parallax', 'parallax'], ['Distance', 'distance_pc'], ['Mass', 'mass_solar'], ['Radius', 'radius_solar'], ['Temperature', 'temperature_k'], ['Radial velocity', 'radial_velocity_km_s'], ['Variability', 'variability'], ['Period', 'period_seconds'], ['Redshift', 'redshift'], ['Flux', 'flux'], ['Candidate status', 'candidate_status']];
      var properties = fields.filter(function (_ref) {
        var _ref2 = Object(slicedToArray["a" /* default */])(_ref, 2),
            field = _ref2[1];

        return _this.selectedObject[field] != null;
      }).map(function (_ref3) {
        var _ref4 = Object(slicedToArray["a" /* default */])(_ref3, 2),
            key = _ref4[0],
            field = _ref4[1];

        return {
          key: key,
          value: String(_this.selectedObject[field])
        };
      });

      if (this.selectedObject.double_star) {
        var double = this.selectedObject.double_star;
        if (double.separation_arcsec != null) properties.push({
          key: 'Separation',
          value: double.separation_arcsec + ' arcsec'
        });
        if (double.position_angle_deg != null) properties.push({
          key: 'Position angle',
          value: double.position_angle_deg + ' deg'
        });
      }

      return properties;
    },
    wikipediaSummary: function wikipediaSummary() {
      if (!this.wikipediaData) return '';
      if (this.wikipediaData.summary) return this.stripHtml(this.wikipediaData.summary);
      var query = this.wikipediaData.query;
      if (!query || !query.pages) return '';
      var page = query.pages[Object.keys(query.pages)[0]];
      if (!page || !page.extract) return '';
      return this.stripHtml(page.extract);
    },
    type: function type() {
      if (!this.selectedObject) return this.$t('Unknown');
      var morpho = '';

      if (this.selectedObject.model_data && this.selectedObject.model_data.morpho) {
        morpho = sw_helpers.nameForGalaxyMorpho(this.selectedObject.model_data.morpho);

        if (morpho) {
          morpho = morpho + ' ';
        }
      }

      return morpho + sw_helpers.nameForSkySourceType(this.selectedObject.types[0]);
    },
    icon: function icon() {
      return sw_helpers.iconForSkySource(this.selectedObject);
    },
    showPointToButton: function showPointToButton() {
      if (!this.$store.state.stel.lock) return true;
      if (this.$store.state.stel.lock !== this.$store.state.stel.selection) return true;
      return false;
    },
    zoomInButtonEnabled: function zoomInButtonEnabled() {
      if (!this.$store.state.stel.lock || !this.selectedObject) return false;
      return true;
    },
    zoomOutButtonEnabled: function zoomOutButtonEnabled() {
      if (!this.$store.state.stel.lock || !this.selectedObject) return false;
      return true;
    },
    extraButtons: function extraButtons() {
      return sw_helpers.selectedObjectExtraButtons;
    },
    pluginsSelectedInfoExtraGuiComponents: function pluginsSelectedInfoExtraGuiComponents() {
      var res = [];

      for (var i in this.$stellariumWebPlugins()) {
        var plugin = this.$stellariumWebPlugins()[i];

        if (plugin.selectedInfoExtraGuiComponents) {
          res = res.concat(plugin.selectedInfoExtraGuiComponents);
        }
      }

      return res;
    }
  },
  watch: {
    selectedObject: function selectedObject(s) {
      this.showMinorNames = false;
      this.wikipediaData = undefined;

      if (!s) {
        if (this.timer) clearInterval(this.timer);
        this.timer = undefined;
        return;
      }

      var that = this;
      that.items = that.computeItems();
      if (that.timer) clearInterval(that.timer);
      that.timer = setInterval(function () {
        that.items = that.computeItems();
      }, 1000);
      var requestedSelection = s;
      sw_helpers.getSkySourceSummaryFromWikipedia(requestedSelection).then(function (data) {
        if (that.selectedObject === requestedSelection) {
          that.wikipediaData = data;
        }
      }, function (reason) {});
    },
    stelSelectionId: function stelSelectionId(s) {
      var _this2 = this;

      if (!this.$stel.core.selection) {
        this.$store.commit('setSelectedObject', 0);
        return;
      }

      sw_helpers.sweObj2SkySource(this.$stel.core.selection).then(function (res) {
        _this2.$store.commit('setSelectedObject', res);
      }, function (err) {
        console.log("Couldn't find info for object " + s + ':' + err);

        _this2.$store.commit('setSelectedObject', 0);
      });
    },
    showShareLinkDialog: function showShareLinkDialog(b) {
      this.shareLink = sw_helpers.getShareLink(this);
    }
  },
  methods: {
    computeItems: function computeItems() {
      var obj = this.$stel.core.selection;
      if (!obj) return [];
      var that = this;
      var ret = [];

      var addAttr = function addAttr(key, attr, format) {
        var html = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
        var v = obj.getInfo(attr);
        var number = Number(v);

        if (v != null && !isNaN(number)) {
          ret.push({
            key: key,
            value: format ? format(number) : number.toString(),
            html: html
          });
        }
      };

      addAttr(that.$t('Magnitude'), 'vmag', this.formatMagnitude);
      addAttr(that.$t('Distance'), 'distance', this.formatDistance, true);

      if (this.selectedObject.model_data) {
        if (this.selectedObject.model_data.radius) {
          ret.push({
            key: that.$t('Radius'),
            value: this.selectedObject.model_data.radius.toString() + ' Km',
            html: false
          });
        }

        if (this.selectedObject.model_data.spect_t) {
          ret.push({
            key: that.$t('Spectral Type'),
            value: this.selectedObject.model_data.spect_t,
            html: false
          });
        }

        if (this.selectedObject.model_data.dimx) {
          var dimy = this.selectedObject.model_data.dimy ? this.selectedObject.model_data.dimy : this.selectedObject.model_data.dimx;
          ret.push({
            key: that.$t('Size'),
            value: this.selectedObject.model_data.dimx.toString() + "' x " + dimy.toString() + "'",
            html: false
          });
        }
      }

      var formatInt = function formatInt(num, padLen) {
        var pad = new Array(1 + padLen).join('0');
        return (pad + num).slice(-pad.length);
      };

      var formatRA = function formatRA(a) {
        var raf = that.$stel.a2tf(a, 1);
        return '<div class="radecVal">' + formatInt(raf.hours, 2) + '<span class="radecUnit">h</span>&nbsp;</div><div class="radecVal">' + formatInt(raf.minutes, 2) + '<span class="radecUnit">m</span></div><div class="radecVal">' + formatInt(raf.seconds, 2) + '.' + raf.fraction + '<span class="radecUnit">s</span></div>';
      };

      var formatAz = function formatAz(a) {
        var raf = that.$stel.a2af(a, 1);
        return '<div class="radecVal">' + formatInt(raf.degrees < 0 ? raf.degrees + 180 : raf.degrees, 3) + '<span class="radecUnit">°</span></div><div class="radecVal">' + formatInt(raf.arcminutes, 2) + '<span class="radecUnit">\'</span></div><div class="radecVal">' + formatInt(raf.arcseconds, 2) + '.' + raf.fraction + '<span class="radecUnit">"</span></div>';
      };

      var formatDec = function formatDec(a) {
        var raf = that.$stel.a2af(a, 1);
        return '<div class="radecVal">' + raf.sign + formatInt(raf.degrees, 2) + '<span class="radecUnit">°</span></div><div class="radecVal">' + formatInt(raf.arcminutes, 2) + '<span class="radecUnit">\'</span></div><div class="radecVal">' + formatInt(raf.arcseconds, 2) + '.' + raf.fraction + '<span class="radecUnit">"</span></div>';
      };

      var posCIRS = this.$stel.convertFrame(this.$stel.core.observer, 'ICRF', 'JNOW', obj.getInfo('radec'));
      var radecCIRS = this.$stel.c2s(posCIRS);
      var raCIRS = this.$stel.anp(radecCIRS[0]);
      var decCIRS = this.$stel.anpm(radecCIRS[1]);
      ret.push({
        key: that.$t('Ra/Dec'),
        value: formatRA(raCIRS) + '&nbsp;&nbsp;&nbsp;' + formatDec(decCIRS),
        html: true
      });
      var azalt = this.$stel.c2s(this.$stel.convertFrame(this.$stel.core.observer, 'ICRF', 'OBSERVED', obj.getInfo('radec')));
      var az = this.$stel.anp(azalt[0]);
      var alt = this.$stel.anpm(azalt[1]);
      ret.push({
        key: that.$t('Az/Alt'),
        value: formatAz(az) + '&nbsp;&nbsp;&nbsp;' + formatDec(alt),
        html: true
      });
      addAttr(that.$t('Phase'), 'phase', this.formatPhase);
      var vis = obj.computeVisibility();
      var str = '';

      if (vis.length === 0) {
        str = that.$t('Not visible tonight');
      } else if (vis[0].rise === null) {
        str = that.$t('Always visible tonight');
      } else {
        str = that.$t('Rise: {0}&nbsp;&nbsp;&nbsp; Set: {1}', [this.formatTime(vis[0].rise), this.formatTime(vis[0].set)]);
      }

      ret.push({
        key: that.$t('Visibility'),
        value: str,
        html: true
      });
      return ret;
    },
    formatPhase: function formatPhase(v) {
      return (v * 100).toFixed(0) + '%';
    },
    formatMagnitude: function formatMagnitude(v) {
      if (v == null || isNaN(v)) {
        return 'Unknown';
      }

      return v.toFixed(2);
    },
    formatDistance: function formatDistance(d) {
      // d is in AU
      if (!d) {
        return 'NAN';
      }

      var ly = d * sw_helpers.astroConstants.ERFA_AULT / sw_helpers.astroConstants.ERFA_DAYSEC / sw_helpers.astroConstants.ERFA_DJY;

      if (ly >= 0.1) {
        return ly.toFixed(2) + '<span class="radecUnit"> light years</span>';
      }

      if (d >= 0.1) {
        return d.toFixed(2) + '<span class="radecUnit"> AU</span>';
      }

      var meter = d * sw_helpers.astroConstants.ERFA_DAU;

      if (meter >= 1000) {
        return (meter / 1000).toFixed(2) + '<span class="radecUnit"> km</span>';
      }

      return meter.toFixed(2) + '<span class="radecUnit"> m</span>';
    },
    stripHtml: function stripHtml(value) {
      return String(value || '').replace(/[<>]/g, '').trim();
    },
    formatTime: function formatTime(jdm) {
      var d = new Date();
      d.setMJD(jdm);
      var utc = new moment_default.a(d);
      utc.utcOffset(this.$store.state.stel.utcoffset);
      return utc.format('HH:mm');
    },
    unselect: function unselect() {
      this.$stel.core.selection = 0;
    },
    lockToSelection: function lockToSelection() {
      if (this.$stel.core.selection) {
        this.$stel.pointAndLock(this.$stel.core.selection, 0.5);
      }
    },
    zoomInButtonClicked: function zoomInButtonClicked() {
      var currentFov = this.$store.state.stel.fov * 180 / Math.PI;
      this.$stel.zoomTo(currentFov * 0.3 * Math.PI / 180, 0.4);
      var that = this;
      this.zoomTimeout = setTimeout(function (_) {
        that.zoomInButtonClicked();
      }, 300);
    },
    zoomOutButtonClicked: function zoomOutButtonClicked() {
      var currentFov = this.$store.state.stel.fov * 180 / Math.PI;
      this.$stel.zoomTo(currentFov * 3 * Math.PI / 180, 0.6);
      var that = this;
      this.zoomTimeout = setTimeout(function (_) {
        that.zoomOutButtonClicked();
      }, 200);
    },
    stopZoom: function stopZoom() {
      if (this.zoomTimeout) {
        clearTimeout(this.zoomTimeout);
        this.zoomTimeout = undefined;
      }
    },
    extraButtonClicked: function extraButtonClicked(btn) {
      btn.callback();
    },
    copyLink: function copyLink() {
      var input = document.querySelector('#link_inputid');
      input.focus();
      input.select();
      this.copied = document.execCommand('copy');
      window.getSelection().removeAllRanges();
      this.showShareLinkDialog = false;
    }
  },
  mounted: function mounted() {
    var _this3 = this;

    this.windowMouseupHandler = function () {
      return _this3.stopZoom();
    };

    window.addEventListener('mouseup', this.windowMouseupHandler);
  },
  beforeDestroy: function beforeDestroy() {
    if (this.windowMouseupHandler) {
      window.removeEventListener('mouseup', this.windowMouseupHandler);
      this.windowMouseupHandler = undefined;
    }

    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }

    this.stopZoom();
  }
});
// CONCATENATED MODULE: ./src/components/selected-object-info.vue?vue&type=script&lang=js&
 /* harmony default export */ var components_selected_object_infovue_type_script_lang_js_ = (selected_object_infovue_type_script_lang_js_); 
// EXTERNAL MODULE: ./src/components/selected-object-info.vue?vue&type=style&index=0&lang=css&
var selected_object_infovue_type_style_index_0_lang_css_ = __webpack_require__("202c");

// EXTERNAL MODULE: ./node_modules/vuetify/lib/components/VCard/index.js
var components_VCard = __webpack_require__("99d9");

// EXTERNAL MODULE: ./node_modules/vuetify/lib/components/VGrid/VCol.js
var VCol = __webpack_require__("62ad");

// EXTERNAL MODULE: ./node_modules/vuetify/lib/components/VDialog/VDialog.js
var VDialog = __webpack_require__("169a");

// EXTERNAL MODULE: ./node_modules/vuetify/lib/components/VSnackbar/VSnackbar.js
var VSnackbar = __webpack_require__("2db4");

// CONCATENATED MODULE: ./src/components/selected-object-info.vue






/* normalize component */

var selected_object_info_component = Object(componentNormalizer["a" /* default */])(
  components_selected_object_infovue_type_script_lang_js_,
  selected_object_infovue_type_template_id_5611141b_render,
  selected_object_infovue_type_template_id_5611141b_staticRenderFns,
  false,
  null,
  null,
  null
  
)

/* harmony default export */ var selected_object_info = (selected_object_info_component.exports);

/* vuetify-loader */














installComponents_default()(selected_object_info_component, {VBtn: VBtn["a" /* default */],VCard: VCard["a" /* default */],VCardActions: components_VCard["a" /* VCardActions */],VCardText: components_VCard["c" /* VCardText */],VCardTitle: components_VCard["d" /* VCardTitle */],VChip: VChip["a" /* default */],VCol: VCol["a" /* default */],VDialog: VDialog["a" /* default */],VIcon: VIcon["a" /* default */],VRow: VRow["a" /* default */],VSnackbar: VSnackbar["a" /* default */],VSpacer: VSpacer["a" /* default */],VTextField: VTextField["a" /* default */]})

// CONCATENATED MODULE: ./node_modules/cache-loader/dist/cjs.js?{"cacheDirectory":"node_modules/.cache/vue-loader","cacheIdentifier":"dec867b4-vue-loader-template"}!./node_modules/vue-loader/lib/loaders/templateLoader.js??vue-loader-options!./node_modules/cache-loader/dist/cjs.js??ref--1-0!./node_modules/vue-loader/lib??vue-loader-options!./src/components/progress-bars.vue?vue&type=template&id=551a0743&
var progress_barsvue_type_template_id_551a0743_render = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',_vm._l((_vm.progressBars),function(bar){return _c('div',{key:bar.id,staticClass:"tfaders"},[_c('transition',{attrs:{"name":"fade"}},[(bar.value != bar.total)?_c('div',{staticClass:"tfader"},[_c('span',{staticClass:"text-caption",staticStyle:{"right":"4px","position":"relative"}},[_vm._v(_vm._s(bar.label))]),_c('v-progress-circular',{attrs:{"rotate":-90,"size":"18","value":bar.value / bar.total * 100}})],1):_vm._e()])],1)}),0)}
var progress_barsvue_type_template_id_551a0743_staticRenderFns = []


// CONCATENATED MODULE: ./src/components/progress-bars.vue?vue&type=template&id=551a0743&

// CONCATENATED MODULE: ./node_modules/cache-loader/dist/cjs.js??ref--13-0!./node_modules/thread-loader/dist/cjs.js!./node_modules/babel-loader/lib!./node_modules/cache-loader/dist/cjs.js??ref--1-0!./node_modules/vue-loader/lib??vue-loader-options!./src/components/progress-bars.vue?vue&type=script&lang=js&
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
/* harmony default export */ var progress_barsvue_type_script_lang_js_ = ({
  name: 'progress-bars',
  data: function data() {
    return {};
  },
  computed: {
    progressBars: function progressBars() {
      return this.$store.state.stel.progressbars;
    }
  }
});
// CONCATENATED MODULE: ./src/components/progress-bars.vue?vue&type=script&lang=js&
 /* harmony default export */ var components_progress_barsvue_type_script_lang_js_ = (progress_barsvue_type_script_lang_js_); 
// EXTERNAL MODULE: ./src/components/progress-bars.vue?vue&type=style&index=0&lang=css&
var progress_barsvue_type_style_index_0_lang_css_ = __webpack_require__("6fb1");

// EXTERNAL MODULE: ./node_modules/vuetify/lib/components/VProgressCircular/VProgressCircular.js
var VProgressCircular = __webpack_require__("490a");

// CONCATENATED MODULE: ./src/components/progress-bars.vue






/* normalize component */

var progress_bars_component = Object(componentNormalizer["a" /* default */])(
  components_progress_barsvue_type_script_lang_js_,
  progress_barsvue_type_template_id_551a0743_render,
  progress_barsvue_type_template_id_551a0743_staticRenderFns,
  false,
  null,
  null,
  null
  
)

/* harmony default export */ var progress_bars = (progress_bars_component.exports);

/* vuetify-loader */


installComponents_default()(progress_bars_component, {VProgressCircular: VProgressCircular["a" /* default */]})

// EXTERNAL MODULE: ./src/components/data-credits-dialog.vue
var data_credits_dialog = __webpack_require__("41a1");

// CONCATENATED MODULE: ./node_modules/cache-loader/dist/cjs.js?{"cacheDirectory":"node_modules/.cache/vue-loader","cacheIdentifier":"dec867b4-vue-loader-template"}!./node_modules/vue-loader/lib/loaders/templateLoader.js??vue-loader-options!./node_modules/cache-loader/dist/cjs.js??ref--1-0!./node_modules/vue-loader/lib??vue-loader-options!./src/components/view-settings-dialog.vue?vue&type=template&id=bcf743b4&
var view_settings_dialogvue_type_template_id_bcf743b4_render = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('v-dialog',{attrs:{"max-width":"600"},model:{value:(_vm.$store.state.showViewSettingsDialog),callback:function ($$v) {_vm.$set(_vm.$store.state, "showViewSettingsDialog", $$v)},expression:"$store.state.showViewSettingsDialog"}},[(_vm.$store.state.showViewSettingsDialog)?_c('v-card',{staticClass:"secondary white--text"},[_c('v-card-title',[_c('div',{staticClass:"text-h5"},[_vm._v(_vm._s(_vm.$t('View settings')))])]),_c('v-card-text',[_c('v-checkbox',{attrs:{"hide-details":"","label":_vm.$t('Milky Way')},model:{value:(_vm.milkyWayOn),callback:function ($$v) {_vm.milkyWayOn=$$v},expression:"milkyWayOn"}}),_c('v-checkbox',{attrs:{"hide-details":"","label":_vm.$t('DSS')},model:{value:(_vm.dssOn),callback:function ($$v) {_vm.dssOn=$$v},expression:"dssOn"}}),_c('v-checkbox',{attrs:{"hide-details":"","label":_vm.$t('Meridian Line')},model:{value:(_vm.meridianOn),callback:function ($$v) {_vm.meridianOn=$$v},expression:"meridianOn"}}),_c('v-checkbox',{attrs:{"hide-details":"","label":_vm.$t('Ecliptic Line')},model:{value:(_vm.eclipticOn),callback:function ($$v) {_vm.eclipticOn=$$v},expression:"eclipticOn"}})],1),_c('v-card-actions',[_c('v-spacer'),_c('v-btn',{staticClass:"blue--text darken-1",attrs:{"text":""},nativeOn:{"click":function($event){_vm.$store.state.showViewSettingsDialog = false}}},[_vm._v("Close")])],1)],1):_vm._e()],1)}
var view_settings_dialogvue_type_template_id_bcf743b4_staticRenderFns = []


// CONCATENATED MODULE: ./src/components/view-settings-dialog.vue?vue&type=template&id=bcf743b4&

// CONCATENATED MODULE: ./node_modules/cache-loader/dist/cjs.js??ref--13-0!./node_modules/thread-loader/dist/cjs.js!./node_modules/babel-loader/lib!./node_modules/cache-loader/dist/cjs.js??ref--1-0!./node_modules/vue-loader/lib??vue-loader-options!./src/components/view-settings-dialog.vue?vue&type=script&lang=js&
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
/* harmony default export */ var view_settings_dialogvue_type_script_lang_js_ = ({
  data: function data() {
    return {};
  },
  computed: {
    dssOn: {
      get: function get() {
        return this.$store.state.stel.dss.visible;
      },
      set: function set(newValue) {
        this.$stel.core.dss.visible = newValue;
      }
    },
    milkyWayOn: {
      get: function get() {
        return this.$store.state.stel.milkyway.visible;
      },
      set: function set(newValue) {
        this.$stel.core.milkyway.visible = newValue;
      }
    },
    meridianOn: {
      get: function get() {
        return this.$store.state.stel.lines.meridian.visible;
      },
      set: function set(newValue) {
        this.$stel.core.lines.meridian.visible = newValue;
      }
    },
    eclipticOn: {
      get: function get() {
        return this.$store.state.stel.lines.ecliptic.visible;
      },
      set: function set(newValue) {
        this.$stel.core.lines.ecliptic.visible = newValue;
      }
    }
  }
});
// CONCATENATED MODULE: ./src/components/view-settings-dialog.vue?vue&type=script&lang=js&
 /* harmony default export */ var components_view_settings_dialogvue_type_script_lang_js_ = (view_settings_dialogvue_type_script_lang_js_); 
// EXTERNAL MODULE: ./src/components/view-settings-dialog.vue?vue&type=style&index=0&lang=css&
var view_settings_dialogvue_type_style_index_0_lang_css_ = __webpack_require__("85ad");

// EXTERNAL MODULE: ./node_modules/vuetify/lib/components/VCheckbox/VCheckbox.js
var VCheckbox = __webpack_require__("ac7c");

// CONCATENATED MODULE: ./src/components/view-settings-dialog.vue






/* normalize component */

var view_settings_dialog_component = Object(componentNormalizer["a" /* default */])(
  components_view_settings_dialogvue_type_script_lang_js_,
  view_settings_dialogvue_type_template_id_bcf743b4_render,
  view_settings_dialogvue_type_template_id_bcf743b4_staticRenderFns,
  false,
  null,
  null,
  null
  
)

/* harmony default export */ var view_settings_dialog = (view_settings_dialog_component.exports);

/* vuetify-loader */









installComponents_default()(view_settings_dialog_component, {VBtn: VBtn["a" /* default */],VCard: VCard["a" /* default */],VCardActions: components_VCard["a" /* VCardActions */],VCardText: components_VCard["c" /* VCardText */],VCardTitle: components_VCard["d" /* VCardTitle */],VCheckbox: VCheckbox["a" /* default */],VDialog: VDialog["a" /* default */],VSpacer: VSpacer["a" /* default */]})

// CONCATENATED MODULE: ./node_modules/cache-loader/dist/cjs.js?{"cacheDirectory":"node_modules/.cache/vue-loader","cacheIdentifier":"dec867b4-vue-loader-template"}!./node_modules/vue-loader/lib/loaders/templateLoader.js??vue-loader-options!./node_modules/cache-loader/dist/cjs.js??ref--1-0!./node_modules/vue-loader/lib??vue-loader-options!./src/components/planets-visibility.vue?vue&type=template&id=bcefbd4a&
var planets_visibilityvue_type_template_id_bcefbd4a_render = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('v-dialog',{attrs:{"max-width":"600"},model:{value:(_vm.$store.state.showPlanetsVisibilityDialog),callback:function ($$v) {_vm.$set(_vm.$store.state, "showPlanetsVisibilityDialog", $$v)},expression:"$store.state.showPlanetsVisibilityDialog"}},[(_vm.$store.state.showPlanetsVisibilityDialog)?_c('v-card',{staticClass:"secondary white--text",attrs:{"transparent":""}},[_c('v-card-title',[_c('div',{staticClass:"text-h5"},[_vm._v(_vm._s(_vm.$t('Planets Visibility')))])]),_c('v-card-text',[_vm._v(_vm._s(_vm.$t('Night from {0} to {1}', [_vm.startDate.format('MMMM Do'), _vm.endDate.format('MMMM Do')])))]),_c('v-card-text',[_c('div',[_c('v-row',{attrs:{"no-gutters":""}},[_c('v-col',{attrs:{"cols":"1","offset":"2"}},[_c('span',[_vm._v(_vm._s(_vm.$t('Rise')))])]),_c('v-col',{attrs:{"cols":"1"}},[_c('span',[_vm._v(_vm._s(_vm.$t('Set')))])]),_c('v-col',{attrs:{"cols":"8"}},[_c('v-row',{attrs:{"justify":"space-between"}},[_c('span',[_vm._v("12:00")]),_c('span',[_vm._v("18:00")]),_c('span',[_vm._v("00:00")]),_c('span',[_vm._v("06:00")]),_c('span',[_vm._v("12:00")])])],1)],1),_vm._l((_vm.objs),function(obj){return [_c('v-row',{key:obj.v,attrs:{"no-gutters":""}},[_c('v-col',{attrs:{"cols":"2"}},[_vm._v(_vm._s(_vm.cleanName(obj)))]),_c('v-col',{attrs:{"cols":"1"}},[_vm._v(_vm._s(_vm.formatTime(obj.computeVisibility()[0].rise)))]),_c('v-col',{attrs:{"cols":"1"}},[_vm._v(_vm._s(_vm.formatTime(obj.computeVisibility()[0].set)))]),_c('v-col',{attrs:{"cols":"8"}},[_c('div',{style:(_vm.sunBackgroundStr)},[_vm._v(" "),_c('div',{domProps:{"innerHTML":_vm._s(_vm.planetBackgroundStr(obj))}})])])],1)]})],2)]),_c('v-card-actions',[_c('v-spacer'),_c('v-btn',{staticClass:"blue--text darken-1",attrs:{"text":""},nativeOn:{"click":function($event){_vm.$store.state.showPlanetsVisibilityDialog = false}}},[_vm._v("Close")])],1)],1):_vm._e()],1)}
var planets_visibilityvue_type_template_id_bcefbd4a_staticRenderFns = []


// CONCATENATED MODULE: ./src/components/planets-visibility.vue?vue&type=template&id=bcefbd4a&

// CONCATENATED MODULE: ./node_modules/cache-loader/dist/cjs.js??ref--13-0!./node_modules/thread-loader/dist/cjs.js!./node_modules/babel-loader/lib!./node_modules/cache-loader/dist/cjs.js??ref--1-0!./node_modules/vue-loader/lib??vue-loader-options!./src/components/planets-visibility.vue?vue&type=script&lang=js&
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//


/* harmony default export */ var planets_visibilityvue_type_script_lang_js_ = ({
  data: function data() {
    return {
      objs: [this.$stel.getObj('NAME Sun'), this.$stel.getObj('NAME Moon'), this.$stel.getObj('NAME Mercury'), this.$stel.getObj('NAME Venus'), this.$stel.getObj('NAME Mars'), this.$stel.getObj('NAME Jupiter'), this.$stel.getObj('NAME Saturn')]
    };
  },
  methods: {
    formatTime: function formatTime(jdm) {
      var d = new Date();
      d.setMJD(jdm);
      var utc = moment_default.a.utc(d);
      utc.local();
      return utc.format('HH:mm');
    },
    cleanName: function cleanName(obj) {
      return sw_helpers.cleanupOneSkySourceName(obj.designations()[0]);
    },
    planetBackgroundStr: function planetBackgroundStr(obj) {
      var d = new Date();
      d.setMJD(obj.computeVisibility()[0].rise);
      var rise = moment_default.a.utc(d);
      rise.local();
      d.setMJD(obj.computeVisibility()[0].set);
      var set = moment_default.a.utc(d);
      set.local();

      var hourToPercent = function hourToPercent(h) {
        return h >= 12 ? Math.round((h - 12) / 24 * 100) : Math.round((h + 12) / 24 * 100);
      };

      var riseP = hourToPercent(rise.hours());
      var setP = hourToPercent(set.hours());

      if (setP > riseP) {
        return "<div style='z-index: 100; position: absolute; background-color: rgb(200, 200, 50); left: " + riseP + '%; min-width: ' + (setP - riseP) + "%; top: 7px; height: 8px;'></div>";
      } else {
        var ret = "<div style='z-index: 100; position: absolute; background-color: rgb(200, 200, 50); left: 0%; min-width: " + setP + "%; top: 7px; height: 8px;'></div>";
        ret += "<div style='z-index: 100; position: absolute; background-color: rgb(200, 200, 50); right: 0%; min-width: " + (100 - riseP) + "%; top: 7px; height: 8px;'></div>";
        return ret;
      }
    }
  },
  computed: {
    sunBackgroundStr: function sunBackgroundStr() {
      var sun = this.$stel.getObj('NAME Sun');
      var brightness = [];
      var d = new moment_default.a(this.startDate);
      var obs = this.$stel.core.observer.clone();

      for (var i = 0; i < 25; i++) {
        obs.utc = d.toDate().getMJD();
        d.local();
        var azalt = this.$stel.convertFrame(obs, 'ICRF', 'OBSERVED', sun.getInfo('radec', obs));
        var alt = this.$stel.anpm(this.$stel.c2s(azalt)[1]) * 180.0 / Math.PI;
        brightness.push(alt / (Math.PI / 2));
        d.add(1, 'hours');
      }

      obs.destroy();
      var txt = 'position: relative; background: linear-gradient(to right, ';

      for (var _i = 0; _i < 25; _i++) {
        var bi = (brightness[_i] + 0.1) * 5;
        bi = bi > 1 ? 1 : bi;
        bi = bi < 0 ? 0 : bi;
        txt += 'rgb(' + Math.round(53 * bi) + ', ' + Math.round(173 * bi) + ', ' + Math.round(211 * bi) + ') ' + Math.round(_i / 24 * 100) + '% ';

        if (_i !== 24) {
          txt += ',';
        }
      }

      txt += '); min-width: 100%; height: 100%';
      return txt;
    },
    startDate: function startDate() {
      var sun = this.$stel.getObj('NAME Sun');
      var u = this.$store.state.stel.observer.utc;

      if (u < sun.rise) {
        // It's still night (in the morning), display last night's planets visibility
        u = u - 1;
      }

      var d = new Date();
      d.setMJD(u);
      d = new moment_default.a(d);
      d.local();
      d.hours(12);
      d.minutes(0);
      d.seconds(0);
      return d;
    },
    endDate: function endDate() {
      var d = new moment_default.a(this.startDate);
      d.add(1, 'd');
      return d;
    }
  }
});
// CONCATENATED MODULE: ./src/components/planets-visibility.vue?vue&type=script&lang=js&
 /* harmony default export */ var components_planets_visibilityvue_type_script_lang_js_ = (planets_visibilityvue_type_script_lang_js_); 
// EXTERNAL MODULE: ./src/components/planets-visibility.vue?vue&type=style&index=0&lang=css&
var planets_visibilityvue_type_style_index_0_lang_css_ = __webpack_require__("0c3e");

// CONCATENATED MODULE: ./src/components/planets-visibility.vue






/* normalize component */

var planets_visibility_component = Object(componentNormalizer["a" /* default */])(
  components_planets_visibilityvue_type_script_lang_js_,
  planets_visibilityvue_type_template_id_bcefbd4a_render,
  planets_visibilityvue_type_template_id_bcefbd4a_staticRenderFns,
  false,
  null,
  null,
  null
  
)

/* harmony default export */ var planets_visibility = (planets_visibility_component.exports);

/* vuetify-loader */










installComponents_default()(planets_visibility_component, {VBtn: VBtn["a" /* default */],VCard: VCard["a" /* default */],VCardActions: components_VCard["a" /* VCardActions */],VCardText: components_VCard["c" /* VCardText */],VCardTitle: components_VCard["d" /* VCardTitle */],VCol: VCol["a" /* default */],VDialog: VDialog["a" /* default */],VRow: VRow["a" /* default */],VSpacer: VSpacer["a" /* default */]})

// CONCATENATED MODULE: ./node_modules/cache-loader/dist/cjs.js?{"cacheDirectory":"node_modules/.cache/vue-loader","cacheIdentifier":"dec867b4-vue-loader-template"}!./node_modules/vue-loader/lib/loaders/templateLoader.js??vue-loader-options!./node_modules/cache-loader/dist/cjs.js??ref--1-0!./node_modules/vue-loader/lib??vue-loader-options!./src/components/location-dialog.vue?vue&type=template&id=2f806b57&
var location_dialogvue_type_template_id_2f806b57_render = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('v-dialog',{attrs:{"max-width":"600"},model:{value:(_vm.$store.state.showLocationDialog),callback:function ($$v) {_vm.$set(_vm.$store.state, "showLocationDialog", $$v)},expression:"$store.state.showLocationDialog"}},[(_vm.$store.state.showLocationDialog)?_c('v-container',{staticClass:"secondary white--text"},[_c('v-card',{attrs:{"color":"secondary","flat":""}},[_c('v-switch',{attrs:{"label":_vm.$t('Use Autolocation')},model:{value:(_vm.useAutoLocation),callback:function ($$v) {_vm.useAutoLocation=$$v},expression:"useAutoLocation"}})],1),_c('location-mgr',{attrs:{"knownLocations":[],"startLocation":_vm.$store.state.currentLocation,"realLocation":_vm.$store.state.autoDetectedLocation},on:{"locationSelected":_vm.setLocation}})],1):_vm._e()],1)}
var location_dialogvue_type_template_id_2f806b57_staticRenderFns = []


// CONCATENATED MODULE: ./src/components/location-dialog.vue?vue&type=template&id=2f806b57&

// CONCATENATED MODULE: ./node_modules/cache-loader/dist/cjs.js?{"cacheDirectory":"node_modules/.cache/vue-loader","cacheIdentifier":"dec867b4-vue-loader-template"}!./node_modules/vue-loader/lib/loaders/templateLoader.js??vue-loader-options!./node_modules/cache-loader/dist/cjs.js??ref--1-0!./node_modules/vue-loader/lib??vue-loader-options!./src/components/location-mgr.vue?vue&type=template&id=66dbcf8f&
var location_mgrvue_type_template_id_66dbcf8f_render = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',[_c('v-row',{attrs:{"justify":"space-around"}},[(_vm.doShowMyLocation)?_c('v-col',{attrs:{"cols":"4"}},[_c('v-list',{attrs:{"two-line":"","subheader":""}},[_c('v-subheader',[_vm._v(_vm._s(_vm.$t('My Locations')))]),_vm._l((_vm.knownLocations),function(item){return _c('v-list-item',{key:item.id,style:((item && _vm.knownLocationMode && _vm.selectedKnownLocation && item.id === _vm.selectedKnownLocation.id) ? 'background-color: #455a64' : ''),attrs:{"href":"javascript:;"},nativeOn:{"click":function($event){$event.stopPropagation();return _vm.selectKnownLocation(item)}}},[_c('v-list-item-icon',[_c('v-icon',[_vm._v("mdi-map-marker")])],1),_c('v-list-item-content',[_c('v-list-item-title',[_vm._v(_vm._s(item.short_name))]),_c('v-list-item-subtitle',[_vm._v(_vm._s(item.country))])],1)],1)})],2)],1):_vm._e(),_c('v-col',{attrs:{"cols":"doShowMyLocation ? 8 : 12"}},[_c('v-card',{staticClass:"blue-grey darken-2 white--text"},[_c('v-card-title',{attrs:{"primary-title":""}},[_c('v-container',{attrs:{"fluid":""}},[_c('v-row',[_c('v-col',[_c('div',[_c('div',{staticClass:"text-h5",staticStyle:{"overflow":"hidden","white-space":"nowrap","text-overflow":"ellipsis"}},[_vm._v(_vm._s(_vm.locationForDetail ? _vm.locationForDetail.short_name + ', ' + _vm.locationForDetail.country : '-'))]),_c('v-btn',{staticStyle:{"position":"absolute","right":"20px"},nativeOn:{"click":function($event){$event.stopPropagation();return _vm.useLocation()}}},[_c('v-icon',[_vm._v("mdi-chevron-right")]),_vm._v(" "+_vm._s(_vm.$t('Use this location')))],1),(_vm.locationForDetail.street_address)?_c('div',{staticClass:"grey--text text-subtitle-2"},[_vm._v(_vm._s(_vm.locationForDetail ? (_vm.locationForDetail.street_address ? _vm.locationForDetail.street_address : _vm.$t('Unknown Address')) : '-'))]):_vm._e(),_c('div',{staticClass:"grey--text text-subtitle-2"},[_vm._v(_vm._s(_vm.locationForDetail ? _vm.locationForDetail.lat.toFixed(5) + ' ' + _vm.locationForDetail.lng.toFixed(5) : '-'))])],1)])],1)],1)],1),_c('div',{staticStyle:{"height":"375px"}},[_c('v-btn',{staticClass:"mx-0 pa-0",staticStyle:{"position":"absolute","z-index":"10000","bottom":"16px","right":"12px"},attrs:{"light":"","fab":""},nativeOn:{"click":function($event){$event.stopPropagation();return _vm.centerOnRealPosition()}}},[_c('v-icon',[_vm._v("mdi-crosshairs-gps")])],1),_c('l-map',{ref:"myMap",staticClass:"black--text",staticStyle:{"width":"100%","height":"375px"},attrs:{"center":_vm.mapCenter,"zoom":10,"options":{zoomControl: false}}},[_c('l-control-zoom',{attrs:{"position":"topright"}}),_vm._l((_vm.knownLocations),function(loc){return _c('l-marker',{key:loc.id,attrs:{"lat-lng":[ loc.lat, loc.lng ],"clickable":true,"opacity":(!_vm.pickLocationMode && _vm.selectedKnownLocation && _vm.selectedKnownLocation === loc ? 1.0 : 0.25),"draggable":!_vm.pickLocationMode && _vm.selectedKnownLocation && _vm.selectedKnownLocation === loc},on:{"click":function($event){return _vm.selectKnownLocation(loc)},"dragend":_vm.dragEnd}})}),(_vm.startLocation)?_c('l-circle',{attrs:{"lat-lng":[ _vm.startLocation.lat, _vm.startLocation.lng ],"radius":_vm.startLocation.accuracy,"options":{
                strokeColor: '#0000FF',
                strokeOpacity: 0.5,
                strokeWeight: 1,
                fillColor: '#0000FF',
                fillOpacity: 0.08}}}):_vm._e(),(_vm.pickLocationMode && _vm.pickLocation)?_c('l-marker',{attrs:{"lat-lng":[ _vm.pickLocation.lat, _vm.pickLocation.lng ],"draggable":true},on:{"dragend":_vm.dragEnd}},[_c('l-tooltip',[_c('div',{staticClass:"black--text"},[_vm._v("Drag to adjust")])])],1):_vm._e()],2)],1)],1)],1)],1)],1)}
var location_mgrvue_type_template_id_66dbcf8f_staticRenderFns = []


// CONCATENATED MODULE: ./src/components/location-mgr.vue?vue&type=template&id=66dbcf8f&

// EXTERNAL MODULE: ./node_modules/vue2-leaflet/dist/components/LMap.js
var LMap = __webpack_require__("2699");

// EXTERNAL MODULE: ./node_modules/vue2-leaflet/dist/components/LMarker.js
var LMarker = __webpack_require__("4e2b");

// EXTERNAL MODULE: ./node_modules/vue2-leaflet/dist/components/LCircle.js
var LCircle = __webpack_require__("0dbd");

// EXTERNAL MODULE: ./node_modules/vue2-leaflet/dist/components/LTooltip.js
var LTooltip = __webpack_require__("31dc");

// EXTERNAL MODULE: ./node_modules/vue2-leaflet/dist/components/LControlZoom.js
var LControlZoom = __webpack_require__("c8b6");

// CONCATENATED MODULE: ./node_modules/cache-loader/dist/cjs.js??ref--13-0!./node_modules/thread-loader/dist/cjs.js!./node_modules/babel-loader/lib!./node_modules/cache-loader/dist/cjs.js??ref--1-0!./node_modules/vue-loader/lib??vue-loader-options!./src/components/location-mgr.vue?vue&type=script&lang=js&

//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//


/* harmony default export */ var location_mgrvue_type_script_lang_js_ = ({
  data: function data() {
    return {
      mode: 'pick',
      pickLocation: undefined,
      selectedKnownLocation: undefined,
      mapCenter: [43.6, 1.4333]
    };
  },
  props: ['showMyLocation', 'knownLocations', 'startLocation', 'realLocation'],
  computed: {
    doShowMyLocation: function doShowMyLocation() {
      return this.showMyLocation === undefined ? false : this.showMyLocation;
    },
    pickLocationMode: function pickLocationMode() {
      return this.mode === 'pick';
    },
    knownLocationMode: function knownLocationMode() {
      return this.mode === 'known';
    },
    locationForDetail: function locationForDetail() {
      if (this.pickLocationMode && this.pickLocation === undefined) {
        return this.startLocation;
      }

      return this.pickLocationMode ? this.pickLocation : this.selectedKnownLocation;
    }
  },
  watch: {
    startLocation: function startLocation() {
      this.setPickLocation(this.startLocation);
    }
  },
  mounted: function mounted() {
    var _this = this;

    this.setPickLocation(this.startLocation);
    this.$nextTick(function () {
      var map = _this.$refs.myMap.mapObject;

      map._onResize();
    });
  },
  methods: {
    selectKnownLocation: function selectKnownLocation(loc) {
      this.selectedKnownLocation = loc;
      this.setKnownLocationMode();
      this.mapCenter = [loc.lat, loc.lng];
    },
    useLocation: function useLocation() {
      this.$emit('locationSelected', this.locationForDetail);
    },
    setPickLocationMode: function setPickLocationMode() {
      this.mode = 'pick';
    },
    setKnownLocationMode: function setKnownLocationMode() {
      this.mode = 'known';
    },
    setPickLocation: function setPickLocation(loc) {
      if (loc.accuracy < 100) {
        var _iterator = Object(createForOfIteratorHelper["a" /* default */])(this.knownLocations),
            _step;

        try {
          for (_iterator.s(); !(_step = _iterator.n()).done;) {
            var l = _step.value;
            var d = sw_helpers.getDistanceFromLatLonInM(l.lat, l.lng, loc.lat, loc.lng);

            if (d < 100) {
              this.selectKnownLocation(l);
              return;
            }
          }
        } catch (err) {
          _iterator.e(err);
        } finally {
          _iterator.f();
        }
      }

      var pos = {
        lat: loc.lat,
        lng: loc.lng
      };
      this.mapCenter = [pos.lat, pos.lng];
      this.pickLocation = loc;
      this.setPickLocationMode();
    },
    // Called when the user clicks on the small cross button
    centerOnRealPosition: function centerOnRealPosition() {
      this.setPickLocation(this.realLocation);
    },
    dragEnd: function dragEnd(event) {
      var that = this;
      var pos = {
        lat: event.target._latlng.lat,
        lng: event.target._latlng.lng,
        accuracy: 0
      };
      sw_helpers.geoCodePosition(pos, that).then(function (p) {
        that.pickLocation = p;
        that.setPickLocationMode();
      });
    }
  },
  components: {
    LMap: LMap["a" /* default */],
    LMarker: LMarker["a" /* default */],
    LCircle: LCircle["a" /* default */],
    LTooltip: LTooltip["a" /* default */],
    LControlZoom: LControlZoom["a" /* default */]
  }
});
// CONCATENATED MODULE: ./src/components/location-mgr.vue?vue&type=script&lang=js&
 /* harmony default export */ var components_location_mgrvue_type_script_lang_js_ = (location_mgrvue_type_script_lang_js_); 
// EXTERNAL MODULE: ./node_modules/vuetify/lib/components/VList/VListItemIcon.js
var VListItemIcon = __webpack_require__("34c3");

// EXTERNAL MODULE: ./node_modules/vuetify/lib/components/VSubheader/VSubheader.js
var VSubheader = __webpack_require__("e0c7");

// CONCATENATED MODULE: ./src/components/location-mgr.vue





/* normalize component */

var location_mgr_component = Object(componentNormalizer["a" /* default */])(
  components_location_mgrvue_type_script_lang_js_,
  location_mgrvue_type_template_id_66dbcf8f_render,
  location_mgrvue_type_template_id_66dbcf8f_staticRenderFns,
  false,
  null,
  null,
  null
  
)

/* harmony default export */ var location_mgr = (location_mgr_component.exports);

/* vuetify-loader */















installComponents_default()(location_mgr_component, {VBtn: VBtn["a" /* default */],VCard: VCard["a" /* default */],VCardTitle: components_VCard["d" /* VCardTitle */],VCol: VCol["a" /* default */],VContainer: VContainer["a" /* default */],VIcon: VIcon["a" /* default */],VList: VList["a" /* default */],VListItem: VListItem["a" /* default */],VListItemContent: components_VList["a" /* VListItemContent */],VListItemIcon: VListItemIcon["a" /* default */],VListItemSubtitle: components_VList["b" /* VListItemSubtitle */],VListItemTitle: components_VList["c" /* VListItemTitle */],VRow: VRow["a" /* default */],VSubheader: VSubheader["a" /* default */]})

// CONCATENATED MODULE: ./node_modules/cache-loader/dist/cjs.js??ref--13-0!./node_modules/thread-loader/dist/cjs.js!./node_modules/babel-loader/lib!./node_modules/cache-loader/dist/cjs.js??ref--1-0!./node_modules/vue-loader/lib??vue-loader-options!./src/components/location-dialog.vue?vue&type=script&lang=js&
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//

/* harmony default export */ var location_dialogvue_type_script_lang_js_ = ({
  data: function data() {
    return {};
  },
  computed: {
    useAutoLocation: {
      get: function get() {
        return this.$store.state.useAutoLocation;
      },
      set: function set(b) {
        this.$store.commit('setUseAutoLocation', b);
      }
    }
  },
  mounted: function mounted() {},
  methods: {
    setLocation: function setLocation(loc) {
      this.$store.commit('setCurrentLocation', loc);
      this.$store.commit('toggleBool', 'showLocationDialog');
    }
  },
  components: {
    LocationMgr: location_mgr
  }
});
// CONCATENATED MODULE: ./src/components/location-dialog.vue?vue&type=script&lang=js&
 /* harmony default export */ var components_location_dialogvue_type_script_lang_js_ = (location_dialogvue_type_script_lang_js_); 
// EXTERNAL MODULE: ./node_modules/vuetify/lib/components/VSwitch/VSwitch.js
var VSwitch = __webpack_require__("b73d");

// CONCATENATED MODULE: ./src/components/location-dialog.vue





/* normalize component */

var location_dialog_component = Object(componentNormalizer["a" /* default */])(
  components_location_dialogvue_type_script_lang_js_,
  location_dialogvue_type_template_id_2f806b57_render,
  location_dialogvue_type_template_id_2f806b57_staticRenderFns,
  false,
  null,
  null,
  null
  
)

/* harmony default export */ var location_dialog = (location_dialog_component.exports);

/* vuetify-loader */





installComponents_default()(location_dialog_component, {VCard: VCard["a" /* default */],VContainer: VContainer["a" /* default */],VDialog: VDialog["a" /* default */],VSwitch: VSwitch["a" /* default */]})

// CONCATENATED MODULE: ./node_modules/cache-loader/dist/cjs.js?{"cacheDirectory":"node_modules/.cache/vue-loader","cacheIdentifier":"dec867b4-vue-loader-template"}!./node_modules/vue-loader/lib/loaders/templateLoader.js??vue-loader-options!./node_modules/cache-loader/dist/cjs.js??ref--1-0!./node_modules/vue-loader/lib??vue-loader-options!./src/components/observing-panel.vue?vue&type=template&id=6d052627&
var observing_panelvue_type_template_id_6d052627_render = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{staticClass:"get-click",class:{observingpanelhidden: !_vm.$store.state.showSidePanel},attrs:{"id":"observing-panel-container"}},[(_vm.$store.state.showObservingPanelTabsButtons)?_c('div',{staticClass:"observing-panel-tabsbtn"},_vm._l((_vm.tabs),function(tab){return _c('v-btn',{key:tab.tabName,staticClass:"tab-bt",attrs:{"small":"","to":tab.url,"active-class":"tab-bt-active"}},[_vm._v(_vm._s(_vm.$t(tab.tabName)))])}),1):_vm._e(),_c('div',{attrs:{"id":"observing-panel"}},[_c('router-view',{staticStyle:{"height":"100%"}})],1)])}
var observing_panelvue_type_template_id_6d052627_staticRenderFns = []


// CONCATENATED MODULE: ./src/components/observing-panel.vue?vue&type=template&id=6d052627&

// CONCATENATED MODULE: ./node_modules/cache-loader/dist/cjs.js??ref--13-0!./node_modules/thread-loader/dist/cjs.js!./node_modules/babel-loader/lib!./node_modules/cache-loader/dist/cjs.js??ref--1-0!./node_modules/vue-loader/lib??vue-loader-options!./src/components/observing-panel.vue?vue&type=script&lang=js&
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
/* harmony default export */ var observing_panelvue_type_script_lang_js_ = ({
  data: function data() {
    return {};
  },
  computed: {
    showObservingPanel: function showObservingPanel() {
      return this.$store.state.showSidePanel;
    },
    tabs: function tabs() {
      var res = [];

      for (var i in this.$stellariumWebPlugins()) {
        var plugin = this.$stellariumWebPlugins()[i];

        if (plugin.panelRoutes) {
          for (var j in plugin.panelRoutes) {
            var r = plugin.panelRoutes[j];

            if (r.meta && r.meta.tabName) {
              res.push({
                tabName: r.meta.tabName,
                url: r.path
              });
            }
          }
        }
      }

      return res;
    }
  }
});
// CONCATENATED MODULE: ./src/components/observing-panel.vue?vue&type=script&lang=js&
 /* harmony default export */ var components_observing_panelvue_type_script_lang_js_ = (observing_panelvue_type_script_lang_js_); 
// EXTERNAL MODULE: ./src/components/observing-panel.vue?vue&type=style&index=0&lang=css&
var observing_panelvue_type_style_index_0_lang_css_ = __webpack_require__("6806");

// CONCATENATED MODULE: ./src/components/observing-panel.vue






/* normalize component */

var observing_panel_component = Object(componentNormalizer["a" /* default */])(
  components_observing_panelvue_type_script_lang_js_,
  observing_panelvue_type_template_id_6d052627_render,
  observing_panelvue_type_template_id_6d052627_staticRenderFns,
  false,
  null,
  null,
  null
  
)

/* harmony default export */ var observing_panel = (observing_panel_component.exports);

/* vuetify-loader */


installComponents_default()(observing_panel_component, {VBtn: VBtn["a" /* default */]})

// CONCATENATED MODULE: ./node_modules/cache-loader/dist/cjs.js??ref--13-0!./node_modules/thread-loader/dist/cjs.js!./node_modules/babel-loader/lib!./node_modules/cache-loader/dist/cjs.js??ref--1-0!./node_modules/vue-loader/lib??vue-loader-options!./src/components/gui.vue?vue&type=script&lang=js&



//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//









/* harmony default export */ var guivue_type_script_lang_js_ = ({
  data: function data() {
    return {};
  },
  methods: {},
  computed: {
    pluginsGuiComponents: function pluginsGuiComponents() {
      var res = [];

      for (var i in this.$stellariumWebPlugins()) {
        var plugin = this.$stellariumWebPlugins()[i];

        if (plugin.guiComponents) {
          res = res.concat(plugin.guiComponents);
        }
      }

      return res;
    },
    dialogs: function dialogs() {
      var res = ['data-credits-dialog', 'view-settings-dialog', 'planets-visibility', 'location-dialog'];

      for (var i in this.$stellariumWebPlugins()) {
        var plugin = this.$stellariumWebPlugins()[i];

        if (plugin.dialogs) {
          res = res.concat(plugin.dialogs.map(function (d) {
            return d.name;
          }));
        }
      }

      return res;
    }
  },
  components: {
    Toolbar: toolbar,
    BottomBar: bottom_bar,
    DataCreditsDialog: data_credits_dialog["default"],
    ViewSettingsDialog: view_settings_dialog,
    PlanetsVisibility: planets_visibility,
    SelectedObjectInfo: selected_object_info,
    LocationDialog: location_dialog,
    ProgressBars: progress_bars,
    ObservingPanel: observing_panel
  }
});
// CONCATENATED MODULE: ./src/components/gui.vue?vue&type=script&lang=js&
 /* harmony default export */ var components_guivue_type_script_lang_js_ = (guivue_type_script_lang_js_); 
// CONCATENATED MODULE: ./src/components/gui.vue





/* normalize component */

var gui_component = Object(componentNormalizer["a" /* default */])(
  components_guivue_type_script_lang_js_,
  guivue_type_template_id_28d988c2_render,
  guivue_type_template_id_28d988c2_staticRenderFns,
  false,
  null,
  null,
  null
  
)

/* harmony default export */ var gui = (gui_component.exports);
// CONCATENATED MODULE: ./node_modules/cache-loader/dist/cjs.js?{"cacheDirectory":"node_modules/.cache/vue-loader","cacheIdentifier":"dec867b4-vue-loader-template"}!./node_modules/vue-loader/lib/loaders/templateLoader.js??vue-loader-options!./node_modules/cache-loader/dist/cjs.js??ref--1-0!./node_modules/vue-loader/lib??vue-loader-options!./src/components/gui-loader.vue?vue&type=template&id=3ff106c6&
var gui_loadervue_type_template_id_3ff106c6_render = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{staticClass:"secondary",staticStyle:{"position":"absolute","width":"100%","height":"100%"}},[_c('v-container',{staticStyle:{"width":"100%","height":"100%"}},[_c('v-layout',{staticStyle:{"width":"100%","height":"100%"},attrs:{"column":"","align-center":""}},[_c('div',{staticClass:"oras-loader-title text-h2",staticStyle:{"padding-top":"10%"}},[_vm._v("ORAS Sky-Engine")]),(_vm.$store.state.wasmSupport)?_c('div',{staticStyle:{"margin":"auto"}},[_c('div',{staticStyle:{"display":"flex","justify-content":"center"}},[_c('p',{staticClass:"grey--text"},[_c('i18n',{attrs:{"path":"Loading {0}, the online Star Map"}},[_c('span',[_vm._v("ORAS Sky-Engine")])])],1)]),_c('div',{staticStyle:{"display":"flex","justify-content":"center"}},[_c('v-progress-circular',{staticClass:"grey--text",attrs:{"indeterminate":"","size":70,"width":7}})],1)]):_c('v-card',{staticStyle:{"margin":"auto"}},[_c('v-card-title',{attrs:{"primary-title":""}},[_c('div',{staticClass:"text-h5"},[_c('h1',[_vm._v(_vm._s(_vm.$t('Could not show the Online Star Map')))])]),_c('div',{staticClass:"text-h5",staticStyle:{"margin-top":"30px"}},[_c('v-icon',{attrs:{"large":""}},[_vm._v("error")]),_vm._v(" "+_vm._s(_vm.$t('It seems that your browser cannot load Web Assembly!')))],1)]),_c('v-card-text',[_c('v-layout',{staticStyle:{"width":"100%","height":"100%"},attrs:{"column":"","align-center":""}},[_c('p',{staticClass:"grey--text"},[_vm._v(_vm._s(_vm.$t('Web assembly is necessary for ORAS Sky-Engine to display the star map. Please upgrade your web browser and try again!')))]),_c('p',[_c('i18n',{attrs:{"path":"In the meantime, you can try the {0}!"}},[_c('span',[_vm._v(_vm._s(_vm.$t('desktop version')))])])],1)])],1)],1)],1)],1)],1)}
var gui_loadervue_type_template_id_3ff106c6_staticRenderFns = []


// CONCATENATED MODULE: ./src/components/gui-loader.vue?vue&type=template&id=3ff106c6&

// CONCATENATED MODULE: ./node_modules/cache-loader/dist/cjs.js??ref--13-0!./node_modules/thread-loader/dist/cjs.js!./node_modules/babel-loader/lib!./node_modules/cache-loader/dist/cjs.js??ref--1-0!./node_modules/vue-loader/lib??vue-loader-options!./src/components/gui-loader.vue?vue&type=script&lang=js&
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
/* harmony default export */ var gui_loadervue_type_script_lang_js_ = ({});
// CONCATENATED MODULE: ./src/components/gui-loader.vue?vue&type=script&lang=js&
 /* harmony default export */ var components_gui_loadervue_type_script_lang_js_ = (gui_loadervue_type_script_lang_js_); 
// EXTERNAL MODULE: ./src/components/gui-loader.vue?vue&type=style&index=0&lang=css&
var gui_loadervue_type_style_index_0_lang_css_ = __webpack_require__("cbeb");

// EXTERNAL MODULE: ./node_modules/vuetify/lib/components/VGrid/VLayout.js
var VLayout = __webpack_require__("a722");

// CONCATENATED MODULE: ./src/components/gui-loader.vue






/* normalize component */

var gui_loader_component = Object(componentNormalizer["a" /* default */])(
  components_gui_loadervue_type_script_lang_js_,
  gui_loadervue_type_template_id_3ff106c6_render,
  gui_loadervue_type_template_id_3ff106c6_staticRenderFns,
  false,
  null,
  null,
  null
  
)

/* harmony default export */ var gui_loader = (gui_loader_component.exports);

/* vuetify-loader */








installComponents_default()(gui_loader_component, {VCard: VCard["a" /* default */],VCardText: components_VCard["c" /* VCardText */],VCardTitle: components_VCard["d" /* VCardTitle */],VContainer: VContainer["a" /* default */],VIcon: VIcon["a" /* default */],VLayout: VLayout["a" /* default */],VProgressCircular: VProgressCircular["a" /* default */]})

// CONCATENATED MODULE: ./node_modules/cache-loader/dist/cjs.js?{"cacheDirectory":"node_modules/.cache/vue-loader","cacheIdentifier":"dec867b4-vue-loader-template"}!./node_modules/vue-loader/lib/loaders/templateLoader.js??vue-loader-options!./node_modules/cache-loader/dist/cjs.js??ref--1-0!./node_modules/vue-loader/lib??vue-loader-options!./src/components/oras-catalog-status-dialog.vue?vue&type=template&id=f9af96b2&scoped=true&
var oras_catalog_status_dialogvue_type_template_id_f9af96b2_scoped_true_render = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('v-dialog',{attrs:{"value":_vm.value,"max-width":"760"},on:{"input":function($event){return _vm.$emit('input', $event)}}},[_c('v-card',{staticClass:"oras-catalog-status"},[_c('v-card-title',[_vm._v(" ORAS Catalog Packs "),_c('v-spacer'),_c('v-chip',{attrs:{"small":"","color":_vm.statusColor,"text-color":"white"}},[_vm._v(_vm._s(_vm.statusLabel))])],1),_c('v-card-subtitle',[_vm._v(" Release "+_vm._s(_vm.snapshot.releaseVersion || 'not mounted')+" · Loaded objects "+_vm._s(_vm.snapshot.objectCount.toLocaleString())+" ")]),_c('v-card-text',[(!_vm.snapshot.mounted)?_c('v-alert',{attrs:{"type":"info","text":""}},[_vm._v(" No generated catalog release is mounted. The standard Stellarium catalogs remain available. ")]):_c('v-simple-table',{attrs:{"dense":""}},[_c('thead',[_c('tr',[_c('th',[_vm._v("Pack")]),_c('th',[_vm._v("Status")]),_c('th',[_vm._v("Loaded objects")]),_c('th',[_vm._v("Data source")]),_c('th',[_vm._v("Generated")])])]),_c('tbody',_vm._l((_vm.snapshot.packs),function(pack){return _c('tr',{key:pack.packId},[_c('td',[_c('strong',[_vm._v(_vm._s(pack.label))]),_c('br'),_c('small',[_vm._v(_vm._s(pack.version))])]),_c('td',[_c('v-chip',{attrs:{"x-small":"","color":pack.status === 'loaded' ? 'green' : 'red',"text-color":"white"}},[_vm._v(_vm._s(pack.status))])],1),_c('td',[_vm._v(_vm._s(pack.loadedObjectCount.toLocaleString()))]),_c('td',[_vm._v(_vm._s(_vm.sourceNames(pack)))]),_c('td',[_vm._v(_vm._s(pack.generatedAt || 'Unavailable'))])])}),0)])],1),_c('v-card-actions',[_c('v-btn',{attrs:{"text":""},on:{"click":_vm.refresh}},[_vm._v("Refresh")]),_c('v-spacer'),_c('v-btn',{attrs:{"text":""},on:{"click":function($event){return _vm.$emit('input', false)}}},[_vm._v("Close")])],1)],1)],1)}
var oras_catalog_status_dialogvue_type_template_id_f9af96b2_scoped_true_staticRenderFns = []


// CONCATENATED MODULE: ./src/components/oras-catalog-status-dialog.vue?vue&type=template&id=f9af96b2&scoped=true&

// CONCATENATED MODULE: ./node_modules/cache-loader/dist/cjs.js??ref--13-0!./node_modules/thread-loader/dist/cjs.js!./node_modules/babel-loader/lib!./node_modules/cache-loader/dist/cjs.js??ref--1-0!./node_modules/vue-loader/lib??vue-loader-options!./src/components/oras-catalog-status-dialog.vue?vue&type=script&lang=js&






//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//

/* harmony default export */ var oras_catalog_status_dialogvue_type_script_lang_js_ = ({
  name: 'OrasCatalogStatusDialog',
  props: {
    value: {
      type: Boolean,
      default: false
    }
  },
  data: function data() {
    return {
      snapshot: orasCatalogPacks.getSnapshot(),
      unsubscribe: undefined
    };
  },
  computed: {
    statusLabel: function statusLabel() {
      return this.snapshot.phase.replace('-', ' ');
    },
    statusColor: function statusColor() {
      if (this.snapshot.phase === 'loaded') return 'green';
      if (this.snapshot.phase === 'degraded' || this.snapshot.phase === 'failed') return 'orange';
      return 'blue-grey';
    }
  },
  created: function created() {
    var _this = this;

    this.unsubscribe = orasCatalogPacks.subscribe(function (snapshot) {
      _this.snapshot = snapshot;
    });
  },
  beforeDestroy: function beforeDestroy() {
    if (this.unsubscribe) this.unsubscribe();
  },
  methods: {
    refresh: function refresh() {
      orasCatalogPacks.load();
    },
    sourceNames: function sourceNames(pack) {
      var names = (pack.sources || []).map(function (source) {
        return source.name;
      }).filter(Boolean);
      return names.length ? names.join(', ') : 'Unavailable';
    }
  }
});
// CONCATENATED MODULE: ./src/components/oras-catalog-status-dialog.vue?vue&type=script&lang=js&
 /* harmony default export */ var components_oras_catalog_status_dialogvue_type_script_lang_js_ = (oras_catalog_status_dialogvue_type_script_lang_js_); 
// EXTERNAL MODULE: ./src/components/oras-catalog-status-dialog.vue?vue&type=style&index=0&id=f9af96b2&scoped=true&lang=css&
var oras_catalog_status_dialogvue_type_style_index_0_id_f9af96b2_scoped_true_lang_css_ = __webpack_require__("b41d");

// EXTERNAL MODULE: ./node_modules/vuetify/lib/components/VAlert/VAlert.js + 1 modules
var VAlert = __webpack_require__("0798");

// EXTERNAL MODULE: ./node_modules/vuetify/lib/components/VDataTable/VSimpleTable.js
var VSimpleTable = __webpack_require__("1f4f");

// CONCATENATED MODULE: ./src/components/oras-catalog-status-dialog.vue






/* normalize component */

var oras_catalog_status_dialog_component = Object(componentNormalizer["a" /* default */])(
  components_oras_catalog_status_dialogvue_type_script_lang_js_,
  oras_catalog_status_dialogvue_type_template_id_f9af96b2_scoped_true_render,
  oras_catalog_status_dialogvue_type_template_id_f9af96b2_scoped_true_staticRenderFns,
  false,
  null,
  "f9af96b2",
  null
  
)

/* harmony default export */ var oras_catalog_status_dialog = (oras_catalog_status_dialog_component.exports);

/* vuetify-loader */












installComponents_default()(oras_catalog_status_dialog_component, {VAlert: VAlert["a" /* default */],VBtn: VBtn["a" /* default */],VCard: VCard["a" /* default */],VCardActions: components_VCard["a" /* VCardActions */],VCardSubtitle: components_VCard["b" /* VCardSubtitle */],VCardText: components_VCard["c" /* VCardText */],VCardTitle: components_VCard["d" /* VCardTitle */],VChip: VChip["a" /* default */],VDialog: VDialog["a" /* default */],VSimpleTable: VSimpleTable["a" /* default */],VSpacer: VSpacer["a" /* default */]})

// CONCATENATED MODULE: ./node_modules/cache-loader/dist/cjs.js?{"cacheDirectory":"node_modules/.cache/vue-loader","cacheIdentifier":"dec867b4-vue-loader-template"}!./node_modules/vue-loader/lib/loaders/templateLoader.js??vue-loader-options!./node_modules/cache-loader/dist/cjs.js??ref--1-0!./node_modules/vue-loader/lib??vue-loader-options!./src/components/oras-dense-stars-status-dialog.vue?vue&type=template&id=0e713f36&scoped=true&
var oras_dense_stars_status_dialogvue_type_template_id_0e713f36_scoped_true_render = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('v-dialog',{attrs:{"value":_vm.value,"max-width":"760"},on:{"input":function($event){return _vm.$emit('input', $event)}}},[_c('v-card',{staticClass:"oras-dense-stars-status"},[_c('v-card-title',[_vm._v(" ORAS Dense Stars "),_c('v-spacer'),_c('v-chip',{attrs:{"small":"","color":_vm.statusColor,"text-color":"white"}},[_vm._v(_vm._s(_vm.statusLabel))])],1),_c('v-card-subtitle',[_vm._v(" Native path: native SWE star tiles · Release "+_vm._s(_vm.snapshot.releaseVersion || 'not mounted')+" ")]),_c('v-card-text',[(!_vm.snapshot.mounted)?_c('v-alert',{attrs:{"type":"info","text":""}},[_vm._v(" Dense Stars is degraded: missing generated dense star release. Standard Stellarium star surveys remain available. ")]):(_vm.snapshot.activeProfile === 'off')?_c('v-alert',{attrs:{"type":"warning","text":""}},[_vm._v(" ORAS dense star rendering is off. Select Visual Sky, Binocular Depth, or Deep Catalog and recheck the runtime to register a mounted native survey. ")]):(_vm.snapshot.activeProfile === 'deep-catalog')?_c('v-alert',{attrs:{"type":"warning","text":""}},[_vm._v(" Deep Catalog is opt-in and may show many faint stars at wide FOV. Use Visual Sky for normal naked-eye style observing. ")]):_c('v-alert',{attrs:{"type":"success","text":""}},[_vm._v(" ORAS dense stars are loaded through native SWE star tiles using the "+_vm._s(_vm.snapshot.activeProfile)+" profile. Dense catalog labels are suppressed; standard Stellarium labels remain available for named bright stars. ")]),_c('v-alert',{attrs:{"type":"info","text":""}},[_vm._v(" Visual Sky is the realistic default. Binocular Depth and Deep Catalog are intentionally denser opt-in profiles. Labels are suppressed for generated dense stars to avoid ID flooding. ")]),_c('v-simple-table',{attrs:{"dense":""}},[_c('tbody',[_c('tr',[_c('td',[_c('strong',[_vm._v("Active profile")])]),_c('td',[_vm._v(_vm._s(_vm.snapshot.activeProfile))])]),_c('tr',[_c('td',[_c('strong',[_vm._v("Rendering path")])]),_c('td',[_vm._v(_vm._s(_vm.snapshot.renderingPath || 'Unavailable'))])]),_c('tr',[_c('td',[_c('strong',[_vm._v("Stars")])]),_c('td',[_vm._v(_vm._s(_vm.snapshot.starCount.toLocaleString()))])]),_c('tr',[_c('td',[_c('strong',[_vm._v("Tiles")])]),_c('td',[_vm._v(_vm._s(_vm.snapshot.tileCount.toLocaleString()))])]),_c('tr',[_c('td',[_c('strong',[_vm._v("Magnitude limit")])]),_c('td',[_vm._v(_vm._s(_vm.snapshot.magnitudeLimit == null ? 'Unavailable' : _vm.snapshot.magnitudeLimit))])]),_c('tr',[_c('td',[_c('strong',[_vm._v("Labels")])]),_c('td',[_vm._v(_vm._s(_vm.snapshot.labelMode || 'suppressed'))])]),_c('tr',[_c('td',[_c('strong',[_vm._v("Tile order")])]),_c('td',[_vm._v(_vm._s(_vm.snapshot.tileOrder == null ? 'Unavailable' : _vm.snapshot.tileOrder))])]),_c('tr',[_c('td',[_c('strong',[_vm._v("Sources")])]),_c('td',[_vm._v(_vm._s(_vm.sourceCatalogSummary))])]),(_vm.snapshot.error)?_c('tr',[_c('td',[_c('strong',[_vm._v("Error")])]),_c('td',[_vm._v(_vm._s(_vm.snapshot.error))])]):_vm._e()])])],1),_c('v-card-actions',[_c('v-btn',{attrs:{"text":""},on:{"click":_vm.refresh}},[_vm._v("Refresh")]),_c('v-spacer'),_c('v-btn',{attrs:{"text":""},on:{"click":function($event){return _vm.$emit('input', false)}}},[_vm._v("Close")])],1)],1)],1)}
var oras_dense_stars_status_dialogvue_type_template_id_0e713f36_scoped_true_staticRenderFns = []


// CONCATENATED MODULE: ./src/components/oras-dense-stars-status-dialog.vue?vue&type=template&id=0e713f36&scoped=true&

// EXTERNAL MODULE: ./node_modules/core-js/modules/es.object.entries.js
var es_object_entries = __webpack_require__("4fad");

// CONCATENATED MODULE: ./src/assets/oras_dense_stars.js

















var ORAS_DENSE_STARS_ROOT = '/oras-sky-engine/skydata/dense-star-tiles';
var OFF_PROFILE = 'off';
var DEFAULT_PROFILE = 'visual-default';
var PROFILE_STORAGE_KEY = 'orasDenseStarsProfile';
var LEGACY_ENABLED_STORAGE_KEY = 'orasDenseStarsEnabled';

function normalizeProfile(profile) {
  var value = String(profile || '').trim();
  return value || DEFAULT_PROFILE;
}

function defaultDenseStarsProfile() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      var stored = window.localStorage.getItem(PROFILE_STORAGE_KEY);
      if (stored) return normalizeProfile(stored);
      if (window.localStorage.getItem(LEGACY_ENABLED_STORAGE_KEY) === '0') return OFF_PROFILE;
    }
  } catch (error) {}

  return DEFAULT_PROFILE;
}
function persistDenseStarsProfile(profile) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(PROFILE_STORAGE_KEY, normalizeProfile(profile));
    }
  } catch (error) {}
}

function oras_dense_stars_emptySnapshot() {
  var phase = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'idle';
  return {
    phase: phase,
    mounted: false,
    activeProfile: defaultDenseStarsProfile(),
    defaultProfile: DEFAULT_PROFILE,
    profile: undefined,
    profiles: {},
    releaseVersion: null,
    generatedAt: null,
    renderingPath: 'native_swe_star_tiles',
    sourceCatalogs: {},
    sourceAttribution: [],
    starCount: 0,
    tileCount: 0,
    magnitudeLimit: null,
    tileOrder: null,
    labelMode: 'suppressed',
    error: null
  };
}

function createOrasDenseStarsManager() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var root = String(options.root || ORAS_DENSE_STARS_ROOT).replace(/\/$/, '');
  var fetchImpl = options.fetchImpl || (typeof window !== 'undefined' && typeof window.fetch === 'function' ? window.fetch.bind(window) : undefined);
  var snapshot = oras_dense_stars_emptySnapshot();
  var loadingPromise;
  var listeners = new Set();

  function publish(nextSnapshot) {
    snapshot = Object.assign({}, nextSnapshot, {
      sourceCatalogs: Object.assign({}, nextSnapshot.sourceCatalogs || {}),
      sourceAttribution: (nextSnapshot.sourceAttribution || []).map(function (source) {
        return Object.assign({}, source);
      }),
      profiles: Object.assign({}, nextSnapshot.profiles || {})
    });
    listeners.forEach(function (listener) {
      return listener(getSnapshot());
    });
    return getSnapshot();
  }

  function getSnapshot() {
    return Object.assign({}, snapshot, {
      sourceCatalogs: Object.assign({}, snapshot.sourceCatalogs || {}),
      sourceAttribution: (snapshot.sourceAttribution || []).map(function (source) {
        return Object.assign({}, source);
      }),
      profiles: Object.assign({}, snapshot.profiles || {})
    });
  }

  function load() {
    return _load.apply(this, arguments);
  }

  function _load() {
    _load = Object(asyncToGenerator["a" /* default */])( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              if (!loadingPromise) {
                _context.next = 2;
                break;
              }

              return _context.abrupt("return", loadingPromise);

            case 2:
              loadingPromise = loadRelease().finally(function () {
                loadingPromise = undefined;
              });
              return _context.abrupt("return", loadingPromise);

            case 4:
            case "end":
              return _context.stop();
          }
        }
      }, _callee);
    }));
    return _load.apply(this, arguments);
  }

  function loadRelease() {
    return _loadRelease.apply(this, arguments);
  }

  function _loadRelease() {
    _loadRelease = Object(asyncToGenerator["a" /* default */])( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
      var response, manifest, profiles, activeProfile, profile;
      return regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              publish(Object.assign(oras_dense_stars_emptySnapshot('loading'), {
                mounted: snapshot.mounted,
                activeProfile: snapshot.activeProfile
              }));

              if (!(typeof fetchImpl !== 'function')) {
                _context2.next = 3;
                break;
              }

              return _context2.abrupt("return", publish(oras_dense_stars_emptySnapshot('not-mounted')));

            case 3:
              _context2.prev = 3;
              _context2.next = 6;
              return fetchImpl(root + '/manifest.json', {
                cache: 'no-store'
              });

            case 6:
              response = _context2.sent;
              _context2.next = 12;
              break;

            case 9:
              _context2.prev = 9;
              _context2.t0 = _context2["catch"](3);
              return _context2.abrupt("return", publish(oras_dense_stars_emptySnapshot('not-mounted')));

            case 12:
              if (!(!response || !response.ok)) {
                _context2.next = 14;
                break;
              }

              return _context2.abrupt("return", publish(oras_dense_stars_emptySnapshot('not-mounted')));

            case 14:
              _context2.prev = 14;
              _context2.t1 = JSON;
              _context2.next = 18;
              return response.text();

            case 18:
              _context2.t2 = _context2.sent;
              manifest = _context2.t1.parse.call(_context2.t1, _context2.t2);
              oras_dense_stars_validateManifest(manifest);
              profiles = Object.assign({}, manifest.profiles || {});
              activeProfile = resolveActiveProfile(snapshot.activeProfile, profiles);
              profile = profiles[activeProfile];
              return _context2.abrupt("return", publish({
                phase: activeProfile === OFF_PROFILE ? 'off' : 'loaded',
                mounted: true,
                activeProfile: activeProfile,
                defaultProfile: String(manifest.default_profile || DEFAULT_PROFILE),
                profile: profile ? Object.assign({}, profile) : undefined,
                profiles: profiles,
                releaseVersion: String(manifest.release_version),
                generatedAt: manifest.generated_at || null,
                renderingPath: 'native_swe_star_tiles',
                sourceCatalogs: Object.assign({}, profile && profile.source_catalogs || manifest.source_catalogs || {}),
                sourceAttribution: Array.isArray(manifest.source_attribution) ? manifest.source_attribution.map(function (source) {
                  return Object.assign({}, source);
                }) : [],
                starCount: Number(profile && profile.star_count) || 0,
                tileCount: Number(profile && profile.tile_count) || 0,
                magnitudeLimit: Number(profile && profile.magnitude_limit),
                tileOrder: Number(profile && profile.tile_order),
                labelMode: String(profile && profile.label_mode || 'suppressed'),
                error: null
              }));

            case 27:
              _context2.prev = 27;
              _context2.t3 = _context2["catch"](14);
              return _context2.abrupt("return", publish(Object.assign(oras_dense_stars_emptySnapshot('failed'), {
                mounted: true,
                error: _context2.t3.message
              })));

            case 30:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2, null, [[3, 9], [14, 27]]);
    }));
    return _loadRelease.apply(this, arguments);
  }

  function setProfile(profile) {
    var activeProfile = normalizeProfile(profile);
    persistDenseStarsProfile(activeProfile);
    var profiles = snapshot.profiles || {};
    var selectedProfile = profiles[activeProfile];
    publish(Object.assign(getSnapshot(), {
      activeProfile: activeProfile,
      profile: selectedProfile ? Object.assign({}, selectedProfile) : undefined,
      phase: activeProfile === OFF_PROFILE ? 'off' : snapshot.mounted ? 'loaded' : snapshot.phase,
      starCount: Number(selectedProfile && selectedProfile.star_count) || 0,
      tileCount: Number(selectedProfile && selectedProfile.tile_count) || 0,
      magnitudeLimit: Number(selectedProfile && selectedProfile.magnitude_limit),
      tileOrder: Number(selectedProfile && selectedProfile.tile_order),
      labelMode: String(selectedProfile && selectedProfile.label_mode || 'suppressed')
    }));
  }

  function getSurveyRoot() {
    var profile = snapshot.profile;
    return profile && profile.path ? root + '/' + String(profile.path).replace(/^\/+/, '') : root;
  }

  function getSurveyKey() {
    return 'oras-dense-stars-' + snapshot.activeProfile;
  }

  function isReadyForNativeRegistration() {
    return snapshot.phase === 'loaded' && snapshot.mounted && snapshot.activeProfile !== OFF_PROFILE && !!snapshot.profile && snapshot.renderingPath === 'native_swe_star_tiles';
  }

  function subscribe(listener) {
    listeners.add(listener);
    listener(getSnapshot());
    return function () {
      return listeners.delete(listener);
    };
  }

  return {
    getSnapshot: getSnapshot,
    getSurveyKey: getSurveyKey,
    getSurveyRoot: getSurveyRoot,
    isReadyForNativeRegistration: isReadyForNativeRegistration,
    load: load,
    setProfile: setProfile,
    subscribe: subscribe
  };
}

function resolveActiveProfile(profile, profiles) {
  var value = normalizeProfile(profile);
  if (value === OFF_PROFILE) return OFF_PROFILE;
  if (profiles[value]) return value;
  if (profiles[DEFAULT_PROFILE]) return DEFAULT_PROFILE;
  return Object.keys(profiles)[0] || OFF_PROFILE;
}

function oras_dense_stars_validateManifest(manifest) {
  if (!manifest || manifest.schema_version !== 1) throw new Error('unsupported dense star manifest schema');
  if (manifest.rendering_path !== 'native_swe_star_tiles') throw new Error('unsupported dense star rendering path');
  if (manifest.source_id_type !== 'string') throw new Error('dense star source IDs must remain strings');
  if (manifest.default_profile !== DEFAULT_PROFILE) throw new Error('dense star default profile must be visual-default');
  if (!manifest.profiles || Object(esm_typeof["a" /* default */])(manifest.profiles) !== 'object') throw new Error('dense star profiles are required');

  for (var _i = 0, _Object$entries = Object.entries(manifest.profiles); _i < _Object$entries.length; _i++) {
    var _Object$entries$_i = Object(slicedToArray["a" /* default */])(_Object$entries[_i], 2),
        profileId = _Object$entries$_i[0],
        profile = _Object$entries$_i[1];

    if (!profile || !profile.path) throw new Error('dense star profile path is required: ' + profileId);
    if (profile.label_mode !== 'suppressed') throw new Error('dense star profile labels must be suppressed: ' + profileId);
    if (!Number.isFinite(Number(profile.star_count)) || Number(profile.star_count) < 1) throw new Error('dense star profile count must be positive: ' + profileId);
    if (!Number.isFinite(Number(profile.tile_count)) || Number(profile.tile_count) < 1) throw new Error('dense star profile tile count must be positive: ' + profileId);
  }
}

var orasDenseStars = createOrasDenseStarsManager();
// CONCATENATED MODULE: ./node_modules/cache-loader/dist/cjs.js??ref--13-0!./node_modules/thread-loader/dist/cjs.js!./node_modules/babel-loader/lib!./node_modules/cache-loader/dist/cjs.js??ref--1-0!./node_modules/vue-loader/lib??vue-loader-options!./src/components/oras-dense-stars-status-dialog.vue?vue&type=script&lang=js&







//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//

/* harmony default export */ var oras_dense_stars_status_dialogvue_type_script_lang_js_ = ({
  name: 'OrasDenseStarsStatusDialog',
  props: {
    value: {
      type: Boolean,
      default: false
    }
  },
  data: function data() {
    return {
      snapshot: orasDenseStars.getSnapshot(),
      unsubscribe: undefined
    };
  },
  computed: {
    statusLabel: function statusLabel() {
      return this.snapshot.phase.replace('-', ' ');
    },
    statusColor: function statusColor() {
      if (this.snapshot.phase === 'loaded') return 'green';
      if (this.snapshot.phase === 'failed' || this.snapshot.phase === 'degraded') return 'orange';
      if (this.snapshot.phase === 'off') return 'blue-grey';
      return 'blue-grey';
    },
    sourceCatalogSummary: function sourceCatalogSummary() {
      var entries = Object.entries(this.snapshot.sourceCatalogs || {});
      return entries.length ? entries.map(function (_ref) {
        var _ref2 = Object(slicedToArray["a" /* default */])(_ref, 2),
            name = _ref2[0],
            count = _ref2[1];

        return name + ': ' + Number(count).toLocaleString();
      }).join(', ') : 'Unavailable';
    }
  },
  created: function created() {
    var _this = this;

    this.unsubscribe = orasDenseStars.subscribe(function (snapshot) {
      _this.snapshot = snapshot;
    });
  },
  beforeDestroy: function beforeDestroy() {
    if (this.unsubscribe) this.unsubscribe();
  },
  methods: {
    refresh: function refresh() {
      orasDenseStars.load();
    }
  }
});
// CONCATENATED MODULE: ./src/components/oras-dense-stars-status-dialog.vue?vue&type=script&lang=js&
 /* harmony default export */ var components_oras_dense_stars_status_dialogvue_type_script_lang_js_ = (oras_dense_stars_status_dialogvue_type_script_lang_js_); 
// EXTERNAL MODULE: ./src/components/oras-dense-stars-status-dialog.vue?vue&type=style&index=0&id=0e713f36&scoped=true&lang=css&
var oras_dense_stars_status_dialogvue_type_style_index_0_id_0e713f36_scoped_true_lang_css_ = __webpack_require__("e4c8");

// CONCATENATED MODULE: ./src/components/oras-dense-stars-status-dialog.vue






/* normalize component */

var oras_dense_stars_status_dialog_component = Object(componentNormalizer["a" /* default */])(
  components_oras_dense_stars_status_dialogvue_type_script_lang_js_,
  oras_dense_stars_status_dialogvue_type_template_id_0e713f36_scoped_true_render,
  oras_dense_stars_status_dialogvue_type_template_id_0e713f36_scoped_true_staticRenderFns,
  false,
  null,
  "0e713f36",
  null
  
)

/* harmony default export */ var oras_dense_stars_status_dialog = (oras_dense_stars_status_dialog_component.exports);

/* vuetify-loader */












installComponents_default()(oras_dense_stars_status_dialog_component, {VAlert: VAlert["a" /* default */],VBtn: VBtn["a" /* default */],VCard: VCard["a" /* default */],VCardActions: components_VCard["a" /* VCardActions */],VCardSubtitle: components_VCard["b" /* VCardSubtitle */],VCardText: components_VCard["c" /* VCardText */],VCardTitle: components_VCard["d" /* VCardTitle */],VChip: VChip["a" /* default */],VDialog: VDialog["a" /* default */],VSimpleTable: VSimpleTable["a" /* default */],VSpacer: VSpacer["a" /* default */]})

// CONCATENATED MODULE: ./node_modules/cache-loader/dist/cjs.js??ref--13-0!./node_modules/thread-loader/dist/cjs.js!./node_modules/babel-loader/lib!./node_modules/cache-loader/dist/cjs.js??ref--1-0!./node_modules/vue-loader/lib??vue-loader-options!./src/App.vue?vue&type=script&lang=js&













//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//










/* harmony default export */ var Appvue_type_script_lang_js_ = ({
  data: function data(context) {
    return {
      menuItems: [{
        title: this.$t('Hub Frontpage'),
        icon: 'mdi-home-variant-outline',
        action: 'hubFrontpage'
      }, {
        title: this.$t('Recheck Runtime'),
        icon: 'mdi-refresh',
        action: 'recheckRuntime'
      }, {
        title: this.$t('Open Standalone Runtime'),
        icon: 'mdi-open-in-new',
        action: 'openStandaloneRuntime'
      }, {
        title: this.$t('ORAS Catalog Packs'),
        icon: 'mdi-database-search',
        action: 'catalogPacks'
      }, {
        title: this.$t('ORAS Dense Stars'),
        icon: 'mdi-star-four-points',
        action: 'denseStars'
      }, {
        title: this.$t('Dense Stars: Off'),
        icon: 'mdi-star-off-outline',
        profile: 'off'
      }, {
        title: this.$t('Dense Stars: Visual Sky'),
        icon: 'mdi-eye-outline',
        profile: 'visual-default'
      }, {
        title: this.$t('Dense Stars: Binocular Depth'),
        icon: 'mdi-binoculars',
        profile: 'binocular'
      }, {
        title: this.$t('Dense Stars: Deep Catalog'),
        icon: 'mdi-telescope',
        profile: 'deep-catalog'
      }, {
        title: this.$t('View Settings'),
        icon: 'mdi-settings',
        store_var_name: 'showViewSettingsDialog',
        store_show_menu_item: 'showViewSettingsMenuItem'
      }, {
        title: this.$t('Planets Tonight'),
        icon: 'mdi-panorama-fisheye',
        store_var_name: 'showPlanetsVisibilityDialog',
        store_show_menu_item: 'showPlanetsVisibilityMenuItem'
      }, {
        divider: true
      }].concat(this.getPluginsMenuItems()).concat([{
        title: this.$t('Data Credits'),
        footer: true,
        icon: 'mdi-copyright',
        store_var_name: 'showDataCreditsDialog'
      }]),
      menuComponents: [].concat(this.getPluginsMenuComponents()),
      guiComponent: 'GuiLoader',
      startTimeIsSet: false,
      initDone: false,
      dataSourceInitDone: false,
      showCatalogPacks: false,
      showDenseStars: false,
      denseStarSurveyRegistered: false,
      orasOverlayObjects: []
    };
  },
  components: {
    Gui: gui,
    GuiLoader: gui_loader,
    OrasCatalogStatusDialog: oras_catalog_status_dialog,
    OrasDenseStarsStatusDialog: oras_dense_stars_status_dialog
  },
  methods: {
    getPluginsMenuItems: function getPluginsMenuItems() {
      var res = [];

      for (var i in this.$stellariumWebPlugins()) {
        var plugin = this.$stellariumWebPlugins()[i];

        if (plugin.menuItems) {
          res = res.concat(plugin.menuItems);
        }
      }

      return res;
    },
    getPluginsMenuComponents: function getPluginsMenuComponents() {
      var res = [];

      for (var i in this.$stellariumWebPlugins()) {
        var plugin = this.$stellariumWebPlugins()[i];

        if (plugin.menuComponents) {
          res = res.concat(plugin.menuComponents);
        }
      }

      return res;
    },
    toggleStoreValue: function toggleStoreValue(storeVarName) {
      this.$store.commit('toggleBool', storeVarName);
    },
    handleMenuItemClick: function handleMenuItemClick(item) {
      if (item.action === 'hubFrontpage') {
        this.navigateHubFrontpage();
        return;
      }

      if (item.action === 'recheckRuntime') {
        this.recheckRuntime();
        return;
      }

      if (item.action === 'openStandaloneRuntime') {
        this.openStandaloneRuntime();
        return;
      }

      if (item.action === 'catalogPacks') {
        this.closeNavigationDrawer();
        this.showCatalogPacks = true;
        return;
      }

      if (item.action === 'denseStars') {
        this.closeNavigationDrawer();
        this.showDenseStars = true;
        return;
      }

      if (item.profile) {
        this.closeNavigationDrawer();
        orasDenseStars.setProfile(item.profile);
        this.$store.commit('setValue', {
          varName: 'orasDenseStarsProfile',
          newValue: item.profile
        });
        window.location.reload();
        return;
      }

      if (item.store_var_name) {
        this.toggleStoreValue(item.store_var_name);
      }
    },
    registerOrasDenseStarSurvey: function registerOrasDenseStarSurvey(core) {
      var _this = this;

      if (this.denseStarSurveyRegistered || this.$store.state.orasDenseStarsProfile === 'off') {
        return;
      }

      orasDenseStars.setProfile(this.$store.state.orasDenseStarsProfile);
      orasDenseStars.load().then(function () {
        if (!orasDenseStars.isReadyForNativeRegistration() || _this.denseStarSurveyRegistered) {
          return;
        }

        core.stars.addDataSource({
          url: orasDenseStars.getSurveyRoot(),
          key: orasDenseStars.getSurveyKey()
        });
        _this.denseStarSurveyRegistered = true;
      }, function (error) {
        console.warn('Failed to load ORAS dense star survey', error);
      });
    },
    getStoreValue: function getStoreValue(storeVarName) {
      return lodash_default.a.get(this.$store.state, storeVarName);
    },
    getParentAppOrigin: function getParentAppOrigin() {
      try {
        if (document.referrer) {
          return new URL(document.referrer).origin;
        }
      } catch (error) {
        console.log(error);
      }

      return '*';
    },
    closeNavigationDrawer: function closeNavigationDrawer() {
      if (this.$store.state.showNavigationDrawer) {
        this.$store.commit('toggleBool', 'showNavigationDrawer');
      }
    },
    postRuntimeAction: function postRuntimeAction(action) {
      var parentOrigin = this.getParentAppOrigin();

      try {
        if (window.top && window.top !== window) {
          window.top.postMessage(action, parentOrigin);
          return true;
        }
      } catch (error) {
        console.log(error);
      }

      try {
        if (window.parent && window.parent !== window) {
          window.parent.postMessage(action, parentOrigin);
          return true;
        }
      } catch (error) {
        console.log(error);
      }

      return false;
    },
    navigateHubFrontpage: function navigateHubFrontpage() {
      this.closeNavigationDrawer();
      var hubUrl = '/';

      try {
        if (document.referrer) {
          hubUrl = new URL('/', document.referrer).href;
        }
      } catch (error) {
        console.log(error);
      }

      try {
        if (window.top && window.top !== window) {
          window.top.location.href = hubUrl;
          return;
        }
      } catch (error) {
        console.log(error);
      }

      try {
        if (window.parent && window.parent !== window) {
          window.parent.location.href = hubUrl;
          return;
        }
      } catch (error) {
        console.log(error);
      }

      window.location.href = hubUrl;
    },
    recheckRuntime: function recheckRuntime() {
      this.closeNavigationDrawer();

      if (this.postRuntimeAction('oras-sky-engine:recheck-runtime')) {
        return;
      }

      window.location.reload();
    },
    openStandaloneRuntime: function openStandaloneRuntime() {
      this.closeNavigationDrawer();

      if (this.postRuntimeAction('oras-sky-engine:open-standalone-runtime')) {
        return;
      }

      window.open(window.location.href, '_blank', 'noopener,noreferrer');
    },
    materializeOrasCatalogOverlays: function materializeOrasCatalogOverlays() {
      var _iterator = Object(createForOfIteratorHelper["a" /* default */])(orasCatalogPacks.overlayRecords()),
          _step;

      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var record = _step.value;
          var source = toOrasSkySource(record);
          if (!source || !['star', 'dso'].includes(source.model)) continue;
          if (sw_helpers.skySource2SweObj(source)) continue;
          var obj = this.$stel.createObj(source.model, source);
          if (!obj) continue;
          obj.__orasSkySourceData = source;
          this.$selectionLayer.add(obj);
          this.orasOverlayObjects.push(obj);
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
    },
    setStateFromQueryArgs: function setStateFromQueryArgs() {
      // Check whether the observing panel must be displayed
      this.$store.commit('setValue', {
        varName: 'showSidePanel',
        newValue: this.$route.path.startsWith('/p/')
      }); // Set the core's state from URL query arguments such
      // as date, location, view direction & fov

      var that = this;

      if (!this.initDone) {
        this.$stel.core.time_speed = 1;
        var d = new Date();

        if (this.$route.query.date) {
          d = new moment_default.a(this.$route.query.date).toDate();
          this.$stel.core.observer.utc = d.getMJD();
          this.startTimeIsSet = true;
        }

        if (this.$route.query.lng && this.$route.query.lat) {
          var pos = {
            lat: Number(this.$route.query.lat),
            lng: Number(this.$route.query.lng),
            alt: this.$route.query.elev ? Number(this.$route.query.elev) : 0,
            accuracy: 1
          };
          sw_helpers.geoCodePosition(pos, that).then(function (loc) {
            that.$store.commit('setCurrentLocation', loc);
          }, function (error) {
            console.log(error);
          });
        }

        this.$stel.core.observer.yaw = this.$route.query.az ? Number(this.$route.query.az) * Math.PI / 180 : 0;
        this.$stel.core.observer.pitch = this.$route.query.alt ? Number(this.$route.query.alt) * Math.PI / 180 : 30 * Math.PI / 180;
        this.$stel.core.fov = this.$route.query.fov ? Number(this.$route.query.fov) * Math.PI / 180 : 120 * Math.PI / 180;
        this.initDone = true;
      }

      if (this.$route.path.startsWith('/skysource/')) {
        var name = decodeURIComponent(this.$route.path.substring(11));
        console.log('Will select object: ' + name);
        var routeIdentity = this.skySourceRouteIdentity();

        if (routeIdentity) {
          return this.selectSkySourceRouteTargetByIdentity(routeIdentity);
        }

        return this.selectSkySourceRouteTarget(name);
      }
    },
    skySourceRouteIdentity: function skySourceRouteIdentity() {
      var catalog = typeof this.$route.query.catalog === 'string' ? this.$route.query.catalog.trim() : '';
      var sourceId = typeof this.$route.query.source_id === 'string' ? this.$route.query.source_id.trim() : '';
      var model = typeof this.$route.query.model === 'string' ? this.$route.query.model.trim() : '';
      var ra = this.$route.query.ra == null ? null : Number(this.$route.query.ra);
      var dec = this.$route.query.dec == null ? null : Number(this.$route.query.dec);
      var time = typeof this.$route.query.date === 'string' ? this.$route.query.date.trim() : '';
      var lat = this.$route.query.lat == null ? null : Number(this.$route.query.lat);
      var lng = this.$route.query.lng == null ? null : Number(this.$route.query.lng);
      var elev = this.$route.query.elev == null ? null : Number(this.$route.query.elev);

      if (!catalog || !sourceId || !model) {
        return undefined;
      }

      return {
        catalog: catalog,
        sourceId: sourceId,
        model: model,
        ra: Number.isFinite(ra) ? ra : null,
        dec: Number.isFinite(dec) ? dec : null,
        time: time || null,
        lat: Number.isFinite(lat) ? lat : null,
        lng: Number.isFinite(lng) ? lng : null,
        elev: Number.isFinite(elev) ? elev : null
      };
    },
    selectSkySourceRouteTarget: function selectSkySourceRouteTarget(name) {
      var _this2 = this;

      var attempt = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
      var retryDelayMs = 250;
      var maxAttempts = 80;
      var lookup = attempt === 0 ? sw_helpers.lookupSkySourceByName(name) : Promise.resolve(sw_helpers.lookupSkySourceLocallyByName(name)).then(function (ss) {
        if (ss) {
          return ss;
        }

        throw new Error('Local sky source not found');
      });
      return lookup.then(function (ss) {
        if (!ss) {
          return;
        }

        var obj = sw_helpers.skySource2SweObj(ss);

        if (!obj) {
          obj = _this2.$stel.createObj(ss.model, ss);

          if (obj) {
            _this2.$selectionLayer.add(obj);
          }
        }

        if (!obj) {
          var label = Array.isArray(ss.names) && ss.names.length ? ss.names[0] : ss.display_name || String(ss.source_id || 'unknown');
          console.warn("Can't find object in SWE: " + label);
          return;
        }

        sw_helpers.setSweObjAsSelection(obj);
      }, function (err) {
        if (attempt < maxAttempts) {
          return new Promise(function (resolve) {
            return setTimeout(resolve, retryDelayMs);
          }).then(function () {
            return _this2.selectSkySourceRouteTarget(name, attempt + 1);
          });
        }

        console.log(err);
        console.log("Couldn't find skysource for name: " + name);
      });
    },
    selectSkySourceRouteTargetByIdentity: function selectSkySourceRouteTargetByIdentity(identity) {
      var _this3 = this;

      var attempt = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
      var retryDelayMs = 250;
      var maxAttempts = 80;
      return sw_helpers.fetchOrasSkySourceByIdentity(identity).then(function (ss) {
        ss = withOrasRouteIdentityFallback(ss, identity);

        if (!ss || !sw_helpers.skySourceMatchesIdentity(ss, identity)) {
          throw new Error('Resolved sky source did not match requested identity');
        }

        var obj = sw_helpers.skySource2SweObj(ss);

        if (!obj) {
          var fallbackObj = _this3.$stel.createObj(ss.model, ss);

          if (!fallbackObj) {
            throw new Error('Exact sky source target is not ready yet');
          }

          obj = fallbackObj;

          _this3.$selectionLayer.add(obj);
        }

        obj.__orasSkySourceData = ss;
        sw_helpers.setSweObjAsSelection(obj, ss);
      }, function (err) {
        if (attempt < maxAttempts) {
          return new Promise(function (resolve) {
            return setTimeout(resolve, retryDelayMs);
          }).then(function () {
            return _this3.selectSkySourceRouteTargetByIdentity(identity, attempt + 1);
          });
        }

        var fallback = Object.assign({
          match: identity.sourceId,
          names: [identity.sourceId],
          types: [identity.model === 'dso' ? 'dso' : '*'],
          model: identity.model,
          model_data: identity.model === 'dso' && identity.ra != null && identity.dec != null ? {
            ra: identity.ra,
            de: identity.dec,
            source_id: identity.sourceId
          } : {},
          catalog: identity.catalog,
          source_id: identity.sourceId,
          display_name: identity.sourceId,
          ra: identity.ra,
          dec: identity.dec
        }, {
          ra: identity.ra,
          dec: identity.dec
        });

        var fallbackObj = _this3.$stel.createObj(fallback.model, fallback);

        if (fallbackObj) {
          _this3.$selectionLayer.add(fallbackObj);

          sw_helpers.setSweObjAsSelection(fallbackObj);
          return;
        }

        console.log(err);
        console.log("Couldn't find skysource for identity: " + identity.catalog + ' ' + identity.sourceId);
      });
    }
  },
  computed: {
    nav: {
      get: function get() {
        return this.$store.state.showNavigationDrawer;
      },
      set: function set(v) {
        if (this.$store.state.showNavigationDrawer !== v) {
          this.$store.commit('toggleBool', 'showNavigationDrawer');
        }
      }
    },
    storeCurrentLocation: function storeCurrentLocation() {
      return this.$store.state.currentLocation;
    }
  },
  watch: {
    storeCurrentLocation: function storeCurrentLocation(loc) {
      var DD2R = Math.PI / 180;
      this.$stel.core.observer.latitude = loc.lat * DD2R;
      this.$stel.core.observer.longitude = loc.lng * DD2R;
      this.$stel.core.observer.elevation = loc.alt; // At startup, we need to wait for the location to be set before deciding which
      // startup time to set so that it's night time.

      if (!this.startTimeIsSet) {
        this.$stel.core.observer.utc = sw_helpers.getTimeAfterSunset(this.$stel);
        this.startTimeIsSet = true;
      } // Init of time and date is complete


      this.$store.commit('setValue', {
        varName: 'initComplete',
        newValue: true
      });
    },
    $route: function $route() {
      // react to route changes...
      this.setStateFromQueryArgs();
    }
  },
  mounted: function mounted() {
    var that = this;
    orasCatalogPacks.load().catch(function (error) {
      console.warn('Failed to load ORAS catalog packs', error);
    });
    orasDenseStars.load().catch(function (error) {
      console.warn('Failed to load ORAS dense stars', error);
    });

    for (var i in this.$stellariumWebPlugins()) {
      var plugin = this.$stellariumWebPlugins()[i];

      if (plugin.onAppMounted) {
        plugin.onAppMounted(that);
      }
    }

    __webpack_require__.e(/* import() */ "chunk-2d2253ec").then(__webpack_require__.t.bind(null, "e429", 7)).then(function (f) {
      // Initialize the StelWebEngine viewer singleton
      // After this call, the StelWebEngine state will always be available in vuex store
      // in the $store.stel object in a reactive way (useful for vue components).
      // To modify the state of the StelWebEngine, it's enough to call/set values directly on the $stel object
      try {
        sw_helpers.initStelWebEngine(that.$store, f.default, that.$refs.stelCanvas, function () {
          // Start auto location detection (even if we don't use it)
          sw_helpers.getGeolocation().then(function (p) {
            return sw_helpers.geoCodePosition(p, that);
          }).then(function (loc) {
            that.$store.commit('setAutoDetectedLocation', loc);
          }, function (error) {
            console.log(error);
          });
          that.$stel.setFont('regular', "/oras-sky-engine/" + 'fonts/Roboto-Regular.ttf', 1.38);
          that.$stel.setFont('bold', "/oras-sky-engine/" + 'fonts/Roboto-Bold.ttf', 1.38);
          that.$stel.core.constellations.show_only_pointed = false;
          that.setStateFromQueryArgs();
          that.guiComponent = 'Gui';

          for (var _i in that.$stellariumWebPlugins()) {
            var _plugin = that.$stellariumWebPlugins()[_i];

            if (_plugin.onEngineReady) {
              _plugin.onEngineReady(that);
            }
          }

          if (!that.dataSourceInitDone) {
            // Set all default data sources
            var core = that.$stel.core;
            var bundledDataBase = "/oras-sky-engine/" + 'skydata'; // Match Stellarium-Web DSO behavior with bounded packs only:
            // keep legacy root /dso disabled and load base + extended packs.

            core.dsos.addDataSource({
              url: bundledDataBase + '/packs/base/dso'
            });
            core.dsos.addDataSource({
              url: bundledDataBase + '/packs/extended/dso'
            });
            listOrasPackRoots().forEach(function (packRoot) {
              core.stars.addDataSource({
                url: packRoot + '/stars'
              });
            });
            that.registerOrasDenseStarSurvey(core);
            core.stars.addDataSource({
              url: ORAS_BUNDLED_GAIA_SURVEY_ROOT,
              key: 'gaia'
            }); // Allow to specify a custom path for sky culture data

            if (that.$route.query.sc) {
              var key = that.$route.query.sc.substring(that.$route.query.sc.lastIndexOf('/') + 1);
              core.skycultures.addDataSource({
                url: that.$route.query.sc,
                key: key
              });
              core.skycultures.current_id = key;
            } else {
              core.skycultures.addDataSource({
                url: "/oras-sky-engine/" + 'skydata/skycultures/western',
                key: 'western'
              });
            }

            resolveOrasDssSurveyUrl(that.$route.query.hips).then(function (dssSurveyUrl) {
              if (dssSurveyUrl) {
                core.dss.addDataSource({
                  url: dssSurveyUrl
                });
              }
            }, function (error) {
              console.warn('Failed to resolve ORAS DSS survey source', error);
            });
            core.landscapes.addDataSource({
              url: bundledDataBase + '/landscapes/guereins',
              key: 'guereins'
            });
            core.milkyway.addDataSource({
              url: bundledDataBase + '/surveys/milkyway'
            });
            core.minor_planets.addDataSource({
              url: bundledDataBase + '/mpcorb.dat',
              key: 'mpc_asteroids'
            });
            var localPlanetSurveyBase = bundledDataBase + '/surveys/sso';
            var planetSurveySources = [['moon', localPlanetSurveyBase + '/moon'], ['sun', localPlanetSurveyBase + '/sun'], ['mercury', localPlanetSurveyBase + '/mercury'], ['venus', localPlanetSurveyBase + '/venus'], ['mars', localPlanetSurveyBase + '/mars'], ['jupiter', localPlanetSurveyBase + '/jupiter'], ['saturn', localPlanetSurveyBase + '/saturn'], ['uranus', localPlanetSurveyBase + '/uranus'], ['neptune', localPlanetSurveyBase + '/neptune']];
            planetSurveySources.forEach(function (_ref) {
              var _ref2 = Object(slicedToArray["a" /* default */])(_ref, 2),
                  key = _ref2[0],
                  url = _ref2[1];

              return core.planets.addDataSource({
                url: url,
                key: key
              });
            });
            core.comets.addDataSource({
              url: bundledDataBase + '/CometEls.txt',
              key: 'mpc_comets'
            });
            core.satellites.addDataSource({
              url: bundledDataBase + '/tle_satellite.jsonl.gz',
              key: 'jsonl/sat'
            });
            core.satellites.hints_mag_offset = 2;
            that.dataSourceInitDone = true;
            orasCatalogPacks.load().then(function () {
              return that.materializeOrasCatalogOverlays();
            }).catch(function (error) {
              console.warn('Failed to materialize ORAS catalog overlays', error);
            });
          }
        });
      } catch (e) {
        console.error(e);
        that.$store.commit('setValue', {
          varName: 'wasmSupport',
          newValue: false
        });
      }
    }).catch(function (error) {
      console.error(error);
      that.$store.commit('setValue', {
        varName: 'wasmSupport',
        newValue: false
      });
    });
  }
});
// CONCATENATED MODULE: ./src/App.vue?vue&type=script&lang=js&
 /* harmony default export */ var src_Appvue_type_script_lang_js_ = (Appvue_type_script_lang_js_); 
// EXTERNAL MODULE: ./src/App.vue?vue&type=style&index=0&lang=css&
var Appvue_type_style_index_0_lang_css_ = __webpack_require__("034f");

// EXTERNAL MODULE: ./node_modules/vuetify/lib/components/VApp/VApp.js
var VApp = __webpack_require__("7496");

// EXTERNAL MODULE: ./node_modules/vuetify/lib/components/VDivider/VDivider.js
var VDivider = __webpack_require__("ce7e");

// EXTERNAL MODULE: ./node_modules/vuetify/lib/components/VMain/VMain.js
var VMain = __webpack_require__("f6c4");

// EXTERNAL MODULE: ./node_modules/vuetify/lib/components/VNavigationDrawer/VNavigationDrawer.js + 2 modules
var VNavigationDrawer = __webpack_require__("f774");

// CONCATENATED MODULE: ./src/App.vue






/* normalize component */

var App_component = Object(componentNormalizer["a" /* default */])(
  src_Appvue_type_script_lang_js_,
  render,
  staticRenderFns,
  false,
  null,
  null,
  null
  
)

/* harmony default export */ var App = (App_component.exports);

/* vuetify-loader */

















installComponents_default()(App_component, {VApp: VApp["a" /* default */],VContainer: VContainer["a" /* default */],VDivider: VDivider["a" /* default */],VIcon: VIcon["a" /* default */],VLayout: VLayout["a" /* default */],VList: VList["a" /* default */],VListItem: VListItem["a" /* default */],VListItemAction: VListItemAction["a" /* default */],VListItemContent: components_VList["a" /* VListItemContent */],VListItemIcon: VListItemIcon["a" /* default */],VListItemTitle: components_VList["c" /* VListItemTitle */],VMain: VMain["a" /* default */],VNavigationDrawer: VNavigationDrawer["a" /* default */],VSpacer: VSpacer["a" /* default */],VSubheader: VSubheader["a" /* default */],VSwitch: VSwitch["a" /* default */]})

// EXTERNAL MODULE: ./node_modules/@mdi/font/css/materialdesignicons.css
var materialdesignicons = __webpack_require__("5363");

// EXTERNAL MODULE: ./node_modules/vuetify/lib/framework.js + 18 modules
var framework = __webpack_require__("f309");

// CONCATENATED MODULE: ./src/plugins/vuetify.js



vue_esm["a" /* default */].use(framework["a" /* default */]);
/* harmony default export */ var vuetify = (new framework["a" /* default */]({
  theme: {
    dark: true
  }
}));
// EXTERNAL MODULE: ./node_modules/roboto-fontface/css/roboto/roboto-fontface.css
var roboto_fontface = __webpack_require__("d5e8");

// EXTERNAL MODULE: ./node_modules/@babel/runtime/helpers/esm/objectSpread2.js + 1 modules
var objectSpread2 = __webpack_require__("5530");

// EXTERNAL MODULE: ./node_modules/vuex/dist/vuex.esm.js
var vuex_esm = __webpack_require__("2f62");

// CONCATENATED MODULE: ./src/store/index.js


// Stellarium Web - Copyright (c) 2022 - Stellarium Labs SRL
//
// This program is licensed under the terms of the GNU AGPL v3, or
// alternatively under a commercial licence.
//
// The terms of the AGPL v3 license can be found in the main directory of this
// repository.




vue_esm["a" /* default */].use(vuex_esm["a" /* default */]);

var store_createStore = function createStore() {
  var pluginsModules = {};

  for (var i in vue_esm["a" /* default */].SWPlugins) {
    var plugin = vue_esm["a" /* default */].SWPlugins[i];

    if (plugin.storeModule) {
      console.log('Register store module for plugin: ' + plugin.name);
      pluginsModules[plugin.name] = plugin.storeModule;
    }
  }

  return new vuex_esm["a" /* default */].Store({
    modules: pluginsModules,
    state: {
      stel: null,
      initComplete: false,
      showNavigationDrawer: false,
      showDataCreditsDialog: false,
      showViewSettingsDialog: false,
      showPlanetsVisibilityDialog: false,
      showLocationDialog: false,
      orasDenseStarsProfile: defaultDenseStarsProfile(),
      selectedObject: undefined,
      showSidePanel: false,
      showMainToolBar: true,
      showLocationButton: true,
      showTimeButtons: true,
      showObservingPanelTabsButtons: true,
      showSelectedInfoButtons: true,
      showFPS: false,
      showEquatorialJ2000GridButton: false,
      fullscreen: false,
      nightmode: false,
      wasmSupport: true,
      autoDetectedLocation: {
        short_name: 'Unknown',
        country: 'Unknown',
        street_address: '',
        lat: 0,
        lng: 0,
        alt: 0,
        accuracy: 5000
      },
      currentLocation: {
        short_name: 'Unknown',
        country: 'Unknown',
        street_address: '',
        lat: 0,
        lng: 0,
        alt: 0,
        accuracy: 5000
      },
      useAutoLocation: true
    },
    mutations: {
      replaceStelWebEngine: function replaceStelWebEngine(state, newTree) {
        // mutate StelWebEngine state
        state.stel = newTree;
      },
      toggleBool: function toggleBool(state, varName) {
        lodash_default.a.set(state, varName, !lodash_default.a.get(state, varName));
      },
      setValue: function setValue(state, _ref) {
        var varName = _ref.varName,
            newValue = _ref.newValue;

        lodash_default.a.set(state, varName, newValue);
      },
      setAutoDetectedLocation: function setAutoDetectedLocation(state, newValue) {
        state.autoDetectedLocation = Object(objectSpread2["a" /* default */])({}, newValue);

        if (state.useAutoLocation) {
          state.currentLocation = Object(objectSpread2["a" /* default */])({}, newValue);
        }
      },
      setUseAutoLocation: function setUseAutoLocation(state, newValue) {
        state.useAutoLocation = newValue;

        if (newValue) {
          state.currentLocation = Object(objectSpread2["a" /* default */])({}, state.autoDetectedLocation);
        }
      },
      setCurrentLocation: function setCurrentLocation(state, newValue) {
        state.useAutoLocation = false;
        state.currentLocation = Object(objectSpread2["a" /* default */])({}, newValue);
      },
      setSelectedObject: function setSelectedObject(state, newValue) {
        state.selectedObject = newValue;
      }
    }
  });
};

/* harmony default export */ var src_store = (store_createStore);
// EXTERNAL MODULE: ./node_modules/vue-router/dist/vue-router.esm.js
var vue_router_esm = __webpack_require__("8c4f");

// EXTERNAL MODULE: ./node_modules/vue-fullscreen/dist/vue-fullscreen.min.js
var vue_fullscreen_min = __webpack_require__("03cd");
var vue_fullscreen_min_default = /*#__PURE__*/__webpack_require__.n(vue_fullscreen_min);

// EXTERNAL MODULE: ./node_modules/vue-cookie/src/vue-cookie.js
var vue_cookie = __webpack_require__("00e7");
var vue_cookie_default = /*#__PURE__*/__webpack_require__.n(vue_cookie);

// EXTERNAL MODULE: ./node_modules/leaflet/dist/leaflet-src.js
var leaflet_src = __webpack_require__("e11e");

// EXTERNAL MODULE: ./node_modules/leaflet/dist/leaflet.css
var leaflet = __webpack_require__("6cc5");

// EXTERNAL MODULE: ./node_modules/vue-i18n/dist/vue-i18n.esm.js
var vue_i18n_esm = __webpack_require__("a925");

// CONCATENATED MODULE: ./src/main.js










// Stellarium Web - Copyright (c) 2022 - Stellarium Labs SRL
//
// This program is licensed under the terms of the GNU AGPL v3, or
// alternatively under a commercial licence.
//
// The terms of the AGPL v3 license can be found in the main directory of this
// repository.
// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.














vue_esm["a" /* default */].config.productionTip = false; // this part resolve an issue where the markers would not appear

delete leaflet_src["Icon"].Default.prototype._getIconUrl;
leaflet_src["Icon"].Default.mergeOptions({
  iconRetinaUrl: __webpack_require__("584d"),
  iconUrl: __webpack_require__("6397"),
  shadowUrl: __webpack_require__("e2b9")
});
vue_esm["a" /* default */].use(vue_cookie_default.a);
vue_esm["a" /* default */].use(vue_fullscreen_min_default.a);
vue_esm["a" /* default */].use(vue_i18n_esm["a" /* default */]); // Load all plugins JS modules found in the plugins directory

var plugins = [];

var ctx = __webpack_require__("7d49");

for (var main_i in ctx.keys()) {
  var main_key = ctx.keys()[main_i];
  console.log('Loading plugin: ' + main_key);
  var mod = ctx(main_key);
  plugins.push(mod.default);
}

vue_esm["a" /* default */].SWPlugins = plugins; // Loads all GUI translations found in the src/locales/ directory

var messages = {};

var guiLocales = __webpack_require__("49f8");

guiLocales.keys().forEach(function (key) {
  var matched = key.match(/([A-Za-z0-9-_]+)\./i);

  if (matched && matched.length > 1) {
    var locale = matched[1];
    messages[locale] = guiLocales(key);
  }
}); // Loads all GUI translations found in the src/plugins/xxx/locales directories

var pluginsLocales = __webpack_require__("1640");

pluginsLocales.keys().forEach(function (key) {
  var matched = key.match(/\.\/\w+\/locales\/([A-Za-z0-9-_]+)\.json/i);

  if (matched && matched.length > 1) {
    var locale = matched[1];

    if (messages[locale] === undefined) {
      messages[locale] = pluginsLocales(key);
    } else {
      lodash_default.a.merge(messages[locale], pluginsLocales(key));
    }
  }
});
var main_loc = 'en'; // Un-comment to select user's language automatically
// loc = (navigator.language || navigator.userLanguage).split('-')[0] || 'en'

moment_default.a.locale(main_loc);
var i18n = new vue_i18n_esm["a" /* default */]({
  locale: main_loc,
  messages: messages,
  formatFallbackMessages: true,
  fallbackLocale: 'en',
  silentTranslationWarn: true
}); // Setup routes for the app

vue_esm["a" /* default */].use(vue_router_esm["a" /* default */]); // Base routes

var routes = [{
  // The main page
  path: '/',
  name: 'App',
  component: App,
  children: []
}, {
  // Main page, but centered on the passed sky source name
  path: '/skysource/:name',
  component: App,
  alias: '/'
}]; // Routes exposed by plugins

var defaultObservingRoute = {
  path: '/p/calendar',
  meta: {
    prio: 2
  }
};

for (var src_main_i in vue_esm["a" /* default */].SWPlugins) {
  var main_plugin = vue_esm["a" /* default */].SWPlugins[src_main_i];

  if (main_plugin.routes) {
    routes = routes.concat(main_plugin.routes);
  }

  if (main_plugin.panelRoutes) {
    routes[0].children = routes[0].children.concat(main_plugin.panelRoutes);

    for (var main_j in main_plugin.panelRoutes) {
      var r = main_plugin.panelRoutes[main_j];

      if (r.meta && r.meta.prio && r.meta.prio < defaultObservingRoute.meta.prio) {
        defaultObservingRoute = r;
      }
    }
  }

  if (main_plugin.vuePlugin) {
    vue_esm["a" /* default */].use(main_plugin.vuePlugin);
  }
}

routes[0].children.push({
  path: '/p',
  redirect: defaultObservingRoute.path
});
var router = new vue_router_esm["a" /* default */]({
  mode: 'history',
  base: "/oras-sky-engine/" || false,
  routes: routes
}); // Expose plugins singleton to all Vue instances

vue_esm["a" /* default */].prototype.$stellariumWebPlugins = function () {
  return vue_esm["a" /* default */].SWPlugins;
};
/* eslint-disable no-new */


new vue_esm["a" /* default */]({
  router: router,
  store: src_store,
  i18n: i18n,
  vuetify: vuetify
}).$mount('#app');

/***/ }),

/***/ "5a9f":
/***/ (function(module, exports, __webpack_require__) {

// extracted by mini-css-extract-plugin

/***/ }),

/***/ "5ae2":
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__.p + "img/btn-nebulae.923eae18.svg";

/***/ }),

/***/ "602b":
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__.p + "img/fullscreen.ddcd813e.svg";

/***/ }),

/***/ "6142":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var _node_modules_mini_css_extract_plugin_dist_loader_js_ref_7_oneOf_1_0_node_modules_css_loader_dist_cjs_js_ref_7_oneOf_1_1_node_modules_vue_loader_lib_loaders_stylePostLoader_js_node_modules_postcss_loader_src_index_js_ref_7_oneOf_1_2_node_modules_cache_loader_dist_cjs_js_ref_1_0_node_modules_vue_loader_lib_index_js_vue_loader_options_data_credits_dialog_vue_vue_type_style_index_0_lang_css___WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("0bbb");
/* harmony import */ var _node_modules_mini_css_extract_plugin_dist_loader_js_ref_7_oneOf_1_0_node_modules_css_loader_dist_cjs_js_ref_7_oneOf_1_1_node_modules_vue_loader_lib_loaders_stylePostLoader_js_node_modules_postcss_loader_src_index_js_ref_7_oneOf_1_2_node_modules_cache_loader_dist_cjs_js_ref_1_0_node_modules_vue_loader_lib_index_js_vue_loader_options_data_credits_dialog_vue_vue_type_style_index_0_lang_css___WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_mini_css_extract_plugin_dist_loader_js_ref_7_oneOf_1_0_node_modules_css_loader_dist_cjs_js_ref_7_oneOf_1_1_node_modules_vue_loader_lib_loaders_stylePostLoader_js_node_modules_postcss_loader_src_index_js_ref_7_oneOf_1_2_node_modules_cache_loader_dist_cjs_js_ref_1_0_node_modules_vue_loader_lib_index_js_vue_loader_options_data_credits_dialog_vue_vue_type_style_index_0_lang_css___WEBPACK_IMPORTED_MODULE_0__);
/* unused harmony reexport * */


/***/ }),

/***/ "6806":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var _node_modules_mini_css_extract_plugin_dist_loader_js_ref_7_oneOf_1_0_node_modules_css_loader_dist_cjs_js_ref_7_oneOf_1_1_node_modules_vue_loader_lib_loaders_stylePostLoader_js_node_modules_postcss_loader_src_index_js_ref_7_oneOf_1_2_node_modules_cache_loader_dist_cjs_js_ref_1_0_node_modules_vue_loader_lib_index_js_vue_loader_options_observing_panel_vue_vue_type_style_index_0_lang_css___WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("3617");
/* harmony import */ var _node_modules_mini_css_extract_plugin_dist_loader_js_ref_7_oneOf_1_0_node_modules_css_loader_dist_cjs_js_ref_7_oneOf_1_1_node_modules_vue_loader_lib_loaders_stylePostLoader_js_node_modules_postcss_loader_src_index_js_ref_7_oneOf_1_2_node_modules_cache_loader_dist_cjs_js_ref_1_0_node_modules_vue_loader_lib_index_js_vue_loader_options_observing_panel_vue_vue_type_style_index_0_lang_css___WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_mini_css_extract_plugin_dist_loader_js_ref_7_oneOf_1_0_node_modules_css_loader_dist_cjs_js_ref_7_oneOf_1_1_node_modules_vue_loader_lib_loaders_stylePostLoader_js_node_modules_postcss_loader_src_index_js_ref_7_oneOf_1_2_node_modules_cache_loader_dist_cjs_js_ref_1_0_node_modules_vue_loader_lib_index_js_vue_loader_options_observing_panel_vue_vue_type_style_index_0_lang_css___WEBPACK_IMPORTED_MODULE_0__);
/* unused harmony reexport * */


/***/ }),

/***/ "6ce2":
/***/ (function(module) {

module.exports = JSON.parse("{\"View Settings\":\"Einstellungen anzeigen\",\"Planets Tonight\":\"Planeten heute Abend\",\"Data Credits\":\"Datenquellen\",\"Search...\":\"Suchen...\",\"Observe\":\"Beobachten\",\"Constellations\":\"Sternbilder\",\"Constellations Art\":\"Sternbildfiguren\",\"Atmosphere\":\"Atmosphäre\",\"Landscape\":\"Landschaft\",\"Azimuthal Grid\":\"Azimutales Gitter\",\"Equatorial Grid\":\"Äquatoriales Gitter\",\"Deep Sky Objects\":\"Deep-Sky-Objekte\",\"Night Mode\":\"Nachtmodus\",\"Fullscreen\":\"Vollbild\",\"Loading {0}, the online Star Map\":\"Lade {0}, die Online-Sternkarte\",\"Could not show the Online Star Map\":\"Die Online-Sternkarte konnte nicht angezeigt werden\",\"It seems that your browser cannot load Web Assembly!\":\"Es scheint, dass Ihr Browser WebAssembly nicht laden kann!\",\"Web assembly is necessary for ORAS Sky-Engine to display the star map. Please upgrade your web browser and try again!\":\"WebAssembly ist notwendig, damit ORAS Sky-Engine die Sternkarte anzeigen kann. Bitte aktualisieren Sie Ihren Webbrowser und versuchen Sie es erneut!\",\"desktop version\":\"Desktop-Version\",\"In the meantime, you can try the {0}!\":\"In der Zwischenzeit können Sie {0} ausprobieren!\",\"Use Autolocation\":\"Standort automatisch ermitteln\",\"My Locations\":\"Meine Standorte\",\"Use this location\":\"Diesen Standort verwenden\",\"Unknown Address\":\"Unbekannte Adresse\",\"Lat {0}° Lon {1}°\":\"Lat {0}° Lon {1}°\",\"Unknown\":\"Unbekannt\",\"Near {0}\":\"In der Nähe von {0}\",\"Planets Visibility\":\"Sichtbarkeit der Planeten\",\"Night from {0} to {1}\":\"Nacht von {0} bis {1}\",\"Rise\":\"Aufgang\",\"Set\":\"Untergang\",\"Magnitude\":\"Helligkeit\",\"Distance\":\"Entfernung\",\"Radius\":\"Radius\",\"Spectral Type\":\"Spektraltyp\",\"Size\":\"Größe\",\"Ra/Dec\":\"Ra/Dek\",\"Az/Alt\":\"Az/Alt\",\"Phase\":\"Phase\",\"Not visible tonight\":\"Heute Nacht nicht sichtbar\",\"Always visible tonight\":\"Heute Nacht immer sichtbar\",\"Rise: {0}&nbsp;&nbsp;&nbsp; Set: {1}\":\"Aufgang: {0}&nbsp;&nbsp;&nbsp; Untergang: {1}\",\"Visibility\":\"Sichtbarkeit\",\"View settings\":\"Einstellungen anzeigen\",\"Milky Way\":\"Milchstraße\",\"DSS\":\"DSS\",\"Simulate refraction\":\"Simulierte atmosphärische Refraktion\",\"Meridian Line\":\"Meridianlinie\",\"Ecliptic Line\":\"Ekliptiklinie\",\"Back to real time\":\"Zurück zur Echtzeit\",\"Pause/unpause time\":\"Zeit anhalten/fortsetzen\",\"Dark night\":\"Dunkle Nacht\",\"Moonlight\":\"Mondlicht\",\"Dawn\":\"Morgendämmerung\",\"Twilight\":\"Dämmerung\",\"Daylight\":\"Tageslicht\"}");

/***/ }),

/***/ "6fb1":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var _node_modules_mini_css_extract_plugin_dist_loader_js_ref_7_oneOf_1_0_node_modules_css_loader_dist_cjs_js_ref_7_oneOf_1_1_node_modules_vue_loader_lib_loaders_stylePostLoader_js_node_modules_postcss_loader_src_index_js_ref_7_oneOf_1_2_node_modules_cache_loader_dist_cjs_js_ref_1_0_node_modules_vue_loader_lib_index_js_vue_loader_options_progress_bars_vue_vue_type_style_index_0_lang_css___WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("f390");
/* harmony import */ var _node_modules_mini_css_extract_plugin_dist_loader_js_ref_7_oneOf_1_0_node_modules_css_loader_dist_cjs_js_ref_7_oneOf_1_1_node_modules_vue_loader_lib_loaders_stylePostLoader_js_node_modules_postcss_loader_src_index_js_ref_7_oneOf_1_2_node_modules_cache_loader_dist_cjs_js_ref_1_0_node_modules_vue_loader_lib_index_js_vue_loader_options_progress_bars_vue_vue_type_style_index_0_lang_css___WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_mini_css_extract_plugin_dist_loader_js_ref_7_oneOf_1_0_node_modules_css_loader_dist_cjs_js_ref_7_oneOf_1_1_node_modules_vue_loader_lib_loaders_stylePostLoader_js_node_modules_postcss_loader_src_index_js_ref_7_oneOf_1_2_node_modules_cache_loader_dist_cjs_js_ref_1_0_node_modules_vue_loader_lib_index_js_vue_loader_options_progress_bars_vue_vue_type_style_index_0_lang_css___WEBPACK_IMPORTED_MODULE_0__);
/* unused harmony reexport * */


/***/ }),

/***/ "76c2":
/***/ (function(module, exports, __webpack_require__) {

// extracted by mini-css-extract-plugin

/***/ }),

/***/ "7aa7":
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__.p + "img/remove_circle_outline.558922b2.svg";

/***/ }),

/***/ "7d49":
/***/ (function(module, exports) {

function webpackEmptyContext(req) {
	var e = new Error("Cannot find module '" + req + "'");
	e.code = 'MODULE_NOT_FOUND';
	throw e;
}
webpackEmptyContext.keys = function() { return []; };
webpackEmptyContext.resolve = webpackEmptyContext;
module.exports = webpackEmptyContext;
webpackEmptyContext.id = "7d49";

/***/ }),

/***/ "85ad":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var _node_modules_mini_css_extract_plugin_dist_loader_js_ref_7_oneOf_1_0_node_modules_css_loader_dist_cjs_js_ref_7_oneOf_1_1_node_modules_vue_loader_lib_loaders_stylePostLoader_js_node_modules_postcss_loader_src_index_js_ref_7_oneOf_1_2_node_modules_cache_loader_dist_cjs_js_ref_1_0_node_modules_vue_loader_lib_index_js_vue_loader_options_view_settings_dialog_vue_vue_type_style_index_0_lang_css___WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("8cdb");
/* harmony import */ var _node_modules_mini_css_extract_plugin_dist_loader_js_ref_7_oneOf_1_0_node_modules_css_loader_dist_cjs_js_ref_7_oneOf_1_1_node_modules_vue_loader_lib_loaders_stylePostLoader_js_node_modules_postcss_loader_src_index_js_ref_7_oneOf_1_2_node_modules_cache_loader_dist_cjs_js_ref_1_0_node_modules_vue_loader_lib_index_js_vue_loader_options_view_settings_dialog_vue_vue_type_style_index_0_lang_css___WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_mini_css_extract_plugin_dist_loader_js_ref_7_oneOf_1_0_node_modules_css_loader_dist_cjs_js_ref_7_oneOf_1_1_node_modules_vue_loader_lib_loaders_stylePostLoader_js_node_modules_postcss_loader_src_index_js_ref_7_oneOf_1_2_node_modules_cache_loader_dist_cjs_js_ref_1_0_node_modules_vue_loader_lib_index_js_vue_loader_options_view_settings_dialog_vue_vue_type_style_index_0_lang_css___WEBPACK_IMPORTED_MODULE_0__);
/* unused harmony reexport * */


/***/ }),

/***/ "85df":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var _node_modules_mini_css_extract_plugin_dist_loader_js_ref_7_oneOf_1_0_node_modules_css_loader_dist_cjs_js_ref_7_oneOf_1_1_node_modules_vue_loader_lib_loaders_stylePostLoader_js_node_modules_postcss_loader_src_index_js_ref_7_oneOf_1_2_node_modules_cache_loader_dist_cjs_js_ref_1_0_node_modules_vue_loader_lib_index_js_vue_loader_options_bottom_bar_vue_vue_type_style_index_0_lang_css___WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("5318");
/* harmony import */ var _node_modules_mini_css_extract_plugin_dist_loader_js_ref_7_oneOf_1_0_node_modules_css_loader_dist_cjs_js_ref_7_oneOf_1_1_node_modules_vue_loader_lib_loaders_stylePostLoader_js_node_modules_postcss_loader_src_index_js_ref_7_oneOf_1_2_node_modules_cache_loader_dist_cjs_js_ref_1_0_node_modules_vue_loader_lib_index_js_vue_loader_options_bottom_bar_vue_vue_type_style_index_0_lang_css___WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_mini_css_extract_plugin_dist_loader_js_ref_7_oneOf_1_0_node_modules_css_loader_dist_cjs_js_ref_7_oneOf_1_1_node_modules_vue_loader_lib_loaders_stylePostLoader_js_node_modules_postcss_loader_src_index_js_ref_7_oneOf_1_2_node_modules_cache_loader_dist_cjs_js_ref_1_0_node_modules_vue_loader_lib_index_js_vue_loader_options_bottom_bar_vue_vue_type_style_index_0_lang_css___WEBPACK_IMPORTED_MODULE_0__);
/* unused harmony reexport * */


/***/ }),

/***/ "85ec":
/***/ (function(module, exports, __webpack_require__) {

// extracted by mini-css-extract-plugin

/***/ }),

/***/ "89fa":
/***/ (function(module, exports, __webpack_require__) {

// extracted by mini-css-extract-plugin

/***/ }),

/***/ "8cdb":
/***/ (function(module, exports, __webpack_require__) {

// extracted by mini-css-extract-plugin

/***/ }),

/***/ "9531":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var _node_modules_cache_loader_dist_cjs_js_ref_13_0_node_modules_thread_loader_dist_cjs_js_node_modules_babel_loader_lib_index_js_node_modules_cache_loader_dist_cjs_js_ref_1_0_node_modules_vue_loader_lib_index_js_vue_loader_options_data_credits_dialog_vue_vue_type_script_lang_js___WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("c5ac");
/* harmony import */ var _node_modules_cache_loader_dist_cjs_js_ref_13_0_node_modules_thread_loader_dist_cjs_js_node_modules_babel_loader_lib_index_js_node_modules_cache_loader_dist_cjs_js_ref_1_0_node_modules_vue_loader_lib_index_js_vue_loader_options_data_credits_dialog_vue_vue_type_script_lang_js___WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_cache_loader_dist_cjs_js_ref_13_0_node_modules_thread_loader_dist_cjs_js_node_modules_babel_loader_lib_index_js_node_modules_cache_loader_dist_cjs_js_ref_1_0_node_modules_vue_loader_lib_index_js_vue_loader_options_data_credits_dialog_vue_vue_type_script_lang_js___WEBPACK_IMPORTED_MODULE_0__);
 /* harmony default export */ __webpack_exports__["default"] = (_node_modules_cache_loader_dist_cjs_js_ref_13_0_node_modules_thread_loader_dist_cjs_js_node_modules_babel_loader_lib_index_js_node_modules_cache_loader_dist_cjs_js_ref_1_0_node_modules_vue_loader_lib_index_js_vue_loader_options_data_credits_dialog_vue_vue_type_script_lang_js___WEBPACK_IMPORTED_MODULE_0___default.a); 

/***/ }),

/***/ "aca8":
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__.p + "img/btn-azimuthal-grid.bd02effc.svg";

/***/ }),

/***/ "b41d":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var _node_modules_mini_css_extract_plugin_dist_loader_js_ref_7_oneOf_1_0_node_modules_css_loader_dist_cjs_js_ref_7_oneOf_1_1_node_modules_vue_loader_lib_loaders_stylePostLoader_js_node_modules_postcss_loader_src_index_js_ref_7_oneOf_1_2_node_modules_cache_loader_dist_cjs_js_ref_1_0_node_modules_vue_loader_lib_index_js_vue_loader_options_oras_catalog_status_dialog_vue_vue_type_style_index_0_id_f9af96b2_scoped_true_lang_css___WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("0ff8");
/* harmony import */ var _node_modules_mini_css_extract_plugin_dist_loader_js_ref_7_oneOf_1_0_node_modules_css_loader_dist_cjs_js_ref_7_oneOf_1_1_node_modules_vue_loader_lib_loaders_stylePostLoader_js_node_modules_postcss_loader_src_index_js_ref_7_oneOf_1_2_node_modules_cache_loader_dist_cjs_js_ref_1_0_node_modules_vue_loader_lib_index_js_vue_loader_options_oras_catalog_status_dialog_vue_vue_type_style_index_0_id_f9af96b2_scoped_true_lang_css___WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_mini_css_extract_plugin_dist_loader_js_ref_7_oneOf_1_0_node_modules_css_loader_dist_cjs_js_ref_7_oneOf_1_1_node_modules_vue_loader_lib_loaders_stylePostLoader_js_node_modules_postcss_loader_src_index_js_ref_7_oneOf_1_2_node_modules_cache_loader_dist_cjs_js_ref_1_0_node_modules_vue_loader_lib_index_js_vue_loader_options_oras_catalog_status_dialog_vue_vue_type_style_index_0_id_f9af96b2_scoped_true_lang_css___WEBPACK_IMPORTED_MODULE_0__);
/* unused harmony reexport * */


/***/ }),

/***/ "b7a9":
/***/ (function(module, exports, __webpack_require__) {

// extracted by mini-css-extract-plugin

/***/ }),

/***/ "c074":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(__filename, process, __dirname) {/* harmony import */ var _work_node_modules_babel_runtime_helpers_esm_createForOfIteratorHelper__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("b85c");
/* harmony import */ var _work_node_modules_babel_runtime_helpers_esm_typeof__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__("53ca");
/* harmony import */ var core_js_modules_es_object_to_string_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__("d3b7");
/* harmony import */ var core_js_modules_es_object_to_string_js__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_object_to_string_js__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var core_js_modules_es_regexp_flags_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__("5377");
/* harmony import */ var core_js_modules_es_regexp_flags_js__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_regexp_flags_js__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var core_js_modules_es_math_sign_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__("2af1");
/* harmony import */ var core_js_modules_es_math_sign_js__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_math_sign_js__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var core_js_modules_es_typed_array_uint8_array_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__("5cc6");
/* harmony import */ var core_js_modules_es_typed_array_uint8_array_js__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_typed_array_uint8_array_js__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var core_js_modules_es_typed_array_copy_within_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__("9a8c");
/* harmony import */ var core_js_modules_es_typed_array_copy_within_js__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_typed_array_copy_within_js__WEBPACK_IMPORTED_MODULE_6__);
/* harmony import */ var core_js_modules_es_typed_array_every_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__("a975");
/* harmony import */ var core_js_modules_es_typed_array_every_js__WEBPACK_IMPORTED_MODULE_7___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_typed_array_every_js__WEBPACK_IMPORTED_MODULE_7__);
/* harmony import */ var core_js_modules_es_typed_array_fill_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__("735e");
/* harmony import */ var core_js_modules_es_typed_array_fill_js__WEBPACK_IMPORTED_MODULE_8___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_typed_array_fill_js__WEBPACK_IMPORTED_MODULE_8__);
/* harmony import */ var core_js_modules_es_typed_array_filter_js__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__("c1ac");
/* harmony import */ var core_js_modules_es_typed_array_filter_js__WEBPACK_IMPORTED_MODULE_9___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_typed_array_filter_js__WEBPACK_IMPORTED_MODULE_9__);
/* harmony import */ var core_js_modules_es_typed_array_find_js__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__("d139");
/* harmony import */ var core_js_modules_es_typed_array_find_js__WEBPACK_IMPORTED_MODULE_10___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_typed_array_find_js__WEBPACK_IMPORTED_MODULE_10__);
/* harmony import */ var core_js_modules_es_typed_array_find_index_js__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__("3a7b");
/* harmony import */ var core_js_modules_es_typed_array_find_index_js__WEBPACK_IMPORTED_MODULE_11___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_typed_array_find_index_js__WEBPACK_IMPORTED_MODULE_11__);
/* harmony import */ var core_js_modules_es_typed_array_for_each_js__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__("d5d6");
/* harmony import */ var core_js_modules_es_typed_array_for_each_js__WEBPACK_IMPORTED_MODULE_12___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_typed_array_for_each_js__WEBPACK_IMPORTED_MODULE_12__);
/* harmony import */ var core_js_modules_es_typed_array_includes_js__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__("82f8");
/* harmony import */ var core_js_modules_es_typed_array_includes_js__WEBPACK_IMPORTED_MODULE_13___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_typed_array_includes_js__WEBPACK_IMPORTED_MODULE_13__);
/* harmony import */ var core_js_modules_es_typed_array_index_of_js__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__("e91f");
/* harmony import */ var core_js_modules_es_typed_array_index_of_js__WEBPACK_IMPORTED_MODULE_14___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_typed_array_index_of_js__WEBPACK_IMPORTED_MODULE_14__);
/* harmony import */ var core_js_modules_es_typed_array_iterator_js__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__("60bd");
/* harmony import */ var core_js_modules_es_typed_array_iterator_js__WEBPACK_IMPORTED_MODULE_15___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_typed_array_iterator_js__WEBPACK_IMPORTED_MODULE_15__);
/* harmony import */ var core_js_modules_es_typed_array_join_js__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__("5f96");
/* harmony import */ var core_js_modules_es_typed_array_join_js__WEBPACK_IMPORTED_MODULE_16___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_typed_array_join_js__WEBPACK_IMPORTED_MODULE_16__);
/* harmony import */ var core_js_modules_es_typed_array_last_index_of_js__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__("3280");
/* harmony import */ var core_js_modules_es_typed_array_last_index_of_js__WEBPACK_IMPORTED_MODULE_17___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_typed_array_last_index_of_js__WEBPACK_IMPORTED_MODULE_17__);
/* harmony import */ var core_js_modules_es_typed_array_map_js__WEBPACK_IMPORTED_MODULE_18__ = __webpack_require__("3fcc");
/* harmony import */ var core_js_modules_es_typed_array_map_js__WEBPACK_IMPORTED_MODULE_18___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_typed_array_map_js__WEBPACK_IMPORTED_MODULE_18__);
/* harmony import */ var core_js_modules_es_typed_array_reduce_js__WEBPACK_IMPORTED_MODULE_19__ = __webpack_require__("ca91");
/* harmony import */ var core_js_modules_es_typed_array_reduce_js__WEBPACK_IMPORTED_MODULE_19___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_typed_array_reduce_js__WEBPACK_IMPORTED_MODULE_19__);
/* harmony import */ var core_js_modules_es_typed_array_reduce_right_js__WEBPACK_IMPORTED_MODULE_20__ = __webpack_require__("25a1");
/* harmony import */ var core_js_modules_es_typed_array_reduce_right_js__WEBPACK_IMPORTED_MODULE_20___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_typed_array_reduce_right_js__WEBPACK_IMPORTED_MODULE_20__);
/* harmony import */ var core_js_modules_es_typed_array_reverse_js__WEBPACK_IMPORTED_MODULE_21__ = __webpack_require__("cd26");
/* harmony import */ var core_js_modules_es_typed_array_reverse_js__WEBPACK_IMPORTED_MODULE_21___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_typed_array_reverse_js__WEBPACK_IMPORTED_MODULE_21__);
/* harmony import */ var core_js_modules_es_typed_array_set_js__WEBPACK_IMPORTED_MODULE_22__ = __webpack_require__("3c5d");
/* harmony import */ var core_js_modules_es_typed_array_set_js__WEBPACK_IMPORTED_MODULE_22___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_typed_array_set_js__WEBPACK_IMPORTED_MODULE_22__);
/* harmony import */ var core_js_modules_es_typed_array_slice_js__WEBPACK_IMPORTED_MODULE_23__ = __webpack_require__("2954");
/* harmony import */ var core_js_modules_es_typed_array_slice_js__WEBPACK_IMPORTED_MODULE_23___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_typed_array_slice_js__WEBPACK_IMPORTED_MODULE_23__);
/* harmony import */ var core_js_modules_es_typed_array_some_js__WEBPACK_IMPORTED_MODULE_24__ = __webpack_require__("649e");
/* harmony import */ var core_js_modules_es_typed_array_some_js__WEBPACK_IMPORTED_MODULE_24___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_typed_array_some_js__WEBPACK_IMPORTED_MODULE_24__);
/* harmony import */ var core_js_modules_es_typed_array_sort_js__WEBPACK_IMPORTED_MODULE_25__ = __webpack_require__("219c");
/* harmony import */ var core_js_modules_es_typed_array_sort_js__WEBPACK_IMPORTED_MODULE_25___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_typed_array_sort_js__WEBPACK_IMPORTED_MODULE_25__);
/* harmony import */ var core_js_modules_es_typed_array_subarray_js__WEBPACK_IMPORTED_MODULE_26__ = __webpack_require__("170b");
/* harmony import */ var core_js_modules_es_typed_array_subarray_js__WEBPACK_IMPORTED_MODULE_26___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_typed_array_subarray_js__WEBPACK_IMPORTED_MODULE_26__);
/* harmony import */ var core_js_modules_es_typed_array_to_locale_string_js__WEBPACK_IMPORTED_MODULE_27__ = __webpack_require__("b39a");
/* harmony import */ var core_js_modules_es_typed_array_to_locale_string_js__WEBPACK_IMPORTED_MODULE_27___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_typed_array_to_locale_string_js__WEBPACK_IMPORTED_MODULE_27__);
/* harmony import */ var core_js_modules_es_typed_array_to_string_js__WEBPACK_IMPORTED_MODULE_28__ = __webpack_require__("72f7");
/* harmony import */ var core_js_modules_es_typed_array_to_string_js__WEBPACK_IMPORTED_MODULE_28___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_typed_array_to_string_js__WEBPACK_IMPORTED_MODULE_28__);
/* harmony import */ var core_js_modules_es_array_buffer_slice_js__WEBPACK_IMPORTED_MODULE_29__ = __webpack_require__("ace4");
/* harmony import */ var core_js_modules_es_array_buffer_slice_js__WEBPACK_IMPORTED_MODULE_29___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_array_buffer_slice_js__WEBPACK_IMPORTED_MODULE_29__);
/* harmony import */ var core_js_modules_es_array_map_js__WEBPACK_IMPORTED_MODULE_30__ = __webpack_require__("d81d");
/* harmony import */ var core_js_modules_es_array_map_js__WEBPACK_IMPORTED_MODULE_30___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_array_map_js__WEBPACK_IMPORTED_MODULE_30__);
/* harmony import */ var core_js_modules_es_array_filter_js__WEBPACK_IMPORTED_MODULE_31__ = __webpack_require__("4de4");
/* harmony import */ var core_js_modules_es_array_filter_js__WEBPACK_IMPORTED_MODULE_31___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_array_filter_js__WEBPACK_IMPORTED_MODULE_31__);
/* harmony import */ var core_js_modules_es_string_split_js__WEBPACK_IMPORTED_MODULE_32__ = __webpack_require__("1276");
/* harmony import */ var core_js_modules_es_string_split_js__WEBPACK_IMPORTED_MODULE_32___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_string_split_js__WEBPACK_IMPORTED_MODULE_32__);
/* harmony import */ var core_js_modules_es_regexp_exec_js__WEBPACK_IMPORTED_MODULE_33__ = __webpack_require__("ac1f");
/* harmony import */ var core_js_modules_es_regexp_exec_js__WEBPACK_IMPORTED_MODULE_33___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_regexp_exec_js__WEBPACK_IMPORTED_MODULE_33__);
/* harmony import */ var core_js_modules_es_array_join_js__WEBPACK_IMPORTED_MODULE_34__ = __webpack_require__("a15b");
/* harmony import */ var core_js_modules_es_array_join_js__WEBPACK_IMPORTED_MODULE_34___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_array_join_js__WEBPACK_IMPORTED_MODULE_34__);
/* harmony import */ var core_js_modules_es_array_fill_js__WEBPACK_IMPORTED_MODULE_35__ = __webpack_require__("cb29");
/* harmony import */ var core_js_modules_es_array_fill_js__WEBPACK_IMPORTED_MODULE_35___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_array_fill_js__WEBPACK_IMPORTED_MODULE_35__);
/* harmony import */ var core_js_modules_es_string_blink_js__WEBPACK_IMPORTED_MODULE_36__ = __webpack_require__("04d3");
/* harmony import */ var core_js_modules_es_string_blink_js__WEBPACK_IMPORTED_MODULE_36___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_string_blink_js__WEBPACK_IMPORTED_MODULE_36__);
/* harmony import */ var core_js_modules_es_string_replace_js__WEBPACK_IMPORTED_MODULE_37__ = __webpack_require__("5319");
/* harmony import */ var core_js_modules_es_string_replace_js__WEBPACK_IMPORTED_MODULE_37___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_string_replace_js__WEBPACK_IMPORTED_MODULE_37__);
/* harmony import */ var core_js_modules_es_array_slice_js__WEBPACK_IMPORTED_MODULE_38__ = __webpack_require__("fb6a");
/* harmony import */ var core_js_modules_es_array_slice_js__WEBPACK_IMPORTED_MODULE_38___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_array_slice_js__WEBPACK_IMPORTED_MODULE_38__);
/* harmony import */ var core_js_modules_es_number_constructor_js__WEBPACK_IMPORTED_MODULE_39__ = __webpack_require__("a9e3");
/* harmony import */ var core_js_modules_es_number_constructor_js__WEBPACK_IMPORTED_MODULE_39___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_number_constructor_js__WEBPACK_IMPORTED_MODULE_39__);
/* harmony import */ var core_js_modules_es_array_concat_js__WEBPACK_IMPORTED_MODULE_40__ = __webpack_require__("99af");
/* harmony import */ var core_js_modules_es_array_concat_js__WEBPACK_IMPORTED_MODULE_40___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_array_concat_js__WEBPACK_IMPORTED_MODULE_40__);
/* harmony import */ var core_js_modules_es_weak_map_js__WEBPACK_IMPORTED_MODULE_41__ = __webpack_require__("10d1");
/* harmony import */ var core_js_modules_es_weak_map_js__WEBPACK_IMPORTED_MODULE_41___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_weak_map_js__WEBPACK_IMPORTED_MODULE_41__);
/* harmony import */ var core_js_modules_es_string_iterator_js__WEBPACK_IMPORTED_MODULE_42__ = __webpack_require__("3ca3");
/* harmony import */ var core_js_modules_es_string_iterator_js__WEBPACK_IMPORTED_MODULE_42___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_string_iterator_js__WEBPACK_IMPORTED_MODULE_42__);
/* harmony import */ var core_js_modules_web_dom_collections_iterator_js__WEBPACK_IMPORTED_MODULE_43__ = __webpack_require__("ddb0");
/* harmony import */ var core_js_modules_web_dom_collections_iterator_js__WEBPACK_IMPORTED_MODULE_43___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_web_dom_collections_iterator_js__WEBPACK_IMPORTED_MODULE_43__);
/* harmony import */ var core_js_modules_es_typed_array_int8_array_js__WEBPACK_IMPORTED_MODULE_44__ = __webpack_require__("fd87");
/* harmony import */ var core_js_modules_es_typed_array_int8_array_js__WEBPACK_IMPORTED_MODULE_44___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_typed_array_int8_array_js__WEBPACK_IMPORTED_MODULE_44__);
/* harmony import */ var core_js_modules_es_typed_array_int16_array_js__WEBPACK_IMPORTED_MODULE_45__ = __webpack_require__("8b09");
/* harmony import */ var core_js_modules_es_typed_array_int16_array_js__WEBPACK_IMPORTED_MODULE_45___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_typed_array_int16_array_js__WEBPACK_IMPORTED_MODULE_45__);
/* harmony import */ var core_js_modules_es_typed_array_int32_array_js__WEBPACK_IMPORTED_MODULE_46__ = __webpack_require__("143c");
/* harmony import */ var core_js_modules_es_typed_array_int32_array_js__WEBPACK_IMPORTED_MODULE_46___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_typed_array_int32_array_js__WEBPACK_IMPORTED_MODULE_46__);
/* harmony import */ var core_js_modules_es_typed_array_uint16_array_js__WEBPACK_IMPORTED_MODULE_47__ = __webpack_require__("84c3");
/* harmony import */ var core_js_modules_es_typed_array_uint16_array_js__WEBPACK_IMPORTED_MODULE_47___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_typed_array_uint16_array_js__WEBPACK_IMPORTED_MODULE_47__);
/* harmony import */ var core_js_modules_es_typed_array_uint32_array_js__WEBPACK_IMPORTED_MODULE_48__ = __webpack_require__("fb2c");
/* harmony import */ var core_js_modules_es_typed_array_uint32_array_js__WEBPACK_IMPORTED_MODULE_48___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_typed_array_uint32_array_js__WEBPACK_IMPORTED_MODULE_48__);
/* harmony import */ var core_js_modules_es_typed_array_float32_array_js__WEBPACK_IMPORTED_MODULE_49__ = __webpack_require__("cfc3");
/* harmony import */ var core_js_modules_es_typed_array_float32_array_js__WEBPACK_IMPORTED_MODULE_49___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_typed_array_float32_array_js__WEBPACK_IMPORTED_MODULE_49__);
/* harmony import */ var core_js_modules_es_typed_array_float64_array_js__WEBPACK_IMPORTED_MODULE_50__ = __webpack_require__("4a9b");
/* harmony import */ var core_js_modules_es_typed_array_float64_array_js__WEBPACK_IMPORTED_MODULE_50___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_typed_array_float64_array_js__WEBPACK_IMPORTED_MODULE_50__);
/* harmony import */ var core_js_modules_es_string_starts_with_js__WEBPACK_IMPORTED_MODULE_51__ = __webpack_require__("2ca0");
/* harmony import */ var core_js_modules_es_string_starts_with_js__WEBPACK_IMPORTED_MODULE_51___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_string_starts_with_js__WEBPACK_IMPORTED_MODULE_51__);
/* harmony import */ var core_js_modules_web_immediate_js__WEBPACK_IMPORTED_MODULE_52__ = __webpack_require__("130f");
/* harmony import */ var core_js_modules_web_immediate_js__WEBPACK_IMPORTED_MODULE_52___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_web_immediate_js__WEBPACK_IMPORTED_MODULE_52__);
/* harmony import */ var core_js_modules_es_function_name_js__WEBPACK_IMPORTED_MODULE_53__ = __webpack_require__("b0c0");
/* harmony import */ var core_js_modules_es_function_name_js__WEBPACK_IMPORTED_MODULE_53___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_function_name_js__WEBPACK_IMPORTED_MODULE_53__);
/* harmony import */ var core_js_modules_web_url_js__WEBPACK_IMPORTED_MODULE_54__ = __webpack_require__("2b3d");
/* harmony import */ var core_js_modules_web_url_js__WEBPACK_IMPORTED_MODULE_54___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_web_url_js__WEBPACK_IMPORTED_MODULE_54__);
/* harmony import */ var core_js_modules_web_dom_collections_for_each_js__WEBPACK_IMPORTED_MODULE_55__ = __webpack_require__("159b");
/* harmony import */ var core_js_modules_web_dom_collections_for_each_js__WEBPACK_IMPORTED_MODULE_55___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_web_dom_collections_for_each_js__WEBPACK_IMPORTED_MODULE_55__);
/* harmony import */ var core_js_modules_es_regexp_to_string_js__WEBPACK_IMPORTED_MODULE_56__ = __webpack_require__("25f0");
/* harmony import */ var core_js_modules_es_regexp_to_string_js__WEBPACK_IMPORTED_MODULE_56___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_regexp_to_string_js__WEBPACK_IMPORTED_MODULE_56__);
/* harmony import */ var core_js_modules_es_array_copy_within_js__WEBPACK_IMPORTED_MODULE_57__ = __webpack_require__("a874");
/* harmony import */ var core_js_modules_es_array_copy_within_js__WEBPACK_IMPORTED_MODULE_57___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_array_copy_within_js__WEBPACK_IMPORTED_MODULE_57__);
/* harmony import */ var core_js_modules_es_array_splice_js__WEBPACK_IMPORTED_MODULE_58__ = __webpack_require__("a434");
/* harmony import */ var core_js_modules_es_array_splice_js__WEBPACK_IMPORTED_MODULE_58___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_array_splice_js__WEBPACK_IMPORTED_MODULE_58__);
/* harmony import */ var core_js_modules_es_math_clz32_js__WEBPACK_IMPORTED_MODULE_59__ = __webpack_require__("40d9");
/* harmony import */ var core_js_modules_es_math_clz32_js__WEBPACK_IMPORTED_MODULE_59___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_math_clz32_js__WEBPACK_IMPORTED_MODULE_59__);





























































var StelWebEngine = function () {
  var _scriptDir = typeof document !== 'undefined' && document.currentScript ? document.currentScript.src : undefined;

  if (true) _scriptDir = _scriptDir || __filename;
  return function (StelWebEngine) {
    StelWebEngine = StelWebEngine || {};
    var Module = typeof StelWebEngine !== "undefined" ? StelWebEngine : {};
    var readyPromiseResolve, readyPromiseReject;
    Module["ready"] = new Promise(function (resolve, reject) {
      readyPromiseResolve = resolve;
      readyPromiseReject = reject;
    });

    Module["locateFile"] = function (path) {
      if (path === "stellarium-web-engine.wasm") return Module.wasmFile;
      return path;
    };

    Module["onRuntimeInitialized"] = function () {
      if (Module.canvasElement) Module.canvas = Module.canvasElement;

      if (Module.canvas) {
        var contextAttributes = {};
        contextAttributes.alpha = false;
        contextAttributes.depth = true;
        contextAttributes.stencil = true;
        contextAttributes.antialias = true;
        contextAttributes.premultipliedAlpha = true;
        contextAttributes.preserveDrawingBuffer = false;
        contextAttributes.preferLowPowerToHighPerformance = false;
        contextAttributes.failIfMajorPerformanceCaveat = false;
        contextAttributes.majorVersion = 1;
        contextAttributes.minorVersion = 0;
        var ctx = Module.GL.createContext(Module.canvas, contextAttributes);
        Module.GL.makeContextCurrent(ctx);
      }

      Module["_setValue"] = Module["setValue"];
      Module["_getValue"] = Module["getValue"];

      for (var i in Module.extendFns) {
        Module.extendFns[i]();
      }

      Module._core_init(0, 0, 1);

      Module.core = Module.getModule("core");
      Module.observer = Module.core.observer;

      if (Module.translateFn) {
        Module.translationsCache = {};
        var callback = Module.addFunction(function (user, domain, str) {
          domain = Module.UTF8ToString(domain);
          str = Module.UTF8ToString(str);
          str = Module.translateFn(domain, str);
          var value = Module.translationsCache[str];
          if (value) return value;
          var size = Module.lengthBytesUTF8(str) + 1;
          value = Module._malloc(size);
          Module.stringToUTF8(str, value, size);
          Module.translationsCache[str] = value;
          return value;
        }, "iiii");

        Module._sys_set_translate_function(callback);
      }

      if (Module.onReady) Module.onReady(Module);
    };

    Module["extendFns"] = [];

    Module["afterInit"] = function (f) {
      Module.extendFns.push(f);
    };

    Module["D2R"] = Math.PI / 180;
    Module["R2D"] = 180 / Math.PI;
    Module["FRAME_ASTROM"] = 0;
    Module["FRAME_ICRF"] = 1;
    Module["FRAME_CIRS"] = 2;
    Module["FRAME_JNOW"] = 3;
    Module["FRAME_OBSERVED_GEOM"] = 4;
    Module["FRAME_OBSERVED"] = 5;
    Module["FRAME_MOUNT"] = 6;
    Module["FRAME_VIEW"] = 7;
    Module["FRAME_ECLIPTIC"] = 8;

    Module["MJD2date"] = function (v) {
      return new Date(Math.round((v + 2400000.5 - 2440587.5) * 864e5));
    };

    Module["date2MJD"] = function (date) {
      return date / 864e5 - 2400000.5 + 2440587.5;
    };

    Module["a2tf"] = function (angle, resolution) {
      resolution = resolution || 0;
      var a2tf_json = Module.cwrap("a2tf_json", "number", ["number", "number"]);
      var cret = a2tf_json(resolution, angle);
      var ret = Module.UTF8ToString(cret);

      Module._free(cret);

      ret = JSON.parse(ret);
      return ret;
    };

    Module["a2af"] = function (angle, resolution) {
      resolution = resolution || 0;
      var a2af_json = Module.cwrap("a2af_json", "number", ["number", "number"]);
      var cret = a2af_json(resolution, angle);
      var ret = Module.UTF8ToString(cret);

      Module._free(cret);

      ret = JSON.parse(ret);
      return ret;
    };

    Module["calendar"] = function (args) {
      if (arguments.length == 3) {
        args = {
          start: arguments[0],
          end: arguments[1],
          onEvent: function onEvent(ev) {
            arguments[2](ev.time, ev.type, ev.desc, ev.flags, ev.o1, ev.o2);
          }
        };
      }

      var start = args.start / 864e5 + 2440587.5 - 2400000.5;
      var end = args.end / 864e5 + 2440587.5 - 2400000.5;

      var getCallback = function getCallback() {
        return Module.addFunction(function (time, type, desc, flags, o1, o2, user) {
          var ev = {
            time: Module.MJD2date(time),
            type: Module.UTF8ToString(type),
            desc: Module.UTF8ToString(desc),
            o1: o1 ? new Module.SweObj(o1) : null,
            o2: o2 ? new Module.SweObj(o2) : null
          };
          args.onEvent(ev);
        }, "idiiiiii");
      };

      if (args.iterator) {
        var cal = Module._calendar_create(this.observer.v, start, end, 1);

        return function () {
          var ret = Module._calendar_compute(cal);

          if (!ret) {
            var callback = getCallback();

            Module._calendar_get_results_callback(cal, 0, callback);

            Module.removeFunction(callback);

            Module._calendar_delete(cal);
          }

          return ret;
        };
      }

      var callback = getCallback();

      Module._calendar_get(this.observer.v, start, end, 1, 0, callback);

      Module.removeFunction(callback);
    };

    Module["designationCleanup"] = function (d, flags) {
      var designation_cleanup = Module.cwrap("designation_cleanup", null, ["string", "number", "number", "number"]);

      var cbuf = Module._malloc(256);

      designation_cleanup(d, cbuf, 256, flags);
      var ret = Module.UTF8ToString(cbuf);

      Module._free(out);

      return ret;
    };

    Module["c2s"] = function (v) {
      var x = v[0];
      var y = v[1];
      var z = v[2];
      var d2 = x * x + y * y;
      var theta = d2 == 0 ? 0 : Math.atan2(y, x);
      var phi = z === 0 ? 0 : Math.atan2(z, Math.sqrt(d2));
      return [theta, phi];
    };

    Module["s2c"] = function (theta, phi) {
      var cp = Math.cos(phi);
      return [Math.cos(theta) * cp, Math.sin(theta) * cp, Math.sin(phi)];
    };

    Module["anp"] = function (a) {
      var v = a % (2 * Math.PI);
      if (v < 0) v += 2 * Math.PI;
      return v;
    };

    Module["anpm"] = function (a) {
      var v = a % (2 * Math.PI);
      if (Math.abs(v) >= Math.PI) v -= 2 * Math.PI * Math.sign(a);
      return v;
    };

    var asFrame = function asFrame(f) {
      if (f === "ASTROM") return Module.FRAME_ASTROM;
      if (f === "ICRF") return Module.FRAME_ICRF;
      if (f === "CIRS") return Module.FRAME_CIRS;
      if (f === "JNOW") return Module.FRAME_JNOW;
      if (f === "OBSERVED") return Module.FRAME_OBSERVED;
      if (f === "OBSERVED_GEOM") return Module.FRAME_OBSERVED_GEOM;
      if (f === "MOUNT") return Module.FRAME_MOUNT;
      if (f === "VIEW") return Module.FRAME_VIEW;
      assert(typeof f === "number");
      return f;
    };

    Module["convertFrame"] = function (obs, origin, dest, v) {
      origin = asFrame(origin);
      dest = asFrame(dest);
      var v4 = [v[0], v[1], v[2], v[3] || 0];

      var ptr = Module._malloc(8 * 8);

      var i;

      for (i = 0; i < 4; i++) {
        Module._setValue(ptr + i * 8, v4[i], "double");
      }

      Module._convert_framev4(obs.v, origin, dest, ptr, ptr + 4 * 8);

      var ret = new Array(4);

      for (i = 0; i < 4; i++) {
        ret[i] = Module._getValue(ptr + (4 + i) * 8, "double");
      }

      Module._free(ptr);

      return ret;
    };

    Module["lookAt"] = function (pos, duration) {
      if (duration === undefined) duration = 1;

      var v = Module._malloc(3 * 8);

      var i;

      for (i = 0; i < 3; i++) {
        Module._setValue(v + i * 8, pos[i], "double");
      }

      Module._core_lookat(v, duration);

      Module._free(v);
    };

    Module["pointAndLock"] = function (target, duration) {
      if (duration === undefined) duration = 1;

      Module._core_point_and_lock(target.v, duration);
    };

    Module["zoomTo"] = function (fov, duration) {
      if (duration === undefined) duration = 1;

      Module._core_zoomto(fov, duration);
    };

    Module["otypeToStr"] = function (otype) {
      var otype_to_str = Module.cwrap("otype_to_str", "number", ["string"]);
      var cret = otype_to_str(otype);
      return Module.UTF8ToString(cret);
    };

    var onClickCallback;
    var onClickFn;
    var onRectCallback;
    var onRectFn;

    Module["on"] = function (eventName, callback) {
      if (eventName === "click") {
        if (!onClickFn) {
          onClickFn = Module.addFunction(function (x, y) {
            return onClickCallback({
              point: {
                x: x,
                y: y
              }
            });
          }, "idd");
        }

        onClickCallback = callback;
        Module.core.on_click = onClickFn;
      }

      if (eventName === "rectSelection") {
        onRectFn = Module.addFunction(function (x1, y1, x2, y2) {
          return onRectCallback({
            rect: [{
              x: x1,
              y: y1
            }, {
              x: x2,
              y: y2
            }]
          });
        }, "idddd");
        onRectCallback = callback;
        Module.core.on_rect = onRectFn;
      }
    };

    Module["setFont"] = function (font, url) {
      return fetch(url).then(function (response) {
        if (!response.ok) throw new Error("Cannot get ".concat(url));
        return response.arrayBuffer();
      }).then(function (data) {
        data = new Uint8Array(data);

        var ptr = Module._malloc(data.length);

        Module.writeArrayToMemory(data, ptr);
        Module.ccall("core_add_font", null, ["number", "string", "string", "number", "number", "number"], [0, font, null, ptr, data.length]);
        var url = font === "regular" ? "asset://font/NotoSans-Regular.ttf" : "asset://font/NotoSans-Bold.ttf";
        Module.ccall("core_add_font", null, ["number", "string", "string", "number", "number", "number"], [0, font, url, 0, 0]);
      });
    };

    Module.afterInit(function () {
      var obj_call_json_str = Module.cwrap("obj_call_json_str", "number", ["number", "string", "string"]);
      var core_search = Module.cwrap("core_search", "number", ["string"]);
      var obj_get_id = Module.cwrap("obj_get_id", "string", ["number"]);
      var module_add = Module.cwrap("module_add", null, ["number", "number"]);
      var module_remove = Module.cwrap("module_remove", null, ["number", "number"]);
      var module_get_tree = Module.cwrap("module_get_tree", "number", ["number", "number"]);
      var module_get_path = Module.cwrap("module_get_path", "number", ["number", "number"]);
      var obj_create_str = Module.cwrap("obj_create_str", "number", ["string", "string"]);
      var module_get_child = Module.cwrap("module_get_child", "number", ["number", "string"]);
      var core_get_module = Module.cwrap("core_get_module", "number", ["string"]);
      var obj_get_info_json = Module.cwrap("obj_get_info_json", "number", ["number", "number", "string"]);
      var obj_get_json_data_str = Module.cwrap("obj_get_json_data_str", "number", ["number"]);
      var g_listeners = [];
      var g_ret;
      var g_obj_foreach_attr_callback = Module.addFunction(function (attr, isProp, user) {
        g_ret.push([attr, isProp]);
      }, "viii");
      var g_obj_foreach_child_callback = Module.addFunction(function (id) {
        g_ret.push(id);
      }, "vi");
      var g_obj_get_designations_callback = Module.addFunction(function (o, u, v) {
        g_ret.push(v);
      }, "viii");
      var g_module_list_obj2 = Module.addFunction(function (user, obj) {
        g_ret.push(obj);
        return 0;
      }, "iii");

      var SweObj = function SweObj(v) {
        assert(typeof v === "number");
        this.v = v;
        this.swe_ = 1;
        var that = this;
        g_ret = [];

        Module._obj_foreach_attr(this.v, 0, g_obj_foreach_attr_callback);

        var _loop = function _loop(_i) {
          var attr = g_ret[_i][0];
          var isProp = g_ret[_i][1];
          var name = Module.UTF8ToString(attr);

          if (!isProp) {
            that[name] = function (args) {
              return that._call(name, args);
            };
          } else {
            Object.defineProperty(that, name, {
              configurable: true,
              enumerable: true,
              get: function get() {
                return that._call(name);
              },
              set: function set(v) {
                return that._call(name, v);
              }
            });
          }
        };

        for (var _i = 0; _i < g_ret.length; _i++) {
          _loop(_i);
        }

        g_ret = [];

        Module._obj_foreach_child(this.v, g_obj_foreach_child_callback);

        var _loop2 = function _loop2(_i2) {
          var id = Module.UTF8ToString(g_ret[_i2]);
          if (!id) return {
            v: void 0
          };
          Object.defineProperty(that, id, {
            enumerable: true,
            get: function get() {
              var obj = module_get_child(that.v, id);
              return obj ? new SweObj(obj) : null;
            }
          });
        };

        for (var _i2 = 0; _i2 < g_ret.length; _i2++) {
          var _ret = _loop2(_i2);

          if (Object(_work_node_modules_babel_runtime_helpers_esm_typeof__WEBPACK_IMPORTED_MODULE_1__[/* default */ "a"])(_ret) === "object") return _ret.v;
        }
      };

      SweObj.prototype.valueOf = function () {
        return this.id;
      };

      SweObj.prototype.update = function () {
        Module._module_update(this.v, 0);
      };

      SweObj.prototype.getInfo = function (info, obs) {
        if (obs === undefined) obs = Module.observer;

        Module._observer_update(obs.v, true);

        var cret = obj_get_info_json(this.v, obs.v, info);
        if (cret === 0) return undefined;
        var ret = Module.UTF8ToString(cret);

        Module._free(cret);

        ret = JSON.parse(ret);
        if (!ret.swe_) return ret;
        return ret.v;
      };

      SweObj.prototype.clone = function () {
        return new SweObj(Module._obj_clone(this.v));
      };

      SweObj.prototype.destroy = function () {
        Module._obj_release(this.v);
      };

      SweObj.prototype.retain = function () {
        Module._obj_retain(this.v);
      };

      SweObj.prototype.change = function (attr, callback, context) {
        g_listeners.push({
          "obj": this.v,
          "ctx": context ? context : this,
          "attr": attr,
          "callback": callback
        });
      };

      SweObj.prototype.add = function (type, args) {
        if (args === undefined) {
          var obj = type;
          module_add(this.v, obj.v);
          return obj;
        } else {
          var _obj = Module.createObj(type, args);

          this.add(_obj);
          return _obj;
        }
      };

      SweObj.prototype.remove = function (obj) {
        module_remove(this.v, obj.v);
      };

      SweObj.prototype.designations = function () {
        g_ret = [];

        Module._obj_get_designations(this.v, 0, g_obj_get_designations_callback);

        var ret = g_ret.map(function (v) {
          return Module.UTF8ToString(v);
        });
        ret = ret.filter(function (item, pos, self) {
          return self.indexOf(item) == pos;
        });
        return ret;
      };

      SweObj.prototype.culturalDesignations = function () {
        var ret = Module._skycultures_get_cultural_names_json(this.v);

        ret = Module.UTF8ToString(ret);

        Module._free(ret);

        ret = JSON.parse(ret);
        return ret;
      };

      SweObj.prototype.listObjs = function (obs, maxMag, filter) {
        var ret = [];
        g_ret = [];

        Module._module_list_objs2(this.v, obs.v, maxMag, 0, g_module_list_obj2);

        for (var _i3 = 0; _i3 < g_ret.length; _i3++) {
          var obj = new SweObj(g_ret[_i3]);

          if (filter(obj)) {
            obj.retain();
            ret.push(obj);
          }
        }

        return ret;
      };

      SweObj.prototype.getTree = function (detailed) {
        detailed = detailed !== undefined ? detailed : false;
        var cret = module_get_tree(this.v, detailed);
        var ret = Module.UTF8ToString(cret);

        Module._free(cret);

        ret = JSON.parse(ret);
        return ret;
      };

      SweObj.prototype.computeVisibility = function (args) {
        args = args || {};
        var obs = args.obs || Module.core.observer;
        var startTime = args.startTime || obs.tt - 1 / 2;
        var endTime = args.endTime || obs.tt + 1 / 2;
        var precision = 1 / 24 / 60 / 2;
        var rise = Module._compute_event(obs.v, this.v, 1, startTime, endTime, precision) || null;
        var set = Module._compute_event(obs.v, this.v, 2, startTime, endTime, precision) || null;

        if (rise === null && set === null) {
          var p = this.getInfo("radec", obs);
          p = Module.convertFrame(obs, "ICRF", "OBSERVED", p);
          if (p[2] < 0) return [];
        }

        return [{
          "rise": rise,
          "set": set
        }];
      };

      Object.defineProperty(SweObj.prototype, "id", {
        get: function get() {
          var ret = obj_get_id(this.v);
          if (ret) return ret;
          return this.designations()[0];
        }
      });
      Object.defineProperty(SweObj.prototype, "path", {
        get: function get() {
          if (this.v === Module.core.v) return "core";
          var cret = module_get_path(this.v, Module.core.v);
          var ret = Module.UTF8ToString(cret);

          Module._free(cret);

          return "core." + ret;
        }
      });
      Object.defineProperty(SweObj.prototype, "jsonData", {
        get: function get() {
          var cret = obj_get_json_data_str(this.v);
          var ret = Module.UTF8ToString(cret);

          Module._free(cret);

          return ret ? JSON.parse(ret) : undefined;
        }
      });
      Object.defineProperty(SweObj.prototype, "icrs", {
        get: function get() {
          return this.radec;
        }
      });

      SweObj.prototype._call = function (attr, arg) {
        if (arg === undefined || arg === null) arg = 0;else arg = JSON.stringify(arg);
        var cret = obj_call_json_str(this.v, attr, arg);
        var ret = Module.UTF8ToString(cret);

        Module._free(cret);

        if (!ret) return null;
        ret = JSON.parse(ret);
        if (!ret.swe_) return ret;

        if (ret.type === "obj") {
          var v = parseInt(ret.v);
          return v ? new SweObj(v) : null;
        }

        return ret.v;
      };

      SweObj.prototype.addDataSource = function (args) {
        var add_data_source = Module.cwrap("module_add_data_source", "number", ["number", "string", "string"]);
        add_data_source(this.v, args.url, args.key || 0);
      };

      Module["getModule"] = function (name) {
        var obj = core_get_module(name);
        return obj ? new SweObj(obj) : null;
      };

      Module["getObj"] = function (name) {
        assert(typeof name == "string");
        var obj = core_search(name);
        return obj ? new SweObj(obj) : null;
      };

      Module["change"] = function (callback, context) {
        g_listeners.push({
          "obj": null,
          "ctx": context ? context : null,
          "attr": null,
          "callback": callback
        });
      };

      Module["getTree"] = function (detailed) {
        return Module.core.getTree(detailed);
      };

      Module["createLayer"] = function (data) {
        return Module.core.add("layer", data);
      };

      function stringToC(str) {
        var size = Module.lengthBytesUTF8(str);

        var ptr = Module._malloc(size + 1);

        Module.writeAsciiToMemory(str, ptr, false);
        return ptr;
      }

      Module["createObj"] = function (type, args) {
        args = args ? stringToC(JSON.stringify(args)) : 0;
        var ctype = stringToC(type);

        var ret = Module._obj_create_str(ctype, args);

        Module._free(type);

        Module._free(args);

        ret = ret ? new SweObj(ret) : null;
        if (type === "geojson") Module.onGeojsonObj(ret);
        if (type === "geojson-survey") Module.onGeojsonSurveyObj(ret);
        return ret;
      };

      var onObjChanged = Module.addFunction(function (objPtr, attr) {
        attr = Module.UTF8ToString(attr);

        for (var i = 0; i < g_listeners.length; i++) {
          var listener = g_listeners[i];

          if ((listener.obj === null || listener.obj === objPtr) && (listener.attr === null || listener.attr === attr)) {
            var obj = new SweObj(objPtr);
            listener.callback.apply(listener.ctx, [obj, attr]);
          }
        }
      }, "vii");

      Module._module_add_global_listener(onObjChanged);

      Module["getTree"] = function () {
        return Module.core.getTree();
      };

      Module["getValue"] = function (path) {
        var elems = path.split(".");
        var attr = elems.pop();
        var objPath = elems.join(".");
        var obj = Module.core[objPath] || Module.getModule("core." + objPath);
        var value = obj[attr];
        if (value && Object(_work_node_modules_babel_runtime_helpers_esm_typeof__WEBPACK_IMPORTED_MODULE_1__[/* default */ "a"])(value) === "object" && value.swe_) value = value.v;
        return value;
      };

      Module["_setValue"] = Module.setValue;

      Module["setValue"] = function (path, value) {
        var elems = path.split(".");
        var attr = elems.pop();
        var objPath = elems.join(".");
        var obj = Module.core[objPath] || Module.getModule("core." + objPath);
        obj[attr] = value;
      };

      Module["onValueChanged"] = function (callback) {
        Module.change(function (obj, attr) {
          var path = obj.path + "." + attr;
          var value = obj[attr];
          if (value && Object(_work_node_modules_babel_runtime_helpers_esm_typeof__WEBPACK_IMPORTED_MODULE_1__[/* default */ "a"])(value) === "object" && value.swe_) value = value.v;
          path = path.substr(5);
          callback(path, value);
        });
      };

      Module["SweObj"] = SweObj;
    });

    function fillColorPtr(color, ptr) {
      Module._geojson_set_color_ptr_(ptr, color[0], color[1], color[2], color[3]);
    }

    function fillBoolPtr(value, ptr) {
      Module._geojson_set_bool_ptr_(ptr, value);
    }

    function setData(obj, data) {
      Module._geojson_remove_all_features(obj.v);

      obj._features = data.features;

      var _iterator = Object(_work_node_modules_babel_runtime_helpers_esm_createForOfIteratorHelper__WEBPACK_IMPORTED_MODULE_0__[/* default */ "a"])(data.features),
          _step;

      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var feature = _step.value;
          var geo = feature.geometry;

          if (geo.type !== "Polygon") {
            console.error("Only support polygon geometry");
            continue;
          }

          if (geo.coordinates.length != 1) {
            console.error("Only support single ring polygons");
            continue;
          }

          var coordinates = geo.coordinates[0];
          var size = coordinates.length;

          var ptr = Module._malloc(size * 16);

          for (var _i4 = 0; _i4 < size; _i4++) {
            Module._setValue(ptr + _i4 * 16 + 0, coordinates[_i4][0], "double");

            Module._setValue(ptr + _i4 * 16 + 8, coordinates[_i4][1], "double");
          }

          Module._geojson_add_poly_feature(obj.v, size, ptr);

          Module._free(ptr);
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
    }

    function filterAll(obj, callback) {
      var features = obj._features;
      var fn = Module.addFunction(function (idx, fillPtr, strokePtr) {
        var r = callback(idx, features[idx]);
        if (r === false) return 0;
        if (r === true) return 1;
        if (r.fill) fillColorPtr(r.fill, fillPtr);
        if (r.stroke) fillColorPtr(r.stroke, strokePtr);
        var ret = r.visible === false ? 0 : 1;
        if (r.blink === true) ret |= 2;
        return ret;
      }, "iiii");

      Module._geojson_filter_all(obj.v, fn);

      Module.removeFunction(fn);
    }

    function queryRenderedFeatureIds(obj, point) {
      if (Object(_work_node_modules_babel_runtime_helpers_esm_typeof__WEBPACK_IMPORTED_MODULE_1__[/* default */ "a"])(point) === "object") {
        point = [point.x, point.y];
      }

      var pointPtr = Module._malloc(16);

      Module._setValue(pointPtr + 0, point[0], "double");

      Module._setValue(pointPtr + 8, point[1], "double");

      var size = 128;

      var retPtr = Module._malloc(4 * size);

      var nb = Module._geojson_query_rendered_features(obj.v, pointPtr, size, retPtr);

      var ret = [];

      for (var _i5 = 0; _i5 < nb; _i5++) {
        ret.push(Module._getValue(retPtr + _i5 * 4, "i32"));
      }

      Module._free(pointPtr);

      Module._free(retPtr);

      return ret;
    }

    Module["onGeojsonObj"] = function (obj) {
      var filterFn = null;
      Object.defineProperty(obj, "filter", {
        set: function set(filter) {
          if (filterFn) Module.removeFunction(filterFn);
          filterFn = Module.addFunction(function (img, id, fillPtr, strokePtr, blinkPtr, hiddenPtr) {
            var r = filter(id);
            if (r.fill) fillColorPtr(r.fill, fillPtr);
            if (r.stroke) fillColorPtr(r.stroke, strokePtr);
            if (r.stroke) fillColorPtr(r.stroke, strokePtr);
            if (r.blink !== undefined) fillBoolPtr(r.blink, blinkPtr);
            if (r.hidden !== undefined) fillBoolPtr(r.hidden, hiddenPtr);
          }, "viiiiii");

          obj._call("filter", filterFn);
        }
      });

      obj.setData = function (data) {
        setData(obj, data);
      };

      obj.filterAll = function (callback) {
        filterAll(obj, callback);
      };

      obj.queryRenderedFeatureIds = function (point) {
        return queryRenderedFeatureIds(obj, point);
      };
    };

    var g_tiles = {};

    function asBox(box) {
      if (!(box instanceof Array)) {
        return [[box.x, box.y], [box.x, box.y]];
      }

      assert(box instanceof Array);
      return box.map(function (v) {
        if (!(v instanceof Array)) {
          return [v.x, v.y];
        }

        return v;
      });
    }

    function surveyQueryRenderedFeatures(obj, box) {
      box = asBox(box);

      var boxPtr = Module._malloc(32);

      Module._setValue(boxPtr + 0, box[0][0], "double");

      Module._setValue(boxPtr + 8, box[0][1], "double");

      Module._setValue(boxPtr + 16, box[1][0], "double");

      Module._setValue(boxPtr + 24, box[1][1], "double");

      var size = 1024;

      var tilesPtr = Module._malloc(4 * size);

      var indexPtr = Module._malloc(4 * size);

      var nb = Module._geojson_survey_query_rendered_features(obj.v, boxPtr, size, tilesPtr, indexPtr);

      var ret = [];

      for (var _i6 = 0; _i6 < nb; _i6++) {
        var tile = Module._getValue(tilesPtr + _i6 * 4, "i32*");

        var idx = Module._getValue(indexPtr + _i6 * 4, "i32");

        ret.push(g_tiles[tile][idx]);
      }

      Module._free(boxPtr);

      Module._free(indexPtr);

      Module._free(tilesPtr);

      return ret;
    }

    var onNewTile = function onNewTile(img, json) {
      json = Module.UTF8ToString(json);
      json = JSON.parse(json);
      g_tiles[img] = json.features;
    };

    var onNewTileSet = false;

    Module["onGeojsonSurveyObj"] = function (obj) {
      if (!onNewTileSet) {
        Module._geojson_set_on_new_tile_callback(Module.addFunction(onNewTile, "vii"));

        onNewTileSet = true;
      }

      Object.defineProperty(obj, "filter", {
        set: function set(filter) {
          if (obj._filterFn) Module.removeFunction(obj._filterFn);
          obj._filterFn = Module.addFunction(function (img, id, fillPtr, strokePtr, blinkPtr, hiddenPtr) {
            var features = g_tiles[img];
            var r = filter(features[id]);
            if (r.fill) fillColorPtr(r.fill, fillPtr);
            if (r.stroke) fillColorPtr(r.stroke, strokePtr);
            if (r.blink !== undefined) fillBoolPtr(r.blink, blinkPtr);
            if (r.hidden !== undefined) fillBoolPtr(r.hidden, hiddenPtr);
          }, "viiiiii");

          obj._call("filter", obj._filterFn);
        }
      });

      obj.queryRenderedFeatures = function (point) {
        return surveyQueryRenderedFeatures(obj, point);
      };
    };

    Module.afterInit(function () {
      if (!Module.canvas) return;
      var mouseDown = false;
      var mouseButtons = 0;
      var mousePos;

      var render = function render(timestamp) {
        if (mouseDown) Module._core_on_mouse(0, 1, mousePos.x, mousePos.y, mouseButtons);
        var canvas = Module.canvas;
        var dpr = window.devicePixelRatio || 1;
        var rect = canvas.getBoundingClientRect();
        var displayWidth = rect.width;
        var displayHeight = rect.height;
        var sizeChanged = canvas.width !== displayWidth || canvas.height !== displayHeight;

        if (sizeChanged) {
          canvas.width = displayWidth * dpr;
          canvas.height = displayHeight * dpr;
        }

        Module._core_update();

        Module._core_render(displayWidth, displayHeight, dpr);

        window.requestAnimationFrame(render);
      };

      var fixPageXY = function fixPageXY(e) {
        if (e.pageX == null && e.clientX != null) {
          var html = document.documentElement;
          var body = document.body;
          e.pageX = e.clientX + (html.scrollLeft || body && body.scrollLeft || 0);
          e.pageX -= html.clientLeft || 0;
          e.pageY = e.clientY + (html.scrollTop || body && body.scrollTop || 0);
          e.pageY -= html.clientTop || 0;
        }
      };

      var setupMouse = function setupMouse() {
        var canvas = Module.canvas;

        function getMousePos(evt) {
          var rect = canvas.getBoundingClientRect();
          return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
          };
        }

        canvas.addEventListener("mousedown", function (e) {
          var that = this;
          e = e || event;
          fixPageXY(e);
          mouseDown = true;
          mousePos = getMousePos(e);
          mouseButtons = e.buttons;

          document.onmouseup = function (e) {
            e = e || event;
            fixPageXY(e);
            mouseDown = false;
            mousePos = getMousePos(e);

            Module._core_on_mouse(0, 0, mousePos.x, mousePos.y, mouseButtons);
          };

          document.onmouseleave = function (e) {
            mouseDown = false;
          };

          document.onmousemove = function (e) {
            e = e || event;
            fixPageXY(e);
            mousePos = getMousePos(e);
          };
        });
        canvas.addEventListener("touchstart", function (e) {
          var rect = canvas.getBoundingClientRect();

          for (var i = 0; i < e.changedTouches.length; i++) {
            var id = e.changedTouches[i].identifier;
            var relX = e.changedTouches[i].pageX - rect.left;
            var relY = e.changedTouches[i].pageY - rect.top;

            Module._core_on_mouse(id, 1, relX, relY, 1);
          }
        }, {
          passive: true
        });
        canvas.addEventListener("touchmove", function (e) {
          e.preventDefault();
          var rect = canvas.getBoundingClientRect();

          for (var i = 0; i < e.changedTouches.length; i++) {
            var id = e.changedTouches[i].identifier;
            var relX = e.changedTouches[i].pageX - rect.left;
            var relY = e.changedTouches[i].pageY - rect.top;

            Module._core_on_mouse(id, -1, relX, relY, 1);
          }
        }, {
          passive: false
        });
        canvas.addEventListener("touchend", function (e) {
          var rect = canvas.getBoundingClientRect();

          for (var i = 0; i < e.changedTouches.length; i++) {
            var id = e.changedTouches[i].identifier;
            var relX = e.changedTouches[i].pageX - rect.left;
            var relY = e.changedTouches[i].pageY - rect.top;

            Module._core_on_mouse(id, 0, relX, relY, 1);
          }
        });

        function getMouseWheelDelta(event) {
          var delta = 0;

          switch (event.type) {
            case "DOMMouseScroll":
              delta = -event.detail;
              break;

            case "mousewheel":
              delta = event.wheelDelta / 120;
              break;

            default:
              throw "unrecognized mouse wheel event: " + event.type;
          }

          return delta;
        }

        var onWheelEvent = function onWheelEvent(e) {
          e.preventDefault();
          fixPageXY(e);
          var pos = getMousePos(e);
          var zoom_factor = 1.05;
          var delta = getMouseWheelDelta(e) * 2;

          Module._core_on_zoom(Math.pow(zoom_factor, delta), pos.x, pos.y);

          return false;
        };

        canvas.addEventListener("mousewheel", onWheelEvent, {
          passive: false
        });
        canvas.addEventListener("DOMMouseScroll", onWheelEvent, {
          passive: false
        });

        canvas.oncontextmenu = function (e) {
          e.preventDefault();
          e.stopPropagation();
        };
      };

      setupMouse();
      window.requestAnimationFrame(render);
    });
    var moduleOverrides = {};
    var key;

    for (key in Module) {
      if (Module.hasOwnProperty(key)) {
        moduleOverrides[key] = Module[key];
      }
    }

    var arguments_ = [];
    var thisProgram = "./this.program";

    var quit_ = function quit_(status, toThrow) {
      throw toThrow;
    };

    var ENVIRONMENT_IS_WEB = false;
    var ENVIRONMENT_IS_WORKER = false;
    var ENVIRONMENT_IS_NODE = false;
    var ENVIRONMENT_IS_SHELL = false;
    ENVIRONMENT_IS_WEB = (typeof window === "undefined" ? "undefined" : Object(_work_node_modules_babel_runtime_helpers_esm_typeof__WEBPACK_IMPORTED_MODULE_1__[/* default */ "a"])(window)) === "object";
    ENVIRONMENT_IS_WORKER = typeof importScripts === "function";
    ENVIRONMENT_IS_NODE = (typeof process === "undefined" ? "undefined" : Object(_work_node_modules_babel_runtime_helpers_esm_typeof__WEBPACK_IMPORTED_MODULE_1__[/* default */ "a"])(process)) === "object" && Object(_work_node_modules_babel_runtime_helpers_esm_typeof__WEBPACK_IMPORTED_MODULE_1__[/* default */ "a"])(process.versions) === "object" && typeof process.versions.node === "string";
    ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
    var scriptDirectory = "";

    function locateFile(path) {
      if (Module["locateFile"]) {
        return Module["locateFile"](path, scriptDirectory);
      }

      return scriptDirectory + path;
    }

    var read_, readAsync, readBinary, setWindowTitle;
    var nodeFS;
    var nodePath;

    if (ENVIRONMENT_IS_NODE) {
      if (ENVIRONMENT_IS_WORKER) {
        scriptDirectory = __webpack_require__("df7c").dirname(scriptDirectory) + "/";
      } else {
        scriptDirectory = __dirname + "/";
      }

      read_ = function shell_read(filename, binary) {
        if (!nodeFS) nodeFS = __webpack_require__("3e8f");
        if (!nodePath) nodePath = __webpack_require__("df7c");
        filename = nodePath["normalize"](filename);
        return nodeFS["readFileSync"](filename, binary ? null : "utf8");
      };

      readBinary = function readBinary(filename) {
        var ret = read_(filename, true);

        if (!ret.buffer) {
          ret = new Uint8Array(ret);
        }

        assert(ret.buffer);
        return ret;
      };

      if (process["argv"].length > 1) {
        thisProgram = process["argv"][1].replace(/\\/g, "/");
      }

      arguments_ = process["argv"].slice(2);
      process["on"]("uncaughtException", function (ex) {
        if (!(ex instanceof ExitStatus)) {
          throw ex;
        }
      });
      process["on"]("unhandledRejection", abort);

      quit_ = function quit_(status) {
        process["exit"](status);
      };

      Module["inspect"] = function () {
        return "[Emscripten Module object]";
      };
    } else if (ENVIRONMENT_IS_SHELL) {
      if (typeof read != "undefined") {
        read_ = function shell_read(f) {
          return read(f);
        };
      }

      readBinary = function readBinary(f) {
        var data;

        if (typeof readbuffer === "function") {
          return new Uint8Array(readbuffer(f));
        }

        data = read(f, "binary");
        assert(Object(_work_node_modules_babel_runtime_helpers_esm_typeof__WEBPACK_IMPORTED_MODULE_1__[/* default */ "a"])(data) === "object");
        return data;
      };

      if (typeof scriptArgs != "undefined") {
        arguments_ = scriptArgs;
      } else if (typeof arguments != "undefined") {
        arguments_ = arguments;
      }

      if (typeof quit === "function") {
        quit_ = function quit_(status) {
          quit(status);
        };
      }

      if (typeof print !== "undefined") {
        if (typeof console === "undefined") console = {};
        console.log = print;
        console.warn = console.error = typeof printErr !== "undefined" ? printErr : print;
      }
    } else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
      if (ENVIRONMENT_IS_WORKER) {
        scriptDirectory = self.location.href;
      } else if (document.currentScript) {
        scriptDirectory = document.currentScript.src;
      }

      if (_scriptDir) {
        scriptDirectory = _scriptDir;
      }

      if (scriptDirectory.indexOf("blob:") !== 0) {
        scriptDirectory = scriptDirectory.substr(0, scriptDirectory.lastIndexOf("/") + 1);
      } else {
        scriptDirectory = "";
      }

      {
        read_ = function shell_read(url) {
          var xhr = new XMLHttpRequest();
          xhr.open("GET", url, false);
          xhr.send(null);
          return xhr.responseText;
        };

        if (ENVIRONMENT_IS_WORKER) {
          readBinary = function readBinary(url) {
            var xhr = new XMLHttpRequest();
            xhr.open("GET", url, false);
            xhr.responseType = "arraybuffer";
            xhr.send(null);
            return new Uint8Array(xhr.response);
          };
        }

        readAsync = function readAsync(url, onload, onerror) {
          var xhr = new XMLHttpRequest();
          xhr.open("GET", url, true);
          xhr.responseType = "arraybuffer";

          xhr.onload = function xhr_onload() {
            if (xhr.status == 200 || xhr.status == 0 && xhr.response) {
              onload(xhr.response);
              return;
            }

            onerror();
          };

          xhr.onerror = onerror;
          xhr.send(null);
        };
      }

      setWindowTitle = function setWindowTitle(title) {
        document.title = title;
      };
    } else {}

    var out = Module["print"] || console.log.bind(console);
    var err = Module["printErr"] || console.warn.bind(console);

    for (key in moduleOverrides) {
      if (moduleOverrides.hasOwnProperty(key)) {
        Module[key] = moduleOverrides[key];
      }
    }

    moduleOverrides = null;
    if (Module["arguments"]) arguments_ = Module["arguments"];
    if (Module["thisProgram"]) thisProgram = Module["thisProgram"];
    if (Module["quit"]) quit_ = Module["quit"];

    function dynamicAlloc(size) {
      var ret = HEAP32[DYNAMICTOP_PTR >> 2];
      var end = ret + size + 15 & -16;
      HEAP32[DYNAMICTOP_PTR >> 2] = end;
      return ret;
    }

    function getNativeTypeSize(type) {
      switch (type) {
        case "i1":
        case "i8":
          return 1;

        case "i16":
          return 2;

        case "i32":
          return 4;

        case "i64":
          return 8;

        case "float":
          return 4;

        case "double":
          return 8;

        default:
          {
            if (type[type.length - 1] === "*") {
              return 4;
            } else if (type[0] === "i") {
              var bits = Number(type.substr(1));
              assert(bits % 8 === 0, "getNativeTypeSize invalid bits " + bits + ", type " + type);
              return bits / 8;
            } else {
              return 0;
            }
          }
      }
    }

    function warnOnce(text) {
      if (!warnOnce.shown) warnOnce.shown = {};

      if (!warnOnce.shown[text]) {
        warnOnce.shown[text] = 1;
        err(text);
      }
    }

    function convertJsFunctionToWasm(func, sig) {
      if (typeof WebAssembly.Function === "function") {
        var typeNames = {
          "i": "i32",
          "j": "i64",
          "f": "f32",
          "d": "f64"
        };
        var type = {
          parameters: [],
          results: sig[0] == "v" ? [] : [typeNames[sig[0]]]
        };

        for (var i = 1; i < sig.length; ++i) {
          type.parameters.push(typeNames[sig[i]]);
        }

        return new WebAssembly.Function(type, func);
      }

      var typeSection = [1, 0, 1, 96];
      var sigRet = sig.slice(0, 1);
      var sigParam = sig.slice(1);
      var typeCodes = {
        "i": 127,
        "j": 126,
        "f": 125,
        "d": 124
      };
      typeSection.push(sigParam.length);

      for (var i = 0; i < sigParam.length; ++i) {
        typeSection.push(typeCodes[sigParam[i]]);
      }

      if (sigRet == "v") {
        typeSection.push(0);
      } else {
        typeSection = typeSection.concat([1, typeCodes[sigRet]]);
      }

      typeSection[1] = typeSection.length - 2;
      var bytes = new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0].concat(typeSection, [2, 7, 1, 1, 101, 1, 102, 0, 0, 7, 5, 1, 1, 102, 0, 0]));
      var module = new WebAssembly.Module(bytes);
      var instance = new WebAssembly.Instance(module, {
        "e": {
          "f": func
        }
      });
      var wrappedFunc = instance.exports["f"];
      return wrappedFunc;
    }

    var freeTableIndexes = [];
    var functionsInTableMap;

    function addFunctionWasm(func, sig) {
      var table = wasmTable;

      if (!functionsInTableMap) {
        functionsInTableMap = new WeakMap();

        for (var i = 0; i < table.length; i++) {
          var item = table.get(i);

          if (item) {
            functionsInTableMap.set(item, i);
          }
        }
      }

      if (functionsInTableMap.has(func)) {
        return functionsInTableMap.get(func);
      }

      var ret;

      if (freeTableIndexes.length) {
        ret = freeTableIndexes.pop();
      } else {
        ret = table.length;

        try {
          table.grow(1);
        } catch (err) {
          if (!(err instanceof RangeError)) {
            throw err;
          }

          throw "Unable to grow wasm table. Set ALLOW_TABLE_GROWTH.";
        }
      }

      try {
        table.set(ret, func);
      } catch (err) {
        if (!(err instanceof TypeError)) {
          throw err;
        }

        var wrapped = convertJsFunctionToWasm(func, sig);
        table.set(ret, wrapped);
      }

      functionsInTableMap.set(func, ret);
      return ret;
    }

    function removeFunctionWasm(index) {
      functionsInTableMap.delete(wasmTable.get(index));
      freeTableIndexes.push(index);
    }

    function addFunction(func, sig) {
      return addFunctionWasm(func, sig);
    }

    function removeFunction(index) {
      removeFunctionWasm(index);
    }

    var tempRet0 = 0;

    var setTempRet0 = function setTempRet0(value) {
      tempRet0 = value;
    };

    var getTempRet0 = function getTempRet0() {
      return tempRet0;
    };

    var wasmBinary;
    if (Module["wasmBinary"]) wasmBinary = Module["wasmBinary"];
    var noExitRuntime;
    if (Module["noExitRuntime"]) noExitRuntime = Module["noExitRuntime"];

    if ((typeof WebAssembly === "undefined" ? "undefined" : Object(_work_node_modules_babel_runtime_helpers_esm_typeof__WEBPACK_IMPORTED_MODULE_1__[/* default */ "a"])(WebAssembly)) !== "object") {
      err("no native wasm support detected");
    }

    function setValue(ptr, value, type, noSafe) {
      type = type || "i8";
      if (type.charAt(type.length - 1) === "*") type = "i32";

      switch (type) {
        case "i1":
          HEAP8[ptr >> 0] = value;
          break;

        case "i8":
          HEAP8[ptr >> 0] = value;
          break;

        case "i16":
          HEAP16[ptr >> 1] = value;
          break;

        case "i32":
          HEAP32[ptr >> 2] = value;
          break;

        case "i64":
          tempI64 = [value >>> 0, (tempDouble = value, +Math_abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math_min(+Math_floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math_ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)], HEAP32[ptr >> 2] = tempI64[0], HEAP32[ptr + 4 >> 2] = tempI64[1];
          break;

        case "float":
          HEAPF32[ptr >> 2] = value;
          break;

        case "double":
          HEAPF64[ptr >> 3] = value;
          break;

        default:
          abort("invalid type for setValue: " + type);
      }
    }

    function getValue(ptr, type, noSafe) {
      type = type || "i8";
      if (type.charAt(type.length - 1) === "*") type = "i32";

      switch (type) {
        case "i1":
          return HEAP8[ptr >> 0];

        case "i8":
          return HEAP8[ptr >> 0];

        case "i16":
          return HEAP16[ptr >> 1];

        case "i32":
          return HEAP32[ptr >> 2];

        case "i64":
          return HEAP32[ptr >> 2];

        case "float":
          return HEAPF32[ptr >> 2];

        case "double":
          return HEAPF64[ptr >> 3];

        default:
          abort("invalid type for getValue: " + type);
      }

      return null;
    }

    var wasmMemory;
    var wasmTable = new WebAssembly.Table({
      "initial": 448,
      "element": "anyfunc"
    });
    var ABORT = false;
    var EXITSTATUS = 0;

    function assert(condition, text) {
      if (!condition) {
        abort("Assertion failed: " + text);
      }
    }

    function getCFunc(ident) {
      var func = Module["_" + ident];
      assert(func, "Cannot call unknown function " + ident + ", make sure it is exported");
      return func;
    }

    function ccall(ident, returnType, argTypes, args, opts) {
      var toC = {
        "string": function string(str) {
          var ret = 0;

          if (str !== null && str !== undefined && str !== 0) {
            var len = (str.length << 2) + 1;
            ret = stackAlloc(len);
            stringToUTF8(str, ret, len);
          }

          return ret;
        },
        "array": function array(arr) {
          var ret = stackAlloc(arr.length);
          writeArrayToMemory(arr, ret);
          return ret;
        }
      };

      function convertReturnValue(ret) {
        if (returnType === "string") return UTF8ToString(ret);
        if (returnType === "boolean") return Boolean(ret);
        return ret;
      }

      var func = getCFunc(ident);
      var cArgs = [];
      var stack = 0;

      if (args) {
        for (var i = 0; i < args.length; i++) {
          var converter = toC[argTypes[i]];

          if (converter) {
            if (stack === 0) stack = stackSave();
            cArgs[i] = converter(args[i]);
          } else {
            cArgs[i] = args[i];
          }
        }
      }

      var ret = func.apply(null, cArgs);
      ret = convertReturnValue(ret);
      if (stack !== 0) stackRestore(stack);
      return ret;
    }

    function cwrap(ident, returnType, argTypes, opts) {
      argTypes = argTypes || [];
      var numericArgs = argTypes.every(function (type) {
        return type === "number";
      });
      var numericRet = returnType !== "string";

      if (numericRet && numericArgs && !opts) {
        return getCFunc(ident);
      }

      return function () {
        return ccall(ident, returnType, argTypes, arguments, opts);
      };
    }

    var ALLOC_NORMAL = 0;
    var ALLOC_NONE = 3;

    function allocate(slab, types, allocator, ptr) {
      var zeroinit, size;

      if (typeof slab === "number") {
        zeroinit = true;
        size = slab;
      } else {
        zeroinit = false;
        size = slab.length;
      }

      var singleType = typeof types === "string" ? types : null;
      var ret;

      if (allocator == ALLOC_NONE) {
        ret = ptr;
      } else {
        ret = [_malloc, stackAlloc, dynamicAlloc][allocator](Math.max(size, singleType ? 1 : types.length));
      }

      if (zeroinit) {
        var stop;
        ptr = ret;
        assert((ret & 3) == 0);
        stop = ret + (size & ~3);

        for (; ptr < stop; ptr += 4) {
          HEAP32[ptr >> 2] = 0;
        }

        stop = ret + size;

        while (ptr < stop) {
          HEAP8[ptr++ >> 0] = 0;
        }

        return ret;
      }

      if (singleType === "i8") {
        if (slab.subarray || slab.slice) {
          HEAPU8.set(slab, ret);
        } else {
          HEAPU8.set(new Uint8Array(slab), ret);
        }

        return ret;
      }

      var i = 0,
          type,
          typeSize,
          previousType;

      while (i < size) {
        var curr = slab[i];
        type = singleType || types[i];

        if (type === 0) {
          i++;
          continue;
        }

        if (type == "i64") type = "i32";
        setValue(ret + i, curr, type);

        if (previousType !== type) {
          typeSize = getNativeTypeSize(type);
          previousType = type;
        }

        i += typeSize;
      }

      return ret;
    }

    var UTF8Decoder = typeof TextDecoder !== "undefined" ? new TextDecoder("utf8") : undefined;

    function UTF8ArrayToString(heap, idx, maxBytesToRead) {
      var endIdx = idx + maxBytesToRead;
      var endPtr = idx;

      while (heap[endPtr] && !(endPtr >= endIdx)) {
        ++endPtr;
      }

      if (endPtr - idx > 16 && heap.subarray && UTF8Decoder) {
        return UTF8Decoder.decode(heap.subarray(idx, endPtr));
      } else {
        var str = "";

        while (idx < endPtr) {
          var u0 = heap[idx++];

          if (!(u0 & 128)) {
            str += String.fromCharCode(u0);
            continue;
          }

          var u1 = heap[idx++] & 63;

          if ((u0 & 224) == 192) {
            str += String.fromCharCode((u0 & 31) << 6 | u1);
            continue;
          }

          var u2 = heap[idx++] & 63;

          if ((u0 & 240) == 224) {
            u0 = (u0 & 15) << 12 | u1 << 6 | u2;
          } else {
            u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | heap[idx++] & 63;
          }

          if (u0 < 65536) {
            str += String.fromCharCode(u0);
          } else {
            var ch = u0 - 65536;
            str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023);
          }
        }
      }

      return str;
    }

    function UTF8ToString(ptr, maxBytesToRead) {
      return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : "";
    }

    function stringToUTF8Array(str, heap, outIdx, maxBytesToWrite) {
      if (!(maxBytesToWrite > 0)) return 0;
      var startIdx = outIdx;
      var endIdx = outIdx + maxBytesToWrite - 1;

      for (var i = 0; i < str.length; ++i) {
        var u = str.charCodeAt(i);

        if (u >= 55296 && u <= 57343) {
          var u1 = str.charCodeAt(++i);
          u = 65536 + ((u & 1023) << 10) | u1 & 1023;
        }

        if (u <= 127) {
          if (outIdx >= endIdx) break;
          heap[outIdx++] = u;
        } else if (u <= 2047) {
          if (outIdx + 1 >= endIdx) break;
          heap[outIdx++] = 192 | u >> 6;
          heap[outIdx++] = 128 | u & 63;
        } else if (u <= 65535) {
          if (outIdx + 2 >= endIdx) break;
          heap[outIdx++] = 224 | u >> 12;
          heap[outIdx++] = 128 | u >> 6 & 63;
          heap[outIdx++] = 128 | u & 63;
        } else {
          if (outIdx + 3 >= endIdx) break;
          heap[outIdx++] = 240 | u >> 18;
          heap[outIdx++] = 128 | u >> 12 & 63;
          heap[outIdx++] = 128 | u >> 6 & 63;
          heap[outIdx++] = 128 | u & 63;
        }
      }

      heap[outIdx] = 0;
      return outIdx - startIdx;
    }

    function stringToUTF8(str, outPtr, maxBytesToWrite) {
      return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);
    }

    function lengthBytesUTF8(str) {
      var len = 0;

      for (var i = 0; i < str.length; ++i) {
        var u = str.charCodeAt(i);
        if (u >= 55296 && u <= 57343) u = 65536 + ((u & 1023) << 10) | str.charCodeAt(++i) & 1023;
        if (u <= 127) ++len;else if (u <= 2047) len += 2;else if (u <= 65535) len += 3;else len += 4;
      }

      return len;
    }

    function writeArrayToMemory(array, buffer) {
      HEAP8.set(array, buffer);
    }

    function writeAsciiToMemory(str, buffer, dontAddNull) {
      for (var i = 0; i < str.length; ++i) {
        HEAP8[buffer++ >> 0] = str.charCodeAt(i);
      }

      if (!dontAddNull) HEAP8[buffer >> 0] = 0;
    }

    var WASM_PAGE_SIZE = 65536;

    function alignUp(x, multiple) {
      if (x % multiple > 0) {
        x += multiple - x % multiple;
      }

      return x;
    }

    var buffer, HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;

    function updateGlobalBufferAndViews(buf) {
      buffer = buf;
      Module["HEAP8"] = HEAP8 = new Int8Array(buf);
      Module["HEAP16"] = HEAP16 = new Int16Array(buf);
      Module["HEAP32"] = HEAP32 = new Int32Array(buf);
      Module["HEAPU8"] = HEAPU8 = new Uint8Array(buf);
      Module["HEAPU16"] = HEAPU16 = new Uint16Array(buf);
      Module["HEAPU32"] = HEAPU32 = new Uint32Array(buf);
      Module["HEAPF32"] = HEAPF32 = new Float32Array(buf);
      Module["HEAPF64"] = HEAPF64 = new Float64Array(buf);
    }

    var DYNAMIC_BASE = 5807104,
        DYNAMICTOP_PTR = 564064;
    var INITIAL_INITIAL_MEMORY = Module["INITIAL_MEMORY"] || 16777216;

    if (Module["wasmMemory"]) {
      wasmMemory = Module["wasmMemory"];
    } else {
      wasmMemory = new WebAssembly.Memory({
        "initial": INITIAL_INITIAL_MEMORY / WASM_PAGE_SIZE,
        "maximum": 2147483648 / WASM_PAGE_SIZE
      });
    }

    if (wasmMemory) {
      buffer = wasmMemory.buffer;
    }

    INITIAL_INITIAL_MEMORY = buffer.byteLength;
    updateGlobalBufferAndViews(buffer);
    HEAP32[DYNAMICTOP_PTR >> 2] = DYNAMIC_BASE;

    function callRuntimeCallbacks(callbacks) {
      while (callbacks.length > 0) {
        var callback = callbacks.shift();

        if (typeof callback == "function") {
          callback(Module);
          continue;
        }

        var func = callback.func;

        if (typeof func === "number") {
          if (callback.arg === undefined) {
            Module["dynCall_v"](func);
          } else {
            Module["dynCall_vi"](func, callback.arg);
          }
        } else {
          func(callback.arg === undefined ? null : callback.arg);
        }
      }
    }

    var __ATPRERUN__ = [];
    var __ATINIT__ = [];
    var __ATMAIN__ = [];
    var __ATPOSTRUN__ = [];
    var runtimeInitialized = false;
    var runtimeExited = false;

    function preRun() {
      if (Module["preRun"]) {
        if (typeof Module["preRun"] == "function") Module["preRun"] = [Module["preRun"]];

        while (Module["preRun"].length) {
          addOnPreRun(Module["preRun"].shift());
        }
      }

      callRuntimeCallbacks(__ATPRERUN__);
    }

    function initRuntime() {
      runtimeInitialized = true;
      callRuntimeCallbacks(__ATINIT__);
    }

    function preMain() {
      callRuntimeCallbacks(__ATMAIN__);
    }

    function exitRuntime() {
      runtimeExited = true;
    }

    function postRun() {
      if (Module["postRun"]) {
        if (typeof Module["postRun"] == "function") Module["postRun"] = [Module["postRun"]];

        while (Module["postRun"].length) {
          addOnPostRun(Module["postRun"].shift());
        }
      }

      callRuntimeCallbacks(__ATPOSTRUN__);
    }

    function addOnPreRun(cb) {
      __ATPRERUN__.unshift(cb);
    }

    function addOnPostRun(cb) {
      __ATPOSTRUN__.unshift(cb);
    }

    var Math_abs = Math.abs;
    var Math_ceil = Math.ceil;
    var Math_floor = Math.floor;
    var Math_min = Math.min;
    var runDependencies = 0;
    var runDependencyWatcher = null;
    var dependenciesFulfilled = null;

    function getUniqueRunDependency(id) {
      return id;
    }

    function addRunDependency(id) {
      runDependencies++;

      if (Module["monitorRunDependencies"]) {
        Module["monitorRunDependencies"](runDependencies);
      }
    }

    function removeRunDependency(id) {
      runDependencies--;

      if (Module["monitorRunDependencies"]) {
        Module["monitorRunDependencies"](runDependencies);
      }

      if (runDependencies == 0) {
        if (runDependencyWatcher !== null) {
          clearInterval(runDependencyWatcher);
          runDependencyWatcher = null;
        }

        if (dependenciesFulfilled) {
          var callback = dependenciesFulfilled;
          dependenciesFulfilled = null;
          callback();
        }
      }
    }

    Module["preloadedImages"] = {};
    Module["preloadedAudios"] = {};

    function abort(what) {
      if (Module["onAbort"]) {
        Module["onAbort"](what);
      }

      what += "";
      out(what);
      err(what);
      ABORT = true;
      EXITSTATUS = 1;
      what = "abort(" + what + "). Build with -s ASSERTIONS=1 for more info.";
      throw new WebAssembly.RuntimeError(what);
    }

    function hasPrefix(str, prefix) {
      return String.prototype.startsWith ? str.startsWith(prefix) : str.indexOf(prefix) === 0;
    }

    var dataURIPrefix = "data:application/octet-stream;base64,";

    function isDataURI(filename) {
      return hasPrefix(filename, dataURIPrefix);
    }

    var fileURIPrefix = "file://";

    function isFileURI(filename) {
      return hasPrefix(filename, fileURIPrefix);
    }

    var wasmBinaryFile = "stellarium-web-engine.wasm";

    if (!isDataURI(wasmBinaryFile)) {
      wasmBinaryFile = locateFile(wasmBinaryFile);
    }

    function getBinary() {
      try {
        if (wasmBinary) {
          return new Uint8Array(wasmBinary);
        }

        if (readBinary) {
          return readBinary(wasmBinaryFile);
        } else {
          throw "both async and sync fetching of the wasm failed";
        }
      } catch (err) {
        abort(err);
      }
    }

    function getBinaryPromise() {
      if (!wasmBinary && (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) && typeof fetch === "function" && !isFileURI(wasmBinaryFile)) {
        return fetch(wasmBinaryFile, {
          credentials: "same-origin"
        }).then(function (response) {
          if (!response["ok"]) {
            throw "failed to load wasm binary file at '" + wasmBinaryFile + "'";
          }

          return response["arrayBuffer"]();
        }).catch(function () {
          return getBinary();
        });
      }

      return new Promise(function (resolve, reject) {
        resolve(getBinary());
      });
    }

    function createWasm() {
      var info = {
        "a": asmLibraryArg
      };

      function receiveInstance(instance, module) {
        var exports = instance.exports;
        Module["asm"] = exports;
        removeRunDependency("wasm-instantiate");
      }

      addRunDependency("wasm-instantiate");

      function receiveInstantiatedSource(output) {
        receiveInstance(output["instance"]);
      }

      function instantiateArrayBuffer(receiver) {
        return getBinaryPromise().then(function (binary) {
          return WebAssembly.instantiate(binary, info);
        }).then(receiver, function (reason) {
          err("failed to asynchronously prepare wasm: " + reason);
          abort(reason);
        });
      }

      function instantiateAsync() {
        if (!wasmBinary && typeof WebAssembly.instantiateStreaming === "function" && !isDataURI(wasmBinaryFile) && !isFileURI(wasmBinaryFile) && typeof fetch === "function") {
          fetch(wasmBinaryFile, {
            credentials: "same-origin"
          }).then(function (response) {
            var result = WebAssembly.instantiateStreaming(response, info);
            return result.then(receiveInstantiatedSource, function (reason) {
              err("wasm streaming compile failed: " + reason);
              err("falling back to ArrayBuffer instantiation");
              return instantiateArrayBuffer(receiveInstantiatedSource);
            });
          });
        } else {
          return instantiateArrayBuffer(receiveInstantiatedSource);
        }
      }

      if (Module["instantiateWasm"]) {
        try {
          var exports = Module["instantiateWasm"](info, receiveInstance);
          return exports;
        } catch (e) {
          err("Module.instantiateWasm callback failed with error: " + e);
          return false;
        }
      }

      instantiateAsync();
      return {};
    }

    var tempDouble;
    var tempI64;

    __ATINIT__.push({
      func: function func() {
        ___wasm_call_ctors();
      }
    });

    function _emscripten_set_main_loop_timing(mode, value) {
      Browser.mainLoop.timingMode = mode;
      Browser.mainLoop.timingValue = value;

      if (!Browser.mainLoop.func) {
        return 1;
      }

      if (mode == 0) {
        Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_setTimeout() {
          var timeUntilNextTick = Math.max(0, Browser.mainLoop.tickStartTime + value - _emscripten_get_now()) | 0;
          setTimeout(Browser.mainLoop.runner, timeUntilNextTick);
        };

        Browser.mainLoop.method = "timeout";
      } else if (mode == 1) {
        Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_rAF() {
          Browser.requestAnimationFrame(Browser.mainLoop.runner);
        };

        Browser.mainLoop.method = "rAF";
      } else if (mode == 2) {
        if (typeof setImmediate === "undefined") {
          var setImmediates = [];
          var emscriptenMainLoopMessageId = "setimmediate";

          var Browser_setImmediate_messageHandler = function Browser_setImmediate_messageHandler(event) {
            if (event.data === emscriptenMainLoopMessageId || event.data.target === emscriptenMainLoopMessageId) {
              event.stopPropagation();
              setImmediates.shift()();
            }
          };

          addEventListener("message", Browser_setImmediate_messageHandler, true);

          setImmediate = function Browser_emulated_setImmediate(func) {
            setImmediates.push(func);

            if (ENVIRONMENT_IS_WORKER) {
              if (Module["setImmediates"] === undefined) Module["setImmediates"] = [];
              Module["setImmediates"].push(func);
              postMessage({
                target: emscriptenMainLoopMessageId
              });
            } else postMessage(emscriptenMainLoopMessageId, "*");
          };
        }

        Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_setImmediate() {
          setImmediate(Browser.mainLoop.runner);
        };

        Browser.mainLoop.method = "immediate";
      }

      return 0;
    }

    var _emscripten_get_now;

    if (ENVIRONMENT_IS_NODE) {
      _emscripten_get_now = function _emscripten_get_now() {
        var t = process["hrtime"]();
        return t[0] * 1e3 + t[1] / 1e6;
      };
    } else if (typeof dateNow !== "undefined") {
      _emscripten_get_now = dateNow;
    } else _emscripten_get_now = function _emscripten_get_now() {
      return performance.now();
    };

    function _emscripten_set_main_loop(func, fps, simulateInfiniteLoop, arg, noSetTiming) {
      noExitRuntime = true;
      assert(!Browser.mainLoop.func, "emscripten_set_main_loop: there can only be one main loop function at once: call emscripten_cancel_main_loop to cancel the previous one before setting a new one with different parameters.");
      Browser.mainLoop.func = func;
      Browser.mainLoop.arg = arg;
      var browserIterationFunc;

      if (typeof arg !== "undefined") {
        browserIterationFunc = function browserIterationFunc() {
          Module["dynCall_vi"](func, arg);
        };
      } else {
        browserIterationFunc = function browserIterationFunc() {
          Module["dynCall_v"](func);
        };
      }

      var thisMainLoopId = Browser.mainLoop.currentlyRunningMainloop;

      Browser.mainLoop.runner = function Browser_mainLoop_runner() {
        if (ABORT) return;

        if (Browser.mainLoop.queue.length > 0) {
          var start = Date.now();
          var blocker = Browser.mainLoop.queue.shift();
          blocker.func(blocker.arg);

          if (Browser.mainLoop.remainingBlockers) {
            var remaining = Browser.mainLoop.remainingBlockers;
            var next = remaining % 1 == 0 ? remaining - 1 : Math.floor(remaining);

            if (blocker.counted) {
              Browser.mainLoop.remainingBlockers = next;
            } else {
              next = next + .5;
              Browser.mainLoop.remainingBlockers = (8 * remaining + next) / 9;
            }
          }

          console.log('main loop blocker "' + blocker.name + '" took ' + (Date.now() - start) + " ms");
          Browser.mainLoop.updateStatus();
          if (thisMainLoopId < Browser.mainLoop.currentlyRunningMainloop) return;
          setTimeout(Browser.mainLoop.runner, 0);
          return;
        }

        if (thisMainLoopId < Browser.mainLoop.currentlyRunningMainloop) return;
        Browser.mainLoop.currentFrameNumber = Browser.mainLoop.currentFrameNumber + 1 | 0;

        if (Browser.mainLoop.timingMode == 1 && Browser.mainLoop.timingValue > 1 && Browser.mainLoop.currentFrameNumber % Browser.mainLoop.timingValue != 0) {
          Browser.mainLoop.scheduler();
          return;
        } else if (Browser.mainLoop.timingMode == 0) {
          Browser.mainLoop.tickStartTime = _emscripten_get_now();
        }

        Browser.mainLoop.runIter(browserIterationFunc);
        if (thisMainLoopId < Browser.mainLoop.currentlyRunningMainloop) return;
        if ((typeof SDL === "undefined" ? "undefined" : Object(_work_node_modules_babel_runtime_helpers_esm_typeof__WEBPACK_IMPORTED_MODULE_1__[/* default */ "a"])(SDL)) === "object" && SDL.audio && SDL.audio.queueNewAudioData) SDL.audio.queueNewAudioData();
        Browser.mainLoop.scheduler();
      };

      if (!noSetTiming) {
        if (fps && fps > 0) _emscripten_set_main_loop_timing(0, 1e3 / fps);else _emscripten_set_main_loop_timing(1, 1);
        Browser.mainLoop.scheduler();
      }

      if (simulateInfiniteLoop) {
        throw "unwind";
      }
    }

    var Browser = {
      mainLoop: {
        scheduler: null,
        method: "",
        currentlyRunningMainloop: 0,
        func: null,
        arg: 0,
        timingMode: 0,
        timingValue: 0,
        currentFrameNumber: 0,
        queue: [],
        pause: function pause() {
          Browser.mainLoop.scheduler = null;
          Browser.mainLoop.currentlyRunningMainloop++;
        },
        resume: function resume() {
          Browser.mainLoop.currentlyRunningMainloop++;
          var timingMode = Browser.mainLoop.timingMode;
          var timingValue = Browser.mainLoop.timingValue;
          var func = Browser.mainLoop.func;
          Browser.mainLoop.func = null;

          _emscripten_set_main_loop(func, 0, false, Browser.mainLoop.arg, true);

          _emscripten_set_main_loop_timing(timingMode, timingValue);

          Browser.mainLoop.scheduler();
        },
        updateStatus: function updateStatus() {
          if (Module["setStatus"]) {
            var message = Module["statusMessage"] || "Please wait...";
            var remaining = Browser.mainLoop.remainingBlockers;
            var expected = Browser.mainLoop.expectedBlockers;

            if (remaining) {
              if (remaining < expected) {
                Module["setStatus"](message + " (" + (expected - remaining) + "/" + expected + ")");
              } else {
                Module["setStatus"](message);
              }
            } else {
              Module["setStatus"]("");
            }
          }
        },
        runIter: function runIter(func) {
          if (ABORT) return;

          if (Module["preMainLoop"]) {
            var preRet = Module["preMainLoop"]();

            if (preRet === false) {
              return;
            }
          }

          try {
            func();
          } catch (e) {
            if (e instanceof ExitStatus) {
              return;
            } else {
              if (e && Object(_work_node_modules_babel_runtime_helpers_esm_typeof__WEBPACK_IMPORTED_MODULE_1__[/* default */ "a"])(e) === "object" && e.stack) err("exception thrown: " + [e, e.stack]);
              throw e;
            }
          }

          if (Module["postMainLoop"]) Module["postMainLoop"]();
        }
      },
      isFullscreen: false,
      pointerLock: false,
      moduleContextCreatedCallbacks: [],
      workers: [],
      init: function init() {
        if (!Module["preloadPlugins"]) Module["preloadPlugins"] = [];
        if (Browser.initted) return;
        Browser.initted = true;

        try {
          new Blob();
          Browser.hasBlobConstructor = true;
        } catch (e) {
          Browser.hasBlobConstructor = false;
          console.log("warning: no blob constructor, cannot create blobs with mimetypes");
        }

        Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : !Browser.hasBlobConstructor ? console.log("warning: no BlobBuilder") : null;
        Browser.URLObject = typeof window != "undefined" ? window.URL ? window.URL : window.webkitURL : undefined;

        if (!Module.noImageDecoding && typeof Browser.URLObject === "undefined") {
          console.log("warning: Browser does not support creating object URLs. Built-in browser image decoding will not be available.");
          Module.noImageDecoding = true;
        }

        var imagePlugin = {};

        imagePlugin["canHandle"] = function imagePlugin_canHandle(name) {
          return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name);
        };

        imagePlugin["handle"] = function imagePlugin_handle(byteArray, name, onload, onerror) {
          var b = null;

          if (Browser.hasBlobConstructor) {
            try {
              b = new Blob([byteArray], {
                type: Browser.getMimetype(name)
              });

              if (b.size !== byteArray.length) {
                b = new Blob([new Uint8Array(byteArray).buffer], {
                  type: Browser.getMimetype(name)
                });
              }
            } catch (e) {
              warnOnce("Blob constructor present but fails: " + e + "; falling back to blob builder");
            }
          }

          if (!b) {
            var bb = new Browser.BlobBuilder();
            bb.append(new Uint8Array(byteArray).buffer);
            b = bb.getBlob();
          }

          var url = Browser.URLObject.createObjectURL(b);
          var img = new Image();

          img.onload = function img_onload() {
            assert(img.complete, "Image " + name + " could not be decoded");
            var canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            Module["preloadedImages"][name] = canvas;
            Browser.URLObject.revokeObjectURL(url);
            if (onload) onload(byteArray);
          };

          img.onerror = function img_onerror(event) {
            console.log("Image " + url + " could not be decoded");
            if (onerror) onerror();
          };

          img.src = url;
        };

        Module["preloadPlugins"].push(imagePlugin);
        var audioPlugin = {};

        audioPlugin["canHandle"] = function audioPlugin_canHandle(name) {
          return !Module.noAudioDecoding && name.substr(-4) in {
            ".ogg": 1,
            ".wav": 1,
            ".mp3": 1
          };
        };

        audioPlugin["handle"] = function audioPlugin_handle(byteArray, name, onload, onerror) {
          var done = false;

          function finish(audio) {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = audio;
            if (onload) onload(byteArray);
          }

          function fail() {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = new Audio();
            if (onerror) onerror();
          }

          if (Browser.hasBlobConstructor) {
            try {
              var b = new Blob([byteArray], {
                type: Browser.getMimetype(name)
              });
            } catch (e) {
              return fail();
            }

            var url = Browser.URLObject.createObjectURL(b);
            var audio = new Audio();
            audio.addEventListener("canplaythrough", function () {
              finish(audio);
            }, false);

            audio.onerror = function audio_onerror(event) {
              if (done) return;
              console.log("warning: browser could not fully decode audio " + name + ", trying slower base64 approach");

              function encode64(data) {
                var BASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
                var PAD = "=";
                var ret = "";
                var leftchar = 0;
                var leftbits = 0;

                for (var i = 0; i < data.length; i++) {
                  leftchar = leftchar << 8 | data[i];
                  leftbits += 8;

                  while (leftbits >= 6) {
                    var curr = leftchar >> leftbits - 6 & 63;
                    leftbits -= 6;
                    ret += BASE[curr];
                  }
                }

                if (leftbits == 2) {
                  ret += BASE[(leftchar & 3) << 4];
                  ret += PAD + PAD;
                } else if (leftbits == 4) {
                  ret += BASE[(leftchar & 15) << 2];
                  ret += PAD;
                }

                return ret;
              }

              audio.src = "data:audio/x-" + name.substr(-3) + ";base64," + encode64(byteArray);
              finish(audio);
            };

            audio.src = url;
            Browser.safeSetTimeout(function () {
              finish(audio);
            }, 1e4);
          } else {
            return fail();
          }
        };

        Module["preloadPlugins"].push(audioPlugin);

        function pointerLockChange() {
          Browser.pointerLock = document["pointerLockElement"] === Module["canvas"] || document["mozPointerLockElement"] === Module["canvas"] || document["webkitPointerLockElement"] === Module["canvas"] || document["msPointerLockElement"] === Module["canvas"];
        }

        var canvas = Module["canvas"];

        if (canvas) {
          canvas.requestPointerLock = canvas["requestPointerLock"] || canvas["mozRequestPointerLock"] || canvas["webkitRequestPointerLock"] || canvas["msRequestPointerLock"] || function () {};

          canvas.exitPointerLock = document["exitPointerLock"] || document["mozExitPointerLock"] || document["webkitExitPointerLock"] || document["msExitPointerLock"] || function () {};

          canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
          document.addEventListener("pointerlockchange", pointerLockChange, false);
          document.addEventListener("mozpointerlockchange", pointerLockChange, false);
          document.addEventListener("webkitpointerlockchange", pointerLockChange, false);
          document.addEventListener("mspointerlockchange", pointerLockChange, false);

          if (Module["elementPointerLock"]) {
            canvas.addEventListener("click", function (ev) {
              if (!Browser.pointerLock && Module["canvas"].requestPointerLock) {
                Module["canvas"].requestPointerLock();
                ev.preventDefault();
              }
            }, false);
          }
        }
      },
      createContext: function createContext(canvas, useWebGL, setInModule, webGLContextAttributes) {
        if (useWebGL && Module.ctx && canvas == Module.canvas) return Module.ctx;
        var ctx;
        var contextHandle;

        if (useWebGL) {
          var contextAttributes = {
            antialias: false,
            alpha: false,
            majorVersion: typeof WebGL2RenderingContext !== "undefined" ? 2 : 1
          };

          if (webGLContextAttributes) {
            for (var attribute in webGLContextAttributes) {
              contextAttributes[attribute] = webGLContextAttributes[attribute];
            }
          }

          if (typeof GL !== "undefined") {
            contextHandle = GL.createContext(canvas, contextAttributes);

            if (contextHandle) {
              ctx = GL.getContext(contextHandle).GLctx;
            }
          }
        } else {
          ctx = canvas.getContext("2d");
        }

        if (!ctx) return null;

        if (setInModule) {
          if (!useWebGL) assert(typeof GLctx === "undefined", "cannot set in module if GLctx is used, but we are a non-GL context that would replace it");
          Module.ctx = ctx;
          if (useWebGL) GL.makeContextCurrent(contextHandle);
          Module.useWebGL = useWebGL;
          Browser.moduleContextCreatedCallbacks.forEach(function (callback) {
            callback();
          });
          Browser.init();
        }

        return ctx;
      },
      destroyContext: function destroyContext(canvas, useWebGL, setInModule) {},
      fullscreenHandlersInstalled: false,
      lockPointer: undefined,
      resizeCanvas: undefined,
      requestFullscreen: function requestFullscreen(lockPointer, resizeCanvas) {
        Browser.lockPointer = lockPointer;
        Browser.resizeCanvas = resizeCanvas;
        if (typeof Browser.lockPointer === "undefined") Browser.lockPointer = true;
        if (typeof Browser.resizeCanvas === "undefined") Browser.resizeCanvas = false;
        var canvas = Module["canvas"];

        function fullscreenChange() {
          Browser.isFullscreen = false;
          var canvasContainer = canvas.parentNode;

          if ((document["fullscreenElement"] || document["mozFullScreenElement"] || document["msFullscreenElement"] || document["webkitFullscreenElement"] || document["webkitCurrentFullScreenElement"]) === canvasContainer) {
            canvas.exitFullscreen = Browser.exitFullscreen;
            if (Browser.lockPointer) canvas.requestPointerLock();
            Browser.isFullscreen = true;

            if (Browser.resizeCanvas) {
              Browser.setFullscreenCanvasSize();
            } else {
              Browser.updateCanvasDimensions(canvas);
            }
          } else {
            canvasContainer.parentNode.insertBefore(canvas, canvasContainer);
            canvasContainer.parentNode.removeChild(canvasContainer);

            if (Browser.resizeCanvas) {
              Browser.setWindowedCanvasSize();
            } else {
              Browser.updateCanvasDimensions(canvas);
            }
          }

          if (Module["onFullScreen"]) Module["onFullScreen"](Browser.isFullscreen);
          if (Module["onFullscreen"]) Module["onFullscreen"](Browser.isFullscreen);
        }

        if (!Browser.fullscreenHandlersInstalled) {
          Browser.fullscreenHandlersInstalled = true;
          document.addEventListener("fullscreenchange", fullscreenChange, false);
          document.addEventListener("mozfullscreenchange", fullscreenChange, false);
          document.addEventListener("webkitfullscreenchange", fullscreenChange, false);
          document.addEventListener("MSFullscreenChange", fullscreenChange, false);
        }

        var canvasContainer = document.createElement("div");
        canvas.parentNode.insertBefore(canvasContainer, canvas);
        canvasContainer.appendChild(canvas);
        canvasContainer.requestFullscreen = canvasContainer["requestFullscreen"] || canvasContainer["mozRequestFullScreen"] || canvasContainer["msRequestFullscreen"] || (canvasContainer["webkitRequestFullscreen"] ? function () {
          canvasContainer["webkitRequestFullscreen"](Element["ALLOW_KEYBOARD_INPUT"]);
        } : null) || (canvasContainer["webkitRequestFullScreen"] ? function () {
          canvasContainer["webkitRequestFullScreen"](Element["ALLOW_KEYBOARD_INPUT"]);
        } : null);
        canvasContainer.requestFullscreen();
      },
      exitFullscreen: function exitFullscreen() {
        if (!Browser.isFullscreen) {
          return false;
        }

        var CFS = document["exitFullscreen"] || document["cancelFullScreen"] || document["mozCancelFullScreen"] || document["msExitFullscreen"] || document["webkitCancelFullScreen"] || function () {};

        CFS.apply(document, []);
        return true;
      },
      nextRAF: 0,
      fakeRequestAnimationFrame: function fakeRequestAnimationFrame(func) {
        var now = Date.now();

        if (Browser.nextRAF === 0) {
          Browser.nextRAF = now + 1e3 / 60;
        } else {
          while (now + 2 >= Browser.nextRAF) {
            Browser.nextRAF += 1e3 / 60;
          }
        }

        var delay = Math.max(Browser.nextRAF - now, 0);
        setTimeout(func, delay);
      },
      requestAnimationFrame: function (_requestAnimationFrame) {
        function requestAnimationFrame(_x) {
          return _requestAnimationFrame.apply(this, arguments);
        }

        requestAnimationFrame.toString = function () {
          return _requestAnimationFrame.toString();
        };

        return requestAnimationFrame;
      }(function (func) {
        if (typeof requestAnimationFrame === "function") {
          requestAnimationFrame(func);
          return;
        }

        var RAF = Browser.fakeRequestAnimationFrame;
        RAF(func);
      }),
      safeCallback: function safeCallback(func) {
        return function () {
          if (!ABORT) return func.apply(null, arguments);
        };
      },
      allowAsyncCallbacks: true,
      queuedAsyncCallbacks: [],
      pauseAsyncCallbacks: function pauseAsyncCallbacks() {
        Browser.allowAsyncCallbacks = false;
      },
      resumeAsyncCallbacks: function resumeAsyncCallbacks() {
        Browser.allowAsyncCallbacks = true;

        if (Browser.queuedAsyncCallbacks.length > 0) {
          var callbacks = Browser.queuedAsyncCallbacks;
          Browser.queuedAsyncCallbacks = [];
          callbacks.forEach(function (func) {
            func();
          });
        }
      },
      safeRequestAnimationFrame: function safeRequestAnimationFrame(func) {
        return Browser.requestAnimationFrame(function () {
          if (ABORT) return;

          if (Browser.allowAsyncCallbacks) {
            func();
          } else {
            Browser.queuedAsyncCallbacks.push(func);
          }
        });
      },
      safeSetTimeout: function safeSetTimeout(func, timeout) {
        noExitRuntime = true;
        return setTimeout(function () {
          if (ABORT) return;

          if (Browser.allowAsyncCallbacks) {
            func();
          } else {
            Browser.queuedAsyncCallbacks.push(func);
          }
        }, timeout);
      },
      safeSetInterval: function safeSetInterval(func, timeout) {
        noExitRuntime = true;
        return setInterval(function () {
          if (ABORT) return;

          if (Browser.allowAsyncCallbacks) {
            func();
          }
        }, timeout);
      },
      getMimetype: function getMimetype(name) {
        return {
          "jpg": "image/jpeg",
          "jpeg": "image/jpeg",
          "png": "image/png",
          "bmp": "image/bmp",
          "ogg": "audio/ogg",
          "wav": "audio/wav",
          "mp3": "audio/mpeg"
        }[name.substr(name.lastIndexOf(".") + 1)];
      },
      getUserMedia: function getUserMedia(func) {
        if (!window.getUserMedia) {
          window.getUserMedia = navigator["getUserMedia"] || navigator["mozGetUserMedia"];
        }

        window.getUserMedia(func);
      },
      getMovementX: function getMovementX(event) {
        return event["movementX"] || event["mozMovementX"] || event["webkitMovementX"] || 0;
      },
      getMovementY: function getMovementY(event) {
        return event["movementY"] || event["mozMovementY"] || event["webkitMovementY"] || 0;
      },
      getMouseWheelDelta: function getMouseWheelDelta(event) {
        var delta = 0;

        switch (event.type) {
          case "DOMMouseScroll":
            delta = event.detail / 3;
            break;

          case "mousewheel":
            delta = event.wheelDelta / 120;
            break;

          case "wheel":
            delta = event.deltaY;

            switch (event.deltaMode) {
              case 0:
                delta /= 100;
                break;

              case 1:
                delta /= 3;
                break;

              case 2:
                delta *= 80;
                break;

              default:
                throw "unrecognized mouse wheel delta mode: " + event.deltaMode;
            }

            break;

          default:
            throw "unrecognized mouse wheel event: " + event.type;
        }

        return delta;
      },
      mouseX: 0,
      mouseY: 0,
      mouseMovementX: 0,
      mouseMovementY: 0,
      touches: {},
      lastTouches: {},
      calculateMouseEvent: function calculateMouseEvent(event) {
        if (Browser.pointerLock) {
          if (event.type != "mousemove" && "mozMovementX" in event) {
            Browser.mouseMovementX = Browser.mouseMovementY = 0;
          } else {
            Browser.mouseMovementX = Browser.getMovementX(event);
            Browser.mouseMovementY = Browser.getMovementY(event);
          }

          if (typeof SDL != "undefined") {
            Browser.mouseX = SDL.mouseX + Browser.mouseMovementX;
            Browser.mouseY = SDL.mouseY + Browser.mouseMovementY;
          } else {
            Browser.mouseX += Browser.mouseMovementX;
            Browser.mouseY += Browser.mouseMovementY;
          }
        } else {
          var rect = Module["canvas"].getBoundingClientRect();
          var cw = Module["canvas"].width;
          var ch = Module["canvas"].height;
          var scrollX = typeof window.scrollX !== "undefined" ? window.scrollX : window.pageXOffset;
          var scrollY = typeof window.scrollY !== "undefined" ? window.scrollY : window.pageYOffset;

          if (event.type === "touchstart" || event.type === "touchend" || event.type === "touchmove") {
            var touch = event.touch;

            if (touch === undefined) {
              return;
            }

            var adjustedX = touch.pageX - (scrollX + rect.left);
            var adjustedY = touch.pageY - (scrollY + rect.top);
            adjustedX = adjustedX * (cw / rect.width);
            adjustedY = adjustedY * (ch / rect.height);
            var coords = {
              x: adjustedX,
              y: adjustedY
            };

            if (event.type === "touchstart") {
              Browser.lastTouches[touch.identifier] = coords;
              Browser.touches[touch.identifier] = coords;
            } else if (event.type === "touchend" || event.type === "touchmove") {
              var last = Browser.touches[touch.identifier];
              if (!last) last = coords;
              Browser.lastTouches[touch.identifier] = last;
              Browser.touches[touch.identifier] = coords;
            }

            return;
          }

          var x = event.pageX - (scrollX + rect.left);
          var y = event.pageY - (scrollY + rect.top);
          x = x * (cw / rect.width);
          y = y * (ch / rect.height);
          Browser.mouseMovementX = x - Browser.mouseX;
          Browser.mouseMovementY = y - Browser.mouseY;
          Browser.mouseX = x;
          Browser.mouseY = y;
        }
      },
      asyncLoad: function asyncLoad(url, onload, onerror, noRunDep) {
        var dep = !noRunDep ? getUniqueRunDependency("al " + url) : "";
        readAsync(url, function (arrayBuffer) {
          assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
          onload(new Uint8Array(arrayBuffer));
          if (dep) removeRunDependency(dep);
        }, function (event) {
          if (onerror) {
            onerror();
          } else {
            throw 'Loading data file "' + url + '" failed.';
          }
        });
        if (dep) addRunDependency(dep);
      },
      resizeListeners: [],
      updateResizeListeners: function updateResizeListeners() {
        var canvas = Module["canvas"];
        Browser.resizeListeners.forEach(function (listener) {
          listener(canvas.width, canvas.height);
        });
      },
      setCanvasSize: function setCanvasSize(width, height, noUpdates) {
        var canvas = Module["canvas"];
        Browser.updateCanvasDimensions(canvas, width, height);
        if (!noUpdates) Browser.updateResizeListeners();
      },
      windowedWidth: 0,
      windowedHeight: 0,
      setFullscreenCanvasSize: function setFullscreenCanvasSize() {
        if (typeof SDL != "undefined") {
          var flags = HEAPU32[SDL.screen >> 2];
          flags = flags | 8388608;
          HEAP32[SDL.screen >> 2] = flags;
        }

        Browser.updateCanvasDimensions(Module["canvas"]);
        Browser.updateResizeListeners();
      },
      setWindowedCanvasSize: function setWindowedCanvasSize() {
        if (typeof SDL != "undefined") {
          var flags = HEAPU32[SDL.screen >> 2];
          flags = flags & ~8388608;
          HEAP32[SDL.screen >> 2] = flags;
        }

        Browser.updateCanvasDimensions(Module["canvas"]);
        Browser.updateResizeListeners();
      },
      updateCanvasDimensions: function updateCanvasDimensions(canvas, wNative, hNative) {
        if (wNative && hNative) {
          canvas.widthNative = wNative;
          canvas.heightNative = hNative;
        } else {
          wNative = canvas.widthNative;
          hNative = canvas.heightNative;
        }

        var w = wNative;
        var h = hNative;

        if (Module["forcedAspectRatio"] && Module["forcedAspectRatio"] > 0) {
          if (w / h < Module["forcedAspectRatio"]) {
            w = Math.round(h * Module["forcedAspectRatio"]);
          } else {
            h = Math.round(w / Module["forcedAspectRatio"]);
          }
        }

        if ((document["fullscreenElement"] || document["mozFullScreenElement"] || document["msFullscreenElement"] || document["webkitFullscreenElement"] || document["webkitCurrentFullScreenElement"]) === canvas.parentNode && typeof screen != "undefined") {
          var factor = Math.min(screen.width / w, screen.height / h);
          w = Math.round(w * factor);
          h = Math.round(h * factor);
        }

        if (Browser.resizeCanvas) {
          if (canvas.width != w) canvas.width = w;
          if (canvas.height != h) canvas.height = h;

          if (typeof canvas.style != "undefined") {
            canvas.style.removeProperty("width");
            canvas.style.removeProperty("height");
          }
        } else {
          if (canvas.width != wNative) canvas.width = wNative;
          if (canvas.height != hNative) canvas.height = hNative;

          if (typeof canvas.style != "undefined") {
            if (w != wNative || h != hNative) {
              canvas.style.setProperty("width", w + "px", "important");
              canvas.style.setProperty("height", h + "px", "important");
            } else {
              canvas.style.removeProperty("width");
              canvas.style.removeProperty("height");
            }
          }
        }
      },
      wgetRequests: {},
      nextWgetRequestHandle: 0,
      getNextWgetRequestHandle: function getNextWgetRequestHandle() {
        var handle = Browser.nextWgetRequestHandle;
        Browser.nextWgetRequestHandle++;
        return handle;
      }
    };

    function _emscripten_async_wget2_abort(handle) {
      var http = Browser.wgetRequests[handle];

      if (http) {
        http.abort();
      }
    }

    function _emscripten_async_wget2_data(url, request, param, arg, free, onload, onerror, onprogress) {
      var _url = UTF8ToString(url);

      var _request = UTF8ToString(request);

      var _param = UTF8ToString(param);

      var http = new XMLHttpRequest();
      http.open(_request, _url, true);
      http.responseType = "arraybuffer";
      var handle = Browser.getNextWgetRequestHandle();

      http.onload = function http_onload(e) {
        if (http.status >= 200 && http.status < 300 || http.status === 0 && _url.substr(0, 4).toLowerCase() != "http") {
          var byteArray = new Uint8Array(http.response);

          var buffer = _malloc(byteArray.length);

          HEAPU8.set(byteArray, buffer);
          if (onload) dynCall_viiii(onload, handle, arg, buffer, byteArray.length);
          if (free) _free(buffer);
        } else {
          if (onerror) dynCall_viiii(onerror, handle, arg, http.status, http.statusText);
        }

        delete Browser.wgetRequests[handle];
      };

      http.onerror = function http_onerror(e) {
        if (onerror) {
          dynCall_viiii(onerror, handle, arg, http.status, http.statusText);
        }

        delete Browser.wgetRequests[handle];
      };

      http.onprogress = function http_onprogress(e) {
        if (onprogress) dynCall_viiii(onprogress, handle, arg, e.loaded, e.lengthComputable || e.lengthComputable === undefined ? e.total : 0);
      };

      http.onabort = function http_onabort(e) {
        delete Browser.wgetRequests[handle];
      };

      if (_request == "POST") {
        http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        http.send(_param);
      } else {
        http.send(null);
      }

      Browser.wgetRequests[handle] = http;
      return handle;
    }

    function _longjmp(env, value) {
      _setThrew(env, value || 1);

      throw "longjmp";
    }

    function _emscripten_longjmp(env, value) {
      _longjmp(env, value);
    }

    function _emscripten_memcpy_big(dest, src, num) {
      HEAPU8.copyWithin(dest, src, src + num);
    }

    function _emscripten_get_heap_size() {
      return HEAPU8.length;
    }

    function emscripten_realloc_buffer(size) {
      try {
        wasmMemory.grow(size - buffer.byteLength + 65535 >>> 16);
        updateGlobalBufferAndViews(wasmMemory.buffer);
        return 1;
      } catch (e) {}
    }

    function _emscripten_resize_heap(requestedSize) {
      requestedSize = requestedSize >>> 0;

      var oldSize = _emscripten_get_heap_size();

      var PAGE_MULTIPLE = 65536;
      var maxHeapSize = 2147483648;

      if (requestedSize > maxHeapSize) {
        return false;
      }

      var minHeapSize = 16777216;

      for (var cutDown = 1; cutDown <= 4; cutDown *= 2) {
        var overGrownHeapSize = oldSize * (1 + .2 / cutDown);
        overGrownHeapSize = Math.min(overGrownHeapSize, requestedSize + 100663296);
        var newSize = Math.min(maxHeapSize, alignUp(Math.max(minHeapSize, requestedSize, overGrownHeapSize), PAGE_MULTIPLE));
        var replacement = emscripten_realloc_buffer(newSize);

        if (replacement) {
          return true;
        }
      }

      return false;
    }

    function _exit(status) {
      exit(status);
    }

    var PATH = {
      splitPath: function splitPath(filename) {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1);
      },
      normalizeArray: function normalizeArray(parts, allowAboveRoot) {
        var up = 0;

        for (var i = parts.length - 1; i >= 0; i--) {
          var last = parts[i];

          if (last === ".") {
            parts.splice(i, 1);
          } else if (last === "..") {
            parts.splice(i, 1);
            up++;
          } else if (up) {
            parts.splice(i, 1);
            up--;
          }
        }

        if (allowAboveRoot) {
          for (; up; up--) {
            parts.unshift("..");
          }
        }

        return parts;
      },
      normalize: function normalize(path) {
        var isAbsolute = path.charAt(0) === "/",
            trailingSlash = path.substr(-1) === "/";
        path = PATH.normalizeArray(path.split("/").filter(function (p) {
          return !!p;
        }), !isAbsolute).join("/");

        if (!path && !isAbsolute) {
          path = ".";
        }

        if (path && trailingSlash) {
          path += "/";
        }

        return (isAbsolute ? "/" : "") + path;
      },
      dirname: function dirname(path) {
        var result = PATH.splitPath(path),
            root = result[0],
            dir = result[1];

        if (!root && !dir) {
          return ".";
        }

        if (dir) {
          dir = dir.substr(0, dir.length - 1);
        }

        return root + dir;
      },
      basename: function basename(path) {
        if (path === "/") return "/";
        var lastSlash = path.lastIndexOf("/");
        if (lastSlash === -1) return path;
        return path.substr(lastSlash + 1);
      },
      extname: function extname(path) {
        return PATH.splitPath(path)[3];
      },
      join: function join() {
        var paths = Array.prototype.slice.call(arguments, 0);
        return PATH.normalize(paths.join("/"));
      },
      join2: function join2(l, r) {
        return PATH.normalize(l + "/" + r);
      }
    };
    var SYSCALLS = {
      mappings: {},
      buffers: [null, [], []],
      printChar: function printChar(stream, curr) {
        var buffer = SYSCALLS.buffers[stream];

        if (curr === 0 || curr === 10) {
          (stream === 1 ? out : err)(UTF8ArrayToString(buffer, 0));
          buffer.length = 0;
        } else {
          buffer.push(curr);
        }
      },
      varargs: undefined,
      get: function get() {
        SYSCALLS.varargs += 4;
        var ret = HEAP32[SYSCALLS.varargs - 4 >> 2];
        return ret;
      },
      getStr: function getStr(ptr) {
        var ret = UTF8ToString(ptr);
        return ret;
      },
      get64: function get64(low, high) {
        return low;
      }
    };

    function _fd_close(fd) {
      return 0;
    }

    function _fd_read(fd, iov, iovcnt, pnum) {
      var stream = SYSCALLS.getStreamFromFD(fd);
      var num = SYSCALLS.doReadv(stream, iov, iovcnt);
      HEAP32[pnum >> 2] = num;
      return 0;
    }

    function _fd_seek(fd, offset_low, offset_high, whence, newOffset) {}

    function _fd_write(fd, iov, iovcnt, pnum) {
      var num = 0;

      for (var i = 0; i < iovcnt; i++) {
        var ptr = HEAP32[iov + i * 8 >> 2];
        var len = HEAP32[iov + (i * 8 + 4) >> 2];

        for (var j = 0; j < len; j++) {
          SYSCALLS.printChar(fd, HEAPU8[ptr + j]);
        }

        num += len;
      }

      HEAP32[pnum >> 2] = num;
      return 0;
    }

    function _getTempRet0() {
      return getTempRet0() | 0;
    }

    function _gettimeofday(ptr) {
      var now = Date.now();
      HEAP32[ptr >> 2] = now / 1e3 | 0;
      HEAP32[ptr + 4 >> 2] = now % 1e3 * 1e3 | 0;
      return 0;
    }

    function __webgl_enable_ANGLE_instanced_arrays(ctx) {
      var ext = ctx.getExtension("ANGLE_instanced_arrays");

      if (ext) {
        ctx["vertexAttribDivisor"] = function (index, divisor) {
          ext["vertexAttribDivisorANGLE"](index, divisor);
        };

        ctx["drawArraysInstanced"] = function (mode, first, count, primcount) {
          ext["drawArraysInstancedANGLE"](mode, first, count, primcount);
        };

        ctx["drawElementsInstanced"] = function (mode, count, type, indices, primcount) {
          ext["drawElementsInstancedANGLE"](mode, count, type, indices, primcount);
        };

        return 1;
      }
    }

    function __webgl_enable_OES_vertex_array_object(ctx) {
      var ext = ctx.getExtension("OES_vertex_array_object");

      if (ext) {
        ctx["createVertexArray"] = function () {
          return ext["createVertexArrayOES"]();
        };

        ctx["deleteVertexArray"] = function (vao) {
          ext["deleteVertexArrayOES"](vao);
        };

        ctx["bindVertexArray"] = function (vao) {
          ext["bindVertexArrayOES"](vao);
        };

        ctx["isVertexArray"] = function (vao) {
          return ext["isVertexArrayOES"](vao);
        };

        return 1;
      }
    }

    function __webgl_enable_WEBGL_draw_buffers(ctx) {
      var ext = ctx.getExtension("WEBGL_draw_buffers");

      if (ext) {
        ctx["drawBuffers"] = function (n, bufs) {
          ext["drawBuffersWEBGL"](n, bufs);
        };

        return 1;
      }
    }

    function __webgl_enable_WEBGL_draw_instanced_base_vertex_base_instance(ctx) {
      return !!(ctx.dibvbi = ctx.getExtension("WEBGL_draw_instanced_base_vertex_base_instance"));
    }

    var GL = {
      counter: 1,
      buffers: [],
      programs: [],
      framebuffers: [],
      renderbuffers: [],
      textures: [],
      uniforms: [],
      shaders: [],
      vaos: [],
      contexts: [],
      offscreenCanvases: {},
      timerQueriesEXT: [],
      queries: [],
      samplers: [],
      transformFeedbacks: [],
      syncs: [],
      programInfos: {},
      stringCache: {},
      stringiCache: {},
      unpackAlignment: 4,
      recordError: function recordError(errorCode) {
        if (!GL.lastError) {
          GL.lastError = errorCode;
        }
      },
      getNewId: function getNewId(table) {
        var ret = GL.counter++;

        for (var i = table.length; i < ret; i++) {
          table[i] = null;
        }

        return ret;
      },
      getSource: function getSource(shader, count, string, length) {
        var source = "";

        for (var i = 0; i < count; ++i) {
          var len = length ? HEAP32[length + i * 4 >> 2] : -1;
          source += UTF8ToString(HEAP32[string + i * 4 >> 2], len < 0 ? undefined : len);
        }

        return source;
      },
      createContext: function createContext(canvas, webGLContextAttributes) {
        var ctx = webGLContextAttributes.majorVersion > 1 ? canvas.getContext("webgl2", webGLContextAttributes) : canvas.getContext("webgl", webGLContextAttributes);
        if (!ctx) return 0;
        var handle = GL.registerContext(ctx, webGLContextAttributes);
        return handle;
      },
      registerContext: function registerContext(ctx, webGLContextAttributes) {
        var handle = GL.getNewId(GL.contexts);
        var context = {
          handle: handle,
          attributes: webGLContextAttributes,
          version: webGLContextAttributes.majorVersion,
          GLctx: ctx
        };
        if (ctx.canvas) ctx.canvas.GLctxObject = context;
        GL.contexts[handle] = context;

        if (typeof webGLContextAttributes.enableExtensionsByDefault === "undefined" || webGLContextAttributes.enableExtensionsByDefault) {
          GL.initExtensions(context);
        }

        return handle;
      },
      makeContextCurrent: function makeContextCurrent(contextHandle) {
        GL.currentContext = GL.contexts[contextHandle];
        Module.ctx = GLctx = GL.currentContext && GL.currentContext.GLctx;
        return !(contextHandle && !GLctx);
      },
      getContext: function getContext(contextHandle) {
        return GL.contexts[contextHandle];
      },
      deleteContext: function deleteContext(contextHandle) {
        if (GL.currentContext === GL.contexts[contextHandle]) GL.currentContext = null;
        if ((typeof JSEvents === "undefined" ? "undefined" : Object(_work_node_modules_babel_runtime_helpers_esm_typeof__WEBPACK_IMPORTED_MODULE_1__[/* default */ "a"])(JSEvents)) === "object") JSEvents.removeAllHandlersOnTarget(GL.contexts[contextHandle].GLctx.canvas);
        if (GL.contexts[contextHandle] && GL.contexts[contextHandle].GLctx.canvas) GL.contexts[contextHandle].GLctx.canvas.GLctxObject = undefined;
        GL.contexts[contextHandle] = null;
      },
      initExtensions: function initExtensions(context) {
        if (!context) context = GL.currentContext;
        if (context.initExtensionsDone) return;
        context.initExtensionsDone = true;
        var GLctx = context.GLctx;

        __webgl_enable_ANGLE_instanced_arrays(GLctx);

        __webgl_enable_OES_vertex_array_object(GLctx);

        __webgl_enable_WEBGL_draw_buffers(GLctx);

        __webgl_enable_WEBGL_draw_instanced_base_vertex_base_instance(GLctx);

        GLctx.disjointTimerQueryExt = GLctx.getExtension("EXT_disjoint_timer_query");
        var automaticallyEnabledExtensions = ["OES_texture_float", "OES_texture_half_float", "OES_standard_derivatives", "OES_vertex_array_object", "WEBGL_compressed_texture_s3tc", "WEBGL_depth_texture", "OES_element_index_uint", "EXT_texture_filter_anisotropic", "EXT_frag_depth", "WEBGL_draw_buffers", "ANGLE_instanced_arrays", "OES_texture_float_linear", "OES_texture_half_float_linear", "EXT_blend_minmax", "EXT_shader_texture_lod", "EXT_texture_norm16", "WEBGL_compressed_texture_pvrtc", "EXT_color_buffer_half_float", "WEBGL_color_buffer_float", "EXT_sRGB", "WEBGL_compressed_texture_etc1", "EXT_disjoint_timer_query", "WEBGL_compressed_texture_etc", "WEBGL_compressed_texture_astc", "EXT_color_buffer_float", "WEBGL_compressed_texture_s3tc_srgb", "EXT_disjoint_timer_query_webgl2", "WEBKIT_WEBGL_compressed_texture_pvrtc"];
        var exts = GLctx.getSupportedExtensions() || [];
        exts.forEach(function (ext) {
          if (automaticallyEnabledExtensions.indexOf(ext) != -1) {
            GLctx.getExtension(ext);
          }
        });
      },
      populateUniformTable: function populateUniformTable(program) {
        var p = GL.programs[program];
        var ptable = GL.programInfos[program] = {
          uniforms: {},
          maxUniformLength: 0,
          maxAttributeLength: -1,
          maxUniformBlockNameLength: -1
        };
        var utable = ptable.uniforms;
        var numUniforms = GLctx.getProgramParameter(p, 35718);

        for (var i = 0; i < numUniforms; ++i) {
          var u = GLctx.getActiveUniform(p, i);
          var name = u.name;
          ptable.maxUniformLength = Math.max(ptable.maxUniformLength, name.length + 1);

          if (name.slice(-1) == "]") {
            name = name.slice(0, name.lastIndexOf("["));
          }

          var loc = GLctx.getUniformLocation(p, name);

          if (loc) {
            var id = GL.getNewId(GL.uniforms);
            utable[name] = [u.size, id];
            GL.uniforms[id] = loc;

            for (var j = 1; j < u.size; ++j) {
              var n = name + "[" + j + "]";
              loc = GLctx.getUniformLocation(p, n);
              id = GL.getNewId(GL.uniforms);
              GL.uniforms[id] = loc;
            }
          }
        }
      }
    };

    function _glActiveTexture(x0) {
      GLctx["activeTexture"](x0);
    }

    function _glAttachShader(program, shader) {
      GLctx.attachShader(GL.programs[program], GL.shaders[shader]);
    }

    function _glBindAttribLocation(program, index, name) {
      GLctx.bindAttribLocation(GL.programs[program], index, UTF8ToString(name));
    }

    function _glBindBuffer(target, buffer) {
      if (target == 35051) {
        GLctx.currentPixelPackBufferBinding = buffer;
      } else if (target == 35052) {
        GLctx.currentPixelUnpackBufferBinding = buffer;
      }

      GLctx.bindBuffer(target, GL.buffers[buffer]);
    }

    function _glBindTexture(target, texture) {
      GLctx.bindTexture(target, GL.textures[texture]);
    }

    function _glBlendColor(x0, x1, x2, x3) {
      GLctx["blendColor"](x0, x1, x2, x3);
    }

    function _glBlendFunc(x0, x1) {
      GLctx["blendFunc"](x0, x1);
    }

    function _glBlendFuncSeparate(x0, x1, x2, x3) {
      GLctx["blendFuncSeparate"](x0, x1, x2, x3);
    }

    function _glBufferData(target, size, data, usage) {
      if (GL.currentContext.version >= 2) {
        if (data) {
          GLctx.bufferData(target, HEAPU8, usage, data, size);
        } else {
          GLctx.bufferData(target, size, usage);
        }
      } else {
        GLctx.bufferData(target, data ? HEAPU8.subarray(data, data + size) : size, usage);
      }
    }

    function _glClear(x0) {
      GLctx["clear"](x0);
    }

    function _glClearColor(x0, x1, x2, x3) {
      GLctx["clearColor"](x0, x1, x2, x3);
    }

    function _glColorMask(red, green, blue, alpha) {
      GLctx.colorMask(!!red, !!green, !!blue, !!alpha);
    }

    function _glCompileShader(shader) {
      GLctx.compileShader(GL.shaders[shader]);
    }

    function _glCreateProgram() {
      var id = GL.getNewId(GL.programs);
      var program = GLctx.createProgram();
      program.name = id;
      GL.programs[id] = program;
      return id;
    }

    function _glCreateShader(shaderType) {
      var id = GL.getNewId(GL.shaders);
      GL.shaders[id] = GLctx.createShader(shaderType);
      return id;
    }

    function _glCullFace(x0) {
      GLctx["cullFace"](x0);
    }

    function _glDeleteBuffers(n, buffers) {
      for (var i = 0; i < n; i++) {
        var id = HEAP32[buffers + i * 4 >> 2];
        var buffer = GL.buffers[id];
        if (!buffer) continue;
        GLctx.deleteBuffer(buffer);
        buffer.name = 0;
        GL.buffers[id] = null;
        if (id == GLctx.currentPixelPackBufferBinding) GLctx.currentPixelPackBufferBinding = 0;
        if (id == GLctx.currentPixelUnpackBufferBinding) GLctx.currentPixelUnpackBufferBinding = 0;
      }
    }

    function _glDeleteProgram(id) {
      if (!id) return;
      var program = GL.programs[id];

      if (!program) {
        GL.recordError(1281);
        return;
      }

      GLctx.deleteProgram(program);
      program.name = 0;
      GL.programs[id] = null;
      GL.programInfos[id] = null;
    }

    function _glDeleteShader(id) {
      if (!id) return;
      var shader = GL.shaders[id];

      if (!shader) {
        GL.recordError(1281);
        return;
      }

      GLctx.deleteShader(shader);
      GL.shaders[id] = null;
    }

    function _glDeleteTextures(n, textures) {
      for (var i = 0; i < n; i++) {
        var id = HEAP32[textures + i * 4 >> 2];
        var texture = GL.textures[id];
        if (!texture) continue;
        GLctx.deleteTexture(texture);
        texture.name = 0;
        GL.textures[id] = null;
      }
    }

    function _glDepthFunc(x0) {
      GLctx["depthFunc"](x0);
    }

    function _glDepthMask(flag) {
      GLctx.depthMask(!!flag);
    }

    function _glDisable(x0) {
      GLctx["disable"](x0);
    }

    function _glDisableVertexAttribArray(index) {
      GLctx.disableVertexAttribArray(index);
    }

    function _glDrawArrays(mode, first, count) {
      GLctx.drawArrays(mode, first, count);
    }

    function _glDrawElements(mode, count, type, indices) {
      GLctx.drawElements(mode, count, type, indices);
    }

    function _glEnable(x0) {
      GLctx["enable"](x0);
    }

    function _glEnableVertexAttribArray(index) {
      GLctx.enableVertexAttribArray(index);
    }

    function _glFinish() {
      GLctx["finish"]();
    }

    function _glFrontFace(x0) {
      GLctx["frontFace"](x0);
    }

    function __glGenObject(n, buffers, createFunction, objectTable) {
      for (var i = 0; i < n; i++) {
        var buffer = GLctx[createFunction]();
        var id = buffer && GL.getNewId(objectTable);

        if (buffer) {
          buffer.name = id;
          objectTable[id] = buffer;
        } else {
          GL.recordError(1282);
        }

        HEAP32[buffers + i * 4 >> 2] = id;
      }
    }

    function _glGenBuffers(n, buffers) {
      __glGenObject(n, buffers, "createBuffer", GL.buffers);
    }

    function _glGenTextures(n, textures) {
      __glGenObject(n, textures, "createTexture", GL.textures);
    }

    function _glGenerateMipmap(x0) {
      GLctx["generateMipmap"](x0);
    }

    function __glGetActiveAttribOrUniform(funcName, program, index, bufSize, length, size, type, name) {
      program = GL.programs[program];
      var info = GLctx[funcName](program, index);

      if (info) {
        var numBytesWrittenExclNull = name && stringToUTF8(info.name, name, bufSize);
        if (length) HEAP32[length >> 2] = numBytesWrittenExclNull;
        if (size) HEAP32[size >> 2] = info.size;
        if (type) HEAP32[type >> 2] = info.type;
      }
    }

    function _glGetActiveUniform(program, index, bufSize, length, size, type, name) {
      __glGetActiveAttribOrUniform("getActiveUniform", program, index, bufSize, length, size, type, name);
    }

    function _glGetError() {
      var error = GLctx.getError() || GL.lastError;
      GL.lastError = 0;
      return error;
    }

    function writeI53ToI64(ptr, num) {
      HEAPU32[ptr >> 2] = num;
      HEAPU32[ptr + 4 >> 2] = (num - HEAPU32[ptr >> 2]) / 4294967296;
    }

    function emscriptenWebGLGet(name_, p, type) {
      if (!p) {
        GL.recordError(1281);
        return;
      }

      var ret = undefined;

      switch (name_) {
        case 36346:
          ret = 1;
          break;

        case 36344:
          if (type != 0 && type != 1) {
            GL.recordError(1280);
          }

          return;

        case 34814:
        case 36345:
          ret = 0;
          break;

        case 34466:
          var formats = GLctx.getParameter(34467);
          ret = formats ? formats.length : 0;
          break;

        case 33309:
          if (GL.currentContext.version < 2) {
            GL.recordError(1282);
            return;
          }

          var exts = GLctx.getSupportedExtensions() || [];
          ret = 2 * exts.length;
          break;

        case 33307:
        case 33308:
          if (GL.currentContext.version < 2) {
            GL.recordError(1280);
            return;
          }

          ret = name_ == 33307 ? 3 : 0;
          break;
      }

      if (ret === undefined) {
        var result = GLctx.getParameter(name_);

        switch (Object(_work_node_modules_babel_runtime_helpers_esm_typeof__WEBPACK_IMPORTED_MODULE_1__[/* default */ "a"])(result)) {
          case "number":
            ret = result;
            break;

          case "boolean":
            ret = result ? 1 : 0;
            break;

          case "string":
            GL.recordError(1280);
            return;

          case "object":
            if (result === null) {
              switch (name_) {
                case 34964:
                case 35725:
                case 34965:
                case 36006:
                case 36007:
                case 32873:
                case 34229:
                case 36662:
                case 36663:
                case 35053:
                case 35055:
                case 36010:
                case 35097:
                case 35869:
                case 32874:
                case 36389:
                case 35983:
                case 35368:
                case 34068:
                  {
                    ret = 0;
                    break;
                  }

                default:
                  {
                    GL.recordError(1280);
                    return;
                  }
              }
            } else if (result instanceof Float32Array || result instanceof Uint32Array || result instanceof Int32Array || result instanceof Array) {
              for (var i = 0; i < result.length; ++i) {
                switch (type) {
                  case 0:
                    HEAP32[p + i * 4 >> 2] = result[i];
                    break;

                  case 2:
                    HEAPF32[p + i * 4 >> 2] = result[i];
                    break;

                  case 4:
                    HEAP8[p + i >> 0] = result[i] ? 1 : 0;
                    break;
                }
              }

              return;
            } else {
              try {
                ret = result.name | 0;
              } catch (e) {
                GL.recordError(1280);
                err("GL_INVALID_ENUM in glGet" + type + "v: Unknown object returned from WebGL getParameter(" + name_ + ")! (error: " + e + ")");
                return;
              }
            }

            break;

          default:
            GL.recordError(1280);
            err("GL_INVALID_ENUM in glGet" + type + "v: Native code calling glGet" + type + "v(" + name_ + ") and it returns " + result + " of type " + Object(_work_node_modules_babel_runtime_helpers_esm_typeof__WEBPACK_IMPORTED_MODULE_1__[/* default */ "a"])(result) + "!");
            return;
        }
      }

      switch (type) {
        case 1:
          writeI53ToI64(p, ret);
          break;

        case 0:
          HEAP32[p >> 2] = ret;
          break;

        case 2:
          HEAPF32[p >> 2] = ret;
          break;

        case 4:
          HEAP8[p >> 0] = ret ? 1 : 0;
          break;
      }
    }

    function _glGetIntegerv(name_, p) {
      emscriptenWebGLGet(name_, p, 0);
    }

    function _glGetProgramInfoLog(program, maxLength, length, infoLog) {
      var log = GLctx.getProgramInfoLog(GL.programs[program]);
      if (log === null) log = "(unknown error)";
      var numBytesWrittenExclNull = maxLength > 0 && infoLog ? stringToUTF8(log, infoLog, maxLength) : 0;
      if (length) HEAP32[length >> 2] = numBytesWrittenExclNull;
    }

    function _glGetProgramiv(program, pname, p) {
      if (!p) {
        GL.recordError(1281);
        return;
      }

      if (program >= GL.counter) {
        GL.recordError(1281);
        return;
      }

      var ptable = GL.programInfos[program];

      if (!ptable) {
        GL.recordError(1282);
        return;
      }

      if (pname == 35716) {
        var log = GLctx.getProgramInfoLog(GL.programs[program]);
        if (log === null) log = "(unknown error)";
        HEAP32[p >> 2] = log.length + 1;
      } else if (pname == 35719) {
        HEAP32[p >> 2] = ptable.maxUniformLength;
      } else if (pname == 35722) {
        if (ptable.maxAttributeLength == -1) {
          program = GL.programs[program];
          var numAttribs = GLctx.getProgramParameter(program, 35721);
          ptable.maxAttributeLength = 0;

          for (var i = 0; i < numAttribs; ++i) {
            var activeAttrib = GLctx.getActiveAttrib(program, i);
            ptable.maxAttributeLength = Math.max(ptable.maxAttributeLength, activeAttrib.name.length + 1);
          }
        }

        HEAP32[p >> 2] = ptable.maxAttributeLength;
      } else if (pname == 35381) {
        if (ptable.maxUniformBlockNameLength == -1) {
          program = GL.programs[program];
          var numBlocks = GLctx.getProgramParameter(program, 35382);
          ptable.maxUniformBlockNameLength = 0;

          for (var i = 0; i < numBlocks; ++i) {
            var activeBlockName = GLctx.getActiveUniformBlockName(program, i);
            ptable.maxUniformBlockNameLength = Math.max(ptable.maxUniformBlockNameLength, activeBlockName.length + 1);
          }
        }

        HEAP32[p >> 2] = ptable.maxUniformBlockNameLength;
      } else {
        HEAP32[p >> 2] = GLctx.getProgramParameter(GL.programs[program], pname);
      }
    }

    function _glGetShaderInfoLog(shader, maxLength, length, infoLog) {
      var log = GLctx.getShaderInfoLog(GL.shaders[shader]);
      if (log === null) log = "(unknown error)";
      var numBytesWrittenExclNull = maxLength > 0 && infoLog ? stringToUTF8(log, infoLog, maxLength) : 0;
      if (length) HEAP32[length >> 2] = numBytesWrittenExclNull;
    }

    function _glGetShaderiv(shader, pname, p) {
      if (!p) {
        GL.recordError(1281);
        return;
      }

      if (pname == 35716) {
        var log = GLctx.getShaderInfoLog(GL.shaders[shader]);
        if (log === null) log = "(unknown error)";
        HEAP32[p >> 2] = log.length + 1;
      } else if (pname == 35720) {
        var source = GLctx.getShaderSource(GL.shaders[shader]);
        var sourceLength = source === null || source.length == 0 ? 0 : source.length + 1;
        HEAP32[p >> 2] = sourceLength;
      } else {
        HEAP32[p >> 2] = GLctx.getShaderParameter(GL.shaders[shader], pname);
      }
    }

    function jstoi_q(str) {
      return parseInt(str);
    }

    function _glGetUniformLocation(program, name) {
      name = UTF8ToString(name);
      var arrayIndex = 0;

      if (name[name.length - 1] == "]") {
        var leftBrace = name.lastIndexOf("[");
        arrayIndex = name[leftBrace + 1] != "]" ? jstoi_q(name.slice(leftBrace + 1)) : 0;
        name = name.slice(0, leftBrace);
      }

      var uniformInfo = GL.programInfos[program] && GL.programInfos[program].uniforms[name];

      if (uniformInfo && arrayIndex >= 0 && arrayIndex < uniformInfo[0]) {
        return uniformInfo[1] + arrayIndex;
      } else {
        return -1;
      }
    }

    function _glLineWidth(x0) {
      GLctx["lineWidth"](x0);
    }

    function _glLinkProgram(program) {
      GLctx.linkProgram(GL.programs[program]);
      GL.populateUniformTable(program);
    }

    function _glPixelStorei(pname, param) {
      if (pname == 3317) {
        GL.unpackAlignment = param;
      }

      GLctx.pixelStorei(pname, param);
    }

    function _glShaderSource(shader, count, string, length) {
      var source = GL.getSource(shader, count, string, length);
      GLctx.shaderSource(GL.shaders[shader], source);
    }

    function _glStencilFunc(x0, x1, x2) {
      GLctx["stencilFunc"](x0, x1, x2);
    }

    function _glStencilMask(x0) {
      GLctx["stencilMask"](x0);
    }

    function _glStencilOp(x0, x1, x2) {
      GLctx["stencilOp"](x0, x1, x2);
    }

    function _glStencilOpSeparate(x0, x1, x2, x3) {
      GLctx["stencilOpSeparate"](x0, x1, x2, x3);
    }

    function __computeUnpackAlignedImageSize(width, height, sizePerPixel, alignment) {
      function roundedToNextMultipleOf(x, y) {
        return x + y - 1 & -y;
      }

      var plainRowSize = width * sizePerPixel;
      var alignedRowSize = roundedToNextMultipleOf(plainRowSize, alignment);
      return height * alignedRowSize;
    }

    function __colorChannelsInGlTextureFormat(format) {
      var colorChannels = {
        5: 3,
        6: 4,
        8: 2,
        29502: 3,
        29504: 4,
        26917: 2,
        26918: 2,
        29846: 3,
        29847: 4
      };
      return colorChannels[format - 6402] || 1;
    }

    function __heapObjectForWebGLType(type) {
      type -= 5120;
      if (type == 0) return HEAP8;
      if (type == 1) return HEAPU8;
      if (type == 2) return HEAP16;
      if (type == 4) return HEAP32;
      if (type == 6) return HEAPF32;
      if (type == 5 || type == 28922 || type == 28520 || type == 30779 || type == 30782) return HEAPU32;
      return HEAPU16;
    }

    function __heapAccessShiftForWebGLHeap(heap) {
      return 31 - Math.clz32(heap.BYTES_PER_ELEMENT);
    }

    function emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, internalFormat) {
      var heap = __heapObjectForWebGLType(type);

      var shift = __heapAccessShiftForWebGLHeap(heap);

      var byteSize = 1 << shift;
      var sizePerPixel = __colorChannelsInGlTextureFormat(format) * byteSize;

      var bytes = __computeUnpackAlignedImageSize(width, height, sizePerPixel, GL.unpackAlignment);

      return heap.subarray(pixels >> shift, pixels + bytes >> shift);
    }

    function _glTexImage2D(target, level, internalFormat, width, height, border, format, type, pixels) {
      if (GL.currentContext.version >= 2) {
        if (GLctx.currentPixelUnpackBufferBinding) {
          GLctx.texImage2D(target, level, internalFormat, width, height, border, format, type, pixels);
        } else if (pixels) {
          var heap = __heapObjectForWebGLType(type);

          GLctx.texImage2D(target, level, internalFormat, width, height, border, format, type, heap, pixels >> __heapAccessShiftForWebGLHeap(heap));
        } else {
          GLctx.texImage2D(target, level, internalFormat, width, height, border, format, type, null);
        }

        return;
      }

      GLctx.texImage2D(target, level, internalFormat, width, height, border, format, type, pixels ? emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, internalFormat) : null);
    }

    function _glTexParameterf(x0, x1, x2) {
      GLctx["texParameterf"](x0, x1, x2);
    }

    function _glTexParameteri(x0, x1, x2) {
      GLctx["texParameteri"](x0, x1, x2);
    }

    function _glTexSubImage2D(target, level, xoffset, yoffset, width, height, format, type, pixels) {
      if (GL.currentContext.version >= 2) {
        if (GLctx.currentPixelUnpackBufferBinding) {
          GLctx.texSubImage2D(target, level, xoffset, yoffset, width, height, format, type, pixels);
        } else if (pixels) {
          var heap = __heapObjectForWebGLType(type);

          GLctx.texSubImage2D(target, level, xoffset, yoffset, width, height, format, type, heap, pixels >> __heapAccessShiftForWebGLHeap(heap));
        } else {
          GLctx.texSubImage2D(target, level, xoffset, yoffset, width, height, format, type, null);
        }

        return;
      }

      var pixelData = null;
      if (pixels) pixelData = emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, 0);
      GLctx.texSubImage2D(target, level, xoffset, yoffset, width, height, format, type, pixelData);
    }

    function _glUniform1f(location, v0) {
      GLctx.uniform1f(GL.uniforms[location], v0);
    }

    var __miniTempWebGLFloatBuffers = [];

    function _glUniform1fv(location, count, value) {
      if (GL.currentContext.version >= 2) {
        GLctx.uniform1fv(GL.uniforms[location], HEAPF32, value >> 2, count);
        return;
      }

      if (count <= 288) {
        var view = __miniTempWebGLFloatBuffers[count - 1];

        for (var i = 0; i < count; ++i) {
          view[i] = HEAPF32[value + 4 * i >> 2];
        }
      } else {
        var view = HEAPF32.subarray(value >> 2, value + count * 4 >> 2);
      }

      GLctx.uniform1fv(GL.uniforms[location], view);
    }

    function _glUniform1i(location, v0) {
      GLctx.uniform1i(GL.uniforms[location], v0);
    }

    function _glUniform2fv(location, count, value) {
      if (GL.currentContext.version >= 2) {
        GLctx.uniform2fv(GL.uniforms[location], HEAPF32, value >> 2, count * 2);
        return;
      }

      if (count <= 144) {
        var view = __miniTempWebGLFloatBuffers[2 * count - 1];

        for (var i = 0; i < 2 * count; i += 2) {
          view[i] = HEAPF32[value + 4 * i >> 2];
          view[i + 1] = HEAPF32[value + (4 * i + 4) >> 2];
        }
      } else {
        var view = HEAPF32.subarray(value >> 2, value + count * 8 >> 2);
      }

      GLctx.uniform2fv(GL.uniforms[location], view);
    }

    function _glUniform3fv(location, count, value) {
      if (GL.currentContext.version >= 2) {
        GLctx.uniform3fv(GL.uniforms[location], HEAPF32, value >> 2, count * 3);
        return;
      }

      if (count <= 96) {
        var view = __miniTempWebGLFloatBuffers[3 * count - 1];

        for (var i = 0; i < 3 * count; i += 3) {
          view[i] = HEAPF32[value + 4 * i >> 2];
          view[i + 1] = HEAPF32[value + (4 * i + 4) >> 2];
          view[i + 2] = HEAPF32[value + (4 * i + 8) >> 2];
        }
      } else {
        var view = HEAPF32.subarray(value >> 2, value + count * 12 >> 2);
      }

      GLctx.uniform3fv(GL.uniforms[location], view);
    }

    function _glUniform4fv(location, count, value) {
      if (GL.currentContext.version >= 2) {
        GLctx.uniform4fv(GL.uniforms[location], HEAPF32, value >> 2, count * 4);
        return;
      }

      if (count <= 72) {
        var view = __miniTempWebGLFloatBuffers[4 * count - 1];
        var heap = HEAPF32;
        value >>= 2;

        for (var i = 0; i < 4 * count; i += 4) {
          var dst = value + i;
          view[i] = heap[dst];
          view[i + 1] = heap[dst + 1];
          view[i + 2] = heap[dst + 2];
          view[i + 3] = heap[dst + 3];
        }
      } else {
        var view = HEAPF32.subarray(value >> 2, value + count * 16 >> 2);
      }

      GLctx.uniform4fv(GL.uniforms[location], view);
    }

    function _glUniformMatrix3fv(location, count, transpose, value) {
      if (GL.currentContext.version >= 2) {
        GLctx.uniformMatrix3fv(GL.uniforms[location], !!transpose, HEAPF32, value >> 2, count * 9);
        return;
      }

      if (count <= 32) {
        var view = __miniTempWebGLFloatBuffers[9 * count - 1];

        for (var i = 0; i < 9 * count; i += 9) {
          view[i] = HEAPF32[value + 4 * i >> 2];
          view[i + 1] = HEAPF32[value + (4 * i + 4) >> 2];
          view[i + 2] = HEAPF32[value + (4 * i + 8) >> 2];
          view[i + 3] = HEAPF32[value + (4 * i + 12) >> 2];
          view[i + 4] = HEAPF32[value + (4 * i + 16) >> 2];
          view[i + 5] = HEAPF32[value + (4 * i + 20) >> 2];
          view[i + 6] = HEAPF32[value + (4 * i + 24) >> 2];
          view[i + 7] = HEAPF32[value + (4 * i + 28) >> 2];
          view[i + 8] = HEAPF32[value + (4 * i + 32) >> 2];
        }
      } else {
        var view = HEAPF32.subarray(value >> 2, value + count * 36 >> 2);
      }

      GLctx.uniformMatrix3fv(GL.uniforms[location], !!transpose, view);
    }

    function _glUniformMatrix4fv(location, count, transpose, value) {
      if (GL.currentContext.version >= 2) {
        GLctx.uniformMatrix4fv(GL.uniforms[location], !!transpose, HEAPF32, value >> 2, count * 16);
        return;
      }

      if (count <= 18) {
        var view = __miniTempWebGLFloatBuffers[16 * count - 1];
        var heap = HEAPF32;
        value >>= 2;

        for (var i = 0; i < 16 * count; i += 16) {
          var dst = value + i;
          view[i] = heap[dst];
          view[i + 1] = heap[dst + 1];
          view[i + 2] = heap[dst + 2];
          view[i + 3] = heap[dst + 3];
          view[i + 4] = heap[dst + 4];
          view[i + 5] = heap[dst + 5];
          view[i + 6] = heap[dst + 6];
          view[i + 7] = heap[dst + 7];
          view[i + 8] = heap[dst + 8];
          view[i + 9] = heap[dst + 9];
          view[i + 10] = heap[dst + 10];
          view[i + 11] = heap[dst + 11];
          view[i + 12] = heap[dst + 12];
          view[i + 13] = heap[dst + 13];
          view[i + 14] = heap[dst + 14];
          view[i + 15] = heap[dst + 15];
        }
      } else {
        var view = HEAPF32.subarray(value >> 2, value + count * 64 >> 2);
      }

      GLctx.uniformMatrix4fv(GL.uniforms[location], !!transpose, view);
    }

    function _glUseProgram(program) {
      GLctx.useProgram(GL.programs[program]);
    }

    function _glVertexAttribPointer(index, size, type, normalized, stride, ptr) {
      GLctx.vertexAttribPointer(index, size, type, !!normalized, stride, ptr);
    }

    function _glViewport(x0, x1, x2, x3) {
      GLctx["viewport"](x0, x1, x2, x3);
    }

    function _round(d) {
      d = +d;
      return d >= +0 ? +Math_floor(d + +.5) : +Math_ceil(d - +.5);
    }

    function _roundf(d) {
      d = +d;
      return d >= +0 ? +Math_floor(d + +.5) : +Math_ceil(d - +.5);
    }

    function _setTempRet0($i) {
      setTempRet0($i | 0);
    }

    Module["requestFullscreen"] = function Module_requestFullscreen(lockPointer, resizeCanvas) {
      Browser.requestFullscreen(lockPointer, resizeCanvas);
    };

    Module["requestAnimationFrame"] = function Module_requestAnimationFrame(func) {
      Browser.requestAnimationFrame(func);
    };

    Module["setCanvasSize"] = function Module_setCanvasSize(width, height, noUpdates) {
      Browser.setCanvasSize(width, height, noUpdates);
    };

    Module["pauseMainLoop"] = function Module_pauseMainLoop() {
      Browser.mainLoop.pause();
    };

    Module["resumeMainLoop"] = function Module_resumeMainLoop() {
      Browser.mainLoop.resume();
    };

    Module["getUserMedia"] = function Module_getUserMedia() {
      Browser.getUserMedia();
    };

    Module["createContext"] = function Module_createContext(canvas, useWebGL, setInModule, webGLContextAttributes) {
      return Browser.createContext(canvas, useWebGL, setInModule, webGLContextAttributes);
    };

    var GLctx;

    var __miniTempWebGLFloatBuffersStorage = new Float32Array(288);

    for (var i = 0; i < 288; ++i) {
      __miniTempWebGLFloatBuffers[i] = __miniTempWebGLFloatBuffersStorage.subarray(0, i + 1);
    }

    function intArrayFromString(stringy, dontAddNull, length) {
      var len = length > 0 ? length : lengthBytesUTF8(stringy) + 1;
      var u8array = new Array(len);
      var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
      if (dontAddNull) u8array.length = numBytesWritten;
      return u8array;
    }

    var asmLibraryArg = {
      "ka": _emscripten_async_wget2_abort,
      "ja": _emscripten_async_wget2_data,
      "e": _emscripten_longjmp,
      "fa": _emscripten_memcpy_big,
      "ga": _emscripten_resize_heap,
      "a": _exit,
      "ia": _fd_close,
      "ha": _fd_read,
      "ea": _fd_seek,
      "T": _fd_write,
      "h": _getTempRet0,
      "S": _gettimeofday,
      "o": _glActiveTexture,
      "B": _glAttachShader,
      "I": _glBindAttribLocation,
      "t": _glBindBuffer,
      "d": _glBindTexture,
      "Z": _glBlendColor,
      "E": _glBlendFunc,
      "l": _glBlendFuncSeparate,
      "x": _glBufferData,
      "_": _glClear,
      "za": _glClearColor,
      "m": _glColorMask,
      "K": _glCompileShader,
      "Y": _glCreateProgram,
      "D": _glCreateShader,
      "n": _glCullFace,
      "w": _glDeleteBuffers,
      "Aa": _glDeleteProgram,
      "$": _glDeleteShader,
      "R": _glDeleteTextures,
      "xa": _glDepthFunc,
      "s": _glDepthMask,
      "c": _glDisable,
      "N": _glDisableVertexAttribArray,
      "i": _glDrawArrays,
      "ta": _glDrawElements,
      "b": _glEnable,
      "Q": _glEnableVertexAttribArray,
      "ua": _glFinish,
      "Ba": _glFrontFace,
      "v": _glGenBuffers,
      "z": _glGenTextures,
      "da": _glGenerateMipmap,
      "pa": _glGetActiveUniform,
      "g": _glGetError,
      "va": _glGetIntegerv,
      "W": _glGetProgramInfoLog,
      "A": _glGetProgramiv,
      "J": _glGetShaderInfoLog,
      "C": _glGetShaderiv,
      "F": _glGetUniformLocation,
      "wa": _glLineWidth,
      "X": _glLinkProgram,
      "y": _glPixelStorei,
      "L": _glShaderSource,
      "p": _glStencilFunc,
      "G": _glStencilMask,
      "q": _glStencilOp,
      "aa": _glStencilOpSeparate,
      "H": _glTexImage2D,
      "U": _glTexParameterf,
      "u": _glTexParameteri,
      "Ca": _glTexSubImage2D,
      "na": _glUniform1f,
      "ma": _glUniform1fv,
      "ca": _glUniform1i,
      "ba": _glUniform2fv,
      "oa": _glUniform3fv,
      "O": _glUniform4fv,
      "la": _glUniformMatrix3fv,
      "V": _glUniformMatrix4fv,
      "j": _glUseProgram,
      "P": _glVertexAttribPointer,
      "ya": _glViewport,
      "sa": invoke_ii,
      "ra": invoke_iii,
      "r": invoke_vii,
      "qa": invoke_viiiii,
      "memory": wasmMemory,
      "k": _round,
      "M": _roundf,
      "f": _setTempRet0,
      "table": wasmTable
    };
    var asm = createWasm();

    var ___wasm_call_ctors = Module["___wasm_call_ctors"] = function () {
      return (___wasm_call_ctors = Module["___wasm_call_ctors"] = Module["asm"]["Da"]).apply(null, arguments);
    };

    var _convert_frame = Module["_convert_frame"] = function () {
      return (_convert_frame = Module["_convert_frame"] = Module["asm"]["Ea"]).apply(null, arguments);
    };

    var _free = Module["_free"] = function () {
      return (_free = Module["_free"] = Module["asm"]["Fa"]).apply(null, arguments);
    };

    var _convert_framev4 = Module["_convert_framev4"] = function () {
      return (_convert_framev4 = Module["_convert_framev4"] = Module["asm"]["Ga"]).apply(null, arguments);
    };

    var _obj_release = Module["_obj_release"] = function () {
      return (_obj_release = Module["_obj_release"] = Module["asm"]["Ha"]).apply(null, arguments);
    };

    var _malloc = Module["_malloc"] = function () {
      return (_malloc = Module["_malloc"] = Module["asm"]["Ia"]).apply(null, arguments);
    };

    var _module_update = Module["_module_update"] = function () {
      return (_module_update = Module["_module_update"] = Module["asm"]["Ja"]).apply(null, arguments);
    };

    var _module_list_objs2 = Module["_module_list_objs2"] = function () {
      return (_module_list_objs2 = Module["_module_list_objs2"] = Module["asm"]["Ka"]).apply(null, arguments);
    };

    var _module_add_data_source = Module["_module_add_data_source"] = function () {
      return (_module_add_data_source = Module["_module_add_data_source"] = Module["asm"]["La"]).apply(null, arguments);
    };

    var _module_add_global_listener = Module["_module_add_global_listener"] = function () {
      return (_module_add_global_listener = Module["_module_add_global_listener"] = Module["asm"]["Ma"]).apply(null, arguments);
    };

    var _module_add = Module["_module_add"] = function () {
      return (_module_add = Module["_module_add"] = Module["asm"]["Na"]).apply(null, arguments);
    };

    var _obj_retain = Module["_obj_retain"] = function () {
      return (_obj_retain = Module["_obj_retain"] = Module["asm"]["Oa"]).apply(null, arguments);
    };

    var _module_add_new = Module["_module_add_new"] = function () {
      return (_module_add_new = Module["_module_add_new"] = Module["asm"]["Pa"]).apply(null, arguments);
    };

    var _module_remove = Module["_module_remove"] = function () {
      return (_module_remove = Module["_module_remove"] = Module["asm"]["Qa"]).apply(null, arguments);
    };

    var _module_get_child = Module["_module_get_child"] = function () {
      return (_module_get_child = Module["_module_get_child"] = Module["asm"]["Ra"]).apply(null, arguments);
    };

    var _module_get_tree = Module["_module_get_tree"] = function () {
      return (_module_get_tree = Module["_module_get_tree"] = Module["asm"]["Sa"]).apply(null, arguments);
    };

    var _module_get_path = Module["_module_get_path"] = function () {
      return (_module_get_path = Module["_module_get_path"] = Module["asm"]["Ta"]).apply(null, arguments);
    };

    var _sys_set_translate_function = Module["_sys_set_translate_function"] = function () {
      return (_sys_set_translate_function = Module["_sys_set_translate_function"] = Module["asm"]["Ua"]).apply(null, arguments);
    };

    var _core_add_font = Module["_core_add_font"] = function () {
      return (_core_add_font = Module["_core_add_font"] = Module["asm"]["Va"]).apply(null, arguments);
    };

    var _compute_event = Module["_compute_event"] = function () {
      return (_compute_event = Module["_compute_event"] = Module["asm"]["Wa"]).apply(null, arguments);
    };

    var _observer_update = Module["_observer_update"] = function () {
      return (_observer_update = Module["_observer_update"] = Module["asm"]["Xa"]).apply(null, arguments);
    };

    var _get_compiler_str = Module["_get_compiler_str"] = function () {
      return (_get_compiler_str = Module["_get_compiler_str"] = Module["asm"]["Ya"]).apply(null, arguments);
    };

    var _a2tf_json = Module["_a2tf_json"] = function () {
      return (_a2tf_json = Module["_a2tf_json"] = Module["asm"]["Za"]).apply(null, arguments);
    };

    var _a2af_json = Module["_a2af_json"] = function () {
      return (_a2af_json = Module["_a2af_json"] = Module["asm"]["_a"]).apply(null, arguments);
    };

    var _designation_cleanup = Module["_designation_cleanup"] = function () {
      return (_designation_cleanup = Module["_designation_cleanup"] = Module["asm"]["$a"]).apply(null, arguments);
    };

    var _obj_create_str = Module["_obj_create_str"] = function () {
      return (_obj_create_str = Module["_obj_create_str"] = Module["asm"]["ab"]).apply(null, arguments);
    };

    var _obj_clone = Module["_obj_clone"] = function () {
      return (_obj_clone = Module["_obj_clone"] = Module["asm"]["bb"]).apply(null, arguments);
    };

    var _obj_get_designations = Module["_obj_get_designations"] = function () {
      return (_obj_get_designations = Module["_obj_get_designations"] = Module["asm"]["cb"]).apply(null, arguments);
    };

    var _obj_get_info_json = Module["_obj_get_info_json"] = function () {
      return (_obj_get_info_json = Module["_obj_get_info_json"] = Module["asm"]["db"]).apply(null, arguments);
    };

    var _obj_get_id = Module["_obj_get_id"] = function () {
      return (_obj_get_id = Module["_obj_get_id"] = Module["asm"]["eb"]).apply(null, arguments);
    };

    var _obj_get_json_data_str = Module["_obj_get_json_data_str"] = function () {
      return (_obj_get_json_data_str = Module["_obj_get_json_data_str"] = Module["asm"]["fb"]).apply(null, arguments);
    };

    var _obj_get_attr_ = Module["_obj_get_attr_"] = function () {
      return (_obj_get_attr_ = Module["_obj_get_attr_"] = Module["asm"]["gb"]).apply(null, arguments);
    };

    var _obj_foreach_attr = Module["_obj_foreach_attr"] = function () {
      return (_obj_foreach_attr = Module["_obj_foreach_attr"] = Module["asm"]["hb"]).apply(null, arguments);
    };

    var _obj_foreach_child = Module["_obj_foreach_child"] = function () {
      return (_obj_foreach_child = Module["_obj_foreach_child"] = Module["asm"]["ib"]).apply(null, arguments);
    };

    var _obj_call_json_str = Module["_obj_call_json_str"] = function () {
      return (_obj_call_json_str = Module["_obj_call_json_str"] = Module["asm"]["jb"]).apply(null, arguments);
    };

    var _core_get_module = Module["_core_get_module"] = function () {
      return (_core_get_module = Module["_core_get_module"] = Module["asm"]["kb"]).apply(null, arguments);
    };

    var _core_init = Module["_core_init"] = function () {
      return (_core_init = Module["_core_init"] = Module["asm"]["lb"]).apply(null, arguments);
    };

    var _core_update = Module["_core_update"] = function () {
      return (_core_update = Module["_core_update"] = Module["asm"]["mb"]).apply(null, arguments);
    };

    var _core_render = Module["_core_render"] = function () {
      return (_core_render = Module["_core_render"] = Module["asm"]["nb"]).apply(null, arguments);
    };

    var _core_on_mouse = Module["_core_on_mouse"] = function () {
      return (_core_on_mouse = Module["_core_on_mouse"] = Module["asm"]["ob"]).apply(null, arguments);
    };

    var _core_on_pinch = Module["_core_on_pinch"] = function () {
      return (_core_on_pinch = Module["_core_on_pinch"] = Module["asm"]["pb"]).apply(null, arguments);
    };

    var _core_on_key = Module["_core_on_key"] = function () {
      return (_core_on_key = Module["_core_on_key"] = Module["asm"]["qb"]).apply(null, arguments);
    };

    var _core_on_zoom = Module["_core_on_zoom"] = function () {
      return (_core_on_zoom = Module["_core_on_zoom"] = Module["asm"]["rb"]).apply(null, arguments);
    };

    var _core_lookat = Module["_core_lookat"] = function () {
      return (_core_lookat = Module["_core_lookat"] = Module["asm"]["sb"]).apply(null, arguments);
    };

    var _core_point_and_lock = Module["_core_point_and_lock"] = function () {
      return (_core_point_and_lock = Module["_core_point_and_lock"] = Module["asm"]["tb"]).apply(null, arguments);
    };

    var _core_zoomto = Module["_core_zoomto"] = function () {
      return (_core_zoomto = Module["_core_zoomto"] = Module["asm"]["ub"]).apply(null, arguments);
    };

    var _core_set_time = Module["_core_set_time"] = function () {
      return (_core_set_time = Module["_core_set_time"] = Module["asm"]["vb"]).apply(null, arguments);
    };

    var _otype_to_str = Module["_otype_to_str"] = function () {
      return (_otype_to_str = Module["_otype_to_str"] = Module["asm"]["wb"]).apply(null, arguments);
    };

    var _core_search = Module["_core_search"] = function () {
      return (_core_search = Module["_core_search"] = Module["asm"]["xb"]).apply(null, arguments);
    };

    var _skycultures_get_designations = Module["_skycultures_get_designations"] = function () {
      return (_skycultures_get_designations = Module["_skycultures_get_designations"] = Module["asm"]["yb"]).apply(null, arguments);
    };

    var _skycultures_get_cultural_names_json = Module["_skycultures_get_cultural_names_json"] = function () {
      return (_skycultures_get_cultural_names_json = Module["_skycultures_get_cultural_names_json"] = Module["asm"]["zb"]).apply(null, arguments);
    };

    var _geojson_set_bool_ptr_ = Module["_geojson_set_bool_ptr_"] = function () {
      return (_geojson_set_bool_ptr_ = Module["_geojson_set_bool_ptr_"] = Module["asm"]["Ab"]).apply(null, arguments);
    };

    var _geojson_set_color_ptr_ = Module["_geojson_set_color_ptr_"] = function () {
      return (_geojson_set_color_ptr_ = Module["_geojson_set_color_ptr_"] = Module["asm"]["Bb"]).apply(null, arguments);
    };

    var _geojson_remove_all_features = Module["_geojson_remove_all_features"] = function () {
      return (_geojson_remove_all_features = Module["_geojson_remove_all_features"] = Module["asm"]["Cb"]).apply(null, arguments);
    };

    var _geojson_filter_all = Module["_geojson_filter_all"] = function () {
      return (_geojson_filter_all = Module["_geojson_filter_all"] = Module["asm"]["Db"]).apply(null, arguments);
    };

    var _geojson_add_poly_feature = Module["_geojson_add_poly_feature"] = function () {
      return (_geojson_add_poly_feature = Module["_geojson_add_poly_feature"] = Module["asm"]["Eb"]).apply(null, arguments);
    };

    var _geojson_query_rendered_features = Module["_geojson_query_rendered_features"] = function () {
      return (_geojson_query_rendered_features = Module["_geojson_query_rendered_features"] = Module["asm"]["Fb"]).apply(null, arguments);
    };

    var _geojson_set_on_new_tile_callback = Module["_geojson_set_on_new_tile_callback"] = function () {
      return (_geojson_set_on_new_tile_callback = Module["_geojson_set_on_new_tile_callback"] = Module["asm"]["Gb"]).apply(null, arguments);
    };

    var _geojson_survey_query_rendered_features = Module["_geojson_survey_query_rendered_features"] = function () {
      return (_geojson_survey_query_rendered_features = Module["_geojson_survey_query_rendered_features"] = Module["asm"]["Hb"]).apply(null, arguments);
    };

    var _setThrew = Module["_setThrew"] = function () {
      return (_setThrew = Module["_setThrew"] = Module["asm"]["Ib"]).apply(null, arguments);
    };

    var stackSave = Module["stackSave"] = function () {
      return (stackSave = Module["stackSave"] = Module["asm"]["Jb"]).apply(null, arguments);
    };

    var stackRestore = Module["stackRestore"] = function () {
      return (stackRestore = Module["stackRestore"] = Module["asm"]["Kb"]).apply(null, arguments);
    };

    var stackAlloc = Module["stackAlloc"] = function () {
      return (stackAlloc = Module["stackAlloc"] = Module["asm"]["Lb"]).apply(null, arguments);
    };

    var dynCall_vi = Module["dynCall_vi"] = function () {
      return (dynCall_vi = Module["dynCall_vi"] = Module["asm"]["Mb"]).apply(null, arguments);
    };

    var dynCall_vii = Module["dynCall_vii"] = function () {
      return (dynCall_vii = Module["dynCall_vii"] = Module["asm"]["Nb"]).apply(null, arguments);
    };

    var dynCall_viiiii = Module["dynCall_viiiii"] = function () {
      return (dynCall_viiiii = Module["dynCall_viiiii"] = Module["asm"]["Ob"]).apply(null, arguments);
    };

    var dynCall_ii = Module["dynCall_ii"] = function () {
      return (dynCall_ii = Module["dynCall_ii"] = Module["asm"]["Pb"]).apply(null, arguments);
    };

    var dynCall_iii = Module["dynCall_iii"] = function () {
      return (dynCall_iii = Module["dynCall_iii"] = Module["asm"]["Qb"]).apply(null, arguments);
    };

    var dynCall_viiii = Module["dynCall_viiii"] = function () {
      return (dynCall_viiii = Module["dynCall_viiii"] = Module["asm"]["Rb"]).apply(null, arguments);
    };

    function invoke_vii(index, a1, a2) {
      var sp = stackSave();

      try {
        dynCall_vii(index, a1, a2);
      } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;

        _setThrew(1, 0);
      }
    }

    function invoke_ii(index, a1) {
      var sp = stackSave();

      try {
        return dynCall_ii(index, a1);
      } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;

        _setThrew(1, 0);
      }
    }

    function invoke_iii(index, a1, a2) {
      var sp = stackSave();

      try {
        return dynCall_iii(index, a1, a2);
      } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;

        _setThrew(1, 0);
      }
    }

    function invoke_viiiii(index, a1, a2, a3, a4, a5) {
      var sp = stackSave();

      try {
        dynCall_viiiii(index, a1, a2, a3, a4, a5);
      } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;

        _setThrew(1, 0);
      }
    }

    Module["intArrayFromString"] = intArrayFromString;
    Module["ccall"] = ccall;
    Module["cwrap"] = cwrap;
    Module["setValue"] = setValue;
    Module["getValue"] = getValue;
    Module["allocate"] = allocate;
    Module["UTF8ToString"] = UTF8ToString;
    Module["stringToUTF8"] = stringToUTF8;
    Module["lengthBytesUTF8"] = lengthBytesUTF8;
    Module["writeArrayToMemory"] = writeArrayToMemory;
    Module["writeAsciiToMemory"] = writeAsciiToMemory;
    Module["addFunction"] = addFunction;
    Module["removeFunction"] = removeFunction;
    Module["GL"] = GL;
    Module["ALLOC_NORMAL"] = ALLOC_NORMAL;
    var calledRun;

    function ExitStatus(status) {
      this.name = "ExitStatus";
      this.message = "Program terminated with exit(" + status + ")";
      this.status = status;
    }

    dependenciesFulfilled = function runCaller() {
      if (!calledRun) run();
      if (!calledRun) dependenciesFulfilled = runCaller;
    };

    function run(args) {
      args = args || arguments_;

      if (runDependencies > 0) {
        return;
      }

      preRun();
      if (runDependencies > 0) return;

      function doRun() {
        if (calledRun) return;
        calledRun = true;
        Module["calledRun"] = true;
        if (ABORT) return;
        initRuntime();
        preMain();
        readyPromiseResolve(Module);
        if (Module["onRuntimeInitialized"]) Module["onRuntimeInitialized"]();
        postRun();
      }

      if (Module["setStatus"]) {
        Module["setStatus"]("Running...");
        setTimeout(function () {
          setTimeout(function () {
            Module["setStatus"]("");
          }, 1);
          doRun();
        }, 1);
      } else {
        doRun();
      }
    }

    Module["run"] = run;

    function exit(status, implicit) {
      if (implicit && noExitRuntime && status === 0) {
        return;
      }

      if (noExitRuntime) {} else {
        ABORT = true;
        EXITSTATUS = status;
        exitRuntime();
        if (Module["onExit"]) Module["onExit"](status);
      }

      quit_(status, new ExitStatus(status));
    }

    if (Module["preInit"]) {
      if (typeof Module["preInit"] == "function") Module["preInit"] = [Module["preInit"]];

      while (Module["preInit"].length > 0) {
        Module["preInit"].pop()();
      }
    }

    noExitRuntime = true;
    run();
    return StelWebEngine.ready;
  };
}();

/* harmony default export */ __webpack_exports__["a"] = (StelWebEngine);
/* WEBPACK VAR INJECTION */}.call(this, "/index.js", __webpack_require__("4362"), "/"))

/***/ }),

/***/ "c5ac":
/***/ (function(module, exports) {

//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//

/***/ }),

/***/ "c885":
/***/ (function(module, exports, __webpack_require__) {

// extracted by mini-css-extract-plugin

/***/ }),

/***/ "cbeb":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var _node_modules_mini_css_extract_plugin_dist_loader_js_ref_7_oneOf_1_0_node_modules_css_loader_dist_cjs_js_ref_7_oneOf_1_1_node_modules_vue_loader_lib_loaders_stylePostLoader_js_node_modules_postcss_loader_src_index_js_ref_7_oneOf_1_2_node_modules_cache_loader_dist_cjs_js_ref_1_0_node_modules_vue_loader_lib_index_js_vue_loader_options_gui_loader_vue_vue_type_style_index_0_lang_css___WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("89fa");
/* harmony import */ var _node_modules_mini_css_extract_plugin_dist_loader_js_ref_7_oneOf_1_0_node_modules_css_loader_dist_cjs_js_ref_7_oneOf_1_1_node_modules_vue_loader_lib_loaders_stylePostLoader_js_node_modules_postcss_loader_src_index_js_ref_7_oneOf_1_2_node_modules_cache_loader_dist_cjs_js_ref_1_0_node_modules_vue_loader_lib_index_js_vue_loader_options_gui_loader_vue_vue_type_style_index_0_lang_css___WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_mini_css_extract_plugin_dist_loader_js_ref_7_oneOf_1_0_node_modules_css_loader_dist_cjs_js_ref_7_oneOf_1_1_node_modules_vue_loader_lib_loaders_stylePostLoader_js_node_modules_postcss_loader_src_index_js_ref_7_oneOf_1_2_node_modules_cache_loader_dist_cjs_js_ref_1_0_node_modules_vue_loader_lib_index_js_vue_loader_options_gui_loader_vue_vue_type_style_index_0_lang_css___WEBPACK_IMPORTED_MODULE_0__);
/* unused harmony reexport * */


/***/ }),

/***/ "d8fb":
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__.p + "img/btn-cst-lines.1844e97d.svg";

/***/ }),

/***/ "dbeb":
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__.p + "img/btn-landscape.8fc552f5.svg";

/***/ }),

/***/ "e0fc":
/***/ (function(module, exports, __webpack_require__) {

// extracted by mini-css-extract-plugin

/***/ }),

/***/ "e4c8":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var _node_modules_mini_css_extract_plugin_dist_loader_js_ref_7_oneOf_1_0_node_modules_css_loader_dist_cjs_js_ref_7_oneOf_1_1_node_modules_vue_loader_lib_loaders_stylePostLoader_js_node_modules_postcss_loader_src_index_js_ref_7_oneOf_1_2_node_modules_cache_loader_dist_cjs_js_ref_1_0_node_modules_vue_loader_lib_index_js_vue_loader_options_oras_dense_stars_status_dialog_vue_vue_type_style_index_0_id_0e713f36_scoped_true_lang_css___WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("4ca5");
/* harmony import */ var _node_modules_mini_css_extract_plugin_dist_loader_js_ref_7_oneOf_1_0_node_modules_css_loader_dist_cjs_js_ref_7_oneOf_1_1_node_modules_vue_loader_lib_loaders_stylePostLoader_js_node_modules_postcss_loader_src_index_js_ref_7_oneOf_1_2_node_modules_cache_loader_dist_cjs_js_ref_1_0_node_modules_vue_loader_lib_index_js_vue_loader_options_oras_dense_stars_status_dialog_vue_vue_type_style_index_0_id_0e713f36_scoped_true_lang_css___WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_mini_css_extract_plugin_dist_loader_js_ref_7_oneOf_1_0_node_modules_css_loader_dist_cjs_js_ref_7_oneOf_1_1_node_modules_vue_loader_lib_loaders_stylePostLoader_js_node_modules_postcss_loader_src_index_js_ref_7_oneOf_1_2_node_modules_cache_loader_dist_cjs_js_ref_1_0_node_modules_vue_loader_lib_index_js_vue_loader_options_oras_dense_stars_status_dialog_vue_vue_type_style_index_0_id_0e713f36_scoped_true_lang_css___WEBPACK_IMPORTED_MODULE_0__);
/* unused harmony reexport * */


/***/ }),

/***/ "edd4":
/***/ (function(module) {

module.exports = JSON.parse("{\"Hub Frontpage\":\"Hub Frontpage\",\"Recheck Runtime\":\"Recheck Runtime\",\"Open Standalone Runtime\":\"Open Standalone Runtime\",\"View Settings\":\"View Settings\",\"Planets Tonight\":\"Planets Tonight\",\"Data Credits\":\"Data Credits\",\"Search...\":\"Search...\",\"Observe\":\"Observe\",\"Constellations\":\"Constellations\",\"Constellations Art\":\"Constellations Art\",\"Atmosphere\":\"Atmosphere\",\"Landscape\":\"Landscape\",\"Azimuthal Grid\":\"Azimuthal Grid\",\"Equatorial Grid\":\"Equatorial Grid\",\"Deep Sky Objects\":\"Deep Sky Objects\",\"Night Mode\":\"Night Mode\",\"Fullscreen\":\"Fullscreen\",\"Loading {0}, the online Star Map\":\"Loading {0}, the online Star Map\",\"Could not show the Online Star Map\":\"Could not show the Online Star Map\",\"It seems that your browser cannot load Web Assembly!\":\"It seems that your browser cannot load Web Assembly!\",\"Web assembly is necessary for ORAS Sky-Engine to display the star map. Please upgrade your web browser and try again!\":\"Web assembly is necessary for ORAS Sky-Engine to display the star map. Please upgrade your web browser and try again!\",\"desktop version\":\"desktop version\",\"In the meantime, you can try the {0}!\":\"In the meantime, you can try the {0}!\",\"Use Autolocation\":\"Use Autolocation\",\"My Locations\":\"My Locations\",\"Use this location\":\"Use this location\",\"Unknown Address\":\"Unknown Address\",\"Lat {0}° Lon {1}°\":\"Lat {0}° Lon {1}°\",\"Unknown\":\"Unknown\",\"Near {0}\":\"Near {0}\",\"Planets Visibility\":\"Planets Visibility\",\"Night from {0} to {1}\":\"Night from {0} to {1}\",\"Rise\":\"Rise\",\"Set\":\"Set\",\"Magnitude\":\"Magnitude\",\"Distance\":\"Distance\",\"Radius\":\"Radius\",\"Spectral Type\":\"Spectral Type\",\"Size\":\"Size\",\"Ra/Dec\":\"Ra/Dec\",\"Az/Alt\":\"Az/Alt\",\"Phase\":\"Phase\",\"Not visible tonight\":\"Not visible tonight\",\"Always visible tonight\":\"Always visible tonight\",\"Rise: {0}&nbsp;&nbsp;&nbsp; Set: {1}\":\"Rise: {0}&nbsp;&nbsp;&nbsp; Set: {1}\",\"Visibility\":\"Visibility\",\"View settings\":\"View settings\",\"Milky Way\":\"Milky Way\",\"DSS\":\"DSS\",\"Simulate refraction\":\"Simulate refraction\",\"Meridian Line\":\"Meridian Line\",\"Ecliptic Line\":\"Ecliptic Line\",\"Back to real time\":\"Back to real time\",\"Pause/unpause time\":\"Pause/unpause time\",\"Dark night\":\"Dark night\",\"Moonlight\":\"Moonlight\",\"Dawn\":\"Dawn\",\"Twilight\":\"Twilight\",\"Daylight\":\"Daylight\"}");

/***/ }),

/***/ "f390":
/***/ (function(module, exports, __webpack_require__) {

// extracted by mini-css-extract-plugin

/***/ }),

/***/ "f693":
/***/ (function(module) {

module.exports = JSON.parse("{\"View Settings\":\"Paramètres d'affichage\",\"Planets Tonight\":\"Planètes ce soir\",\"Data Credits\":\"Crédits des données\",\"Search...\":\"Chercher...\",\"Observe\":\"Observer\",\"Constellations\":\"Constellations\",\"Constellations Art\":\"Images des Constellations\",\"Atmosphere\":\"Atmosphère\",\"Landscape\":\"Paysage\",\"Azimuthal Grid\":\"Grille Azimutale\",\"Equatorial Grid\":\"Grille Equatoriale\",\"Deep Sky Objects\":\"Objects du Ciel Profond\",\"Night Mode\":\"Mode Nuit\",\"Fullscreen\":\"Plein Ecran\",\"Loading {0}, the online Star Map\":\"Chargement de {0}, la carte du ciel en ligne\",\"Could not show the Online Star Map\":\"N'a pas pu afficher la carte du ciel en ligne\",\"It seems that your browser cannot load Web Assembly!\":\"Il semble que votre navigateur ne peut pas charger le Web Assembly!\",\"Web assembly is necessary for ORAS Sky-Engine to display the star map. Please upgrade your web browser and try again!\":\"Web assembly est nécessaire pour afficher ORAS Sky-Engine. Merci de mettre à jour et recommencer!\",\"desktop version\":\"version desktop\",\"In the meantime, you can try the {0}!\":\"En attendant, vous pouvez essayer la {0}!\",\"Use Autolocation\":\"Utiliser l'auto-localisation\",\"My Locations\":\"Mes Lieux\",\"Use this location\":\"Utiliser ce lieu\",\"Unknown Address\":\"Adresse Inconnue\",\"Lat {0}° Lon {1}°\":\"Lat {0}° Lon {1}°\",\"Unknown\":\"Inconnu\",\"Near {0}\":\"Près de {0}\",\"Planets Visibility\":\"Visibilité des planètes\",\"Night from {0} to {1}\":\"Nuit du {0} au {1}\",\"Rise\":\"Lever\",\"Set\":\"Coucher\",\"Magnitude\":\"Magnitude\",\"Distance\":\"Distance\",\"Radius\":\"Rayon\",\"Spectral Type\":\"Type Spectral\",\"Size\":\"Taille\",\"Ra/Dec\":\"Ra/Dec\",\"Az/Alt\":\"Az/Alt\",\"Phase\":\"Phase\",\"Not visible tonight\":\"Pas visible cette nuit\",\"Always visible tonight\":\"Toujours visible cette nuit\",\"Rise: {0}&nbsp;&nbsp;&nbsp; Set: {1}\":\"Lever: {0}&nbsp;&nbsp;&nbsp; Coucher: {1}\",\"Visibility\":\"Visibilité\",\"View settings\":\"Paramètres d'affichage\",\"Milky Way\":\"Voie Lactée\",\"DSS\":\"DSS\",\"Simulate refraction\":\"Simuler la réfraction\",\"Meridian Line\":\"Ligne du méridien\",\"Ecliptic Line\":\"Ligne de l'écliptique\",\"Back to real time\":\"Retour au temps réel\",\"Pause/unpause time\":\"Pause/avance le temps\",\"Dark night\":\"Nuit sombre\",\"Moonlight\":\"Clair de lune\",\"Dawn\":\"Aube\",\"Twilight\":\"Crépuscule\",\"Daylight\":\"Jour\"}");

/***/ }),

/***/ "f6ce":
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__.p + "img/add_circle_outline.24a5986c.svg";

/***/ })

/******/ });