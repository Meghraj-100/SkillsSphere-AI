import axios from "axios";
import dns from "dns";

/**
 * Checks if an IP address belongs to a private, loopback, or cloud metadata range.
 * This prevents SSRF attacks targeting internal networks.
 * 
 * @param {string} ip - The IP address to check
 * @returns {boolean} True if the IP is private/internal
 */
const isPrivateIP = (ip) => {
  // IPv4 Loopback (127.0.0.0/8)
  if (ip.startsWith("127.")) return true;
  
  // Cloud Metadata (169.254.0.0/16) - Critical for AWS/GCP SSRF
  if (ip.startsWith("169.254.")) return true;
  
  // IPv4 Private Networks (RFC 1918)
  // 10.0.0.0/8
  if (ip.startsWith("10.")) return true;
  
  // 172.16.0.0/12 (172.16.x.x - 172.31.x.x)
  if (ip.startsWith("172.")) {
    const secondOctet = parseInt(ip.split(".")[1], 10);
    if (secondOctet >= 16 && secondOctet <= 31) return true;
  }
  
  // 192.168.0.0/16
  if (ip.startsWith("192.168.")) return true;

  // IPv4 Special-Purpose (0.0.0.0/8)
  if (ip.startsWith("0.")) return true;

  // IPv6 Loopback
  if (ip === "::1") return true;

  return false;
};

/**
 * Verifies if a URL is active and reachable.
 * @param {string} url - The URL to verify
 * @returns {Promise<{url: string, isValid: boolean, status: number|null}>}
 */
export const verifyLink = async (url) => {
  if (!url) return { url, isValid: false, status: null };

  try {
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch (e) {
      return { url, isValid: false, status: null, error: "Invalid URL format" };
    }

    // Must be HTTP or HTTPS
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return { url, isValid: false, status: null, error: "Unsupported protocol" };
    }

    // SSRF Protection: Resolve the hostname and block private/internal IPs
    const addresses = await dns.promises.resolve(parsedUrl.hostname).catch(() => []);
    
    // If we can't resolve it or it resolves to a local IP, block it
    if (addresses.length === 0) {
       return { url, isValid: false, status: null, error: "DNS resolution failed" };
    }
    
    for (const ip of addresses) {
      if (isPrivateIP(ip)) {
        return { url, isValid: false, status: null, error: "Blocked SSRF attempt (Internal IP)" };
      }
    }

    const response = await axios.get(url, {
      timeout: 5000,
      maxRedirects: 0, // SSRF Mitigation: Prevent attacker from returning a 302 redirect to a private IP
      validateStatus: (status) => status >= 200 && status < 400, // Treat redirects (3xx) as a valid reachable link
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
      method: "GET", 
    });

    return {
      url,
      isValid: response.status >= 200 && response.status < 400,
      status: response.status,
    };
  } catch (error) {
    // Handle cases where the site exists but blocks automated GETs (like LinkedIn)
    // If it's a 403 or 429, we still consider it "potentially valid" if it's a known domain
    const isBotProtected = error.response && [403, 429, 999].includes(error.response.status);
    
    return {
      url,
      isValid: isBotProtected,
      status: error.response?.status || null,
      error: error.message
    };
  }
};

/**
 * Verifies multiple links in parallel.
 * @param {string[]} urls 
 */
export const verifyLinks = async (urls = []) => {
  const uniqueUrls = [...new Set(urls.filter(Boolean))];
  const results = await Promise.all(uniqueUrls.map(url => verifyLink(url)));
  return results;
};
