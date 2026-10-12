import * as fs from 'fs';
import * as path from 'path';

/**
 * Metric 4 (LM-306): the published typings mark the deprecated string
 * accessors. compile.sh adds the tags after protoc-gen-ts runs.
 */

const TYPINGS = path.join(__dirname, '../../../fintekkers/models/util/decimal_value_pb.d.ts');

test.each(['getArbitraryPrecisionValue', 'setArbitraryPrecisionValue'])('%s is @deprecated', (accessor) => {
    const lines = fs.readFileSync(TYPINGS, 'utf8').split('\n');
    const at = lines.findIndex(l => l.trim().startsWith(`${accessor}(`));
    expect(at).toBeGreaterThan(0);
    expect(lines[at - 1].trim()).toMatch(/^\/\*\* @deprecated .*\*\/$/);
});
