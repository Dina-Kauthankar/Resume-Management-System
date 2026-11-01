import { normalizeText } from "./normalize";

// Types

export type MatchingKeyword = {
    keyword: string;
    weight: number;
};

export type MatchingResult = {
    score: number;
    matchedKeywords: string[];
    missingKeywords: string[];
    confidencePercentage: number;
};

// Weighted Keyword Matching

export function calculateKeywordMatch(
    resumeText: string,
    projectKeywords: MatchingKeyword[]
): MatchingResult {

    // 1. Normalize resume text

    const normalizedResume = normalizeText(resumeText);

    // 2. Prepare result arrays

    const matchedKeywords: string[] = [];
    const missingKeywords: string[] = [];

    // 3. Calculate maximum possible score

    const maximumScore = projectKeywords.reduce(
        (total, item) => total + item.weight,
        0
    );

    // 4. Check every project keyword

    let score = 0;

    for (const item of projectKeywords) {

        const normalizedKeyword = normalizeText(item.keyword);

        // Keyword found in resume

        if (normalizedResume.includes(normalizedKeyword)) {

            matchedKeywords.push(item.keyword);

            score += item.weight;

        }

        // Keyword not found

        else {

            missingKeywords.push(item.keyword);
        }
    }

    // 5. Calculate confidence percentage

    const confidencePercentage =
        maximumScore === 0
            ? 0
            : (score / maximumScore) * 100;

    // 6. Return result

    return {
        score,
        matchedKeywords,
        missingKeywords,
        confidencePercentage: Number(
            confidencePercentage.toFixed(2)
        ),
    };
}
