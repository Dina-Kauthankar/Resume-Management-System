import { ApplicantType } from "@/server/auth";
import { findUserById } from "@/server/repositories/userRepository";
import {
    approveJobChangeRequest,
    createJobChangeRequest,
    findAllJobChangeRequests,
    findJobChangeRequestById,
    findLatestRequestByCandidate,
    JobChangeRequestRecord,
    rejectJobChangeRequest,
} from "@/server/repositories/jobChangeRepository";
import {
    notifyCandidateJobRoleChangeResult,
    notifyHRJobRoleChangeRequest,
} from "./notificationService";

export class JobChangeError extends Error {
    statusCode: number;

    constructor(message: string, statusCode: number = 400) {
        super(message);
        this.name = "JobChangeError";
        this.statusCode = statusCode;
    }
}

const VALID_APPLICANT_TYPES: ApplicantType[] = [
    "SINGLE_JOB_SEEKER",
    "SINGLE_INTERN",
    "BATCH_INTERN",
];

export async function requestJobRoleChange(
    candidateId: number,
    requestedType: ApplicantType
): Promise<{ success: boolean; message: string; requestId: number }> {
    if (!VALID_APPLICANT_TYPES.includes(requestedType)) {
        throw new JobChangeError("Invalid applicant type selected.", 400);
    }

    const candidate = await findUserById(candidateId);

    if (!candidate) {
        throw new JobChangeError("Candidate account not found.", 404);
    }

    if (candidate.role !== "CANDIDATE") {
        throw new JobChangeError("Only candidates can request job role changes.", 403);
    }

    if (candidate.applicant_type === requestedType) {
        throw new JobChangeError("You are already in this applicant type / job role.", 400);
    }

    const latestRequest = await findLatestRequestByCandidate(candidateId);

    if (latestRequest && latestRequest.status === "PENDING") {
        throw new JobChangeError(
            "You already have a pending job role change request under review by HR.",
            409
        );
    }

    const requestId = await createJobChangeRequest({
        userId: candidateId,
        currentType: candidate.applicant_type,
        requestedType,
    });

    // Notify HR
    await notifyHRJobRoleChangeRequest(
        candidate.full_name,
        candidate.applicant_type,
        requestedType,
        requestId
    );

    return {
        success: true,
        message: "Job role change request submitted successfully. Awaiting HR approval.",
        requestId,
    };
}

export async function getCandidateLatestJobChangeRequest(
    candidateId: number
): Promise<JobChangeRequestRecord | null> {
    return findLatestRequestByCandidate(candidateId);
}

export async function getAllJobChangeRequests(): Promise<JobChangeRequestRecord[]> {
    return findAllJobChangeRequests();
}

export async function reviewJobChangeRequest(
    requestId: number,
    hrUserId: number,
    action: "APPROVE" | "REJECT",
    decisionNote: string | null = null
): Promise<{ success: boolean; message: string }> {
    const existing = await findJobChangeRequestById(requestId);

    if (!existing) {
        throw new JobChangeError("Job change request not found.", 404);
    }

    if (existing.status !== "PENDING") {
        throw new JobChangeError(`Request is already ${existing.status.toLowerCase()}.`, 400);
    }

    if (action === "APPROVE") {
        const result = await approveJobChangeRequest(requestId, hrUserId, decisionNote);
        await notifyCandidateJobRoleChangeResult(
            result.candidateId,
            result.newType,
            true,
            decisionNote
        );
        return {
            success: true,
            message: "Job role change request approved successfully.",
        };
    } else {
        const result = await rejectJobChangeRequest(requestId, hrUserId, decisionNote);
        await notifyCandidateJobRoleChangeResult(
            result.candidateId,
            existing.requested_type,
            false,
            decisionNote
        );
        return {
            success: true,
            message: "Job role change request rejected.",
        };
    }
}
