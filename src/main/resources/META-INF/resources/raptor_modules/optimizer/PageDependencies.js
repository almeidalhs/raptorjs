raptor.defineClass(
    "optimizer.PageDependencies",
    function(raptor) {
        "use strict";
        
        var forEachEntry = raptor.forEachEntry,
            forEach = raptor.forEach;
        
        var AsyncRequire = function(name) {
            this.name = name;
            this.requires = [];
            this.requiresByName = {};
            this.bundles = [];
            this.bundlesByKey = {};
        };
        
        AsyncRequire.prototype = {
            getName: function() {
                return this.name;
            },
            
            addRequire: function(name) {
                if (!this.requiresByName[name]) {
                    this.requiresByName[name] = true;
                    this.requires.push(name);
                }
            },
            addBundle: function(bundle) {
                var bundleKey = bundle.getKey();
                
                if (!this.bundlesByKey[bundleKey]) {
                    this.bundlesByKey[bundleKey] = true;
                    this.bundles.push(bundle);
                }
            },
            getBundles: function() {
                return this.bundles;
            },
            
            getBundleKeys: function() {
                var bundleKeys = [];
                forEach(this.bundles, function(bundle) {
                    bundleKeys.push(bundle.getKey());
                });
                return bundleKeys;
            },
            
            hasRequires: function() {
                return this.requires.length > 0;
            },
            
            getRequires: function() {
                return this.requires;
            },
            forEachBundle: function(callback, thisObj) {
                forEach(this.bundles, callback, thisObj);
            },
            forEachRequire: function(callback, thisObj) {
                forEach(this.requires, callback, thisObj);
            }
        };
        
        var PageDependencies = function(config) {

            this.pageName = config.pageName;
            this.includes = config.includes || [];
            this.bundlingEnabled = config.bundlingEnabled !== false;
            this.config = config;
            
            /*
             * We must create a new bundle set that has as its parent the provided bundle set so that 
             * we don't modify the provided bundle set.
             */
            this.bundleSet = raptor.require('optimizer').createBundleSet(config.bundleSet);
            this.enabledExtensions = config.enabledExtensions;

            this.pageBundleLookup = {};
            this.bundlesByLocation = {};
            this.bundleCount = 0;
            this.asyncRequiresByName = {};
                        
            this.packageManifests = [];
            this.foundPackagePaths = {};
            
            if (config.packagePath) {
                
                var packageResource = raptor.require("resources").createFileResource(config.packagePath);
                var manifest = raptor.require('packager').getPackageManifest(packageResource);
                
                manifest.forEachInclude(
                    function(type, pageInclude) {
                        this.includes.push(pageInclude);
                    },
                    this,
                    {
                        enabledExtensions: config.enabledExtensions
                    });
            }
            
            this._build();
        };
        
        PageDependencies.prototype = {
             
            _build: function() {
                var optimizer = raptor.require('optimizer'),
                    bundleSet = this.bundleSet,
                    config = this.config,
                    asyncIncludes = [];
                    
                optimizer.forEachInclude({
                        includes: this.includes,
                        recursive: true, //We want to make sure every single include is part of a bundle
                        enabledExtensions: this.enabledExtensions,
                        handlePackageInclude: function(include, context) {
                            var manifest = include.getManifest();
                            if (!manifest) {
                                raptor.throwError(new Error("Manifest not found for include: " + include.toString()));
                            }
                            if (!this.foundPackagePaths[manifest.getSystemPath()]) {
                                this.foundPackagePaths[manifest.getSystemPath()] = true;
                                this.packageManifests.push(include.getManifest());
                            }
                            
                            if (context.async === true) {
                                asyncIncludes.push(include); //We'll handle async includes later
                            }
                        },
                        handleInclude: function(include, context) {

                            var bundle = bundleSet.getBundleForInclude(include);
                            
                            if (!bundle) {
                                
                                var sourceResource = include.getResource();
                                
                                if (!this.bundlingEnabled) {
                                    //Create a bundle with a single include for each include
                                    if (config.inPlaceDeploymentEnabled && include.isInPlaceDeploymentAllowed() && sourceResource) {
                                        
                                        var sourceUrl;
                                        
                                        if (this.config.sourceUrlResolver) {
                                            sourceUrl = this.config.sourceUrlResolver(sourceResource.getSystemPath());
                                        }
                                        
                                        if (!this.config.sourceUrlResolver || sourceUrl) {
                                            bundle = bundleSet.addIncludeToBundle(include, sourceResource.getSystemPath());
                                            if (sourceUrl) {
                                                bundle.url = sourceUrl;    
                                            }
                                            bundle.sourceResource = sourceResource;
                                            bundle.inPlaceDeployment = true;
                                        }
                                    }
                                    
                                    if (!bundle) {
                                        bundle = bundleSet.addIncludeToBundle(include, sourceResource ? sourceResource.getPath() : include.getKey());
                                        bundle.sourceResource = sourceResource;
                                        bundle.includeLocationInUrl = false;
                                        if (!sourceResource) {
                                            bundle.requireChecksum = true;
                                        }
                                    }
                                }
                                
                                if (!bundle) {
                                    //Make sure the include is part of a bundle. If it not part of a preconfigured bundle then put it in a page-specific bundle
                                    bundle = bundleSet.addIncludeToBundle(include, (context.async ? "page-async-" : "page-") + this.pageName);
                                }
                                
                            }
                            
                            if (context.async === true) {
                                return; //Don't add bundles associated with async includes to the page bundles (those bundles will be added to the async metadata)
                            }
                            /*
                             * Add the bundle to a page slot if it has not already been added
                             */
                            var bundleLookupKey = bundle.getKey();
                            
                            if (!this.pageBundleLookup[bundleLookupKey]) {
                                this.pageBundleLookup[bundleLookupKey] = bundle;
                                
                                this.bundleCount++;
                                
                                var bundlesForLocation = this.bundlesByLocation[bundle.getLocation()];
                                if (!bundlesForLocation) {
                                    bundlesForLocation = this.bundlesByLocation[bundle.getLocation()] = {
                                       css: [],
                                       js: []
                                    };
                                }
                                
                                if (bundle.isJavaScript()) {
                                    bundlesForLocation.js.push(bundle);
                                }
                                else if (bundle.isStyleSheet()){
                                    bundlesForLocation.css.push(bundle);
                                }
                                else {
                                    raptor.throwError(new Error("Invalid content for bundle: " + bundle.getContentType()));
                                }
                            }
                        },
                        thisObj: this
                    
                    });
                
                var asyncRequires = this.asyncRequiresByName,
                    getAsyncRequire = function(name) {
                        var asyncRequire = asyncRequires[name];
                        if (!asyncRequire) {
                            asyncRequire = asyncRequires[name] = new AsyncRequire(name);
                        }
                        return asyncRequire;
                    };
                    
                
                optimizer.forEachInclude({
                    includes: asyncIncludes,
                    recursive: true, //We want to make sure we pull in all recursive dependencies for async bundles
                    enabledExtensions: this.enabledExtensions,
                    handlePackageInclude: function(include, context) {
                        if (!context.parentPackage) {
                            return;
                        }
                    
                        var packageManifest = include.getManifest();
                        
                        var asyncRequire = getAsyncRequire(context.parentPackage.getName());
                        asyncRequire.addRequire(packageManifest.getName());
                        
                    },
                    handleInclude: function(include, context) {

                        var bundle = bundleSet.getBundleForInclude(include),
                            bundleKey = bundle.getKey();
                        if (!this.pageBundleLookup[bundleKey]) { //Check if this async include is part of a page bundle
                            //This bundle is an asynchronous only bundle
                        
                            if (!context.parentPackage) {
                                raptor.throwError(new Error("Illegal state. Asynchronous include is not part of a package"));
                            }
                            
                            var asyncRequire = getAsyncRequire(context.parentPackage.getName());
                            asyncRequire.addBundle(bundle);
                            
                        }
                    },
                    thisObj: this
                
                });
                
                
            },
            
            getBundleSet: function() {
                return this.bundleSet;
            },
            
            forEachPageBundle: function(callback, thisObj) {
                forEachEntry(this.bundlesByLocation, function(location, bundlesByContentType) {
                    
                    //Loop over CSS bundles first
                    forEach(bundlesByContentType.css, function(bundle) {
                        callback.call(thisObj, bundle);    
                    });
                    
                    //Followed by JS bundles for this location
                    forEach(bundlesByContentType.js, function(bundle) {
                        callback.call(thisObj, bundle);    
                    });
                    
                }, this);
            },
            
            forEachAsyncRequire: function(callback, thisObj) {
                forEachEntry(this.asyncRequiresByName, function(name, asyncRequire) {
                    callback.call(thisObj, asyncRequire);
                });
            },
            
            hasAsyncRequires: function() {
                return !raptor.require('objects').isEmpty(this.asyncRequiresByName);
            },
            
            getBundleCount: function() {
                return this.bundleCount;
            },
            
            getPageName: function() {
                return this.pageName;
            },
            
            getPackageManifests: function() {
                return this.packageManifests;
            },
            
            setSourceUrlResolver: function(sourceUrlResolver) {
                this.sourceUrlResolver = sourceUrlResolver;
            }
        };
        
        return PageDependencies;
    });