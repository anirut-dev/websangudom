// Mock Firebase Auth module
const getAuth = jest.fn(() => ({
  currentUser: null,
}));

const signInWithEmailAndPassword = jest.fn();
const signOut = jest.fn();
const onAuthStateChanged = jest.fn();

module.exports = {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
};
