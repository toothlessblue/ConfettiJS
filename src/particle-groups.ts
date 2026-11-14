/**
 * Manages groups of particles.
 */
export class ParticleGroupManager {
    /** The total number of particles. */
    total: number = 0;
    /** The list of particle groups. */
    groups: ParticleGroup[] = [];

    
}

/**
 * Represents a group of particles.
 */
export class ParticleGroup {
    /** The number of particles in this group. */
    count: number;
    /** The starting index of this group in the particle array. */
    from: number;

    constructor(count: number, from: number) {
        this.count = count;
        this.from = from
    }

    delete() {

    }
}
