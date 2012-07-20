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
    'templating.taglibs.core.WithNode',
    'templating.compiler.Node',
    function(raptor) {
        "use strict";
        
        var errors = raptor.errors,
            AttributeSplitter = raptor.require('templating.compiler.AttributeSplitter'),
            varNameRegExp = /^[A-Za-z_][A-Za-z0-9_]*$/;
        
        var WithNode = function(props) {
            WithNode.superclass.constructor.call(this);
            if (props) {
                this.setProperties(props);
            }
        };
        
        WithNode.prototype = {
            
            doGenerateCode: function(template) {
                var vars = this.getProperty("vars"),
                    _this = this;
                
                if (!vars) {
                    this.addError('"vars" attribute is required');
                }
                
                var withVars = AttributeSplitter.parse(
                        vars, 
                        {
                            "*": {
                                type: "expression"
                            }
                        },
                        {
                            ordered: true,
                            errorHandler: function(message) {
                                _this.addError('Invalid variable declarations of "' + vars + '". Error: ' + message);
                            }
                        });
                
                var varDefs = [];
                
                raptor.forEach(withVars, function(withVar) {
                    if (!varNameRegExp.test(withVar.name)) {
                        this.addError('Invalid variable name of "' + withVar.name + '" in "' + vars + '"');
                    }
                    varDefs.push(withVar.name + (withVar.value ? ("=" + withVar.value) : ""));
                }, this);
                
                
                template.addJavaScriptCode('(function() {');
                template.addJavaScriptCode('var ' + varDefs.join(",") + ";");
                this.generateCodeForChildren(template);
                template.addJavaScriptCode('}());');
            }
            
        };
        
        return WithNode;
    });