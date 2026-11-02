/**
 * @param {object | null | undefined} entry
 * @returns {boolean}
 */
export function isNavEntryActionable(entry) {
    return Boolean(entry?.routeName || entry?.action || entry?.path);
}

/**
 * @param {object} router
 * @param {string} routeName
 * @param {object | undefined} routeParams
 */
export function navigateToRoute(router, routeName, routeParams = undefined) {
    if (!routeName) {
        return;
    }

    if (routeParams) {
        router.push({ name: routeName, params: routeParams });
        return;
    }

    router.push({ name: routeName });
}

/**
 * @param {object | null | undefined} entry
 * @param {object} deps
 * @param {object} deps.router
 */
export function triggerNavEntryAction(entry, { router }) {
    if (!entry) {
        return;
    }

    if (entry.action && typeof entry.action === 'object') {
        return entry.action;
    }

    if (entry.routeName) {
        navigateToRoute(router, entry.routeName, entry.routeParams);
        return;
    }

    if (entry.path) {
        router.push(entry.path);
    }
}
