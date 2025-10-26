/**
 * Simple object check.
 * @param item - The item to check
 * @returns True if the item is a plain object, false otherwise
 */
export function isObject(item: unknown): item is Record<string, unknown> {
  return typeof item === 'object' && item !== null && !Array.isArray(item);
}

/**
 * Deep merge two objects.
 * @param target - The target object to merge into
 * @param source - The source object to merge from
 * @returns The merged object
 */
export default function deepMerge<T, TSource>(
  target: T,
  source: TSource,
): T & TSource {
  const output = { ...target } as T & TSource;

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      const sourceValue = source[key];
      const targetValue = (target as Record<string, unknown>)[key];

      if (isObject(sourceValue)) {
        if (!(key in target)) {
          (output as Record<string, unknown>)[key] = sourceValue;
        } else {
          (output as Record<string, unknown>)[key] = deepMerge(
            targetValue,
            sourceValue,
          );
        }
      } else {
        (output as Record<string, unknown>)[key] = sourceValue;
      }
    });
  }

  return output;
}
