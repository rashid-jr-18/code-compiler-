import { NextRequest, NextResponse } from 'next/server';

interface CatalogProblem {
  title: string;
  slug: string;
  platform: 'leetcode' | 'codechef' | 'hackerrank' | 'geeksforgeeks' | 'freecodecamp' | 'codeforces' | 'topcoder';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  tags: string[];
  importUrl: string;
  snippet?: string;
}

// -------------------------------------------------------------
// Pre-indexed Rich Catalog for instant 0-latency results
// across LeetCode, CodeChef, HackerRank, and GeeksforGeeks
// -------------------------------------------------------------
const CATALOG: CatalogProblem[] = [
  // ===================== LEETCODE =====================
  // Arrays & Hashing
  {
    title: 'Two Sum',
    slug: 'two-sum',
    platform: 'leetcode',
    difficulty: 'Easy',
    category: 'Arrays',
    tags: ['Array', 'Hash Table'],
    importUrl: 'https://leetcode.com/problems/two-sum/'
  },
  {
    title: 'Contains Duplicate',
    slug: 'contains-duplicate',
    platform: 'leetcode',
    difficulty: 'Easy',
    category: 'Arrays',
    tags: ['Array', 'Hash Table', 'Sorting'],
    importUrl: 'https://leetcode.com/problems/contains-duplicate/'
  },
  {
    title: 'Best Time to Buy and Sell Stock',
    slug: 'best-time-to-buy-and-sell-stock',
    platform: 'leetcode',
    difficulty: 'Easy',
    category: 'Arrays',
    tags: ['Array', 'Dynamic Programming'],
    importUrl: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/'
  },
  {
    title: 'Product of Array Except Self',
    slug: 'product-of-array-except-self',
    platform: 'leetcode',
    difficulty: 'Medium',
    category: 'Arrays',
    tags: ['Array', 'Prefix Sum'],
    importUrl: 'https://leetcode.com/problems/product-of-array-except-self/'
  },
  {
    title: 'Maximum Subarray (Kadane)',
    slug: 'maximum-subarray',
    platform: 'leetcode',
    difficulty: 'Medium',
    category: 'Arrays',
    tags: ['Array', 'Divide and Conquer', 'Dynamic Programming'],
    importUrl: 'https://leetcode.com/problems/maximum-subarray/'
  },
  {
    title: '3Sum',
    slug: '3sum',
    platform: 'leetcode',
    difficulty: 'Medium',
    category: 'Arrays',
    tags: ['Array', 'Two Pointers', 'Sorting'],
    importUrl: 'https://leetcode.com/problems/3sum/'
  },
  {
    title: 'Rotate Image',
    slug: 'rotate-image',
    platform: 'leetcode',
    difficulty: 'Medium',
    category: 'Arrays',
    tags: ['Array', 'Math', 'Matrix'],
    importUrl: 'https://leetcode.com/problems/rotate-image/'
  },
  {
    title: 'Trapping Rain Water',
    slug: 'trapping-rain-water',
    platform: 'leetcode',
    difficulty: 'Hard',
    category: 'Arrays',
    tags: ['Array', 'Two Pointers', 'Dynamic Programming', 'Stack'],
    importUrl: 'https://leetcode.com/problems/trapping-rain-water/'
  },
  {
    title: 'First Missing Positive',
    slug: 'first-missing-positive',
    platform: 'leetcode',
    difficulty: 'Hard',
    category: 'Arrays',
    tags: ['Array', 'Hash Table'],
    importUrl: 'https://leetcode.com/problems/first-missing-positive/'
  },
  // Strings
  {
    title: 'Valid Palindrome',
    slug: 'valid-palindrome',
    platform: 'leetcode',
    difficulty: 'Easy',
    category: 'Strings',
    tags: ['Two Pointers', 'String'],
    importUrl: 'https://leetcode.com/problems/valid-palindrome/'
  },
  {
    title: 'Valid Anagram',
    slug: 'valid-anagram',
    platform: 'leetcode',
    difficulty: 'Easy',
    category: 'Strings',
    tags: ['Hash Table', 'String', 'Sorting'],
    importUrl: 'https://leetcode.com/problems/valid-anagram/'
  },
  {
    title: 'Longest Substring Without Repeating Characters',
    slug: 'longest-substring-without-repeating-characters',
    platform: 'leetcode',
    difficulty: 'Medium',
    category: 'Strings',
    tags: ['Hash Table', 'String', 'Sliding Window'],
    importUrl: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/'
  },
  {
    title: 'Longest Palindromic Substring',
    slug: 'longest-palindromic-substring',
    platform: 'leetcode',
    difficulty: 'Medium',
    category: 'Strings',
    tags: ['Two Pointers', 'String', 'Dynamic Programming'],
    importUrl: 'https://leetcode.com/problems/longest-palindromic-substring/'
  },
  // DP
  {
    title: 'Climbing Stairs',
    slug: 'climbing-stairs',
    platform: 'leetcode',
    difficulty: 'Easy',
    category: 'Dynamic Programming',
    tags: ['Math', 'Dynamic Programming', 'Memoization'],
    importUrl: 'https://leetcode.com/problems/climbing-stairs/'
  },
  {
    title: 'Coin Change',
    slug: 'coin-change',
    platform: 'leetcode',
    difficulty: 'Medium',
    category: 'Dynamic Programming',
    tags: ['Array', 'Dynamic Programming', 'Breadth-First Search'],
    importUrl: 'https://leetcode.com/problems/coin-change/'
  },
  {
    title: 'Merge Intervals',
    slug: 'merge-intervals',
    platform: 'leetcode',
    difficulty: 'Medium',
    category: 'Arrays',
    tags: ['Array', 'Sorting'],
    importUrl: 'https://leetcode.com/problems/merge-intervals/'
  },
  {
    title: 'Rotate Array',
    slug: 'rotate-array',
    platform: 'leetcode',
    difficulty: 'Medium',
    category: 'Arrays',
    tags: ['Array', 'Math', 'Two Pointers'],
    importUrl: 'https://leetcode.com/problems/rotate-array/'
  },
  {
    title: 'Group Anagrams',
    slug: 'group-anagrams',
    platform: 'leetcode',
    difficulty: 'Medium',
    category: 'Strings',
    tags: ['Array', 'Hash Table', 'String', 'Sorting'],
    importUrl: 'https://leetcode.com/problems/group-anagrams/'
  },
  {
    title: 'Valid Parentheses',
    slug: 'valid-parentheses',
    platform: 'leetcode',
    difficulty: 'Easy',
    category: 'Strings',
    tags: ['String', 'Stack'],
    importUrl: 'https://leetcode.com/problems/valid-parentheses/'
  },
  {
    title: 'String to Integer (atoi)',
    slug: 'string-to-integer-atoi',
    platform: 'leetcode',
    difficulty: 'Medium',
    category: 'Strings',
    tags: ['String'],
    importUrl: 'https://leetcode.com/problems/string-to-integer-atoi/'
  },
  {
    title: 'Minimum Window Substring',
    slug: 'minimum-window-substring',
    platform: 'leetcode',
    difficulty: 'Hard',
    category: 'Strings',
    tags: ['Hash Table', 'String', 'Sliding Window'],
    importUrl: 'https://leetcode.com/problems/minimum-window-substring/'
  },
  {
    title: 'House Robber',
    slug: 'house-robber',
    platform: 'leetcode',
    difficulty: 'Medium',
    category: 'Dynamic Programming',
    tags: ['Array', 'Dynamic Programming'],
    importUrl: 'https://leetcode.com/problems/house-robber/'
  },
  {
    title: 'Longest Increasing Subsequence',
    slug: 'longest-increasing-subsequence',
    platform: 'leetcode',
    difficulty: 'Medium',
    category: 'Dynamic Programming',
    tags: ['Array', 'Binary Search', 'Dynamic Programming'],
    importUrl: 'https://leetcode.com/problems/longest-increasing-subsequence/'
  },
  {
    title: 'Longest Common Subsequence',
    slug: 'longest-common-subsequence',
    platform: 'leetcode',
    difficulty: 'Medium',
    category: 'Dynamic Programming',
    tags: ['String', 'Dynamic Programming'],
    importUrl: 'https://leetcode.com/problems/longest-common-subsequence/'
  },
  {
    title: 'Word Break',
    slug: 'word-break',
    platform: 'leetcode',
    difficulty: 'Medium',
    category: 'Dynamic Programming',
    tags: ['Hash Table', 'String', 'Dynamic Programming', 'Trie'],
    importUrl: 'https://leetcode.com/problems/word-break/'
  },
  {
    title: 'Edit Distance',
    slug: 'edit-distance',
    platform: 'leetcode',
    difficulty: 'Hard',
    category: 'Dynamic Programming',
    tags: ['String', 'Dynamic Programming'],
    importUrl: 'https://leetcode.com/problems/edit-distance/'
  },
  {
    title: 'Reverse Integer',
    slug: 'reverse-integer',
    platform: 'leetcode',
    difficulty: 'Medium',
    category: 'Math',
    tags: ['Math'],
    importUrl: 'https://leetcode.com/problems/reverse-integer/'
  },
  {
    title: 'Palindrome Number',
    slug: 'palindrome-number',
    platform: 'leetcode',
    difficulty: 'Easy',
    category: 'Math',
    tags: ['Math'],
    importUrl: 'https://leetcode.com/problems/palindrome-number/'
  },
  {
    title: 'Pow(x, n)',
    slug: 'powx-n',
    platform: 'leetcode',
    difficulty: 'Medium',
    category: 'Math',
    tags: ['Math', 'Recursion'],
    importUrl: 'https://leetcode.com/problems/powx-n/'
  },
  {
    title: 'Sqrt(x)',
    slug: 'sqrtx',
    platform: 'leetcode',
    difficulty: 'Easy',
    category: 'Math',
    tags: ['Math', 'Binary Search'],
    importUrl: 'https://leetcode.com/problems/sqrtx/'
  },
  {
    title: 'Count Primes',
    slug: 'count-primes',
    platform: 'leetcode',
    difficulty: 'Medium',
    category: 'Math',
    tags: ['Array', 'Math', 'Number Theory'],
    importUrl: 'https://leetcode.com/problems/count-primes/'
  },
  {
    title: 'Happy Number',
    slug: 'happy-number',
    platform: 'leetcode',
    difficulty: 'Easy',
    category: 'Math',
    tags: ['Hash Table', 'Math', 'Two Pointers'],
    importUrl: 'https://leetcode.com/problems/happy-number/'
  },
  {
    title: 'Task Scheduler',
    slug: 'task-scheduler',
    platform: 'leetcode',
    difficulty: 'Medium',
    category: 'Greedy',
    tags: ['Array', 'Hash Table', 'Greedy', 'Sorting', 'Heap'],
    importUrl: 'https://leetcode.com/problems/task-scheduler/'
  },
  {
    title: 'Best Time to Buy and Sell Stock II',
    slug: 'best-time-to-buy-and-sell-stock-ii',
    platform: 'leetcode',
    difficulty: 'Medium',
    category: 'Greedy',
    tags: ['Array', 'Dynamic Programming', 'Greedy'],
    importUrl: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock-ii/'
  },
  {
    title: 'Non-overlapping Intervals',
    slug: 'non-overlapping-intervals',
    platform: 'leetcode',
    difficulty: 'Medium',
    category: 'Greedy',
    tags: ['Array', 'Dynamic Programming', 'Greedy', 'Sorting'],
    importUrl: 'https://leetcode.com/problems/non-overlapping-intervals/'
  },
  {
    title: 'Candy',
    slug: 'candy',
    platform: 'leetcode',
    difficulty: 'Hard',
    category: 'Greedy',
    tags: ['Array', 'Greedy'],
    importUrl: 'https://leetcode.com/problems/candy/'
  },
  {
    title: 'Lowest Common Ancestor of a Binary Search Tree',
    slug: 'lowest-common-ancestor-of-a-binary-search-tree',
    platform: 'leetcode',
    difficulty: 'Medium',
    category: 'Trees',
    tags: ['Tree', 'Binary Search Tree', 'DFS'],
    importUrl: 'https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/'
  },
  {
    title: 'Diameter of Binary Tree',
    slug: 'diameter-of-binary-tree-lc',
    platform: 'leetcode',
    difficulty: 'Easy',
    category: 'Trees',
    tags: ['Tree', 'Binary Tree', 'DFS'],
    importUrl: 'https://leetcode.com/problems/diameter-of-binary-tree/'
  },
  {
    title: 'Serialize and Deserialize Binary Tree',
    slug: 'serialize-and-deserialize-binary-tree',
    platform: 'leetcode',
    difficulty: 'Hard',
    category: 'Trees',
    tags: ['String', 'Tree', 'DFS', 'BFS', 'Design'],
    importUrl: 'https://leetcode.com/problems/serialize-and-deserialize-binary-tree/'
  },
  {
    title: 'Kth Smallest Element in a BST',
    slug: 'kth-smallest-element-in-a-bst',
    platform: 'leetcode',
    difficulty: 'Medium',
    category: 'Trees',
    tags: ['Tree', 'Binary Search Tree', 'DFS'],
    importUrl: 'https://leetcode.com/problems/kth-smallest-element-in-a-bst/'
  },
  {
    title: 'Word Ladder',
    slug: 'word-ladder',
    platform: 'leetcode',
    difficulty: 'Hard',
    category: 'Graphs',
    tags: ['Hash Table', 'String', 'Breadth-First Search'],
    importUrl: 'https://leetcode.com/problems/word-ladder/'
  },
  {
    title: 'Pacific Atlantic Water Flow',
    slug: 'pacific-atlantic-water-flow',
    platform: 'leetcode',
    difficulty: 'Medium',
    category: 'Graphs',
    tags: ['Array', 'DFS', 'BFS', 'Matrix'],
    importUrl: 'https://leetcode.com/problems/pacific-atlantic-water-flow/'
  },
  {
    title: 'Graph Valid Tree',
    slug: 'graph-valid-tree',
    platform: 'leetcode',
    difficulty: 'Medium',
    category: 'Graphs',
    tags: ['DFS', 'BFS', 'Union Find', 'Graph'],
    importUrl: 'https://leetcode.com/problems/graph-valid-tree/'
  },
  {
    title: 'Network Delay Time (Dijkstra)',
    slug: 'network-delay-time',
    platform: 'leetcode',
    difficulty: 'Medium',
    category: 'Graphs',
    tags: ['DFS', 'BFS', 'Graph', 'Shortest Path', 'Heap'],
    importUrl: 'https://leetcode.com/problems/network-delay-time/'
  },
  {
    title: 'Redundant Connection (Union-Find)',
    slug: 'redundant-connection',
    platform: 'leetcode',
    difficulty: 'Medium',
    category: 'Graphs',
    tags: ['DFS', 'BFS', 'Union Find', 'Graph'],
    importUrl: 'https://leetcode.com/problems/redundant-connection/'
  },
  {
    title: 'Sort Colors (Dutch National Flag)',
    slug: 'sort-colors',
    platform: 'leetcode',
    difficulty: 'Medium',
    category: 'Sorting',
    tags: ['Array', 'Two Pointers', 'Sorting'],
    importUrl: 'https://leetcode.com/problems/sort-colors/'
  },
  {
    title: 'Kth Largest Element in an Array',
    slug: 'kth-largest-element-in-an-array',
    platform: 'leetcode',
    difficulty: 'Medium',
    category: 'Sorting',
    tags: ['Array', 'Divide and Conquer', 'Sorting', 'Heap', 'Quickselect'],
    importUrl: 'https://leetcode.com/problems/kth-largest-element-in-an-array/'
  },
  {
    title: 'Meeting Rooms II (Interval Overlaps)',
    slug: 'meeting-rooms-ii',
    platform: 'leetcode',
    difficulty: 'Medium',
    category: 'Sorting',
    tags: ['Array', 'Two Pointers', 'Greedy', 'Sorting', 'Heap'],
    importUrl: 'https://leetcode.com/problems/meeting-rooms-ii/'
  },
  {
    title: 'Search a 2D Matrix',
    slug: 'search-a-2d-matrix',
    platform: 'leetcode',
    difficulty: 'Medium',
    category: 'Binary Search',
    tags: ['Array', 'Binary Search', 'Matrix'],
    importUrl: 'https://leetcode.com/problems/search-a-2d-matrix/'
  },
  {
    title: 'Koko Eating Bananas',
    slug: 'koko-eating-bananas',
    platform: 'leetcode',
    difficulty: 'Medium',
    category: 'Binary Search',
    tags: ['Array', 'Binary Search'],
    importUrl: 'https://leetcode.com/problems/koko-eating-bananas/'
  },
  {
    title: 'Median of Two Sorted Arrays',
    slug: 'median-of-two-sorted-arrays',
    platform: 'leetcode',
    difficulty: 'Hard',
    category: 'Binary Search',
    tags: ['Array', 'Binary Search', 'Divide and Conquer'],
    importUrl: 'https://leetcode.com/problems/median-of-two-sorted-arrays/'
  },
  {
    title: 'Two Sum II - Input Array Is Sorted',
    slug: 'two-sum-ii-input-array-is-sorted',
    platform: 'leetcode',
    difficulty: 'Medium',
    category: 'Two Pointers',
    tags: ['Array', 'Two Pointers', 'Binary Search'],
    importUrl: 'https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/'
  },
  {
    title: 'Remove Duplicates from Sorted Array',
    slug: 'remove-duplicates-from-sorted-array',
    platform: 'leetcode',
    difficulty: 'Easy',
    category: 'Two Pointers',
    tags: ['Array', 'Two Pointers'],
    importUrl: 'https://leetcode.com/problems/remove-duplicates-from-sorted-array/'
  },
  {
    title: 'Missing Number',
    slug: 'missing-number',
    platform: 'leetcode',
    difficulty: 'Easy',
    category: 'Bit Manipulation',
    tags: ['Array', 'Hash Table', 'Math', 'Binary Search', 'Bit Manipulation'],
    importUrl: 'https://leetcode.com/problems/missing-number/'
  },
  {
    title: 'Reverse Bits',
    slug: 'reverse-bits',
    platform: 'leetcode',
    difficulty: 'Easy',
    category: 'Bit Manipulation',
    tags: ['Divide and Conquer', 'Bit Manipulation'],
    importUrl: 'https://leetcode.com/problems/reverse-bits/'
  },
  {
    title: 'Sum of Two Integers (Without +/-)',
    slug: 'sum-of-two-integers',
    platform: 'leetcode',
    difficulty: 'Medium',
    category: 'Bit Manipulation',
    tags: ['Math', 'Bit Manipulation'],
    importUrl: 'https://leetcode.com/problems/sum-of-two-integers/'
  },
  {
    title: 'Word Search',
    slug: 'word-search',
    platform: 'leetcode',
    difficulty: 'Medium',
    category: 'Backtracking',
    tags: ['Array', 'Backtracking', 'Matrix'],
    importUrl: 'https://leetcode.com/problems/word-search/'
  },
  {
    title: 'N-Queens',
    slug: 'n-queens',
    platform: 'leetcode',
    difficulty: 'Hard',
    category: 'Backtracking',
    tags: ['Array', 'Backtracking'],
    importUrl: 'https://leetcode.com/problems/n-queens/'
  },
  {
    title: 'Palindrome Partitioning',
    slug: 'palindrome-partitioning',
    platform: 'leetcode',
    difficulty: 'Medium',
    category: 'Backtracking',
    tags: ['String', 'Dynamic Programming', 'Backtracking'],
    importUrl: 'https://leetcode.com/problems/palindrome-partitioning/'
  },
  {
    title: 'Department Top Three Salaries',
    slug: 'department-top-three-salaries',
    platform: 'leetcode',
    difficulty: 'Hard',
    category: 'Database',
    tags: ['Database', 'SQL', 'Window Function'],
    importUrl: 'https://leetcode.com/problems/department-top-three-salaries/'
  },

  // ===================== CODECHEF =====================
  // Arrays
  {
    title: 'Chef and Dolls',
    slug: 'MISSP',
    platform: 'codechef',
    difficulty: 'Easy',
    category: 'Arrays',
    tags: ['Array', 'Bit Manipulation', 'XOR'],
    importUrl: 'https://www.codechef.com/problems/MISSP'
  },
  {
    title: 'ATM Machine',
    slug: 'ATM2',
    platform: 'codechef',
    difficulty: 'Easy',
    category: 'Arrays',
    tags: ['Array', 'Simulation', 'Beginner'],
    importUrl: 'https://www.codechef.com/problems/ATM2'
  },
  {
    title: 'Lead Game',
    slug: 'TLG',
    platform: 'codechef',
    difficulty: 'Easy',
    category: 'Arrays',
    tags: ['Array', 'Cumulative Sum'],
    importUrl: 'https://www.codechef.com/problems/TLG'
  },
  {
    title: 'Carvans (Speed Problem)',
    slug: 'CARVANS',
    platform: 'codechef',
    difficulty: 'Easy',
    category: 'Arrays',
    tags: ['Array', 'Greedy'],
    importUrl: 'https://www.codechef.com/problems/CARVANS'
  },
  {
    title: 'Subarray GCD',
    slug: 'SUBGCD',
    platform: 'codechef',
    difficulty: 'Medium',
    category: 'Arrays',
    tags: ['Array', 'Math', 'Number Theory', 'GCD'],
    importUrl: 'https://www.codechef.com/problems/SUBGCD'
  },
  {
    title: 'Count Subarrays',
    slug: 'SUBINC',
    platform: 'codechef',
    difficulty: 'Medium',
    category: 'Arrays',
    tags: ['Array', 'Dynamic Programming'],
    importUrl: 'https://www.codechef.com/problems/SUBINC'
  },
  {
    title: 'Chef and Easy Queries',
    slug: 'CHEFEZQ',
    platform: 'codechef',
    difficulty: 'Medium',
    category: 'Arrays',
    tags: ['Array', 'Greedy', 'Math'],
    importUrl: 'https://www.codechef.com/problems/CHEFEZQ'
  },
  {
    title: 'Chef and Frogs (Distance Jumps)',
    slug: 'FROGV',
    platform: 'codechef',
    difficulty: 'Hard',
    category: 'Arrays',
    tags: ['Array', 'Sorting', 'Disjoint Set'],
    importUrl: 'https://www.codechef.com/problems/FROGV'
  },
  // CodeChef Math & Strings
  {
    title: 'Add Two Numbers (FLOW001)',
    slug: 'FLOW001',
    platform: 'codechef',
    difficulty: 'Easy',
    category: 'Math',
    tags: ['Basic Math', 'Beginner'],
    importUrl: 'https://www.codechef.com/problems/FLOW001'
  },
  {
    title: 'ATM',
    slug: 'HS08TEST',
    platform: 'codechef',
    difficulty: 'Easy',
    category: 'Math',
    tags: ['Basic Math', 'Transactions'],
    importUrl: 'https://www.codechef.com/problems/HS08TEST'
  },
  {
    title: 'Chef and Dolls',
    slug: 'MISSP',
    platform: 'codechef',
    difficulty: 'Easy',
    category: 'Arrays',
    tags: ['Array', 'XOR', 'Bitwise'],
    importUrl: 'https://www.codechef.com/problems/MISSP'
  },
  {
    title: 'Packaging Cupcakes',
    slug: 'MUFFINS3',
    platform: 'codechef',
    difficulty: 'Easy',
    category: 'Math',
    tags: ['Math', 'Greedy'],
    importUrl: 'https://www.codechef.com/problems/MUFFINS3'
  },
  {
    title: 'Turbo Sort',
    slug: 'TSORT',
    platform: 'codechef',
    difficulty: 'Easy',
    category: 'Sorting',
    tags: ['Sorting', 'Counting Sort'],
    importUrl: 'https://www.codechef.com/problems/TSORT'
  },
  {
    title: 'Coin Flip',
    slug: 'CONFLIP',
    platform: 'codechef',
    difficulty: 'Easy',
    category: 'Math',
    tags: ['Math', 'Parity'],
    importUrl: 'https://www.codechef.com/problems/CONFLIP'
  },
  {
    title: 'Carvans (Speed Problem)',
    slug: 'CARVANS',
    platform: 'codechef',
    difficulty: 'Easy',
    category: 'Arrays',
    tags: ['Array', 'Greedy'],
    importUrl: 'https://www.codechef.com/problems/CARVANS'
  },
  {
    title: 'Horses (Minimum Difference)',
    slug: 'HORSES',
    platform: 'codechef',
    difficulty: 'Easy',
    category: 'Sorting',
    tags: ['Sorting', 'Array'],
    importUrl: 'https://www.codechef.com/problems/HORSES'
  },
  {
    title: 'Subarray Mex',
    slug: 'SUBMEX',
    platform: 'codechef',
    difficulty: 'Medium',
    category: 'Arrays',
    tags: ['Array', 'Constructive'],
    importUrl: 'https://www.codechef.com/problems/SUBMEX'
  },
  {
    title: 'Clean The Sequence',
    slug: 'CLEAN',
    platform: 'codechef',
    difficulty: 'Medium',
    category: 'Dynamic Programming',
    tags: ['DP', 'Arrays'],
    importUrl: 'https://www.codechef.com/problems/CLEAN'
  },
  {
    title: 'Lapindromes',
    slug: 'LAPIN',
    platform: 'codechef',
    difficulty: 'Easy',
    category: 'Strings',
    tags: ['String', 'Frequency Map'],
    importUrl: 'https://www.codechef.com/problems/LAPIN'
  },
  {
    title: 'Make That Array Odd',
    slug: 'ODDPAIRS',
    platform: 'codechef',
    difficulty: 'Easy',
    category: 'Arrays',
    tags: ['Array', 'Math', 'Parity'],
    importUrl: 'https://www.codechef.com/problems/ODDPAIRS'
  },
  {
    title: 'Chef and String',
    slug: 'CHEFSTR1',
    platform: 'codechef',
    difficulty: 'Easy',
    category: 'Strings',
    tags: ['Strings', 'Math'],
    importUrl: 'https://www.codechef.com/problems/CHEFSTR1'
  },
  {
    title: 'Cricket Ranking',
    slug: 'CRICRANK',
    platform: 'codechef',
    difficulty: 'Easy',
    category: 'Math',
    tags: ['Basic Math', 'Comparison'],
    importUrl: 'https://www.codechef.com/problems/CRICRANK'
  },
  {
    title: 'Small factorials',
    slug: 'FCTRL2',
    platform: 'codechef',
    difficulty: 'Easy',
    category: 'Math',
    tags: ['Math', 'Big Integer'],
    importUrl: 'https://www.codechef.com/problems/FCTRL2'
  },
  {
    title: 'Cops and the Thief Devu',
    slug: 'COPS',
    platform: 'codechef',
    difficulty: 'Easy',
    category: 'Arrays',
    tags: ['Array', 'Greedy'],
    importUrl: 'https://www.codechef.com/problems/COPS'
  },
  {
    title: 'The Minimum Number Of Moves',
    slug: 'SALARY',
    platform: 'codechef',
    difficulty: 'Easy',
    category: 'Greedy',
    tags: ['Greedy', 'Math'],
    importUrl: 'https://www.codechef.com/problems/SALARY'
  },
  {
    title: 'Chef and Rainbow Array',
    slug: 'RAINBOWA',
    platform: 'codechef',
    difficulty: 'Easy',
    category: 'Arrays',
    tags: ['Array', 'Two Pointers'],
    importUrl: 'https://www.codechef.com/problems/RAINBOWA'
  },
  {
    title: 'Mutated Minions (Gru and Banana)',
    slug: 'CHN15A',
    platform: 'codechef',
    difficulty: 'Easy',
    category: 'Arrays',
    tags: ['Array', 'Math', 'Modulo'],
    importUrl: 'https://www.codechef.com/problems/CHN15A'
  },
  {
    title: 'Little Elephant and Candies',
    slug: 'LECANDY',
    platform: 'codechef',
    difficulty: 'Easy',
    category: 'Arrays',
    tags: ['Array', 'Greedy'],
    importUrl: 'https://www.codechef.com/problems/LECANDY'
  },
  {
    title: 'Chef and Notebooks',
    slug: 'CNOTE',
    platform: 'codechef',
    difficulty: 'Easy',
    category: 'Arrays',
    tags: ['Array', 'Greedy'],
    importUrl: 'https://www.codechef.com/problems/CNOTE'
  },
  {
    title: 'Maximum Weight Difference',
    slug: 'MAXDIFF',
    platform: 'codechef',
    difficulty: 'Easy',
    category: 'Sorting',
    tags: ['Sorting', 'Greedy'],
    importUrl: 'https://www.codechef.com/problems/MAXDIFF'
  },
  {
    title: 'Buying Sweets (Bankrobbery)',
    slug: 'BUYING2',
    platform: 'codechef',
    difficulty: 'Easy',
    category: 'Math',
    tags: ['Math', 'Greedy'],
    importUrl: 'https://www.codechef.com/problems/BUYING2'
  },
  {
    title: 'Chopsticks Pairing',
    slug: 'TACHSTCK',
    platform: 'codechef',
    difficulty: 'Easy',
    category: 'Greedy',
    tags: ['Greedy', 'Sorting', 'Two Pointers'],
    importUrl: 'https://www.codechef.com/problems/TACHSTCK'
  },
  {
    title: 'Dividing Stamps',
    slug: 'DIVIDING',
    platform: 'codechef',
    difficulty: 'Easy',
    category: 'Math',
    tags: ['Math', 'Summation'],
    importUrl: 'https://www.codechef.com/problems/DIVIDING'
  },
  {
    title: 'Jewels and Stones',
    slug: 'STONES',
    platform: 'codechef',
    difficulty: 'Easy',
    category: 'Strings',
    tags: ['Strings', 'Hash Table', 'Set'],
    importUrl: 'https://www.codechef.com/problems/STONES'
  },
  {
    title: 'Count Substrings (Binary String)',
    slug: 'CSUB',
    platform: 'codechef',
    difficulty: 'Easy',
    category: 'Strings',
    tags: ['Strings', 'Combinatorics'],
    importUrl: 'https://www.codechef.com/problems/CSUB'
  },
  {
    title: 'The Block Game (Palindrome Number)',
    slug: 'PALL01',
    platform: 'codechef',
    difficulty: 'Easy',
    category: 'Strings',
    tags: ['Strings', 'Two Pointers'],
    importUrl: 'https://www.codechef.com/problems/PALL01'
  },
  {
    title: 'Sum of Digits',
    slug: 'FLOW006',
    platform: 'codechef',
    difficulty: 'Easy',
    category: 'Math',
    tags: ['Math', 'Modulo'],
    importUrl: 'https://www.codechef.com/problems/FLOW006'
  },
  {
    title: 'Reverse The Number',
    slug: 'FLOW007',
    platform: 'codechef',
    difficulty: 'Easy',
    category: 'Math',
    tags: ['Math', 'Number Theory'],
    importUrl: 'https://www.codechef.com/problems/FLOW007'
  },
  {
    title: 'Smallest Numbers of Notes (Denominations)',
    slug: 'FLOW018',
    platform: 'codechef',
    difficulty: 'Easy',
    category: 'Greedy',
    tags: ['Greedy', 'Currency'],
    importUrl: 'https://www.codechef.com/problems/FLOW018'
  },
  {
    title: 'First and Last Digit',
    slug: 'FLOW004',
    platform: 'codechef',
    difficulty: 'Easy',
    category: 'Math',
    tags: ['Math', 'Beginner'],
    importUrl: 'https://www.codechef.com/problems/FLOW004'
  },
  {
    title: 'Find Remainder',
    slug: 'FLOW002',
    platform: 'codechef',
    difficulty: 'Easy',
    category: 'Math',
    tags: ['Math', 'Arithmetic'],
    importUrl: 'https://www.codechef.com/problems/FLOW002'
  },
  {
    title: 'Lucky Four (Count 4s)',
    slug: 'LUCKFOUR',
    platform: 'codechef',
    difficulty: 'Easy',
    category: 'Math',
    tags: ['Math', 'Digits'],
    importUrl: 'https://www.codechef.com/problems/LUCKFOUR'
  },
  {
    title: 'Coins And Triangle',
    slug: 'TRICOIN',
    platform: 'codechef',
    difficulty: 'Easy',
    category: 'Binary Search',
    tags: ['Binary Search', 'Math'],
    importUrl: 'https://www.codechef.com/problems/TRICOIN'
  },
  {
    title: 'Snake Procession',
    slug: 'SNAKPROC',
    platform: 'codechef',
    difficulty: 'Easy',
    category: 'Strings',
    tags: ['Strings', 'Stack'],
    importUrl: 'https://www.codechef.com/problems/SNAKPROC'
  },
  {
    title: 'Kitchen Timetable',
    slug: 'KTTABLE',
    platform: 'codechef',
    difficulty: 'Easy',
    category: 'Arrays',
    tags: ['Arrays', 'Difference'],
    importUrl: 'https://www.codechef.com/problems/KTTABLE'
  },
  {
    title: 'Smart Phone (Revenue Optimization)',
    slug: 'ZCO14003',
    platform: 'codechef',
    difficulty: 'Easy',
    category: 'Sorting',
    tags: ['Sorting', 'Greedy', 'ZCO'],
    importUrl: 'https://www.codechef.com/problems/ZCO14003'
  },

  // ===================== HACKERRANK =====================
  // Arrays
  {
    title: 'Simple Array Sum',
    slug: 'simple-array-sum',
    platform: 'hackerrank',
    difficulty: 'Easy',
    category: 'Arrays',
    tags: ['Warmup', 'Arrays'],
    importUrl: 'https://www.hackerrank.com/challenges/simple-array-sum/problem'
  },
  {
    title: 'Compare the Triplets',
    slug: 'compare-the-triplets',
    platform: 'hackerrank',
    difficulty: 'Easy',
    category: 'Arrays',
    tags: ['Warmup', 'Arrays'],
    importUrl: 'https://www.hackerrank.com/challenges/compare-the-triplets/problem'
  },
  {
    title: 'A Very Big Sum',
    slug: 'a-very-big-sum',
    platform: 'hackerrank',
    difficulty: 'Easy',
    category: 'Arrays',
    tags: ['Warmup', 'Arrays'],
    importUrl: 'https://www.hackerrank.com/challenges/a-very-big-sum/problem'
  },
  {
    title: 'Diagonal Difference',
    slug: 'diagonal-difference',
    platform: 'hackerrank',
    difficulty: 'Easy',
    category: 'Arrays',
    tags: ['Arrays', '2D Arrays'],
    importUrl: 'https://www.hackerrank.com/challenges/diagonal-difference/problem'
  },
  {
    title: 'Left Rotation',
    slug: 'array-left-rotation',
    platform: 'hackerrank',
    difficulty: 'Easy',
    category: 'Arrays',
    tags: ['Data Structures', 'Arrays'],
    importUrl: 'https://www.hackerrank.com/challenges/array-left-rotation/problem'
  },
  {
    title: 'Sparse Arrays',
    slug: 'sparse-arrays',
    platform: 'hackerrank',
    difficulty: 'Medium',
    category: 'Arrays',
    tags: ['Data Structures', 'Arrays', 'Hash Map'],
    importUrl: 'https://www.hackerrank.com/challenges/sparse-arrays/problem'
  },
  {
    title: 'Array Manipulation (Prefix Difference)',
    slug: 'crush',
    platform: 'hackerrank',
    difficulty: 'Hard',
    category: 'Arrays',
    tags: ['Data Structures', 'Arrays', 'Prefix Sum'],
    importUrl: 'https://www.hackerrank.com/challenges/crush/problem'
  },
  // HackerRank Strings & Sorting
  {
    title: 'Super Reduced String',
    slug: 'reduced-string',
    platform: 'hackerrank',
    difficulty: 'Easy',
    category: 'Strings',
    tags: ['Strings', 'Stack'],
    importUrl: 'https://www.hackerrank.com/challenges/reduced-string/problem'
  },
  {
    title: 'Sherlock and Anagrams',
    slug: 'sherlock-and-anagrams',
    platform: 'hackerrank',
    difficulty: 'Medium',
    category: 'Strings',
    tags: ['Strings', 'Hash Map', 'Combinatorics'],
    importUrl: 'https://www.hackerrank.com/challenges/sherlock-and-anagrams/problem'
  },
  {
    title: 'Mini-Max Sum',
    slug: 'mini-max-sum',
    platform: 'hackerrank',
    difficulty: 'Easy',
    category: 'Math',
    tags: ['Algorithms', 'Warmup'],
    importUrl: 'https://www.hackerrank.com/challenges/mini-max-sum/problem'
  },
  {
    title: 'Birthday Cake Candles',
    slug: 'birthday-cake-candles',
    platform: 'hackerrank',
    difficulty: 'Easy',
    category: 'Arrays',
    tags: ['Algorithms', 'Warmup'],
    importUrl: 'https://www.hackerrank.com/challenges/birthday-cake-candles/problem'
  },
  {
    title: 'Time Conversion (12-hour to 24-hour)',
    slug: 'time-conversion',
    platform: 'hackerrank',
    difficulty: 'Easy',
    category: 'Strings',
    tags: ['Strings', 'Warmup'],
    importUrl: 'https://www.hackerrank.com/challenges/time-conversion/problem'
  },
  {
    title: 'Grading Students (Round to Multiple of 5)',
    slug: 'grading',
    platform: 'hackerrank',
    difficulty: 'Easy',
    category: 'Math',
    tags: ['Implementation', 'Math'],
    importUrl: 'https://www.hackerrank.com/challenges/grading/problem'
  },
  {
    title: 'Sales by Match (Sock Merchant)',
    slug: 'sock-merchant',
    platform: 'hackerrank',
    difficulty: 'Easy',
    category: 'Arrays',
    tags: ['Implementation', 'Frequency Map'],
    importUrl: 'https://www.hackerrank.com/challenges/sock-merchant/problem'
  },
  {
    title: 'Counting Valleys (Hiker Path)',
    slug: 'counting-valleys',
    platform: 'hackerrank',
    difficulty: 'Easy',
    category: 'Strings',
    tags: ['Implementation', 'Strings'],
    importUrl: 'https://www.hackerrank.com/challenges/counting-valleys/problem'
  },
  {
    title: 'The Hurdle Race',
    slug: 'the-hurdle-race',
    platform: 'hackerrank',
    difficulty: 'Easy',
    category: 'Arrays',
    tags: ['Implementation', 'Arrays'],
    importUrl: 'https://www.hackerrank.com/challenges/the-hurdle-race/problem'
  },

  // ===================== GEEKSFORGEEKS =====================
  // Arrays
  {
    title: 'Reverse an Array',
    slug: 'reverse-an-array',
    platform: 'geeksforgeeks',
    difficulty: 'Easy',
    category: 'Arrays',
    tags: ['Array', 'Two Pointers'],
    importUrl: 'https://www.geeksforgeeks.org/problems/reverse-an-array/1'
  },
  {
    title: 'Second Largest Element in Array',
    slug: 'second-largest3735',
    platform: 'geeksforgeeks',
    difficulty: 'Easy',
    category: 'Arrays',
    tags: ['Array', 'Sorting'],
    importUrl: 'https://www.geeksforgeeks.org/problems/second-largest3735/1'
  },
  {
    title: 'Move All Zeroes to End',
    slug: 'move-all-zeroes-to-end-of-array0751',
    platform: 'geeksforgeeks',
    difficulty: 'Easy',
    category: 'Arrays',
    tags: ['Array', 'Two Pointers'],
    importUrl: 'https://www.geeksforgeeks.org/problems/move-all-zeroes-to-end-of-array0751/1'
  },
  {
    title: 'Majority Element (> n/2 times)',
    slug: 'majority-element-1587115620',
    platform: 'geeksforgeeks',
    difficulty: 'Medium',
    category: 'Arrays',
    tags: ['Array', 'Moore Voting Algorithm'],
    importUrl: 'https://www.geeksforgeeks.org/problems/majority-element-1587115620/1'
  },
  {
    title: 'Next Permutation',
    slug: 'next-permutation5246',
    platform: 'geeksforgeeks',
    difficulty: 'Medium',
    category: 'Arrays',
    tags: ['Array', 'Combinatorics'],
    importUrl: 'https://www.geeksforgeeks.org/problems/next-permutation5246/1'
  },
  {
    title: 'Stock Buy and Sell – Max One Transaction',
    slug: 'buy-stock-2',
    platform: 'geeksforgeeks',
    difficulty: 'Easy',
    category: 'Arrays',
    tags: ['Array', 'Greedy'],
    importUrl: 'https://www.geeksforgeeks.org/problems/buy-stock-2/1'
  },
  {
    title: 'Subarray with Given Sum',
    slug: 'subarray-with-given-sum-1587115621',
    platform: 'geeksforgeeks',
    difficulty: 'Medium',
    category: 'Arrays',
    tags: ['Array', 'Sliding Window', 'Prefix Sum'],
    importUrl: 'https://www.geeksforgeeks.org/problems/subarray-with-given-sum-1587115621/1'
  },
  {
    title: 'Missing in Array',
    slug: 'missing-number-in-array1416',
    platform: 'geeksforgeeks',
    difficulty: 'Easy',
    category: 'Arrays',
    tags: ['Array', 'Math', 'Bitwise'],
    importUrl: 'https://www.geeksforgeeks.org/problems/missing-number-in-array1416/1'
  },
  {
    title: "Kadane's Algorithm (Max Subarray Sum)",
    slug: 'kadanes-algorithm-1587115620',
    platform: 'geeksforgeeks',
    difficulty: 'Medium',
    category: 'Arrays',
    tags: ['Array', 'Dynamic Programming'],
    importUrl: 'https://www.geeksforgeeks.org/problems/kadanes-algorithm-1587115620/1'
  },
  {
    title: 'Leaders in an Array',
    slug: 'leaders-in-an-array-1587115620',
    platform: 'geeksforgeeks',
    difficulty: 'Easy',
    category: 'Arrays',
    tags: ['Array', 'Two Pointers'],
    importUrl: 'https://www.geeksforgeeks.org/problems/leaders-in-an-array-1587115620/1'
  },
  {
    title: 'Parenthesis Checker (Balanced Expression)',
    slug: 'parenthesis-checker2744',
    platform: 'geeksforgeeks',
    difficulty: 'Easy',
    category: 'Strings',
    tags: ['Stack', 'Strings'],
    importUrl: 'https://www.geeksforgeeks.org/problems/parenthesis-checker2744/1'
  },
  {
    title: 'Palindrome String',
    slug: 'palindrome-string0817',
    platform: 'geeksforgeeks',
    difficulty: 'Easy',
    category: 'Strings',
    tags: ['Strings', 'Two Pointers'],
    importUrl: 'https://www.geeksforgeeks.org/problems/palindrome-string0817/1'
  },
  {
    title: '0 - 1 Knapsack Problem',
    slug: '0-1-knapsack-problem0945',
    platform: 'geeksforgeeks',
    difficulty: 'Medium',
    category: 'Dynamic Programming',
    tags: ['Dynamic Programming', 'Knapsack'],
    importUrl: 'https://www.geeksforgeeks.org/problems/0-1-knapsack-problem0945/1'
  },
  {
    title: "Sort an array of 0s, 1s and 2s (Dutch National Flag)",
    slug: 'sort-an-array-of-0s-1s-and-2s4231',
    platform: 'geeksforgeeks',
    difficulty: 'Medium',
    category: 'Arrays',
    tags: ['Arrays', 'Sorting', 'Two Pointers'],
    importUrl: 'https://www.geeksforgeeks.org/problems/sort-an-array-of-0s-1s-and-2s4231/1'
  },
  {
    title: 'Equilibrium Point in an Array',
    slug: 'equilibrium-point-1587115620',
    platform: 'geeksforgeeks',
    difficulty: 'Easy',
    category: 'Arrays',
    tags: ['Arrays', 'Prefix Sum'],
    importUrl: 'https://www.geeksforgeeks.org/problems/equilibrium-point-1587115620/1'
  },
  {
    title: 'Peak Element',
    slug: 'peak-element',
    platform: 'geeksforgeeks',
    difficulty: 'Easy',
    category: 'Binary Search',
    tags: ['Binary Search', 'Arrays'],
    importUrl: 'https://www.geeksforgeeks.org/problems/peak-element/1'
  },
  {
    title: 'Trapping Rain Water',
    slug: 'trapping-rain-water-1587115621',
    platform: 'geeksforgeeks',
    difficulty: 'Hard',
    category: 'Arrays',
    tags: ['Arrays', 'Two Pointers', 'Stack'],
    importUrl: 'https://www.geeksforgeeks.org/problems/trapping-rain-water-1587115621/1'
  },
  {
    title: 'Longest Consecutive Subsequence',
    slug: 'longest-consecutive-subsequence2449',
    platform: 'geeksforgeeks',
    difficulty: 'Medium',
    category: 'Arrays',
    tags: ['Arrays', 'Hash Table'],
    importUrl: 'https://www.geeksforgeeks.org/problems/longest-consecutive-subsequence2449/1'
  },
  {
    title: 'Rotate Array by D elements',
    slug: 'rotate-array-by-n-elements-1587115621',
    platform: 'geeksforgeeks',
    difficulty: 'Medium',
    category: 'Arrays',
    tags: ['Arrays', 'Rotation'],
    importUrl: 'https://www.geeksforgeeks.org/problems/rotate-array-by-n-elements-1587115621/1'
  },
  {
    title: 'Binary Search in Sorted Array',
    slug: 'binary-search-1587115620',
    platform: 'geeksforgeeks',
    difficulty: 'Easy',
    category: 'Binary Search',
    tags: ['Binary Search', 'Arrays'],
    importUrl: 'https://www.geeksforgeeks.org/problems/binary-search-1587115620/1'
  },
  {
    title: 'Check for Balanced Tree',
    slug: 'check-for-balanced-tree',
    platform: 'geeksforgeeks',
    difficulty: 'Easy',
    category: 'Trees',
    tags: ['Tree', 'Binary Tree', 'DFS'],
    importUrl: 'https://www.geeksforgeeks.org/problems/check-for-balanced-tree/1'
  },
  {
    title: 'Diameter of a Binary Tree',
    slug: 'diameter-of-binary-tree',
    platform: 'geeksforgeeks',
    difficulty: 'Medium',
    category: 'Trees',
    tags: ['Tree', 'Binary Tree', 'DFS'],
    importUrl: 'https://www.geeksforgeeks.org/problems/diameter-of-binary-tree/1'
  },
  {
    title: 'Height of Binary Tree',
    slug: 'height-of-binary-tree',
    platform: 'geeksforgeeks',
    difficulty: 'Easy',
    category: 'Trees',
    tags: ['Tree', 'Binary Tree', 'DFS'],
    importUrl: 'https://www.geeksforgeeks.org/problems/height-of-binary-tree/1'
  },
  {
    title: 'BFS of Graph',
    slug: 'bfs-traversal-of-graph',
    platform: 'geeksforgeeks',
    difficulty: 'Easy',
    category: 'Graphs',
    tags: ['Graph', 'BFS', 'Queue'],
    importUrl: 'https://www.geeksforgeeks.org/problems/bfs-traversal-of-graph/1'
  },
  {
    title: 'DFS of Graph',
    slug: 'depth-first-traversal-for-a-graph',
    platform: 'geeksforgeeks',
    difficulty: 'Easy',
    category: 'Graphs',
    tags: ['Graph', 'DFS', 'Recursion'],
    importUrl: 'https://www.geeksforgeeks.org/problems/depth-first-traversal-for-a-graph/1'
  },
  {
    title: 'Detect Cycle in an Undirected Graph',
    slug: 'detect-cycle-in-an-undirected-graph',
    platform: 'geeksforgeeks',
    difficulty: 'Medium',
    category: 'Graphs',
    tags: ['Graph', 'DFS', 'BFS'],
    importUrl: 'https://www.geeksforgeeks.org/problems/detect-cycle-in-an-undirected-graph/1'
  },
  {
    title: 'Detect Cycle in a Directed Graph',
    slug: 'detect-cycle-in-a-directed-graph',
    platform: 'geeksforgeeks',
    difficulty: 'Medium',
    category: 'Graphs',
    tags: ['Graph', 'DFS', 'Topological Sort'],
    importUrl: 'https://www.geeksforgeeks.org/problems/detect-cycle-in-a-directed-graph/1'
  },
  {
    title: 'Fractional Knapsack',
    slug: 'fractional-knapsack-1587115620',
    platform: 'geeksforgeeks',
    difficulty: 'Medium',
    category: 'Greedy',
    tags: ['Greedy', 'Sorting'],
    importUrl: 'https://www.geeksforgeeks.org/problems/fractional-knapsack-1587115620/1'
  },
  {
    title: 'N Meetings in One Room',
    slug: 'n-meetings-in-one-room-1587115620',
    platform: 'geeksforgeeks',
    difficulty: 'Medium',
    category: 'Greedy',
    tags: ['Greedy', 'Sorting', 'Intervals'],
    importUrl: 'https://www.geeksforgeeks.org/problems/n-meetings-in-one-room-1587115620/1'
  },
  {
    title: 'Job Sequencing Problem',
    slug: 'job-sequencing-problem-1587115620',
    platform: 'geeksforgeeks',
    difficulty: 'Medium',
    category: 'Greedy',
    tags: ['Greedy', 'Disjoint Set'],
    importUrl: 'https://www.geeksforgeeks.org/problems/job-sequencing-problem-1587115620/1'
  },
  {
    title: 'Coin Change (Count Ways)',
    slug: 'coin-change2448',
    platform: 'geeksforgeeks',
    difficulty: 'Medium',
    category: 'Dynamic Programming',
    tags: ['Dynamic Programming', 'Coin Change'],
    importUrl: 'https://www.geeksforgeeks.org/problems/coin-change2448/1'
  },
  {
    title: 'Subset Sum Problem',
    slug: 'subset-sum-problem-1611555638',
    platform: 'geeksforgeeks',
    difficulty: 'Medium',
    category: 'Dynamic Programming',
    tags: ['Dynamic Programming', 'Knapsack'],
    importUrl: 'https://www.geeksforgeeks.org/problems/subset-sum-problem-1611555638/1'
  },
  {
    title: 'Minimum Number of Jumps',
    slug: 'minimum-number-of-jumps-1587115620',
    platform: 'geeksforgeeks',
    difficulty: 'Medium',
    category: 'Dynamic Programming',
    tags: ['Dynamic Programming', 'Greedy'],
    importUrl: 'https://www.geeksforgeeks.org/problems/minimum-number-of-jumps-1587115620/1'
  },
  {
    title: 'Longest Increasing Subsequence',
    slug: 'longest-increasing-subsequence-1587115620',
    platform: 'geeksforgeeks',
    difficulty: 'Medium',
    category: 'Dynamic Programming',
    tags: ['Dynamic Programming', 'Binary Search'],
    importUrl: 'https://www.geeksforgeeks.org/problems/longest-increasing-subsequence-1587115620/1'
  },
  {
    title: 'Edit Distance (Levenshtein Distance)',
    slug: 'edit-distance3702',
    platform: 'geeksforgeeks',
    difficulty: 'Hard',
    category: 'Dynamic Programming',
    tags: ['Dynamic Programming', 'Strings'],
    importUrl: 'https://www.geeksforgeeks.org/problems/edit-distance3702/1'
  },
  {
    title: 'Find Triplets with Zero Sum',
    slug: 'find-triplets-with-zero-sum',
    platform: 'geeksforgeeks',
    difficulty: 'Easy',
    category: 'Two Pointers',
    tags: ['Two Pointers', 'Arrays', 'Sorting'],
    importUrl: 'https://www.geeksforgeeks.org/problems/find-triplets-with-zero-sum/1'
  },
  {
    title: 'Anagram String Check',
    slug: 'anagram-1587115620',
    platform: 'geeksforgeeks',
    difficulty: 'Easy',
    category: 'Strings',
    tags: ['Strings', 'Frequency Map'],
    importUrl: 'https://www.geeksforgeeks.org/problems/anagram-1587115620/1'
  },
  {
    title: 'Longest Common Prefix in an Array',
    slug: 'longest-common-prefix-in-an-array5129',
    platform: 'geeksforgeeks',
    difficulty: 'Easy',
    category: 'Strings',
    tags: ['Strings', 'Trie'],
    importUrl: 'https://www.geeksforgeeks.org/problems/longest-common-prefix-in-an-array5129/1'
  },
  // ===================== FREECODECAMP =====================
  {
    title: 'Chunky Monkey (Split Array into Groups)',
    slug: 'chunky-monkey',
    platform: 'freecodecamp',
    difficulty: 'Easy',
    category: 'Arrays',
    tags: ['Arrays', 'Slicing', 'Algorithm Scripting'],
    importUrl: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/basic-algorithm-scripting/chunky-monkey'
  },
  {
    title: 'Diff Two Arrays (Symmetric Difference)',
    slug: 'diff-two-arrays',
    platform: 'freecodecamp',
    difficulty: 'Medium',
    category: 'Arrays',
    tags: ['Arrays', 'Intermediate Algorithm'],
    importUrl: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/intermediate-algorithm-scripting/diff-two-arrays'
  },
  {
    title: 'Seek and Destroy (Filter Elements)',
    slug: 'seek-and-destroy',
    platform: 'freecodecamp',
    difficulty: 'Medium',
    category: 'Arrays',
    tags: ['Arrays', 'Filter'],
    importUrl: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/intermediate-algorithm-scripting/seek-and-destroy'
  },
  {
    title: 'Confirm the Ending',
    slug: 'confirm-the-ending',
    platform: 'freecodecamp',
    difficulty: 'Easy',
    category: 'Strings',
    tags: ['Strings', 'Substrings'],
    importUrl: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/basic-algorithm-scripting/confirm-the-ending'
  },
  {
    title: 'Factorialize a Number',
    slug: 'factorialize-a-number',
    platform: 'freecodecamp',
    difficulty: 'Easy',
    category: 'Math',
    tags: ['Math', 'Recursion'],
    importUrl: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/basic-algorithm-scripting/factorialize-a-number'
  },
  {
    title: 'Find the Longest Word in a String',
    slug: 'find-the-longest-word-in-a-string',
    platform: 'freecodecamp',
    difficulty: 'Easy',
    category: 'Strings',
    tags: ['Strings', 'Array'],
    importUrl: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/basic-algorithm-scripting/find-the-longest-word-in-a-string'
  },
  {
    title: 'Return Largest Numbers in Arrays',
    slug: 'return-largest-numbers-in-arrays',
    platform: 'freecodecamp',
    difficulty: 'Easy',
    category: 'Arrays',
    tags: ['Arrays', 'Matrix'],
    importUrl: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/basic-algorithm-scripting/return-largest-numbers-in-arrays'
  },
  {
    title: 'Repeat a String Repeat a String',
    slug: 'repeat-a-string-repeat-a-string',
    platform: 'freecodecamp',
    difficulty: 'Easy',
    category: 'Strings',
    tags: ['Strings', 'Loops'],
    importUrl: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/basic-algorithm-scripting/repeat-a-string-repeat-a-string'
  },
  {
    title: 'Truncate a String',
    slug: 'truncate-a-string',
    platform: 'freecodecamp',
    difficulty: 'Easy',
    category: 'Strings',
    tags: ['Strings', 'Slicing'],
    importUrl: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/basic-algorithm-scripting/truncate-a-string'
  },
  {
    title: 'Finders Keepers (Array Truth Test)',
    slug: 'finders-keepers',
    platform: 'freecodecamp',
    difficulty: 'Easy',
    category: 'Arrays',
    tags: ['Arrays', 'Functions'],
    importUrl: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/basic-algorithm-scripting/finders-keepers'
  },
  {
    title: 'Boo who (Check Boolean Primitive)',
    slug: 'boo-who',
    platform: 'freecodecamp',
    difficulty: 'Easy',
    category: 'Math',
    tags: ['Basic', 'Types'],
    importUrl: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/basic-algorithm-scripting/boo-who'
  },
  {
    title: 'Title Case a Sentence',
    slug: 'title-case-a-sentence',
    platform: 'freecodecamp',
    difficulty: 'Easy',
    category: 'Strings',
    tags: ['Strings', 'Capitalization'],
    importUrl: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/basic-algorithm-scripting/title-case-a-sentence'
  },
  {
    title: 'Falsy Bouncer (Remove Falsy Values)',
    slug: 'falsy-bouncer',
    platform: 'freecodecamp',
    difficulty: 'Easy',
    category: 'Arrays',
    tags: ['Arrays', 'Filter'],
    importUrl: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/basic-algorithm-scripting/falsy-bouncer'
  },
  {
    title: 'Where do I Belong (Sorted Insertion Index)',
    slug: 'where-do-i-belong',
    platform: 'freecodecamp',
    difficulty: 'Easy',
    category: 'Sorting',
    tags: ['Sorting', 'Binary Search', 'Arrays'],
    importUrl: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/basic-algorithm-scripting/where-do-i-belong'
  },
  {
    title: 'Mutations (String Containment)',
    slug: 'mutations',
    platform: 'freecodecamp',
    difficulty: 'Easy',
    category: 'Strings',
    tags: ['Strings', 'Hash Map'],
    importUrl: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/basic-algorithm-scripting/mutations'
  },
  {
    title: 'Sum All Numbers in a Range',
    slug: 'sum-all-numbers-in-a-range',
    platform: 'freecodecamp',
    difficulty: 'Easy',
    category: 'Math',
    tags: ['Math', 'Arithmetic Progression'],
    importUrl: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/intermediate-algorithm-scripting/sum-all-numbers-in-a-range'
  },
  {
    title: 'Spinal Tap Case (Convert to Kebab-Case)',
    slug: 'spinal-tap-case',
    platform: 'freecodecamp',
    difficulty: 'Medium',
    category: 'Strings',
    tags: ['Strings', 'Regex'],
    importUrl: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/intermediate-algorithm-scripting/spinal-tap-case'
  },
  {
    title: 'Pig Latin Translator',
    slug: 'pig-latin',
    platform: 'freecodecamp',
    difficulty: 'Medium',
    category: 'Strings',
    tags: ['Strings', 'Regex', 'Phonetics'],
    importUrl: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/intermediate-algorithm-scripting/pig-latin'
  },
  {
    title: 'Search and Replace',
    slug: 'search-and-replace',
    platform: 'freecodecamp',
    difficulty: 'Medium',
    category: 'Strings',
    tags: ['Strings', 'Preserve Case'],
    importUrl: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/intermediate-algorithm-scripting/search-and-replace'
  },
  {
    title: 'DNA Pairing (Base Pairs AT & CG)',
    slug: 'dna-pairing',
    platform: 'freecodecamp',
    difficulty: 'Medium',
    category: 'Strings',
    tags: ['Strings', 'Hash Map'],
    importUrl: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/intermediate-algorithm-scripting/dna-pairing'
  },
  {
    title: 'Missing letters (Find Missing Alphabet)',
    slug: 'missing-letters',
    platform: 'freecodecamp',
    difficulty: 'Medium',
    category: 'Strings',
    tags: ['Strings', 'ASCII'],
    importUrl: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/intermediate-algorithm-scripting/missing-letters'
  },
  {
    title: 'Sorted Union (Preserve Original Order)',
    slug: 'sorted-union',
    platform: 'freecodecamp',
    difficulty: 'Medium',
    category: 'Arrays',
    tags: ['Arrays', 'Set'],
    importUrl: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/intermediate-algorithm-scripting/sorted-union'
  },
  {
    title: 'Convert HTML Entities',
    slug: 'convert-html-entities',
    platform: 'freecodecamp',
    difficulty: 'Medium',
    category: 'Strings',
    tags: ['Strings', 'Encoding'],
    importUrl: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/intermediate-algorithm-scripting/convert-html-entities'
  },
  {
    title: 'Sum All Odd Fibonacci Numbers',
    slug: 'sum-all-odd-fibonacci-numbers',
    platform: 'freecodecamp',
    difficulty: 'Medium',
    category: 'Math',
    tags: ['Math', 'Fibonacci'],
    importUrl: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/intermediate-algorithm-scripting/sum-all-odd-fibonacci-numbers'
  },
  {
    title: 'Sum All Primes (Sieve of Eratosthenes)',
    slug: 'sum-all-primes',
    platform: 'freecodecamp',
    difficulty: 'Medium',
    category: 'Math',
    tags: ['Math', 'Primes', 'Sieve'],
    importUrl: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/intermediate-algorithm-scripting/sum-all-primes'
  },
  {
    title: 'Smallest Common Multiple (Range LCM)',
    slug: 'smallest-common-multiple',
    platform: 'freecodecamp',
    difficulty: 'Medium',
    category: 'Math',
    tags: ['Math', 'GCD', 'LCM'],
    importUrl: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/intermediate-algorithm-scripting/smallest-common-multiple'
  },
  {
    title: 'Drop Elements While Condition',
    slug: 'drop-it',
    platform: 'freecodecamp',
    difficulty: 'Medium',
    category: 'Arrays',
    tags: ['Arrays', 'Filter'],
    importUrl: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/intermediate-algorithm-scripting/drop-it'
  },
  {
    title: 'Steamroller (Flatten Deeply Nested Array)',
    slug: 'steamroller',
    platform: 'freecodecamp',
    difficulty: 'Medium',
    category: 'Arrays',
    tags: ['Arrays', 'Recursion', 'Flatten'],
    importUrl: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/intermediate-algorithm-scripting/steamroller'
  },
  {
    title: 'Binary Agents (Decode Binary String to English)',
    slug: 'binary-agents',
    platform: 'freecodecamp',
    difficulty: 'Medium',
    category: 'Bit Manipulation',
    tags: ['Bit Manipulation', 'Strings', 'ASCII'],
    importUrl: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/intermediate-algorithm-scripting/binary-agents'
  },
  {
    title: 'Caesars Cipher (ROT13 Decoder)',
    slug: 'caesars-cipher',
    platform: 'freecodecamp',
    difficulty: 'Easy',
    category: 'Strings',
    tags: ['Strings', 'Cryptography'],
    importUrl: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/javascript-algorithms-and-data-structures-projects/caesars-cipher'
  },
  {
    title: 'Roman Numeral Converter',
    slug: 'roman-numeral-converter',
    platform: 'freecodecamp',
    difficulty: 'Medium',
    category: 'Math',
    tags: ['Math', 'Greedy', 'Strings'],
    importUrl: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/javascript-algorithms-and-data-structures-projects/roman-numeral-converter'
  },
  {
    title: 'Cash Register (Optimal Change Calculation)',
    slug: 'cash-register',
    platform: 'freecodecamp',
    difficulty: 'Hard',
    category: 'Greedy',
    tags: ['Greedy', 'Math', 'Currency'],
    importUrl: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/javascript-algorithms-and-data-structures-projects/cash-register'
  },

  // ===================== CODEFORCES =====================
  {
    title: 'Team (231A - Conditional Count)',
    slug: '231A',
    platform: 'codeforces',
    difficulty: 'Easy',
    category: 'Arrays',
    tags: ['Arrays', 'Brute Force'],
    importUrl: 'https://codeforces.com/problemset/problem/231/A'
  },
  {
    title: 'Next Round (158A - Cutoff Score)',
    slug: '158A',
    platform: 'codeforces',
    difficulty: 'Easy',
    category: 'Arrays',
    tags: ['Arrays', 'Implementation'],
    importUrl: 'https://codeforces.com/problemset/problem/158/A'
  },
  {
    title: 'Beautiful Matrix (263A - Manhattan Distance)',
    slug: '263A',
    platform: 'codeforces',
    difficulty: 'Easy',
    category: 'Arrays',
    tags: ['Arrays', '2D Matrix', 'Math'],
    importUrl: 'https://codeforces.com/problemset/problem/263/A'
  },
  {
    title: 'Watermelon (4A - Even Partition)',
    slug: '4A',
    platform: 'codeforces',
    difficulty: 'Easy',
    category: 'Math',
    tags: ['Math', 'Brute Force'],
    importUrl: 'https://codeforces.com/problemset/problem/4/A'
  },
  {
    title: 'Way Too Long Words (71A - Abbreviations)',
    slug: '71A',
    platform: 'codeforces',
    difficulty: 'Easy',
    category: 'Strings',
    tags: ['Strings'],
    importUrl: 'https://codeforces.com/problemset/problem/71/A'
  },

  // ===================== TOPCODER =====================
  {
    title: 'DivisibleSubsequences (Array Divisibility)',
    slug: 'divisible-subsequences',
    platform: 'topcoder',
    difficulty: 'Medium',
    category: 'Arrays',
    tags: ['Arrays', 'Math', 'Prefix Modulo'],
    importUrl: 'https://community.topcoder.com/stat?c=problem_statement&pm=1000'
  },
  {
    title: 'ABBA (String Transformation)',
    slug: 'abba',
    platform: 'topcoder',
    difficulty: 'Medium',
    category: 'Strings',
    tags: ['Strings', 'Greedy'],
    importUrl: 'https://community.topcoder.com/stat?c=problem_statement&pm=13928'
  },
  {
    title: 'SRM PalindromePath',
    slug: 'palindrome-path',
    platform: 'topcoder',
    difficulty: 'Hard',
    category: 'Dynamic Programming',
    tags: ['Dynamic Programming', 'Graph'],
    importUrl: 'https://community.topcoder.com/stat?c=problem_statement&pm=14000'
  },
  {
    title: 'LotsOfLines (Line Intersections)',
    slug: 'LotsOfLines',
    platform: 'topcoder',
    difficulty: 'Medium',
    category: 'Math',
    tags: ['Math', 'Geometry', 'GCD'],
    importUrl: 'https://community.topcoder.com/stat?c=problem_statement&pm=12952'
  },
  {
    title: 'AppleWord (Edit to Apple)',
    slug: 'AppleWord',
    platform: 'topcoder',
    difficulty: 'Easy',
    category: 'Strings',
    tags: ['Strings', 'Distance'],
    importUrl: 'https://community.topcoder.com/stat?c=problem_statement&pm=10558'
  },
  {
    title: 'SRMOverlap (Interval Conflicts)',
    slug: 'SRMOverlap',
    platform: 'topcoder',
    difficulty: 'Easy',
    category: 'Greedy',
    tags: ['Greedy', 'Sorting', 'Intervals'],
    importUrl: 'https://community.topcoder.com/stat?c=problem_statement&pm=11140'
  },
  {
    title: 'Cryptography (Product Maximization)',
    slug: 'Cryptography',
    platform: 'topcoder',
    difficulty: 'Easy',
    category: 'Math',
    tags: ['Math', 'Greedy', 'Arrays'],
    importUrl: 'https://community.topcoder.com/stat?c=problem_statement&pm=10814'
  },
  {
    title: 'SRMCodingPhase (Score Maximization)',
    slug: 'SRMCodingPhase',
    platform: 'topcoder',
    difficulty: 'Medium',
    category: 'Dynamic Programming',
    tags: ['DP', 'Knapsack', 'Optimization'],
    importUrl: 'https://community.topcoder.com/stat?c=problem_statement&pm=11381'
  },
  {
    title: 'RotatingBot (Grid Path Reconstruction)',
    slug: 'RotatingBot',
    platform: 'topcoder',
    difficulty: 'Medium',
    category: 'Arrays',
    tags: ['Simulation', 'Grid', 'Arrays'],
    importUrl: 'https://community.topcoder.com/stat?c=problem_statement&pm=12033'
  },
  {
    title: 'PairingPawns (Powers of Two Reduction)',
    slug: 'PairingPawns',
    platform: 'topcoder',
    difficulty: 'Easy',
    category: 'Greedy',
    tags: ['Greedy', 'Math', 'Arrays'],
    importUrl: 'https://community.topcoder.com/stat?c=problem_statement&pm=11802'
  },
  {
    title: 'TaroString (Subsequence Matching)',
    slug: 'TaroString',
    platform: 'topcoder',
    difficulty: 'Easy',
    category: 'Strings',
    tags: ['Strings', 'Two Pointers'],
    importUrl: 'https://community.topcoder.com/stat?c=problem_statement&pm=13650'
  },
  {
    title: 'XMarksTheSpot (Grid Coordinate Search)',
    slug: 'XMarksTheSpot',
    platform: 'topcoder',
    difficulty: 'Easy',
    category: 'Arrays',
    tags: ['Arrays', 'Matrix'],
    importUrl: 'https://community.topcoder.com/stat?c=problem_statement&pm=14436'
  },
  {
    title: 'FoxAndWord (Circular Shift Concatenation)',
    slug: 'FoxAndWord',
    platform: 'topcoder',
    difficulty: 'Easy',
    category: 'Strings',
    tags: ['Strings', 'Brute Force'],
    importUrl: 'https://community.topcoder.com/stat?c=problem_statement&pm=12739'
  },
  {
    title: 'DivideByZero (Integer Reduction Game)',
    slug: 'DivideByZero',
    platform: 'topcoder',
    difficulty: 'Easy',
    category: 'Math',
    tags: ['Math', 'Simulation'],
    importUrl: 'https://community.topcoder.com/stat?c=problem_statement&pm=13117'
  },
  {
    title: 'DoubleArray (Subarray Doubling Optimization)',
    slug: 'DoubleArray',
    platform: 'topcoder',
    difficulty: 'Medium',
    category: 'Dynamic Programming',
    tags: ['DP', 'Arrays'],
    importUrl: 'https://community.topcoder.com/stat?c=problem_statement&pm=13490'
  },
  {
    title: 'NumberString (Permutations with Comparison)',
    slug: 'NumberString',
    platform: 'topcoder',
    difficulty: 'Medium',
    category: 'Dynamic Programming',
    tags: ['DP', 'Combinatorics'],
    importUrl: 'https://community.topcoder.com/stat?c=problem_statement&pm=10928'
  },
  {
    title: 'PrivateDolls (Nesting Matryoshka Dolls)',
    slug: 'PrivateDolls',
    platform: 'topcoder',
    difficulty: 'Medium',
    category: 'Dynamic Programming',
    tags: ['DP', 'Intervals', 'LIS'],
    importUrl: 'https://community.topcoder.com/stat?c=problem_statement&pm=13770'
  },
  {
    title: 'Drbalance (Parentheses Balance Fixer)',
    slug: 'Drbalance',
    platform: 'topcoder',
    difficulty: 'Easy',
    category: 'Strings',
    tags: ['Strings', 'Greedy', 'Stack'],
    importUrl: 'https://community.topcoder.com/stat?c=problem_statement&pm=14013'
  },
  {
    title: 'BearPaws (Grid Footprint Discovery)',
    slug: 'BearPaws',
    platform: 'topcoder',
    difficulty: 'Easy',
    category: 'Graphs',
    tags: ['Graph', 'BFS', 'Matrix'],
    importUrl: 'https://community.topcoder.com/stat?c=problem_statement&pm=14188'
  },
  {
    title: 'WolfCardGame (Multiples Game Strategy)',
    slug: 'WolfCardGame',
    platform: 'topcoder',
    difficulty: 'Medium',
    category: 'Math',
    tags: ['Math', 'Game Theory', 'Greedy'],
    importUrl: 'https://community.topcoder.com/stat?c=problem_statement&pm=12543'
  },
  {
    title: 'MagicSquare (Latin & Magic Grid Validation)',
    slug: 'MagicSquare',
    platform: 'topcoder',
    difficulty: 'Easy',
    category: 'Arrays',
    tags: ['Matrix', 'Arrays', 'Math'],
    importUrl: 'https://community.topcoder.com/stat?c=problem_statement&pm=14321'
  },
  {
    title: 'MinSum (Grid Minimum Cost Path)',
    slug: 'MinSum',
    platform: 'topcoder',
    difficulty: 'Medium',
    category: 'Dynamic Programming',
    tags: ['DP', 'Grid', 'Shortest Path'],
    importUrl: 'https://community.topcoder.com/stat?c=problem_statement&pm=14502'
  },
  {
    title: 'StonesGame (Nim Pile Winning Position)',
    slug: 'StonesGame',
    platform: 'topcoder',
    difficulty: 'Medium',
    category: 'Math',
    tags: ['Game Theory', 'Math'],
    importUrl: 'https://community.topcoder.com/stat?c=problem_statement&pm=14605'
  },

  // ===================== SQL / DATABASE =====================
  // LeetCode Database
  {
    title: 'Combine Two Tables',
    slug: 'combine-two-tables',
    platform: 'leetcode',
    difficulty: 'Easy',
    category: 'Database',
    tags: ['Database', 'SQL', 'Join'],
    importUrl: 'https://leetcode.com/problems/combine-two-tables/'
  },
  {
    title: 'Second Highest Salary',
    slug: 'second-highest-salary',
    platform: 'leetcode',
    difficulty: 'Medium',
    category: 'Database',
    tags: ['Database', 'SQL', 'Subquery'],
    importUrl: 'https://leetcode.com/problems/second-highest-salary/'
  },
  {
    title: 'Nth Highest Salary',
    slug: 'nth-highest-salary',
    platform: 'leetcode',
    difficulty: 'Medium',
    category: 'Database',
    tags: ['Database', 'SQL', 'Function'],
    importUrl: 'https://leetcode.com/problems/nth-highest-salary/'
  },
  {
    title: 'Employees Earning More Than Their Managers',
    slug: 'employees-earning-more-than-their-managers',
    platform: 'leetcode',
    difficulty: 'Easy',
    category: 'Database',
    tags: ['Database', 'SQL', 'Self Join'],
    importUrl: 'https://leetcode.com/problems/employees-earning-more-than-their-managers/'
  },
  {
    title: 'Duplicate Emails',
    slug: 'duplicate-emails',
    platform: 'leetcode',
    difficulty: 'Easy',
    category: 'Database',
    tags: ['Database', 'SQL', 'GROUP BY', 'HAVING'],
    importUrl: 'https://leetcode.com/problems/duplicate-emails/'
  },
  {
    title: 'Customers Who Never Order',
    slug: 'customers-who-never-order',
    platform: 'leetcode',
    difficulty: 'Easy',
    category: 'Database',
    tags: ['Database', 'SQL', 'LEFT JOIN'],
    importUrl: 'https://leetcode.com/problems/customers-who-never-order/'
  },
  {
    title: 'Department Highest Salary',
    slug: 'department-highest-salary',
    platform: 'leetcode',
    difficulty: 'Medium',
    category: 'Database',
    tags: ['Database', 'SQL', 'Window Function', 'JOIN'],
    importUrl: 'https://leetcode.com/problems/department-highest-salary/'
  },
  {
    title: 'Delete Duplicate Emails',
    slug: 'delete-duplicate-emails',
    platform: 'leetcode',
    difficulty: 'Easy',
    category: 'Database',
    tags: ['Database', 'SQL', 'DELETE'],
    importUrl: 'https://leetcode.com/problems/delete-duplicate-emails/'
  },
  {
    title: 'Rising Temperature',
    slug: 'rising-temperature',
    platform: 'leetcode',
    difficulty: 'Easy',
    category: 'Database',
    tags: ['Database', 'SQL', 'Date Functions'],
    importUrl: 'https://leetcode.com/problems/rising-temperature/'
  },
  {
    title: 'Big Countries',
    slug: 'big-countries',
    platform: 'leetcode',
    difficulty: 'Easy',
    category: 'Database',
    tags: ['Database', 'SQL', 'Filtering'],
    importUrl: 'https://leetcode.com/problems/big-countries/'
  },
  {
    title: 'Classes More Than 5 Students',
    slug: 'classes-more-than-5-students',
    platform: 'leetcode',
    difficulty: 'Easy',
    category: 'Database',
    tags: ['Database', 'SQL', 'GROUP BY'],
    importUrl: 'https://leetcode.com/problems/classes-more-than-5-students/'
  },
  {
    title: 'Not Boring Movies',
    slug: 'not-boring-movies',
    platform: 'leetcode',
    difficulty: 'Easy',
    category: 'Database',
    tags: ['Database', 'SQL', 'MOD', 'ORDER BY'],
    importUrl: 'https://leetcode.com/problems/not-boring-movies/'
  },
  // HackerRank SQL
  {
    title: 'Revising the Select Query I',
    slug: 'revising-the-select-query',
    platform: 'hackerrank',
    difficulty: 'Easy',
    category: 'Database',
    tags: ['Database', 'SQL', 'Basic Select'],
    importUrl: 'https://www.hackerrank.com/challenges/revising-the-select-query/problem'
  },
  {
    title: 'Revising the Select Query II',
    slug: 'revising-the-select-query-2',
    platform: 'hackerrank',
    difficulty: 'Easy',
    category: 'Database',
    tags: ['Database', 'SQL', 'Basic Select'],
    importUrl: 'https://www.hackerrank.com/challenges/revising-the-select-query-2/problem'
  },
  {
    title: 'Select All (All Columns from City)',
    slug: 'select-all-sql',
    platform: 'hackerrank',
    difficulty: 'Easy',
    category: 'Database',
    tags: ['Database', 'SQL', 'Basic Select'],
    importUrl: 'https://www.hackerrank.com/challenges/select-all-sql/problem'
  },
  {
    title: 'Select By ID',
    slug: 'select-by-id',
    platform: 'hackerrank',
    difficulty: 'Easy',
    category: 'Database',
    tags: ['Database', 'SQL', 'Basic Select'],
    importUrl: 'https://www.hackerrank.com/challenges/select-by-id/problem'
  },
  {
    title: 'Japanese Cities Attributes',
    slug: 'japanese-cities-attributes',
    platform: 'hackerrank',
    difficulty: 'Easy',
    category: 'Database',
    tags: ['Database', 'SQL', 'Basic Select'],
    importUrl: 'https://www.hackerrank.com/challenges/japanese-cities-attributes/problem'
  },
  {
    title: 'Weather Observation Station 1',
    slug: 'weather-observation-station-1',
    platform: 'hackerrank',
    difficulty: 'Easy',
    category: 'Database',
    tags: ['Database', 'SQL', 'Basic Select'],
    importUrl: 'https://www.hackerrank.com/challenges/weather-observation-station-1/problem'
  },
  {
    title: 'Weather Observation Station 3 (Even ID)',
    slug: 'weather-observation-station-3',
    platform: 'hackerrank',
    difficulty: 'Easy',
    category: 'Database',
    tags: ['Database', 'SQL', 'MOD', 'DISTINCT'],
    importUrl: 'https://www.hackerrank.com/challenges/weather-observation-station-3/problem'
  },
  {
    title: 'Weather Observation Station 5 (Shortest & Longest City)',
    slug: 'weather-observation-station-5',
    platform: 'hackerrank',
    difficulty: 'Easy',
    category: 'Database',
    tags: ['Database', 'SQL', 'LENGTH', 'LIMIT'],
    importUrl: 'https://www.hackerrank.com/challenges/weather-observation-station-5/problem'
  },
  {
    title: 'Higher Than 75 Marks',
    slug: 'more-than-75-marks',
    platform: 'hackerrank',
    difficulty: 'Easy',
    category: 'Database',
    tags: ['Database', 'SQL', 'SUBSTRING', 'ORDER BY'],
    importUrl: 'https://www.hackerrank.com/challenges/more-than-75-marks/problem'
  },
  {
    title: 'Employee Salaries (> 2000 & < 10 months)',
    slug: 'salary-of-employees',
    platform: 'hackerrank',
    difficulty: 'Easy',
    category: 'Database',
    tags: ['Database', 'SQL', 'Basic Select'],
    importUrl: 'https://www.hackerrank.com/challenges/salary-of-employees/problem'
  },
  {
    title: 'The Report (Grades & Names)',
    slug: 'the-report',
    platform: 'hackerrank',
    difficulty: 'Medium',
    category: 'Database',
    tags: ['Database', 'SQL', 'JOIN', 'CASE WHEN'],
    importUrl: 'https://www.hackerrank.com/challenges/the-report/problem'
  },
  {
    title: 'Top Competitors (Full Scores Count)',
    slug: 'full-score',
    platform: 'hackerrank',
    difficulty: 'Medium',
    category: 'Database',
    tags: ['Database', 'SQL', 'Multiple Joins', 'HAVING'],
    importUrl: 'https://www.hackerrank.com/challenges/full-score/problem'
  },

  // ===================== TREES & GRAPHS =====================
  {
    title: 'Maximum Depth of Binary Tree',
    slug: 'maximum-depth-of-binary-tree',
    platform: 'leetcode',
    difficulty: 'Easy',
    category: 'Trees',
    tags: ['Tree', 'Binary Tree', 'DFS', 'BFS'],
    importUrl: 'https://leetcode.com/problems/maximum-depth-of-binary-tree/'
  },
  {
    title: 'Invert Binary Tree',
    slug: 'invert-binary-tree',
    platform: 'leetcode',
    difficulty: 'Easy',
    category: 'Trees',
    tags: ['Tree', 'Binary Tree', 'Recursion'],
    importUrl: 'https://leetcode.com/problems/invert-binary-tree/'
  },
  {
    title: 'Same Tree',
    slug: 'same-tree',
    platform: 'leetcode',
    difficulty: 'Easy',
    category: 'Trees',
    tags: ['Tree', 'Binary Tree', 'DFS'],
    importUrl: 'https://leetcode.com/problems/same-tree/'
  },
  {
    title: 'Binary Tree Level Order Traversal',
    slug: 'binary-tree-level-order-traversal',
    platform: 'leetcode',
    difficulty: 'Medium',
    category: 'Trees',
    tags: ['Tree', 'Binary Tree', 'BFS'],
    importUrl: 'https://leetcode.com/problems/binary-tree-level-order-traversal/'
  },
  {
    title: 'Validate Binary Search Tree',
    slug: 'validate-binary-search-tree',
    platform: 'leetcode',
    difficulty: 'Medium',
    category: 'Trees',
    tags: ['Tree', 'BST', 'DFS'],
    importUrl: 'https://leetcode.com/problems/validate-binary-search-tree/'
  },
  {
    title: 'Number of Islands',
    slug: 'number-of-islands',
    platform: 'leetcode',
    difficulty: 'Medium',
    category: 'Graphs',
    tags: ['Graph', 'DFS', 'BFS', 'Union Find'],
    importUrl: 'https://leetcode.com/problems/number-of-islands/'
  },
  {
    title: 'Clone Graph',
    slug: 'clone-graph',
    platform: 'leetcode',
    difficulty: 'Medium',
    category: 'Graphs',
    tags: ['Graph', 'DFS', 'BFS', 'Hash Table'],
    importUrl: 'https://leetcode.com/problems/clone-graph/'
  },
  {
    title: 'Course Schedule (Topological Sort)',
    slug: 'course-schedule',
    platform: 'leetcode',
    difficulty: 'Medium',
    category: 'Graphs',
    tags: ['Graph', 'Topological Sort', 'DFS'],
    importUrl: 'https://leetcode.com/problems/course-schedule/'
  },

  // ===================== BINARY SEARCH & TWO POINTERS =====================
  {
    title: 'Binary Search',
    slug: 'binary-search',
    platform: 'leetcode',
    difficulty: 'Easy',
    category: 'Binary Search',
    tags: ['Binary Search', 'Arrays'],
    importUrl: 'https://leetcode.com/problems/binary-search/'
  },
  {
    title: 'Search in Rotated Sorted Array',
    slug: 'search-in-rotated-sorted-array',
    platform: 'leetcode',
    difficulty: 'Medium',
    category: 'Binary Search',
    tags: ['Binary Search', 'Arrays'],
    importUrl: 'https://leetcode.com/problems/search-in-rotated-sorted-array/'
  },
  {
    title: 'Find Minimum in Rotated Sorted Array',
    slug: 'find-minimum-in-rotated-sorted-array',
    platform: 'leetcode',
    difficulty: 'Medium',
    category: 'Binary Search',
    tags: ['Binary Search', 'Arrays'],
    importUrl: 'https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/'
  },
  {
    title: '3Sum',
    slug: '3sum',
    platform: 'leetcode',
    difficulty: 'Medium',
    category: 'Two Pointers',
    tags: ['Two Pointers', 'Array', 'Sorting'],
    importUrl: 'https://leetcode.com/problems/3sum/'
  },
  {
    title: 'Container With Most Water',
    slug: 'container-with-most-water',
    platform: 'leetcode',
    difficulty: 'Medium',
    category: 'Two Pointers',
    tags: ['Two Pointers', 'Greedy', 'Array'],
    importUrl: 'https://leetcode.com/problems/container-with-most-water/'
  },

  // ===================== GREEDY & BACKTRACKING =====================
  {
    title: 'Jump Game',
    slug: 'jump-game',
    platform: 'leetcode',
    difficulty: 'Medium',
    category: 'Greedy',
    tags: ['Greedy', 'Dynamic Programming', 'Array'],
    importUrl: 'https://leetcode.com/problems/jump-game/'
  },
  {
    title: 'Gas Station',
    slug: 'gas-station',
    platform: 'leetcode',
    difficulty: 'Medium',
    category: 'Greedy',
    tags: ['Greedy', 'Array'],
    importUrl: 'https://leetcode.com/problems/gas-station/'
  },
  {
    title: 'Subsets (Power Set)',
    slug: 'subsets',
    platform: 'leetcode',
    difficulty: 'Medium',
    category: 'Backtracking',
    tags: ['Backtracking', 'Bit Manipulation'],
    importUrl: 'https://leetcode.com/problems/subsets/'
  },
  {
    title: 'Permutations',
    slug: 'permutations',
    platform: 'leetcode',
    difficulty: 'Medium',
    category: 'Backtracking',
    tags: ['Backtracking', 'Recursion'],
    importUrl: 'https://leetcode.com/problems/permutations/'
  },
  {
    title: 'Combination Sum',
    slug: 'combination-sum',
    platform: 'leetcode',
    difficulty: 'Medium',
    category: 'Backtracking',
    tags: ['Backtracking', 'Recursion'],
    importUrl: 'https://leetcode.com/problems/combination-sum/'
  },
  {
    title: 'Number of 1 Bits (Hamming Weight)',
    slug: 'number-of-1-bits',
    platform: 'leetcode',
    difficulty: 'Easy',
    category: 'Bit Manipulation',
    tags: ['Bit Manipulation'],
    importUrl: 'https://leetcode.com/problems/number-of-1-bits/'
  },
  {
    title: 'Counting Bits',
    slug: 'counting-bits',
    platform: 'leetcode',
    difficulty: 'Easy',
    category: 'Bit Manipulation',
    tags: ['Bit Manipulation', 'Dynamic Programming'],
    importUrl: 'https://leetcode.com/problems/counting-bits/'
  },
  {
    title: 'Single Number (XOR Trick)',
    slug: 'single-number',
    platform: 'leetcode',
    difficulty: 'Easy',
    category: 'Bit Manipulation',
    tags: ['Bit Manipulation', 'Array'],
    importUrl: 'https://leetcode.com/problems/single-number/'
  }
];

// Server-side in-memory cache with 30-minute TTL to prevent redundant external API fetches
interface CacheItem {
  data: any;
  timestamp: number;
}
const SERVER_SEARCH_CACHE = new Map<string, CacheItem>();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const platform = (searchParams.get('platform') || 'all').toLowerCase();
    const query = (searchParams.get('query') || '').toLowerCase().trim();
    const topic = (searchParams.get('topic') || 'all').toLowerCase().trim();
    const difficulty = (searchParams.get('difficulty') || 'all').toLowerCase().trim();

    const cacheKey = `${platform}:${topic}:${difficulty}:${query}`;
    const cached = SERVER_SEARCH_CACHE.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
      return NextResponse.json(cached.data);
    }

    let results = [...CATALOG];

    // Filter by platform
    if (platform !== 'all') {
      results = results.filter(p => p.platform === platform);
    }

    // Filter by topic / category
    if (topic !== 'all' && topic) {
      const cleanTopic = topic.replace(/-/g, ' ').toLowerCase();
      results = results.filter(p => {
        const cat = p.category.toLowerCase();
        const tagStr = p.tags.map(t => t.toLowerCase().replace(/-/g, ' ')).join(' ');
        return (
          cat.includes(cleanTopic) ||
          cleanTopic.includes(cat) ||
          p.tags.some(t => {
            const cleanT = t.toLowerCase().replace(/-/g, ' ');
            return cleanT.includes(cleanTopic) || cleanTopic.includes(cleanT);
          }) ||
          (cleanTopic.includes('depth first') && (tagStr.includes('dfs') || tagStr.includes('depth-first'))) ||
          (cleanTopic.includes('breadth first') && (tagStr.includes('bfs') || tagStr.includes('breadth-first'))) ||
          (cleanTopic.includes('union') && (tagStr.includes('dsu') || tagStr.includes('disjoint') || tagStr.includes('union-find')))
        );
      });
    }

    // Filter by difficulty
    if (difficulty !== 'all' && difficulty) {
      results = results.filter(p => p.difficulty.toLowerCase() === difficulty);
    }

    // Filter by search query
    if (query) {
      results = results.filter(p => 
        p.title.toLowerCase().includes(query) ||
        p.slug.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query) ||
        p.tags.some(t => t.toLowerCase().includes(query))
      );
    }

    let liveTotal: number | null = null;

    // Dynamic Live Query for LeetCode (Free Questions Pool)
    if (platform === 'leetcode' || (platform === 'all' && (query || topic !== 'all'))) {
      try {
        const isDbTopic = topic.includes('database') || topic.includes('sql');
        const categorySlug = isDbTopic ? 'database' : '';
        const searchTerms = [query, (!isDbTopic && topic !== 'all') ? topic : ''].filter(Boolean).join(' ');

        const lcRes = await fetch('https://leetcode.com/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
          },
          body: JSON.stringify({
            query: `
              query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
                problemsetQuestionList: questionList(categorySlug: $categorySlug, limit: $limit, skip: $skip, filters: $filters) {
                  totalNum
                  questions: data {
                    title
                    titleSlug
                    difficulty
                    paidOnly: isPaidOnly
                    topicTags { name }
                  }
                }
              }
            `,
            variables: {
              categorySlug,
              skip: 0,
              limit: 100,
              filters: searchTerms ? { searchKeywords: searchTerms } : {}
            }
          }),
          cache: 'no-store'
        });

        if (lcRes.ok) {
          const json = await lcRes.json();
          if (json?.data?.problemsetQuestionList?.totalNum) {
            liveTotal = json.data.problemsetQuestionList.totalNum;
          }
          const liveQuestions = json?.data?.problemsetQuestionList?.questions || [];
          const existingSlugs = new Set(results.map(r => r.slug));

          liveQuestions.forEach((q: any) => {
            // Only include free (unlocked) questions
            if (!q.paidOnly && !existingSlugs.has(q.titleSlug)) {
              results.push({
                title: q.title,
                slug: q.titleSlug,
                platform: 'leetcode',
                difficulty: q.difficulty,
                category: isDbTopic ? 'Database' : (q.topicTags?.[0]?.name || 'Algorithms'),
                tags: isDbTopic ? ['Database', 'SQL', ...(q.topicTags || []).map((t: any) => t.name)] : (q.topicTags || []).map((t: any) => t.name),
                importUrl: `https://leetcode.com/problems/${q.titleSlug}/`
              });
            }
          });
        }
      } catch (err) {
        // Fall back gracefully
      }
    }

    // Dynamic Live Query for Codeforces (9,000+ Free Competitive Problems)
    if (platform === 'codeforces' || (platform === 'all' && (query || topic !== 'all'))) {
      try {
        let cfTag = '';
        if (topic !== 'all' && topic) {
          if (topic.includes('dp') || topic.includes('dynamic')) cfTag = 'dp';
          else if (topic.includes('graph')) cfTag = 'graphs';
          else if (topic.includes('tree')) cfTag = 'trees';
          else if (topic.includes('math')) cfTag = 'math';
          else if (topic.includes('greedy')) cfTag = 'greedy';
          else if (topic.includes('binary')) cfTag = 'binary search';
          else if (topic.includes('string')) cfTag = 'strings';
          else if (topic.includes('two pointer')) cfTag = 'two pointers';
          else if (topic.includes('bit')) cfTag = 'bitmasks';
          else if (topic.includes('sort')) cfTag = 'sortings';
          else if (!topic.includes('database') && !topic.includes('sql')) cfTag = topic;
        }

        const cfUrl = cfTag
          ? `https://codeforces.com/api/problemset.problems?tags=${encodeURIComponent(cfTag)}`
          : 'https://codeforces.com/api/problemset.problems';

        const cfRes = await fetch(cfUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          cache: 'no-store'
        });

        if (cfRes.ok) {
          const cfJson = await cfRes.json();
          if (cfJson.status === 'OK' && cfJson.result?.problems) {
            const problems = cfJson.result.problems;
            liveTotal = problems.length;
            const existingSlugs = new Set(results.map(r => r.slug));
            let added = 0;

            for (const p of problems) {
              if (added >= 100) break;
              const slug = `cf-${p.contestId}-${p.index}`;
              if (!existingSlugs.has(slug)) {
                if (!query || p.name.toLowerCase().includes(query) || p.tags?.some((t: string) => t.toLowerCase().includes(query))) {
                  results.push({
                    title: `${p.name} (CF ${p.contestId}${p.index})`,
                    slug,
                    platform: 'codeforces',
                    difficulty: p.rating ? (p.rating < 1200 ? 'Easy' : p.rating < 1800 ? 'Medium' : 'Hard') : 'Medium',
                    category: p.tags?.[0] || 'Algorithms',
                    tags: p.tags || ['Competitive Programming'],
                    importUrl: `https://codeforces.com/problemset/problem/${p.contestId}/${p.index}`
                  });
                  added++;
                }
              }
            }
          }
        }
      } catch (cfErr) {
        // Fall back gracefully
      }
    }

    const PLATFORM_COUNTS: Record<string, { total: number; free: number }> = {
      all: { total: 22000, free: 18500 },
      leetcode: { total: 3150, free: 2350 },
      codeforces: { total: 9150, free: 9150 },
      codechef: { total: 2900, free: 2800 },
      geeksforgeeks: { total: 4200, free: 3900 },
      hackerrank: { total: 750, free: 700 },
      freecodecamp: { total: 320, free: 320 },
      topcoder: { total: 1100, free: 1100 },
    };

    // Strict deduplication by platform + slug to eliminate any duplicate keys
    const seen = new Set<string>();
    const uniqueResults = results.filter(p => {
      const key = `${p.platform}:${p.slug}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const platInfo = PLATFORM_COUNTS[platform] || PLATFORM_COUNTS.all;
    const totalProblemsInPlatform = liveTotal || platInfo.total;

    // Calculate real available problem counts for topics based on catalog + results
    const ALL_TOPIC_KEYS = [
      'array', 'string', 'hash table', 'math', 'dynamic programming', 'sorting',
      'greedy', 'binary search', 'depth-first search', 'database', 'bit manipulation',
      'matrix', 'prefix sum', 'tree', 'two pointers', 'breadth-first search',
      'heap', 'simulation', 'counting', 'graph', 'stack', 'binary tree',
      'sliding window', 'enumeration', 'design', 'backtracking', 'number theory',
      'union find', 'segment tree', 'linked list', 'ordered set', 'monotonic stack',
      'divide and conquer', 'combinatorics', 'trie', 'queue', 'bitmask',
      'binary indexed tree', 'recursion', 'hash function', 'geometry', 'memoization',
      'shortest path', 'binary search tree', 'topological sort', 'string matching',
      'rolling hash', 'game theory', 'monotonic queue', 'interactive', 'data stream',
      'brainteaser', 'merge sort', 'minimax', 'doubly-linked list', 'randomized',
      'counting sort', 'iterator', 'concurrency', 'suffix array', 'quickselect', 'sweep line'
    ];

    const topicCounts: Record<string, number> = {};
    if (topic && topic !== 'all') {
      topicCounts[topic] = uniqueResults.length;
    } else {
      // Topic is 'all': compute available problem count for every topic from our available pool
      const pool = uniqueResults;
      for (const t of ALL_TOPIC_KEYS) {
        const cleanT = t.replace(/-/g, ' ').toLowerCase();
        const cnt = pool.filter(p => {
          const cat = p.category.toLowerCase();
          const tagStr = p.tags.map(x => x.toLowerCase().replace(/-/g, ' ')).join(' ');
          return (
            cat.includes(cleanT) ||
            cleanT.includes(cat) ||
            p.tags.some(x => {
              const cx = x.toLowerCase().replace(/-/g, ' ');
              return cx.includes(cleanT) || cleanT.includes(cx);
            }) ||
            (cleanT.includes('depth first') && (tagStr.includes('dfs') || tagStr.includes('depth-first'))) ||
            (cleanT.includes('breadth first') && (tagStr.includes('bfs') || tagStr.includes('breadth-first'))) ||
            (cleanT.includes('union') && (tagStr.includes('dsu') || tagStr.includes('disjoint') || tagStr.includes('union-find')))
          );
        }).length;
        if (cnt > 0) {
          topicCounts[t] = cnt;
        }
      }
    }

    const responsePayload = {
      success: true,
      totalLoaded: uniqueResults.length,
      totalAvailable: totalProblemsInPlatform,
      totalFree: platInfo.free,
      platform,
      query,
      topicCounts,
      results: uniqueResults
    };

    // Cache the response
    SERVER_SEARCH_CACHE.set(cacheKey, { data: responsePayload, timestamp: Date.now() });

    return NextResponse.json(responsePayload);

  } catch (error: any) {
    console.error('[Search API Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to search questions' }, { status: 500 });
  }
}
