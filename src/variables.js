export const TYPE_ATTRIBUTE = 'javascript/blocked'
export const UNBLOCK_INLINESCRIPTS = window.YETT_UNBLOCKINLINE || false

export const patterns = {
    blacklist: window.YETT_BLACKLIST,
    whitelist: window.YETT_WHITELIST
}

// Backup list containing the original blacklisted script elements
export const backupScripts = {
    blacklisted: []
}