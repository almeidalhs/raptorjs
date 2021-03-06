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

package org.raptorjs.rhino;

import java.net.URL;

import org.mozilla.javascript.ScriptableObject;
import org.raptorjs.resources.ClasspathSearchPathEntry;
import org.raptorjs.resources.ResourceManager;





public abstract class RaptorJSEnv {

    private JavaScriptEngine jsEnv = new JavaScriptEngine();
    private String coreModulesDir = null;
    
    private RhinoHelpers rhinoHelpers = null;
    private ResourceManager resourceManager = null;
    
    public RaptorJSEnv(ResourceManager resourceManager) {
        this.resourceManager = resourceManager;
        
        this.init();
        this.createRaptor();
        this.afterInit();
    }

    private void findCoreModulesDir() {
        this.coreModulesDir = "/raptor_modules";
        URL bootstrapUrl = RaptorJSEnv.class.getResource(coreModulesDir + "/bootstrap/bootstrap_server.js");
        if (bootstrapUrl == null) {
            this.coreModulesDir = "/META-INF/resources/raptor_modules";
        }
    }
    
    
    public void init() { 
        this.findCoreModulesDir();
        
        if (this.resourceManager.findResource("/bootstrap/bootstrap_server.js") == null) {
            this.resourceManager.addSearchPathEntry(new ClasspathSearchPathEntry(RaptorJSEnv.class, this.coreModulesDir));    
        }
        
        this.rhinoHelpers = this.createRhinoHelpers();
   
        jsEnv.setGlobal("__rhinoHelpers", this.rhinoHelpers);
        this.getRhinoHelpers().getBootstrap().require("/bootstrap/bootstrap_server.js");
        this.getRhinoHelpers().getBootstrap().require("/bootstrap/bootstrap_rhino.js");
    }
    
    protected abstract void createRaptor();
    
    protected void afterInit() {
        this.getRhinoHelpers().getBootstrap().require("/resources/rhino-resource-search-path-adapter.js");
    }
        
    protected RhinoHelpers createRhinoHelpers() {
        return new RhinoHelpers(this);
    }

    public JavaScriptEngine getJavaScriptEngine() {
        return jsEnv;
    }

    public RhinoHelpers getRhinoHelpers() {
        return rhinoHelpers;
    }

    public ResourceManager getResourceManager() {
        return resourceManager;
    }

    public String getCoreModulesDir() {
        return coreModulesDir;
    }

    public void setCoreModulesDir(String coreModulesDir) {
        this.coreModulesDir = coreModulesDir;
    }
    
    public ScriptableObject require(String name) {
        return (ScriptableObject)this.getJavaScriptEngine().invokeFunction("rhinoRaptorRequire", name);
    }
    
    public void load(String name) {
        this.getJavaScriptEngine().invokeFunction("rhinoRaptorLoad", name);
    }
    
}
