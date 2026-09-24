import { Language } from '@/types';

export const LANGUAGES: Language[] = [
  // Top Popular Languages
  {
    id: 100,
    name: 'HTML / CSS / JS (Web)',
    mime: 'text/html',
    extension: 'html',
    defaultCode: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Interactive Web Preview</title>
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      padding: 2rem;
      background: #f8fafc;
      color: #0f172a;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 80vh;
      margin: 0;
    }
    .card {
      background: white;
      padding: 2rem;
      border-radius: 16px;
      box-shadow: 0 10px 25px -5px rgb(0 0 0 / 0.1);
      max-width: 440px;
      width: 100%;
      border: 1px solid #e2e8f0;
    }
    h2 {
      margin-top: 0;
      color: #1e293b;
      font-size: 1.5rem;
    }
    p {
      color: #64748b;
      font-size: 0.95rem;
      line-height: 1.5;
    }
    .btn {
      background: #2563eb;
      color: white;
      border: none;
      padding: 0.65rem 1.25rem;
      border-radius: 8px;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }
    .btn:hover {
      background: #1d4ed8;
    }
    #counter-display {
      margin-top: 1.25rem;
      padding: 0.75rem 1rem;
      background: #eff6ff;
      border-radius: 8px;
      color: #1d4ed8;
      font-weight: 600;
      font-size: 0.9rem;
    }
  </style>
</head>
<body>
  <div class="card">
    <h2>Interactive Web Preview 🚀</h2>
    <p>Live reload and console log inspection enabled. Click below to test!</p>
    <button class="btn" onclick="incrementCounter()">Click to Test Interaction</button>
    <div id="counter-display">Clicks: 0</div>
  </div>

  <script>
    let count = 0;
    function incrementCounter() {
      count++;
      document.getElementById('counter-display').textContent = 'Clicks: ' + count + ' (Updated at ' + new Date().toLocaleTimeString() + ')';
      console.log('User interaction logged! Current count is:', count);
    }
    console.log('Web Preview Loaded Successfully.');
  </script>
</body>
</html>
`
  },
  {
    id: 71,
    name: 'Python (3.8.1)',
    mime: 'text/x-python',
    extension: 'py',
    defaultCode: `# Python 3
def solve():
    # Write your solution here
    pass

if __name__ == '__main__':
    solve()
`
  },
  {
    id: 63,
    name: 'JavaScript (Node.js 12.14.0)',
    mime: 'text/javascript',
    extension: 'js',
    defaultCode: `// JavaScript (Node.js)
const fs = require('fs');

function solve() {
    // Write your solution here
}

solve();
`
  },
  {
    id: 74,
    name: 'TypeScript (3.7.4)',
    mime: 'text/typescript',
    extension: 'ts',
    defaultCode: `// TypeScript
function solve(): void {
    // Write your solution here
}

solve();
`
  },
  {
    id: 62,
    name: 'Java (OpenJDK 13.0.1)',
    mime: 'text/x-java',
    extension: 'java',
    defaultCode: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        // Write your solution here
    }
}
`
  },
  {
    id: 4,
    name: 'Java (OpenJDK 14.0.1)',
    mime: 'text/x-java',
    extension: 'java',
    defaultCode: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        // Write your solution here
    }
}
`
  },
  {
    id: 54,
    name: 'C++ (GCC 9.2.0)',
    mime: 'text/x-c++src',
    extension: 'cpp',
    defaultCode: `#include <iostream>

using namespace std;

int main() {
    // Write your solution here
    return 0;
}
`
  },
  {
    id: 50,
    name: 'C (GCC 9.2.0)',
    mime: 'text/x-csrc',
    extension: 'c',
    defaultCode: `#include <stdio.h>

int main() {
    // Write your solution here
    return 0;
}
`
  },
  {
    id: 51,
    name: 'C# (Mono 6.6.0.161)',
    mime: 'text/x-csharp',
    extension: 'cs',
    defaultCode: `using System;

class Program {
    static void Main() {
        // Write your solution here
    }
}
`
  },
  {
    id: 21,
    name: 'C# (.NET Core SDK 3.1.406)',
    mime: 'text/x-csharp',
    extension: 'cs',
    defaultCode: `using System;

class Program {
    static void Main() {
        // Write your solution here
    }
}
`
  },
  {
    id: 22,
    name: 'C# (Mono 6.12.0.122)',
    mime: 'text/x-csharp',
    extension: 'cs',
    defaultCode: `using System;

class Program {
    static void Main() {
        // Write your solution here
    }
}
`
  },
  {
    id: 60,
    name: 'Go (1.13.5)',
    mime: 'text/x-go',
    extension: 'go',
    defaultCode: `package main

import "fmt"

func main() {
    // Write your solution here
}
`
  },
  {
    id: 73,
    name: 'Rust (1.40.0)',
    mime: 'text/x-rustsrc',
    extension: 'rs',
    defaultCode: `fn main() {
    // Write your solution here
}
`
  },
  {
    id: 68,
    name: 'PHP (7.4.1)',
    mime: 'text/x-php',
    extension: 'php',
    defaultCode: `<?php
// Write your solution here
`
  },
  {
    id: 72,
    name: 'Ruby (2.7.0)',
    mime: 'text/x-ruby',
    extension: 'rb',
    defaultCode: `# Ruby
# Write your solution here
`
  },
  {
    id: 78,
    name: 'Kotlin (1.3.70)',
    mime: 'text/x-kotlin',
    extension: 'kt',
    defaultCode: `fun main() {
    // Write your solution here
}
`
  },
  {
    id: 83,
    name: 'Swift (5.2.3)',
    mime: 'text/x-swift',
    extension: 'swift',
    defaultCode: `import Foundation

// Write your solution here
`
  },
  {
    id: 82,
    name: 'SQL (SQLite 3.27.2)',
    mime: 'text/x-sql',
    extension: 'sql',
    defaultCode: `-- Write your SQL queries here
`
  },
  {
    id: 46,
    name: 'Bash (5.0.0)',
    mime: 'text/x-sh',
    extension: 'sh',
    defaultCode: `#!/bin/bash
# Write your bash script here
`
  },
  {
    id: 85,
    name: 'Perl (5.28.1)',
    mime: 'text/x-perl',
    extension: 'pl',
    defaultCode: `#!/usr/bin/perl
use strict;
use warnings;

# Write your solution here
`
  },
  {
    id: 80,
    name: 'R (4.0.0)',
    mime: 'text/x-rsrc',
    extension: 'r',
    defaultCode: `# R Language
# Write your solution here
`
  },
  {
    id: 64,
    name: 'Lua (5.3.5)',
    mime: 'text/x-lua',
    extension: 'lua',
    defaultCode: `-- Lua
-- Write your solution here
`
  },
  {
    id: 81,
    name: 'Scala (2.13.2)',
    mime: 'text/x-scala',
    extension: 'scala',
    defaultCode: `object Main extends App {
    // Write your solution here
}
`
  },
  {
    id: 61,
    name: 'Haskell (GHC 8.8.1)',
    mime: 'text/x-haskell',
    extension: 'hs',
    defaultCode: `main :: IO ()
main = do
    -- Write your solution here
    return ()
`
  },
  {
    id: 57,
    name: 'Elixir (1.9.4)',
    mime: 'text/x-elixir',
    extension: 'ex',
    defaultCode: `defmodule Main do
  def run do
    # Write your solution here
  end
end

Main.run()
`
  },
  {
    id: 58,
    name: 'Erlang (OTP 22.2)',
    mime: 'text/x-erlang',
    extension: 'erl',
    defaultCode: `-module(main).
-export([start/0]).

start() ->
    % Write your solution here
    ok.
`
  },
  {
    id: 86,
    name: 'Clojure (1.10.1)',
    mime: 'text/x-clojure',
    extension: 'clj',
    defaultCode: `(ns main)

(defn -main [& args]
  ;; Write your solution here
)
`
  },
  {
    id: 70,
    name: 'Python (2.7.17)',
    mime: 'text/x-python',
    extension: 'py',
    defaultCode: `# Python 2.7
# Write your solution here
`
  },
  {
    id: 10,
    name: 'Python for ML (3.7.7)',
    mime: 'text/x-python',
    extension: 'py',
    defaultCode: `# Python for ML
import numpy as np

# Write your solution here
`
  },
  {
    id: 75,
    name: 'C (Clang 7.0.1)',
    mime: 'text/x-csrc',
    extension: 'c',
    defaultCode: `#include <stdio.h>

int main() {
    // Write your solution here
    return 0;
}
`
  },
  {
    id: 13,
    name: 'C (Clang 9.0.1)',
    mime: 'text/x-csrc',
    extension: 'c',
    defaultCode: `#include <stdio.h>

int main() {
    // Write your solution here
    return 0;
}
`
  },
  {
    id: 1,
    name: 'C (Clang 10.0.1)',
    mime: 'text/x-csrc',
    extension: 'c',
    defaultCode: `#include <stdio.h>

int main() {
    // Write your solution here
    return 0;
}
`
  },
  {
    id: 48,
    name: 'C (GCC 7.4.0)',
    mime: 'text/x-csrc',
    extension: 'c',
    defaultCode: `#include <stdio.h>

int main() {
    // Write your solution here
    return 0;
}
`
  },
  {
    id: 49,
    name: 'C (GCC 8.3.0)',
    mime: 'text/x-csrc',
    extension: 'c',
    defaultCode: `#include <stdio.h>

int main() {
    // Write your solution here
    return 0;
}
`
  },
  {
    id: 76,
    name: 'C++ (Clang 7.0.1)',
    mime: 'text/x-c++src',
    extension: 'cpp',
    defaultCode: `#include <iostream>

using namespace std;

int main() {
    // Write your solution here
    return 0;
}
`
  },
  {
    id: 14,
    name: 'C++ (Clang 9.0.1)',
    mime: 'text/x-c++src',
    extension: 'cpp',
    defaultCode: `#include <iostream>

using namespace std;

int main() {
    // Write your solution here
    return 0;
}
`
  },
  {
    id: 2,
    name: 'C++ (Clang 10.0.1)',
    mime: 'text/x-c++src',
    extension: 'cpp',
    defaultCode: `#include <iostream>

using namespace std;

int main() {
    // Write your solution here
    return 0;
}
`
  },
  {
    id: 52,
    name: 'C++ (GCC 7.4.0)',
    mime: 'text/x-c++src',
    extension: 'cpp',
    defaultCode: `#include <iostream>

using namespace std;

int main() {
    // Write your solution here
    return 0;
}
`
  },
  {
    id: 53,
    name: 'C++ (GCC 8.3.0)',
    mime: 'text/x-c++src',
    extension: 'cpp',
    defaultCode: `#include <iostream>

using namespace std;

int main() {
    // Write your solution here
    return 0;
}
`
  },
  {
    id: 45,
    name: 'Assembly (NASM 2.14.02)',
    mime: 'text/x-asm',
    extension: 'asm',
    defaultCode: `section .data
section .text
    global _start
_start:
    ; Write your assembly solution here
    mov eax, 1
    mov ebx, 0
    int 0x80
`
  },
  {
    id: 47,
    name: 'Basic (FBC 1.07.1)',
    mime: 'text/x-basic',
    extension: 'bas',
    defaultCode: `' FreeBASIC
' Write your solution here
`
  },
  {
    id: 55,
    name: 'Common Lisp (SBCL 2.0.0)',
    mime: 'text/x-lisp',
    extension: 'lisp',
    defaultCode: `;; Common Lisp
;; Write your solution here
`
  },
  {
    id: 56,
    name: 'D (DMD 2.089.1)',
    mime: 'text/x-d',
    extension: 'd',
    defaultCode: `import std.stdio;

void main() {
    // Write your solution here
}
`
  },
  {
    id: 59,
    name: 'Fortran (GFortran 9.2.0)',
    mime: 'text/x-fortran',
    extension: 'f90',
    defaultCode: `program main
    ! Write your solution here
end program main
`
  },
  {
    id: 65,
    name: 'OCaml (4.09.0)',
    mime: 'text/x-ocaml',
    extension: 'ml',
    defaultCode: `(* OCaml *)
(* Write your solution here *)
`
  },
  {
    id: 66,
    name: 'Octave (5.1.0)',
    mime: 'text/x-octave',
    extension: 'm',
    defaultCode: `% GNU Octave
% Write your solution here
`
  },
  {
    id: 67,
    name: 'Pascal (FPC 3.0.4)',
    mime: 'text/x-pascal',
    extension: 'pas',
    defaultCode: `program Main;
begin
    { Write your solution here }
end.
`
  },
  {
    id: 77,
    name: 'COBOL (GnuCOBOL 2.2)',
    mime: 'text/x-cobol',
    extension: 'cob',
    defaultCode: `       IDENTIFICATION DIVISION.
       PROGRAM-ID. MAIN.
       PROCEDURE DIVISION.
           STOP RUN.
`
  },
  {
    id: 84,
    name: 'Visual Basic.Net (vbnc 0.0.0.5943)',
    mime: 'text/x-vb',
    extension: 'vb',
    defaultCode: `Imports System

Module Program
    Sub Main()
        ' Write your solution here
    End Sub
End Module
`
  },
  {
    id: 87,
    name: 'F# (.NET Core SDK 3.1.202)',
    mime: 'text/x-fsharp',
    extension: 'fs',
    defaultCode: `open System

// Write your solution here
`
  },
  {
    id: 24,
    name: 'F# (.NET Core SDK 3.1.406)',
    mime: 'text/x-fsharp',
    extension: 'fsx',
    defaultCode: `open System

// Write your solution here
`
  },
  {
    id: 88,
    name: 'Groovy (3.0.3)',
    mime: 'text/x-groovy',
    extension: 'groovy',
    defaultCode: `// Groovy
// Write your solution here
`
  },
  {
    id: 89,
    name: 'Prolog (GNU Prolog 1.4.5)',
    mime: 'text/x-prolog',
    extension: 'pro',
    defaultCode: `% Prolog
% Write your solution here
`
  },
  {
    id: 79,
    name: 'Objective-C (Clang 7.0.1)',
    mime: 'text/x-objectivec',
    extension: 'm',
    defaultCode: `#import <Foundation/Foundation.h>

int main(int argc, const char * argv[]) {
    @autoreleasepool {
        // Write your solution here
    }
    return 0;
}
`
  },
  {
    id: 9,
    name: 'Nim (stable)',
    mime: 'text/x-nim',
    extension: 'nim',
    defaultCode: `# Nim
# Write your solution here
`
  },
  {
    id: 90,
    name: 'Dart (2.19.6)',
    mime: 'text/x-dart',
    extension: 'dart',
    defaultCode: `void main() {
  // Write your solution here
}
`
  },
  {
    id: 3,
    name: 'C3 (latest)',
    mime: 'text/x-c',
    extension: 'c3',
    defaultCode: `module main;

fn int main() {
    // Write your solution here
    return 0;
}
`
  },
  {
    id: 11,
    name: 'Bosque (latest)',
    mime: 'text/plain',
    extension: 'bsq',
    defaultCode: `// Bosque
entrypoint function main(): Int {
    return 0;
}
`
  },
  {
    id: 69,
    name: 'Plain Text',
    mime: 'text/plain',
    extension: 'txt',
    defaultCode: ``
  }
];

export const getLanguageById = (id: number): Language | undefined => {
  return LANGUAGES.find(lang => lang.id === id);
};

export const getLanguageByName = (name: string): Language | undefined => {
  return LANGUAGES.find(lang => lang.name.toLowerCase().includes(name.toLowerCase()));
};

export const getMonacoLanguage = (languageId: number): string => {
  const languageMap: Record<number, string> = {
    71: 'python',
    70: 'python',
    10: 'python',
    63: 'javascript',
    74: 'typescript',
    62: 'java',
    4: 'java',
    54: 'cpp',
    52: 'cpp',
    53: 'cpp',
    76: 'cpp',
    14: 'cpp',
    2: 'cpp',
    50: 'c',
    48: 'c',
    49: 'c',
    75: 'c',
    13: 'c',
    1: 'c',
    3: 'c',
    51: 'csharp',
    21: 'csharp',
    22: 'csharp',
    60: 'go',
    73: 'rust',
    68: 'php',
    72: 'ruby',
    78: 'kotlin',
    83: 'swift',
    82: 'sql',
    46: 'shell',
    85: 'perl',
    80: 'r',
    64: 'lua',
    81: 'scala',
    61: 'haskell',
    57: 'elixir',
    86: 'clojure',
    87: 'fsharp',
    24: 'fsharp',
    59: 'fortran',
    67: 'pascal',
    56: 'd',
    9: 'nim',
    90: 'dart',
    88: 'groovy',
    79: 'objective-c',
    84: 'vb',
    20: 'vb',
    100: 'html',
    69: 'plaintext'
  };
  
  return languageMap[languageId] || 'plaintext';
};

export const SUPPORTED_LANGUAGES = {
  html: { pistonId: 100, name: 'HTML / CSS / JS (Web)', extension: 'html' },
  python: { pistonId: 71, name: 'Python 3', extension: 'py' },
  javascript: { pistonId: 63, name: 'JavaScript (Node.js)', extension: 'js' },
  typescript: { pistonId: 74, name: 'TypeScript', extension: 'ts' },
  java: { pistonId: 62, name: 'Java', extension: 'java' },
  cpp: { pistonId: 54, name: 'C++', extension: 'cpp' },
  c: { pistonId: 50, name: 'C', extension: 'c' },
  csharp: { pistonId: 51, name: 'C#', extension: 'cs' },
  go: { pistonId: 60, name: 'Go', extension: 'go' },
  rust: { pistonId: 73, name: 'Rust', extension: 'rs' },
  php: { pistonId: 68, name: 'PHP', extension: 'php' },
  ruby: { pistonId: 72, name: 'Ruby', extension: 'rb' },
  kotlin: { pistonId: 78, name: 'Kotlin', extension: 'kt' },
  swift: { pistonId: 83, name: 'Swift', extension: 'swift' },
  sql: { pistonId: 82, name: 'SQL', extension: 'sql' },
  bash: { pistonId: 46, name: 'Bash', extension: 'sh' },
  perl: { pistonId: 85, name: 'Perl', extension: 'pl' },
  r: { pistonId: 80, name: 'R', extension: 'r' },
  lua: { pistonId: 64, name: 'Lua', extension: 'lua' },
  scala: { pistonId: 81, name: 'Scala', extension: 'scala' },
  haskell: { pistonId: 61, name: 'Haskell', extension: 'hs' }
} as const;
