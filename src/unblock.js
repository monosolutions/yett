import {
    patterns,
    backupScripts,
    backupIframes,
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
            patterns.whitelist = [
                ...patterns.whitelist,
                ...scriptUrlsOrRegexes
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
            ]
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

    // Parse existing iframe tags with a marked type
    const iframeTags = document.querySelectorAll(`iframe[type="${TYPE_ATTRIBUTE}"]`)
    for(let i = 0; i < iframeTags.length; i++) {
        const script = iframeTags[i]
        if(willBeUnblocked(script)) {
            script.type = 'application/javascript'
            backupIframes.blacklisted.push(script)
            script.parentElement.removeChild(script)
        }
    }

    // Exclude 'whitelisted' scripts from the blacklist and append them to <head>
    let indexOffset = 0;
    [...backupScripts.blacklisted].forEach((script, index) => {
        if(willBeUnblocked(script)) {
            const scriptNode = document.createElement('script')
            scriptNode.setAttribute('src', script.src)
            scriptNode.setAttribute('type', 'application/javascript')
            document.head.appendChild(scriptNode)
            backupScripts.blacklisted.splice(index - indexOffset, 1)
            indexOffset++
        }
    })

    // let iframeIndexOffset = 0;
    // [...backupIframes.blacklisted].forEach((iframe, index) => {
    //     if(willBeUnblocked(iframe)) {
    //         const iframeNode = document.createElement('iframe')
    //         iframeNode.setAttribute('src', iframe.src)
    //         document.head.appendChild(iframeNode)
    //         backupIframes.blacklisted.splice(index - iframeIndexOffset, 1)
    //         iframeIndexOffset++
    //     }
    // })

    // Disconnect the observer if the blacklist is empty for performance reasons
    if(patterns.blacklist && patterns.blacklist.length < 1) {
        observer.disconnect()
    }

    //If we have javascript/inlineblocked inline scripts ( without a src ) unblock those as well.
    if( UNBLOCK_INLINESCRIPTS ) {
        [...document.querySelectorAll('script[type="javascript/inlineblocked"]')].forEach( script => {
            const newScript = document.createElement('script');
            newScript.type = 'text/javascript';
            newScript.innerText = script.innerText;
            script.parentNode.replaceChild(newScript, script);
        });

        [...document.querySelectorAll('iframe[data-blocked-src]')].forEach( iframe => {
            const newIframe = document.createElement('iframe');
            newIframe.src = iframe.getAttribute('data-blocked-src');
            iframe.parentNode.replaceChild(newIframe, iframe);
        });
    }
}