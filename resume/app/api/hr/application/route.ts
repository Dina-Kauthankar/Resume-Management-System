import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/server/auth";
import { db } from "@/server/database/connection";
import { calculateKeywordMatch, MatchingKeyword } from "@/server/matching/keywordMatcher";

export const runtime = "nodejs";

// ============================================================
// GET /api/hr/application
// ============================================================

export async function GET(_request: NextRequest) {
    try {
        const session = await getAuthSession();

        if (!session) {
            return NextResponse.json(
                { success: false, error: "Not authenticated." },
                { status: 401 }
            );
        }

        if (session.role !== "HR") {
            return NextResponse.json(
                { success: false, error: "Only HR users can view applications." },
                { status: 403 }
            );
        }

        // Fetch applications with resume raw text
        const [rows] = await db.execute(
            `
            SELECT
                a.id,
                a.user_id,
                a.project_id,
                a.applicant_type,
                a.status,
                a.score,
                a.matched_keywords,
                a.confidence_percentage,
                a.created_at,
                a.updated_at,
                p.title AS project_title,
                u.full_name AS candidate_name,
                u.email AS candidate_email,
                r.id AS resume_id,
                r.file_name AS resume_file_name,
                r.extracted_text AS resume_raw_text
            FROM applications AS a
            INNER JOIN users AS u ON a.user_id = u.id
            INNER JOIN projects AS p ON a.project_id = p.id
            LEFT JOIN resumes AS r ON a.id = r.application_id
            ORDER BY a.created_at DESC
            `
        );

        const applicationList = (rows as any[]) || [];

        if (applicationList.length === 0) {
            return NextResponse.json({ success: true, applications: [] }, { status: 200 });
        }

        const projectIds = Array.from(new Set(applicationList.map((a) => a.project_id)));

        const [keywordRows] = await db.query(
            `SELECT id, project_id, keyword, weight FROM project_keywords WHERE project_id IN (?) ORDER BY weight DESC`,
            [projectIds]
        );

        const allKeywords = (keywordRows as any[]) || [];

        const enrichedApplications = applicationList.map((app) => {
            const projectKeywords: MatchingKeyword[] = allKeywords
                .filter((k) => k.project_id === app.project_id)
                .map((k) => ({ keyword: k.keyword, weight: Number(k.weight) || 1 }));

            const resumeText = app.resume_raw_text || "";
            const matchResult = calculateKeywordMatch(resumeText, projectKeywords);

            const matchedDetails = projectKeywords
                .filter((pk) => matchResult.matchedKeywords.includes(pk.keyword))
                .map((pk) => ({ keyword: pk.keyword, weight: pk.weight }));

            const missingDetails = projectKeywords
                .filter((pk) => matchResult.missingKeywords.includes(pk.keyword))
                .map((pk) => ({ keyword: pk.keyword, weight: pk.weight }));

            const maxScore = projectKeywords.reduce((acc, curr) => acc + curr.weight, 0);

            const evaluationDetails = {
                totalKeywordsCount: projectKeywords.length,
                matchedCount: matchResult.matchedKeywords.length,
                missingCount: matchResult.missingKeywords.length,
                earnedScore: Number(app.score) || matchResult.score,
                maxScore,
                confidencePercentage: Number(app.confidence_percentage) || matchResult.confidencePercentage,
                matchedKeywordsWithWeights: matchedDetails,
                missingKeywordsWithWeights: missingDetails,
            };

            const { resume_raw_text: _discard, ...cleanApp } = app;

            return {
                ...cleanApp,
                evaluationDetails,
            };
        });

        return NextResponse.json(
            {
                success: true,
                applications: enrichedApplications,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Get HR applications error:", error);

        return NextResponse.json(
            {
                success: false,
                error: "Failed to retrieve applications.",
            },
            { status: 500 }
        );
    }
}