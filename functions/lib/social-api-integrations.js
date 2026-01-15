"use strict";
/**
 * Social Media API Integrations
 *
 * Real implementations for publishing to social platforms
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.publishToLinkedIn = publishToLinkedIn;
exports.publishToFacebook = publishToFacebook;
exports.publishToX = publishToX;
exports.publishToInstagram = publishToInstagram;
exports.publishToWeChat = publishToWeChat;
exports.publishToPlatform = publishToPlatform;
exports.testPlatformConnection = testPlatformConnection;
/**
 * LinkedIn API Integration
 * Reference: https://docs.microsoft.com/en-us/linkedin/marketing/integrations/community-management/shares/share-api
 */
async function publishToLinkedIn(text, media, config) {
    try {
        if (!config.accessToken) {
            return { success: false, message: 'LinkedIn access token not configured', error: 'MISSING_TOKEN' };
        }
        const shareData = {
            author: `urn:li:person:${config.accountId}`,
            lifecycleState: 'PUBLISHED',
            specificContent: {
                'com.linkedin.ugc.ShareContent': {
                    shareCommentary: {
                        text: text
                    },
                    shareMediaCategory: media.length > 0 ? 'IMAGE' : 'NONE'
                }
            },
            visibility: {
                'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
            }
        };
        if (media.length > 0) {
            shareData.specificContent['com.linkedin.ugc.ShareContent'].media = media.map((url) => ({
                status: 'READY',
                media: url
            }));
        }
        const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${config.accessToken}`,
                'Content-Type': 'application/json',
                'X-Restli-Protocol-Version': '2.0.0'
            },
            body: JSON.stringify(shareData)
        });
        if (!response.ok) {
            const error = await response.text();
            return { success: false, message: 'LinkedIn API error', error };
        }
        const result = await response.json();
        return {
            success: true,
            message: 'Published to LinkedIn',
            postId: result.id
        };
    }
    catch (error) {
        return {
            success: false,
            message: 'LinkedIn publish failed',
            error: String(error)
        };
    }
}
/**
 * Facebook API Integration
 * Reference: https://developers.facebook.com/docs/graph-api/reference/page/feed
 */
async function publishToFacebook(text, media, config) {
    try {
        if (!config.pageId || !config.accessToken) {
            return { success: false, message: 'Facebook credentials not configured', error: 'MISSING_CREDENTIALS' };
        }
        const endpoint = `https://graph.facebook.com/v18.0/${config.pageId}/feed`;
        const params = {
            message: text,
            access_token: config.accessToken
        };
        if (media.length > 0) {
            params.link = media[0]; // Facebook can handle one link or use /photos endpoint for images
        }
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(params)
        });
        if (!response.ok) {
            const error = await response.text();
            return { success: false, message: 'Facebook API error', error };
        }
        const result = await response.json();
        return {
            success: true,
            message: 'Published to Facebook',
            postId: result.id
        };
    }
    catch (error) {
        return {
            success: false,
            message: 'Facebook publish failed',
            error: String(error)
        };
    }
}
/**
 * X (Twitter) API Integration
 * Reference: https://developer.twitter.com/en/docs/twitter-api/tweets/manage-tweets/api-reference/post-tweets
 */
async function publishToX(text, media, config) {
    var _a;
    try {
        if (!config.bearerToken) {
            return { success: false, message: 'X bearer token not configured', error: 'MISSING_TOKEN' };
        }
        const tweetData = {
            text: text.slice(0, 280) // X character limit
        };
        // Note: Media upload requires separate endpoint - simplified here
        if (media.length > 0) {
            // Would need to implement media upload flow
            console.log('Media upload for X not yet implemented:', media);
        }
        const response = await fetch('https://api.twitter.com/2/tweets', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${config.bearerToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(tweetData)
        });
        if (!response.ok) {
            const error = await response.text();
            return { success: false, message: 'X API error', error };
        }
        const result = await response.json();
        return {
            success: true,
            message: 'Published to X',
            postId: (_a = result.data) === null || _a === void 0 ? void 0 : _a.id
        };
    }
    catch (error) {
        return {
            success: false,
            message: 'X publish failed',
            error: String(error)
        };
    }
}
/**
 * Instagram API Integration (via Facebook Graph API)
 * Reference: https://developers.facebook.com/docs/instagram-api/guides/content-publishing
 */
async function publishToInstagram(text, media, config) {
    try {
        if (!config.accountId || !config.accessToken) {
            return { success: false, message: 'Instagram credentials not configured', error: 'MISSING_CREDENTIALS' };
        }
        if (media.length === 0) {
            return { success: false, message: 'Instagram requires at least one image', error: 'NO_MEDIA' };
        }
        // Step 1: Create media container
        const containerEndpoint = `https://graph.facebook.com/v18.0/${config.accountId}/media`;
        const containerResponse = await fetch(containerEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                image_url: media[0],
                caption: text,
                access_token: config.accessToken
            })
        });
        if (!containerResponse.ok) {
            const error = await containerResponse.text();
            return { success: false, message: 'Instagram container creation failed', error };
        }
        const containerResult = await containerResponse.json();
        const containerId = containerResult.id;
        // Step 2: Publish container
        const publishEndpoint = `https://graph.facebook.com/v18.0/${config.accountId}/media_publish`;
        const publishResponse = await fetch(publishEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                creation_id: containerId,
                access_token: config.accessToken
            })
        });
        if (!publishResponse.ok) {
            const error = await publishResponse.text();
            return { success: false, message: 'Instagram publish failed', error };
        }
        const result = await publishResponse.json();
        return {
            success: true,
            message: 'Published to Instagram',
            postId: result.id
        };
    }
    catch (error) {
        return {
            success: false,
            message: 'Instagram publish failed',
            error: String(error)
        };
    }
}
/**
 * WeChat API Integration (Placeholder - requires official account)
 */
async function publishToWeChat(text, media, config) {
    // WeChat Official Account API requires complex setup
    // Typically involves creating articles and pushing to followers
    return {
        success: false,
        message: 'WeChat publishing requires manual export. Download the generated content pack.',
        error: 'MANUAL_REQUIRED'
    };
}
/**
 * Generic platform publisher
 */
async function publishToPlatform(platform, text, media, config) {
    switch (platform.toLowerCase()) {
        case 'linkedin':
            return publishToLinkedIn(text, media, config);
        case 'facebook':
            return publishToFacebook(text, media, config);
        case 'x':
        case 'twitter':
            return publishToX(text, media, config);
        case 'instagram':
            return publishToInstagram(text, media, config);
        case 'wechat':
        case 'red':
        case 'zhihu':
        case 'douyin':
            return publishToWeChat(text, media, config);
        default:
            return {
                success: false,
                message: `Unsupported platform: ${platform}`,
                error: 'UNSUPPORTED_PLATFORM'
            };
    }
}
/**
 * Test platform connection
 */
async function testPlatformConnection(platform, config) {
    var _a;
    switch (platform.toLowerCase()) {
        case 'linkedin':
            if (!config.accessToken) {
                return { success: false, message: 'LinkedIn access token missing' };
            }
            try {
                const response = await fetch('https://api.linkedin.com/v2/me', {
                    headers: {
                        'Authorization': `Bearer ${config.accessToken}`
                    }
                });
                if (response.ok) {
                    const profile = await response.json();
                    return {
                        success: true,
                        message: 'LinkedIn connection successful',
                        details: { name: `${profile.localizedFirstName} ${profile.localizedLastName}` }
                    };
                }
                return { success: false, message: 'LinkedIn authentication failed' };
            }
            catch (error) {
                return { success: false, message: String(error) };
            }
        case 'facebook':
            if (!config.pageId || !config.accessToken) {
                return { success: false, message: 'Facebook credentials missing' };
            }
            try {
                const response = await fetch(`https://graph.facebook.com/v18.0/${config.pageId}?access_token=${config.accessToken}`);
                if (response.ok) {
                    const page = await response.json();
                    return {
                        success: true,
                        message: 'Facebook connection successful',
                        details: { name: page.name }
                    };
                }
                return { success: false, message: 'Facebook authentication failed' };
            }
            catch (error) {
                return { success: false, message: String(error) };
            }
        case 'x':
        case 'twitter':
            if (!config.bearerToken) {
                return { success: false, message: 'X bearer token missing' };
            }
            try {
                const response = await fetch('https://api.twitter.com/2/users/me', {
                    headers: {
                        'Authorization': `Bearer ${config.bearerToken}`
                    }
                });
                if (response.ok) {
                    const user = await response.json();
                    return {
                        success: true,
                        message: 'X connection successful',
                        details: { username: (_a = user.data) === null || _a === void 0 ? void 0 : _a.username }
                    };
                }
                return { success: false, message: 'X authentication failed' };
            }
            catch (error) {
                return { success: false, message: String(error) };
            }
        case 'instagram':
            if (!config.accountId || !config.accessToken) {
                return { success: false, message: 'Instagram credentials missing' };
            }
            try {
                const response = await fetch(`https://graph.facebook.com/v18.0/${config.accountId}?fields=username&access_token=${config.accessToken}`);
                if (response.ok) {
                    const account = await response.json();
                    return {
                        success: true,
                        message: 'Instagram connection successful',
                        details: { username: account.username }
                    };
                }
                return { success: false, message: 'Instagram authentication failed' };
            }
            catch (error) {
                return { success: false, message: String(error) };
            }
        default:
            return { success: false, message: `Platform ${platform} test not implemented` };
    }
}
//# sourceMappingURL=social-api-integrations.js.map