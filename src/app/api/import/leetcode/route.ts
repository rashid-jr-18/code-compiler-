import { NextRequest, NextResponse } from 'next/server';

// -------------------------------------------------------------
// Helper: Clean HTML to Markdown
// -------------------------------------------------------------
function cleanHtmlToMarkdown(html: string): string {
  if (!html) return '';

  let md = html;

  md = md
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&le;/g, '<=')
    .replace(/&ge;/g, '>=')
    .replace(/<sup>(.*?)<\/sup>/gi, '^($1)');

  md = md.replace(/<strong class="example">\s*Example\s*(\d+):?\s*<\/strong>/gi, '\n### Example $1:\n');
  md = md.replace(/<p><strong class="example">/gi, '\n### ');
  md = md.replace(/<strong>Constraints:?<\/strong>/gi, '\n### Constraints:\n');
  md = md.replace(/<strong>Follow-up:?<\/strong>/gi, '\n### Follow-up:\n');

  md = md.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, (_, codeContent) => {
    const cleanPre = codeContent.replace(/<[^>]+>/g, '').trim();
    return `\n\`\`\`text\n${cleanPre}\n\`\`\`\n`;
  });

  md = md.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');
  md = md.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
  md = md.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
  md = md.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
  md = md.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');

  md = md.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');
  md = md.replace(/<\/?ul[^>]*>/gi, '\n');
  md = md.replace(/<\/?ol[^>]*>/gi, '\n');

  md = md.replace(/<p[^>]*>/gi, '\n');
  md = md.replace(/<\/p>/gi, '\n');
  md = md.replace(/<br\s*\/?>/gi, '\n');

  md = md.replace(/<[^>]+>/g, '');
  md = md.replace(/\n{3,}/g, '\n\n').trim();

  return md;
}

// -------------------------------------------------------------
// Helper: Extract input/output pairs from HTML or text
// -------------------------------------------------------------
function extractExamples(text: string): Array<{ input: string; expectedOutput: string; description?: string }> {
  const examples: Array<{ input: string; expectedOutput: string; description?: string }> = [];

  // Pattern 1: HTML <pre> blocks containing Input: ... Output: ...
  const preRegex = /<pre[^>]*>([\s\S]*?)<\/pre>/gi;
  let match;

  while ((match = preRegex.exec(text)) !== null) {
    const block = match[1]
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");

    const inputMatch = block.match(/(?:<[^>]+>)?\s*Input:\s*(?:<\/[^>]+>)?\s*([\s\S]*?)(?=(?:<[^>]+>)?\s*Output:|$)/i);
    const outputMatch = block.match(/(?:<[^>]+>)?\s*Output:\s*(?:<\/[^>]+>)?\s*([\s\S]*?)(?=(?:<[^>]+>)?\s*Explanation:|$)/i);

    if (inputMatch && outputMatch) {
      const cleanInput = inputMatch[1].replace(/<[^>]+>/g, '').trim();
      const cleanOutput = outputMatch[1].replace(/<[^>]+>/g, '').trim();
      if (cleanInput && cleanOutput) {
        examples.push({
          input: cleanInput,
          expectedOutput: cleanOutput,
          description: `Example ${examples.length + 1}`
        });
      }
    }
  }

  // Pattern 2: Markdown or plain text "Sample Input" / "Sample Output" (used in HackerRank, CodeChef, GFG, freeCodeCamp)
  if (examples.length === 0) {
    const markdownRegex = /(?:Sample\s+Input|Example\s*\d*[:\s]*Input|Input[:\s]+)(?:[^\n]*\n)?(?:```[a-z]*\n)?([\s\S]*?)(?:```)?\s*(?:Sample\s+Output|Output[:\s]+)(?:[^\n]*\n)?(?:```[a-z]*\n)?([\s\S]*?)(?:```|\n(?=Sample\s+Input|Example|\n\n\n)|Explanation:|$)/gi;
    
    let mdMatch;
    while ((mdMatch = markdownRegex.exec(text)) !== null) {
      const cleanIn = mdMatch[1].replace(/```/g, '').trim();
      const cleanOut = mdMatch[2].replace(/```/g, '').trim();
      if (cleanIn && cleanOut) {
        examples.push({
          input: cleanIn,
          expectedOutput: cleanOut,
          description: `Sample Case ${examples.length + 1}`
        });
      }
    }
  }

  return examples;
}

// -------------------------------------------------------------
// Helper: Allocate 100 points cleanly across test cases
// -------------------------------------------------------------
function buildBalancedTestCases(examples: Array<{ input: string; expectedOutput: string; description?: string }>): any[] {
  if (!examples || examples.length === 0) return [];

  const testCases = examples.map((ex, idx) => {
    const isHidden = examples.length >= 3 && idx >= 2;
    return {
      id: `tc_import_${Date.now()}_${idx}`,
      input: ex.input,
      expectedOutput: ex.expectedOutput,
      points: 0,
      description: isHidden ? `Hidden Case ${idx + 1} (Boundary)` : (ex.description || `Sample Case ${idx + 1}`),
      isHidden
    };
  });

  if (testCases.length === 4) {
    testCases[0].points = 20;
    testCases[1].points = 20;
    testCases[2].points = 30;
    testCases[3].points = 30;
  } else if (testCases.length === 3) {
    testCases[0].points = 25;
    testCases[1].points = 25;
    testCases[2].points = 50;
  } else if (testCases.length > 0) {
    const pts = Math.floor(100 / testCases.length);
    const rem = 100 - (pts * testCases.length);
    testCases.forEach((tc, idx) => {
      tc.points = idx === 0 ? pts + rem : pts;
    });
  }

  return testCases;
}

// -------------------------------------------------------------
// 1. HackerRank Importer
// -------------------------------------------------------------
async function fetchHackerRank(urlOrSlug: string) {
  let slug = urlOrSlug.trim();
  const match = slug.match(/challenges\/([a-zA-Z0-9_-]+)/);
  if (match) slug = match[1];

  const apiUrl = `https://www.hackerrank.com/rest/contests/master/challenges/${slug}`;
  const res = await fetch(apiUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'application/json'
    },
    cache: 'no-store'
  });

  if (!res.ok) throw new Error(`HackerRank challenge "${slug}" not found (HTTP ${res.status})`);
  const data = await res.json();
  const model = data.model;
  if (!model) throw new Error('Could not parse HackerRank challenge data');

  const title = model.name || slug;
  const rawBody = model.body || '';
  const difficulty = model.difficulty_name === 'Hard' ? 'Hard' : model.difficulty_name === 'Medium' ? 'Medium' : 'Easy';
  const category = model.primary_contest?.name || 'Algorithms';
  const tags = model.tags || ['HackerRank'];

  // Parse examples from markdown body
  const examples = extractExamples(rawBody);
  const testCases = buildBalancedTestCases(examples);

  return {
    title,
    titleSlug: slug,
    difficulty,
    category,
    tags,
    description: rawBody,
    sampleInput: examples[0]?.input || '',
    sampleOutput: examples[0]?.expectedOutput || '',
    testCases,
    hints: []
  };
}

// -------------------------------------------------------------
// 2. CodeChef Importer
// -------------------------------------------------------------
async function fetchCodeChef(urlOrCode: string) {
  let code = urlOrCode.trim();
  const match = code.match(/problems\/([a-zA-Z0-9_-]+)/);
  if (match) code = match[1];
  code = code.toUpperCase();

  const apiUrl = `https://www.codechef.com/api/contests/PRACTICE/problems/${code}`;
  let json: any = null;

  try {
    const res = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/json'
      },
      cache: 'no-store'
    });
    if (res.ok) json = await res.json();
  } catch (err) {
    console.warn('[CodeChef] API fetch failed, will try web scrape fallback:', err);
  }

  // Scrape fallback if API is protected
  if (!json || !json.problem_name) {
    const pageRes = await fetch(`https://www.codechef.com/problems/${code}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      cache: 'no-store'
    });
    if (!pageRes.ok) throw new Error(`CodeChef problem "${code}" not found`);
    const pageHtml = await pageRes.text();
    const titleMatch = pageHtml.match(/<title>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].replace(/\|.*$/g, '').trim() : code;
    const examples = extractExamples(pageHtml);

    return {
      title,
      titleSlug: code.toLowerCase(),
      difficulty: 'Medium' as const,
      category: 'CodeChef',
      tags: ['Competitive Programming'],
      description: cleanHtmlToMarkdown(pageHtml.substring(0, 3000)),
      sampleInput: examples[0]?.input || '',
      sampleOutput: examples[0]?.expectedOutput || '',
      testCases: buildBalancedTestCases(examples),
      hints: []
    };
  }

  const title = json.problem_name || code;
  const rawBody = json.body || '';
  const markdown = cleanHtmlToMarkdown(rawBody);
  const examples = extractExamples(rawBody);
  const testCases = buildBalancedTestCases(examples);

  return {
    title,
    titleSlug: code.toLowerCase(),
    difficulty: (json.difficulty_rating && json.difficulty_rating > 1600 ? 'Hard' : json.difficulty_rating > 1200 ? 'Medium' : 'Easy') as 'Easy' | 'Medium' | 'Hard',
    category: 'CodeChef',
    tags: json.tags || ['CodeChef'],
    description: markdown,
    sampleInput: examples[0]?.input || '',
    sampleOutput: examples[0]?.expectedOutput || '',
    testCases,
    hints: []
  };
}

// -------------------------------------------------------------
// 3. GeeksforGeeks Importer
// -------------------------------------------------------------
async function fetchGeeksforGeeks(url: string) {
  let slug = url.trim();
  const match = slug.match(/problems\/([a-zA-Z0-9_-]+)/);
  if (match) slug = match[1];

  const pageUrl = url.startsWith('http') ? url : `https://www.geeksforgeeks.org/problems/${slug}/1`;
  const res = await fetch(pageUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'text/html'
    },
    cache: 'no-store'
  });

  if (!res.ok) throw new Error(`Could not fetch GeeksforGeeks problem (HTTP ${res.status}). Try using the "Smart Paste" tab.`);
  const html = await res.text();

  // Extract Title
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  let title = titleMatch ? titleMatch[1].replace(/\|.*$/g, '').replace(/Practice.*$/gi, '').trim() : slug;
  title = title.replace(/GeeksforGeeks/gi, '').trim();

  // Extract Examples
  const examples = extractExamples(html);
  const testCases = buildBalancedTestCases(examples);
  const markdown = cleanHtmlToMarkdown(html);

  return {
    title: title || 'GeeksforGeeks Challenge',
    titleSlug: slug,
    difficulty: (html.includes('Hard') ? 'Hard' : html.includes('Medium') ? 'Medium' : 'Easy') as 'Easy' | 'Medium' | 'Hard',
    category: 'GeeksforGeeks',
    tags: ['Data Structures', 'Algorithms'],
    description: markdown || `Problem from GeeksforGeeks: ${title}`,
    sampleInput: examples[0]?.input || '',
    sampleOutput: examples[0]?.expectedOutput || '',
    testCases,
    hints: []
  };
}

// -------------------------------------------------------------
// 4. LeetCode Importer (with GraphQL + Mirror fallback)
// -------------------------------------------------------------
async function fetchLeetCode(urlOrSlug: string) {
  let slug = urlOrSlug.trim();
  const urlMatch = slug.match(/problems\/([a-zA-Z0-9_-]+)/);
  if (urlMatch) slug = urlMatch[1];
  slug = slug.toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/--+/g, '-').replace(/^-|-$/g, '');

  const graphqlQuery = {
    query: `
      query questionData($titleSlug: String!) {
        question(titleSlug: $titleSlug) {
          questionId
          questionFrontendId
          title
          titleSlug
          content
          difficulty
          isPaidOnly
          topicTags { name }
          exampleTestcaseList
          hints
        }
      }
    `,
    variables: { titleSlug: slug }
  };

  let questionData: any = null;

  try {
    const leetcodeRes = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Referer': 'https://leetcode.com'
      },
      body: JSON.stringify(graphqlQuery),
      cache: 'no-store'
    });

    if (leetcodeRes.ok) {
      const json = await leetcodeRes.json();
      questionData = json?.data?.question;
    }
  } catch (lcErr) {
    console.warn('[LeetCode] GraphQL failed, trying mirror:', lcErr);
  }

  // Mirror fallback
  if (!questionData) {
    try {
      const mirrorRes = await fetch(`https://alfa-leetcode-api.onrender.com/select?titleSlug=${encodeURIComponent(slug)}`, {
        headers: { 'Accept': 'application/json' },
        cache: 'no-store'
      });
      if (mirrorRes.ok) {
        const mirrorData = await mirrorRes.json();
        if (mirrorData && mirrorData.questionTitle) {
          questionData = {
            title: mirrorData.questionTitle,
            difficulty: mirrorData.difficulty,
            content: mirrorData.question,
            topicTags: mirrorData.topicTags,
            exampleTestcaseList: mirrorData.exampleTestcases ? mirrorData.exampleTestcases.split('\n') : []
          };
        }
      }
    } catch (mirrorErr) {
      console.warn('[LeetCode] Mirror also failed:', mirrorErr);
    }
  }

  if (!questionData) {
    throw new Error(`Problem "${slug}" not found on LeetCode.`);
  }

  if (questionData.isPaidOnly) {
    throw new Error(`Problem "${questionData.title}" is a LeetCode Premium-only problem.`);
  }

  const title = questionData.title || slug;
  const difficulty = (questionData.difficulty === 'Medium' ? 'Medium' : questionData.difficulty === 'Hard' ? 'Hard' : 'Easy') as 'Easy' | 'Medium' | 'Hard';
  const rawContent = questionData.content || '';
  const markdownDescription = cleanHtmlToMarkdown(rawContent);
  const tags: string[] = (questionData.topicTags || []).map((t: any) => t.name || t);
  const category = tags.length > 0 ? tags.slice(0, 2).join(', ') : 'Algorithms';

  const examples = extractExamples(rawContent);
  const testCases = buildBalancedTestCases(examples);

  return {
    title,
    titleSlug: slug,
    difficulty,
    category,
    tags,
    description: markdownDescription,
    sampleInput: examples[0]?.input || '',
    sampleOutput: examples[0]?.expectedOutput || '',
    testCases,
    hints: questionData.hints || []
  };
}

// -------------------------------------------------------------
// 5. Universal Smart Text / Markdown Parser (100% Platform Coverage)
// -------------------------------------------------------------
function parseSmartText(text: string) {
  if (!text || !text.trim()) {
    throw new Error('Please paste problem text or markdown');
  }

  const lines = text.trim().split('\n').map(l => l.trim()).filter(l => l.length > 0);

  // Extract Title: Look for "# Title", "Problem: Title", or 1st non-empty line
  let title = 'Imported Problem';
  const titleLine = lines.find(l => /^#\s+/i.test(l) || /^Problem:\s*/i.test(l) || /^Title:\s*/i.test(l));
  if (titleLine) {
    title = titleLine.replace(/^#+\s*/, '').replace(/^(Problem|Title):\s*/i, '').trim();
  } else if (lines.length > 0) {
    title = lines[0].replace(/^#+\s*/, '').substring(0, 80).trim();
  }

  // Extract Difficulty if mentioned
  let difficulty: 'Easy' | 'Medium' | 'Hard' = 'Medium';
  if (/\b(hard|difficult)\b/i.test(text)) difficulty = 'Hard';
  else if (/\b(easy|simple|basic)\b/i.test(text)) difficulty = 'Easy';

  // Extract Category / Tags
  const categoryMatch = text.match(/(?:Category|Topic|Tags?)[:\s]+([^\n]+)/i);
  const category = categoryMatch ? categoryMatch[1].trim() : 'Algorithms';

  // Extract Examples / Test Cases
  const examples = extractExamples(text);
  const testCases = buildBalancedTestCases(examples);

  return {
    title,
    titleSlug: title.toLowerCase().replace(/[^a-z0-9_-]/g, '-').substring(0, 40),
    difficulty,
    category,
    tags: [category],
    description: text.trim(),
    sampleInput: examples[0]?.input || '',
    sampleOutput: examples[0]?.expectedOutput || '',
    testCases,
    hints: []
  };
}

// -------------------------------------------------------------
// Main Handler
// -------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { urlOrSlug, rawText, mode = 'url' } = body;

    // Handle Smart Paste Mode
    if (mode === 'smart-paste' || (rawText && rawText.trim())) {
      const data = parseSmartText(rawText || urlOrSlug);
      return NextResponse.json({ success: true, platform: 'smart-paste', data });
    }

    if (!urlOrSlug || typeof urlOrSlug !== 'string' || !urlOrSlug.trim()) {
      return NextResponse.json({ error: 'Please enter a URL or problem text' }, { status: 400 });
    }

    const input = urlOrSlug.trim();

    // Auto-detect Platform by URL or keyword
    let result: any = null;
    let detectedPlatform = 'leetcode';

    if (input.includes('hackerrank.com')) {
      detectedPlatform = 'hackerrank';
      result = await fetchHackerRank(input);
    } else if (input.includes('codechef.com')) {
      detectedPlatform = 'codechef';
      result = await fetchCodeChef(input);
    } else if (input.includes('geeksforgeeks.org')) {
      detectedPlatform = 'geeksforgeeks';
      result = await fetchGeeksforGeeks(input);
    } else if (input.includes('freecodecamp.org')) {
      detectedPlatform = 'freecodecamp';
      result = parseSmartText(input); // freeCodeCamp text or curriculum challenge
    } else if (input.startsWith('http://') || input.startsWith('https://')) {
      // General URL or LeetCode URL
      if (input.includes('leetcode.com')) {
        detectedPlatform = 'leetcode';
        result = await fetchLeetCode(input);
      } else {
        // Universal web fetch fallback
        detectedPlatform = 'web';
        const pageRes = await fetch(input, { headers: { 'User-Agent': 'Mozilla/5.0' }, cache: 'no-store' });
        if (!pageRes.ok) throw new Error(`Could not fetch URL (HTTP ${pageRes.status})`);
        const pageHtml = await pageRes.text();
        result = parseSmartText(pageHtml);
      }
    } else {
      // Default: LeetCode problem slug (e.g. "two-sum" or "reverse-linked-list")
      detectedPlatform = 'leetcode';
      result = await fetchLeetCode(input);
    }

    return NextResponse.json({
      success: true,
      platform: detectedPlatform,
      data: result
    });

  } catch (error: any) {
    console.error('[Universal Import API] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to import problem' },
      { status: 500 }
    );
  }
}
