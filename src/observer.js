import { backupScripts, backupIframes, TYPE_ATTRIBUTE } from './variables'
import { isOnBlacklist } from './checks'

// Setup a mutation observer to track DOM insertion
export const observer = new MutationObserver(mutations => {
    for (let i = 0; i < mutations.length; i++) {
        const { addedNodes } = mutations[i];
        for(let i = 0; i < addedNodes.length; i++) {
            const node = addedNodes[i]
            // For each added script tag


            if(node.nodeType === 1 && [ 'SCRIPT', 'IFRAME' ].indexOf(node.tagName) > -1 && !node.hasAttribute('data-noblock')) {
                const src = node.src
                const type = node.tagName === 'SCRIPT' ? node.type : 'text/javascript';
                // If the src is inside the blacklist and is not inside the whitelist
                if(isOnBlacklist(src, type)) {
                    // We backup a copy of the script node
                    if(node.tagName === 'SCRIPT'){
                        backupScripts.blacklisted.push(node.cloneNode())
                    } else {
                        backupIframes.blacklisted.push(node.cloneNode())
                    }

                    // Blocks inline script execution in Safari & Chrome
                    node.type = TYPE_ATTRIBUTE

                    // Firefox has this additional event which prevents scripts from beeing executed
                    const beforeScriptExecuteListener = function (event) {
                        // Prevent only marked scripts from executing
                        if(node.getAttribute('type') === TYPE_ATTRIBUTE)
                            event.preventDefault()
                        node.removeEventListener('beforescriptexecute', beforeScriptExecuteListener)
                    }
                    node.addEventListener('beforescriptexecute', beforeScriptExecuteListener)

                    // Remove the node from the DOM
                    if(node.tagName === 'SCRIPT'){
                        node.parentElement && node.parentElement.removeChild(node)
                    } else {
                        node.setAttribute('data-blocked-src', node.src);
                        node.setAttribute('src', 'about:blank');
                    }
                }
            }
        }
    }
})

// Starts the monitoring
observer.observe(document.documentElement, {
    childList: true,
    subtree: true
})