import { ensureArray } from './ensureArray';

describe('ensureArray', () => {
  it('should wrap a single item in an array', () => {
    // Arrange
    const singleItem = 'hello';

    // Act
    const result = ensureArray(singleItem);

    // Assert
    expect(result).toEqual(['hello']);
  });

  it('should return the original array if the input is already an array', () => {
    // Arrange
    const originalArray = [1, 2, 3];

    // Act
    const result = ensureArray(originalArray);

    // Assert
    expect(result).toEqual([1, 2, 3]);
    // It's also good practice to check for reference equality
    expect(result).toBe(originalArray);
  });

  it('should handle different data types correctly', () => {
    // Test with a number
    expect(ensureArray(42)).toEqual([42]);

    // Test with a boolean
    expect(ensureArray(true)).toEqual([true]);

    // Test with an object
    const obj = { id: 1, name: 'test' };
    expect(ensureArray(obj)).toEqual([obj]);

    // Test with null and undefined
    expect(ensureArray(null)).toEqual([null]);
    expect(ensureArray(undefined)).toEqual([undefined]);
  });

  it('should handle an empty array correctly', () => {
    // Arrange
    const emptyArray: any[] = [];

    // Act
    const result = ensureArray(emptyArray);

    // Assert
    expect(result).toEqual([]);
    expect(result).toBe(emptyArray);
  });
});
