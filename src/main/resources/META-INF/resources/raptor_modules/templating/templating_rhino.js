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
 * 
 * @extension Rhino
 * 
 */
raptor.extend('templating', function(raptor) {
    "use strict";
    
    var WrappedWriter = function(javaWriter) {
        this.javaWriter = javaWriter;
        this.write = function(o) {
            if (o != null) {
                this.javaWriter.write(o.toString());
            }
        };
    };
    
    
    
    return {
        /**
         * Provides a Rhino-compatible render function that bridges the gap between
         * the Java world and the JavaScript world.
         * 
         * @param templateName {java.lang.String} The name of template to render
         * @param data {String|java.lang.Object} The data object to pass to the template rendering function
         * @param javaWriter {java.io.Writer} The Java Writer object to use for output
         * @returns {void}
         */
        rhinoRender: function(templateName, data, javaWriter) {
            if (data && typeof data === 'string') {
                data = eval("(" + data + ")"); //Convert the JSON string to a native JavaScript object
            }
            
            var context = this.createContext(new WrappedWriter(javaWriter)); //Wrap the Java writer with a JavaScript object
            this.render('' + templateName, data);
        },
        
        /**
         * Provides a Rhino-compatible renderToString function that bridges the gap between
         * the Java world and the JavaScript world.
         * 
         * @param templateName {java.lang.String} The name of template to render
         * @param data {String|java.lang.Object} The data object to pass to the template rendering function
         * @returns {String} The resulting String
         */
        rhinoRenderToString: function(templateName, data) {
            if (data && typeof data === 'string') {
                data = eval("(" + data + ")");
            }
            return this.renderToString('' + templateName, data);
        }
    };
});