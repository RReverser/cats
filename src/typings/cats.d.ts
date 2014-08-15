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


declare module Cats {

    var theme:any
    
    interface JSONRPCRequest {
        id?: number;
        method:string;
        params?:any;
    }

    interface FileEntry {
        name: string; // Just the file/directory name without path
        fullName: string; // fullName including path
        isFile: boolean; // is this a folder or a file
        isDirectory: boolean; // is this a folder or a file
    }

 
    /**
     * Used for storing IDE specific settings
     */
    interface IDEConfiguration {
        version: string;
        theme: string;
        fontSize: number;
        rightMargin: number;
        iconDir: string;
        projects: string[];
        sessions: {
            path: string;
            state?: any;
        }[];
    }


    interface RunExternal {
        command: string;
        useOwnConsole?: boolean;
        options?: {
            env?: string;
            cwd?: string;
        }
    }

    /**
     * Used for storing project specific settings
     */
    interface ProjectConfiguration {
        version: string;
        name?: string;
        main?: string;
        src?: string;
        destPath?: string;
        buildOnSave?: boolean;
        customBuild?:RunExternal;
        customRun?:RunExternal;
        compiler: {
            useDefaultLib?: boolean;
            outFileOption?: string;
            emitComments?: boolean;
            generateDeclarationFiles?: boolean;
            mapSourceFiles?: boolean;
            codeGenTarget?: number;
            moduleGenTarget?: number;
        };
        editor: {
            newLineMode: string; //unix, windows, auto
            useSoftTabs: boolean;
            tabSize: number;
        };
        completionMode?: string; // strict, loose
    }

    interface Position {
        row: number;
        column: number;
    }

    class TypeInfo implements ts.TypeInfo {
        memberName: ts.MemberName;
        docComment: string;
        fullSymbolName: string;
        kind: string;
        minChar: number;
        limChar: number;
        description: string;
    }

    interface CompileResults {
        source: { fileName: string; content: string; }[];
        errors: FileRange[];
    }

    class NavigateToItem implements ts.NavigateToItem {
        name: string;
        kind: string;
        kindModifiers: string;
        matchKind: string;
        fileName: string;
        minChar: number;
        limChar: number;
        additionalSpans: ts.SpanInfo[];
        containerName: string;
        containerKind: string;
        range: Range;
    }
    
     

}
