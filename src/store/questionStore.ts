import { create } from 'zustand';
import { Question, TestCase, Submission, QuestionFilter } from '@/types';

export interface D2LContext {
  id?: string;
  [key: string]: unknown;
}

interface QuestionStore {
  questions: Question[];
  currentQuestion: Question | null;
  submissions: Submission[];
  
  setQuestions: (questions: Question[]) => void;
  addQuestion: (question: Question) => void;
  updateQuestion: (id: string, updatedQuestion: Partial<Question>) => void;
  deleteQuestion: (id: string) => void;
  setCurrentQuestion: (question: Question | null) => void;
  addSubmission: (submission: Submission) => void;
  getQuestionById: (id: string) => Question | undefined;
  getQuestionsByCategory: (category: string) => Question[];
  getQuestionsByDifficulty: (difficulty: string) => Question[];
  
  // Filter and search functionality
  filter: QuestionFilter;
  setFilter: (filter: Partial<QuestionFilter>) => void;
  getFilteredQuestions: () => Question[];
  getAllCategories: () => string[];
  getAllTags: () => string[];
  
  // D2L Integration
  assignmentContext: D2LContext | null;
  quizContext: D2LContext | null;
  setAssignmentContext: (context: D2LContext | null) => void;
  setQuizContext: (context: D2LContext | null) => void;
  clearD2LContext: () => void;
}

export const sampleQuestions: Question[] = [
  {
    "id": "13",
    "title": "Permutations",
    "description": "Given a collection of distinct integers, return all possible permutations.",
    "difficulty": "Medium",
    "category": "Backtracking",
    "supportedLanguages": [], // Any Language
    "testCases": [
      {
        "id": "tc1",
        "input": "[1,2,3]",
        "expectedOutput": "[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]",
        "points": 20,
        "description": "Sample Case 1: [1,2,3]",
        "isHidden": false
      },
      {
        "id": "tc2",
        "input": "[0,1]",
        "expectedOutput": "[[0,1],[1,0]]",
        "points": 20,
        "description": "Sample Case 2: [0,1]",
        "isHidden": false
      },
      {
        "id": "tc3",
        "input": "[1]",
        "expectedOutput": "[[1]]",
        "points": 30,
        "description": "Critical Boundary: Single element",
        "isHidden": true
      },
      {
        "id": "tc4",
        "input": "[5,4,6]",
        "expectedOutput": "[[4,5,6],[4,6,5],[5,4,6],[5,6,4],[6,4,5],[6,5,4]]",
        "points": 30,
        "description": "Constraint & Edge: Distinct unordered elements",
        "isHidden": true
      }
    ],
    "timeLimit": 10,
    "memoryLimit": 64,
    "sampleInput": "[1,2,3]",
    "sampleOutput": "[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]",
    "tags": ["backtracking"],
    "createdAt": new Date(),
    "updatedAt": new Date()
  },
  {
    "id": "14",
    "title": "Unique Paths",
    "description": "A robot is located at the top-left corner of a m x n grid. The robot can only move either down or right at any point in time. The robot is trying to reach the bottom-right corner of the grid. How many possible unique paths are there?",
    "difficulty": "Medium",
    "category": "Dynamic Programming",
    "supportedLanguages": [], // Any Language
    "testCases": [
      {
        "id": "tc1",
        "input": "3 7",
        "expectedOutput": "28",
        "points": 40,
        "description": "3x7 grid"
      },
      {
        "id": "tc2",
        "input": "3 2",
        "expectedOutput": "3",
        "points": 20,
        "description": "3x2 grid"
      },
      {
        "id": "tc3",
        "input": "7 3",
        "expectedOutput": "28",
        "points": 20,
        "description": "7x3 grid"
      }
    ],
    "timeLimit": 8,
    "memoryLimit": 128,
    "sampleInput": "3 7",
    "sampleOutput": "28",
    "tags": ["dynamic-programming", "combinatorics"],
    "createdAt": new Date(),
    "updatedAt": new Date()
  },
  {
    "id": "15",
    "title": "Rotate Image",
    "description": "You are given an n x n 2D matrix representing an image, rotate the image by 90 degrees (clockwise) in-place.",
    "difficulty": "Medium",
    "category": "Matrix",
    "supportedLanguages": [], // Any Language
    "testCases": [
      {
        "id": "tc1",
        "input": "[[1,2,3],[4,5,6],[7,8,9]]",
        "expectedOutput": "[[7,4,1],[8,5,2],[9,6,3]]",
        "points": 40,
        "description": "3x3 matrix"
      },
      {
        "id": "tc2",
        "input": "[[5,1,9,11],[2,4,8,10],[13,3,6,7],[15,14,12,16]]",
        "expectedOutput": "[[15,13,2,5],[14,3,4,1],[12,6,8,9],[16,7,10,11]]",
        "points": 20,
        "description": "4x4 matrix"
      }
    ],
    "timeLimit": 10,
    "memoryLimit": 128,
    "sampleInput": "[[1,2,3],[4,5,6],[7,8,9]]",
    "sampleOutput": "[[7,4,1],[8,5,2],[9,6,3]]",
    "tags": ["matrix", "rotation"],
    "createdAt": new Date(),
    "updatedAt": new Date()
  },
  {
    "id": "16",
    "title": "Word Search",
    "description": "Given a 2D board and a word, find if the word exists in the grid. The word can be constructed from letters of sequentially adjacent cells, where adjacent cells are horizontally or vertically neighboring. The same letter cell may not be used more than once.",
    "difficulty": "Medium",
    "category": "Backtracking",
    "supportedLanguages": [], // Any Language
    "testCases": [
      {
        "id": "tc1",
        "input": "[['A','B','C','E'],['S','F','C','S'],['A','D','E','E']]\nABCCED",
        "expectedOutput": "true",
        "points": 40,
        "description": "Word found"
      },
      {
        "id": "tc2",
        "input": "[['A','B','C','E'],['S','F','C','S'],['A','D','E','E']]\nSEE",
        "expectedOutput": "true",
        "points": 20,
        "description": "Word found, different path"
      },
      {
        "id": "tc3",
        "input": "[['A','B','C','E'],['S','F','C','S'],['A','D','E','E']]\nABCB",
        "expectedOutput": "false",
        "points": 20,
        "description": "Word not found"
      }
    ],
    "timeLimit": 12,
    "memoryLimit": 128,
    "sampleInput": "[['A','B','C','E'],['S','F','C','S'],['A','D','E','E']]\nABCCED",
    "sampleOutput": "true",
    "tags": ["backtracking", "matrix"],
    "createdAt": new Date(),
    "updatedAt": new Date()
  },
  {
    id: '10',
    title: 'Reverse Linked List',
    description: `Given the head of a singly linked list, reverse the list, and return the reversed list.

**Example 1:**
Input: head = [1,2,3,4,5]
Output: [5,4,3,2,1]

**Example 2:**
Input: head = [1,2]
Output: [2,1]

**Example 3:**
Input: head = []
Output: []`,
    difficulty: 'Easy',
    category: 'Linked List',
    supportedLanguages: [], // Any Language
    testCases: [
      {
        id: 'tc1',
        input: '[1,2,3,4,5]',
        expectedOutput: '[5,4,3,2,1]',
        points: 25,
        description: 'Multiple elements'
      },
      {
        id: 'tc2',
        input: '[1,2]',
        expectedOutput: '[2,1]',
        points: 25,
        description: 'Two elements'
      },
      {
        id: 'tc3',
        input: '[]',
        expectedOutput: '[]',
        points: 25,
        description: 'Empty list'
      },
      {
        id: 'tc4',
        input: '[1]',
        expectedOutput: '[1]',
        points: 25,
        description: 'Single element',
        isHidden: true
      }
    ],
    timeLimit: 5,
    memoryLimit: 64,
    sampleInput: '[1,2,3,4,5]',
    sampleOutput: '[5,4,3,2,1]',
    tags: ['linked-list', 'recursion'],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '11',
    title: 'Find First and Last Position of Element in Sorted Array',
    description: `Given an array of integers nums sorted in non-decreasing order, find the starting and ending position of a given target value.

If target is not found in the array, return [-1, -1].

You must write an algorithm with O(log n) runtime complexity.

**Example 1:**
Input: nums = [5,7,7,8,8,8,10], target = 8
Output: [3,5]

**Example 2:**
Input: nums = [5,7,7,8,8,8,10], target = 6
Output: [-1,-1]

**Example 3:**
Input: nums = [], target = 0
Output: [-1,-1]`,
    difficulty: 'Medium',
    category: 'Binary Search',
    supportedLanguages: [], // Any Language
    testCases: [
      {
        id: 'tc1',
        input: '[5,7,7,8,8,8,10]\n8',
        expectedOutput: '[3,5]',
        points: 30,
        description: 'Target found multiple times'
      },
      {
        id: 'tc2',
        input: '[5,7,7,8,8,8,10]\n6',
        expectedOutput: '[-1,-1]',
        points: 30,
        description: 'Target not found'
      },
      {
        id: 'tc3',
        input: '[]\n0',
        expectedOutput: '[-1,-1]',
        points: 20,
        description: 'Empty array'
      },
      {
        id: 'tc4',
        input: '[1]\n1',
        expectedOutput: '[0,0]',
        points: 20,
        description: 'Single element match',
        isHidden: true
      }
    ],
    timeLimit: 8,
    memoryLimit: 128,
    sampleInput: '[5,7,7,8,8,8,10]\n8',
    sampleOutput: '[3,5]',
    tags: ['binary-search', 'array'],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '12',
    title: 'Group Anagrams',
    description: `Given an array of strings strs, group the anagrams together. You can return the answer in any order.

An Anagram is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.

**Example 1:**
Input: strs = ["eat","tea","tan","ate","nat","bat"]
Output: [["bat"],["nat","tan"],["ate","eat","tea"]]

**Example 2:**
Input: strs = [""]
Output: [[""]]

**Example 3:**
Input: strs = ["a"]
Output: [["a"]]`,
    difficulty: 'Medium',
    category: 'Hash Table',
    supportedLanguages: [], // Any Language
    testCases: [
      {
        id: 'tc1',
        input: '["eat","tea","tan","ate","nat","bat"]',
        expectedOutput: '[["bat"],["nat","tan"],["ate","eat","tea"]]',
        points: 30,
        description: 'Multiple anagram groups'
      },
      {
        id: 'tc2',
        input: '[""]',
        expectedOutput: '[[""]]',
        points: 30,
        description: 'Empty string'
      },
      {
        id: 'tc3',
        input: '["a"]',
        expectedOutput: '[["a"]]',
        points: 20,
        description: 'Single character'
      },
      {
        id: 'tc4',
        input: '["abc","bca","cab","xyz"]',
        expectedOutput: '[["abc","bca","cab"],["xyz"]]',
        points: 20,
        description: 'Mixed groups',
        isHidden: true
      }
    ],
    timeLimit: 10,
    memoryLimit: 256,
    sampleInput: '["eat","tea","tan","ate","nat","bat"]',
    sampleOutput: '[["bat"],["nat","tan"],["ate","eat","tea"]]',
    tags: ['hash-table', 'string', 'sorting'],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '39',
    title: 'Combination Sum',
    description: `Given an array of distinct integers candidates and a target integer target, return a list of all unique combinations of candidates where the chosen numbers sum to target. You may return the combinations in any order.

The same number may be chosen from candidates an unlimited number of times. Two combinations are unique if the frequency of at least one of the chosen numbers is different.

The test cases are generated such that the number of unique combinations that sum up to target is less than 150 combinations for the given input.

**Example 1:**
Input: candidates = [2,3,6,7], target = 7
Output: [[2,2,3],[7]]
Explanation: 2 and 3 are candidates, and 2 + 2 + 3 = 7. Note that 2 can be used multiple times. 7 is a candidate, and 7 = 7. These are the only two combinations.

**Example 2:**
Input: candidates = [2,3,5], target = 8
Output: [[2,2,2,2],[2,3,3],[3,5]]

**Example 3:**
Input: candidates = [2], target = 1
Output: []

**Constraints:**
- 1 <= candidates.length <= 30
- 2 <= candidates[i] <= 40
- All elements of candidates are distinct.
- 1 <= target <= 40`,
    difficulty: 'Medium',
    category: 'Backtracking',
    supportedLanguages: [],
    testCases: [
      {
        id: 'tc1',
        input: '[2,3,6,7]\n7',
        expectedOutput: '[[2,2,3],[7]]',
        points: 20,
        description: 'Sample Case 1: candidates = [2,3,6,7], target = 7',
        isHidden: false
      },
      {
        id: 'tc2',
        input: '[2,3,5]\n8',
        expectedOutput: '[[2,2,2,2],[2,3,3],[3,5]]',
        points: 20,
        description: 'Sample Case 2: candidates = [2,3,5], target = 8',
        isHidden: false
      },
      {
        id: 'tc3',
        input: '[2]\n1',
        expectedOutput: '[]',
        points: 30,
        description: 'Critical Boundary: target less than candidates',
        isHidden: true
      },
      {
        id: 'tc4',
        input: '[1]\n2',
        expectedOutput: '[[1,1]]',
        points: 30,
        description: 'Constraint Limit & Repetition: single element repeated',
        isHidden: true
      }
    ],
    timeLimit: 5,
    memoryLimit: 128,
    sampleInput: '[2,3,6,7]\n7',
    sampleOutput: '[[2,2,3],[7]]',
    tags: ['backtracking', 'array'],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "17",
    title: "Two Sum",
    description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
    difficulty: "Easy",
    category: "Array",
    supportedLanguages: [],
    testCases: [
      {
        id: "tc1",
        input: "[2,7,11,15]\n9",
        expectedOutput: "[0,1]",
        points: 20,
        description: "Sample Case 1: Simple pair",
        isHidden: false
      },
      {
        id: "tc2",
        input: "[3,2,4]\n6",
        expectedOutput: "[1,2]",
        points: 20,
        description: "Sample Case 2: Indices not at start",
        isHidden: false
      },
      {
        id: "tc3",
        input: "[3,3]\n6",
        expectedOutput: "[0,1]",
        points: 30,
        description: "Critical Boundary: Duplicate identical elements",
        isHidden: true
      },
      {
        id: "tc4",
        input: "[-1,-2,-3,-4,-5]\n-8",
        expectedOutput: "[2,4]",
        points: 30,
        description: "Constraint Limit: Negative integers",
        isHidden: true
      }
    ],
    timeLimit: 5,
    memoryLimit: 64,
    sampleInput: "[2,7,11,15]\n9",
    sampleOutput: "[0,1]",
    tags: ["array","hash-table"],
    createdAt: new Date("2025-08-05T06:45:15.361Z"),
    updatedAt: new Date("2025-08-05T06:45:15.361Z")
  },
  {
    id: "18",
    title: "Add Two Numbers",
    description: "You are given two non-empty linked lists representing two non-negative integers. The digits are stored in reverse order...",
    difficulty: "Medium",
    category: "Linked List",
    supportedLanguages: [],
    testCases: [{"id":"tc1","input":"[2,4,3]\n[5,6,4]","expectedOutput":"[7,0,8]","points":50,"description":"Addition of linked list numbers"}],
    timeLimit: 6,
    memoryLimit: 128,
    sampleInput: "[2,4,3]\n[5,6,4]",
    sampleOutput: "[7,0,8]",
    tags: ["linked-list","math"],
    createdAt: new Date("2025-08-05T06:45:15.362Z"),
    updatedAt: new Date("2025-08-05T06:45:15.362Z")
  },
  {
    id: "q_sql_185",
    title: "185. Department Top Three Salaries",
    description: "Table: Employee\n\n+--------------+---------+\n| Column Name  | Type    |\n+--------------+---------+\n| id           | int     |\n| name         | varchar |\n| salary       | int     |\n| departmentId | int     |\n+--------------+---------+\nid is the primary key for this table.\ndepartmentId is a foreign key of the ID from the Department table.\n\nTable: Department\n\n+-------------+---------+\n| Column Name | Type    |\n+-------------+---------+\n| id          | int     |\n| name        | varchar |\n+-------------+---------+\nid is the primary key for this table.\n\nA company's executives are interested in seeing who earns the most money in each of the company's departments. A high earner in a department is an employee who has a salary in the top three unique salaries for that department.\n\nWrite a solution to find the employees who are high earners in each of the departments.\n\nReturn the result table in any order.",
    difficulty: "Hard",
    category: "Database & SQL",
    supportedLanguages: [],
    testCases: [
      {
        id: "tc1",
        input: "Employee: [[1,'Joe',85000,1],[2,'Henry',80000,2],[3,'Sam',60000,2],[4,'Max',90000,1],[5,'Janet',69000,1],[6,'Randy',85000,1],[7,'Will',70000,1]]\nDepartment: [[1,'IT'],[2,'Sales']]",
        expectedOutput: "[['IT','Max',90000],['IT','Joe',85000],['IT','Randy',85000],['IT','Will',70000],['Sales','Henry',80000],['Sales','Sam',60000]]",
        points: 40,
        description: "Department top 3 earners with tie handling"
      },
      {
        id: "tc2",
        input: "Employee: [[1,'Alice',50000,1],[2,'Bob',60000,1]]\nDepartment: [[1,'HR']]",
        expectedOutput: "[['HR','Bob',60000],['HR','Alice',50000]]",
        points: 30,
        description: "Department with fewer than 3 employees"
      },
      {
        id: "tc3",
        input: "Employee: []\nDepartment: [[1,'Marketing']]",
        expectedOutput: "[]",
        points: 30,
        description: "Empty records"
      }
    ],
    timeLimit: 10,
    memoryLimit: 128,
    sampleInput: "Employee: [[1,'Joe',85000,1],[2,'Henry',80000,2],[3,'Sam',60000,2],[4,'Max',90000,1],[5,'Janet',69000,1],[6,'Randy',85000,1],[7,'Will',70000,1]]\nDepartment: [[1,'IT'],[2,'Sales']]",
    sampleOutput: "[['IT','Max',90000],['IT','Joe',85000],['IT','Randy',85000],['IT','Will',70000],['Sales','Henry',80000],['Sales','Sam',60000]]",
    tags: ["database", "sql", "dense-rank", "window-functions"],
    createdAt: new Date("2025-08-05T06:45:15.362Z"),
    updatedAt: new Date("2025-08-05T06:45:15.362Z")
  },
  {
    id: "q_sql_175",
    title: "175. Combine Two Tables",
    description: "Write a solution to report the first name, last name, city, and state of each person in the Person table. If the address of a personId is not present in the Address table, report null instead.",
    difficulty: "Easy",
    category: "Database & SQL",
    supportedLanguages: [],
    testCases: [
      {
        id: "tc1",
        input: "Person: [[1,'Wang','Allen']]\nAddress: []",
        expectedOutput: "[['Allen','Wang',null,null]]",
        points: 50,
        description: "Left outer join sample"
      }
    ],
    timeLimit: 10,
    memoryLimit: 128,
    sampleInput: "Person: [[1,'Wang','Allen']]\nAddress: []",
    sampleOutput: "[['Allen','Wang',null,null]]",
    tags: ["database", "sql", "left-join"],
    createdAt: new Date("2025-08-05T06:45:15.362Z"),
    updatedAt: new Date("2025-08-05T06:45:15.362Z")
  },
  {
    id: "q_sql_176",
    title: "176. Second Highest Salary",
    description: "Write a solution to find the second highest distinct salary from the Employee table. If there is no second highest salary, return null.",
    difficulty: "Medium",
    category: "Database & SQL",
    supportedLanguages: [],
    testCases: [
      {
        id: "tc1",
        input: "Employee: [[1,100],[2,200],[3,300]]",
        expectedOutput: "200",
        points: 50,
        description: "Three distinct salaries"
      }
    ],
    timeLimit: 10,
    memoryLimit: 128,
    sampleInput: "Employee: [[1,100],[2,200],[3,300]]",
    sampleOutput: "200",
    tags: ["database", "sql", "subquery"],
    createdAt: new Date("2025-08-05T06:45:15.362Z"),
    updatedAt: new Date("2025-08-05T06:45:15.362Z")
  },
  {
    id: "q_sql_181",
    title: "181. Employees Earning More Than Their Managers",
    description: "Write a solution to find the employees who earn more than their managers.",
    difficulty: "Easy",
    category: "Database & SQL",
    supportedLanguages: [],
    testCases: [
      {
        id: "tc1",
        input: "Employee: [[1,'Joe',70000,3],[2,'Henry',80000,4],[3,'Sam',60000,null],[4,'Max',90000,null]]",
        expectedOutput: "[['Joe']]",
        points: 50,
        description: "Self join salary comparison"
      }
    ],
    timeLimit: 10,
    memoryLimit: 128,
    sampleInput: "Employee: [[1,'Joe',70000,3],[2,'Henry',80000,4],[3,'Sam',60000,null],[4,'Max',90000,null]]",
    sampleOutput: "[['Joe']]",
    tags: ["database", "sql", "self-join"],
    createdAt: new Date("2025-08-05T06:45:15.362Z"),
    updatedAt: new Date("2025-08-05T06:45:15.362Z")
  }
];

export const useQuestionStore = create<QuestionStore>((set, get) => ({
  questions: sampleQuestions,
  currentQuestion: null,
  submissions: [],

  setQuestions: (questions) => set({ questions }),
  
  addQuestion: (question) => set((state) => ({
    questions: [...state.questions, question]
  })),
  
  updateQuestion: (id, updatedQuestion) => set((state) => ({
    questions: state.questions.map(q => 
      q.id === id ? { ...q, ...updatedQuestion, updatedAt: new Date() } : q
    )
  })),
  
  deleteQuestion: (id) => set((state) => ({
    questions: state.questions.filter(q => q.id !== id),
    currentQuestion: state.currentQuestion?.id === id ? null : state.currentQuestion
  })),
  
  setCurrentQuestion: (question) => set({ currentQuestion: question }),
  
  addSubmission: (submission) => set((state) => ({
    submissions: [submission, ...state.submissions]
  })),
  
  getQuestionById: (id) => {
    return get().questions.find(q => q.id === id);
  },
  
  getQuestionsByCategory: (category) => {
    return get().questions.filter(q => q.category === category);
  },
  
  getQuestionsByDifficulty: (difficulty) => {
    return get().questions.filter(q => q.difficulty === difficulty);
  },

  // Filter and D2L integration
  filter: {
    categories: [],
    difficulties: ['Easy', 'Medium', 'Hard'],
    tags: [],
    languages: [],
    searchQuery: '',
    sortBy: 'title',
    sortOrder: 'asc',
  },

  assignmentContext: null,
  quizContext: null,

  setFilter: (filter) => set(state => ({
    filter: { ...state.filter, ...filter }
  })),

  getFilteredQuestions: () => {
    const { questions, filter } = get();
    let filteredQuestions = questions;
    
    if (filter.categories.length) {
      filteredQuestions = filteredQuestions.filter(q => filter.categories.includes(q.category));
    }

    if (filter.difficulties.length) {
      filteredQuestions = filteredQuestions.filter(q => filter.difficulties.includes(q.difficulty));
    }

    if (filter.tags.length) {
      filteredQuestions = filteredQuestions.filter(q => q.tags && q.tags.some(tag => filter.tags.includes(tag)));
    }

    if (filter.languages.length) {
      filteredQuestions = filteredQuestions.filter(q => q.supportedLanguages.some(lang => filter.languages.includes(lang)));
    }

    if (filter.searchQuery) {
      filteredQuestions = filteredQuestions.filter(q =>
        q.title.toLowerCase().includes(filter.searchQuery.toLowerCase()) ||
        q.description.toLowerCase().includes(filter.searchQuery.toLowerCase())
      );
    }

    const sortOrderMultiplier = filter.sortOrder === 'asc' ? 1 : -1;
    filteredQuestions.sort((a, b) => {
      if (filter.sortBy === 'createdAt') {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return (timeA - timeB) * sortOrderMultiplier;
      }
      const valA = String(a[filter.sortBy as keyof Question] ?? '');
      const valB = String(b[filter.sortBy as keyof Question] ?? '');
      return (valA < valB ? -1 : valA > valB ? 1 : 0) * sortOrderMultiplier;
    });

    return filteredQuestions;
  },

  getAllCategories: () => {
    const { questions } = get();
    const categories = new Set(questions.map(q => q.category));
    return Array.from(categories);
  },

  getAllTags: () => {
    const { questions } = get();
    const tags = new Set(questions.flatMap(q => q.tags || []));
    return Array.from(tags);
  },

  setAssignmentContext: (context: D2LContext | null) => set({ assignmentContext: context }),

  setQuizContext: (context: D2LContext | null) => set({ quizContext: context }),

  clearD2LContext: () => set({ assignmentContext: null, quizContext: null }),

}));
