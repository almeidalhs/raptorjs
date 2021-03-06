/*
 * Copyright 2011 eBay Software Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

(function() {
    /*jshint strict:false */
    
    var global = this,
        isClient = $renv === 'client',
        _Array = Array,
        lookup = {},
        loaders = [],
        slice = _Array.prototype.slice,
        isArray = _Array.isArray,
        extend = function(dest, source) {
            if (dest == null) dest = {};
            if (source != null)
            {  
                for (var k in source)
                {
                    if (source.hasOwnProperty(k))
                    {
                        dest[k] = source[k];
                    }
                }
            }
            return dest;
        },
        arrayFromArguments = function(args, startIndex) {
            if (!args) return [];
            
            if (isArray(args) && !startIndex) {
                return args;
            }
            
            if (startIndex != null)
            {
                if (startIndex < args.length)
                {
                    return slice.call(args, startIndex);
                }
                else
                {
                    return [];
                }
            }
            else
            {
                return slice.call(args);
            }
        },
        load = function(instance) {        
            var len = loaders.length;
            for (var i=0; i<len; i++)
            {
                var loaderFunc = loaders[i];
                loaderFunc(instance);
            }
            
            instance.newInstance = function(raptor) {        
                return load({});
            };
            
            return instance;
        };
    
    raptorBuilder = {
        createRaptor: function(config) {
            if (!config) config = {};
            
            /**
             * The core object for the RaptorJS runtime. A new "raptor" object can
             * be created using the global "raptorBuilder" object. For example:
             * <js>
             * window.raptor = raptorBuilder.createRaptor(config);
             * </js>
             * 
             * The "raptor" object consists of core modules (including env, logging and errors).
             * 
             * The "oop" modules extends the "raptor" object to support 
             * modules, classes, mixins and enums.
             * 
             * @namespace
             * @name raptor
             * @borrows oop.require as require
             * @borrows oop.find as find
             * @borrows oop.defineClass as defineClass
             * @borrows oop.defineEnum as defineEnum
             * @borrows oop.defineModule as defineModule
             * @borrows oop.defineModule as define
             * @borrows oop.defineMixin as defineMixin
             * @borrows oop.extend as extend
             * @borrows oop.inherit as inherit
             */
            var newRaptor = {
                    /**
                     * 
                     */
                    global: global,
                    
                    /**
                     * The global object for the environment.
                     * 
                     * This object normalizes the JavaScript global object across multiple environments. 
                     * In a browser, the global object will be the "window" object. In a NodeJS environment
                     * the global object will be the GLOBAL object.
                     * 
                     * @name global
                     * @property
                     * @memberOf raptor
                     * @type Object
                     * 
                     * @see env
                     * 
                     */
                    
                    /**
                     * 
                     * @returns
                     */
                    getConfig: function() {
                        return config;
                    },
                    
                    /**
                     * 
                     * @param moduleName
                     * @returns {Boolean}
                     */
                    getModuleConfig: function(moduleName) {
                        return this.getConfig()[moduleName] || {};
                    },
                    
                    /**
                     * 
                     * @param moduleName
                     * @param mixins
                     */
                    extendCore: function(moduleName, mixins) {
                        extend(this[moduleName], mixins);
                    },
                    
                    /**
                     * 
                     * @returns {String}
                     */
                    toString: function() {
                        return "[raptor]";
                    },
                    
                    /**
                     * @function
                     * @param dest
                     * @param source
                     */
                    extend: extend,
                    
                    /**
                     * Traverses all of the properties for an object and invokes
                     * the provided callback function for each property found.
                     * 
                     * The parameters passed to the callback function are the "key" and the "value".
                     * If the callback function returns "false" then iteration is stopped.
                     * 
                     * @param o {object} The object to operate on
                     * @param fun {function} The callback function
                     * @param thisp {object} The object to use as "this" for the callback function
                     * 
                     * @return {void}
                     * 
                     */
                    forEachEntry: function(o, fun, thisp) {
                        for (var k in o)
                        {
                            if (o.hasOwnProperty(k))
                            {
                                var v = o[k];
                                var result = fun.call(thisp, k, v);
                                if (result === false) return;
                            }
                        }
                    },
                    
                    /**
                     * Checks if the provided object is an array 
                     * @function
                     * @param object {object} The object to check
                     * @returns {boolean} Returns true if the object is an array (i.e. the constructor of the object is the Array type). False, otherwise
                     */
                    isArray: isArray,
                    
                    /**
                     * 
                     * @param s
                     * @returns {Boolean}
                     */
                    isString: function(s) {
                        return typeof s == 'string';
                    },
                    
                    /**
                     * 
                     * @param object
                     * @returns {Boolean}
                     */
                    isNumber : function(object) {
                        return (typeof(object) === 'number');
                    },
                    
                    /**
                     * 
                     * @param s
                     * @returns {Boolean}
                     */
                    isFunction: function(f) {
                        return typeof f == 'function';
                    },
                    
                    /**
                     * 
                     * @param o
                     * @returns {Boolean}
                     */
                    isObject: function(o) {
                        return typeof o == 'object';
                    },
                    
                    /**
                     * 
                     * @param object
                     * @returns {Boolean}
                     */
                    isBoolean : function(object) {
                        return (typeof(object) === 'boolean');
                    },
                    
                    /**
                     * 
                     * Iterates over the elements in an array and invokes a provided callback function with the current element for each iteration.
                     * 
                     * @param {array|object|null} a The array to iterate over
                     * @param {function} fun The callback function to use for each iteration of the array. The following parameters are passed to the callback function: 1) element 2) index 3) the array itself
                     * @param thisp The "this" object to use for the callback function
                     */
                    forEach: function(a, func, thisp) {
                        if (a != null) {
                            (isArray(a) === true ? a : [a]).forEach(func, thisp);    
                        }
                        
//                        if (Array.isArray(a) === false) {
//                            if (a == null) {
//                                return;
//                            }
//                            a = [a];
//                        }
//                        for (var i=0, len=a.length; i<len; i++) {
//                            func.call(thisp, a[i], i);
//                        }
                    },

                    /**
                     * @function
                     * @param arguments
                     */
                    arrayFromArguments: arrayFromArguments,
                    
                    /**
                     * 
                     * @param o
                     * @returns {Array}
                     */
                    keys: function(o)
                    {
                        return Object.keys(o);
                    },
                    
                    isServer: function() {
                        return !isClient;
                    },
                    
                    isClient: function() {
                        return isClient;
                    }
                    
                };
            
            load(newRaptor);
            return newRaptor;
        }
    };
    
    $rload = function(loaderFunc) {
        loaders.push(loaderFunc);
        
        if (global.raptor) {
            loaderFunc(raptor);
        }
    };
    
    $rcreate = function(config) {
        raptor = raptorBuilder.createRaptor(config);
    };
    
    $rset = function(category, key, data) {
        var catData = lookup[category];
        if (!catData) {
            catData = lookup[category] = {};
        }
        catData[key] = data;
    };
    
    $radd = function(category, data) {
        var catData = lookup[category];
        if (!catData) {
            catData = lookup[category] = [];
        }
        catData.push(data);
    };
    
    $rget = function(category, key) {
        var catData = lookup[category];
        return arguments.length === 2 ? catData && catData[key] : catData; 
    };

}());

