const requiredUrls = [
    process.env.UPTIME_WEB_URL,
].filter(Boolean);

const optionalUrls = [
    process.env.UPTIME_API_HEALTH_URL,
].filter(Boolean);

if (requiredUrls.length === 0) {
    throw new Error('UPTIME_WEB_URL is required for uptime checks.');
}

const checkUrl = async (url, required = true) => {
    try {
        const response = await fetch(url, { method: 'GET' });
        if (!response.ok) {
            throw new Error(`Status ${response.status}`);
        }
        console.log(`OK: ${url}`);
        return true;
    } catch (error) {
        const level = required ? 'ERROR' : 'WARN';
        console.log(`${level}: ${url} -> ${error.message}`);
        return !required;
    }
};

const requiredResults = await Promise.all(requiredUrls.map((url) => checkUrl(url, true)));
const optionalResults = await Promise.all(optionalUrls.map((url) => checkUrl(url, false)));

const hasFailure = [...requiredResults, ...optionalResults].some((result) => result === false);
if (hasFailure) {
    process.exitCode = 1;
}
