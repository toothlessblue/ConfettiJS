const varyingRegex = /^out .* (.*);$/;

export function getVaryingsFromComputeShader(source: string) {
    let ret: string[] = [];

    for (let line of source.split('\n')) {
        let result = varyingRegex.exec(line);
        if (!result?.[1]) continue;
        ret.push(result[1]);
    }

    return ret;
}
