import { CATEGORY_SUGGESTIONS, VALUE_ALIGNED_SUGGESTIONS, VALUE_DISCOVERY_SUGGESTIONS } from "../constants/suggestions";
import { ResultsData } from "../types";
import { detectValueScores } from "./valueDetection";
import { objEntries } from "./helpers";
import { Suggestion } from "../components/SuggestionCard";
import { VALUE_SIGNALS } from "../constants/values";

export function computeResults(
  allAnswers: string[],
  categoryScores: Record<string, number>,
  previousValueScores?: Record<string, number>
): ResultsData {
  const text = allAnswers.join(" \n");
  const newValueScores = detectValueScores(text);
  
  // Merge with previous value scores - keep the higher score for each value
  const valueScores = { ...newValueScores };
  if (previousValueScores) {
    for (const [value, score] of objEntries(previousValueScores)) {
      if (!valueScores[value] || valueScores[value] < score) {
        valueScores[value] = score;
      }
    }
  }
  
  // Debug logging
  console.log("Value Detection Debug:", {
    allAnswers,
    text,
    newValueScores,
    previousValueScores,
    mergedValueScores: valueScores,
    answerCount: allAnswers.length
  });

  // Sorted values
  const valueEntries = objEntries(valueScores).sort((a, b) => b[1] - a[1]);
  const valueList = valueEntries.map(([k]) => k);

  // Generate contextual suggestions with clear separation
  const suggestions: Suggestion[] = [];
  const weakAreaSuggestions: Suggestion[] = [];
  const valueStrengthSuggestions: Suggestion[] = [];
  const discoveryAreaSuggestions: Suggestion[] = [];

  // Get top 3 values for value-aligned suggestions (high scores = strengths to leverage)
  const topValues = valueEntries.slice(0, 3).map(([v]) => v);
  
  // Get bottom 3 values (or undetected ones) for discovery suggestions
  const allPossibleValues = Object.keys(VALUE_SIGNALS);
  const detectedValues = valueEntries.map(([v]) => v);
  const undetectedValues = allPossibleValues.filter(v => !detectedValues.includes(v));
  const lowValues = [...valueEntries.slice(-3).map(([v]) => v), ...undetectedValues].slice(0, 3);
  
  console.log("Suggestion Generation Debug:", {
    topValues,
    lowValues,
    categoryScores,
    valueEntries
  });
  
  // Add ONE suggestion per top value (total: up to 3 value suggestions)
  topValues.forEach(value => {
    const valueSuggestions = VALUE_ALIGNED_SUGGESTIONS[value] || [];
    console.log(`Value suggestions for ${value}:`, valueSuggestions.length);
    if (valueSuggestions.length > 0) {
      const suggestion = valueSuggestions[0]; // Take only the first suggestion
      const enrichedSuggestion = {
        ...suggestion,
        id: `value-${value}-${suggestion.title.toLowerCase().replace(/\s+/g, '-')}`
      };
      valueStrengthSuggestions.push(enrichedSuggestion);
      suggestions.push(enrichedSuggestion);
    }
  });

  console.log("Value strength suggestions generated:", valueStrengthSuggestions.length);

  // Fallback: If no values detected, add default value suggestions
  if (valueStrengthSuggestions.length === 0) {
    console.log("No values detected - adding fallback value suggestions");
    const fallbackValues = ["connection", "growth", "balance"];
    fallbackValues.forEach(value => {
      const valueSuggestions = VALUE_ALIGNED_SUGGESTIONS[value] || [];
      if (valueSuggestions.length > 0) {
        const suggestion = valueSuggestions[0];
        const enrichedSuggestion = {
          ...suggestion,
          id: `value-fallback-${value}-${suggestion.title.toLowerCase().replace(/\s+/g, '-')}`
        };
        valueStrengthSuggestions.push(enrichedSuggestion);
        suggestions.push(enrichedSuggestion);
      }
    });
  }

  // Get bottom 3 categories for improvement suggestions (low scores = areas to improve)
  const weakCats = objEntries(categoryScores ?? {})
    .sort((a, b) => a[1] - b[1]) // ascending (weakest first)
    .slice(0, 3)
    .map(([c]) => c);

  console.log("Weak categories:", weakCats);

  // Add ONE suggestion per weak category (total: 3 improvement suggestions)
  weakCats.forEach(category => {
    const categorySuggestions = CATEGORY_SUGGESTIONS[category] || [];
    console.log(`Category suggestions for ${category}:`, categorySuggestions.length);
    if (categorySuggestions.length > 0) {
      const suggestion = categorySuggestions[0]; // Take only the first (highest priority) suggestion
      const enrichedSuggestion = {
        ...suggestion,
        id: `improvement-${category}-${suggestion.title.toLowerCase().replace(/\s+/g, '-')}`
      };
      weakAreaSuggestions.push(enrichedSuggestion);
      suggestions.push(enrichedSuggestion);
    }
  });

  // Add discovery suggestions for unexplored values (total: 3 discovery suggestions)
  lowValues.forEach(value => {
    const discoverySuggestions = VALUE_DISCOVERY_SUGGESTIONS[value] || [];
    console.log(`Discovery suggestions for ${value}:`, discoverySuggestions.length);
    if (discoverySuggestions.length > 0) {
      const suggestion = discoverySuggestions[0]; // Take the first suggestion
      const enrichedSuggestion = {
        ...suggestion,
        id: `discovery-${value}-${suggestion.title.toLowerCase().replace(/\s+/g, '-')}`
      };
      discoveryAreaSuggestions.push(enrichedSuggestion);
      suggestions.push(enrichedSuggestion);
    }
  });

  console.log("Total suggestions generated:", {
    total: suggestions.length,
    weakAreas: weakAreaSuggestions.length,
    valueStrengths: valueStrengthSuggestions.length,
    discovery: discoveryAreaSuggestions.length
  });

  // Fallback suggestion if no suggestions generated
  if (suggestions.length === 0) {
    suggestions.push({
      id: "fallback-journal",
      title: "Journal Reflection",
      description: "Start with a simple reflection to understand your energy patterns.",
      action: "Write a 5-line journal: one energy giver, one drainer, and why.",
      category: "Learning & Growth",
      value: "growth",
      priority: "medium",
      type: "value-aligned",
      estimatedTime: "5 min",
      difficulty: "easy"
    });
  }

  // Convert to legacy format for backward compatibility
  const aligned: string[] = suggestions
    .filter(s => s.type === "value-aligned")
    .map(s => s.action);
  
  const improvement: string[] = suggestions
    .filter(s => s.type === "weakness")
    .map(s => s.action);

  // Personal code summary
  const topValuesText = valueEntries.length
    ? valueEntries
        .slice(0, 6)
        .map(([k]) => k.charAt(0).toUpperCase() + k.slice(1))
        .join(", ")
    : "Growth, Honesty, Discovery";
  const personalCode =
    `I value ${topValuesText}. I thrive when I'm aligned with what energises me, learning consistently, and connecting with people I trust. ` +
    `This is a starting point — your values will evolve as you explore and journal.`;

  return { 
    personalCode, 
    aligned, 
    improvement, 
    valueEntries, 
    suggestions,
    weakAreaSuggestions,
    valueStrengthSuggestions,
    discoveryAreaSuggestions
  };
}

