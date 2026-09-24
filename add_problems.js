const fs = require('fs');

const newProblems = [
  {
    id: '17',
    title: 'Two Sum',
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
    difficulty: 'Easy',
    category: 'Array',
    supportedLanguages: [], // Any Language
    testCases: [
      {
        id: 'tc1',
        input: '[2,7,11,15]\n9',
        expectedOutput: '[0,1]',
        points: 50,
        description: 'Simple two sum'
      }
    ],
    timeLimit: 5,
    memoryLimit: 64,
    sampleInput: '[2,7,11,15]\n9',
    sampleOutput: '[0,1]',
    tags: ['array', 'hash-table'],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '18',
    title: 'Add Two Numbers',
    description: 'You are given two non-empty linked lists representing two non-negative integers. The digits are stored in reverse order...',
    difficulty: 'Medium',
    category: 'Linked List',
    supportedLanguages: [], // Any Language
    testCases: [
      {
        id: 'tc1',
        input: '[2,4,3]\n[5,6,4]',
        expectedOutput: '[7,0,8]',
        points: 50,
        description: 'Addition of linked list numbers'
      }
    ],
    timeLimit: 6,
    memoryLimit: 128,
    sampleInput: '[2,4,3]\n[5,6,4]',
    sampleOutput: '[7,0,8]',
    tags: ['linked-list', 'math'],
    createdAt: new Date(),
    updatedAt: new Date()
  }
  // Add more problems here
];

fs.readFile('src/store/questionStore.ts', 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading the file:', err);
    return;
  }

  const startIndex = data.indexOf('const sampleQuestions: Question[] = [');
  const endIndex = data.lastIndexOf('];', data.length);

  if (startIndex === -1 || endIndex === -1) {
    console.error('Error locating the sampleQuestions array.');
    return;
  }

  const beforeArray = data.substring(0, endIndex);
  const afterArray = data.substring(endIndex);

  const newContent = beforeArray + ',' + JSON.stringify(newProblems).slice(1, -1) + afterArray;

  fs.writeFile('src/store/questionStore.ts', newContent, 'utf8', (err) => {
    if (err) {
      console.error('Error writing to the file:', err);
      return;
    }
    console.log('New problems added successfully!');
  });
});

