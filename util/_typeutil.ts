/**
 * A type that represents a value that can be either `T` or a `Promise<T>`.
 */
export type Promish<T> = T | Promise<T>;

/**
 * Recursively flattens the nested structure of an object type, transforming
 * each property to its resolved (non-nested) type.
 */
export type FlatType<T> = T extends Record<PropertyKey, unknown>
  ? { [K in keyof T]: FlatType<T[K]> }
  : T;

/**
 * Extracts the first type in a tuple type.
 */
export type FirstType<T extends unknown[]> = T extends [infer F, ...infer _] ? F
  : never;

/**
 * Extracts the last type in a tuple type.
 */
export type LastType<T extends unknown[]> = T extends [...infer _, infer L] ? L
  : never;
