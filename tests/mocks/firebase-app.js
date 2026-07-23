// Mock Firebase App module
const initializeApp = jest.fn(() => ({
  name: '[DEFAULT]',
}));

module.exports = {
  initializeApp,
};
