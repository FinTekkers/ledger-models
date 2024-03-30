
import { ZonedDateTime } from './datetime';

test('test the position wrapper', async () => {

    const now = ZonedDateTime.now();
    expect(now.toDateTime().toString()).toBe(now.toString());
});