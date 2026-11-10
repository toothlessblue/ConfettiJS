export class ParticleGroupManager {
    total: number = 0;
    groups: ParticleGroup[] = [];

    
}

export class ParticleGroup {
    count: number;
    from: number;

    constructor(count: number, from: number) {
        this.count = count;
        this.from = from
    }

    delete() {

    }
}
