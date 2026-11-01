import {
    createNotification,
    getUserNotifications,
    getUnreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    checkNotificationExists,
    NotificationRecord,
} from "@/server/repositories/notificationRepository";
import { findHRUser } from "@/server/repositories/userRepository";
import { getUserNotificationPreferences } from "@/server/repositories/settingsRepository";

export async function getNotifications(userId: number): Promise<{
    notifications: NotificationRecord[];
    unreadCount: number;
}> {
    const [notifications, unreadCount] = await Promise.all([
        getUserNotifications(userId),
        getUnreadNotificationCount(userId),
    ]);

    return {
        notifications,
        unreadCount,
    };
}

export async function markAsRead(notificationId: number, userId: number): Promise<boolean> {
    return markNotificationAsRead(notificationId, userId);
}

export async function markAllAsRead(userId: number): Promise<number> {
    return markAllNotificationsAsRead(userId);
}

// ============================================================
// CANDIDATE NOTIFICATIONS DISPATCHERS
// ============================================================

export async function notifyCandidateApplicationStatus(
    candidateId: number,
    applicationId: number,
    projectTitle: string,
    newStatus: string,
    decisionNote?: string | null
): Promise<void> {
    let title = `Application Status: ${newStatus}`;
    let message = `Your application for "${projectTitle}" has been updated to ${newStatus}.`;

    if (newStatus === "SHORTLISTED") {
        title = "Application Shortlisted! 🎉";
        message = `Congratulations! Your application for "${projectTitle}" has been shortlisted.`;
    } else if (newStatus === "SELECTED") {
        title = "Application Selected! 🌟";
        message = `Congratulations! You have been selected for "${projectTitle}".`;
    } else if (newStatus === "REJECTED") {
        title = "Application Update";
        message = `Thank you for your interest in "${projectTitle}". The recruitment team has decided to proceed with other candidates at this time.`;
    }

    if (decisionNote) {
        message += `\nNote: ${decisionNote}`;
    }

    await createNotification({
        recipientUserId: candidateId,
        type: `APPLICATION_${newStatus}`,
        title,
        message,
        referenceId: applicationId,
        referenceType: "APPLICATION",
    });
}

export async function notifyCandidateInterviewScheduled(
    candidateId: number,
    applicationId: number,
    projectTitle: string,
    interviewDate: string,
    interviewTime: string,
    interviewType: "ONLINE" | "OFFLINE",
    meetingLink?: string | null,
    physicalLocation?: string | null
): Promise<void> {
    const title = "Interview Scheduled 📅";
    let message = `An ${interviewType.toLowerCase()} interview has been scheduled for "${projectTitle}" on ${interviewDate} at ${interviewTime}.`;

    if (interviewType === "ONLINE" && meetingLink) {
        message += ` Meeting link: ${meetingLink}`;
    } else if (interviewType === "OFFLINE" && physicalLocation) {
        message += ` Location: ${physicalLocation}`;
    }

    await createNotification({
        recipientUserId: candidateId,
        type: "INTERVIEW_SCHEDULED",
        title,
        message,
        referenceId: applicationId,
        referenceType: "INTERVIEW",
    });
}

export async function notifyCandidateInterviewUpdated(
    candidateId: number,
    applicationId: number,
    projectTitle: string,
    status: string,
    interviewDate: string,
    interviewTime: string
): Promise<void> {
    let title = "Interview Updated";
    let message = `Your interview for "${projectTitle}" has been updated (${status}) for ${interviewDate} at ${interviewTime}.`;

    if (status === "CANCELLED") {
        title = "Interview Cancelled";
        message = `Your interview for "${projectTitle}" scheduled on ${interviewDate} has been cancelled.`;
    } else if (status === "COMPLETED") {
        title = "Interview Completed";
        message = `Your interview for "${projectTitle}" on ${interviewDate} has been marked as completed.`;
    }

    await createNotification({
        recipientUserId: candidateId,
        type: `INTERVIEW_${status}`,
        title,
        message,
        referenceId: applicationId,
        referenceType: "INTERVIEW",
    });
}

export async function notifyCandidateJobRoleChangeResult(
    candidateId: number,
    requestedType: string,
    approved: boolean,
    decisionNote?: string | null
): Promise<void> {
    const formattedType = requestedType.replaceAll("_", " ").toLowerCase();
    const title = approved ? "Job Role Change Approved ✅" : "Job Role Change Rejected ❌";
    let message = approved
        ? `Your request to change your job role to ${formattedType} has been approved.`
        : `Your request to change your job role to ${formattedType} has been rejected.`;

    if (decisionNote) {
        message += ` Note: ${decisionNote}`;
    }

    await createNotification({
        recipientUserId: candidateId,
        type: approved ? "JOB_ROLE_APPROVED" : "JOB_ROLE_REJECTED",
        title,
        message,
        referenceId: null,
        referenceType: "JOB_ROLE",
    });
}

// ============================================================
// HR NOTIFICATIONS DISPATCHERS
// ============================================================

export async function notifyHRJobRoleChangeRequest(
    candidateName: string,
    currentType: string,
    requestedType: string,
    requestId: number
): Promise<void> {
    const hrUser = await findHRUser();

    if (!hrUser) {
        return;
    }

    const fromRole = currentType.replaceAll("_", " ");
    const toRole = requestedType.replaceAll("_", " ");

    await createNotification({
        recipientUserId: hrUser.id,
        type: "JOB_ROLE_REQUEST",
        title: "Job Role Change Request 🔄",
        message: `${candidateName} has requested to change role from ${fromRole} to ${toRole}.`,
        referenceId: requestId,
        referenceType: "JOB_ROLE_REQUEST",
    });
}

export async function notifyCandidateBatchTeamAssignment(
    candidateUserId: number,
    teamId: number,
    teamName: string,
    projectTitle: string,
    moduleName: string
): Promise<void> {
    await createNotification({
        recipientUserId: candidateUserId,
        type: "BATCH_TEAM_ASSIGNED",
        title: "Batch Team Assignment Finalized 🎉",
        message: `You have been assigned to ${teamName} for "${projectTitle}". Primary Module: ${moduleName}.`,
        referenceId: teamId,
        referenceType: "TEAM",
    });
}

export async function notifyHRNewApplication(
    candidateName: string,
    projectTitle: string,
    applicationId: number
): Promise<void> {
    const hrUser = await findHRUser();
    if (!hrUser) return;

    const prefs = await getUserNotificationPreferences(hrUser.id);
    if (!prefs.notify_new_applications) return;

    // Check for duplicate
    const exists = await checkNotificationExists(
        hrUser.id,
        "NEW_APPLICATION",
        applicationId,
        "APPLICATION"
    );
    if (exists) return;

    await createNotification({
        recipientUserId: hrUser.id,
        type: "NEW_APPLICATION",
        title: "New Application Received 📄",
        message: `${candidateName} applied to "${projectTitle}".`,
        referenceId: applicationId,
        referenceType: "APPLICATION",
    });
}

export async function notifyHRInterviewEvent(
    candidateName: string,
    projectTitle: string,
    applicationId: number,
    eventType: "SCHEDULED" | "UPDATED" | "CANCELLED",
    interviewDate: string,
    interviewTime: string
): Promise<void> {
    const hrUser = await findHRUser();
    if (!hrUser) return;

    const prefs = await getUserNotificationPreferences(hrUser.id);
    if (!prefs.notify_interviews) return;

    let title = "Interview Event 📅";
    let message = `Interview for ${candidateName} ("${projectTitle}") has been ${eventType.toLowerCase()} for ${interviewDate} at ${interviewTime}.`;

    if (eventType === "SCHEDULED") {
        title = "Interview Scheduled 📅";
        message = `Interview scheduled with ${candidateName} for "${projectTitle}" on ${interviewDate} at ${interviewTime}.`;
    } else if (eventType === "CANCELLED") {
        title = "Interview Cancelled ❌";
        message = `Interview with ${candidateName} for "${projectTitle}" on ${interviewDate} was cancelled.`;
    } else if (eventType === "UPDATED") {
        title = "Interview Updated 🔄";
        message = `Interview details updated for ${candidateName} ("${projectTitle}") on ${interviewDate} at ${interviewTime}.`;
    }

    await createNotification({
        recipientUserId: hrUser.id,
        type: `INTERVIEW_${eventType}`,
        title,
        message,
        referenceId: applicationId,
        referenceType: "INTERVIEW",
    });
}

export async function notifyHRSelection(
    candidateName: string,
    projectTitle: string,
    applicationId: number
): Promise<void> {
    const hrUser = await findHRUser();
    if (!hrUser) return;

    const prefs = await getUserNotificationPreferences(hrUser.id);
    if (!prefs.notify_selections) return;

    await createNotification({
        recipientUserId: hrUser.id,
        type: "APPLICATION_SELECTED",
        title: "Candidate Selected 🌟",
        message: `${candidateName} has been marked as SELECTED for "${projectTitle}".`,
        referenceId: applicationId,
        referenceType: "APPLICATION",
    });
}

export async function notifyHRBatchAllocation(
    projectTitle: string,
    projectId: number,
    teamsCount: number,
    membersCount: number
): Promise<void> {
    const hrUser = await findHRUser();
    if (!hrUser) return;

    const prefs = await getUserNotificationPreferences(hrUser.id);
    if (!prefs.notify_batch_allocations) return;

    await createNotification({
        recipientUserId: hrUser.id,
        type: "BATCH_ALLOCATION_CONFIRMED",
        title: "Batch Allocation Finalized 🚀",
        message: `Batch allocation confirmed for "${projectTitle}". ${teamsCount} teams formed with ${membersCount} assigned candidates.`,
        referenceId: projectId,
        referenceType: "BATCH_ALLOCATION",
    });
}


