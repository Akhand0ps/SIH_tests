import crypto from "crypto";

/**
 * Format: Timestamp + Random Hash ( ex: 2024092301a1b2c3d4e5f6) dekh
 */
export function generateAnonymousId() {
    //current timestamp lee (YYYYMMDDSS format)

    const timestamp = new Date().toISOString()
        .replace(/[-:T]/g, '')
        .replace(/\.\d{3}Z$/, '')
        .slice(0, 10);


    const randomBytes = crypto.randomBytes(6);
    const randomHash = randomBytes.toString('hex');

    return `${timestamp}${randomHash}`;
}


export function validateAnonymousId(id) {
    if (!id || typeof id !== 'string') {
        return false;
    }

    if (id.length !== 22) {
        return false;
    }

    const timestampPart = id.slice(0, 10);
    const ten_check = !/^\d{10}$/;
    if (ten_check.test(timestampPart)) {
        return false;
    }

  
    const hashPart = id.slice(10);
    const lashhex = !/^[a-f0-9]{12}$/;
    if (lashhex.test(hashPart)) {
        return false;
    }

    return true;
}


export function extractTimestamp(id) {

    if (!validateAnonymousId(id)) {
        return null;
    }

    const timestampStr = id.slice(0, 10);
    const year = timestampStr.slice(0, 4);
    const month = timestampStr.slice(4, 6);
    const day = timestampStr.slice(6, 8);
    const hour = timestampStr.slice(8, 10);

    try {
        return new Date(`${year}-${month}-${day}T${hour}:00:00Z`);
    } catch (error) {
        return null;
    }
}


//Generate session token for temporary user sessions
export function generateSessionToken() {
    return crypto.randomBytes(16).toString('hex');
}

// Hash sensitive data for privacy (one-way hash
export function hashForPrivacy(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
}


export function generateTestSessionId() {
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(4).toString('hex');
    return `sess_${timestamp}_${random}`;
}