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
    'templating.taglibs.core.WriteNode',
    'templating.compiler.Node',
    function() {
        "use strict";
        
        var WriteNode = function(props) {
            WriteNode.superclass.constructor.call(this, 'write');
            
            if (props) {
                this.setProperties(props);
            }
        };
        
        WriteNode.prototype = {   
                
            doGenerateCode: function(template) {
                var expression = this.getExpression(),
                    escapeXml;
                
                if (this.hasProperty('escapeXml')) {
                    escapeXml = this.getProperty("escapeXml") !== false
                }
                else {
                    escapeXml = this.getProperty("escape-xml") !== false
                }
                
                if (expression) {
                    template.write(expression, {escapeXml: escapeXml});
                }
            },
            
            getExpression: function() {
                return this.getProperty("expression") || this.getProperty("value") || this.getAttribute("expression") || this.getAttribute("value");
            },
            
            toString: function() {
                return '<c:write expression="' + this.getExpression() + '">';
            }
        };
        
        return WriteNode;
    });