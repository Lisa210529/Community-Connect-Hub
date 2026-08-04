import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

export async function uploadFile(path, file) {
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, file);
  return getDownloadURL(snapshot.ref);
}

export async function deleteFile(path) {
  const storageRef = ref(storage, path);
  await deleteObject(storageRef);
}

export async function getFileUrl(path) {
  return getDownloadURL(ref(storage, path));
}
