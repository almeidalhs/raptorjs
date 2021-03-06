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

raptor.defineClass(
    "packager.Include_loader-metadata",
    "packager.Include",
    function(raptor) {
        "use strict";
        
        return {
            
            getKey: function() {
                return "loader-metadata";
            },
            
            toString: function() {
                return "[loader-metadata]";
            },
            
            getCode: function(context) {
                var loaderMetadata = context && context.loaderMetadata;
                if (loaderMetadata) {
                    return "$rloaderMeta=" + JSON.stringify(loaderMetadata) + ";";
                }
            },
            
            getResourcePath: function() {
                return null;
            },
            
            getContentType: function() {
                return "application/javascript";
            }
        };
    });
