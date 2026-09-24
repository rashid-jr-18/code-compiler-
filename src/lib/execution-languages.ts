export interface LanguageExecutionConfig {
  name: string;
  extension: string;
  compile_cmd?: string;
  run_cmd: string;
}

export const EXECUTION_LANGUAGES: Record<number, LanguageExecutionConfig> = {
  // Python Variants
  71: { name: 'Python (3.8.1)', extension: 'py', run_cmd: 'python3 Main.py' },
  70: { name: 'Python (2.7.17)', extension: 'py', run_cmd: 'python3 Main.py' },
  10: { name: 'Python for ML (3.7.7)', extension: 'py', run_cmd: 'python3 Main.py' },

  // JavaScript & TypeScript
  63: { name: 'JavaScript (Node.js 12.14.0)', extension: 'js', run_cmd: 'node Main.js' },
  74: { name: 'TypeScript (3.7.4)', extension: 'ts', run_cmd: 'node Main.ts' },

  // Java
  62: { name: 'Java (OpenJDK 13.0.1)', extension: 'java', compile_cmd: 'javac Main.java', run_cmd: 'java Main' },
  4: { name: 'Java (OpenJDK 14.0.1)', extension: 'java', compile_cmd: 'javac Main.java', run_cmd: 'java Main' },

  // C++ Variants
  54: { name: 'C++ (GCC 9.2.0)', extension: 'cpp', compile_cmd: 'g++ -O2 -o program Main.cpp', run_cmd: './program' },
  53: { name: 'C++ (GCC 8.3.0)', extension: 'cpp', compile_cmd: 'g++ -O2 -o program Main.cpp', run_cmd: './program' },
  52: { name: 'C++ (GCC 7.4.0)', extension: 'cpp', compile_cmd: 'g++ -O2 -o program Main.cpp', run_cmd: './program' },
  76: { name: 'C++ (Clang 7.0.1)', extension: 'cpp', compile_cmd: 'g++ -O2 -o program Main.cpp', run_cmd: './program' },
  14: { name: 'C++ (Clang 9.0.1)', extension: 'cpp', compile_cmd: 'g++ -O2 -o program Main.cpp', run_cmd: './program' },
  2: { name: 'C++ (Clang 10.0.1)', extension: 'cpp', compile_cmd: 'g++ -O2 -o program Main.cpp', run_cmd: './program' },

  // C Variants
  50: { name: 'C (GCC 9.2.0)', extension: 'c', compile_cmd: 'gcc -O2 -o program Main.c', run_cmd: './program' },
  49: { name: 'C (GCC 8.3.0)', extension: 'c', compile_cmd: 'gcc -O2 -o program Main.c', run_cmd: './program' },
  48: { name: 'C (GCC 7.4.0)', extension: 'c', compile_cmd: 'gcc -O2 -o program Main.c', run_cmd: './program' },
  75: { name: 'C (Clang 7.0.1)', extension: 'c', compile_cmd: 'gcc -O2 -o program Main.c', run_cmd: './program' },
  13: { name: 'C (Clang 9.0.1)', extension: 'c', compile_cmd: 'gcc -O2 -o program Main.c', run_cmd: './program' },
  1: { name: 'C (Clang 10.0.1)', extension: 'c', compile_cmd: 'gcc -O2 -o program Main.c', run_cmd: './program' },
  3: { name: 'C3 (latest)', extension: 'c3', compile_cmd: 'gcc -O2 -o program Main.c3', run_cmd: './program' },

  // C# Variants
  51: { name: 'C# (Mono 6.6.0.161)', extension: 'cs', compile_cmd: 'mcs -out:program.exe Main.cs', run_cmd: 'mono program.exe' },
  22: { name: 'C# (Mono 6.12.0.122)', extension: 'cs', compile_cmd: 'mcs -out:program.exe Main.cs', run_cmd: 'mono program.exe' },
  21: { name: 'C# (.NET Core SDK 3.1.406)', extension: 'cs', compile_cmd: 'mcs -out:program.exe Main.cs', run_cmd: 'mono program.exe' },

  // Go, Rust, PHP, Ruby
  60: { name: 'Go (1.13.5)', extension: 'go', run_cmd: 'go run Main.go' },
  73: { name: 'Rust (1.40.0)', extension: 'rs', compile_cmd: 'rustc -o program Main.rs', run_cmd: './program' },
  68: { name: 'PHP (7.4.1)', extension: 'php', run_cmd: 'php Main.php' },
  72: { name: 'Ruby (2.7.0)', extension: 'rb', run_cmd: 'ruby Main.rb' },

  // Shell & Scripting
  46: { name: 'Bash (5.0.0)', extension: 'sh', run_cmd: 'bash Main.sh' },
  85: { name: 'Perl (5.28.1)', extension: 'pl', run_cmd: 'perl Main.pl' },
  64: { name: 'Lua (5.3.5)', extension: 'lua', run_cmd: 'lua Main.lua' },
  80: { name: 'R (4.0.0)', extension: 'r', run_cmd: 'Rscript Main.r' },
  82: { name: 'SQL (SQLite 3.27.2)', extension: 'sql', run_cmd: 'sqlite3 :memory: < Main.sql' },

  // Modern / Compiled
  78: { name: 'Kotlin (1.3.70)', extension: 'kt', compile_cmd: 'kotlinc Main.kt -include-runtime -d Main.jar', run_cmd: 'java -jar Main.jar' },
  83: { name: 'Swift (5.2.3)', extension: 'swift', run_cmd: 'swift Main.swift' },
  81: { name: 'Scala (2.13.2)', extension: 'scala', run_cmd: 'scala Main.scala' },
  61: { name: 'Haskell (GHC 8.8.1)', extension: 'hs', run_cmd: 'runghc Main.hs' },
  57: { name: 'Elixir (1.9.4)', extension: 'ex', run_cmd: 'elixir Main.ex' },
  58: { name: 'Erlang (OTP 22.2)', extension: 'erl', run_cmd: 'escript Main.erl' },
  86: { name: 'Clojure (1.10.1)', extension: 'clj', run_cmd: 'clojure Main.clj' },
  87: { name: 'F# (.NET Core SDK 3.1.202)', extension: 'fs', run_cmd: 'dotnet fsi Main.fs' },
  24: { name: 'F# (.NET Core SDK 3.1.406)', extension: 'fsx', run_cmd: 'dotnet fsi Main.fsx' },
  59: { name: 'Fortran (GFortran 9.2.0)', extension: 'f90', compile_cmd: 'gfortran -o program Main.f90', run_cmd: './program' },
  67: { name: 'Pascal (FPC 3.0.4)', extension: 'pas', compile_cmd: 'fpc Main.pas', run_cmd: './Main' },
  56: { name: 'D (DMD 2.089.1)', extension: 'd', compile_cmd: 'dmd -of=program Main.d', run_cmd: './program' },
  9: { name: 'Nim (stable)', extension: 'nim', run_cmd: 'nim compile --run Main.nim' },
  90: { name: 'Dart (2.19.6)', extension: 'dart', run_cmd: 'dart run Main.dart' },
  88: { name: 'Groovy (3.0.3)', extension: 'groovy', run_cmd: 'groovy Main.groovy' },
  79: { name: 'Objective-C (Clang 7.0.1)', extension: 'm', compile_cmd: 'gcc -o program Main.m -lobjc', run_cmd: './program' },
  84: { name: 'Visual Basic.Net (vbnc 0.0.0.5943)', extension: 'vb', compile_cmd: 'vbnc -out:program.exe Main.vb', run_cmd: 'mono program.exe' },
  20: { name: 'Visual Basic.Net (vbnc 0.0.0.5943 Extra)', extension: 'vb', compile_cmd: 'vbnc -out:program.exe Main.vb', run_cmd: 'mono program.exe' },
  89: { name: 'Prolog (GNU Prolog 1.4.5)', extension: 'pro', run_cmd: 'gprolog --consult-file Main.pro' },
  77: { name: 'COBOL (GnuCOBOL 2.2)', extension: 'cob', compile_cmd: 'cobc -x -o program Main.cob', run_cmd: './program' },
  55: { name: 'Common Lisp (SBCL 2.0.0)', extension: 'lisp', run_cmd: 'sbcl --script Main.lisp' },
  45: { name: 'Assembly (NASM 2.14.02)', extension: 'asm', compile_cmd: 'nasm -f elf64 -o Main.o Main.asm && ld -o program Main.o', run_cmd: './program' },
  47: { name: 'Basic (FBC 1.07.1)', extension: 'bas', compile_cmd: 'fbc Main.bas', run_cmd: './Main' },
  65: { name: 'OCaml (4.09.0)', extension: 'ml', run_cmd: 'ocaml Main.ml' },
  66: { name: 'Octave (5.1.0)', extension: 'm', run_cmd: 'octave Main.m' },
  11: { name: 'Bosque (latest)', extension: 'bsq', run_cmd: 'node Main.bsq' },
  69: { name: 'Plain Text', extension: 'txt', run_cmd: 'cat Main.txt' }
};

export const getExecutionConfig = (languageId: number): LanguageExecutionConfig => {
  return EXECUTION_LANGUAGES[languageId] || EXECUTION_LANGUAGES[71]; // Default to Python 3
};

