import { TYPE_ATTRIBUTE } from './variables'
import { isOnBlacklist } from './checks'

const createElementBackup = document.createElement

// Monkey patch the createElement method to prevent dynamic scripts from executing
document.createElement = function(...args) {
    // If this is not a script tag, bypass
    // if(args[0].toLowerCase() !== 'script')
    const nodeType = args[0].toLowerCase();
    if(['script', 'iframe'].indexOf(nodeType) === -1 )
        return createElementBackup.bind(document)(...args)

    const scriptElt = createElementBackup.bind(document)(...args)
    const originalSetAttribute = scriptElt.setAttribute.bind(scriptElt)

    const type = nodeType === 'script' ? scriptElt.type : 'text/javascript';
    // Define getters / setters to ensure that the script type is properly set
    try {
        Object.defineProperties(scriptElt, {
            'src': {
                get() {
                    return scriptElt.getAttribute('src')
                },
                set(value) {

                    if(isOnBlacklist(value, type) && !scriptElt.hasAttribute('data-noblock')) {
                        originalSetAttribute('type', TYPE_ATTRIBUTE)
                    }
                    originalSetAttribute('src', value)
                    return true
                }
            },
            'type': {
                set(value) {
                    const typeValue =
                        isOnBlacklist(scriptElt.src, type) && !scriptElt.hasAttribute('data-noblock') ?
                            TYPE_ATTRIBUTE :
                        value
                    originalSetAttribute('type', typeValue)
                    return true
                }
            }
        })

        // Monkey patch the setAttribute function so that the setter is called instead
        scriptElt.setAttribute = function(name, value) {
            if(name === 'type' || name === 'src')
                scriptElt[name] = value
            else
                if(type === 'script'){
                    HTMLScriptElement.prototype.setAttribute.call(scriptElt, name, value)
                } else {
                    HTMLIFrameElement.prototype.setAttribute.call(scriptElt, name, value)
                }
        }
    } catch (error) {
        console.warn(
            'Yett: unable to prevent script execution for script src ', scriptElt.src, '.\n',
            'A likely cause would be because you are using a third-party browser extension that monkey patches the "document.createElement" function.'
        )
    }

    return scriptElt
}