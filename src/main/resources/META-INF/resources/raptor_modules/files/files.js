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
     * @namespace
     * @raptor
     * @name files
     */
    raptor.files = /** @lends files */ {
        /**
         * 
         * @param path
         */
        exists: function(path) {
            throw new Error('Not Implemented');
        },
        
        /**
         * 
         */
        joinPaths: function() {
            throw new Error('Not Implemented');
        },
        
        /**
         * 
         * @param path
         * @param encoding
         */
        readFully: function(path, encoding) {
            throw new Error('Not Implemented');
        },
        
        /**
         * 
         * @param path
         * @returns
         */
        isDirectory: function(path) {
            throw new Error('Not Implemented');
        },
        
        /**
         * 
         * @param path
         * @returns
         */
        isFile: function(path) {
            throw new Error('Not Implemented');
        },
        
        remove: function(path) {
            var file = new raptor.files.File(path);
            file.remove();
        },
        
        resolveRelativeFile: function(dir, relPath) {
            var paths = raptor.require('paths');
            var absPath = paths.resolve(dir, relPath);
            return new raptor.files.File(absPath);
        }
    };
});