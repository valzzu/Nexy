import { beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    openExternalLink: vi.fn(),
    userImage: vi.fn(),
    getFaviconUrl: vi.fn((link) => `https://icon/${encodeURIComponent(link)}`),
    sortAlphabetically: vi.fn(() => 123)
}));

vi.mock('../../../plugins', () => ({
    i18n: {
        global: {
            t: (key) => key
        }
    }
}));

vi.mock('../../../shared/utils', () => ({
    openExternalLink: (...args) => mocks.openExternalLink(...args),
    userImage: (...args) => mocks.userImage(...args),
    getFaviconUrl: (...args) => mocks.getFaviconUrl(...args),
    statusClass: () => 'status-online',
    languageClass: (lang) => `lang-${lang}`
}));

vi.mock('../../../components/Timer.vue', () => ({ default: 'Timer' }));
vi.mock('../../../components/ui/button', () => ({ Button: 'Button' }));
vi.mock('../../../components/ui/tooltip', () => ({
    TooltipWrapper: 'TooltipWrapper'
}));
vi.mock('lucide-vue-next', () => ({
    ArrowUpDown: 'ArrowUpDown',
    Monitor: 'Monitor',
    Smartphone: 'Smartphone',
    Apple: 'Apple',
    IdCard: 'IdCard'
}));

import { createColumns } from '../columns.jsx';

function createElement(type, props, ...children) {
    return {
        type,
        props: props ?? {},
        children: children.flat()
    };
}

describe('views/PlayerList/columns.jsx', () => {
    beforeEach(() => {
        globalThis.React = { createElement };
        mocks.openExternalLink.mockReset();
        mocks.userImage.mockReset();
        mocks.getFaviconUrl.mockClear();
        mocks.sortAlphabetically.mockClear();
    });

    test('displayName sorting uses injected sortAlphabetically helper', () => {
        const cols = createColumns({
            randomUserColours: { value: false, __v_isRef: true },
            sortAlphabetically: mocks.sortAlphabetically
        });
        const displayNameCol = cols.find((c) => c.id === 'displayName');

        const result = displayNameCol.sortFn(
            { original: { displayName: 'Alice' } },
            { original: { displayName: 'Bob' } }
        );

        expect(result).toBe(123);
        expect(mocks.sortAlphabetically).toHaveBeenCalledWith(
            { displayName: 'Alice' },
            { displayName: 'Bob' },
            'displayName'
        );
    });

    test('icon sorting prefers higher weighted role flags', () => {
        const cols = createColumns({
            randomUserColours: { value: false, __v_isRef: true },
            sortAlphabetically: mocks.sortAlphabetically
        });
        const iconCol = cols.find((c) => c.id === 'icon');

        const friend = { original: { isFriend: true } };
        const blocked = { original: { isBlocked: true } };

        expect(iconCol.sortFn(friend, blocked, 'icon')).toBeGreaterThan(0);
    });
});
