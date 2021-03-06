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
    "templating.taglibs.core.TemplateNode",
    'templating.compiler.Node',
    function() {
        "use strict";

        var forEach = raptor.forEach;
        
        var TemplateNode = function(props) {
            TemplateNode.superclass.constructor.call(this);
            if (props) {
                this.setProperties(props);
            }
        };
        
        TemplateNode.prototype = {
        
            doGenerateCode: function(template) {
                var name = this.getProperty("name"),
                    params = this.getProperty("params"),
                    addClassNameVar = function(className) {
                        var classVarName = className.replace(/[^a-zA-Z0-9]+/g, '_');
                        if (!template.hasStaticVar(classVarName)) {
                            template.addStaticVar(classVarName, JSON.stringify(className));
                        }
                        return classVarName;
                    },
                    classVarName;
                
                if (params) {
                    params = params.split(/\s*,\s*/g);
                    
                    forEach(params, function(param) {
                        template.addVar(param, "data." + param);
                    }, this);
                }
                else {
                    params = null;
                }
                
                this.forEachProperty(function(uri, name, value) {
                    if (!uri) {
                        uri = this.uri;
                    }
                    
                    if (name === 'functions') {
                        forEach(value.split(/\s*[,;]\s*/g), function(funcName) {
                            var func = template.compiler.taglibs.getFunction(uri, funcName);
                            if (!func) {
                                this.addError('Function with name "' + funcName + '" not found in taglib "' + uri + '"');
                            }
                            else {
                                classVarName = addClassNameVar(func.functionClass);
                                
                                if (func.bindToContext === true) {
                                    template.addVar(funcName, "context.h(" + classVarName + "," + JSON.stringify(funcName) + ")");    
                                }
                                else {
                                    template.addStaticVar(funcName, template.getStaticHelperFunction("getHelper", "h")  + "(" + classVarName + "," + JSON.stringify(funcName) + ")");
                                }    
                            }
                        }, this);
                    }
                }, this);


                if (name) {
                    template.setTemplateName(name);
                }
                else if (!template.getTemplateName()) {
                    this.addError('The "name" attribute is required for the ' + this.toString() + ' tag or it must be passed in as a compiler option.');
                }
                
                
                
                this.generateCodeForChildren(template);
            }
        };
        
        return TemplateNode;
    });