var Cats;
(function (Cats) {
    (function (Severity) {
        Severity[Severity["Info"] = 0] = "Info";
        Severity[Severity["Warning"] = 1] = "Warning";
        Severity[Severity["Error"] = 2] = "Error";
    })(Cats.Severity || (Cats.Severity = {}));
    var Severity = Cats.Severity;
})(Cats || (Cats = {}));
var Cats;
(function (Cats) {
    (function (TSWorker) {
        var ScriptInfo = (function () {
            function ScriptInfo(fileName, content) {
                this.fileName = fileName;
                this.content = content;
                this.version = 1;
                this.editRanges = [];
                this.lineMap = null;
                this.setContent(content);
            }
            ScriptInfo.prototype.setContent = function (content) {
                this.content = content;
                this.lineMap = null;
            };
            ScriptInfo.prototype.getLineMap = function () {
                if (!this.lineMap)
                    this.lineMap = TypeScript.LineMap1.fromString(this.content);
                return this.lineMap;
            };
            ScriptInfo.prototype.updateContent = function (content) {
                this.editRanges = [];
                this.setContent(content);
                this.version++;
            };
            ScriptInfo.prototype.editContent = function (minChar, limChar, newText) {
                var prefix = this.content.substring(0, minChar);
                var middle = newText;
                var suffix = this.content.substring(limChar);
                this.setContent(prefix + middle + suffix);
                this.editRanges.push({
                    length: this.content.length,
                    textChangeRange: new TypeScript.TextChangeRange(TypeScript.TextSpan.fromBounds(minChar, limChar), newText.length)
                });
                this.version++;
            };
            ScriptInfo.prototype.getTextChangeRangeSinceVersion = function (version) {
                if (this.version === version) {
                    return TypeScript.TextChangeRange.unchanged;
                }
                var initialEditRangeIndex = this.editRanges.length - (this.version - version);
                var entries = this.editRanges.slice(initialEditRangeIndex);
                return TypeScript.TextChangeRange.collapseChangesAcrossMultipleVersions(entries.map(function (e) { return e.textChangeRange; }));
            };
            return ScriptInfo;
        })();
        TSWorker.ScriptInfo = ScriptInfo;
        var LanguageServiceHost = (function () {
            function LanguageServiceHost() {
                this.compilationSettings = null;
                this.scripts = {};
                this.maxScriptVersions = 100;
            }
            LanguageServiceHost.prototype.getScriptFileNames = function () {
                return Object.keys(this.scripts);
            };
            LanguageServiceHost.prototype.getScriptIsOpen = function (fileName) {
                return true;
            };
            LanguageServiceHost.prototype.getLocalizedDiagnosticMessages = function () {
            };
            LanguageServiceHost.prototype.fileExists = function (path) {
                TSWorker.console.log("Called fileExist" + path);
                return true;
            };
            LanguageServiceHost.prototype.directoryExists = function (path) {
                TSWorker.console.log("Called directoryExist" + path);
                return true;
            };
            LanguageServiceHost.prototype.getParentDirectory = function (path) {
                TSWorker.console.log("Called getParentDirectory" + path);
                return "";
            };
            LanguageServiceHost.prototype.resolveRelativePath = function (path, directory) {
                TSWorker.console.log("Called resolveRelativePath p1:" + path + " p2:" + directory);
                return path;
            };
            LanguageServiceHost.prototype.getScriptSnapshot = function (fileName) {
                var script = this.scripts[fileName];
                var result = TypeScript.ScriptSnapshot.fromString(script.content);
                result.getChangeRange = function (oldSnapshot) {
                    return null;
                };
                return result;
            };
            LanguageServiceHost.prototype.addScript = function (fileName, content) {
                var script = new ScriptInfo(fileName, content);
                this.scripts[fileName] = script;
            };
            LanguageServiceHost.prototype.updateScript = function (fileName, content) {
                var script = this.scripts[fileName];
                if (script) {
                    script.updateContent(content);
                }
                else {
                    this.addScript(fileName, content);
                }
            };
            LanguageServiceHost.prototype.editScript = function (fileName, minChar, limChar, newText) {
                var script = this.scripts[fileName];
                if (script) {
                    script.editContent(minChar, limChar, newText);
                }
                else {
                    throw new Error("No script with name '" + name + "'");
                }
            };
            LanguageServiceHost.prototype.information = function () {
                return false;
            };
            LanguageServiceHost.prototype.debug = function () {
                return false;
            };
            LanguageServiceHost.prototype.warning = function () {
                return false;
            };
            LanguageServiceHost.prototype.error = function () {
                return false;
            };
            LanguageServiceHost.prototype.fatal = function () {
                return false;
            };
            LanguageServiceHost.prototype.log = function (s) {
            };
            LanguageServiceHost.prototype.getDiagnosticsObject = function () {
                return {
                    log: function (content) {
                    }
                };
            };
            LanguageServiceHost.prototype.getCompilationSettings = function () {
                return this.compilationSettings;
            };
            LanguageServiceHost.prototype.setCompilationSettings = function (value) {
                this.compilationSettings = value;
            };
            LanguageServiceHost.prototype.getScriptVersion = function (fileName) {
                var script = this.scripts[fileName];
                return script.version.toString();
            };
            LanguageServiceHost.prototype.getCancellationToken = function () {
                return LanguageServiceHost.cancellationToken;
            };
            LanguageServiceHost.cancellationToken = {
                isCancellationRequested: function () { return false; }
            };
            return LanguageServiceHost;
        })();
        TSWorker.LanguageServiceHost = LanguageServiceHost;
    })(Cats.TSWorker || (Cats.TSWorker = {}));
    var TSWorker = Cats.TSWorker;
})(Cats || (Cats = {}));
importScripts("../static/js/typescriptServices.js");
var Cats;
(function (Cats) {
    (function (TSWorker) {
        TSWorker.console = {
            log: function (str) {
                postMessage({ method: "console", data: str }, null);
            },
            error: function (str) {
                postMessage({ method: "console", data: str }, null);
            },
            info: function (str) {
                postMessage({ method: "console", data: str }, null);
            }
        };
        function caseInsensitiveSort(a, b) {
            if (a.name.toLowerCase() < b.name.toLowerCase())
                return -1;
            if (a.name.toLowerCase() > b.name.toLowerCase())
                return 1;
            if (a.name < b.name)
                return -1;
            if (a.name > b.name)
                return 1;
            return 0;
        }
        var ISense = (function () {
            function ISense() {
                this.maxErrors = 100;
                this.lsHost = new TSWorker.LanguageServiceHost();
                this.documentRegistry = ts.createDocumentRegistry();
                this.ls = ts.createLanguageService(this.lsHost, this.documentRegistry);
            }
            ISense.prototype.initialize = function () {
                try {
                    this.ls.refresh();
                    this.compile();
                }
                catch (err) {
                }
            };
            ISense.prototype.getScript = function (fileName) {
                return this.lsHost.scripts[fileName];
            };
            ISense.prototype.positionToLineCol = function (script, position) {
                var result = script.getLineMap().getLineAndCharacterFromPosition(position);
                return {
                    row: result.line(),
                    column: result.character()
                };
            };
            ISense.prototype.getDefinitionAtPosition = function (fileName, pos) {
                var chars = this.getPositionFromCursor(fileName, pos);
                var infos = this.ls.getDefinitionAtPosition(fileName, chars);
                if (infos) {
                    var info = infos[0];
                    return {
                        fileName: info.fileName,
                        range: this.getRange(info.fileName, info.minChar, info.limChar)
                    };
                }
                else {
                    return null;
                }
            };
            ISense.prototype.convertNavigateTo = function (items) {
                var results = items;
                for (var i = 0; i < results.length; i++) {
                    var result = results[i];
                    result.range = this.getRange(result.fileName, result.minChar, result.limChar);
                }
                return results;
            };
            ISense.prototype.convertNavigateTo2 = function (fileName, items) {
                var result = new Array();
                for (var i = 0; i < items.length; i++) {
                    var item = items[i];
                    var entry = this.getRange(fileName, item.textSpan.start(), item.textSpan.end());
                    result.push(entry);
                }
                return result;
            };
            ISense.prototype.convertErrors = function (errors, severity) {
                var _this = this;
                if (severity === void 0) { severity = 2 /* Error */; }
                if (!(errors && errors.length))
                    return [];
                var result = [];
                errors.forEach(function (error) {
                    var r = _this.getRange(error.file.filename, error.start, error.start + error.length);
                    result.push({
                        range: r,
                        severity: severity,
                        message: error.messageText,
                        fileName: error.file.filename
                    });
                });
                return result;
            };
            ISense.prototype.getErrors = function (fileName) {
                var errors = [];
                var fileErrors = this.ls.getSyntacticDiagnostics(fileName);
                var newErrors = this.convertErrors(fileErrors, 2 /* Error */);
                errors = errors.concat(newErrors);
                fileErrors = this.ls.getSemanticDiagnostics(fileName);
                newErrors = this.convertErrors(fileErrors, 1 /* Warning */);
                errors = errors.concat(newErrors);
                return errors;
            };
            ISense.prototype.getAllDiagnostics = function () {
                var scripts = this.lsHost.scripts;
                var errors = [];
                for (var fileName in scripts) {
                    errors = errors.concat(this.getErrors(fileName));
                }
                var compilerSettingsErrors = this.ls.getCompilerOptionsDiagnostics();
                var newErrors = this.convertErrors(compilerSettingsErrors, 2 /* Error */);
                errors = errors.concat(newErrors);
                return errors;
            };
            ISense.prototype.compile = function () {
                var scripts = this.lsHost.scripts;
                var result = [];
                var errors = [];
                for (var fileName in scripts) {
                    try {
                        var emitOutput = this.ls.getEmitOutput(fileName);
                        emitOutput.outputFiles.forEach(function (file) {
                            result.push({
                                fileName: file.name,
                                content: file.text
                            });
                        });
                        if (this.lsHost.getCompilationSettings().out) {
                            break;
                        }
                    }
                    catch (err) {
                    }
                }
                ;
                errors = this.getAllDiagnostics();
                TSWorker.console.info("Errors found: " + errors.length);
                return {
                    source: result,
                    errors: errors
                };
            };
            ISense.prototype.setCompilationSettings = function (options) {
                var compOptions = {};
                for (var i in options) {
                    compOptions[i] = options[i];
                }
                this.lsHost.setCompilationSettings(compOptions);
                return compOptions;
            };
            ISense.prototype.getDependencyGraph = function () {
                var result = [];
                var scripts = this.lsHost.scripts;
                for (var fileName in scripts) {
                    var script = scripts[fileName];
                    var entry = {
                        src: script.fileName,
                        ref: []
                    };
                    var i = TypeScript.ScriptSnapshot.fromString(script.content);
                    var refs = TypeScript.getReferencedFiles(script.fileName, i);
                    refs.forEach(function (file) {
                        entry.ref.push(file.path);
                    });
                    result.push(entry);
                }
                ;
                return result;
            };
            ISense.prototype.getScriptContent = function (fileName) {
                var script = this.lsHost.scripts[fileName];
                if (script)
                    return script.content;
            };
            ISense.prototype.splice = function (str, start, max, replacement) {
                return str.substring(0, start) + replacement + str.substring(max);
            };
            ISense.prototype.getFormattedTextForRange = function (fileName, start, end) {
                var options = {
                    IndentSize: 4,
                    TabSize: 4,
                    NewLineCharacter: "\n",
                    ConvertTabsToSpaces: true,
                    InsertSpaceAfterCommaDelimiter: true,
                    InsertSpaceAfterSemicolonInForStatements: true,
                    InsertSpaceBeforeAndAfterBinaryOperators: true,
                    InsertSpaceAfterKeywordsInControlFlowStatements: true,
                    InsertSpaceAfterFunctionKeywordForAnonymousFunctions: true,
                    InsertSpaceAfterOpeningAndBeforeClosingNonemptyParenthesis: false,
                    PlaceOpenBraceOnNewLineForFunctions: false,
                    PlaceOpenBraceOnNewLineForControlBlocks: false
                };
                var result = this.getScriptContent(fileName);
                if (end === -1)
                    end = result.length;
                var edits = this.ls.getFormattingEditsForRange(fileName, start, end, options);
                var offset = 0;
                for (var i = 0; i < edits.length; i++) {
                    var edit = edits[i];
                    result = this.splice(result, edit.minChar + offset, edit.limChar + offset, edit.text);
                    offset += edit.text.length - (edit.limChar - edit.minChar);
                }
                return result;
            };
            ISense.prototype.addScript = function (fileName, content) {
                if (this.lsHost.scripts[fileName]) {
                    this.updateScript(fileName, content);
                }
                else {
                    this.lsHost.addScript(fileName, content);
                }
            };
            ISense.prototype.updateScript = function (fileName, content) {
                this.lsHost.updateScript(fileName, content);
            };
            ISense.prototype.getRange = function (fileName, minChar, limChar) {
                var script = this.getScript(fileName);
                var result = {
                    start: this.positionToLineCol(script, minChar),
                    end: this.positionToLineCol(script, limChar)
                };
                return result;
            };
            ISense.prototype.getPositionFromCursor = function (fileName, cursor) {
                var script = this.getScript(fileName);
                if (script) {
                    var pos = script.getLineMap().getPosition(cursor.row, cursor.column);
                    return pos;
                }
            };
            ISense.prototype.getTypeAtPosition = function (fileName, coord) {
                var pos = this.getPositionFromCursor(fileName, coord);
                if (!pos)
                    return;
                var result = this.ls.getTypeAtPosition(fileName, pos);
                if (result)
                    result.description = result.memberName.text;
                return result;
            };
            ISense.prototype.determineAutoCompleteType = function (source, pos) {
                var identifyerMatch = /[0-9A-Za-z_\$]*$/;
                var previousCode = source.substring(0, pos);
                var match = previousCode.match(identifyerMatch);
                var newPos = pos;
                var memberMode = false;
                if (match && match[0])
                    newPos = pos - match[0].length;
                if (source[newPos - 1] === '.')
                    memberMode = true;
                var result = {
                    pos: newPos,
                    memberMode: memberMode
                };
                return result;
            };
            ISense.prototype.getLine = function (fileName, minChar, limChar) {
                var content = this.getScriptContent(fileName);
                var min = content.substring(0, minChar).lastIndexOf("\n");
                var max = content.substring(limChar).indexOf("\n");
                return content.substring(min + 1, limChar + max);
            };
            ISense.prototype.getNavigateToItems = function (search) {
                var results = this.ls.getNavigateToItems(search);
                return this.convertNavigateTo(results);
            };
            ISense.prototype.getScriptLexicalStructure = function (fileName) {
                var results = this.ls.getScriptLexicalStructure(fileName);
                var finalResults = results.filter(function (entry) {
                    return entry.fileName === fileName;
                });
                return this.convertNavigateTo(finalResults);
            };
            ISense.prototype.getOutliningRegions = function (fileName) {
                var results = this.ls.getOutliningRegions(fileName);
                return this.convertNavigateTo2(fileName, results);
            };
            ISense.prototype.getInfoAtPosition = function (method, fileName, cursor) {
                var pos = this.getPositionFromCursor(fileName, cursor);
                var result = [];
                var entries = this.ls[method](fileName, pos);
                for (var i = 0; i < entries.length; i++) {
                    var ref = entries[i];
                    result.push({
                        fileName: ref.fileName,
                        range: this.getRange(ref.fileName, ref.minChar, ref.limChar),
                        message: this.getLine(ref.fileName, ref.minChar, ref.limChar)
                    });
                }
                return result;
            };
            ISense.prototype.autoComplete = function (cursor, fileName) {
                var _this = this;
                var pos = this.getPositionFromCursor(fileName, cursor);
                var memberMode = false;
                var source = this.getScriptContent(fileName);
                var type = this.determineAutoCompleteType(source, pos);
                var completions = this.ls.getCompletionsAtPosition(fileName, type.pos, type.memberMode);
                var entries = completions && completions.entries || [];
                entries.sort(caseInsensitiveSort);
                return entries.map(function (entry) { return _this.ls.getCompletionEntryDetails(fileName, type.pos, entry.name); });
            };
            return ISense;
        })();
        function setBusy(value) {
            postMessage({ method: "setBusy", data: value }, null);
        }
        var tsh;
        addEventListener('message', function (e) {
            if (!tsh)
                tsh = new ISense();
            setBusy(true);
            var msg = e["data"];
            var method = msg.method;
            var id = msg.id;
            var params = msg.params;
            try {
                var result;
                result = tsh[method].apply(tsh, params);
                postMessage({ id: id, result: result }, null);
            }
            catch (err) {
                var error = {
                    description: err.description,
                    stack: err.stack
                };
                TSWorker.console.error("Error during processing message " + method);
                postMessage({ id: id, error: error }, null);
            }
            finally {
                setBusy(false);
            }
        }, false);
    })(Cats.TSWorker || (Cats.TSWorker = {}));
    var TSWorker = Cats.TSWorker;
})(Cats || (Cats = {}));
