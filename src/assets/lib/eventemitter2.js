!function(u){var p=Object.hasOwnProperty,v=Array.isArray?Array.isArray:function(e){return"[object Array]"===Object.prototype.toString.call(e)},f="object"==typeof process&&"function"==typeof process.nextTick,c="function"==typeof Symbol,e="object"==typeof Reflect,h="function"==typeof setImmediate?setImmediate:setTimeout,L=c?e&&"function"==typeof Reflect.ownKeys?Reflect.ownKeys:function(e){var t=Object.getOwnPropertyNames(e);return t.push.apply(t,Object.getOwnPropertySymbols(e)),t}:Object.keys;function y(){this._events={},this._conf&&t.call(this,this._conf)}function t(e){e&&((this._conf=e).delimiter&&(this.delimiter=e.delimiter),e.maxListeners!==u&&(this._maxListeners=e.maxListeners),e.wildcard&&(this.wildcard=e.wildcard),e.newListener&&(this._newListener=e.newListener),e.removeListener&&(this._removeListener=e.removeListener),e.verboseMemoryLeak&&(this.verboseMemoryLeak=e.verboseMemoryLeak),e.ignoreErrors&&(this.ignoreErrors=e.ignoreErrors),this.wildcard&&(this.listenerTree={}))}function _(e,t){var r,n="(node) warning: possible EventEmitter memory leak detected. "+e+" listeners added. Use emitter.setMaxListeners() to increase limit.";this.verboseMemoryLeak&&(n+=" Event name: "+t+"."),"undefined"!=typeof process&&process.emitWarning?((r=new Error(n)).name="MaxListenersExceededWarning",r.emitter=this,r.count=e,process.emitWarning(r)):(console.error(n),console.trace&&console.trace())}function m(e,t,r){var n=arguments.length;switch(n){case 0:return[];case 1:return[e];case 2:return[e,t];case 3:return[e,t,r];default:for(var i=new Array(n);n--;)i[n]=arguments[n];return i}}function r(e,t){for(var r={},n=e.length,i=t?value.length:0,s=0;s<n;s++)r[e[s]]=s<i?t[s]:u;return r}function d(e,t,r){var n,i;if(this._emitter=e,this._target=t,this._listeners={},this._listenersCount=0,(r.on||r.off)&&(n=r.on,i=r.off),t.addEventListener?(n=t.addEventListener,i=t.removeEventListener):t.addListener?(n=t.addListener,i=t.removeListener):t.on&&(n=t.on,i=t.off),!n&&!i)throw Error("target does not implement any known event API");if("function"!=typeof n)throw TypeError("on method must be a function");if("function"!=typeof i)throw TypeError("off method must be a function");this._on=n,this._off=i;var s=e._observers;s?s.push(this):e._observers=[this]}function b(e,t,r,n){var i=Object.assign({},t);if(!e)return i;if("object"!=typeof e)throw TypeError("options must be an object");var s,o,l,a=Object.keys(e),f=a.length;function h(e){throw Error('Invalid "'+s+'" option value'+(e?". Reason: "+e:""))}for(var c=0;c<f;c++){if(s=a[c],!n&&!p.call(t,s))throw Error('Unknown "'+s+'" option');(o=e[s])!==u&&(l=r[s],i[s]=l?l(o,h):o)}return i}function n(e,t){return"function"==typeof e&&e.hasOwnProperty("prototype")||t("value must be a constructor"),e}function i(i){var s="value must be type of "+i.join("|"),o=i.length,n=i[0],l=i[1];return 1===o?function(e,t){if(typeof e===n)return e;t(s)}:2===o?function(e,t){var r=typeof e;if(r===n||r===l)return e;t(s)}:function(e,t){for(var r=typeof e,n=o;0<n--;)if(r===i[n])return e;t(s)}}Object.assign(d.prototype,{subscribe:function(r,n,i){function t(){var e=m.apply(null,arguments),t={data:e,name:n,original:r};i?!1!==i.call(o,t)&&l.emit.apply(l,[t.name].concat(e)):l.emit.apply(l,[n].concat(e))}var s=this,o=this._target,l=this._emitter,a=this._listeners;if(a[r])throw Error("Event '"+r+"' is already listening");this._listenersCount++,l._newListener&&l._removeListener&&!s._onNewListener?(this._onNewListener=function(e){e===n&&null===a[r]&&(a[r]=t,s._on.call(o,r,t))},l.on("newListener",this._onNewListener),this._onRemoveListener=function(e){e===n&&!l.hasListeners(e)&&a[r]&&(a[r]=null,s._off.call(o,r,t))},a[r]=null,l.on("removeListener",this._onRemoveListener)):(a[r]=t,s._on.call(o,r,t))},unsubscribe:function(e){var t,r,n,i=this,s=this._listeners,o=this._emitter,l=this._off,a=this._target;if(e&&"string"!=typeof e)throw TypeError("event must be a string");function f(){i._onNewListener&&(o.off("newListener",i._onNewListener),o.off("removeListener",i._onRemoveListener),i._onNewListener=null,i._onRemoveListener=null);var e=g.call(o,i);o._observers.splice(e,1)}if(e){if(!(t=s[e]))return;l.call(a,e,t),delete s[e],--this._listenersCount||f()}else{for(n=(r=L(s)).length;0<n--;)e=r[n],l.call(a,e,s[e]);this._listeners={},this._listenersCount=0,f()}}});var a=i(["function"]),s=i(["object","function"]);function w(o,l,a){var f,h,c,u=0,p=new o(function(t,r,e){function n(){h=h&&null,u&&(clearTimeout(u),u=0)}a=b(a,{timeout:0,overload:!1},{timeout:function(e,t){return("number"!=typeof(e*=1)||e<0||!Number.isFinite(e))&&t("timeout must be a positive number"),e}}),f=!a.overload&&"function"==typeof o.prototype.cancel&&"function"==typeof e;function i(e){n(),t(e)}function s(e){n(),r(e)}f?l(i,s,e):(h=[function(e){s(e||Error("canceled"))}],l(i,s,function(e){if(c)throw Error("Unable to subscribe on cancel event asynchronously");if("function"!=typeof e)throw TypeError("onCancel callback must be a function");h.push(e)}),c=!0),0<a.timeout&&(u=setTimeout(function(){var e=Error("timeout");u=0,p.cancel(e),r(e)},a.timeout))});return f||(p.cancel=function(e){if(h){for(var t=h.length,r=1;r<t;r++)h[r](e);h[0](e),h=null}}),p}function g(e){var t=this._observers;if(!t)return-1;for(var r=t.length,n=0;n<r;n++)if(t[n]._target===e)return n;return-1}function E(e,t,r,n,i){if(!r)return null;if(0===n){var s=typeof t;if("string"==s){var o,l,a=0,f=0,h=this.delimiter,c=h.length;if(-1!==(l=t.indexOf(h))){for(o=new Array(5);o[a++]=t.slice(f,l),f=l+c,-1!==(l=t.indexOf(h,f)););o[a++]=t.slice(f),t=o,i=a}else t=[t],i=1}else i="object"==s?t.length:(t=[t],1)}var u,p,v,y,_,m,d,b=null,w=t[n],g=t[n+1];if(n===i&&r._listeners)return"function"==typeof r._listeners?e&&e.push(r._listeners):e&&e.push.apply(e,r._listeners),[r];if("*"===w){for(l=(m=L(r)).length;0<l--;)"_listeners"!==(u=m[l])&&(d=E(e,t,r[u],n+1,i))&&(b?b.push.apply(b,d):b=d);return b}if("**"===w){for((_=n+1===i||n+2===i&&"*"===g)&&r._listeners&&(b=E(e,t,r,i,i)),l=(m=L(r)).length;0<l--;)"_listeners"!==(u=m[l])&&(d="*"===u||"**"===u?(r[u]._listeners&&!_&&(d=E(e,t,r[u],i,i))&&(b?b.push.apply(b,d):b=d),E(e,t,r[u],n,i)):E(e,t,r[u],u===g?n+2:n,i))&&(b?b.push.apply(b,d):b=d);return b}if(r[w]&&(b=E(e,t,r[w],n+1,i)),(p=r["*"])&&E(e,t,p,n+1,i),v=r["**"])if(n<i)for(v._listeners&&E(e,t,v,i,i),l=(m=L(v)).length;0<l--;)"_listeners"!==(u=m[l])&&(u===g?E(e,t,v[u],n+2,i):u===w?E(e,t,v[u],n+1,i):((y={})[u]=v[u],E(e,t,{"**":y},n+1,i)));else v._listeners?E(e,t,v,i,i):v["*"]&&v["*"]._listeners&&E(e,t,v["*"],i,i);return b}function k(e,t,r,n){for(var i,s,o,l,a=L(e),f=a.length,h=e._listeners;0<f--;)i=e[s=a[f]],o="_listeners"===s?r:r?r.concat(s):[s],l=n||"symbol"==typeof s,h&&t.push(l?o:o.join(this.delimiter)),"object"==typeof i&&k.call(this,i,t,o,l);return t}function j(e){for(var t,r,n,i=L(e),s=i.length;0<s--;)(t=e[r=i[s]])&&(n=!0,"_listeners"===r||j(t)||delete e[r]);return n}function T(e,t,r){this.emitter=e,this.event=t,this.listener=r}function o(e){this._events={},this._newListener=!1,this._removeListener=!1,this.verboseMemoryLeak=!1,t.call(this,e)}T.prototype.off=function(){return this.emitter.off(this.event,this.listener),this},(o.EventEmitter2=o).prototype.listenTo=function(f,e,h){if("object"!=typeof f)throw TypeError("target musts be an object");var c=this;function t(e){if("object"!=typeof e)throw TypeError("events must be an object");for(var t,r=h.reducers,n=g.call(c,f),i=-1===n?new d(c,f,h):c._observers[n],s=L(e),o=s.length,l="function"==typeof r,a=0;a<o;a++)t=s[a],i.subscribe(t,e[t]||t,l?r:r&&r[t])}return h=b(h,{on:u,off:u,reducers:u},{on:a,off:a,reducers:s}),v(e)?t(r(e)):t("string"==typeof e?r(e.split(/\s+/)):e),this},o.prototype.stopListeningTo=function(e,t){var r=this._observers;if(!r)return!1;var n,i=r.length,s=!1;if(e&&"object"!=typeof e)throw TypeError("target should be an object");for(;0<i--;)n=r[i],e&&n._target!==e||(n.unsubscribe(t),s=!0);return s},o.prototype.delimiter=".",o.prototype.setMaxListeners=function(e){e!==u&&(this._maxListeners=e,this._conf||(this._conf={}),this._conf.maxListeners=e)},o.prototype.getMaxListeners=function(){return this._maxListeners},o.prototype.event="",o.prototype.once=function(e,t,r){return this._once(e,t,!1,r)},o.prototype.prependOnceListener=function(e,t,r){return this._once(e,t,!0,r)},o.prototype._once=function(e,t,r,n){return this._many(e,1,t,r,n)},o.prototype.many=function(e,t,r,n){return this._many(e,t,r,!1,n)},o.prototype.prependMany=function(e,t,r,n){return this._many(e,t,r,!0,n)},o.prototype._many=function(e,t,r,n,i){var s=this;if("function"!=typeof r)throw new Error("many only accepts instances of Function");function o(){return 0==--t&&s.off(e,o),r.apply(this,arguments)}return o._origin=r,this._on(e,o,n,i)},o.prototype.emit=function(){if(!this._events&&!this._all)return!1;this._events||y.call(this);var e,t,r,n,i,s,o=arguments[0],l=this.wildcard;if("newListener"===o&&!this._newListener&&!this._events.newListener)return!1;if(l&&"newListener"!==(e=o)&&"removeListener"!==o&&"object"==typeof o){if(r=o.length,c)for(n=0;n<r;n++)if("symbol"==typeof o[n]){s=!0;break}s||(o=o.join(this.delimiter))}var a,f=arguments.length;if(this._all&&this._all.length)for(n=0,r=(a=this._all.slice()).length;n<r;n++)switch(this.event=o,f){case 1:a[n].call(this,o);break;case 2:a[n].call(this,o,arguments[1]);break;case 3:a[n].call(this,o,arguments[1],arguments[2]);break;default:a[n].apply(this,arguments)}if(l)E.call(this,a=[],e,this.listenerTree,0,r);else{if("function"==typeof(a=this._events[o])){switch(this.event=o,f){case 1:a.call(this);break;case 2:a.call(this,arguments[1]);break;case 3:a.call(this,arguments[1],arguments[2]);break;default:for(t=new Array(f-1),i=1;i<f;i++)t[i-1]=arguments[i];a.apply(this,t)}return!0}a=a&&a.slice()}if(a&&a.length){if(3<f)for(t=new Array(f-1),i=1;i<f;i++)t[i-1]=arguments[i];for(n=0,r=a.length;n<r;n++)switch(this.event=o,f){case 1:a[n].call(this);break;case 2:a[n].call(this,arguments[1]);break;case 3:a[n].call(this,arguments[1],arguments[2]);break;default:a[n].apply(this,t)}return!0}if(!this.ignoreErrors&&!this._all&&"error"===o)throw arguments[1]instanceof Error?arguments[1]:new Error("Uncaught, unspecified 'error' event.");return!!this._all},o.prototype.emitAsync=function(){if(!this._events&&!this._all)return!1;this._events||y.call(this);var e,t,r,n,i,s,o=arguments[0],l=this.wildcard;if("newListener"===o&&!this._newListener&&!this._events.newListener)return Promise.resolve([!1]);if(l&&"newListener"!==(e=o)&&"removeListener"!==o&&"object"==typeof o){if(n=o.length,c)for(i=0;i<n;i++)if("symbol"==typeof o[i]){t=!0;break}t||(o=o.join(this.delimiter))}var a,f=[],h=arguments.length;if(this._all)for(i=0,n=this._all.length;i<n;i++)switch(this.event=o,h){case 1:f.push(this._all[i].call(this,o));break;case 2:f.push(this._all[i].call(this,o,arguments[1]));break;case 3:f.push(this._all[i].call(this,o,arguments[1],arguments[2]));break;default:f.push(this._all[i].apply(this,arguments))}if(l?E.call(this,a=[],e,this.listenerTree,0):a=this._events[o],"function"==typeof a)switch(this.event=o,h){case 1:f.push(a.call(this));break;case 2:f.push(a.call(this,arguments[1]));break;case 3:f.push(a.call(this,arguments[1],arguments[2]));break;default:for(r=new Array(h-1),s=1;s<h;s++)r[s-1]=arguments[s];f.push(a.apply(this,r))}else if(a&&a.length){if(a=a.slice(),3<h)for(r=new Array(h-1),s=1;s<h;s++)r[s-1]=arguments[s];for(i=0,n=a.length;i<n;i++)switch(this.event=o,h){case 1:f.push(a[i].call(this));break;case 2:f.push(a[i].call(this,arguments[1]));break;case 3:f.push(a[i].call(this,arguments[1],arguments[2]));break;default:f.push(a[i].apply(this,r))}}else if(!this.ignoreErrors&&!this._all&&"error"===o)return arguments[1]instanceof Error?Promise.reject(arguments[1]):Promise.reject("Uncaught, unspecified 'error' event.");return Promise.all(f)},o.prototype.on=function(e,t,r){return this._on(e,t,!1,r)},o.prototype.prependListener=function(e,t,r){return this._on(e,t,!0,r)},o.prototype.onAny=function(e){return this._onAny(e,!1)},o.prototype.prependAny=function(e){return this._onAny(e,!0)},o.prototype.addListener=o.prototype.on,o.prototype._onAny=function(e,t){if("function"!=typeof e)throw new Error("onAny only accepts instances of Function");return this._all||(this._all=[]),t?this._all.unshift(e):this._all.push(e),this},o.prototype._on=function(e,t,r,n){if("function"==typeof e)return this._onAny(e,t),this;if("function"!=typeof t)throw new Error("on only accepts instances of Function");this._events||y.call(this);var i,s=this;return n!==u&&(t=(i=function(e,t,r){if(!0===r)i=!0;else if(!1===r)n=!0;else{if(!r||"object"!=typeof r)throw TypeError("options should be an object or true");var n=r.async,i=r.promisify,s=r.nextTick,o=r.objectify}if(n||s||i){var l=t,a=t._origin||t;if(s&&!f)throw Error("process.nextTick is not supported");i===u&&(i="AsyncFunction"===t.constructor.name),(t=function(){var e=arguments,t=this,r=this.event;return i?s?Promise.resolve():new Promise(function(e){h(e)}).then(function(){return t.event=r,l.apply(t,e)}):(s?process.nextTick:h)(function(){t.event=r,l.apply(t,e)})})._async=!0,t._origin=a}return[t,o?new T(this,e,t):this]}.call(this,e,t,n))[0],s=i[1]),this._newListener&&this.emit("newListener",e,t),this.wildcard?function(e,t){var r,n=0,i=0,s=this.delimiter,o=s.length;if("string"==typeof e)if(-1!==(f=e.indexOf(s))){for(r=new Array(5);r[n++]=e.slice(i,f),i=f+o,-1!==(f=e.indexOf(s,i)););r[n++]=e.slice(i)}else r=[e],n=1;else n=(r=e).length;if(1<n)for(f=0;f+1<n;f++)if("**"===r[f]&&"**"===r[f+1])return;for(var l,a=this.listenerTree,f=0;f<n;f++)if(a=a[l=r[f]]||(a[l]={}),f===n-1)return a._listeners?("function"==typeof a._listeners&&(a._listeners=[a._listeners]),a._listeners.push(t),!a._listeners.warned&&0<this._maxListeners&&a._listeners.length>this._maxListeners&&(a._listeners.warned=!0,_.call(this,a._listeners.length,l))):a._listeners=t,!0;return!0}.call(this,e,t):this._events[e]?("function"==typeof this._events[e]&&(this._events[e]=[this._events[e]]),r?this._events[e].unshift(t):this._events[e].push(t),!this._events[e].warned&&0<this._maxListeners&&this._events[e].length>this._maxListeners&&(this._events[e].warned=!0,_.call(this,this._events[e].length,e))):this._events[e]=t,s},o.prototype.off=function(e,t){if("function"!=typeof t)throw new Error("removeListener only takes instances of Function");var r=[];if(this.wildcard){var n="string"==typeof e?e.split(this.delimiter):e.slice();if(!(r=E.call(this,null,n,this.listenerTree,0)))return this}else{if(!this._events[e])return this;o=this._events[e],r.push({_listeners:o})}for(var i=0;i<r.length;i++){var s=r[i],o=s._listeners;if(v(o)){for(var l=-1,a=0,f=o.length;a<f;a++)if(o[a]===t||o[a].listener&&o[a].listener===t||o[a]._origin&&o[a]._origin===t){l=a;break}if(l<0)continue;return this.wildcard?s._listeners.splice(l,1):this._events[e].splice(l,1),0===o.length&&(this.wildcard?delete s._listeners:delete this._events[e]),this._removeListener&&this.emit("removeListener",e,t),this}(o===t||o.listener&&o.listener===t||o._origin&&o._origin===t)&&(this.wildcard?delete s._listeners:delete this._events[e],this._removeListener&&this.emit("removeListener",e,t))}return this.listenerTree&&j(this.listenerTree),this},o.prototype.offAny=function(e){var t,r=0,n=0;if(e&&this._all&&0<this._all.length){for(r=0,n=(t=this._all).length;r<n;r++)if(e===t[r])return t.splice(r,1),this._removeListener&&this.emit("removeListenerAny",e),this}else{if(t=this._all,this._removeListener)for(r=0,n=t.length;r<n;r++)this.emit("removeListenerAny",t[r]);this._all=[]}return this},o.prototype.removeListener=o.prototype.off,o.prototype.removeAllListeners=function(e){if(e===u)return this._events&&y.call(this),this;if(this.wildcard){var t,r=E.call(this,null,e,this.listenerTree,0);if(!r)return this;for(t=0;t<r.length;t++)r[t]._listeners=null;this.listenerTree&&j(this.listenerTree)}else this._events&&(this._events[e]=null);return this},o.prototype.listeners=function(e){var t,r,n,i,s,o=this._events;if(e===u){if(this.wildcard)throw Error("event name required for wildcard emitter");if(!o)return[];for(i=(t=L(o)).length,n=[];0<i--;)"function"==typeof(r=o[t[i]])?n.push(r):n.push.apply(n,r);return n}if(this.wildcard){if(!(s=this.listenerTree))return[];var l=[],a="string"==typeof e?e.split(this.delimiter):e.slice();return E.call(this,l,a,s,0),l}return o&&(r=o[e])?"function"==typeof r?[r]:r:[]},o.prototype.eventNames=function(e){var t=this._events;return this.wildcard?k.call(this,this.listenerTree,[],null,e):t?L(t):[]},o.prototype.listenerCount=function(e){return this.listeners(e).length},o.prototype.hasListeners=function(e){if(this.wildcard){var t=[],r="string"==typeof e?e.split(this.delimiter):e.slice();return E.call(this,t,r,this.listenerTree,0),0<t.length}var n=this._events,i=this._all;return!!(i&&i.length||n&&(e===u?L(n).length:n[e]))},o.prototype.listenersAny=function(){return this._all?this._all:[]},o.prototype.waitFor=function(s,o){var l=this,e=typeof o;return"number"==e?o={timeout:o}:"function"==e&&(o={filter:o}),w((o=b(o,{timeout:0,filter:u,handleError:!1,Promise:Promise,overload:!1},{filter:a,Promise:n})).Promise,function(r,n,e){function i(){var e,t=o.filter;t&&!t.apply(l,arguments)||(l.off(s,i),o.handleError?(e=arguments[0])?n(e):r(m.apply(null,arguments).slice(1)):r(m.apply(null,arguments)))}e(function(){l.off(s,i)}),l._on(s,i,!1)},{timeout:o.timeout,overload:o.overload})};var l=o.prototype;Object.defineProperties(o,{defaultMaxListeners:{get:function(){return l._maxListeners},set:function(e){if("number"!=typeof e||e<0||Number.isNaN(e))throw TypeError("n must be a non-negative number");l._maxListeners=e},enumerable:!0},once:{value:function(o,l,e){return w((e=b(e,{Promise:Promise,timeout:0,overload:!1},{Promise:n})).Promise,function(e,t,r){var n;if("function"==typeof o.addEventListener)return n=function(){e(m.apply(null,arguments))},r(function(){o.removeEventListener(l,n)}),void o.addEventListener(l,n,{once:!0});function i(){s&&o.removeListener("error",s),e(m.apply(null,arguments))}var s;"error"!==l&&(s=function(e){o.removeListener(l,i),t(e)},o.once("error",s)),r(function(){s&&o.removeListener("error",s),o.removeListener(l,i)}),o.once(l,i)},{timeout:e.timeout,overload:e.overload})},writable:!0,configurable:!0}}),Object.defineProperties(l,{_maxListeners:{value:10,writable:!0,configurable:!0},_observers:{value:null,writable:!0,configurable:!0}}),"function"==typeof define&&define.amd?define(function(){return o}):"object"==typeof exports?module.exports=o:new Function("","return this")().EventEmitter2=o}();
