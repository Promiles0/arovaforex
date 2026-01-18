import { supabase } from "@/integrations/supabase/client";

export interface KnowledgeEntry {
  id: string;
  intent: string;
  keywords: string[];
  answer: string;
  category: string;
  priority: number;
  active: boolean;
}

interface MatchResult {
  entry: KnowledgeEntry;
  score: number;
  matchedKeywords: string[];
}

export interface DetailedMatchResult {
  entry: KnowledgeEntry;
  score: number;
  baseScore: number;
  priorityMultiplier: number;
  matchedKeywords: string[];
}

/**
 * Smart matching algorithm
 * Returns best matching knowledge base entry
 */
export function findBestMatch(
  userMessage: string,
  knowledgeBase: KnowledgeEntry[]
): MatchResult | null {
  const messageLower = userMessage.toLowerCase().trim();
  const messageWords = messageLower.split(/\s+/).filter(w => w.length > 1);
  
  const matches: MatchResult[] = [];

  // Score each knowledge entry
  for (const entry of knowledgeBase) {
    if (!entry.active) continue;

    const matchedKeywords: string[] = [];
    let score = 0;

    // Check each keyword
    for (const keyword of entry.keywords) {
      const keywordLower = keyword.toLowerCase();
      
      // Exact phrase match (highest score)
      if (messageLower.includes(keywordLower)) {
        matchedKeywords.push(keyword);
        // Longer keyword matches are more specific, give bonus
        score += 10 + (keywordLower.split(' ').length - 1) * 3;
        continue;
      }

      // Individual word matches
      const keywordWords = keywordLower.split(/\s+/);
      const matchingWords = keywordWords.filter(kw => 
        messageWords.some(mw => mw.includes(kw) || kw.includes(mw))
      );

      if (matchingWords.length > 0) {
        matchedKeywords.push(keyword);
        score += matchingWords.length * 3;
      }
    }

    // Apply priority multiplier (priority 1-10 becomes 1.0-2.0 multiplier)
    if (matchedKeywords.length > 0) {
      const priorityMultiplier = 1 + (entry.priority - 1) / 10;
      score *= priorityMultiplier;
      matches.push({ entry, score, matchedKeywords });
    }
  }

  // Sort by score (descending)
  matches.sort((a, b) => b.score - a.score);

  // Return best match if score is above threshold
  const bestMatch = matches[0];
  if (bestMatch && bestMatch.score >= 8) {
    return bestMatch;
  }

  return null;
}

/**
 * Find all matches with detailed scoring information
 * Used for testing and analysis in admin panel
 */
export function findAllMatches(
  userMessage: string,
  knowledgeBase: KnowledgeEntry[]
): DetailedMatchResult[] {
  const messageLower = userMessage.toLowerCase().trim();
  const messageWords = messageLower.split(/\s+/).filter(w => w.length > 1);
  
  const matches: DetailedMatchResult[] = [];

  for (const entry of knowledgeBase) {
    if (!entry.active) continue;

    const matchedKeywords: string[] = [];
    let baseScore = 0;

    for (const keyword of entry.keywords) {
      const keywordLower = keyword.toLowerCase();
      
      // Exact phrase match (highest score)
      if (messageLower.includes(keywordLower)) {
        matchedKeywords.push(keyword);
        baseScore += 10 + (keywordLower.split(' ').length - 1) * 3;
        continue;
      }

      // Individual word matches
      const keywordWords = keywordLower.split(/\s+/);
      const matchingWords = keywordWords.filter(kw => 
        messageWords.some(mw => mw.includes(kw) || kw.includes(mw))
      );

      if (matchingWords.length > 0) {
        matchedKeywords.push(keyword);
        baseScore += matchingWords.length * 3;
      }
    }

    if (matchedKeywords.length > 0) {
      const priorityMultiplier = 1 + (entry.priority - 1) / 10;
      const finalScore = baseScore * priorityMultiplier;
      
      matches.push({ 
        entry, 
        score: finalScore, 
        baseScore,
        priorityMultiplier,
        matchedKeywords 
      });
    }
  }

  // Sort by score descending
  matches.sort((a, b) => b.score - a.score);
  return matches;
}

/**
 * Get AI assistant response based on user message
 */
export async function getAssistantResponse(
  userMessage: string
): Promise<{ response: string; matchedIntent?: string; isUnmatched: boolean }> {
  try {
    // Fetch active knowledge base entries
    const { data: knowledgeBase, error } = await supabase
      .from('ai_knowledge_base')
      .select('*')
      .eq('active', true);

    if (error) {
      console.error('Error fetching knowledge base:', error);
      throw error;
    }

    if (!knowledgeBase || knowledgeBase.length === 0) {
      return {
        response: "I'm still learning! Our team is adding more information to help you better. In the meantime, contact support@arovaforex.com for assistance. 😊",
        isUnmatched: true,
      };
    }

    // Find best match
    const match = findBestMatch(userMessage, knowledgeBase as KnowledgeEntry[]);

    if (match) {
      return {
        response: match.entry.answer,
        matchedIntent: match.entry.intent,
        isUnmatched: false,
      };
    }

    // Fallback response
    return {
      response: "I'm not sure I understand that question. Could you rephrase it? You can ask about:\n\n• Platform features (wallet, calculator, live room)\n• Trading education (risk management, position sizing)\n• General support\n\nOr contact support@arovaforex.com for personalized help. 😊",
      isUnmatched: true,
    };
  } catch (error) {
    console.error('Error getting assistant response:', error);
    return {
      response: "Sorry, I'm experiencing technical difficulties. Please try again or contact support@arovaforex.com.",
      isUnmatched: true,
    };
  }
}
