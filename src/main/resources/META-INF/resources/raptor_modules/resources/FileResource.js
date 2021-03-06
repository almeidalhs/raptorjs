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
    
    var forEach = raptor.forEach;
    
    /**
     * @protected
     */
    raptor.defineClass(
        'resources.FileResource', 
        {
            superclass: 'resources.Resource'
        },
        
        function() {
            var files = raptor.files;

            /**
             * @constructs
             */
            var FileResource = function(searchPathEntry, path, filePath) {
                FileResource.superclass.init.call(this, searchPathEntry, path);               
                if (!filePath) {
                    console.error('FileResource(', arguments);
                    throw raptor.createError(new Error("filePath is required (actual: " + filePath + ")"));
                }
                this.filePath = filePath;
            };
            
            FileResource.prototype = {
                exists: function() {
                    return this.getFile().exists();
                },
                
                /**
                 * 
                 * @returns {Boolean}
                 */
                isFileResource: function() {
                    return true;
                },
                    
                getFilePath: function() {
                    return this.filePath;
                },
                
                getSystemPath: function() {
                    return this.filePath;
                },
                
                readFully: function() {
                    return files.readFully(this.getFilePath());
                },
                
                isDirectory: function() {
                    return files.isDirectory(this.filePath);
                },
                
                isFile: function() {
                    return files.isFile(this.filePath);
                },
                
                forEachChild: function(callback, thisObj) {
                    var filenames = files.listFilenames(this.filePath);
                    
                    forEach(filenames, function(filename) {
                        var childResource = new FileResource(
                                this.getSearchPathEntry(),
                                this.getPath() == "/" ? '/' + filename : this.getPath() + '/' + filename, 
                                files.joinPaths(this.filePath, filename));
                        
                        callback.call(thisObj, childResource);
                        
                    }, this);
                },
                
                writeFully: function(str, encoding) {
                    files.writeFile(this.filePath, str, encoding);
                },
                
                getFile: function() {
                    var File = files.File;
                    return new File(this.getSystemPath());
                },
                
                getParent: function() {
                    return new FileResource(
                            this.getSearchPathEntry(),
                            this.getDirPath(), 
                            this.getFile().getParent());
                },
                
                resolve: function(relPath) {
                    var absolutePath = this.getFile().resolveFile(relPath).getAbsolutePath();
                    var resourcePath = raptor.require('resources').resolvePath(this.getFile().isDirectory() ? this.getPath() : this.getDirPath(), relPath); 
                    
                    return new FileResource(
                            this.getSearchPathEntry(),
                            resourcePath, 
                            absolutePath);
                }
            };
            return FileResource;
        });
});