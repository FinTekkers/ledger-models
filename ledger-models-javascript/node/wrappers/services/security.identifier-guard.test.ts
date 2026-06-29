// SecurityService client-side identifier guard (#347).
// Pins that createSecurity / validateCreateSecurity raise the guard BEFORE
// invoking the gRPC client when the request carries an UNKNOWN-typed or
// empty identifier. Pure unit test — never touches the wire; the client is
// replaced with a sentinel that fails the test if hit.

import { IdentifierProto } from '../../fintekkers/models/security/identifier/identifier_pb';
import { IdentifierTypeProto } from '../../fintekkers/models/security/identifier/identifier_type_pb';
import { SecurityProto } from '../../fintekkers/models/security/security_pb';
import { IdentifierValidationError } from '../models/security/identifier';
import { SecurityService } from './security-service/SecurityService';

function makeIdentifier(type: IdentifierTypeProto, value: string): IdentifierProto {
    const p = new IdentifierProto();
    p.setIdentifierType(type);
    p.setIdentifierValue(value);
    return p;
}

function securityWith(identifier: IdentifierProto): SecurityProto {
    const s = new SecurityProto();
    s.addIdentifiers(identifier);
    return s;
}

function failingClient(): any {
    // Any RPC hit means the guard didn't fire — the test should fail loud.
    const explode = () => {
        throw new Error('client-side guard must reject before invoking the stub');
    };
    return {
        createOrUpdate: explode,
        validateCreateOrUpdate: explode,
    };
}

describe('SecurityService client-side identifier guard', () => {
    test('createSecurity rejects UNKNOWN_IDENTIFIER_TYPE before RPC', async () => {
        const svc = new SecurityService();
        (svc as any).client = failingClient();
        const bad = securityWith(
            makeIdentifier(IdentifierTypeProto.UNKNOWN_IDENTIFIER_TYPE, 'stale-uuid')
        );
        await expect(svc.createSecurity(bad)).rejects.toBeInstanceOf(
            IdentifierValidationError
        );
    });

    test('validateCreateSecurity rejects UNKNOWN_IDENTIFIER_TYPE before RPC', async () => {
        const svc = new SecurityService();
        (svc as any).client = failingClient();
        const bad = securityWith(
            makeIdentifier(IdentifierTypeProto.UNKNOWN_IDENTIFIER_TYPE, 'stale-uuid')
        );
        await expect(svc.validateCreateSecurity(bad)).rejects.toBeInstanceOf(
            IdentifierValidationError
        );
    });

    test('createSecurity rejects empty identifier_value before RPC', async () => {
        const svc = new SecurityService();
        (svc as any).client = failingClient();
        const bad = securityWith(
            makeIdentifier(IdentifierTypeProto.EXCH_TICKER, '')
        );
        await expect(svc.createSecurity(bad)).rejects.toBeInstanceOf(
            IdentifierValidationError
        );
    });
});
