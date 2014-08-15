//
// Copyright (c) JBaron.  All rights reserved.
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//

module Cats {

    /** 
     * Load the TSWorker and handles the communication with the web worker
     * This implementation uses internally a JSON-RPC style message format 
     * for the communication.
     */
    export class TSWorkerProxy {

        private worker: Worker;
        private messageId = 0;
        private registry: ts.Map<Function> = {};

        constructor(private project: Project) {
            // Create a new webworker
            this.worker = new Worker("../lib/tsworker.js");
            this.initWorker();
        }

        stop() {
            this.worker.terminate();
        }

        getErrors(fileName: string, cb: (err: any, result: FileRange[]) => void) {
            this.perform("getErrors", fileName, cb);
        }

        getNavigateToItems(search: string, cb: (err: any, result: NavigateToItem[]) => void) {
            this.perform("getNavigateToItems", search, cb);
        }

        getAllDiagnostics(cb: (err: any, result: FileRange[]) => void) {
            this.perform("getAllDiagnostics", cb);
        }

        getFormattedTextForRange(sessionName: string, start: number, end: number, cb: Function) {
            this.perform("getFormattedTextForRange", sessionName, start, end, cb);
        }

        getDefinitionAtPosition(sessionName: string, cursor: Cats.Position, cb: (err: any, data: FileRange) => void) {
            this.perform("getDefinitionAtPosition", sessionName, cursor, cb);
        }

        getInfoAtPosition(type: string, sessionName: string, cursor: Cats.Position, cb: (err: any, data: Cats.FileRange[]) => void) {
            this.perform("getInfoAtPosition", type, sessionName, cursor, cb);
        }

        compile(cb: (err: any, data: Cats.CompileResults) => void) {
            this.perform("compile", cb);
        }

        getScriptLexicalStructure(sessionName: string, cb: (err: any, data: NavigateToItem[]) => void) {
            this.perform("getScriptLexicalStructure", sessionName, cb);
        }

        getTypeAtPosition(name: string, docPos: Ace.Position, cb: (err: any, data: TypeInfo) => void) {
            this.perform("getTypeAtPosition", name, docPos, cb);
        }

        getCompletions(fileName: string, cursor: any, cb: any) {
            this.perform("getCompletions", fileName, cursor, cb);
        }

        getDependencyGraph(cb: any) {
            this.perform("getDependencyGraph", cb);
        }

        setCompilationSettings(settings: any) {
            this.perform("setCompilationSettings", settings, null);
        }

        addScript(fileName: string, content: string) {
            this.perform("addScript", fileName, content, null);
        }

        updateScript(fileName: string, content: string) {
            this.perform("updateScript", fileName, content, null);
        }

        autoComplete(cursor: Ace.Position, name: string, cb: (err: any, completes: ts.CompletionEntryDetails[]) => void) {
            this.perform("autoComplete", cursor, name, cb);
        }

        initialize() {
            this.perform("initialize", null);
        }

        /**
         * Invoke a method on the worker using JSON-RPC message structure
         */
        private perform(method: string, ...data: Array<any>) {
            var handler = data.pop();
            this.messageId++;
            var message = {
                id: this.messageId,
                method: method,
                params: data
            };
            this.worker.postMessage(message);
            console.info("Send message: " + message.method);
            if (handler) { this.registry[this.messageId] = handler; }
        }

        /**
         * Clear any pending handlers
         */
        clear() {
            this.registry = {};
        }

        /**
         * Setup the message communication with the worker
         */
        private initWorker() {
            // Setup the message handler
            this.worker.onmessage = (e) => {
                var msg = e.data;
                // console.log("Received message " + JSON.stringify(msg) + " from worker");
                // console.log("Received message reply " + msg.id + " from worker.");
                if (msg.error) {
                    console.error("Got error back !!! ");
                    console.error(msg.error.stack);
                }
                // @TODO handle exceptions better and call callback
                var id = msg.id;
                if (id) {
                    var handler = this.registry[id];
                    if (handler) {
                        delete this.registry[id];
                        handler(msg.error, msg.result);
                    }
                } else {
                    if (msg.method && (msg.method === "setBusy")) {
                        IDE.statusBar.setBusy(msg.data);
                    } else {
                        console.info(msg.data);
                    }
                }
            };
        }

    }

}
