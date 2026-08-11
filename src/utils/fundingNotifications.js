import { getStakeholderLabel } from '../constants/funding';
import { formatWardForDisplay } from '../constants/wards';
import { firestoreService } from '../services/firestoreService';

/**
 * Notify mayor, councillor, WDC, and ward residents when funding is approved.
 */
export async function sendFundingApprovedNotifications(request, amountApproved, stakeholderType) {
  const title = request.projectTitle || request.category;
  const wardLabel = formatWardForDisplay(request.ward);
  const source = getStakeholderLabel(stakeholderType).split('—')[0].trim();
  const notifications = [];

  const mayorIds = new Set();
  if (request.mayorId) mayorIds.add(request.mayorId);
  const mayor = await firestoreService.findMayor();
  if (mayor?.uid) mayorIds.add(mayor.uid);

  mayorIds.forEach((userId) => {
    notifications.push({
      userId,
      type: 'funding_approved',
      title: 'Funding Approved',
      message: `${source} has approved funding for ${title} in ${wardLabel}. Amount: K${Number(amountApproved).toLocaleString()}.`,
      wardId: request.wardId,
      proposalId: request.proposalId,
    });
  });

  let councillorId = request.councillorId;
  if (!councillorId && request.wardId) {
    const councillor = await firestoreService.findCouncillorByWard(request.wardId);
    councillorId = councillor?.uid ?? councillor?.id;
  }

  if (councillorId) {
    notifications.push({
      userId: councillorId,
      type: 'funding_approved',
      title: 'Funding Approved',
      message: `Funding approved for ${title} in ${wardLabel}. Amount: K${Number(amountApproved).toLocaleString()} from ${source}. Project can now proceed.`,
      wardId: request.wardId,
      proposalId: request.proposalId,
    });
  }

  const wdcUsers = await firestoreService.findWdcMembers(request.wardId);
  wdcUsers.forEach((u) => {
    notifications.push({
      userId: u.uid ?? u.id,
      type: 'funding_approved',
      title: 'Funding Approved — WDC Account',
      message: `Funding approved for ${title} — ${wardLabel}. Amount: K${Number(amountApproved).toLocaleString()} from ${source}. Money has been sent to the WDC account. Please proceed with project implementation.`,
      wardId: request.wardId,
      proposalId: request.proposalId,
    });
  });

  const residents = await firestoreService.findResidentsByWard(request.wardId, request.ward);
  residents.forEach((r) => {
    notifications.push({
      userId: r.uid ?? r.id,
      type: 'funding_approved',
      title: 'Community Project Funded',
      message: `Good news! ${title} in ${wardLabel} has been funded with K${Number(amountApproved).toLocaleString()}. Work will begin soon. Thank you for your community support!`,
      wardId: request.wardId,
      proposalId: request.proposalId,
    });
  });

  const results = await Promise.allSettled(
    notifications.map((n) => firestoreService.createNotification(n)),
  );

  const sent = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.length - sent;

  if (sent === 0 && notifications.length > 0) {
    throw new Error('Could not deliver funding notifications.');
  }

  return { sent, failed, total: notifications.length };
}
