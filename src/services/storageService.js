import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

function guessContentType(file) {
  if (file.type) return file.type;
  const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
  const map = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
  };
  return map[ext] || 'application/octet-stream';
}

const PROFILE_PHOTO_MAX_BYTES = 2 * 1024 * 1024;

export async function uploadProfilePhoto(uid, file) {
  if (!uid) throw new Error('You must be signed in to upload a profile photo.');
  if (!file?.type?.startsWith('image/')) {
    throw new Error('Please choose a JPG, PNG, or WebP image.');
  }
  if (file.size > PROFILE_PHOTO_MAX_BYTES) {
    throw new Error('Profile photo must be 2 MB or smaller.');
  }

  const ext = file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : 'jpg';
  const path = `profile-photos/${uid}/avatar.${ext}`;
  return uploadFile(path, file);
}

export { PROFILE_PHOTO_MAX_BYTES };

export async function uploadFile(path, file) {
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, file, { contentType: guessContentType(file) });
  return getDownloadURL(snapshot.ref);
}

export async function deleteFile(path) {
  const storageRef = ref(storage, path);
  await deleteObject(storageRef);
}

export async function getFileUrl(path) {
  return getDownloadURL(ref(storage, path));
}
