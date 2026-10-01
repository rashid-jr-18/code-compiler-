import { NextRequest, NextResponse } from 'next/server';

interface CatalogProblem {
  title: string;
  slug: string;
  platform: 'leetcode' | 'codechef' | 'hackerrank' | 'geeksforgeeks';
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
    title: 'Maximum Product Subarray',
    slug: 'maximum-product-subarray3604',
    platform: 'geeksforgeeks',
    difficulty: 'Medium',
    category: 'Arrays',
    tags: ['Array', 'Dynamic Programming'],
    importUrl: 'https://www.geeksforgeeks.org/problems/maximum-product-subarray3604/1'
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const platform = (searchParams.get('platform') || 'all').toLowerCase();
    const query = (searchParams.get('query') || '').toLowerCase().trim();
    const topic = (searchParams.get('topic') || 'all').toLowerCase().trim();
    const difficulty = (searchParams.get('difficulty') || 'all').toLowerCase().trim();

    let results = CATALOG;

    // Filter by platform
    if (platform !== 'all') {
      results = results.filter(p => p.platform === platform);
    }

    // Filter by topic / category
    if (topic !== 'all' && topic) {
      results = results.filter(p => 
        p.category.toLowerCase().includes(topic) ||
        p.tags.some(t => t.toLowerCase().includes(topic))
      );
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

    // Dynamic Live Query: If LeetCode and query exists and results are low, try querying live LeetCode GraphQL
    if ((platform === 'leetcode' || platform === 'all') && query && results.length < 5) {
      try {
        const lcRes = await fetch('https://leetcode.com/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0'
          },
          body: JSON.stringify({
            query: `
              query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
                problemsetQuestionList: questionList(categorySlug: $categorySlug, limit: $limit, skip: $skip, filters: $filters) {
                  questions: data {
                    title
                    titleSlug
                    difficulty
                    topicTags { name }
                  }
                }
              }
            `,
            variables: {
              categorySlug: '',
              skip: 0,
              limit: 10,
              filters: { searchKeywords: query }
            }
          }),
          cache: 'no-store'
        });

        if (lcRes.ok) {
          const json = await lcRes.json();
          const liveQuestions = json?.data?.problemsetQuestionList?.questions || [];
          const existingSlugs = new Set(results.map(r => r.slug));

          liveQuestions.forEach((q: any) => {
            if (!existingSlugs.has(q.titleSlug)) {
              results.push({
                title: q.title,
                slug: q.titleSlug,
                platform: 'leetcode',
                difficulty: q.difficulty,
                category: q.topicTags?.[0]?.name || 'Algorithms',
                tags: (q.topicTags || []).map((t: any) => t.name),
                importUrl: `https://leetcode.com/problems/${q.titleSlug}/`
              });
            }
          });
        }
      } catch (err) {
        // Fall back gracefully to catalog
      }
    }

    return NextResponse.json({
      success: true,
      total: results.length,
      platform,
      query,
      results
    });

  } catch (error: any) {
    console.error('[Search API Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to search questions' }, { status: 500 });
  }
}

