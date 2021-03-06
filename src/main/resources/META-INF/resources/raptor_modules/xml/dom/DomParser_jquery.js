raptor.defineClass(
    'xml.dom.DomParser',
    function(raptor) {
        "use strict";
        
        var DomParser = function(options) {
            
        };
        
        DomParser.prototype = {
                
            parse: function(xmlSrc) {
                try
                {
                    var xmlDoc = $.parseXML(xmlSrc);
                    return xmlDoc;
                }
                catch(e) {
                    throw new Error("Invalid XML");
                }
            }
        };
        
        return DomParser;
    });