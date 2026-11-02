import {
    isPrefixMatch,
    matchName,
    searchFavoriteWorlds,
    searchFriends,
    searchGroups,
    searchWorlds
} from '../quickSearchUtils';

const comparer = new Intl.Collator(undefined, {
    usage: 'search',
    sensitivity: 'base'
});

// ── matchName ──────────────────────────────────────────────

describe('matchName', () => {
    test('matches substring', () => {
        expect(matchName('HelloWorld', 'llo', comparer)).toBe(true);
    });

    test('case-insensitive', () => {
        expect(matchName('Alice', 'alice', comparer)).toBe(true);
    });

    test('strips whitespace from query', () => {
        expect(matchName('Alice', 'al ice', comparer)).toBe(true);
    });

    test('returns false for empty inputs', () => {
        expect(matchName('', 'query', comparer)).toBe(false);
        expect(matchName('name', '', comparer)).toBe(false);
        expect(matchName(null, 'query', comparer)).toBe(false);
    });

    test('returns false for whitespace-only query', () => {
        expect(matchName('Alice', '   ', comparer)).toBe(false);
    });

    test('no match', () => {
        expect(matchName('Alice', 'bob', comparer)).toBe(false);
    });
});

// ── isPrefixMatch ──────────────────────────────────────────

describe('isPrefixMatch', () => {
    test('detects prefix', () => {
        expect(isPrefixMatch('Alice', 'ali', comparer)).toBe(true);
    });

    test('rejects non-prefix substring', () => {
        expect(isPrefixMatch('Alice', 'ice', comparer)).toBe(false);
    });

    test('returns false for empty inputs', () => {
        expect(isPrefixMatch('', 'a', comparer)).toBe(false);
        expect(isPrefixMatch('Alice', '', comparer)).toBe(false);
    });
});

// ── searchFriends ──────────────────────────────────────────

describe('searchFriends', () => {
    /**
     * @param id
     * @param name
     * @param memo
     * @param note
     */
    function makeFriend(id, name, memo = '', note = '') {
        return [
            id,
            {
                id,
                name,
                memo,
                ref: {
                    currentAvatarThumbnailImageUrl: `img_${id}`,
                    note,
                    $userColour: '#fff'
                }
            }
        ];
    }

    const friends = new Map([
        makeFriend('u1', 'Alice'),
        makeFriend('u2', 'Bob', '同事', ''),
        makeFriend('u3', 'Charlie', '', 'roommate'),
        makeFriend('u4', 'Dave')
    ]);

    test('matches by name', () => {
        const results = searchFriends('alice', friends, comparer);
        expect(results).toHaveLength(1);
        expect(results[0].id).toBe('u1');
        expect(results[0].matchedField).toBe('name');
    });

    test('returns empty for short / empty query', () => {
        expect(searchFriends('', friends, comparer)).toEqual([]);
        expect(searchFriends(null, friends, comparer)).toEqual([]);
    });

    test('respects limit', () => {
        const many = new Map(Array.from({ length: 20 }, (_, i) => makeFriend(`u${i}`, `Test${i}`)));
        expect(searchFriends('Test', many, comparer, 5)).toHaveLength(5);
    });

    test('prefix matches sort first', () => {
        const f = new Map([makeFriend('u1', 'XAliceX'), makeFriend('u2', 'Alice')]);
        const results = searchFriends('Alice', f, comparer);
        expect(results[0].id).toBe('u2'); // prefix match first
    });

    test('skips entries without ref', () => {
        const broken = new Map([['u1', { id: 'u1', name: 'Test' }]]);
        expect(searchFriends('Test', broken, comparer)).toEqual([]);
    });
});

// ── searchAvatars ──────────────────────────────────────────

// ── searchWorlds ───────────────────────────────────────────

describe('searchWorlds', () => {
    const worldMap = new Map([
        [
            'w1',
            {
                id: 'w1',
                name: 'Fun World',
                authorId: 'me',
                thumbnailImageUrl: 'img1'
            }
        ],
        [
            'w2',
            {
                id: 'w2',
                name: 'Fun Park',
                authorId: 'other',
                thumbnailImageUrl: 'img2'
            }
        ]
    ]);

    test('finds matching worlds', () => {
        const results = searchWorlds('Fun', worldMap, comparer);
        expect(results).toHaveLength(2);
    });

    test('filters by ownerId (authorId)', () => {
        const results = searchWorlds('Fun', worldMap, comparer, 'me');
        expect(results).toHaveLength(1);
        expect(results[0].id).toBe('w1');
    });
});

// ── searchGroups ───────────────────────────────────────────

describe('searchGroups', () => {
    const groupMap = new Map([
        [
            'g1',
            {
                id: 'g1',
                name: 'My Group',
                ownerId: 'me',
                iconUrl: 'icon1'
            }
        ],
        [
            'g2',
            {
                id: 'g2',
                name: 'Other Group',
                ownerId: 'other',
                iconUrl: 'icon2'
            }
        ],
        [
            'g3',
            {
                id: 'g3',
                name: 'Another My Group',
                ownerId: 'me',
                iconUrl: 'icon3'
            }
        ]
    ]);

    test('finds all matching groups', () => {
        const results = searchGroups('Group', groupMap, comparer);
        expect(results).toHaveLength(3);
    });

    test('filters by ownerId', () => {
        const results = searchGroups('Group', groupMap, comparer, 'me');
        expect(results).toHaveLength(2);
        expect(results.every((r) => r.id !== 'g2')).toBe(true);
    });

    test('returns all when ownerId is null', () => {
        const results = searchGroups('Group', groupMap, comparer, null);
        expect(results).toHaveLength(3);
    });
});

// ── searchFavoriteAvatars ──────────────────────────────────

// ── searchFavoriteWorlds ───────────────────────────────────

describe('searchFavoriteWorlds', () => {
    const favorites = [
        {
            name: 'Fav World',
            ref: {
                id: 'fw1',
                name: 'Fav World',
                thumbnailImageUrl: 'img1'
            }
        },
        {
            name: 'Cool Place',
            ref: {
                id: 'fw2',
                name: 'Cool Place',
                thumbnailImageUrl: 'img2'
            }
        }
    ];

    test('finds matching favorite worlds', () => {
        const results = searchFavoriteWorlds('Cool', favorites, comparer);
        expect(results).toHaveLength(1);
        expect(results[0].id).toBe('fw2');
        expect(results[0].type).toBe('world');
    });

    test('returns empty for empty query', () => {
        expect(searchFavoriteWorlds('', favorites, comparer)).toEqual([]);
    });
});
