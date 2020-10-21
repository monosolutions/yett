import {
    patterns,
    backupScripts,
    TYPE_ATTRIBUTE,
    UNBLOCK_INLINESCRIPTS
} from './variables'

import {
    willBeUnblocked
} from './checks'

import {
    observer
} from './observer'

const URL_REPLACER_REGEXP = new RegExp('[|\\{}()[\\]^$+*?.]', 'g')

// Unblocks all (or a selection of) blacklisted scripts.
export const unblock = function(...scriptUrlsOrRegexes) {
    if(scriptUrlsOrRegexes.length < 1) {
        patterns.blacklist = []
        patterns.whitelist = []
    } else {
        if(patterns.blacklist) {
            patterns.blacklist = patterns.blacklist.filter(pattern => (
                scriptUrlsOrRegexes.every(urlOrRegexp => {
                    if(typeof urlOrRegexp === 'string')
                        return !pattern.test(urlOrRegexp)
                    else if(urlOrRegexp instanceof RegExp)
                        return pattern.toString() !== urlOrRegexp.toString()
                })
            ))
        }
        if(patterns.whitelist) {
            patterns.whitelist = patterns.whitelist.concat(
                scriptUrlsOrRegexes
                    .map(urlOrRegexp => {
                        if(typeof urlOrRegexp === 'string') {
                            const escapedUrl = urlOrRegexp.replace(URL_REPLACER_REGEXP, '\\$&')
                            const permissiveRegexp = '.*' + escapedUrl + '.*'
                            if(patterns.whitelist.every(p => p.toString() !== permissiveRegexp.toString())) {
                                return new RegExp(permissiveRegexp)
                            }
                        } else if(urlOrRegexp instanceof RegExp) {
                            if(patterns.whitelist.every(p => p.toString() !== urlOrRegexp.toString())) {
                                return urlOrRegexp
                            }
                        }
                        return null
                    })
                    .filter(Boolean)
            )
        }
    }


    // Parse existing script tags with a marked type
    const tags = document.querySelectorAll(`script[type="${TYPE_ATTRIBUTE}"]`)
    for(let i = 0; i < tags.length; i++) {
        const script = tags[i]
        if(willBeUnblocked(script)) {
            script.type = 'application/javascript'
            backupScripts.blacklisted.push(script)
            script.parentElement.removeChild(script)
        }
    }

    // Exclude 'whitelisted' scripts from the blacklist and append them to <head>
    //Looping array in reverse so that splice doesn't mess up indexes
    for(let i = backupScripts.blacklisted.length - 1; i >= 0; --i) {
        const script = backupScripts.blacklisted[i];
        if(willBeUnblocked(script)) {
            const scriptNode = document.createElement('script')
            scriptNode.setAttribute('src', script.src)
            scriptNode.setAttribute('type', 'application/javascript')
            document.head.appendChild(scriptNode)
            backupScripts.blacklisted.splice(i, 1)
        }
    }

    // Disconnect the observer if the blacklist is empty for performance reasons
    if(patterns.blacklist && patterns.blacklist.length < 1) {
        observer.disconnect()
    }

    //If we have javascript/inlineblocked inline scripts ( without a src ) unblock those as well.
    if( UNBLOCK_INLINESCRIPTS ) {
        const scripts = document.querySelectorAll('script[type="javascript/inlineblocked"]');
        for(let i = 0; i < scripts.length; i++ ){
            const script = scripts[i];
            const newScript = document.createElement('script');
            newScript.type = 'text/javascript';
            newScript.innerText = script.innerText;
            script.parentNode.replaceChild(newScript, script);
        }
    }
}