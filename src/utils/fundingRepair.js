import { firestoreService } from '../services/firestoreService';
import { sendFundingApprovedNotifications } from './fundingNotifications';

/**
 * Complete a partially saved funding approval: create project record,
 * update proposal/community need, then ready for notifications.
 */
export async function repairApprovedFunding(request) {
  const amountApproved = Number(request.amountApproved ?? 0);
  if (!amountApproved || request.status !== 'approved') {
    return { repaired: false, projectCreated: false };
  }

  const stakeholderType = request.stakeholderType || 'dda';
  const fundingDate = request.fundingDate ?? new Date().toISOString();
  const wardId = request.wardId || '';
  const ward = request.ward || '';

  const allProjects = await firestoreService.getProjects();
  let project = allProjects.find(
    (p) => p.fundingRequestId === request.id || (request.proposalId && p.proposalId === request.proposalId),
  );

  let projectCreated = false;
  if (!project) {
    const projectId = await firestoreService.createProject({
      name: request.projectTitle || request.category,
      category: request.category,
      description: request.description || `${request.category} — stakeholder funded`,
      ward,
      wardId,
      zone: request.zone,
      budget: amountApproved,
      fundingSource: stakeholderType.toUpperCase(),
      status: 'Funded',
      dateLogged: fundingDate,
      fundingRequestId: request.id,
      proposalId: request.proposalId,
      location: request.zone || ward,
    });
    projectCreated = true;
    project = { id: projectId, name: request.projectTitle || request.category };
  }

  if (request.proposalId) {
    try {
      const proposal = await firestoreService.getProjectProposal(request.proposalId);
      if (proposal && proposal.status !== 'funded') {
        await firestoreService.updateProjectProposal(request.proposalId, {
          status: 'funded',
          fundedBy: stakeholderType,
          fundedAmount: amountApproved,
          fundedAt: fundingDate,
          fundingSource: stakeholderType.toUpperCase(),
          budget: amountApproved,
        });
      }
    } catch (err) {
      console.warn('Proposal repair skipped:', err);
    }
  }

  if (request.communityNeedId) {
    await firestoreService.updateCommunityNeed(request.communityNeedId, {
      status: 'funded',
    }).catch(() => null);
  }

  return { repaired: true, projectCreated, projectId: project?.id };
}

/** Repair records and send notifications for a partially completed approval. */
export async function completeApprovedFunding(request) {
  await repairApprovedFunding(request);
  const amount = Number(request.amountApproved ?? 0);
  if (!amount) return { sent: 0, repaired: true };

  const type = request.stakeholderType || 'dda';
  let sent = 0;
  if (!request.notificationsSent) {
    const result = await sendFundingApprovedNotifications(request, amount, type);
    sent = result.sent;
  }

  await firestoreService.updateFundingRequest(request.id, {
    repairCompleted: true,
    notificationsSent: true,
  });

  return { sent, repaired: true };
}
