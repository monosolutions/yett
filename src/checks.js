import { patterns, TYPE_ATTRIBUTE } from './variables'
const loggedBlacklist = [];

export const isOnBlacklist = (src, type) => {
    const onBlacklist = src &&
    (!type || type !== TYPE_ATTRIBUTE) &&
    (
        (!patterns.blacklist || patterns.blacklist.some(pattern => pattern.test(src))) &&
        (!patterns.whitelist || patterns.whitelist.every(pattern => !pattern.test(src)))
    );


    if(onBlacklist && !loggedBlacklist.includes(src)){
        loggedBlacklist.push(src);
        console.info(`Script src '${src}' is blocked`);
    }

    return onBlacklist;
}

export const willBeUnblocked = function(script) {
    const src = script.getAttribute('src')
    return (
        patterns.blacklist && patterns.blacklist.every(entry => !entry.test(src)) ||
        patterns.whitelist && patterns.whitelist.some(entry => entry.test(src))
    )
}