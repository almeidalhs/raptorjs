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

$rload(function(raptor) {
    "use strict";
    
    var EMPTY_STRING = '',
        trim = function(s){
            return s ? s.trim() : EMPTY_STRING;
        },
        varRegExp = /\$\{([A-Za-z0-9_\.]+)\}/g;
    
    
    /**
     * @namespace
     * @raptor
     * @name strings
     */
    raptor.strings = /** @lends strings */{

        compare: function(s1, s2)
        {
            return s1 < s2 ? -1 : (s1 > s2 ? 1 : 0);
        },
        
        /**
         * @param {string} s The string to operate on
         * @return {boolean} Returns true if the string is null or only consists of whitespace
         * 
         * @static
         */
        isEmpty: function(s)
        {
            return s == null || trim(s).length === 0;
        },

        /**
         * @param {string} s The string to operate on
         * @return {integer} Returns the length of the string or 0 if the string is null
         * 
         * @static
         */
        length: function(s)
        {
            return s == null ? 0 : s.length;
        },

        /**
         * @param {object} o The object to test
         * @return {boolean} Returns true if the object is a string, false otherwise.
         * 
         * @static
         */
        isString: raptor.isString,

        /**
         * Tests if two strings are equal
         * 
         * @param s1 {string} The first string to compare
         * @param s2 {string} The second string to compare
         * @param shouldTrim {boolean} If true the string is trimmed, otherwise the string is not trimmed (optional, defualts to true)
         * @return {boolean} Returns true if the strings are equal, false otherwise
         * 
         * @static
         */
        equals: function(s1, s2, shouldTrim)
        {        
            if (shouldTrim !== false)
            {
                s1 = trim(s1);
                s2 = trim(s2);
            }
            return s1 == s2;
        },

        /**
         * Tests if two strings are not equal
         * 
         * @param s1 {string} The first string to compare
         * @param s2 {string} The second string to compare
         * @param trim {boolean} If true the string is trimmed, otherwise the string is not trimmed (optional, defualts to true)
         * @return {boolean} Returns true if the strings are equal, false otherwise
         * 
         * @see #equals
         * @static
         */
        notEquals: function(s1, s2, shouldTrim)
        {
            return this.equals(s1, s2, shouldTrim) === false;
        },
        
        trim: trim,

        ltrim: function(s){
            return s ? s.replace(/^\s\s*/,'') : EMPTY_STRING;
        },

        rtrim: function(s){
            return s ? s.replace(/\s\s*$/,'') : EMPTY_STRING;
        },

        startsWith: function(s, prefix) {
            if (!s || s.length < prefix.length) return false;
            else return s.substring(0, prefix.length) === prefix;
        },

        endsWith: function(s, suffix) {
            if (!s || s.length < suffix.length) return false;
            else return s.substring(s.length - suffix.length) === suffix;
        },
        
        /**
         * 
         * @param c
         * @returns
         */
        unicodeEncode: function(c) {
            return '\\u'+('0000'+(+(c.charCodeAt(0))).toString(16)).slice(-4);
        },
        
        merge: function(str, data) {
            var varMatches,
                parts = [],
                lastIndex = 0;
                
            varRegExp.lastIndex = 0;

            while ((varMatches = varRegExp.exec(str))) {
                parts.push(str.substring(lastIndex, varMatches.index));
                parts.push(data[varMatches[1]] || '');
                lastIndex = varRegExp.lastIndex;
            }
            
            parts.push(str.substring(lastIndex));
            return parts.join('');
        }
        
    };
});