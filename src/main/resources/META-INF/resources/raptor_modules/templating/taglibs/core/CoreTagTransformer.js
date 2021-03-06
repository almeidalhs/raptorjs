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
    "templating.taglibs.core.CoreTagTransformer",
    function(raptor) {
        "use strict";
        
        var extend = raptor.extend,
            coreNS = "http://raptorjs.org/templates/core",
            WriteNode = raptor.require('templating.taglibs.core.WriteNode'),
            ForNode = raptor.require("templating.taglibs.core.ForNode"),
            IfNode = raptor.require("templating.taglibs.core.IfNode"),
            ElseIfNode = raptor.require("templating.taglibs.core.ElseIfNode"),
            ElseNode = raptor.require("templating.taglibs.core.ElseNode"),
            WhenNode = raptor.require("templating.taglibs.core.WhenNode"),
            OtherwiseNode = raptor.require("templating.taglibs.core.OtherwiseNode"),
            TagHandlerNode = raptor.require("templating.taglibs.core.TagHandlerNode"),
            Expression = raptor.require('templating.compiler.Expression'),
            AttributeSplitter = raptor.require('templating.compiler.AttributeSplitter'),
            TypeConverter = raptor.require('templating.compiler.TypeConverter'),
            getPropValue = function(value, type, allowExpressions) {
                return TypeConverter.convert(value, type, allowExpressions);
            };
        
        return {
            
            process: function(node, compiler, template) {
                //Find and handle nested <c:attrs> elements
                this.findNestedAttrs(node, compiler, template);
                
                var forEachAttr,
                    ifAttr,
                    elseIfAttr,
                    attrsAttr,
                    whenAttr,
                    parseBodyTextAttr,
                    stripAttr,
                    contentAttr,
                    replaceAttr,
                    uri,
                    tag,
                    nestedTag,
                    forEachProp = function(callback, thisObj) {
                        node.forEachAttributeAnyNS(function(attr) {

                            if (attr.uri=== 'http://www.w3.org/2000/xmlns/' || attr.uri === 'http://www.w3.org/XML/1998/namespace' || attr.prefix == 'xmlns') {
                                return; //Skip xmlns attributes
                            }
                            var prefix = attr.prefix;
                            
                            
                            
                            var attrUri = attr.prefix && (attr.uri != tag.getTaglibUri()) ? attr.uri : null;
                            
                            var attrDef = compiler.taglibs.getAttribute(uri, node.localName, attrUri, attr.localName);
                            
                            var type = attrDef ? (attrDef.type || 'string') : 'string',
                                value;
                                
                            if (attr.uri === tag.getTaglibUri()) {
                                prefix = '';
                            }
                            
                            var isTaglibUri = compiler.taglibs.isTaglib(attr.uri);
                            
                            if (!attrDef && (isTaglibUri || !tag.dynamicAttributes)) {
                                //Tag doesn't allow dynamic attributes
                                node.addError('The tag "' + tag.name + '" in taglib "' + tag.getTaglibUri() + '" does not support attribute "' + attr + '"');
                                return;
                            }
                            
                            if (attr.value instanceof Expression) {
                                value = attr.value;
                            }
                            else {
                                try
                                {
                                    value = getPropValue(attr.value, type, attrDef ? attrDef.allowExpressions !== false : true);
                                }
                                catch(e) {
                                    node.addError('Invalid attribute value of "' + attr.value + '" for attribute "' + attr.name + '": ' + e.message);
                                    value = attr.value;
                                }
                            }
                            
                            callback.call(thisObj, attrUri, attr.localName, value, prefix, attrDef);
                        }, this);
                    };
                    
                uri = node.uri;
                
                if (!uri && node.isRoot() && node.localName === 'template') {
                    uri = coreNS;
                }
                
                if (node.parentNode) {
                    var parentUri = node.parentNode.uri;
                    var parentName = node.parentNode.localName;
                    nestedTag = compiler.taglibs.getNestedTag(parentUri, parentName, uri, node.localName);
                    
                    if (nestedTag) {
                        node.setWordWrapEnabled(false);
                        node.parentNode.setProperty(nestedTag.targetProperty, node.getBodyContentExpression(template));
                        node.detach();
                        return;
                    }
                }
                
                tag = compiler.taglibs.getTag(uri, node.localName);
                
                if (node.getAttributeNS(coreNS, "space") === "preserve" || node.getAttributeNS(coreNS, "whitespace") === "preserve") {
                    node.setPreserveWhitespace(true);
                }
                node.removeAttributeNS(coreNS, "space");
                node.removeAttributeNS(coreNS, "whitespace");
                
                
                if ((parseBodyTextAttr = node.getAttributeNS(coreNS, "parse-body-text")) != null) {
                    node.removeAttributeNS(coreNS, "parse-body-text");
                    node.parseBodyText = parseBodyTextAttr !== "false";
                }
                if ((whenAttr = node.getAttributeNS(coreNS, "when")) != null) {
                    node.removeAttributeNS(coreNS, "when");

                    var whenNode = new WhenNode({test: new Expression(whenAttr), pos: node.getPosition()});
                    node.parentNode.replaceChild(whenNode, node);
                    whenNode.appendChild(node);
                }
                
                if (node.getAttributeNS(coreNS, "otherwise") != null) {
                    node.removeAttributeNS(coreNS, "otherwise");

                    var otherwiseNode = new OtherwiseNode({pos: node.getPosition()});
                    node.parentNode.replaceChild(otherwiseNode, node);
                    otherwiseNode.appendChild(node);
                }
                
                if ((attrsAttr = node.getAttributeNS(coreNS, "attrs")) != null) {
                    node.removeAttributeNS(coreNS, "attrs");
                    node.dynamicAttributesExpression = attrsAttr;
                }
                
                if ((forEachAttr = node.getAttributeNS(coreNS, "for")) != null) {
                    node.removeAttributeNS(coreNS, "for");
                    var forEachProps = AttributeSplitter.parse(
                            forEachAttr, 
                            {
                                each: {
                                    type: "custom"
                                },
                                separator: {
                                    type: "expression"
                                },
                                "status-var": {
                                    type: "identifier"
                                },
                                "for-loop": {
                                    type: "boolean",
                                    allowExpressions: false
                                }
                            },
                            {
                                defaultName: "each",
                                errorHandler: function(message) {
                                    node.addError('Invalid c:for attribute of "' + forEachAttr + '". Error: ' + message);
                                }
                            });
                    
                    forEachProps.pos = node.getPosition(); //Copy the position property
                    var forEachNode = new ForNode(forEachProps);

                    //Surround the existing node with an "forEach" node by replacing the current
                    //node with the new "forEach" node and then adding the current node as a child
                    node.parentNode.replaceChild(forEachNode, node);
                    forEachNode.appendChild(node);
                }

                if ((ifAttr = node.getAttributeNS(coreNS, "if")) != null) {
                    node.removeAttributeNS(coreNS, "if");
                    
                    var ifNode = new IfNode({
                        test: new Expression(ifAttr),
                        pos: node.getPosition()
                    });
                    
                    //Surround the existing node with an "if" node by replacing the current
                    //node with the new "if" node and then adding the current node as a child
                    node.parentNode.replaceChild(ifNode, node);
                    ifNode.appendChild(node);
                }
                
                if ((elseIfAttr = node.getAttributeNS(coreNS, "else-if")) != null) {
                    node.removeAttributeNS(coreNS, "else-if");
                    
                    var elseIfNode = new ElseIfNode({
                        test: new Expression(elseIfAttr),
                        pos: node.getPosition()
                    });
                    
                    //Surround the existing node with an "if" node by replacing the current
                    //node with the new "if" node and then adding the current node as a child
                    node.parentNode.replaceChild(elseIfNode, node);
                    elseIfNode.appendChild(node);
                }
                
                if ((node.getAttributeNS(coreNS, "else")) != null) {
                    node.removeAttributeNS(coreNS, "else");
                    
                    var elseNode = new ElseNode({
                        pos: node.getPosition()
                    });
                    
                    //Surround the existing node with an "if" node by replacing the current
                    //node with the new "if" node and then adding the current node as a child
                    node.parentNode.replaceChild(elseNode, node);
                    elseNode.appendChild(node);
                }
                
                if ((contentAttr = (node.getAttributeNS(coreNS, "bodyContent") || node.getAttributeNS(coreNS, "content"))) != null) {
                    node.removeAttributeNS(coreNS, "bodyContent");
                    node.removeAttributeNS(coreNS, "content");
                    
                    var newChild = new WriteNode({expression: contentAttr, pos: node.getPosition()});
                    node.removeChildren();
                    node.appendChild(newChild);
                }
                
                if (node.getAttributeNS && (stripAttr = node.getAttributeNS(coreNS, "strip")) != null) {
                    node.removeAttributeNS(coreNS, "strip");
                    if (!node.setStripExpression) {
                        node.addError("The c:strip directive is not allowed for target node");
                    }
                    node.setStripExpression(stripAttr);
                }
                
                if (node.getAttributeNS && (replaceAttr = node.getAttributeNS(coreNS, "replace")) != null) {
                    node.removeAttributeNS(coreNS, "replace");
                    
                    var replaceWriteNode = new WriteNode({expression: replaceAttr, pos: node.getPosition()});
                    //Replace the existing node with an node that only has children
                    
                    node.parentNode.replaceChild(replaceWriteNode, node);
                    
                    node = replaceWriteNode;
                }

                if (tag) {
                    if (tag.preserveWhitespace) {
                        node.setPreserveWhitespace(true);
                    }
                    
                    if (tag.handlerClass)
                    {
                        //Instead of compiling as a static XML element, we'll
                        //make the node render as a tag handler node so that
                        //writes code that invokes the handler
                        TagHandlerNode.convertNode(
                            node, 
                            tag);
                        
                        forEachProp(function(uri, name, value, prefix, attrDef) {
                            if (attrDef) {
                                node.setPropertyNS(uri, name, value);    
                            }
                            else {
                                node.addDynamicAttribute(prefix ? prefix + ':' + name : name, value);
                            }
                            
                        });
                    }
                    else if (tag.nodeClass){
                        
                        var NodeCompilerClass = raptor.require(tag.nodeClass);
                        extend(node, NodeCompilerClass.prototype);
                        NodeCompilerClass.call(node);
                        
                        node.setNodeClass(NodeCompilerClass);
                        
                        forEachProp(function(uri, name, value) {
                            node.setPropertyNS(uri, name, value);
                        });
                    }
                    
                }
                else if (uri && compiler.taglibs.isTaglib(uri)) {
                    node.addError('Tag ' + node.toString() + ' is not allowed for taglib "' + uri + '"');
                }
                
                
            },
            
            findNestedAttrs: function(node, compiler, template) {
                node.forEachChild(function(child) {
                    if (child.uri === coreNS && child.localName === 'attr') {
                        this.handleAttr(child, compiler, template);
                    }
                }, this);
            },
            
            handleAttr: function(node, compiler, template) {
                
                
                var parentNode = node.parentNode;
                if (!parentNode.isElementNode()) {
                    node.addError(this.toString() + ' tag is not nested within an element tag.');
                    return;
                }
                
                var hasValue = node.hasAttribute("value");
                
                var attrName = node.getAttribute("name");
                var attrValue = node.getAttribute("value");
                var attrUri = node.getAttribute("uri") || '';
                
                if (parentNode.hasAttributeNS(attrUri, attrName)) {
                    node.addError(node.toString() + ' tag adds duplicate attribute with name "' + attrName + '"' + (attrUri ? ' and URI "' + attrUri + '"' : ''));
                    return;
                }
                
                node.removeAttribute("name");
                node.removeAttribute("value");
                node.removeAttribute("uri");
                
                
                if (node.hasAttributesAnyNS()) {
                    //There shouldn't be any other attributes...
                    var invalidAttrs = node.getAllAttributes().map(function(attr) {
                        return attr.qName;
                    });
                    node.addError("Invalid attributes for tag " + node.toString() + ': ' + invalidAttrs.join(", "));
                    return;
                }
                
                node.detach(); //Remove the node out of the tree
                
                compiler.transformTree(node, template);
                
                if (hasValue) {                    
                    parentNode.setAttributeNS(attrUri, attrName, attrValue);
                }
                else {
                    parentNode.setAttributeNS(attrUri, attrName, node.getBodyContentExpression(template));
                }
            }
        };
    });