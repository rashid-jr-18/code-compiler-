import { Language } from '@/types';

export const LANGUAGES: Language[] = [
  {
    id: 63,
    name: 'JavaScript (Node.js)',
    mime: 'text/javascript',
    extension: 'js',
    defaultCode: `// JavaScript (Node.js) Example
console.log("Hello, World!");

// Basic function
function greet(name) {
    return \`Hello, \${name}!\`;
}

console.log(greet("Brightspace"));`,
  },
  {
    id: 71,
    name: 'Python 3',
    mime: 'text/x-python',
    extension: 'py',
    defaultCode: `# Python 3 Example
print("Hello, World!")

# Basic function
def greet(name):
    return f"Hello, {name}!"

print(greet("Brightspace"))

# List comprehension example
numbers = [1, 2, 3, 4, 5]
squares = [x**2 for x in numbers]
print(f"Squares: {squares}")`,
  },
  {
    id: 62,
    name: 'Java',
    mime: 'text/x-java',
    extension: 'java',
    defaultCode: `// Java Example
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
        
        // Basic method
        String greeting = greet("Brightspace");
        System.out.println(greeting);
    }
    
    public static String greet(String name) {
        return "Hello, " + name + "!";
    }
}`,
  },
  {
    id: 54,
    name: 'C++',
    mime: 'text/x-c++src',
    extension: 'cpp',
    defaultCode: `// C++ Example
#include <iostream>
#include <string>
using namespace std;

string greet(const string& name) {
    return "Hello, " + name + "!";
}

int main() {
    cout << "Hello, World!" << endl;
    cout << greet("Brightspace") << endl;
    return 0;
}`,
  },
  {
    id: 50,
    name: 'C',
    mime: 'text/x-csrc',
    extension: 'c',
    defaultCode: `// C Example
#include <stdio.h>
#include <string.h>

void greet(const char* name) {
    printf("Hello, %s!\\n", name);
}

int main() {
    printf("Hello, World!\\n");
    greet("Brightspace");
    return 0;
}`,
  },
  {
    id: 51,
    name: 'C#',
    mime: 'text/x-csharp',
    extension: 'cs',
    defaultCode: `// C# Example
using System;

class Program {
    static void Main() {
        Console.WriteLine("Hello, World!");
        Console.WriteLine(Greet("Brightspace"));
    }
    
    static string Greet(string name) {
        return $"Hello, {name}!";
    }
}`,
  },
  {
    id: 78,
    name: 'Kotlin',
    mime: 'text/x-kotlin',
    extension: 'kt',
    defaultCode: `// Kotlin Example
fun main() {
    println("Hello, World!")
    println(greet("Brightspace"))
}

fun greet(name: String): String {
    return "Hello, \$name!"
}`,
  },
  {
    id: 68,
    name: 'PHP',
    mime: 'text/x-php',
    extension: 'php',
    defaultCode: `<?php
// PHP Example
echo "Hello, World!\\n";

function greet($name) {
    return "Hello, " . $name . "!";
}

echo greet("Brightspace") . "\\n";
?>`,
  },
  {
    id: 72,
    name: 'Ruby',
    mime: 'text/x-ruby',
    extension: 'rb',
    defaultCode: `# Ruby Example
puts "Hello, World!"

def greet(name)
  "Hello, #{name}!"
end

puts greet("Brightspace")`,
  },
  {
    id: 73,
    name: 'Rust',
    mime: 'text/x-rustsrc',
    extension: 'rs',
    defaultCode: `// Rust Example
fn main() {
    println!("Hello, World!");
    println!("{}", greet("Brightspace"));
}

fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}`,
  },
];

export const getLanguageById = (id: number): Language | undefined => {
  return LANGUAGES.find(lang => lang.id === id);
};

export const getLanguageByName = (name: string): Language | undefined => {
  return LANGUAGES.find(lang => lang.name === name);
};
