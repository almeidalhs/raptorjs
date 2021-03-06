raptor.define(
    'templating.taglibs.optimizer.DisableExtensionTag',
    function(raptor) {
        
        return {
            process: function(input, context) {
                var optimizer = raptor.require('optimizer');
                optimizer.disableExtensionForContext(context, input.name);
            }
        };
    });