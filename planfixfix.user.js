// ==UserScript==
// @name           PlanfixFix
// @author         popstas
// @version        0.6.3
// @namespace      viasite.ru
// @description    Some planfix.ru improvements
// @unwrap
// @noframes
// @run-at         document-end
// @updateURL      https://raw.githubusercontent.com/viasite/userscript-planfixfix/master/dist/planfixfix.user.js
// @include        https://tagilcity.planfix.ru/*
// @match          https://tagilcity.planfix.ru/*
// @grant          GM_xmlhttpRequest
// ==/UserScript==

(function () {
  // https://github.com/nodeca/js-yaml
  !function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{("undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:this).jsyaml=e()}}(function(){return function o(a,s,c){function u(t,e){if(!s[t]){if(!a[t]){var n="function"==typeof require&&require;if(!e&&n)return n(t,!0);if(l)return l(t,!0);var i=new Error("Cannot find module '"+t+"'");throw i.code="MODULE_NOT_FOUND",i}var r=s[t]={exports:{}};a[t][0].call(r.exports,function(e){return u(a[t][1][e]||e)},r,r.exports,o,a,s,c)}return s[t].exports}for(var l="function"==typeof require&&require,e=0;e<c.length;e++)u(c[e]);return u}({1:[function(e,t,n){"use strict";var i=e("./js-yaml/loader"),r=e("./js-yaml/dumper");function o(e){return function(){throw new Error("Function "+e+" is deprecated and cannot be used.")}}t.exports.Type=e("./js-yaml/type"),t.exports.Schema=e("./js-yaml/schema"),t.exports.FAILSAFE_SCHEMA=e("./js-yaml/schema/failsafe"),t.exports.JSON_SCHEMA=e("./js-yaml/schema/json"),t.exports.CORE_SCHEMA=e("./js-yaml/schema/core"),t.exports.DEFAULT_SAFE_SCHEMA=e("./js-yaml/schema/default_safe"),t.exports.DEFAULT_FULL_SCHEMA=e("./js-yaml/schema/default_full"),t.exports.load=i.load,t.exports.loadAll=i.loadAll,t.exports.safeLoad=i.safeLoad,t.exports.safeLoadAll=i.safeLoadAll,t.exports.dump=r.dump,t.exports.safeDump=r.safeDump,t.exports.YAMLException=e("./js-yaml/exception"),t.exports.MINIMAL_SCHEMA=e("./js-yaml/schema/failsafe"),t.exports.SAFE_SCHEMA=e("./js-yaml/schema/default_safe"),t.exports.DEFAULT_SCHEMA=e("./js-yaml/schema/default_full"),t.exports.scan=o("scan"),t.exports.parse=o("parse"),t.exports.compose=o("compose"),t.exports.addConstructor=o("addConstructor")},{"./js-yaml/dumper":3,"./js-yaml/exception":4,"./js-yaml/loader":5,"./js-yaml/schema":7,"./js-yaml/schema/core":8,"./js-yaml/schema/default_full":9,"./js-yaml/schema/default_safe":10,"./js-yaml/schema/failsafe":11,"./js-yaml/schema/json":12,"./js-yaml/type":13}],2:[function(e,t,n){"use strict";function i(e){return null==e}t.exports.isNothing=i,t.exports.isObject=function(e){return"object"==typeof e&&null!==e},t.exports.toArray=function(e){return Array.isArray(e)?e:i(e)?[]:[e]},t.exports.repeat=function(e,t){var n,i="";for(n=0;n<t;n+=1)i+=e;return i},t.exports.isNegativeZero=function(e){return 0===e&&Number.NEGATIVE_INFINITY===1/e},t.exports.extend=function(e,t){var n,i,r,o;if(t)for(n=0,i=(o=Object.keys(t)).length;n<i;n+=1)e[r=o[n]]=t[r];return e}},{}],3:[function(e,t,n){"use strict";var c=e("./common"),d=e("./exception"),i=e("./schema/default_full"),r=e("./schema/default_safe"),p=Object.prototype.toString,u=Object.prototype.hasOwnProperty,o=9,h=10,a=32,f=33,m=34,g=35,y=37,x=38,v=39,A=42,b=44,w=45,C=58,k=62,j=63,S=64,I=91,O=93,E=96,F=123,_=124,N=125,s={0:"\\0",7:"\\a",8:"\\b",9:"\\t",10:"\\n",11:"\\v",12:"\\f",13:"\\r",27:"\\e",34:'\\"',92:"\\\\",133:"\\N",160:"\\_",8232:"\\L",8233:"\\P"},l=["y","Y","yes","Yes","YES","on","On","ON","n","N","no","No","NO","off","Off","OFF"];function M(e){var t,n,i;if(t=e.toString(16).toUpperCase(),e<=255)n="x",i=2;else if(e<=65535)n="u",i=4;else{if(!(e<=4294967295))throw new d("code point within a string may not be greater than 0xFFFFFFFF");n="U",i=8}return"\\"+n+c.repeat("0",i-t.length)+t}function T(e){this.schema=e.schema||i,this.indent=Math.max(1,e.indent||2),this.noArrayIndent=e.noArrayIndent||!1,this.skipInvalid=e.skipInvalid||!1,this.flowLevel=c.isNothing(e.flowLevel)?-1:e.flowLevel,this.styleMap=function(e,t){var n,i,r,o,a,s,c;if(null===t)return{};for(n={},r=0,o=(i=Object.keys(t)).length;r<o;r+=1)a=i[r],s=String(t[a]),"!!"===a.slice(0,2)&&(a="tag:yaml.org,2002:"+a.slice(2)),(c=e.compiledTypeMap.fallback[a])&&u.call(c.styleAliases,s)&&(s=c.styleAliases[s]),n[a]=s;return n}(this.schema,e.styles||null),this.sortKeys=e.sortKeys||!1,this.lineWidth=e.lineWidth||80,this.noRefs=e.noRefs||!1,this.noCompatMode=e.noCompatMode||!1,this.condenseFlow=e.condenseFlow||!1,this.implicitTypes=this.schema.compiledImplicit,this.explicitTypes=this.schema.compiledExplicit,this.tag=null,this.result="",this.duplicates=[],this.usedDuplicates=null}function L(e,t){for(var n,i=c.repeat(" ",t),r=0,o=-1,a="",s=e.length;r<s;)r=-1===(o=e.indexOf("\n",r))?(n=e.slice(r),s):(n=e.slice(r,o+1),o+1),n.length&&"\n"!==n&&(a+=i),a+=n;return a}function D(e,t){return"\n"+c.repeat(" ",e.indent*t)}function U(e){return e===a||e===o}function q(e){return 32<=e&&e<=126||161<=e&&e<=55295&&8232!==e&&8233!==e||57344<=e&&e<=65533&&65279!==e||65536<=e&&e<=1114111}function Y(e){return q(e)&&65279!==e&&e!==b&&e!==I&&e!==O&&e!==F&&e!==N&&e!==C&&e!==g}function R(e){return/^\n* /.test(e)}var B=1,P=2,W=3,K=4,$=5;function H(e,t,n,i,r){var o,a,s=!1,c=!1,u=-1!==i,l=-1,p=function(e){return q(e)&&65279!==e&&!U(e)&&e!==w&&e!==j&&e!==C&&e!==b&&e!==I&&e!==O&&e!==F&&e!==N&&e!==g&&e!==x&&e!==A&&e!==f&&e!==_&&e!==k&&e!==v&&e!==m&&e!==y&&e!==S&&e!==E}(e.charCodeAt(0))&&!U(e.charCodeAt(e.length-1));if(t)for(o=0;o<e.length;o++){if(!q(a=e.charCodeAt(o)))return $;p=p&&Y(a)}else{for(o=0;o<e.length;o++){if((a=e.charCodeAt(o))===h)s=!0,u&&(c=c||i<o-l-1&&" "!==e[l+1],l=o);else if(!q(a))return $;p=p&&Y(a)}c=c||u&&i<o-l-1&&" "!==e[l+1]}return s||c?9<n&&R(e)?$:c?K:W:p&&!r(e)?B:P}function G(i,r,o,a){i.dump=function(){if(0===r.length)return"''";if(!i.noCompatMode&&-1!==l.indexOf(r))return"'"+r+"'";var e=i.indent*Math.max(1,o),t=-1===i.lineWidth?-1:Math.max(Math.min(i.lineWidth,40),i.lineWidth-e),n=a||-1<i.flowLevel&&o>=i.flowLevel;switch(H(r,n,i.indent,t,function(e){return function(e,t){var n,i;for(n=0,i=e.implicitTypes.length;n<i;n+=1)if(e.implicitTypes[n].resolve(t))return!0;return!1}(i,e)})){case B:return r;case P:return"'"+r.replace(/'/g,"''")+"'";case W:return"|"+V(r,i.indent)+Z(L(r,e));case K:return">"+V(r,i.indent)+Z(L(function(t,n){var e,i,r=/(\n+)([^\n]*)/g,o=function(){var e=t.indexOf("\n");return e=-1!==e?e:t.length,r.lastIndex=e,z(t.slice(0,e),n)}(),a="\n"===t[0]||" "===t[0];for(;i=r.exec(t);){var s=i[1],c=i[2];e=" "===c[0],o+=s+(a||e||""===c?"":"\n")+z(c,n),a=e}return o}(r,t),e));case $:return'"'+function(e){for(var t,n,i,r="",o=0;o<e.length;o++)55296<=(t=e.charCodeAt(o))&&t<=56319&&56320<=(n=e.charCodeAt(o+1))&&n<=57343?(r+=M(1024*(t-55296)+n-56320+65536),o++):(i=s[t],r+=!i&&q(t)?e[o]:i||M(t));return r}(r)+'"';default:throw new d("impossible error: invalid scalar style")}}()}function V(e,t){var n=R(e)?String(t):"",i="\n"===e[e.length-1];return n+(i&&("\n"===e[e.length-2]||"\n"===e)?"+":i?"":"-")+"\n"}function Z(e){return"\n"===e[e.length-1]?e.slice(0,-1):e}function z(e,t){if(""===e||" "===e[0])return e;for(var n,i,r=/ [^ ]/g,o=0,a=0,s=0,c="";n=r.exec(e);)t<(s=n.index)-o&&(i=o<a?a:s,c+="\n"+e.slice(o,i),o=i+1),a=s;return c+="\n",e.length-o>t&&o<a?c+=e.slice(o,a)+"\n"+e.slice(a+1):c+=e.slice(o),c.slice(1)}function J(e,t,n){var i,r,o,a,s,c;for(o=0,a=(r=n?e.explicitTypes:e.implicitTypes).length;o<a;o+=1)if(((s=r[o]).instanceOf||s.predicate)&&(!s.instanceOf||"object"==typeof t&&t instanceof s.instanceOf)&&(!s.predicate||s.predicate(t))){if(e.tag=n?s.tag:"?",s.represent){if(c=e.styleMap[s.tag]||s.defaultStyle,"[object Function]"===p.call(s.represent))i=s.represent(t,c);else{if(!u.call(s.represent,c))throw new d("!<"+s.tag+'> tag resolver accepts not "'+c+'" style');i=s.represent[c](t,c)}e.dump=i}return!0}return!1}function Q(e,t,n,i,r,o){e.tag=null,e.dump=n,J(e,n,!1)||J(e,n,!0);var a=p.call(e.dump);i&&(i=e.flowLevel<0||e.flowLevel>t);var s,c,u="[object Object]"===a||"[object Array]"===a;if(u&&(c=-1!==(s=e.duplicates.indexOf(n))),(null!==e.tag&&"?"!==e.tag||c||2!==e.indent&&0<t)&&(r=!1),c&&e.usedDuplicates[s])e.dump="*ref_"+s;else{if(u&&c&&!e.usedDuplicates[s]&&(e.usedDuplicates[s]=!0),"[object Object]"===a)i&&0!==Object.keys(e.dump).length?(function(e,t,n,i){var r,o,a,s,c,u,l="",p=e.tag,f=Object.keys(n);if(!0===e.sortKeys)f.sort();else if("function"==typeof e.sortKeys)f.sort(e.sortKeys);else if(e.sortKeys)throw new d("sortKeys must be a boolean or a function");for(r=0,o=f.length;r<o;r+=1)u="",i&&0===r||(u+=D(e,t)),s=n[a=f[r]],Q(e,t+1,a,!0,!0,!0)&&((c=null!==e.tag&&"?"!==e.tag||e.dump&&1024<e.dump.length)&&(e.dump&&h===e.dump.charCodeAt(0)?u+="?":u+="? "),u+=e.dump,c&&(u+=D(e,t)),Q(e,t+1,s,!0,c)&&(e.dump&&h===e.dump.charCodeAt(0)?u+=":":u+=": ",l+=u+=e.dump));e.tag=p,e.dump=l||"{}"}(e,t,e.dump,r),c&&(e.dump="&ref_"+s+e.dump)):(function(e,t,n){var i,r,o,a,s,c="",u=e.tag,l=Object.keys(n);for(i=0,r=l.length;i<r;i+=1)s=e.condenseFlow?'"':"",0!==i&&(s+=", "),a=n[o=l[i]],Q(e,t,o,!1,!1)&&(1024<e.dump.length&&(s+="? "),s+=e.dump+(e.condenseFlow?'"':"")+":"+(e.condenseFlow?"":" "),Q(e,t,a,!1,!1)&&(c+=s+=e.dump));e.tag=u,e.dump="{"+c+"}"}(e,t,e.dump),c&&(e.dump="&ref_"+s+" "+e.dump));else if("[object Array]"===a){var l=e.noArrayIndent&&0<t?t-1:t;i&&0!==e.dump.length?(function(e,t,n,i){var r,o,a="",s=e.tag;for(r=0,o=n.length;r<o;r+=1)Q(e,t+1,n[r],!0,!0)&&(i&&0===r||(a+=D(e,t)),e.dump&&h===e.dump.charCodeAt(0)?a+="-":a+="- ",a+=e.dump);e.tag=s,e.dump=a||"[]"}(e,l,e.dump,r),c&&(e.dump="&ref_"+s+e.dump)):(function(e,t,n){var i,r,o="",a=e.tag;for(i=0,r=n.length;i<r;i+=1)Q(e,t,n[i],!1,!1)&&(0!==i&&(o+=","+(e.condenseFlow?"":" ")),o+=e.dump);e.tag=a,e.dump="["+o+"]"}(e,l,e.dump),c&&(e.dump="&ref_"+s+" "+e.dump))}else{if("[object String]"!==a){if(e.skipInvalid)return!1;throw new d("unacceptable kind of an object to dump "+a)}"?"!==e.tag&&G(e,e.dump,t,o)}null!==e.tag&&"?"!==e.tag&&(e.dump="!<"+e.tag+"> "+e.dump)}return!0}function X(e,t){var n,i,r=[],o=[];for(function e(t,n,i){var r,o,a;if(null!==t&&"object"==typeof t)if(-1!==(o=n.indexOf(t)))-1===i.indexOf(o)&&i.push(o);else if(n.push(t),Array.isArray(t))for(o=0,a=t.length;o<a;o+=1)e(t[o],n,i);else for(r=Object.keys(t),o=0,a=r.length;o<a;o+=1)e(t[r[o]],n,i)}(e,r,o),n=0,i=o.length;n<i;n+=1)t.duplicates.push(r[o[n]]);t.usedDuplicates=new Array(i)}function ee(e,t){var n=new T(t=t||{});return n.noRefs||X(e,n),Q(n,0,e,!0,!0)?n.dump+"\n":""}t.exports.dump=ee,t.exports.safeDump=function(e,t){return ee(e,c.extend({schema:r},t))}},{"./common":2,"./exception":4,"./schema/default_full":9,"./schema/default_safe":10}],4:[function(e,t,n){"use strict";function i(e,t){Error.call(this),this.name="YAMLException",this.reason=e,this.mark=t,this.message=(this.reason||"(unknown reason)")+(this.mark?" "+this.mark.toString():""),Error.captureStackTrace?Error.captureStackTrace(this,this.constructor):this.stack=(new Error).stack||""}((i.prototype=Object.create(Error.prototype)).constructor=i).prototype.toString=function(e){var t=this.name+": ";return t+=this.reason||"(unknown reason)",!e&&this.mark&&(t+=" "+this.mark.toString()),t},t.exports=i},{}],5:[function(e,t,n){"use strict";var g=e("./common"),i=e("./exception"),r=e("./mark"),o=e("./schema/default_safe"),a=e("./schema/default_full"),y=Object.prototype.hasOwnProperty,x=1,v=2,A=3,b=4,w=1,C=2,k=3,c=/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/,s=/[\x85\u2028\u2029]/,u=/[,\[\]\{\}]/,l=/^(?:!|!!|![a-z\-]+!)$/i,p=/^(?:!|[^,\[\]\{\}])(?:%[0-9a-f]{2}|[0-9a-z\-#;\/\?:@&=\+\$,_\.!~\*'\(\)\[\]])*$/i;function f(e){return Object.prototype.toString.call(e)}function j(e){return 10===e||13===e}function S(e){return 9===e||32===e}function I(e){return 9===e||32===e||10===e||13===e}function O(e){return 44===e||91===e||93===e||123===e||125===e}function d(e){return 48===e?"\0":97===e?"":98===e?"\b":116===e?"\t":9===e?"\t":110===e?"\n":118===e?"\v":102===e?"\f":114===e?"\r":101===e?"":32===e?" ":34===e?'"':47===e?"/":92===e?"\\":78===e?"":95===e?" ":76===e?"\u2028":80===e?"\u2029":""}for(var E=new Array(256),F=new Array(256),h=0;h<256;h++)E[h]=d(h)?1:0,F[h]=d(h);function m(e,t){this.input=e,this.filename=t.filename||null,this.schema=t.schema||a,this.onWarning=t.onWarning||null,this.legacy=t.legacy||!1,this.json=t.json||!1,this.listener=t.listener||null,this.implicitTypes=this.schema.compiledImplicit,this.typeMap=this.schema.compiledTypeMap,this.length=e.length,this.position=0,this.line=0,this.lineStart=0,this.lineIndent=0,this.documents=[]}function _(e,t){return new i(t,new r(e.filename,e.input,e.position,e.line,e.position-e.lineStart))}function N(e,t){throw _(e,t)}function M(e,t){e.onWarning&&e.onWarning.call(null,_(e,t))}var T={YAML:function(e,t,n){var i,r,o;null!==e.version&&N(e,"duplication of %YAML directive"),1!==n.length&&N(e,"YAML directive accepts exactly one argument"),null===(i=/^([0-9]+)\.([0-9]+)$/.exec(n[0]))&&N(e,"ill-formed argument of the YAML directive"),r=parseInt(i[1],10),o=parseInt(i[2],10),1!==r&&N(e,"unacceptable YAML version of the document"),e.version=n[0],e.checkLineBreaks=o<2,1!==o&&2!==o&&M(e,"unsupported YAML version of the document")},TAG:function(e,t,n){var i,r;2!==n.length&&N(e,"TAG directive accepts exactly two arguments"),i=n[0],r=n[1],l.test(i)||N(e,"ill-formed tag handle (first argument) of the TAG directive"),y.call(e.tagMap,i)&&N(e,'there is a previously declared suffix for "'+i+'" tag handle'),p.test(r)||N(e,"ill-formed tag prefix (second argument) of the TAG directive"),e.tagMap[i]=r}};function L(e,t,n,i){var r,o,a,s;if(t<n){if(s=e.input.slice(t,n),i)for(r=0,o=s.length;r<o;r+=1)9===(a=s.charCodeAt(r))||32<=a&&a<=1114111||N(e,"expected valid JSON character");else c.test(s)&&N(e,"the stream contains non-printable characters");e.result+=s}}function D(e,t,n,i){var r,o,a,s;for(g.isObject(n)||N(e,"cannot merge mappings; the provided source object is unacceptable"),a=0,s=(r=Object.keys(n)).length;a<s;a+=1)o=r[a],y.call(t,o)||(t[o]=n[o],i[o]=!0)}function U(e,t,n,i,r,o,a,s){var c,u;if(Array.isArray(r))for(c=0,u=(r=Array.prototype.slice.call(r)).length;c<u;c+=1)Array.isArray(r[c])&&N(e,"nested arrays are not supported inside keys"),"object"==typeof r&&"[object Object]"===f(r[c])&&(r[c]="[object Object]");if("object"==typeof r&&"[object Object]"===f(r)&&(r="[object Object]"),r=String(r),null===t&&(t={}),"tag:yaml.org,2002:merge"===i)if(Array.isArray(o))for(c=0,u=o.length;c<u;c+=1)D(e,t,o[c],n);else D(e,t,o,n);else e.json||y.call(n,r)||!y.call(t,r)||(e.line=a||e.line,e.position=s||e.position,N(e,"duplicated mapping key")),t[r]=o,delete n[r];return t}function q(e){var t;10===(t=e.input.charCodeAt(e.position))?e.position++:13===t?(e.position++,10===e.input.charCodeAt(e.position)&&e.position++):N(e,"a line break is expected"),e.line+=1,e.lineStart=e.position}function Y(e,t,n){for(var i=0,r=e.input.charCodeAt(e.position);0!==r;){for(;S(r);)r=e.input.charCodeAt(++e.position);if(t&&35===r)for(;10!==(r=e.input.charCodeAt(++e.position))&&13!==r&&0!==r;);if(!j(r))break;for(q(e),r=e.input.charCodeAt(e.position),i++,e.lineIndent=0;32===r;)e.lineIndent++,r=e.input.charCodeAt(++e.position)}return-1!==n&&0!==i&&e.lineIndent<n&&M(e,"deficient indentation"),i}function R(e){var t,n=e.position;return!(45!==(t=e.input.charCodeAt(n))&&46!==t||t!==e.input.charCodeAt(n+1)||t!==e.input.charCodeAt(n+2)||(n+=3,0!==(t=e.input.charCodeAt(n))&&!I(t)))}function B(e,t){1===t?e.result+=" ":1<t&&(e.result+=g.repeat("\n",t-1))}function P(e,t){var n,i,r=e.tag,o=e.anchor,a=[],s=!1;for(null!==e.anchor&&(e.anchorMap[e.anchor]=a),i=e.input.charCodeAt(e.position);0!==i&&45===i&&I(e.input.charCodeAt(e.position+1));)if(s=!0,e.position++,Y(e,!0,-1)&&e.lineIndent<=t)a.push(null),i=e.input.charCodeAt(e.position);else if(n=e.line,$(e,t,A,!1,!0),a.push(e.result),Y(e,!0,-1),i=e.input.charCodeAt(e.position),(e.line===n||e.lineIndent>t)&&0!==i)N(e,"bad indentation of a sequence entry");else if(e.lineIndent<t)break;return!!s&&(e.tag=r,e.anchor=o,e.kind="sequence",e.result=a,!0)}function W(e){var t,n,i,r,o=!1,a=!1;if(33!==(r=e.input.charCodeAt(e.position)))return!1;if(null!==e.tag&&N(e,"duplication of a tag property"),60===(r=e.input.charCodeAt(++e.position))?(o=!0,r=e.input.charCodeAt(++e.position)):33===r?(a=!0,n="!!",r=e.input.charCodeAt(++e.position)):n="!",t=e.position,o){for(;0!==(r=e.input.charCodeAt(++e.position))&&62!==r;);e.position<e.length?(i=e.input.slice(t,e.position),r=e.input.charCodeAt(++e.position)):N(e,"unexpected end of the stream within a verbatim tag")}else{for(;0!==r&&!I(r);)33===r&&(a?N(e,"tag suffix cannot contain exclamation marks"):(n=e.input.slice(t-1,e.position+1),l.test(n)||N(e,"named tag handle cannot contain such characters"),a=!0,t=e.position+1)),r=e.input.charCodeAt(++e.position);i=e.input.slice(t,e.position),u.test(i)&&N(e,"tag suffix cannot contain flow indicator characters")}return i&&!p.test(i)&&N(e,"tag name cannot contain such characters: "+i),o?e.tag=i:y.call(e.tagMap,n)?e.tag=e.tagMap[n]+i:"!"===n?e.tag="!"+i:"!!"===n?e.tag="tag:yaml.org,2002:"+i:N(e,'undeclared tag handle "'+n+'"'),!0}function K(e){var t,n;if(38!==(n=e.input.charCodeAt(e.position)))return!1;for(null!==e.anchor&&N(e,"duplication of an anchor property"),n=e.input.charCodeAt(++e.position),t=e.position;0!==n&&!I(n)&&!O(n);)n=e.input.charCodeAt(++e.position);return e.position===t&&N(e,"name of an anchor node must contain at least one character"),e.anchor=e.input.slice(t,e.position),!0}function $(e,t,n,i,r){var o,a,s,c,u,l,p,f,d=1,h=!1,m=!1;if(null!==e.listener&&e.listener("open",e),e.tag=null,e.anchor=null,e.kind=null,e.result=null,o=a=s=b===n||A===n,i&&Y(e,!0,-1)&&(h=!0,e.lineIndent>t?d=1:e.lineIndent===t?d=0:e.lineIndent<t&&(d=-1)),1===d)for(;W(e)||K(e);)Y(e,!0,-1)?(h=!0,s=o,e.lineIndent>t?d=1:e.lineIndent===t?d=0:e.lineIndent<t&&(d=-1)):s=!1;if(s&&(s=h||r),1!==d&&b!==n||(p=x===n||v===n?t:t+1,f=e.position-e.lineStart,1===d?s&&(P(e,f)||function(e,t,n){var i,r,o,a,s,c=e.tag,u=e.anchor,l={},p={},f=null,d=null,h=null,m=!1,g=!1;for(null!==e.anchor&&(e.anchorMap[e.anchor]=l),s=e.input.charCodeAt(e.position);0!==s;){if(i=e.input.charCodeAt(e.position+1),o=e.line,a=e.position,63!==s&&58!==s||!I(i)){if(!$(e,n,v,!1,!0))break;if(e.line===o){for(s=e.input.charCodeAt(e.position);S(s);)s=e.input.charCodeAt(++e.position);if(58===s)I(s=e.input.charCodeAt(++e.position))||N(e,"a whitespace character is expected after the key-value separator within a block mapping"),m&&(U(e,l,p,f,d,null),f=d=h=null),r=m=!(g=!0),f=e.tag,d=e.result;else{if(!g)return e.tag=c,e.anchor=u,!0;N(e,"can not read an implicit mapping pair; a colon is missed")}}else{if(!g)return e.tag=c,e.anchor=u,!0;N(e,"can not read a block mapping entry; a multiline key may not be an implicit key")}}else 63===s?(m&&(U(e,l,p,f,d,null),f=d=h=null),r=m=g=!0):m?r=!(m=!1):N(e,"incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line"),e.position+=1,s=i;if((e.line===o||e.lineIndent>t)&&($(e,t,b,!0,r)&&(m?d=e.result:h=e.result),m||(U(e,l,p,f,d,h,o,a),f=d=h=null),Y(e,!0,-1),s=e.input.charCodeAt(e.position)),e.lineIndent>t&&0!==s)N(e,"bad indentation of a mapping entry");else if(e.lineIndent<t)break}return m&&U(e,l,p,f,d,null),g&&(e.tag=c,e.anchor=u,e.kind="mapping",e.result=l),g}(e,f,p))||function(e,t){var n,i,r,o,a,s,c,u,l,p,f=!0,d=e.tag,h=e.anchor,m={};if(91===(p=e.input.charCodeAt(e.position)))s=!(r=93),i=[];else{if(123!==p)return!1;r=125,s=!0,i={}}for(null!==e.anchor&&(e.anchorMap[e.anchor]=i),p=e.input.charCodeAt(++e.position);0!==p;){if(Y(e,!0,t),(p=e.input.charCodeAt(e.position))===r)return e.position++,e.tag=d,e.anchor=h,e.kind=s?"mapping":"sequence",e.result=i,!0;f||N(e,"missed comma between flow collection entries"),l=null,o=a=!1,63===p&&I(e.input.charCodeAt(e.position+1))&&(o=a=!0,e.position++,Y(e,!0,t)),n=e.line,$(e,t,x,!1,!0),u=e.tag,c=e.result,Y(e,!0,t),p=e.input.charCodeAt(e.position),!a&&e.line!==n||58!==p||(o=!0,p=e.input.charCodeAt(++e.position),Y(e,!0,t),$(e,t,x,!1,!0),l=e.result),s?U(e,i,m,u,c,l):o?i.push(U(e,null,m,u,c,l)):i.push(c),Y(e,!0,t),44===(p=e.input.charCodeAt(e.position))?(f=!0,p=e.input.charCodeAt(++e.position)):f=!1}N(e,"unexpected end of the stream within a flow collection")}(e,p)?m=!0:(a&&function(e,t){var n,i,r,o,a,s=w,c=!1,u=!1,l=t,p=0,f=!1;if(124===(o=e.input.charCodeAt(e.position)))i=!1;else{if(62!==o)return!1;i=!0}for(e.kind="scalar",e.result="";0!==o;)if(43===(o=e.input.charCodeAt(++e.position))||45===o)w===s?s=43===o?k:C:N(e,"repeat of a chomping mode identifier");else{if(!(0<=(r=48<=(a=o)&&a<=57?a-48:-1)))break;0==r?N(e,"bad explicit indentation width of a block scalar; it cannot be less than one"):u?N(e,"repeat of an indentation width identifier"):(l=t+r-1,u=!0)}if(S(o)){for(;S(o=e.input.charCodeAt(++e.position)););if(35===o)for(;!j(o=e.input.charCodeAt(++e.position))&&0!==o;);}for(;0!==o;){for(q(e),e.lineIndent=0,o=e.input.charCodeAt(e.position);(!u||e.lineIndent<l)&&32===o;)e.lineIndent++,o=e.input.charCodeAt(++e.position);if(!u&&e.lineIndent>l&&(l=e.lineIndent),j(o))p++;else{if(e.lineIndent<l){s===k?e.result+=g.repeat("\n",c?1+p:p):s===w&&c&&(e.result+="\n");break}for(i?S(o)?(f=!0,e.result+=g.repeat("\n",c?1+p:p)):f?(f=!1,e.result+=g.repeat("\n",p+1)):0===p?c&&(e.result+=" "):e.result+=g.repeat("\n",p):e.result+=g.repeat("\n",c?1+p:p),u=c=!0,p=0,n=e.position;!j(o)&&0!==o;)o=e.input.charCodeAt(++e.position);L(e,n,e.position,!1)}}return!0}(e,p)||function(e,t){var n,i,r;if(39!==(n=e.input.charCodeAt(e.position)))return!1;for(e.kind="scalar",e.result="",e.position++,i=r=e.position;0!==(n=e.input.charCodeAt(e.position));)if(39===n){if(L(e,i,e.position,!0),39!==(n=e.input.charCodeAt(++e.position)))return!0;i=e.position,e.position++,r=e.position}else j(n)?(L(e,i,r,!0),B(e,Y(e,!1,t)),i=r=e.position):e.position===e.lineStart&&R(e)?N(e,"unexpected end of the document within a single quoted scalar"):(e.position++,r=e.position);N(e,"unexpected end of the stream within a single quoted scalar")}(e,p)||function(e,t){var n,i,r,o,a,s,c,u,l,p;if(34!==(s=e.input.charCodeAt(e.position)))return!1;for(e.kind="scalar",e.result="",e.position++,n=i=e.position;0!==(s=e.input.charCodeAt(e.position));){if(34===s)return L(e,n,e.position,!0),e.position++,!0;if(92===s){if(L(e,n,e.position,!0),j(s=e.input.charCodeAt(++e.position)))Y(e,!1,t);else if(s<256&&E[s])e.result+=F[s],e.position++;else if(0<(a=120===(p=s)?2:117===p?4:85===p?8:0)){for(r=a,o=0;0<r;r--)s=e.input.charCodeAt(++e.position),l=void 0,0<=(a=48<=(u=s)&&u<=57?u-48:97<=(l=32|u)&&l<=102?l-97+10:-1)?o=(o<<4)+a:N(e,"expected hexadecimal character");e.result+=(c=o)<=65535?String.fromCharCode(c):String.fromCharCode(55296+(c-65536>>10),56320+(c-65536&1023)),e.position++}else N(e,"unknown escape sequence");n=i=e.position}else j(s)?(L(e,n,i,!0),B(e,Y(e,!1,t)),n=i=e.position):e.position===e.lineStart&&R(e)?N(e,"unexpected end of the document within a double quoted scalar"):(e.position++,i=e.position)}N(e,"unexpected end of the stream within a double quoted scalar")}(e,p)?m=!0:!function(e){var t,n,i;if(42!==(i=e.input.charCodeAt(e.position)))return!1;for(i=e.input.charCodeAt(++e.position),t=e.position;0!==i&&!I(i)&&!O(i);)i=e.input.charCodeAt(++e.position);return e.position===t&&N(e,"name of an alias node must contain at least one character"),n=e.input.slice(t,e.position),e.anchorMap.hasOwnProperty(n)||N(e,'unidentified alias "'+n+'"'),e.result=e.anchorMap[n],Y(e,!0,-1),!0}(e)?function(e,t,n){var i,r,o,a,s,c,u,l,p=e.kind,f=e.result;if(I(l=e.input.charCodeAt(e.position))||O(l)||35===l||38===l||42===l||33===l||124===l||62===l||39===l||34===l||37===l||64===l||96===l)return!1;if((63===l||45===l)&&(I(i=e.input.charCodeAt(e.position+1))||n&&O(i)))return!1;for(e.kind="scalar",e.result="",r=o=e.position,a=!1;0!==l;){if(58===l){if(I(i=e.input.charCodeAt(e.position+1))||n&&O(i))break}else if(35===l){if(I(e.input.charCodeAt(e.position-1)))break}else{if(e.position===e.lineStart&&R(e)||n&&O(l))break;if(j(l)){if(s=e.line,c=e.lineStart,u=e.lineIndent,Y(e,!1,-1),e.lineIndent>=t){a=!0,l=e.input.charCodeAt(e.position);continue}e.position=o,e.line=s,e.lineStart=c,e.lineIndent=u;break}}a&&(L(e,r,o,!1),B(e,e.line-s),r=o=e.position,a=!1),S(l)||(o=e.position+1),l=e.input.charCodeAt(++e.position)}return L(e,r,o,!1),!!e.result||(e.kind=p,e.result=f,!1)}(e,p,x===n)&&(m=!0,null===e.tag&&(e.tag="?")):(m=!0,null===e.tag&&null===e.anchor||N(e,"alias node should not have any properties")),null!==e.anchor&&(e.anchorMap[e.anchor]=e.result)):0===d&&(m=s&&P(e,f))),null!==e.tag&&"!"!==e.tag)if("?"===e.tag){for(c=0,u=e.implicitTypes.length;c<u;c+=1)if((l=e.implicitTypes[c]).resolve(e.result)){e.result=l.construct(e.result),e.tag=l.tag,null!==e.anchor&&(e.anchorMap[e.anchor]=e.result);break}}else y.call(e.typeMap[e.kind||"fallback"],e.tag)?(l=e.typeMap[e.kind||"fallback"][e.tag],null!==e.result&&l.kind!==e.kind&&N(e,"unacceptable node kind for !<"+e.tag+'> tag; it should be "'+l.kind+'", not "'+e.kind+'"'),l.resolve(e.result)?(e.result=l.construct(e.result),null!==e.anchor&&(e.anchorMap[e.anchor]=e.result)):N(e,"cannot resolve a node with !<"+e.tag+"> explicit tag")):N(e,"unknown tag !<"+e.tag+">");return null!==e.listener&&e.listener("close",e),null!==e.tag||null!==e.anchor||m}function H(e){var t,n,i,r,o=e.position,a=!1;for(e.version=null,e.checkLineBreaks=e.legacy,e.tagMap={},e.anchorMap={};0!==(r=e.input.charCodeAt(e.position))&&(Y(e,!0,-1),r=e.input.charCodeAt(e.position),!(0<e.lineIndent||37!==r));){for(a=!0,r=e.input.charCodeAt(++e.position),t=e.position;0!==r&&!I(r);)r=e.input.charCodeAt(++e.position);for(i=[],(n=e.input.slice(t,e.position)).length<1&&N(e,"directive name must not be less than one character in length");0!==r;){for(;S(r);)r=e.input.charCodeAt(++e.position);if(35===r){for(;0!==(r=e.input.charCodeAt(++e.position))&&!j(r););break}if(j(r))break;for(t=e.position;0!==r&&!I(r);)r=e.input.charCodeAt(++e.position);i.push(e.input.slice(t,e.position))}0!==r&&q(e),y.call(T,n)?T[n](e,n,i):M(e,'unknown document directive "'+n+'"')}Y(e,!0,-1),0===e.lineIndent&&45===e.input.charCodeAt(e.position)&&45===e.input.charCodeAt(e.position+1)&&45===e.input.charCodeAt(e.position+2)?(e.position+=3,Y(e,!0,-1)):a&&N(e,"directives end mark is expected"),$(e,e.lineIndent-1,b,!1,!0),Y(e,!0,-1),e.checkLineBreaks&&s.test(e.input.slice(o,e.position))&&M(e,"non-ASCII line breaks are interpreted as content"),e.documents.push(e.result),e.position===e.lineStart&&R(e)?46===e.input.charCodeAt(e.position)&&(e.position+=3,Y(e,!0,-1)):e.position<e.length-1&&N(e,"end of the stream or a document separator is expected")}function G(e,t){t=t||{},0!==(e=String(e)).length&&(10!==e.charCodeAt(e.length-1)&&13!==e.charCodeAt(e.length-1)&&(e+="\n"),65279===e.charCodeAt(0)&&(e=e.slice(1)));var n=new m(e,t);for(n.input+="\0";32===n.input.charCodeAt(n.position);)n.lineIndent+=1,n.position+=1;for(;n.position<n.length-1;)H(n);return n.documents}function V(e,t,n){var i,r,o=G(e,n);if("function"!=typeof t)return o;for(i=0,r=o.length;i<r;i+=1)t(o[i])}function Z(e,t){var n=G(e,t);if(0!==n.length){if(1===n.length)return n[0];throw new i("expected a single document in the stream, but found more")}}t.exports.loadAll=V,t.exports.load=Z,t.exports.safeLoadAll=function(e,t,n){if("function"!=typeof t)return V(e,g.extend({schema:o},n));V(e,t,g.extend({schema:o},n))},t.exports.safeLoad=function(e,t){return Z(e,g.extend({schema:o},t))}},{"./common":2,"./exception":4,"./mark":6,"./schema/default_full":9,"./schema/default_safe":10}],6:[function(e,t,n){"use strict";var s=e("./common");function i(e,t,n,i,r){this.name=e,this.buffer=t,this.position=n,this.line=i,this.column=r}i.prototype.getSnippet=function(e,t){var n,i,r,o,a;if(!this.buffer)return null;for(e=e||4,t=t||75,n="",i=this.position;0<i&&-1==="\0\r\n\u2028\u2029".indexOf(this.buffer.charAt(i-1));)if(i-=1,this.position-i>t/2-1){n=" ... ",i+=5;break}for(r="",o=this.position;o<this.buffer.length&&-1==="\0\r\n\u2028\u2029".indexOf(this.buffer.charAt(o));)if((o+=1)-this.position>t/2-1){r=" ... ",o-=5;break}return a=this.buffer.slice(i,o),s.repeat(" ",e)+n+a+r+"\n"+s.repeat(" ",e+this.position-i+n.length)+"^"},i.prototype.toString=function(e){var t,n="";return this.name&&(n+='in "'+this.name+'" '),n+="at line "+(this.line+1)+", column "+(this.column+1),e||(t=this.getSnippet())&&(n+=":\n"+t),n},t.exports=i},{"./common":2}],7:[function(e,t,n){"use strict";var i=e("./common"),r=e("./exception"),o=e("./type");function a(e,t,i){var r=[];return e.include.forEach(function(e){i=a(e,t,i)}),e[t].forEach(function(n){i.forEach(function(e,t){e.tag===n.tag&&e.kind===n.kind&&r.push(t)}),i.push(n)}),i.filter(function(e,t){return-1===r.indexOf(t)})}function s(e){this.include=e.include||[],this.implicit=e.implicit||[],this.explicit=e.explicit||[],this.implicit.forEach(function(e){if(e.loadKind&&"scalar"!==e.loadKind)throw new r("There is a non-scalar type in the implicit list of a schema. Implicit resolving of such types is not supported.")}),this.compiledImplicit=a(this,"implicit",[]),this.compiledExplicit=a(this,"explicit",[]),this.compiledTypeMap=function(){var e,t,n={scalar:{},sequence:{},mapping:{},fallback:{}};function i(e){n[e.kind][e.tag]=n.fallback[e.tag]=e}for(e=0,t=arguments.length;e<t;e+=1)arguments[e].forEach(i);return n}(this.compiledImplicit,this.compiledExplicit)}s.DEFAULT=null,s.create=function(){var e,t;switch(arguments.length){case 1:e=s.DEFAULT,t=arguments[0];break;case 2:e=arguments[0],t=arguments[1];break;default:throw new r("Wrong number of arguments for Schema.create function")}if(e=i.toArray(e),t=i.toArray(t),!e.every(function(e){return e instanceof s}))throw new r("Specified list of super schemas (or a single Schema object) contains a non-Schema object.");if(!t.every(function(e){return e instanceof o}))throw new r("Specified list of YAML types (or a single Type object) contains a non-Type object.");return new s({include:e,explicit:t})},t.exports=s},{"./common":2,"./exception":4,"./type":13}],8:[function(e,t,n){"use strict";var i=e("../schema");t.exports=new i({include:[e("./json")]})},{"../schema":7,"./json":12}],9:[function(e,t,n){"use strict";var i=e("../schema");t.exports=i.DEFAULT=new i({include:[e("./default_safe")],explicit:[e("../type/js/undefined"),e("../type/js/regexp"),e("../type/js/function")]})},{"../schema":7,"../type/js/function":18,"../type/js/regexp":19,"../type/js/undefined":20,"./default_safe":10}],10:[function(e,t,n){"use strict";var i=e("../schema");t.exports=new i({include:[e("./core")],implicit:[e("../type/timestamp"),e("../type/merge")],explicit:[e("../type/binary"),e("../type/omap"),e("../type/pairs"),e("../type/set")]})},{"../schema":7,"../type/binary":14,"../type/merge":22,"../type/omap":24,"../type/pairs":25,"../type/set":27,"../type/timestamp":29,"./core":8}],11:[function(e,t,n){"use strict";var i=e("../schema");t.exports=new i({explicit:[e("../type/str"),e("../type/seq"),e("../type/map")]})},{"../schema":7,"../type/map":21,"../type/seq":26,"../type/str":28}],12:[function(e,t,n){"use strict";var i=e("../schema");t.exports=new i({include:[e("./failsafe")],implicit:[e("../type/null"),e("../type/bool"),e("../type/int"),e("../type/float")]})},{"../schema":7,"../type/bool":15,"../type/float":16,"../type/int":17,"../type/null":23,"./failsafe":11}],13:[function(e,t,n){"use strict";var i=e("./exception"),r=["kind","resolve","construct","instanceOf","predicate","represent","defaultStyle","styleAliases"],o=["scalar","sequence","mapping"];t.exports=function(t,e){if(e=e||{},Object.keys(e).forEach(function(e){if(-1===r.indexOf(e))throw new i('Unknown option "'+e+'" is met in definition of "'+t+'" YAML type.')}),this.tag=t,this.kind=e.kind||null,this.resolve=e.resolve||function(){return!0},this.construct=e.construct||function(e){return e},this.instanceOf=e.instanceOf||null,this.predicate=e.predicate||null,this.represent=e.represent||null,this.defaultStyle=e.defaultStyle||null,this.styleAliases=function(e){var n={};return null!==e&&Object.keys(e).forEach(function(t){e[t].forEach(function(e){n[String(e)]=t})}),n}(e.styleAliases||null),-1===o.indexOf(this.kind))throw new i('Unknown kind "'+this.kind+'" is specified for "'+t+'" YAML type.')}},{"./exception":4}],14:[function(e,t,n){"use strict";var c;try{c=e("buffer").Buffer}catch(e){}var i=e("../type"),u="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=\n\r";t.exports=new i("tag:yaml.org,2002:binary",{kind:"scalar",resolve:function(e){if(null===e)return!1;var t,n,i=0,r=e.length,o=u;for(n=0;n<r;n++)if(!(64<(t=o.indexOf(e.charAt(n))))){if(t<0)return!1;i+=6}return i%8==0},construct:function(e){var t,n,i=e.replace(/[\r\n=]/g,""),r=i.length,o=u,a=0,s=[];for(t=0;t<r;t++)t%4==0&&t&&(s.push(a>>16&255),s.push(a>>8&255),s.push(255&a)),a=a<<6|o.indexOf(i.charAt(t));return 0==(n=r%4*6)?(s.push(a>>16&255),s.push(a>>8&255),s.push(255&a)):18==n?(s.push(a>>10&255),s.push(a>>2&255)):12==n&&s.push(a>>4&255),c?c.from?c.from(s):new c(s):s},predicate:function(e){return c&&c.isBuffer(e)},represent:function(e){var t,n,i="",r=0,o=e.length,a=u;for(t=0;t<o;t++)t%3==0&&t&&(i+=a[r>>18&63],i+=a[r>>12&63],i+=a[r>>6&63],i+=a[63&r]),r=(r<<8)+e[t];return 0==(n=o%3)?(i+=a[r>>18&63],i+=a[r>>12&63],i+=a[r>>6&63],i+=a[63&r]):2==n?(i+=a[r>>10&63],i+=a[r>>4&63],i+=a[r<<2&63],i+=a[64]):1==n&&(i+=a[r>>2&63],i+=a[r<<4&63],i+=a[64],i+=a[64]),i}})},{"../type":13}],15:[function(e,t,n){"use strict";var i=e("../type");t.exports=new i("tag:yaml.org,2002:bool",{kind:"scalar",resolve:function(e){if(null===e)return!1;var t=e.length;return 4===t&&("true"===e||"True"===e||"TRUE"===e)||5===t&&("false"===e||"False"===e||"FALSE"===e)},construct:function(e){return"true"===e||"True"===e||"TRUE"===e},predicate:function(e){return"[object Boolean]"===Object.prototype.toString.call(e)},represent:{lowercase:function(e){return e?"true":"false"},uppercase:function(e){return e?"TRUE":"FALSE"},camelcase:function(e){return e?"True":"False"}},defaultStyle:"lowercase"})},{"../type":13}],16:[function(e,t,n){"use strict";var i=e("../common"),r=e("../type"),o=new RegExp("^(?:[-+]?(?:0|[1-9][0-9_]*)(?:\\.[0-9_]*)?(?:[eE][-+]?[0-9]+)?|\\.[0-9_]+(?:[eE][-+]?[0-9]+)?|[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+\\.[0-9_]*|[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$");var a=/^[-+]?[0-9]+e/;t.exports=new r("tag:yaml.org,2002:float",{kind:"scalar",resolve:function(e){return null!==e&&!(!o.test(e)||"_"===e[e.length-1])},construct:function(e){var t,n,i,r;return n="-"===(t=e.replace(/_/g,"").toLowerCase())[0]?-1:1,r=[],0<="+-".indexOf(t[0])&&(t=t.slice(1)),".inf"===t?1==n?Number.POSITIVE_INFINITY:Number.NEGATIVE_INFINITY:".nan"===t?NaN:0<=t.indexOf(":")?(t.split(":").forEach(function(e){r.unshift(parseFloat(e,10))}),t=0,i=1,r.forEach(function(e){t+=e*i,i*=60}),n*t):n*parseFloat(t,10)},predicate:function(e){return"[object Number]"===Object.prototype.toString.call(e)&&(e%1!=0||i.isNegativeZero(e))},represent:function(e,t){var n;if(isNaN(e))switch(t){case"lowercase":return".nan";case"uppercase":return".NAN";case"camelcase":return".NaN"}else if(Number.POSITIVE_INFINITY===e)switch(t){case"lowercase":return".inf";case"uppercase":return".INF";case"camelcase":return".Inf"}else if(Number.NEGATIVE_INFINITY===e)switch(t){case"lowercase":return"-.inf";case"uppercase":return"-.INF";case"camelcase":return"-.Inf"}else if(i.isNegativeZero(e))return"-0.0";return n=e.toString(10),a.test(n)?n.replace("e",".e"):n},defaultStyle:"lowercase"})},{"../common":2,"../type":13}],17:[function(e,t,n){"use strict";var i=e("../common"),r=e("../type");t.exports=new r("tag:yaml.org,2002:int",{kind:"scalar",resolve:function(e){if(null===e)return!1;var t,n,i,r,o=e.length,a=0,s=!1;if(!o)return!1;if("-"!==(t=e[a])&&"+"!==t||(t=e[++a]),"0"===t){if(a+1===o)return!0;if("b"===(t=e[++a])){for(a++;a<o;a++)if("_"!==(t=e[a])){if("0"!==t&&"1"!==t)return!1;s=!0}return s&&"_"!==t}if("x"===t){for(a++;a<o;a++)if("_"!==(t=e[a])){if(!(48<=(i=e.charCodeAt(a))&&i<=57||65<=i&&i<=70||97<=i&&i<=102))return!1;s=!0}return s&&"_"!==t}for(;a<o;a++)if("_"!==(t=e[a])){if(!(48<=(n=e.charCodeAt(a))&&n<=55))return!1;s=!0}return s&&"_"!==t}if("_"===t)return!1;for(;a<o;a++)if("_"!==(t=e[a])){if(":"===t)break;if(!(48<=(r=e.charCodeAt(a))&&r<=57))return!1;s=!0}return!(!s||"_"===t)&&(":"!==t||/^(:[0-5]?[0-9])+$/.test(e.slice(a)))},construct:function(e){var t,n,i=e,r=1,o=[];return-1!==i.indexOf("_")&&(i=i.replace(/_/g,"")),"-"!==(t=i[0])&&"+"!==t||("-"===t&&(r=-1),t=(i=i.slice(1))[0]),"0"===i?0:"0"===t?"b"===i[1]?r*parseInt(i.slice(2),2):"x"===i[1]?r*parseInt(i,16):r*parseInt(i,8):-1!==i.indexOf(":")?(i.split(":").forEach(function(e){o.unshift(parseInt(e,10))}),i=0,n=1,o.forEach(function(e){i+=e*n,n*=60}),r*i):r*parseInt(i,10)},predicate:function(e){return"[object Number]"===Object.prototype.toString.call(e)&&e%1==0&&!i.isNegativeZero(e)},represent:{binary:function(e){return 0<=e?"0b"+e.toString(2):"-0b"+e.toString(2).slice(1)},octal:function(e){return 0<=e?"0"+e.toString(8):"-0"+e.toString(8).slice(1)},decimal:function(e){return e.toString(10)},hexadecimal:function(e){return 0<=e?"0x"+e.toString(16).toUpperCase():"-0x"+e.toString(16).toUpperCase().slice(1)}},defaultStyle:"decimal",styleAliases:{binary:[2,"bin"],octal:[8,"oct"],decimal:[10,"dec"],hexadecimal:[16,"hex"]}})},{"../common":2,"../type":13}],18:[function(e,t,n){"use strict";var o;try{o=e("esprima")}catch(e){"undefined"!=typeof window&&(o=window.esprima)}var i=e("../../type");t.exports=new i("tag:yaml.org,2002:js/function",{kind:"scalar",resolve:function(e){if(null===e)return!1;try{var t="("+e+")",n=o.parse(t,{range:!0});return"Program"===n.type&&1===n.body.length&&"ExpressionStatement"===n.body[0].type&&("ArrowFunctionExpression"===n.body[0].expression.type||"FunctionExpression"===n.body[0].expression.type)}catch(e){return!1}},construct:function(e){var t,n="("+e+")",i=o.parse(n,{range:!0}),r=[];if("Program"!==i.type||1!==i.body.length||"ExpressionStatement"!==i.body[0].type||"ArrowFunctionExpression"!==i.body[0].expression.type&&"FunctionExpression"!==i.body[0].expression.type)throw new Error("Failed to resolve function");return i.body[0].expression.params.forEach(function(e){r.push(e.name)}),t=i.body[0].expression.body.range,"BlockStatement"===i.body[0].expression.body.type?new Function(r,n.slice(t[0]+1,t[1]-1)):new Function(r,"return "+n.slice(t[0],t[1]))},predicate:function(e){return"[object Function]"===Object.prototype.toString.call(e)},represent:function(e){return e.toString()}})},{"../../type":13}],19:[function(e,t,n){"use strict";var i=e("../../type");t.exports=new i("tag:yaml.org,2002:js/regexp",{kind:"scalar",resolve:function(e){if(null===e)return!1;if(0===e.length)return!1;var t=e,n=/\/([gim]*)$/.exec(e),i="";if("/"===t[0]){if(n&&(i=n[1]),3<i.length)return!1;if("/"!==t[t.length-i.length-1])return!1}return!0},construct:function(e){var t=e,n=/\/([gim]*)$/.exec(e),i="";return"/"===t[0]&&(n&&(i=n[1]),t=t.slice(1,t.length-i.length-1)),new RegExp(t,i)},predicate:function(e){return"[object RegExp]"===Object.prototype.toString.call(e)},represent:function(e){var t="/"+e.source+"/";return e.global&&(t+="g"),e.multiline&&(t+="m"),e.ignoreCase&&(t+="i"),t}})},{"../../type":13}],20:[function(e,t,n){"use strict";var i=e("../../type");t.exports=new i("tag:yaml.org,2002:js/undefined",{kind:"scalar",resolve:function(){return!0},construct:function(){},predicate:function(e){return void 0===e},represent:function(){return""}})},{"../../type":13}],21:[function(e,t,n){"use strict";var i=e("../type");t.exports=new i("tag:yaml.org,2002:map",{kind:"mapping",construct:function(e){return null!==e?e:{}}})},{"../type":13}],22:[function(e,t,n){"use strict";var i=e("../type");t.exports=new i("tag:yaml.org,2002:merge",{kind:"scalar",resolve:function(e){return"<<"===e||null===e}})},{"../type":13}],23:[function(e,t,n){"use strict";var i=e("../type");t.exports=new i("tag:yaml.org,2002:null",{kind:"scalar",resolve:function(e){if(null===e)return!0;var t=e.length;return 1===t&&"~"===e||4===t&&("null"===e||"Null"===e||"NULL"===e)},construct:function(){return null},predicate:function(e){return null===e},represent:{canonical:function(){return"~"},lowercase:function(){return"null"},uppercase:function(){return"NULL"},camelcase:function(){return"Null"}},defaultStyle:"lowercase"})},{"../type":13}],24:[function(e,t,n){"use strict";var i=e("../type"),c=Object.prototype.hasOwnProperty,u=Object.prototype.toString;t.exports=new i("tag:yaml.org,2002:omap",{kind:"sequence",resolve:function(e){if(null===e)return!0;var t,n,i,r,o,a=[],s=e;for(t=0,n=s.length;t<n;t+=1){if(i=s[t],o=!1,"[object Object]"!==u.call(i))return!1;for(r in i)if(c.call(i,r)){if(o)return!1;o=!0}if(!o)return!1;if(-1!==a.indexOf(r))return!1;a.push(r)}return!0},construct:function(e){return null!==e?e:[]}})},{"../type":13}],25:[function(e,t,n){"use strict";var i=e("../type"),s=Object.prototype.toString;t.exports=new i("tag:yaml.org,2002:pairs",{kind:"sequence",resolve:function(e){if(null===e)return!0;var t,n,i,r,o,a=e;for(o=new Array(a.length),t=0,n=a.length;t<n;t+=1){if(i=a[t],"[object Object]"!==s.call(i))return!1;if(1!==(r=Object.keys(i)).length)return!1;o[t]=[r[0],i[r[0]]]}return!0},construct:function(e){if(null===e)return[];var t,n,i,r,o,a=e;for(o=new Array(a.length),t=0,n=a.length;t<n;t+=1)i=a[t],r=Object.keys(i),o[t]=[r[0],i[r[0]]];return o}})},{"../type":13}],26:[function(e,t,n){"use strict";var i=e("../type");t.exports=new i("tag:yaml.org,2002:seq",{kind:"sequence",construct:function(e){return null!==e?e:[]}})},{"../type":13}],27:[function(e,t,n){"use strict";var i=e("../type"),r=Object.prototype.hasOwnProperty;t.exports=new i("tag:yaml.org,2002:set",{kind:"mapping",resolve:function(e){if(null===e)return!0;var t,n=e;for(t in n)if(r.call(n,t)&&null!==n[t])return!1;return!0},construct:function(e){return null!==e?e:{}}})},{"../type":13}],28:[function(e,t,n){"use strict";var i=e("../type");t.exports=new i("tag:yaml.org,2002:str",{kind:"scalar",construct:function(e){return null!==e?e:""}})},{"../type":13}],29:[function(e,t,n){"use strict";var i=e("../type"),p=new RegExp("^([0-9][0-9][0-9][0-9])-([0-9][0-9])-([0-9][0-9])$"),f=new RegExp("^([0-9][0-9][0-9][0-9])-([0-9][0-9]?)-([0-9][0-9]?)(?:[Tt]|[ \\t]+)([0-9][0-9]?):([0-9][0-9]):([0-9][0-9])(?:\\.([0-9]*))?(?:[ \\t]*(Z|([-+])([0-9][0-9]?)(?::([0-9][0-9]))?))?$");t.exports=new i("tag:yaml.org,2002:timestamp",{kind:"scalar",resolve:function(e){return null!==e&&(null!==p.exec(e)||null!==f.exec(e))},construct:function(e){var t,n,i,r,o,a,s,c,u=0,l=null;if(null===(t=p.exec(e))&&(t=f.exec(e)),null===t)throw new Error("Date resolve error");if(n=+t[1],i=+t[2]-1,r=+t[3],!t[4])return new Date(Date.UTC(n,i,r));if(o=+t[4],a=+t[5],s=+t[6],t[7]){for(u=t[7].slice(0,3);u.length<3;)u+="0";u=+u}return t[9]&&(l=6e4*(60*+t[10]+ +(t[11]||0)),"-"===t[9]&&(l=-l)),c=new Date(Date.UTC(n,i,r,o,a,s,u)),l&&c.setTime(c.getTime()-l),c},instanceOf:Date,represent:function(e){return e.toISOString()}})},{"../type":13}],"/":[function(e,t,n){"use strict";var i=e("./lib/js-yaml.js");t.exports=i},{"./lib/js-yaml.js":1}]},{},[])("/")});

  var u = 'undefined',
    win = typeof unsafeWindow != u ? unsafeWindow : window;
  var $ = win.$;

  function debug() {
    if (PlanfixFix.debug) console.log(...arguments);
  }

  win.onerror = function (error, file, line) {
    console.log(error + ' (line ' + line + ')');
  };

  if (win.top != win.self) {
    return false; // ignore iframes
  }

  if (location.hostname !== 'tagilcity.planfix.ru') {
    return;
  }

  const PlanfixFix = {
    debug: true,
    deferred: false,

    fields: {
      vyrabotka: {
        name: '[data-fid="741"] select',
        count: '[data-fid="747"] input',
        comment: '[data-fid="749"] textarea',
        hours_per_count: '.analitic-data[data-fid="741:h915"]'
      },
      realization: {
        count: '[data-fid="990"] input',
        price: '[data-fid="994"] input',
        date: '[data-fid="996"] input'
      },
    },
    // Шаблоны
    tmplsRecord: {
      handbook: 146, // id справочника
      name: 960, // id названия
      text: 962 // id текста
    },

    analitics_remote_default: {
      url: 'https://dev.viasite.ru/planfix_analitics.txt',
      format: 'text',
    },
    templates_remote_default: {
      url: '',
      format: 'yml',
    },
    analitics_remote_cache_lifetime: 3600,
    templates_remote_cache_lifetime: 300,

    analitics_default: [
      ['Поиск глюка', 'Поиск места'],
      ['Тесты', 'Тестирование'],
      [
        'Правки, тесты, отчет',
        [
          { name: 'Поиск места проблемы, (в т.ч. по алгоритму поиска)', count: 1 },
          'Обработка простая на вводе или выводе',
          'Тестирование',
          'Замена / вставка любого контента',
          { name: 'Создание пояснительной записки по внесенным изменениям', count: 1 },
        ],
      ],
      ['Задание', 'Задание'],
      ['Консультация', 'с коллегой'],
      ['Записка', 'Создание пояснительной записки'],
    ],
    templates_default: {
      Стандартное: {
        'Уточнение глюка': `URL, скрин, описание`,
        'Запрос доступов': `
%name%, чтобы начать работы нам нужны:

1. Доступ к панели управления хостинга
2. Логин и пароль от админки сайта`,
      },
      Предложения: {
        'После аудита': `
%name%, здравствуйте.

Как и договорились с вами ранее, отправляем предложение по результатам проведенных технического и seo- аудитов.
Содержимое расчета:
`,
      },
    },

    _analitics: [],

    init: function () {
      // init once
      if ($('body').hasClass('pff_inited')) return false;
      $('body').addClass('pff_inited');

      // не пугаем планфикс своими ошибками
      win.onerror = function () {
        return;
      };

      // очередь аналитик
      PlanfixFix.resetDeferred();

      PlanfixFix.actionAlter();

      PlanfixFix.addStyles();

      // тестовое открытие нового действия
      if (PlanfixFix.debug) {
        console.log('debug: init');
        setTimeout(() => {
          win.onbeforeunload = undefined; // отменить предупреждение о закрытии окна
          //console.log('debug: new action');
          $('.actions-quick-add-block-text').click(); // создание действия
          //console.log('debug: edit-draft-action');
          //$('.edit-draft-action').click(); // edit
          //PlanfixFix.addAnalitics({ name: 'Поминутная работа программиста' });
        }, 2000);
      }
    },

    // добавляет быстрые действия в блок действия
    addCustomAnalitics: function () {
      // показывается в задаче, где одно и то же планируется на каждый день
      if (win.PlanfixPage.task == 116702) {
        var dates = PlanfixFix.getDates(1, 5);
        var analitics_arr = $.map(dates, function (date) {
          return {
            group: 'Планируемое время работы',
            date: date,
            begin: '09:00',
            end: '09:30',
          };
        });
        PlanfixFix.addTaskBlock('План на неделю', analitics_arr);

        PlanfixFix.addTaskBlock('План на день', { name: 'План на день', count: 1 });
      }

      PlanfixFix.addTaskBlock('План', '[Планируемое время работы]');
      PlanfixFix.addTaskBlock('|');
      PlanfixFix.addTaskBlock('Выработка', {});
      PlanfixFix.addTaskBlock('|');

      var userPost = Current.loginedPost;
      switch (userPost) {
        case 'Программист':
          PlanfixFix.addTaskBlock('Программирование', { name: 'Поминутная работа программиста' });
          break;
        case 'Менеджер по сопровождению заказов':
          PlanfixFix.addTaskBlock('тел. лёгкий', { name: 'Лёгкий разговор по телефону' });
          PlanfixFix.addTaskBlock('тел. обычный', { name: 'Обычный разговор по телефону' });
          PlanfixFix.addTaskBlock('тел. сложный', { name: 'Сложный разговор по телефону' });
          PlanfixFix.addTaskBlock('письмо лёгкое', { name: 'Лёгкое письмо' });
          PlanfixFix.addTaskBlock('письмо обычное', {
            name: 'Письмо средней сложности / обычное письмо',
          });
          PlanfixFix.addTaskBlock('письмо сложное', { name: 'Сложное письмо' });
          break;
      }

      if (
        Current.logined == 9230 ||
        userPost == 'Менеджер по сопровождению заказов' ||
        userPost == 'Руководитель отдела продаж'
      ) {
        PlanfixFix.addTaskBlock('|');
        PlanfixFix.addTaskBlock('Инструкция', { group: 'Особые пометки', name: 'Инструкции' });
        PlanfixFix.addTaskBlock('|');
        PlanfixFix.addTaskBlock('Оформить смету', smetaStyle.run);
      }

      // парсим массив подготовленных аналитик
      PlanfixFix.getAnalitics().then(function (tasks) {
        PlanfixFix.addTaskBlock('|');
        $.each(tasks, function (i, task) {
          PlanfixFix.addTaskBlock(task.name, task.analitics);
        });
      });

      // быстрые ответы
      PlanfixFix.getTemplates().then(function (tmpls) {
        PlanfixFix.addTextTemplates(tmpls);
      });

      // тестовый вызов добавления аналитики
      /* if (PlanfixFix.debug) {
        PlanfixFix.addTaskBlock('|');
        PlanfixFix.addTaskBlock('Удалить все', function () { // удалить аналитики из действия
          $('.task-add-analitic').click();
          setTimeout(function () {
            $('[data-action="remove-all-analitics"]').click();
          }, 200);
        });
      } */
    },

    insertTemplate(textRaw) {
      const editor = win.CKEDITOR.instances.ActionDescription;
      let text = textRaw.replace(/\n/g, '<br>');

      text = text.replace(/---.*/, '').replace(/<p>$/, ''); // отсекаем примечания

      const tokens = text.match(/(%[a-zа-яё_-]+%)/gi);
      if (tokens) {
        const inputs = tokens.map((token) => {
          const name = token.replace(/%/g, '').replace(/_/g, ' ');
          let cls = 'text-box'
          if(name.match(/Дата/)) cls += ' dialog-date';
          return `<span class="task-create-field task-create-field-custom-99 task-create-field-line-first task-create-field-break-after">
                <span class="task-create-field-label task-create-field-label-first">${name}</span>
                <span class="task-create-field-input"><input name="${name}" data-token="${token}" type="text" class="${cls}" /></span>
                </span>`;
        });

        const btns = `
<div class="dialog-btn-wrapper">
<button class="btn-main btn-create action-edit-save js-action-pff-insert-template">Вставить</button>
<button class="btn-main btn-cancel">Отмена</button>
</div>`;

        const html =
          '<div class="pff-tmpl-form">' +
          '<div class="task-create-panel-fields">' +
          inputs.join('\n') +
          '</div>' +
          `<div class="pff-tmpl-preview">${text}</div>` +
          btns +
          '</div>';

        const dialog = new win.CommonDialogScrollableJS();
        dialog.closeByEsc = true;
        dialog.isMinimizable = true;
        dialog.draw(html);
        dialog.setHeader('Вставка шаблона');
        dialog.setCloseHandler(
          () =>
            new Promise((resolve, reject) => {
              let isValid = true;
              $('.pff-tmpl-form input').each(function () {
                if ($(this).val() == '') {
                  isValid = false;
                }
              });
              if (isValid) {
                editor.insertHtml($('.pff-tmpl-preview').html());
                resolve(true);
              } else {
                reject('required');
              }
            })
        );
        //win.drawDialog(300, 'auto', 300, html);

        const redrawPreview = () => {
          let pt = text;
          $('.pff-tmpl-form input').each(function () {
            const input = $(this);
            const t = input.data('token');
            const v = input.val();
            if (v == '') pt = pt.replace(t, `<span style="background:#ffff00">${t}</span>`);
            else pt = pt.replace(t, v);
          });
          $('.pff-tmpl-preview').html(pt);
        };

        setTimeout(() => {
          redrawPreview();
          $('.pff-tmpl-form input').on('keypress blur change', () => { setTimeout(redrawPreview, 50); });
          $('.pff-tmpl-form input').first().focus();
          $('.pff-tmpl-form .btn-cancel').click(() => { dialog.close(); });
          $('.js-action-pff-insert-template').click(() => {
            editor.insertHtml($('.pff-tmpl-preview').html());
            dialog.close();
            //$('.pff-tmpl-form').parents('.dialogWin').find('.destroy-button').click();
          });
        }, 100);
      } else {
        editor.insertHtml(text);
      }
    },

    updateTmplsMRU({id, name, text, cat}) {
      const mru = localStorage.pff_templates_mru ? JSON.parse(localStorage.pff_templates_mru) : {};
      if(mru[id]){
        mru[id].text = text;
        mru[id].cat = cat;
        mru[id].count++;
      }
      else {
        mru[id] = { id, name, text, cat, count: 1 };
      }
      localStorage.pff_templates_mru = JSON.stringify(mru);
    },

    // кнопка "вставить шаблон" в редакторе
    templateSelect: function() {
      var editor = CKEDITOR.instances.ActionDescription;
      editor.fire('pffTemplatesOpened');

      var editorSelection = editor.getSelection();
      var caretPosition = editorSelection.getRanges();
      
      var handbookSelectDialog = new HandbookSelectDialogJS(); 
      
      setTimeout(() => {
        $(`[data-handbookid="${PlanfixFix.tmplsRecord.handbook}"]`).click();
        setTimeout(() => {
          $(`[data-columnid="${PlanfixFix.tmplsRecord.name}"]`).click()
        }, 700);
      }, 1000);

      handbookSelectDialog.onInsertData = function(type, exportData) {
        editor.focus();
        
        setTimeout(function() {
          editor.getSelection().selectRanges(caretPosition);
          if ('record' == type) {
            const opts = {
              command: 'handbook:getDataStringByKey',
              handbook: exportData.handbookId,
              key: exportData.key
            };
            AjaxJS.request({
              data: opts,
              success: (data) => {
                let id = exportData.key, name, text;
                let cat = data.NamedPath[0]?.Name || 'Общие';
                for (f of data.Items[0].String) {
                  if(f.Field.ID == PlanfixFix.tmplsRecord.name){
                    name = f.Value;
                  }
                  if(f.Field.ID == PlanfixFix.tmplsRecord.text){
                    text = f.Value;
                    PlanfixFix.insertTemplate(text);
                  }
                }
                PlanfixFix.updateTmplsMRU({id, name, text, cat});
              }
            });

          } else if('text' == type) {
            PlanfixFix.insertTemplate(exportData.text);
          }
        }, 200);
      };
      
      handbookSelectDialog.onClose = function() {
        editor.fire('pffTemplatesClosed');
      };
      
      handbookSelectDialog.drawDialog(); // editor.extraHandbookData
    },


    // быстрые ответы в редактор
    addTextTemplates: function (tmpls) {
      const tplsBlock = $('<div class="pff-tpls-content"></div>');

      PlanfixFix.addTaskBlock('Шаблон', PlanfixFix.templateSelect);

      for (let cat in tmpls) {
        const catDiv = $(`<div class="pff-cat-content"></div>`);
        for (let tpl in tmpls[cat]) {
          let item = tmpls[cat][tpl];
          if(typeof tmpls[cat][tpl] == 'string') item = { name: tpl, text: tmpls[cat][tpl] };
          const textRaw = item.text.replace(/^\n/, '');
          const title = textRaw.replace(/"/g, "'").replace(/<p>/g, '').replace(/<br ?\/?>/g, '\n');
          let link = 'javascript:';
          if(item.id) link = `https://${location.hostname}/?action=handbookdataview&handbook=${PlanfixFix.tmplsRecord.handbook}&key=${item.id}`;
          catDiv.append(
            $(`<a href="${link}" title="${title}">${item.name.replace(/ /g, '&nbsp;')}</a>`).click(
              () => {
                PlanfixFix.insertTemplate(textRaw);
                return false;
              }
            )
          );
        }
        tplsBlock.append(
          $(`<div class="pff-cat"><span class="pff-cat-title">${cat}:</span> </div>`).append(catDiv)
        );
      }
      $('.task-add-block')
        .last()
        .after(
          $(
            '<div class="pff-tpls"><span class="pff-tpls-title"><b>Шаблоны</b></span></div>'
          ).append(tplsBlock)
        );
    },

    /**
     * Переопределяет стили
     */
    addStyles: function () {
      $('body').append(
        `<style>
.chzn-container .chzn-results{ max-height:400px !important; }
.chzn-drop{ width:850px !important; border-style:solid !important; border-width:1px !important; }
.silentChosen .chzn-container .chzn-results{ max-height:1px !important; }
.silentChosen .chzn-drop{ width:1px !important; }

/* text templates */
.pff-tpls { line-height: 1.5rem; margin-left: 100px; max-width: 200px; }
.pff-tpls-content {display: none; }
.pff-tpls:hover { max-width: none; margin-left: 0; }
.pff-tpls:hover .pff-tpls-content { display: block; }
.pff-cat { margin-bottom: 15px; border-bottom: 3px solid transparent; }
.pff-cat:hover { border-bottom-color: #3ba3d0; }
.pff-cat-title { float:left; clear: left; width: 100px; padding-top: 2px; }
.pff-cat-content { margin-left: 100px; }
.pff-cat a { display: inline-block; padding: 2px 10px; }

.pff-tmpl-form input[type="text"] { width: 200px !important; }
.pff-tmpl-form .btn-main { margin-left: 0; }
.pff-tmpl-form .btn-create { float: right; }
.pff-tmpl-preview { width: 360px; margin: 30px 0; }
</style>`
      );
    },

    actionAlter: function () {
      // save original functions
      win.ActionListJS.prototype.createAction_orig = win.ActionListJS.prototype.createAction;
      //win.ActionJS.prototype.createNewAction_orig = win.ActionJS.prototype.createNewAction;
      win.ActionJS.prototype.editDraft_orig = win.ActionJS.prototype.editDraft;
      win.ActionJS.prototype.edit_orig = win.ActionJS.prototype.edit;
      //win.ActionJS.restoreAnaliticsForEdit_orig = win.ActionJS.restoreAnaliticsForEdit;
      win.AnaliticsWinJS.prototype.show_orig = win.AnaliticsWinJS.prototype.show;

      // decorate original functions
      win.ActionListJS.prototype.createAction = function () {
        return this.createAction_orig().then(function () {
          if (PlanfixFix.debug) console.log('after createAction');
          PlanfixFix.addCustomAnalitics();
        });
      };
      /*win.ActionJS.prototype.createNewAction = function() {
        this.createNewAction_orig();
        if (PlanfixFix.debug) console.log('after createNewAction');
        setTimeout(PlanfixFix.addCustomAnalitics, 2000);
      };*/
      win.ActionJS.prototype.editDraft = function (draftid, task, insertBefore, actionList) {
        this.editDraft_orig(draftid, task, insertBefore, actionList);
        if (PlanfixFix.debug) console.log('after editDraft');
        setTimeout(PlanfixFix.addCustomAnalitics, 1000);
      };
      win.ActionJS.prototype.edit = function (id, task, data, actionNode) {
        this.edit_orig(id, task, data, actionNode);
        setTimeout(PlanfixFix.addCustomAnalitics, 1000);
      };
      /*win.ActionJS.restoreAnaliticsForEdit = function(data){
        win.ActionJS.restoreAnaliticsForEdit_orig(data);
        setTimeout(PlanfixFix.countTotalAnalitics, 2000);
      };*/

      // редактор аналитик
      win.AnaliticsWinJS.prototype.show = function (options) {
        this.show_orig(options);

        const addAnaliticAction = (name, action) => {
          const link = $(
            '<span style="margin-left:1em" class="fakelink-dashed">' + name + '</span>'
          ).click(action);
          $('.af-row-btn-add').append(link);
        };

        setTimeout(() => {
          const smetaTable = $('[data-aid="314"] .tbl-list');
          // смета на разработку
          if (smetaTable.length > 0) {
            // кнопка "Реализовать"
            addAnaliticAction('Реализовать', smetaToRelization);

            // кнопка "Сортировать смету"
            addAnaliticAction('Сортировать смету', smetaOrder);

            // удаление аналитик по блокам (этапам)
            const sections = {};
            smetaTable.find('div[data-fid="950"]').each(function () {
              const val = $(this).find('input:hidden').val();
              if (!sections[val]) {
                sections[val] = {
                  name: $(this).text(),
                  count: 0,
                  rows: [],
                };
              }
              sections[val].count++;
              sections[val].rows.push($(this).parents('tr'));
            });
            for (let fid in sections) {
              let sec = sections[fid];
              addAnaliticAction(`Удалить ${sec.name} (${sec.count})`, () => {
                for (let row of sec.rows) {
                  row.find('[data-acr="delete"]').click();
                  row.remove();
                }
                link.remove();
              });
            }
          }
        }, 3000);
      };

      // menuitem
      win.MainMenuJS.showConfig_orig = win.MainMenuJS.showConfig;
      win.MainMenuJS.showConfig = function(show) {
        win.MainMenuJS.showConfig_orig(show);
        PlanfixFix.addMenu();
      };

      /*$('body').delegate(PlanfixFix.fields.vyrabotka.count, 'change keypress', PlanfixFix.countTotalAnalitics);
      $('body').delegate(PlanfixFix.fields.vyrabotka.name, 'change', function(){
      var hours_field = $(this).parents('.add-analitic-block').find(PlanfixFix.fields.vyrabotka.hours_per_count);
      hours_field.attr('title', (hours_field.val().replace(',', '.')*60).toFixed(1));
      });*/

      /*$('body').delegate('.attach-new-analitic td.td-item-add-ex:first span.fakelink-dashed', 'click', function(e){
        PlanfixFix.addAnalitics([{}]);
      });*/
    },

    /**
     * Тупая функция, добавляет все аналитики из массива
     */
    addAnalitics: function (analitics_arr) {
      analitics_arr = PlanfixFix.normalizeAnalitics(analitics_arr);
      $.each(analitics_arr, function (i, opts) {
        PlanfixFix._addAnalitic(opts);
      });
      PlanfixFix.deferred.then(PlanfixFix.countTotalAnalitics);
    },

    /**
     * Создает массив, элементы которого скармливаются в _addAnalitic() без изменений
     * Может парсить строки типа:
     * [Группа аналитик] Название аналитики - кол-во
     * Группа по умолчанию - Выработка
     */
    normalizeAnalitics: function (analitics_arr) {
      var analitics = [];
      if (!$.isArray(analitics_arr)) analitics_arr = [analitics_arr];
      $.each(analitics_arr, function (i, opts) {
        var isFirst = i === 0;
        var isLast = i === analitics_arr.length - 1;
        if (typeof opts == 'string') {
          opts = { name: opts };
        }

        opts = $.extend(
          {
            name: '',
            group: 'Выработка',
            scrollTo: isFirst,
            select: !isLast,
          },
          opts
        );

        var count = opts.name.match(/ - (\d+)$/) || '';
        if (count !== '') {
          opts.name = opts.name.replace(count[0], '');
          opts.count = count[1];
        }

        var group = opts.name.match(/^\[(.*?)\] ?/) || '';
        if (group !== '') {
          opts.name = opts.name.replace(group[0], '');
          opts.group = group[1];
        }

        analitics.push(opts);
      });
      return analitics;
    },

    /**
     * Добавляет аналитику в действие
     * Добавление идет через PlanfixFix.deferred, очередь добавления
     * В deferred создержится последняя добавляемая аналитика
     * @param {object} opts { name, group, count, scrollTo, select }
     */
    _addAnalitic: function (opts) {
      var deferred = $.Deferred();

      PlanfixFix.deferred.then(function () {
        $('.task-add-analitic').click();

        var timeout = $('.analitics-form').size() === 0 ? 500 : 10;
        //var timeout = 2000;
        setTimeout(function () {
          var div = $('.analitics-form').last();
          if (opts.scrollTo) PlanfixFix.scrollTo(div);

          setTimeout(function () {
            // выбор группы аналитик
            var select = div.find('select');
            if (PlanfixFix.debug) console.log('select', select);

            var option = select.find('option').filter(function () {
              return $(this).text() == opts.group;
            });
            select.val(option.val()).change();

            var analitic = div.find('.af-tbl-tr');
            if (PlanfixFix.debug) console.log('analitic', analitic);

            var select_handbook = analitic.find('select[data-handbookid]:first');
            if (PlanfixFix.debug) console.log('select_handbook', select_handbook);
            select_handbook.trigger('liszt:focus');

            // выработка
            if (opts.name) {
              // выбор конкретной аналитики
              // задержка из-за того, что иногда выбирается выработка "заказ такси"
              setTimeout(function () {
                analitic.addClass('silentChosen');
                analitic
                  .find('.chzn-search:first input')
                  .val(opts.name) /*.focus()*/
                  .keyup();
                var count_focused = false;
                select_handbook.bind('liszt:updated', function (e) {
                  var results = analitic.find('.chzn-results .active-result');
                  if (PlanfixFix.debug) console.log('results', results);
                  if (results.length == 1 || opts.select) {
                    results.first().mouseup();
                    analitic.find(PlanfixFix.fields.vyrabotka.count).focus();
                  }
                  // задержка из-за лага chosen
                  setTimeout(function () {
                    if (count_focused) return;
                    count_focused = true;
                    analitic.removeClass('silentChosen');

                    if (opts.count) {
                      analitic.find(PlanfixFix.fields.vyrabotka.count).val(opts.count);
                      analitic.find(PlanfixFix.fields.vyrabotka.comment).focus();
                    } else {
                      analitic
                        .find(PlanfixFix.fields.vyrabotka.count)
                        .focus()
                        .on('keypress', function (e) {
                          if (e.which == 13) {
                            if (e.ctrlKey) {
                              $('[data-action="saveParent"]').click();
                            } else {
                              $('[data-action="save"]').click();
                            }
                          }
                        });
                    }

                    // планируемое время
                    if (opts.date) {
                      analitic.find('input.date').val(opts.date);
                    }
                    if (opts.begin) {
                      analitic.find('select.timeperiodbegin').val(opts.begin);
                    }
                    if (opts.end) {
                      analitic.find('select.timeperiodend').val(opts.end);
                    }
                  }, 1000);

                  deferred.resolve();
                });
              }, 500);
            }

            if (!opts.name) {
              deferred.resolve();
            }
          }, 500);
        }, timeout);
      });

      PlanfixFix.deferred = deferred;
      return deferred.promise();
    },

    /**
     * Добавляет аналитику "Реализация"
     */
    _addRealization: function (opts) {
      opts = {
        ...{ count: 1 },
        ...opts,
      };
      var deferred = $.Deferred();

      PlanfixFix.deferred.then(function () {
        // добавить другую аналитику
        $('[data-action="add-new-analitic"]').click();

        setTimeout(() => {
          const div = $('.analitics-form').last();
          if (opts.scrollTo) PlanfixFix.scrollTo(div);

          setTimeout(() => {
            // выбор группы аналитик
            var select = div.find('select');
            if (PlanfixFix.debug) console.log('select', select);
            const option = select.find('option').filter(function () {
              return $(this).text() == opts.group;
            });
            select.val(option.val()).change();

            const analitic = div.find('[data-aname="' + opts.group + '"] .af-tbl-tr').last();
            if (PlanfixFix.debug) console.log('analitic', analitic);

            const select_handbook = analitic.find('select[data-handbookid]:first');
            if (PlanfixFix.debug) console.log('select_handbook', select_handbook);
            select_handbook.trigger('liszt:focus');

            setTimeout(() => {
              analitic.addClass('silentChosen');
              analitic
                .find('.chzn-search:first input')
                .val(opts.name) /*.focus()*/
                .keyup();
              var count_focused = false;
              select_handbook.bind('liszt:updated', function (e) {
                var results = analitic.find('.chzn-results .active-result');
                if (PlanfixFix.debug) console.log('results', results);
                if (results.length == 1 || opts.select) {
                  results.first().mouseup();
                  analitic.find(PlanfixFix.fields.vyrabotka.count).focus();
                }
                // задержка из-за лага chosen
                setTimeout(() => {
                  if (count_focused) return;
                  count_focused = true;
                  analitic.removeClass('silentChosen');

                  if (opts.count) {
                    analitic.find(PlanfixFix.fields.realization.count).val(opts.count);
                  }
                  if (opts.price) {
                    analitic.find(PlanfixFix.fields.realization.price).val(opts.price);
                  }
                  if (opts.date) {
                    analitic.find(PlanfixFix.fields.realization.date).val(opts.date);
                  }
                }, 2000);

                deferred.resolve();
              });
            }, 500);
          });
        }, 500);
      });

      PlanfixFix.deferred = deferred;
      return deferred.promise();
    },

    /**
     * Добавляет ссылку на добавление аналитики в панель
     * В ссылку вписывается список аналитик
     * Можно передавать вместо аналитик произвольную функцию
     */
    addTaskBlock: function (name, action) {
      var block = $('<div class="task-add-block"></div>')
        .html(name)
        .click(function () {
          PlanfixFix.resetDeferred();
          if ($.isArray(action) || typeof action == 'object' || typeof action == 'string') {
            PlanfixFix.addAnalitics(action);
          } else if ($.isFunction(action)) {
            action();
          }
        });
      //if (PlanfixFix.debug) console.log(block);
      if ($.isArray(action) || typeof action == 'object' || typeof action == 'string') {
        var analitics = $.map(PlanfixFix.normalizeAnalitics(action), function (analitic) {
          return analitic.name;
        });
        block.attr('title', analitics.join('\n'));
      }
      $('.task-add-block').last().after(block);
      return block;
    },

    /**
     * Отдает promise, в нем аналитики
     * Отдает кешированные аналитики
     * Или грузит по урлу и отдает, здесь же проверяется свежесть кеша
     * Удаленные возвращают умолчальные аналитики в случае неудачи
     */
    getAnalitics: function () {
      var deferred = $.Deferred();
      if (PlanfixFix._analitics.length === 0) {
        var mtime = localStorage.planfixfix_analitics_mtime || new Date().getTime();
        var cache_age = new Date().getTime() - mtime;
        if (cache_age > PlanfixFix.analitics_remote_cache_lifetime * 1000) {
          PlanfixFix.clearCache();
        }
        PlanfixFix._analitics = $.parseJSON(localStorage.planfixfix_analitics) || [];

        /*if(PlanfixFix._analitics.length===0){
					  deferred = PlanfixFix.parseRemoteAnalitics(
						  PlanfixFix.getRemoteAnaliticsUrl()
					  );
				  }*/
      }
      if (PlanfixFix._analitics.length > 0) {
        deferred.resolve(PlanfixFix._analitics);
      }
      return deferred.promise();
    },

    /**
     * Отдает promise, в нем шаблоны ответов
     * Отдает кешированные шаблоны
     * Или грузит по урлу и отдает, здесь же проверяется свежесть кеша
     * Удаленные возвращают умолчальные шаблоны в случае неудачи
     */
    getTemplates: function () {
      return new Promise((resolve, reject) => {
        var mtime = localStorage.planfixfix_templates_mtime || new Date().getTime();
        var cache_age = new Date().getTime() - mtime;
        if (cache_age > PlanfixFix.templates_remote_cache_lifetime * 1000) {
          delete localStorage.planfixfix_templates;
        }

        if (!localStorage.planfixfix_templates) {
          const remoteUrl = PlanfixFix.getRemoteTemplatesUrl();
          if(remoteUrl.url){
            PlanfixFix.parseRemoteTemplates().then((tmpls) => {
              resolve(tmpls);
            });
          }
          else if(localStorage.pff_templates_mru) {
            // convert mru to text templates
            const mru = JSON.parse(localStorage.pff_templates_mru);
            let items = [];
            for(let id in mru) {
              items.push(mru[id]);
            }
            items.sort((a, b) => {
              if(a.count > b.count) return -1;
              if(a.count < b.count) return 1;
              return 0;
            });

            let defaultCat = 'Часто используемые'; // TODO: var
            const tmpls = {[defaultCat]: []};
            let itemsObj = {}
            for(let item of items) {
              itemsObj[item.name] = item.text;
              if(!item.cat) item.cat = defaultCat;
              if(!tmpls[item.cat]) tmpls[item.cat] = [];
              tmpls[item.cat].push(item)
            }

            resolve(tmpls);
          }
        } else {
          const tmpls = JSON.parse(localStorage.planfixfix_templates) || {};
          debug('use cached templates:', tmpls);
          resolve(tmpls);
        }
      });
    },

    /**
     * Умолчальные аналитики (задачи) из массива
     */
    getDefaultAnalitics: function () {
      var tasks = [];
      $.each(PlanfixFix.analitics_default, function (i, item) {
        tasks.push({
          name: item[0],
          analitics: item[1],
        });
      });
      return tasks;
    },

    /**
     * Возвращает сохраненный или дефолтный урл
     */
    getRemoteAnaliticsUrl: function () {
      var store = $.parseJSON(localStorage.planfixfix_remote_analitics_url);
      return store || PlanfixFix.analitics_remote_default;
    },

    /**
     * Возвращает сохраненный или дефолтный урл
     */
    getRemoteTemplatesUrl: function () {
      var store = $.parseJSON(localStorage.planfixfix_remote_templates_url);
      return store || PlanfixFix.templates_remote_default;
    },

    /**
     * Сохраняет урл удаленных аналитик,
     * Если пусто или изменено, чистим кеш
     */
    setRemoteAnaliticsUrl: function (remote) {
      if (remote.url == PlanfixFix.analitics_remote_default.url) {
        return true;
      }
      if (remote.url === '') {
        delete localStorage.planfixfix_remote_analitics_url;
        PlanfixFix.clearCache();
        return true;
      }
      if (!remote.url.match(/^https:\/\//)) {
        alert('Возможны только https URL');
        return false;
      }
      if (remote.format != 'text') {
        alert('Возможны только текстовые файлы');
        return false;
      }
      PlanfixFix.clearCache();
      localStorage.planfixfix_remote_analitics_url = JSON.stringify(remote);
      return true;
    },

    /**
     * Сохраняет урл удаленных аналитик,
     * Если пусто или изменено, чистим кеш
     */
    setRemoteTemplatesUrl: function (remote) {
      if (remote.url == PlanfixFix.templates_remote_default.url) {
        return true;
      }
      if (remote.url === '') {
        delete localStorage.planfixfix_remote_templates_url;
        delete localStorage.planfixfix_templates;
        return true;
      }
      if (!remote.url.match(/^https:\/\//)) {
        alert('Возможны только https URL');
        return false;
      }
      if (remote.format != 'yml') {
        alert('Возможны только yml файлы');
        return false;
      }
      delete localStorage.planfixfix_templates;
      localStorage.planfixfix_remote_templates_url = JSON.stringify(remote);
      return true;
    },

    parseRemoteAnalitics: function (opts) {
      var deferred = $.Deferred();
      $.get(opts.url, function (data) {
        var tasks = [];
        if (opts.format == 'text') {
          tasks = PlanfixFix.text2tasks(data);
        }
        if (tasks.length > 0) {
          PlanfixFix._analitics = tasks;
          localStorage.planfixfix_analitics = JSON.stringify(tasks);
          localStorage.planfixfix_analitics_mtime = new Date().getTime();
        }
        if (tasks.length === 0) tasks = PlanfixFix.getDefaultAnalitics();
        deferred.resolve(tasks);
      });
      return deferred;
    },

    parseRemoteTemplates: function (opts) {
      return new Promise((resolve, reject) => {
        if (opts.format != 'yml') {
          console.log('only yml possible');
          return reject(false);
        }
        GM_xmlhttpRequest({
          method: 'GET',
          url: opts.url,
          onload: function (response) {
            const tpls = jsyaml.load(response.responseText);

            const tplsCount = Object.keys(tpls).length;
            if (tplsCount > 0) {
              debug('parsed remote templates:', tpls);
              PlanfixFix._tpls = tpls;
              localStorage.planfixfix_templates = JSON.stringify(tpls);
              localStorage.planfixfix_templates_mtime = new Date().getTime();
              resolve(tpls);
            } else {
              debug('failed parse remote templates:', response.responseText);
              resolve(PlanfixFix.getDefaultTemplates());
            }
          },
        });
      });
    },

    /**
     *
     * @param  {[string]} text текст, разделенный табами,
     * 0 табов - задача,
     * 1 таб - аналитика,
     * если в конце аналитики через дефис написана цифра - 1, она превратится в количество
     * @return массив, пригодный для addAnalitics()
     */
    text2tasks: function (text) {
      var lines = text.split('\n');
      var lastLevel = -1;
      var tasks = [];
      var task;
      $.each(lines, function (i, line) {
        if (line === '') return;

        var level = line.match(/^\t*/)[0].length;
        var text = $.trim(line);

        if (level === 0) {
          if (lastLevel != -1) tasks.push(task);
          task = { name: text, analitics: [] };
        }
        if (level == 1) {
          task.analitics.push(text);
        }
        lastLevel = level;
      });
      if (lines.length > 0) tasks.push(task);
      return tasks;
    },

    /**
     * Чистит сохраненные аналитики, которые загружались удаленно
     */
    clearCache: function () {
      delete localStorage.planfixfix_analitics;
    },

    /**
     * Считает, сколько всего минут во всех аналитиках действия,
     * Предупреждает, если есть незаполненные или ошибочные
     */
    countTotalAnalitics: function () {
      setTimeout(function () {
        var count_div = $('.analitics-total-wrap');
        var btn = $('.tr-action-commit .btn:first, .action-edit-save');

        var highlight = function (state) {
          if (state) {
            count_div.css('color', 'red');
            btn.css('border-color', 'red');
          } else {
            count_div.css('color', 'inherit');
            btn.css('border-color', 'inherit');
          }
        };

        if (count_div.length === 0) {
          count_div = $('<div class="analitics-total-wrap"></div>')
            .attr('style', 'float:right; margin-right:15px')
            .html('Всего: <span class="analitics-total-count"></span>');
          $('.attach-new-analitic td.td-item-add-ex:first').append(count_div);
        }
        highlight(false); 

        var counts = $(PlanfixFix.fields.vyrabotka.count);
        var totals = 0;
        counts.each(function (i, count_field) {
          var analitic = $(count_field).parents('.add-analitic-block');
          var count = $(count_field).val();
          var hours_per_count = analitic
            .find(PlanfixFix.fields.vyrabotka.hours_per_count)
            .text()
            .replace(',', '.');
          var hours = count * hours_per_count;
          if (count === '' || hours_per_count === '') highlight(true);
          totals += hours;
        });
        totals = (totals * 60).toFixed(1).replace(/\.0$/, '');
        if (isNaN(totals) || totals === 0) highlight(true);

        count_div.find('.analitics-total-count').html(totals);
      }, 10);
    },

    /**
     * Прокручивает до селектора, используется функция планфикса
     */
    scrollTo: function (elem) {
      win.TaskCardPoolJS.getInstance(win.PlanfixPage.task).scroller.scrollToBlock(elem);
    },

    /**
     * Записывает в последнего в очереди чистый deferred,
     * следующий _addAnalitic() исполнится мгновенно
     */
    resetDeferred: function () {
      PlanfixFix.deferred = $.Deferred().resolve();
    },

    /**
     * Добавляет пункт меню в главное меню "Еще"
     * Настройки скрипта:
     * - url для удаленной загрузки аналитик
     */
    addMenu: function () {
      $('<a href="javascript:" class="without-dragging main-menu-config-item">PlanfixFix</a>')
        .appendTo('.main-config-ddl-wrapper')
        .click(function () {
          var remoteAnalitics = PlanfixFix.getRemoteAnaliticsUrl();
          var remoteTemplates = PlanfixFix.getRemoteTemplatesUrl();
          var html =
            '<div class="planfixfix-settings">' +
            '<div class="form">' +
            '<div>URL для обновления аналитик, обязательно https://</div>' +
            '<input style="width:400px" class="text-box" name="planfixfix_analitics_remote_url" value="' +
            remoteAnalitics.url +
            '"/>' +
            //.append('<input type="hidden" name="planfixfix_remote_format" value="text"/>')
            '<br>' +

            '<div>URL для обновления шаблонов писем (yml), обязательно https://</div>' +
            '<input style="width:400px" class="text-box" name="planfixfix_templates_remote_url" value="' +
            remoteTemplates.url +
            '"/>' +
            '<input type="button" value="Сохранить"/>' +
            '</div>';
          win.drawDialog(300, 'auto', 300, html);
          $('.planfixfix-settings [type="button"]').click(function () {
            var isSave = PlanfixFix.setRemoteAnaliticsUrl({
              url: $('[name="planfixfix_analitics_remote_url"]').val(),
              format: 'text',
            });
            isSave = isSave && PlanfixFix.setRemoteTemplatesUrl({
              url: $('[name="planfixfix_templates_remote_url"]').val(),
              format: 'yml',
            });
            if (isSave) {
              $('.dialogWin .destroy-button').click();
            }
          });
          return false;
        });
    },

    /**
     * Возвращает массив дат d-m-Y от dayofweek в кол-ве count
     * Если текущая дата совпадает с dayofweek, берется сегодня,
     * иначе этот ближайший день недели
     */
    getDates: function (dayofweek, count) {
      var dates = [];

      // next or current monday
      const d = new Date();
      var day = d.getDay();
      if (day === 0) day = 7;
      if (day != dayofweek) {
        var diff = (dayofweek + 7 - day) * 86400 * 1000;
        d.setTime(d.getTime() + diff);
      }

      for (var i = 0; i < count; i++) {
        dates.push(pad(d.getDate()) + '-' + pad(1 + d.getMonth()) + '-' + d.getFullYear());
        d.setTime(d.getTime() + 86400000);
      }

      return dates;
    },
  };

  // оформление сметы в 1 клик, https://tagilcity.planfix.ru/task/604890
  const smetaStyle = {
    // style html
    processHtml(html) {
      const newlines = [];
      const headerPrices = [];
      let discontSection = 0;
      let discontTotal = 0;

      const getPlural = (number, one, two, five) => {
        let n = Math.abs(number);
        n %= 100;
        if (n >= 5 && n <= 20) return five;
        n %= 10;
        if (n === 1) return one;
        if (n >= 2 && n <= 4) return two;
        return five;
      };

      const outSectionSummary = function () {
        let lastPrice = headerPrices[headerPrices.length - 1];
        lastPrice = new Intl.NumberFormat().format(lastPrice);
        discontTotal += discontSection;

        const discontSectionFormat = new Intl.NumberFormat().format(discontSection);
        const plural = getPlural(discontSection, 'рубль', 'рубля', 'рублей');
        let discontText = discontSection ? `, экономия ${discontSectionFormat} ${plural}` : '';
        newlines.push(`<b>Итого: ${lastPrice} рублей${discontText}</b><br /><br /><br /><br />`);
        discontSection = 0;
      };

      html = html.replace(/<p>/g, '<br />').replace(/<\/p>/g, '');
      const lines = html.split(/<br ?\/?>/);

      //console.log(lines);

      if (lines.length === 0) return;

      for (let line of lines) {
        //console.log(line);

        // empty line
        if (line.replace(/(;nbsp| )/g, '') == '') continue;

        // ignore summary for double conversion
        if (line.match(/^Итого.*?:/)) continue;
        if (line.match(/^Общий бюджет на запуск сайта.*?:/)) continue;

        // trim trailing spaces
        line = line.replace(/(&nbsp;| )+$/, '');

        // for double conversion
        if (line.match(/рублей$/)) {
          line = line.replace(/:/g, '').replace(' рублей', '.00');
        }

        const h = line.match(/(.*?)(&nbsp;| )+([0-9 ]+)\..*/);
        //console.log(h);

        // is header?
        if (h && line.indexOf(':') == -1) {
          const name = h[1];
          const price = h[3];

          // section end
          if (newlines.length > 0) {
            newlines.push('</ul><br />');
            outSectionSummary();
          }

          // save int price
          headerPrices.push(parseInt(price.replace(/ /g, '')));

          newlines.push(`<b>${name}:&nbsp;${price} рублей</b>`);

          newlines.push('<ul>');
        } else {
          const item = line.match(
            /(.*?):\s([0-9\s&nbsp;]+[&nbsp;\s]+руб\.)(, старая цена:)?([0-9\s\.&nbsp;]+(руб\.)?)? ?(.*)?/
          );
          //console.log(item);

          // non-standard line
          if (!item) {
            newlines.push(`<li style="margin-bottom:1em">${line}</li>`);
            continue;
          }

          const name = item[1];
          let price = item[2];

          // double conversion fix
          /*if (item[5]) {
            price = item[4].trim();
          }*/

          let desc = '';
          if (item[6]) {
            // remove .)
            desc = item[6].replace('.)', ')');

            // style desc
            desc = ` <span style="color:#7f8c8d"><em>${desc}</em></span>`;
          }

          // old price
          if (item[4] && item[4].trim()) {
            //console.log(item);
            let oldprice;

            // double conversion fix, для строк типа 9 900 руб. 5 500 руб.
            /*if (item[5]) {
              oldprice = item[2];
              price = item[4].trim();
            } else {
              oldprice = item[4];
            }*/
            oldprice = item[4];

            oldprice = oldprice
              .replace(/&nbsp;/g, '')
              .replace('руб.', '')
              .replace('.00', ' руб.')
              .trim();
            price = price
              .replace(/&nbsp;/g, '')
              .replace('руб.', '')
              .replace(/\s/g, '');

            let discont = parseInt(oldprice) - parseInt(price);
            discontSection += discont;

            oldprice = new Intl.NumberFormat().format(parseInt(oldprice));
            price = price.replace(/\s/g, '&nbsp;') + '&nbsp;руб.';
            //console.log(item[4]);
            price = `${price}, старая цена: <s>${oldprice}&nbsp;руб.</s> `;
          } else {
            price = price.replace(/&nbsp;/g, ' ').replace(' руб.', '') + ' руб.';
            price = price.replace(/\s/g, '&nbsp;');
          }

          newlines.push(`<li style="margin-bottom:1em">${name}: ${price}${desc}</li>`);
        }
      }

      // last section end
      newlines.push('</ul><br />');
      outSectionSummary();

      // summary:
      let sumPrice = headerPrices.reduce((a, c) => a + c);
      let oldsumPrice = new Intl.NumberFormat().format(sumPrice + discontTotal);
      sumPrice = new Intl.NumberFormat().format(sumPrice);
      const discontTotalFormat = new Intl.NumberFormat().format(discontTotal);
      const plural = getPlural(discontTotal, 'рубль', 'рубля', 'рублей');
      let discontText = discontTotal ? `, экономия ${discontTotalFormat} ${plural}` : '';
      let oldsumText = discontTotal ? `<s>${oldsumPrice} рублей</s> ` : '';
      newlines.push(`<b>Общий бюджет на запуск сайта: ${oldsumText}${sumPrice} рублей${discontText}</b>`);

      return `<p>${newlines.join('\n')}</p>`;
    },

    // get selection html from ckeditor
    getSelectionHtml(editor) {
      const sel = editor.getSelection();
      const ranges = sel.getRanges();
      const el = new win.CKEDITOR.dom.element('div');
      for (let i = 0, len = ranges.length; i < len; ++i) {
        el.append(ranges[i].cloneContents());
      }
      return el.getHtml();
    },

    // main function
    run() {
      const editor = win.CKEDITOR.instances.ActionDescription;
      const html = smetaStyle.getSelectionHtml(editor);
      const styledHtml = smetaStyle.processHtml(html);

      editor.insertHtml(styledHtml);
      //document.getElementsByClassName('b-task-description')[0].innerHTML = styledHtml;
      //console.log('html: '+html);
    },
  };

  // сортировать смету, https://tagilcity.planfix.ru/task/608083
  const smetaOrder = function (opts) {
    opts = {
      ...{
        analiticAid: 314, // смета на разработку
        orderByFids: [950, 1093], // тип работ, №
      },
      ...opts,
    };

    const t = $('[data-aid="' + opts.analiticAid + '"] .tbl-list');
    const rows = t.find('tr');
    const rowsData = [];

    // собираем массив с данными таблицы (ключ-значение по fid)
    // сохраняем также ссылку на DOM-элемент ряда
    rows.each(function () {
      const r = $(this);
      if (r.find('.td-head').length > 0) return;

      const rowData = {
        elem: this,
      };

      r.find('td').each(function () {
        const td = $(this);

        const fid = td.find('[data-fid]').data('fid');
        // ignore subfids
        if (!fid || fid.toString().indexOf(':') !== -1) return;

        const val = td.find('input:hidden').val();

        rowData[fid] = val;
      });

      rowsData.push(rowData);
    });

    // сортируем массив данных по нужным колонкам, предполагаем, что там int/float
    const rowsDataSorted = rowsData.concat().sort((a, b) => {
      for (let sfid of opts.orderByFids) {
        if (a[sfid] == b[sfid]) continue;

        // remove "
        a[sfid] = a[sfid].replace(/"/g, '').replace(/,/g, '.');
        //console.log(a[sfid]);
        b[sfid] = b[sfid].replace(/"/g, '').replace(/,/g, '.');
        //console.log(`a[${sfid}]:${a[sfid]}, b[${sfid}]:${b[sfid]}, a>b: ${parseFloat(a[sfid]) > parseFloat(b[sfid])}`);
        return parseFloat(a[sfid]) > parseFloat(b[sfid]) ? 1 : -1;
      }
      return 0;
    });
    const newrows = [];
    //console.log(rowsData);
    //console.log(rowsDataSorted);

    // прогоняем оригинальный массив, но вписываем туда значения из сортированного массива
    rowsData.map(function (row, ind) {
      const elem = $(row.elem);
      const newData = rowsDataSorted[ind];
      for (let fid in newData) {
        elem.find('[data-fid="' + fid + '"] input:hidden').val(newData[fid]);
      }
    });

    // обозначаем окончание цветом (визуально данные не поменяются)
    t.css('background', '#e5ffe5');
    setTimeout(() => { t.parents('.analitics-form').find('.btn-create').click() }, 1000);
    /*alert(`Использование:
1. Сделать копию задачи
2. Открыть в копии редактор аналитик. Не должно быть отредактированных полей, то есть открыли и сразу переходим к следующему шагу.
3. Запустить сниппет
4. Таблица окрасится в зелёный цвет, это значит, что сортировка прошла
5. Нажать "Сохранить аналитику"
6. Открыть оригинальную задачу и скопированную отсортированную, проверить, что сортировка прошла правильно
7. Удалить копию, прогнать шаги 2-5 на оригинале`);*/
  };

  /**
   * Копирует аналитики "Смета на разработку" в "Реализация"
   */
  const smetaToRelization = function () {
    const smetaTable = $('[data-aid="314"] .tbl-list');
    smetaTable.find('tr').each(function () {
      const tr = $(this);
      if (tr.find('input').length == 0) return;

      const d = new Date();

      const name = tr.find('[data-fid="934"]').text().trim();
      const itemPrice = tr.find('[data-fid="934:h1016"]').text();
      const customPrice = tr.find('[data-fid="1089"]').text();
      const price = customPrice ? customPrice : itemPrice;
      const date = pad(d.getDate()) + '-' + pad(1 + d.getMonth()) + '-' + d.getFullYear();

      PlanfixFix._addRealization({
        name: name,
        group: 'Реализация',
        price: price,
        date: date,
      });
    });
  };

  const pad = function (num) {
    const A = num.toString();
    if (A.length > 1) return A;
    else return ('00' + A).slice(-2);
  };

  $(function () {
    PlanfixFix.init();
  });
})();
