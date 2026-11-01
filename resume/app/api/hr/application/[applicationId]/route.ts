import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/server/auth";
import { db } from "@/server/database/connection";
import { findInterviewByApplicationId } from "@/server/repositories/interviewRepository";
import { calculateKeywordMatch, MatchingKeyword } from "@/server/matching/keywordMatcher";
import { notifyCandidateApplicationStatus, notifyHRSelection } from "@/server/services/notificationService";

export const runtime = "nodejs";

// ============================================================
// TYPES
// ============================================================

type ApplicationStatus =
    | "APPLIED"
    | "SHORTLISTED"
    | "INTERVIEW_SCHEDULED"
    | "SELECTED"
    | "REJECTED";

// ============================================================
// GET /api/hr/application/:applicationId
// ============================================================

export async function GET(
    _request: NextRequest,
    {
        params,
    }: {
        params: Promise<{
            applicationId: string;
        }>;
    }
) {
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

        const resolvedParams = await params;
        const applicationId = Number(resolvedParams.applicationId);

        if (!Number.isInteger(applicationId) || applicationId <= 0) {
            return NextResponse.json(
                { success: false, error: "Invalid application ID." },
                { status: 400 }
            );
        }

        const [applicationRows] = await db.execute(
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
                p.description AS project_description,
                p.target_type AS project_target_type,
                p.status AS project_status,
                u.full_name AS candidate_name,
                u.email AS candidate_email,
                u.phone AS candidate_phone,
                u.college_details AS candidate_college_details,
                r.id AS resume_id,
                r.file_name AS resume_file_name,
                r.extracted_text AS resume_raw_text
            FROM applications AS a
            INNER JOIN users AS u ON a.user_id = u.id
            INNER JOIN projects AS p ON a.project_id = p.id
            LEFT JOIN resumes AS r ON a.id = r.application_id
            WHERE a.id = ?
            LIMIT 1
            `,
            [applicationId]
        );

        if (!Array.isArray(applicationRows) || applicationRows.length === 0) {
            return NextResponse.json(
                { success: false, error: "Application not found." },
                { status: 404 }
            );
        }

        const appRow = applicationRows[0] as Record<string, any>;

        // Fetch project keywords
        const [keywordRows] = await db.query(
            `SELECT keyword, weight FROM project_keywords WHERE project_id = ? ORDER BY weight DESC`,
            [appRow.project_id]
        );

        const projectKeywords = (keywordRows as MatchingKeyword[]) || [];
        const resumeRawText = appRow.resume_raw_text || "";

        // Calculate single source of truth keyword evaluation
        const matchResult = calculateKeywordMatch(resumeRawText, projectKeywords);

        // Build detailed items with weights
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
            earnedScore: Number(appRow.score) || matchResult.score,
            maxScore,
            confidencePercentage: Number(appRow.confidence_percentage) || matchResult.confidencePercentage,
            matchedKeywordsWithWeights: matchedDetails,
            missingKeywordsWithWeights: missingDetails,
        };

        const [historyRows] = await db.execute(
            `
            SELECT
                h.id,
                h.application_id,
                h.old_status,
                h.new_status,
                h.changed_by,
                h.decision_note,
                h.changed_at,
                u.full_name AS changed_by_name,
                u.email AS changed_by_email
            FROM application_status_history AS h
            LEFT JOIN users AS u ON h.changed_by = u.id
            WHERE h.application_id = ?
            ORDER BY h.changed_at ASC, h.id ASC
            `,
            [applicationId]
        );

        const interview = await findInterviewByApplicationId(applicationId);

        // Remove heavy raw text from final output
        const { resume_raw_text: _discard, ...cleanApplication } = appRow;

        return NextResponse.json(
            {
                success: true,
                application: cleanApplication,
                evaluationDetails,
                history: Array.isArray(historyRows) ? historyRows : [],
                interview,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Get HR application details error:", error);

        return NextResponse.json(
            { success: false, error: "Failed to retrieve application details." },
            { status: 500 }
        );
    }
}

// ============================================================
// PUT /api/hr/application/:applicationId
// ============================================================

export async function PUT(
    request: NextRequest,
    {
        params,
    }: {
        params: Promise<{
            applicationId: string;
        }>;
    }
) {
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
                { success: false, error: "Only HR users can update applications." },
                { status: 403 }
            );
        }

        const resolvedParams = await params;
        const applicationId = Number(resolvedParams.applicationId);

        if (!Number.isInteger(applicationId) || applicationId <= 0) {
            return NextResponse.json(
                { success: false, error: "Invalid application ID." },
                { status: 400 }
            );
        }

        const body = await request.json();
        const newStatus = body.status as ApplicationStatus;
        const decisionNote =
            typeof body.decisionNote === "string" ? body.decisionNote.trim() || null : null;

        const allowedStatuses: ApplicationStatus[] = [
            "APPLIED",
            "SHORTLISTED",
            "INTERVIEW_SCHEDULED",
            "SELECTED",
            "REJECTED",
        ];

        if (!allowedStatuses.includes(newStatus)) {
            return NextResponse.json(
                { success: false, error: "Invalid application status." },
                { status: 400 }
            );
        }

        const [applicationRows] = await db.execute(
            `
            SELECT a.id, a.user_id, a.status, p.title AS project_title, u.full_name AS candidate_name
            FROM applications AS a
            INNER JOIN projects AS p ON a.project_id = p.id
            INNER JOIN users AS u ON a.user_id = u.id
            WHERE a.id = ?
            LIMIT 1
            `,
            [applicationId]
        );

        if (!Array.isArray(applicationRows) || applicationRows.length === 0) {
            return NextResponse.json(
                { success: false, error: "Application not found." },
                { status: 404 }
            );
        }

        const currentApplication = applicationRows[0] as {
            id: number;
            user_id: number;
            status: ApplicationStatus;
            project_title: string;
            candidate_name: string;
        };

        const oldStatus = currentApplication.status;

        if (oldStatus === newStatus) {
            return NextResponse.json(
                { success: false, error: "Application is already in this status." },
                { status: 400 }
            );
        }

        // Rule: SELECTED and REJECTED are terminal recruitment decisions.
        if (oldStatus === "SELECTED" || oldStatus === "REJECTED") {
            return NextResponse.json(
                {
                    success: false,
                    error: `Application is in terminal state (${oldStatus}) and cannot be changed.`,
                },
                { status: 400 }
            );
        }

        // Rule: HR cannot change status to INTERVIEW_SCHEDULED directly via PUT.
        if (newStatus === "INTERVIEW_SCHEDULED") {
            return NextResponse.json(
                {
                    success: false,
                    error: "Interview scheduling must be performed via the interview module.",
                },
                { status: 400 }
            );
        }

        // Rule: If interview exists and status is SCHEDULED, SELECTED and REJECTED are disabled.
        if (newStatus === "SELECTED" || newStatus === "REJECTED") {
            if (oldStatus === "INTERVIEW_SCHEDULED") {
                const interview = await findInterviewByApplicationId(applicationId);
                if (interview && interview.status === "SCHEDULED") {
                    return NextResponse.json(
                        {
                            success: false,
                            error: "Cannot select or reject a candidate while an interview is currently SCHEDULED. Please wait until the interview is COMPLETED.",
                        },
                        { status: 400 }
                    );
                }
            }
        }

        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            await connection.execute(
                `
                UPDATE applications
                SET status = ?, updated_at = CURRENT_TIMESTAMP(3)
                WHERE id = ?
                `,
                [newStatus, applicationId]
            );

            await connection.execute(
                `
                INSERT INTO application_status_history
                (application_id, old_status, new_status, changed_by, decision_note)
                VALUES (?, ?, ?, ?, ?)
                `,
                [applicationId, oldStatus, newStatus, session.userId, decisionNote]
            );

            await connection.commit();
        } catch (transactionError) {
            await connection.rollback();
            throw transactionError;
        } finally {
            connection.release();
        }

        // Dispatch in-app notification to candidate
        await notifyCandidateApplicationStatus(
            currentApplication.user_id,
            applicationId,
            currentApplication.project_title,
            newStatus,
            decisionNote
        );

        // Dispatch in-app notification to HR if SELECTED
        if (newStatus === "SELECTED") {
            try {
                await notifyHRSelection(
                    currentApplication.candidate_name || "Candidate",
                    currentApplication.project_title,
                    applicationId
                );
            } catch (hrNotifErr) {
                console.error("Failed to notify HR selection:", hrNotifErr);
            }
        }

        return NextResponse.json(
            {
                success: true,
                message: "Application status updated successfully.",
                applicationId,
                oldStatus,
                newStatus,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Update HR application status error:", error);

        return NextResponse.json(
            { success: false, error: "Failed to update application status." },
            { status: 500 }
        );
    }
}