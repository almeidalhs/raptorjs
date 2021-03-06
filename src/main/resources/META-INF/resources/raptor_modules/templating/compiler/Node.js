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
    'templating.compiler.Node',
    function(raptor) {
        "use strict";
        
        var forEachEntry = raptor.forEachEntry,
            forEach = raptor.forEach,
            isArray = raptor.isArray,
            isEmpty = raptor.require('objects').isEmpty;
        
        var Node = function(nodeType) {
            if (!this.nodeType) {
                this._isRoot = false;
                this.preserveWhitespace = null;
                this.wordWrapEnabled = null;
                this.nodeType = nodeType;
                this.parentNode = null;
                this.previousSibling = null;
                this.nextSibling = null;
                this.firstChild = null;
                this.lastChild = null;
                this.namespaceMappings = {};
                this.prefixMappings = {};
                this.transformersApplied = {};
                this.properties = {};
            }
        };
        
        Node.prototype = {
            setRoot: function(isRoot) {
                this._isRoot = isRoot;
            },
            
            getPosition: function() {
                var pos = this.pos || this.getProperty("pos") || {
                    toString: function() {
                        return "(unknown position)";
                    }
                };
                
                return pos;
                
            },
            
            
            addError: function(error) {
                var compiler = this.compiler,
                    curNode = this;
                
                while (curNode != null && !compiler) {
                    compiler = curNode.compiler;
                    if (compiler) {
                        break;
                    }
                    curNode = curNode.parentNode;
                }
                
                if (!compiler) {
                    throw raptor.createError(new Error("Template compiler not set for node " + this));
                }
                var pos = this.getPosition();
                compiler.addError(error + " (" + this.toString() + ")", pos);
            },
            
            setProperty: function(name, value) {
                this.setPropertyNS(null, name, value);
            },
            
            setPropertyNS: function(uri, name, value) {
                if (!uri) {
                    uri = "";
                }
                var namespacedProps = this.properties[uri];
                if (!namespacedProps) {
                    namespacedProps = this.properties[uri] = {};
                }
                namespacedProps[name] = value;
            },
            
            setProperties: function(props) {
                this.setPropertiesNS(null, props);
            },
            
            setPropertiesNS: function(uri, props) {
                if (!uri) {
                    uri = "";
                }
                
                forEachEntry(props, function(name, value) {
                    this.setPropertyNS(uri, name, value);
                }, this);
            },
            
            getPropertyNamespaces: function() {
                return raptor.keys(this.properties);
            },
            
            getProperties: function(uri) {
                return this.getPropertiesNS(null);
            },
            
            hasProperty: function(name) {
                return this.hasPropertyNS('', name);
            },
            
            hasPropertyNS: function(uri, name) {
                if (!uri) {
                    uri = "";
                }
                var namespaceProps = this.properties[uri];
                return namespaceProps.hasOwnProperty(name);
            },
            
            getPropertiesByNS: function() {
                return this.properties;
            },
            
            getPropertiesNS: function(uri) {
                if (!uri) {
                    uri = "";
                }
                
                return this.properties[uri];
            },
            
            forEachProperty: function(callback, thisObj) {
                forEachEntry(this.properties, function(uri, properties) {
                    forEachEntry(properties, function(name, value) {
                        callback.call(thisObj, uri, name, value);
                    }, this);
                }, this);
            },
            
            getProperty: function(name) {
                return this.getPropertyNS(null, name);
            },
            
            getPropertyNS: function(uri, name) {
                if (!uri) {
                    uri = "";
                }
                
                var namespaceProps = this.properties[uri];
                return namespaceProps ? namespaceProps[name] : undefined;
            },
            
            removeProperty: function(name) {
                this.removePropertyNS("", name);
            },
            
            removePropertyNS: function(uri, name) {
                if (!uri) {
                    uri = "";
                }
                var namespaceProps = this.properties[uri];
                if (namespaceProps) {
                    delete namespaceProps[name];
                }
                
                if (isEmpty(namespaceProps)) {
                    delete this.properties[uri];
                }
                
            },
            
            removePropertiesNS: function(uri) {
                delete this.properties[uri];
            },
            
            forEachPropertyNS: function(uri, callback, thisObj) {
                if (uri == null) {
                    uri = '';
                }
                
                var props = this.properties[uri];
                if (props) {
                    forEachEntry(props, function(name, value) {
                        callback.call(thisObj, name, value);
                    }, this);
                }
            },
            
            forEachChild: function(callback, thisObj) {
                if (!this.firstChild) {
                    return;
                }
                
                /*
                 * Convert the child linked list to an array so that
                 * if the callback code manipulates the child nodes
                 * looping won't break
                 */
                var children = [];
                
                var curChild = this.firstChild;
                while(curChild) {
                    children.push(curChild);
                    curChild = curChild.nextSibling;
                }
                
                for (var i=0, len=children.length; i<len; i++) {
                    curChild = children[i];
                    if (curChild.parentNode === this) {
                        //Make sure the node is still a child of this node
                        if (false === callback.call(thisObj, curChild)) {
                            return;
                        }
                    }
                }
            },
            
            getExpression: function(template, childrenOnly) {
                if (!template) {
                    throw raptor.createError(new Error("template argument is required"));
                }
                
                var _this = this;
                return template.makeExpression({
                    toString: function() {
                        return template.captureCode(function() {
                            template.code("context.captureString(function() {\n")
                                .indent(function() {
                                    if (childrenOnly === true) {
                                        _this.generateCodeForChildren(template);
                                    }
                                    else {
                                        _this.generateCode(template);
                                    }
                                    
                                })
                                .code(template.indentStr() + "})");    
                        });
                        
                    }
                });
            },
            
            getBodyContentExpression: function(template) {
                return this.getExpression(template, true);
            },
        
            isTransformerApplied: function(transformer) {
                return this.transformersApplied[transformer.id] === true;
            },
            
            setTransformerApplied: function(transformer) {
                this.transformersApplied[transformer.id] = true;
            },
            
            hasChildren: function() {
                return this.firstChild != null;
            },
            
            appendChild: function(childNode) {
                
                if (childNode.parentNode) {
                    childNode.parentNode.removeChild(childNode);
                }
                
                if (!this.firstChild) {
                    this.firstChild = this.lastChild = childNode;
                    childNode.nextSibling = null;
                    childNode.previousSibling = null;
                }
                else {
                    this.lastChild.nextSibling = childNode;
                    childNode.previousSibling = this.lastChild;
                    this.lastChild = childNode;
                }
                
                childNode.parentNode = this;
            },
            
            appendChildren: function(childNodes) {
                if (!childNodes) {
                    return;
                }
                
                raptor.forEach(childNodes, function(childNode) {
                    this.appendChild(childNode);
                }, this);
            },
            
            isRoot: function() {
                return this._isRoot === true;
            },
            
            detach: function() {
                if (this.parentNode) {
                    this.parentNode.removeChild(this);
                }
            },
            
            removeChild: function(childNode) {
                
                if (childNode.parentNode !== this) { //Check if the child node is a child of the parent
                    return null;
                }
                
                var previousSibling = childNode.previousSibling,
                    nextSibling = childNode.nextSibling;
                
                if (this.firstChild === childNode && this.lastChild === childNode) {
                    //The child node is the one and only child node being removed
                    this.firstChild = this.lastChild = null;
                }
                else if (this.firstChild === childNode) {
                    //The child node being removed is the first child and there is another child after it
                    this.firstChild = this.firstChild.nextSibling; //Make the next child the first child
                    this.firstChild.previousSibling = null;
                }
                else if (this.lastChild === childNode) {
                    //The child node being removed is the last child and there is another child before it
                    this.lastChild = this.lastChild.previousSibling; //Make the previous child the last child
                    this.lastChild.nextSibling = null;
                }
                else {
                    previousSibling.nextSibling = nextSibling;
                    nextSibling.previousSibling = previousSibling;
                }
                
                //Make sure the removed node is completely detached
                childNode.parentNode = null;
                childNode.previousSibling = null;
                childNode.nextSibling = null;
                
                return childNode;
            },
            
            removeChildren: function() {
                while (this.firstChild) {
                    this.removeChild(this.firstChild);
                }
            },

            replaceChild: function(newChild, replacedChild) {
                
                if (newChild === replacedChild) {
                    return false;
                }
                
                if (!replacedChild) {
                    return false;
                }
                
                if (replacedChild.parentNode !== this) {
                    return false; //The parent does not have the replacedChild as a child... nothing to do
                }
                
                if (this.firstChild === replacedChild && this.lastChild === replacedChild) {
                    this.firstChild = newChild;
                    this.lastChild = newChild;
                    newChild.previousSibling = null;
                    newChild.nextSibling = null;
                }
                else if (this.firstChild === replacedChild) {
                    newChild.nextSibling = replacedChild.nextSibling;
                    replacedChild.nextSibling.previousSibling = newChild;
                    this.firstChild = newChild;
                }
                else if (this.lastChild === replacedChild) {
                    newChild.previousSibling = replacedChild;
                    replacedChild.previousSibling.nextSibling = newChild;
                    this.lastChild = newChild;
                }
                else {
                    replacedChild.nextSibling.previousSibling = newChild;
                    replacedChild.previousSibling.nextSibling = newChild;
                    newChild.nextSibling = replacedChild.nextSibling;
                    newChild.previousSibling = replacedChild.previousSibling;
                }
                
                newChild.parentNode = this;
                
                replacedChild.parentNode = null;
                replacedChild.previousSibling = null;
                replacedChild.nextSibling = null;
                
                return true;
            },
            
            insertAfter: function(node, referenceNode) {
                if (!node) {
                    return false;
                }
                
                if (referenceNode && referenceNode.parentNode !== this) {
                    return false;
                }
                
                if (isArray(node)) {
                    raptor.forEach(node, function(node) {
                        this.insertAfter(node, referenceNode);
                        referenceNode = node;
                    }, this);
                    return true;
                }
                
                if (node === referenceNode) {
                    return false;
                }
                
                if (referenceNode === this.lastChild) {
                    this.appendChild(node);
                    return true;
                }
                
                if (node.parentNode) {
                    node.parentNode.removeChild(node);
                }
                
                if (!referenceNode || referenceNode === this.lastChild) {
                    this.appendChild(node);
                    return true;
                }
                else {
                    referenceNode.nextSibling.previousSibling = node;
                    node.nextSibling = referenceNode.nextSibling; 
                    node.previousSibling = referenceNode;
                    referenceNode.nextSibling = node;
                }
                
                node.parentNode = this;
                
                return true;
            },
            
            insertBefore: function(node, referenceNode) {
                if (!node) {
                    return false;
                }
                
                if (referenceNode && referenceNode.parentNode !== this) {
                    return false;
                }
                
                if (isArray(node)) {
                    
                    var nodes = node,
                        i;
                    
                    for (i=nodes.length-1;i>=0; i--) {
                        this.insertBefore(nodes[i], referenceNode);
                        referenceNode = nodes[i];
                    }
                    return true;
                }
                
                if (node === referenceNode) {
                    return false;
                }
                
                if (node.parentNode) {
                    node.parentNode.removeChild(node);
                }
                
                if (!referenceNode) {
                    this.appendChild(node);
                }
                else if (this.firstChild === referenceNode) {
                    this.firstChild = node;
                    this.firstChild.nextSibling = referenceNode;
                    this.firstChild.previousSibling = null;
                    
                    referenceNode.previousSibling = this.firstChild;
                    node.parentNode = this;
                }
                else {
                    this.insertAfter(node, referenceNode.previousSibling);     
                }

                return true;
            },
            
            isTextNode: function() {
                return false;
            },
            
            isElementNode: function() {
                return false;
            },
            
            setStripExpression: function(stripExpression) {
                this.stripExpression = stripExpression;
            },
            
            normalizeText: function() {
                if (this.isTextNode()) {
                    var normalizedText = this.getText();
                    var curChild = this.nextSibling;
                    while(curChild && curChild.isTextNode()) {
                        normalizedText += curChild.getText();
                        var nodeToRemove = curChild;
                        curChild = curChild.nextSibling;
                        nodeToRemove.detach(); 
                    }
                    this.setText(normalizedText);
                }
            },
            
            generateCode: function(template) {
                this.compiler = template.compiler;
                
                var preserveWhitespace = this.isPreserveWhitespace();
                if (preserveWhitespace == null) {
                    preserveWhitespace = template.options.preserveWhitespace;
                    if (preserveWhitespace === true || (preserveWhitespace && preserveWhitespace["*"])) {
                        this.setPreserveWhitespace(true);
                    }
                    else {
                        this.setPreserveWhitespace(false);
                    }
                }
                
                var wordWrapEnabled = this.isWordWrapEnabled();
                if (wordWrapEnabled == null) {
                    wordWrapEnabled = template.options.wordWrapEnabled;
                    if (wordWrapEnabled !== false) {
                        this.setWordWrapEnabled(true);
                    }
                }
                
                if (this.isTextNode()) {
                    /*
                     * After all of the transformation of the tree we
                     * might have ended up with multiple text nodes
                     * as siblings. We want to normalize adjacent
                     * text nodes so that whitespace removal rules
                     * will be correct
                     */
                    this.normalizeText();    
                }
                
                try
                {
                    if (!this.stripExpression || this.stripExpression.toString() === 'false') {
                        this.doGenerateCode(template);
                    }
                    else if (this.stripExpression.toString() === 'true') {
                        this.generateCodeForChildren(template);
                    }
                    else {
                        //There is a strip expression
                        if (!this.generateBeforeCode || !this.generateAfterCode) {
                            this.addError("The c:strip directive is not supported for node " + this);
                            this.generateCodeForChildren(template);
                            return;
                        }
                        
                        var nextStripVarId = template.getAttribute("nextStripVarId");
                        if (nextStripVarId == null) {
                            nextStripVarId = template.setAttribute("nextStripVarId", 0);
                        }
                        var varName = '__strip' + (nextStripVarId++);
                        
                        template.statement('var ' + varName + ' = !(' + this.stripExpression + ');');
                        
                        template
                            .statement('if (' + varName + ') {')
                            .indent(function() {
                                this.generateBeforeCode(template);        
                            }, this)
                            .line("}");

                        
                        this.generateCodeForChildren(template);
                        
                        template
                            .statement('if (' + varName + ') {')
                            .indent(function() {
                                this.generateAfterCode(template);        
                            }, this)
                            .line("}");
                    }
                }
                catch(e) {
                    throw raptor.createError(new Error("Unable to generate code for node " + this + " at position [" + this.getPosition() + "]. Exception: " + e), e);
                }
            },
            
            /**
             * 
             * @returns {Boolean}
             */
            isPreserveWhitespace: function() {
                return this.preserveWhitespace; 
            },
            
            
            
            
            
            /**
             * 
             * @param preserve
             */
            setPreserveWhitespace: function(preserve) {
                this.preserveWhitespace = preserve;
            },
            
            isWordWrapEnabled: function() {
                return this.wordWrapEnabled; 
            },
            
            setWordWrapEnabled: function(enabled) {
                this.wordWrapEnabled = enabled;
            },
            
            doGenerateCode: function(template) {
                
                this.generateCodeForChildren(template);
            },
            
            generateCodeForChildren: function(template, indent) {
                if (!template) {
                    throw raptor.createError(new Error('The "template" argument is required'));
                }
                if (indent === true) {
                    template.incIndent();
                }
                
                this.forEachChild(function(childNode) {
                    if (childNode.isPreserveWhitespace() == null) {
                        childNode.setPreserveWhitespace(this.isPreserveWhitespace() === true);
                    }
                    
                    if (childNode.isWordWrapEnabled() == null) {
                        childNode.setWordWrapEnabled(this.isWordWrapEnabled() === true);
                    }
                    
                    childNode.generateCode(template);
                }, this);
                
                if (indent === true) {
                    template.decIndent();
                }
            },
            
            addNamespaceMappings: function(namespaceMappings) {
                if (!namespaceMappings) {
                    return;
                }
                var existingNamespaceMappings = this.namespaceMappings;
                var prefixMappings = this.prefixMappings;
                
                forEachEntry(namespaceMappings, function(prefix, uri) {
                    existingNamespaceMappings[prefix] = uri;
                    prefixMappings[uri] = prefix;
                });
            },
            
            resolveNamespacePrefix: function(uri) {
                var prefix = this.prefixMappings[uri];
                return (!prefix && this.parentNode) ?
                        this.parentNode.resolveNamespacePrefix() :
                        prefix;
            },
            
            getNodeClass: function() {
                return this.nodeClass || this.getClass();
            },
            
            setNodeClass: function(nodeClass) {
                this.nodeClass = nodeClass;
            },
            
            prettyPrintTree: function() {
                var out = [];
                var printNode = function(node, indent) {
                    out.push(indent + node.toString() + '\n');
                    
                    node.forEachChild(function(child) {
                        printNode(child, indent + "  ");
                    }, this);
                };
                
                printNode(this, "");
                
                return out.join('');
            }
        };
        
        return Node;
    });