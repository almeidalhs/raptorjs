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

$rload(function(raptor) {
    "use strict";
    
    /**
     * @parent packager_Server
     */
    
    var forEach = raptor.forEach,
        forEachEntry = raptor.forEachEntry,
        regexp = raptor.regexp;
    
    /**
     * 
     */
    var ExtensionCollection = function(extensions) {
        this.extensionsLookup = {};
        this.extensionsArray = [];
        this.key = null;
        
        this.addAll(extensions);
    };
    
    ExtensionCollection.prototype = {
        isEmpty: function() {
            return this.extensionsArray.length === 0;
        },
        
        /**
         * 
         * @param ext
         */
        add: function(ext) {
            if (typeof ext !== 'string') {
                this.addAll(ext);
                return;
            }
            
            this.extensionsLookup[ext] = true;
            this.extensionsArray.push(ext);
            this.key = null;
        },
        
        remove: function(ext) {
            if (this.extensionsLookup[ext]) {
                delete this.extensionsLookup[ext];
                this.extensionsArray = Object.keys(this.extensionsLookup);
            }
        },
        
        addAll: function(extensions) {
            if (!extensions) {
                return;
            }
            
            if (extensions instanceof ExtensionCollection) {
                extensions = extensions.extensionsArray;
            } 

            if (raptor.isArray(extensions)) {
                forEach(extensions, function(ext) {
                    this.add(ext);
                }, this);
            }
            else if (typeof extensions === 'object') {
                forEachEntry(extensions, function(ext) {
                    this.add(ext);
                }, this);
            }
            
        },
        
        getKey: function() {
            
            if (this.key == null) {
                this.extensionsArray.sort();
                this.key = this.extensionsArray.join("|");
            }
            
            return this.key;
        },
        
        /**
         * 
         * @param ext
         * @returns {Boolean}
         */
        contains: function(ext) {
            return this.extensionsLookup[ext] === true;
        },
        
        /**
         * 
         * @param ext
         * @returns {Boolean}
         */
        containsMatch: function(ext) {
            var regExp;
            
            if (ext instanceof RegExp) {
                regExp = ext;
            }
            else if (ext === "*") {
                return this.extensionsArray.length !== 0;
            }
            else {
                regExp = regexp.simple(ext);
            }
            
            var extensions = this.extensionsArray;
            for (var i=0, len=extensions.length; i<len; i++) {
                if (regExp.test(extensions[i])) {
                    return true;
                }
            }
            
            return false;
        }
    };
    
    raptor.ExtensionCollection = ExtensionCollection;
});
