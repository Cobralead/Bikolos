const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

exports.deletePortalUser = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'You must be signed in to delete a portal account.');
  }

  const requesterEmail = context.auth.token.email || '';
  if (requesterEmail.toLowerCase() !== 'cobra.broken@gmail.com') {
    throw new functions.https.HttpsError('permission-denied', 'Only the approved admin can delete portal users.');
  }

  const uid = data?.uid;
  const email = data?.email;

  if (!uid && !email) {
    throw new functions.https.HttpsError('invalid-argument', 'A uid or email is required.');
  }

  try {
    if (uid) {
      await admin.auth().deleteUser(uid);
      return { ok: true, deletedUid: uid };
    }

    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().deleteUser(user.uid);
    return { ok: true, deletedUid: user.uid };
  } catch (error) {
    if (error?.code === 'auth/user-not-found') {
      return { ok: true, deleted: false, reason: 'user-not-found' };
    }
    throw new functions.https.HttpsError('internal', error.message || 'Failed to delete Firebase authentication user.');
  }
});
