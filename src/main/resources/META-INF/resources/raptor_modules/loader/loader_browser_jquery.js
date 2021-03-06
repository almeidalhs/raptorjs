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

/**
 * @extension jQuery
 */
raptor.extend('loader', function(raptor) {
    "use strict";
    var extend = raptor.extend;
    
    return {
        /**
         * 
         * @param src
         * @param callback
         * @returns
         * 
         * @protected
         */
        includeJSImpl: function(src, callback) {
            var _this = this;
            
            $.ajax({
                url: src,
                dataType: "script",
                crossDomain: true,
                cache: true,
                success: function(result) {
                    _this.logger().debug('Downloaded: "' + src + '"');
                    
                    //Let the loader module know that the resource has included successfully
                    callback.success();
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    _this.logger().error('Failed: "' + src + '": ' + errorThrown);
                    //Let the loader module know that the resource was failed to be included
                    callback.error();
                }
            });
        },
        
        /**
         * 
         * @param href
         * @param callback
         * @param attributes
         * @returns
         * 
         * @protected
         */
        includeCSSImpl: function(href, callback, attributes) {

            var retries = 20;
            
            var complete = false,
                _this = this;
            
            var el = document.createElement('link');
            
            var cleanup = function() {
                el.onload = null;
                el.onreadystatechange = null;
                el.onerror = null;
            };
            
            var isLoaded  = function() {
                var sheets = document.styleSheets;
                for (var idx = 0, len = sheets.length; idx < len; idx++) {
                    if (sheets[idx].href === href) {
                        return true;
                    }
                }
                return false;
            };

            var success = function() {
                if (complete === false) {                    
                    complete = true;
                    cleanup();
                    _this.logger().debug('Downloaded: "' + href + '"');
                    //Let the loader module know that the resource has included successfully
                    callback.success();
                }
            };
            
            var pollSuccess = function() {
                if (complete === false) {
                    if (!isLoaded() && (retries--)) {
                        return window.setTimeout(pollSuccess,10);
                    }
                    success();
                }
            };
            
            var error = function() {
                this.logger().error('Failed: "' + href + '"');
                if (complete === false)
                {                    
                    complete = true; 
                    cleanup();
                    //Let the loader module know that the resource was failed to be included
                    callback.error();
                }
            };
            
            extend(el, {
                type: 'text/css',
                rel: "stylesheet",
                href: href
            });
            
            if (attributes == null) {
                extend(el, attributes);
            }
            
            if (navigator.appName == 'Microsoft Internet Explorer') {
                el.onload = success;                
                el.onreadystatechange = function() {
                    var readyState = this.readyState;
                    if ("loaded" === readyState || "complete" === readyState) {
                        success();
                    }
                };
            }
            else
            {
                //For non-IE browsers we don't get the "onload" and "onreadystatechange" events...
                pollSuccess();
            }
            
            el.onerror = error;      

            $(function() {
                $("head").append(el);
            });
        }
    };
});