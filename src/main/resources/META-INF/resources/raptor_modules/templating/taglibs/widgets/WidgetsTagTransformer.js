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
    "templating.taglibs.widgets.WidgetsTagTransformer",
    function(raptor) {
        "use strict";
        
        var widgetsNS = "http://raptorjs.org/templates/widgets",
            strings = raptor.require('strings'),
            objects = raptor.require('objects'),
            stringify = raptor.require('json.stringify').stringify,
            AttributeSplitter = raptor.require('templating.compiler.AttributeSplitter');
        
        return {
            process: function(node, compiler, template) {
                var widgetAttr,
                    widgetProps = node.getPropertiesNS(widgetsNS);
                
                
                var widgetArgs = {},
                    widgetEvents = [];
                
                
                
                if (widgetProps) {
                    var handledPropNames = [];
                    
                    raptor.forEachEntry(widgetProps, function(name, value) {
                        if (name === 'id') {
                            handledPropNames.push(name);
                            widgetArgs.scope = "widget";
                            widgetArgs.id = value;
                        }
                        else if (strings.startsWith(name, "event-")) {
                            handledPropNames.push(name);
                            
                            
                            var eventProps = AttributeSplitter.parse(
                                    value, 
                                    {
                                        '*': {
                                            type: "expression"
                                        },
                                        target: {
                                            type: "custom"
                                        }
                                    },
                                    {
                                        defaultName: "target",
                                        errorHandler: function(message) {
                                            node.addError('Invalid value of "' + value + '" for event attribute "' + name + '". Error: ' + message);
                                        }
                                    });
                            
                            var sourceEvent = name.substring("event-".length);
                            var targetMessage = eventProps.target;
                            
                            if (!targetMessage) {
                                node.addError('Invalid value of "' + value + '" for event attribute "' + name + '". Target message not provided');
                                return;
                            }
                            
                            
                            delete eventProps.target;
//                            
//                            if (arg == null) {    
//                                var argStart = targetMessage.indexOf('(');
//                                if (argStart != -1) {
//                                    var argEnd = targetMessage.lastIndexOf(')');
//                                    if (argEnd != -1) {
//                                        if (argEnd != targetMessage.length-1) {
//                                            node.addError('Invalid arg for event "' + sourceEvent + '". Extra content after ending parenthesis in "' + value + '".');
//                                            return;
//                                        }
//                                        
//                                        arg = targetMessage.substring(argStart+1, argEnd);
//                                        targetMessage = targetMessage.substring(0, argStart);
//                                    }
//                                    else {
//                                        node.addError('Invalid arg for event "' + sourceEvent + '". Missing ending parenthesis in "' + value + '".');
//                                        return;
//                                    }
//                                }
//                            }
//                            
                            
                            widgetEvents.push({
                                sourceEvent: sourceEvent,
                                targetMessage: targetMessage,
                                eventProps: eventProps
                            });
                        }
                            
                    });
                    
                    handledPropNames.forEach(function(propName) {
                        node.removePropertyNS(widgetsNS, propName);
                    });
                    
                    if (widgetEvents.length) {
                        
                        
                        widgetArgs.events = template.makeExpression("[" + widgetEvents.map(function(widgetEvent) {
                            var widgetPropsJS;
                            
                            if (!objects.isEmpty(widgetEvent.eventProps)) {
                                widgetPropsJS = [];
                                raptor.forEachEntry(widgetEvent.eventProps, function(name, valueExpression) {
                                    widgetPropsJS.push(stringify(name) + ": " + valueExpression);
                                }, this);
                                widgetPropsJS = "{" + widgetPropsJS.join(", ") + "}";
                            }
                            
                            return  "[" + stringify(widgetEvent.sourceEvent) + "," + stringify(widgetEvent.targetMessage) + (widgetPropsJS ? "," + widgetPropsJS : "") + "]";
                        }).join(",") + "]");
                    }
                    
                    if (!objects.isEmpty(widgetArgs)) {
                        node.setProperty("widgetArgs", template.makeExpression(
                            "{" + 
                                objects.entries(widgetArgs).map(function(entry) {
                                    return entry.key+": " + entry.value;
                                }).join(", ") +
                            "}"
                        ));
                        
                    }
                }
                
                if ((widgetAttr = node.getAttributeNS(widgetsNS, "widget"))) {
                    node.removeAttributeNS(widgetsNS, "widget");
                    
                    var widgetNode = compiler.createTagHandlerNode(widgetsNS, "widget");
                    node.parentNode.replaceChild(widgetNode, node);
                    widgetNode.appendChild(node);
                    widgetNode.setProperty("jsClass", widgetAttr);
                    
                    var elId = node.getAttribute("id");
                    if (elId) {
                        elId = compiler.convertType(elId, "string", true);
                        widgetNode.setProperty("id", elId);
                    }
                    else {
                        node.setAttribute('id', '${widget.elId()}');
                    }
                }
                
                
            }
        };
    });