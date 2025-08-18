const { formatUtils } = require('../utils/wizardUtils');

test('formatPostalCode returns formatted code when valid', () => {
  expect(formatUtils.formatPostalCode('T2P1A1')).toBe('T2P 1A1');
});

test('formatPostalCode returns input when length not six', () => {
  expect(formatUtils.formatPostalCode('ABC')).toBe('ABC');
});

test('formatPostalCode handles null without throwing', () => {
  expect(formatUtils.formatPostalCode(null)).toBeNull();
});
