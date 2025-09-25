import { Objects } from './Objects'; // Adjust the import path as needed
import { expectType } from 'ts-expect'; // A utility for testing types

describe('Objects', () => {
  // A sample object to use for testing
  const testObject = {
    id: 1,
    name: 'Alice',
    isActive: true,
  };

  // --- Tests for keys method ---
  describe('keys', () => {
    it('should return the correct keys of an object', () => {
      // Act
      const result = Objects.keys(testObject);

      // Assert
      expect(result).toEqual(['id', 'name', 'isActive']);
    });

    it('should return an empty array for an empty object', () => {
      // Act
      const result = Objects.keys({});

      // Assert
      expect(result).toEqual([]);
    });

    // This test verifies the type-level correctness of the keys method
    it('should have the correct type for the returned keys', () => {
      // The `expectType` utility checks if the type of the variable matches the expected type at compile time.
      // This test is for static analysis and won't fail at runtime, but it is crucial for type safety.
      type ExpectedKeys = 'id' | 'name' | 'isActive';
      expectType<ExpectedKeys[]>(Objects.keys(testObject));
    });
  });

  // --- Tests for entries method ---
  describe('entries', () => {
    it('should return the correct entries of an object', () => {
      // Act
      const result = Objects.entries(testObject);

      // Assert
      expect(result).toEqual([
        ['id', 1],
        ['name', 'Alice'],
        ['isActive', true],
      ]);
    });

    it('should return an empty array for an empty object', () => {
      // Act
      const result = Objects.entries({});

      // Assert
      expect(result).toEqual([]);
    });

    // This test verifies the type-level correctness of the entries method
    it('should have the correct specific types for the returned entries', () => {
      // The type of `testObjectEntries` should be a union of specific tuples.
      const testObjectEntries = Objects.entries(testObject);

      // We use `expectType` to confirm that the type is as specific as we defined.
      // For instance, the first element can be either ['id', number], ['name', string], or ['isActive', boolean].
      type ExpectedEntries = (['id', number] | ['name', string] | ['isActive', boolean])[];
      expectType<ExpectedEntries>(testObjectEntries);

      // We can also test the type of a specific entry from the array to be even more precise.
      type ExpectedFirstEntry = ['id', number];
      expectType<ExpectedFirstEntry | ['name', string] | ['isActive', boolean]>(testObjectEntries[0]);
    });
  });
});
