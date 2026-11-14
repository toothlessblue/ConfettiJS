/**
 * A function type that generates confetti data for a given index.
 * @param confettiI - The index of the confetti to generate.
 * @returns An object mapping attribute names to arrays of values for the confetti.
 */
export type ConfettiGeneratorFunction = (confettiI: number) => Record<string, number[]>;
