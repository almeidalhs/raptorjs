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
    
    var packager = raptor.packager,
        runtime = raptor.runtime,
        loaded = {};
    
    var PackageLoader = function() {
        this._loaded = {};
    };
    
    PackageLoader.prototype = {
        /**
         * 
         * @param resourcePath {String|packager-PackageManifest}
         */
        load: function(resourcePath, options) {
            var manifest = resourcePath._isPackageManifest ? 
                    resourcePath :
                    packager.getPackageManifest(resourcePath),
                path = manifest.getPackageResource().getSystemPath(),
                enabledExtensions = options.enabledExtensions;
            
            
            if (loaded[path] === true) {
                return;
            }
            
            loaded[path] = true;
            
            manifest.forEachInclude({
                callback: function(type, include) {
                    if (include.isPackageInclude()) {
                        include.load(this);
                    }
                    else {
                        var contentType = include.getContentType();
                        if (contentType === 'application/javascript') {
                            include.load(this);
                        }    
                    }
                    
                },
                enabledExtensions: enabledExtensions,
                thisObj: this
            });
        },
        
        setLoaded: function(path) {
            this._loaded[path] = true;
        },
        
        isLoaded: function(path) {
            return this._loaded[path] === true;
        }
    };
    
    packager.PackageLoader = PackageLoader;
    
    packager.PackageLoader.instance = new PackageLoader();
});

