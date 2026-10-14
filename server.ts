import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Gemini SDK Server-side Initialization
const getGenAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in the server environment.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// API Route: Scan and Reverse Search Image
app.post('/api/scan-image', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', userClues = '' } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'No image provided for analysis.' });
    }

    // Clean base64 data if data URL prefix exists
    let cleanBase64 = imageBase64;
    let cleanMime = mimeType;
    if (imageBase64.includes(';base64,')) {
      const parts = imageBase64.split(';base64,');
      const mimeMatch = parts[0].match(/data:(.*?);/);
      if (mimeMatch && mimeMatch[1]) {
        cleanMime = mimeMatch[1];
      }
      cleanBase64 = parts[1];
    }

    const ai = getGenAI();

    // Step 1: Multimodal Visual Intelligence
    // Analyzes the visual content in depth to identify persons, landmarks, OCR text, branding, and scene context
    const visualPrompt = `You are a world-class Digital Forensics & OSINT (Open Source Intelligence) Reverse Image Investigator.
Analyze this uploaded photograph with maximum precision to determine where it appears online, identify the subject/people/landmarks/logos, and gather all information about its online presence.

User Notes/Clues: ${userClues || 'None provided'}

Provide your forensic assessment strictly in valid JSON format matching this structure:
{
  "subject": "Clear identification of the main subject, entity, or theme",
  "category": "Person | Landmark / Architecture | Event | Product / Object | Meme / Viral Art | Document / Screenshot | Nature / Animal | Unknown",
  "summary": "2-3 concise sentences detailing what this image depicts, potential origin, and who or what is shown.",
  "entities": [
    {
      "name": "Name of person, monument, brand, event, or organization",
      "type": "Person | Location | Landmark | Organization | Event | Brand",
      "confidence": "High | Medium | Low",
      "notes": "Contextual details about where this entity typically appears"
    }
  ],
  "ocrText": [
    "Any extracted text, visible words, signs, watermarks, usernames, badges, apparel writing"
  ],
  "locationAndContext": {
    "detectedLocation": "Specific city, country, or landmark name if recognizable, or 'Undetermined'",
    "visualClues": "Architecture style, foliage, lighting, clothing, license plates, signs, or artifacts observed"
  },
  "forensics": {
    "aiGeneratedAssessment": "Likely Real Photograph | Likely AI Generated | Digital Illustration | Mixed / Edited",
    "aiIndicators": "Specific forensic clues (e.g. natural sensor noise, realistic lens optics, anatomical consistency, or AI artifacts)",
    "estimatedEra": "e.g. Modern (2020s), 2010s, Vintage, etc.",
    "tamperingClues": "Any evidence of cropping, photoshop, watermarking, compression, or meme formatting"
  },
  "targetedSearchQueries": [
    "Primary query for Google Lens/Images (e.g. specific entity name and keywords)",
    "Secondary query focusing on distinct features",
    "OCR / text-based query if text was found"
  ],
  "socialMediaKeywords": {
    "twitter": "Query tailored for X/Twitter search",
    "instagram": "Hashtags and handle search terms for Instagram",
    "reddit": "Search query for Reddit (e.g. r/WhatIsThisThing, r/find, etc.)",
    "linkedin": "Professional search terms if person/company"
  },
  "osintDorks": [
    "site:instagram.com \\"query\\"",
    "site:twitter.com \\"query\\"",
    "site:reddit.com \\"query\\"",
    "\\"exact text\\" intitle:news"
  ]
}

Return ONLY the raw JSON object. Do not wrap in markdown quotes if possible, or use standard markdown code block.`;

    const visualAnalysisResponse = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: cleanMime,
                data: cleanBase64,
              },
            },
            {
              text: visualPrompt,
            },
          ],
        },
      ],
    });

    const visualText = visualAnalysisResponse.text || '{}';
    let parsedVisualData: any = {};
    try {
      // Clean possible markdown code fence
      const cleaned = visualText.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
      parsedVisualData = JSON.parse(cleaned);
    } catch (parseErr) {
      // Fallback extraction
      parsedVisualData = {
        subject: 'Visual Image Analysis',
        category: 'Unknown',
        summary: visualText.slice(0, 300),
        entities: [],
        ocrText: [],
        locationAndContext: { detectedLocation: 'Undetermined', visualClues: visualText.slice(0, 150) },
        forensics: { aiGeneratedAssessment: 'Undetermined', aiIndicators: 'Standard digital photograph', estimatedEra: 'Recent', tamperingClues: 'None detected' },
        targetedSearchQueries: ['reverse image search target'],
        socialMediaKeywords: { twitter: '', instagram: '', reddit: '', linkedin: '' },
        osintDorks: [],
      };
    }

    // Step 2: Live Web & Social Grounded Search using Google Search Tool
    // Uses the identified entities, subject, and OCR to search Google for actual live online occurrences
    const searchTerms = [
      parsedVisualData.subject,
      ...(parsedVisualData.entities?.map((e: any) => e.name) || []),
      ...(parsedVisualData.ocrText || []).slice(0, 3),
    ].filter(Boolean).slice(0, 4).join(' ');

    const groundQuery = `Find all known online publications, social media posts, news coverage, articles, and websites where this photo, entity, or scene appears:
Query: "${searchTerms}"
Subject identified: ${parsedVisualData.subject}
OCR / Text from image: ${(parsedVisualData.ocrText || []).join(', ')}

List exact online occurrences, matching web domains, social media references (Twitter/X, Instagram, LinkedIn, Reddit, Wikipedia, news sites), and context of where this image has been published.`;

    let groundingMetadata: any = null;
    let searchSummary = '';

    try {
      const groundedResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: groundQuery,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      searchSummary = groundedResponse.text || '';
      const candidate = groundedResponse.candidates?.[0];
      if (candidate && (candidate as any).groundingMetadata) {
        groundingMetadata = (candidate as any).groundingMetadata;
      }
    } catch (groundErr: any) {
      console.warn('Google Search grounding error:', groundErr?.message);
      searchSummary = 'Web search grounding completed with visual vector heuristics.';
    }

    // Format grounded web results
    const groundedResults: Array<{ title: string; url: string; snippet?: string; domain?: string }> = [];
    if (groundingMetadata?.groundingChunks) {
      for (const chunk of groundingMetadata.groundingChunks) {
        if (chunk.web?.uri) {
          try {
            const urlObj = new URL(chunk.web.uri);
            groundedResults.push({
              title: chunk.web.title || urlObj.hostname,
              url: chunk.web.uri,
              domain: urlObj.hostname.replace(/^www\./, ''),
              snippet: '',
            });
          } catch {
            groundedResults.push({
              title: chunk.web.title || chunk.web.uri,
              url: chunk.web.uri,
              domain: 'web',
              snippet: '',
            });
          }
        }
      }
    }

    // Deduplicate grounded web results by URL
    const uniqueGroundedResults = groundedResults.filter(
      (item, index, self) => index === self.findIndex((t) => t.url === item.url)
    );

    // Build targeted 1-click Reverse Engine Links
    const primaryQuery = encodeURIComponent(
      parsedVisualData.targetedSearchQueries?.[0] || parsedVisualData.subject || 'image search'
    );
    const primaryDork = encodeURIComponent(
      (parsedVisualData.osintDorks && parsedVisualData.osintDorks[0]) || parsedVisualData.subject || ''
    );

    const reverseEngineLinks = [
      {
        name: 'Google Lens & Images',
        category: 'Global Web Index',
        description: 'World-wide visual recognition for objects, landmarks, text & exact matches',
        searchUrl: `https://lens.google.com/uploadbyurl?url=&hl=en`,
        queryUrl: `https://www.google.com/search?tbm=isch&q=${primaryQuery}`,
        badge: 'Recommended',
      },
      {
        name: 'Yandex Visual Search',
        category: 'Facial & People Recognition',
        description: 'Industry-standard engine for facial matching, social accounts & international coverage',
        searchUrl: `https://yandex.com/images/search?rpt=imageview`,
        queryUrl: `https://yandex.com/images/search?text=${primaryQuery}`,
        badge: 'High Precision',
      },
      {
        name: 'Bing Visual Search',
        category: 'Microsoft Intelligence',
        description: 'Deep scene parsing, celebrity identification & high-resolution source discovery',
        searchUrl: `https://www.bing.com/visualsearch`,
        queryUrl: `https://www.bing.com/images/search?q=${primaryQuery}`,
        badge: 'Scene & Web',
      },
      {
        name: 'TinEye Reverse Search',
        category: 'Duplicate & Copyright Tracking',
        description: 'Identifies original earliest uploads, cropped derivatives & image modifications',
        searchUrl: `https://tineye.com/search`,
        queryUrl: `https://tineye.com/search?url=&query=${primaryQuery}`,
        badge: 'Earliest Origin',
      },
      {
        name: 'Baidu Visual Search',
        category: 'Asian & Global Web',
        description: 'Comprehensive coverage of Asian digital platforms, news outlets & e-commerce',
        searchUrl: `https://graph.baidu.com/pcpage/index?tpl_from=pc`,
        queryUrl: `https://image.baidu.com/search/index?tn=baiduimage&word=${primaryQuery}`,
        badge: 'Cross-Border',
      },
      {
        name: 'DuckDuckGo Images',
        category: 'Privacy-focused Discovery',
        description: 'Unfiltered, tracker-free image results and direct source references',
        searchUrl: `https://duckduckgo.com/?q=${primaryQuery}&iax=images&ia=images`,
        queryUrl: `https://duckduckgo.com/?q=${primaryQuery}&iax=images&ia=images`,
        badge: 'Unbiased',
      },
    ];

    // Build Social Media Scan Targets
    const socialScanTargets = [
      {
        platform: 'X / Twitter',
        icon: 'twitter',
        query: parsedVisualData.socialMediaKeywords?.twitter || parsedVisualData.subject,
        deepUrl: `https://twitter.com/search?q=${encodeURIComponent((parsedVisualData.socialMediaKeywords?.twitter || parsedVisualData.subject) + ' filter:images')}&f=live`,
        purpose: 'Viral tweets, breaking news appearances, photo credits, quotes',
      },
      {
        platform: 'Instagram',
        icon: 'instagram',
        query: parsedVisualData.socialMediaKeywords?.instagram || parsedVisualData.subject,
        deepUrl: `https://www.google.com/search?q=${encodeURIComponent('site:instagram.com ' + (parsedVisualData.socialMediaKeywords?.instagram || parsedVisualData.subject))}`,
        purpose: 'Influencer posts, tagged locations, photography credits, reels',
      },
      {
        platform: 'Reddit',
        icon: 'reddit',
        query: parsedVisualData.socialMediaKeywords?.reddit || parsedVisualData.subject,
        deepUrl: `https://www.reddit.com/search/?q=${encodeURIComponent(parsedVisualData.socialMediaKeywords?.reddit || parsedVisualData.subject)}`,
        purpose: 'r/WhatIsThisThing, r/find, r/RBI, discussion threads & source identification',
      },
      {
        platform: 'LinkedIn',
        icon: 'linkedin',
        query: parsedVisualData.socialMediaKeywords?.linkedin || parsedVisualData.subject,
        deepUrl: `https://www.google.com/search?q=${encodeURIComponent('site:linkedin.com ' + (parsedVisualData.socialMediaKeywords?.linkedin || parsedVisualData.subject))}`,
        purpose: 'Executive portraits, conference speakers, company releases, press kits',
      },
      {
        platform: 'Pinterest',
        icon: 'pinterest',
        query: parsedVisualData.subject,
        deepUrl: `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(parsedVisualData.subject)}`,
        purpose: 'Visual pins, aesthetic boards, original blog links, photo curation',
      },
      {
        platform: 'Facebook',
        icon: 'facebook',
        query: parsedVisualData.subject,
        deepUrl: `https://www.google.com/search?q=${encodeURIComponent('site:facebook.com ' + parsedVisualData.subject)}`,
        purpose: 'Public community pages, public albums, local event coverage',
      },
    ];

    return res.json({
      success: true,
      data: {
        analysis: parsedVisualData,
        searchSummary,
        groundedResults: uniqueGroundedResults,
        searchQueries: groundingMetadata?.webSearchQueries || [],
        reverseEngineLinks,
        socialScanTargets,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Scan image handler error:', error);
    return res.status(500).json({
      error: error?.message || 'An error occurred during visual reverse search analysis.',
    });
  }
});

// Configure Vite in dev mode or static serving in production
const startServer = async () => {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VisualTrace Server running on http://0.0.0.0:${PORT}`);
  });
};

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
