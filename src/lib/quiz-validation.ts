/**
 * Normalize an answer string for comparison
 */
function normalizeAnswer(answer: string): string {
  return answer
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ');    // Normalize whitespace
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Validate a user's answer against the correct answers
 * USCIS questions often have multiple acceptable answers
 */
export function validateAnswer(
  userAnswer: string,
  correctAnswers: string[]
): { isCorrect: boolean; matchedAnswer: string | null } {
  const normalizedUserAnswer = normalizeAnswer(userAnswer);

  // Skip empty answers
  if (!normalizedUserAnswer) {
    return { isCorrect: false, matchedAnswer: null };
  }

  for (const correctAnswer of correctAnswers) {
    const normalizedCorrect = normalizeAnswer(correctAnswer);

    // Exact match
    if (normalizedUserAnswer === normalizedCorrect) {
      return { isCorrect: true, matchedAnswer: correctAnswer };
    }

    // Contains match (for longer answers or partial matches)
    if (normalizedCorrect.length > 10) {
      // Check if user answer contains key parts of the correct answer
      const keyWords = normalizedCorrect.split(' ').filter(w => w.length > 3);
      const matchedWords = keyWords.filter(w => normalizedUserAnswer.includes(w));
      if (matchedWords.length >= Math.ceil(keyWords.length * 0.6)) {
        return { isCorrect: true, matchedAnswer: correctAnswer };
      }
    }

    // Fuzzy match for typos (20% tolerance)
    const distance = levenshteinDistance(normalizedUserAnswer, normalizedCorrect);
    const threshold = Math.max(2, Math.floor(normalizedCorrect.length * 0.2));
    if (distance <= threshold) {
      return { isCorrect: true, matchedAnswer: correctAnswer };
    }
  }

  return { isCorrect: false, matchedAnswer: null };
}

/**
 * Get a hint for a question (first letter of each word in the answer)
 */
export function getAnswerHint(correctAnswers: string[]): string {
  if (correctAnswers.length === 0) return '';

  const firstAnswer = correctAnswers[0];
  const words = firstAnswer.split(' ');
  return words.map(w => w.charAt(0).toUpperCase() + '...').join(' ');
}
