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
    "packager.Include_dust",
    "packager.Include",
    function(raptor) {
        "use strict";
        
        return {
            getKey: function() {
                return "dust:" + this.resolvePathKey(this.path);
            },
            
            toString: function() {
                return this.getResource().getPath();
            },
            
            getCode: function(context) {
                return this.getResource(context).readFully();
            },
           
            getResourcePath: function() {
                return this.path;
            },
            
            getContentType: function() {
                return "application/javascript";
            },
            
            isInPlaceDeploymentAllowed: function() {
                return true;
            },
            
            load: function(context) {
                var resource = this.getResource(context);
                var path = resource.getPath(),dirs = path.split(/[\/\.]/);dirs.shift();dirs.pop();
                var compiled = dust.compile(resource.readFully(),dirs.join('.'));
                __rhinoHelpers.console.log(compiled);
                dust.loadSource(compiled);
            }
            
        };
    });
