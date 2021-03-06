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
    'templating.taglibs.core.InvokeNode',
    'templating.compiler.Node',
    function() {
        "use strict";
        
        var forEach = raptor.forEach;
        
        var InvokeNode = function(props) {
            InvokeNode.superclass.constructor.call(this);
            if (props) {
                this.setProperties(props);
            }
        };
        
        InvokeNode.prototype = {

            doGenerateCode: function(template) {
                
                var func = this.getProperty("function"),
                    funcDef,
                    definedFunctions = template.getAttribute("core:definedFunctions");
                
                if (!func) {
                    this.addError('"function" attribute is required');
                }
                
                if (func.indexOf('(') === -1) {
                    
                    funcDef = definedFunctions ? definedFunctions[func] : null;
//                    if (!funcDef) {
//                        this.addError('Function with name "' + func + '" not defined using <c:define>.');
//                    }
                    
                    var argParts = [];
                    var validParamsLookup = {};
                    var params = [];
                    
                    if (funcDef) {
                        params = funcDef.params || [];

                        /*
                         * Loop over the defined parameters to figure out the names of allowed parameters and add them to a lookup
                         */
                        forEach(params, function(param) {
                            validParamsLookup[param] = true;
                        }, this);
                        
                    }
                    

                    /*
                     * VALIDATION:
                     * Loop over all of the provided attributes and make sure they are allowed 
                     */
                    this.forEachPropertyNS('', function(name, value) {
                        if (name === 'function') {
                            return;
                        }
                        
                        if (!validParamsLookup[name]) {
                            this.addError('Parameter with name "' + name + '" not supported for function with name "' + func + '". Allowed parameters: ' + params.join(", "));
                        }
                    }, this);
                    
                    /*
                     * One more pass to build the argument list
                     */
                    forEach(params, function(param) {
                        validParamsLookup[param] = true;
                        var arg = this.getAttribute(param);
                        if (arg == null) {
                            argParts.push("undefined");
                        }
                        else {
                            argParts.push(this.getProperty(param));
                        }
                    }, this);
                    
                    template.write(func + "(" + argParts.join(",") + ")");
                }
                else {
                    var funcName = func.substring(0, func.indexOf('('));
                    funcDef = definedFunctions ? definedFunctions[funcName] : null;
                    if (funcDef) {
                        template.write(func);
                    }
                    else {
                        template.statement(func + ";\n");
                    }
                }
            }
            
        };
        
        return InvokeNode;
    });