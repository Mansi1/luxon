// pick.test.ts
import { pick } from './pick'; // Adjust the import path as needed

describe('pick', () => {
  // A sample interface and object to use for testing
  interface User {
    id: number;
    name: string;
    email: string;
    isActive?: boolean; // Optional property
  }

  const user: User = {
    id: 1,
    name: 'Jane Doe',
    email: 'jane.doe@example.com',
    isActive: true,
  };

  it('should correctly pick a single key from an object', () => {
    // Arrange
    const keys = ['name'] as const satisfies Array<keyof User>;

    // Act
    const result = pick(user, keys);

    // Assert
    expect(result).toEqual({ name: 'Jane Doe' });
    // You can also check the type safety with expectType if you're using a tool like tsd
  });

  it('should correctly pick multiple keys from an object', () => {
    // Arrange
    const keys = ['id', 'email'] as const satisfies Array<keyof User>;

    // Act
    const result = pick(user, keys);

    // Assert
    expect(result).toEqual({ id: 1, email: 'jane.doe@example.com' });
  });

  it('should handle optional properties correctly', () => {
    // Arrange
    const keys = ['isActive'] as const satisfies Array<keyof User>;

    // Act
    const result = pick(user, keys);

    // Assert
    expect(result).toEqual({ isActive: true });
  });

  it('should return an empty object if no keys are provided', () => {
    // Arrange
    const keys = [] as const satisfies Array<keyof User>;

    // Act
    const result = pick(user, keys);

    // Assert
    expect(result).toEqual({});
  });
});
