export interface paths {
    "/v1/accounts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List accounts or get by ID
         * @description Returns a single account if ?id= is provided, or a list of all accounts. Supports tag filtering via ?tag.key=value.
         */
        get: operations["listOrGetAccounts"];
        /** Update account */
        put: operations["updateAccount"];
        /** Create account */
        post: operations["createAccount"];
        /** Delete account */
        delete: operations["deleteAccount"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/agent/tasks": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Create an asynchronous agent media task */
        post: operations["createAgentTask"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/agent/tasks/events": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Tail structured agent task events */
        get: operations["listAgentTaskEvents"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/api_keys/recover": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Recover API key */
        post: operations["recoverApiKey"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/api_keys/rotate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Rotate API key */
        post: operations["rotateApiKey"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/assets": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List assets or get by ID
         * @description Returns a single asset if ?id= is provided, or a list. Filter by ?type=video or ?tag.key=value.
         */
        get: operations["listOrGetAssets"];
        /** Update asset metadata */
        put: operations["updateAsset"];
        /** Create asset from existing URL */
        post: operations["createAsset"];
        /** Delete asset (soft) */
        delete: operations["deleteAsset"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/auth/agent": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Agent registration (auth.md)
         * @description Register a machine client per the auth.md protocol. Two identity types are supported: `anonymous` (returns an API key immediately with pre-claim scopes) and `verified_email` (kicks off OTP, returns only a claim_token). Both flows are user-claimed — the agent and user run the entire ceremony with no agent-provider participation required.
         */
        post: operations["signupAgent"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/auth/agent/claim": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Initiate claim flow
         * @description Initiate the email-verification claim flow for a previously-issued anonymous registration. Sends a 6-digit OTP to the supplied email and returns a claim_attempt_id.
         */
        post: operations["agentClaim"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/auth/agent/claim/complete": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Complete claim flow
         * @description Complete the email-verification claim flow by submitting the OTP. On success the registration's claimStatus flips to email_verified, post-claim scopes are unlocked, and a freshly-rotated API key is returned. The original pre-claim `vj_anon_*` key is invalidated server-side as a hygiene measure — agents MUST swap it for the new credential.
         */
        post: operations["agentClaimComplete"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/auth/agent/revoke": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Revoke credential
         * @description Revoke a previously-issued credential. Accepts a logout JWT body (application/logout+jwt) for future provider-driven revocation; currently a no-op receiver, returns 200.
         */
        post: operations["agentRevoke"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/auth/verify/confirm": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Confirm email verification code
         * @description Validates the 6-digit code and returns API credentials if correct. Code expires after 5 minutes.
         */
        post: operations["confirmVerification"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/auth/verify/request": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Request email verification code
         * @description Sends a 6-digit verification code to the email. Always returns sent: true to prevent email enumeration.
         */
        post: operations["requestVerification"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/characters": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Create a reusable generated character */
        post: operations["createCharacter"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/check": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Check spec
         * @description Validate a VidLang spec against enabled rules. Rules are off by default — caller must enable at least one. Daily limit: 100/day (resets 00:00 UTC).
         */
        post: operations["checkSpec"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/check/rules": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get check rules
         * @description Load per-client custom rules. Unmetered — no daily limit.
         */
        get: operations["getCheckRules"];
        /**
         * Update check rules
         * @description Save per-client custom rules. Unmetered — no daily limit.
         */
        put: operations["updateCheckRules"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/clips/broll": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Create a B-roll-treated clip artifact
         * @description Creates a new immutable clip whose parent is the input clip. Assets, edit planning, and render providers remain internal.
         */
        post: operations["addClipBroll"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/clips/captions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Create a captioned clip artifact
         * @description Creates a new immutable clip whose parent is the input clip.
         */
        post: operations["addClipCaptions"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/clips/generate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Generate a bounded batch of 9:16 clips from a video source or video ID
         * @description One semantic job may resolve the source, transcribe it, find moments, and reframe clips. Returns a durable job; provider and model choices remain internal.
         */
        post: operations["generateClips"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/clones/check": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Evaluate whether a source video can be cloned reliably
         * @description Starts a durable EVE-backed analysis job. The result contains a deterministic cloneability score grounded in prompted VidJutsu watch evidence.
         */
        post: operations["cloneCheck"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/clones/starting-image": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Create a clean character-swapped starting frame */
        post: operations["cloneStartingImage"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/clones/video": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Clone source motion with Seedance or Kling motion control */
        post: operations["cloneVideo"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/compliance/prompt": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Check prompt compliance
         * @description Scan a caption, ad copy, draft script, or other text against a platform's current TOS / Community Guidelines. Returns a risk score with cited policy clauses. Informational only, not legal advice. 100/day rate limit.
         */
        post: operations["checkCompliancePrompt"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/compliance/video": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Check video compliance
         * @description Scan a video against a platform's current TOS / Community Guidelines. Returns a risk score with cited policy clauses. Informational only, not legal advice. 20/day rate limit.
         */
        post: operations["checkComplianceVideo"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/credits/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Check checkout status
         * @description Poll after starting a /v1/subscribe checkout. Once payment completes, returns the minted API key and clientId. (The /v1/credits route prefix is historical; this endpoint retrieves the subscription key, not a credit balance.)
         */
        get: operations["getCheckoutStatus"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/disclaimer": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Burn fine-print disclaimer onto video
         * @description Burns a fine-print disclaimer centered at the bottom of a video using FFmpeg ASS subtitles. Use for FTC-style disclosures like results-not-typical, paid-endorsement, or AI-generated labels. Returns CDN URL of the result. Daily limit: 50/day (resets 00:00 UTC).
         */
        post: operations["createDisclaimer"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/distribution/clips": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List generated clips or get one by ID */
        get: operations["listOrGetDistributionClips"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/distribution/jobs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Inspect a distribution job */
        get: operations["getDistributionJob"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/extract": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Extract from media
         * @description Pull frames, audio, and metadata from a video via server-side processing. Daily limit: 100/day (resets 00:00 UTC).
         */
        post: operations["extractMedia"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/info": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** API info */
        get: operations["getInfo"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/jobs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Inspect a durable VidJutsu media job */
        get: operations["getJob"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/overlay": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Burn text overlay onto video
         * @description Burns text overlay onto a video using FFmpeg ASS subtitles. Supports TikTok-safe zones, configurable font size, stroke thickness, and top/center/bottom positioning. Returns CDN URL of the result. Daily limit: 50/day (resets 00:00 UTC).
         */
        post: operations["createOverlay"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/posts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List posts or get by ID
         * @description Returns a single post if ?id= is provided, or a list of posts. Filter by ?accountId= or ?tag.key=value.
         */
        get: operations["listOrGetPosts"];
        /** Update post */
        put: operations["updatePost"];
        /** Create post */
        post: operations["createPost"];
        /** Delete post */
        delete: operations["deletePost"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/pricing": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get pricing */
        get: operations["getPricing"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/projects": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List projects or get by ID
         * @description Returns a single project if ?id= is provided, or a list. Filter by ?status= or ?tag.key=value.
         */
        get: operations["listOrGetEditorProjects"];
        /** Update editor project */
        put: operations["updateEditorProject"];
        /** Create editor project */
        post: operations["createEditorProject"];
        /** Archive editor project (soft) */
        delete: operations["deleteEditorProject"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/references": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List references or get by ID
         * @description Returns a single reference if ?id= is provided, or a list. Filter by ?platform= or ?tag.key=value.
         */
        get: operations["listOrGetReferences"];
        /** Update reference */
        put: operations["updateReference"];
        /** Create reference */
        post: operations["createReference"];
        /** Delete reference */
        delete: operations["deleteReference"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/scrape/ads/google": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Scrape Google Ad Transparency
         * @description Ads for a company in the Google Ad Transparency Library. Counts as 1 request against the shared scrape group (500/day); staging media with download_media does not consume extra quota.
         */
        post: operations["scrapeGoogleAds"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/scrape/ads/linkedin": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Scrape LinkedIn Ad Library
         * @description Active LinkedIn ads matching keyword. Counts as 1 request against the shared scrape group (500/day); staging media with download_media does not consume extra quota.
         */
        post: operations["scrapeLinkedInAds"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/scrape/ads/meta": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Scrape Meta (Facebook) Ad Library
         * @description Active Meta ads matching keyword. Counts as 1 request against the shared scrape group (500/day); staging media with download_media does not consume extra quota.
         */
        post: operations["scrapeMetaAds"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/scrape/ads/reddit": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Scrape Reddit Ad Library
         * @description Active Reddit ads matching keyword. Counts as 1 request against the shared scrape group (500/day); staging media with download_media does not consume extra quota.
         */
        post: operations["scrapeRedditAds"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/scrape/instagram/post": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Scrape Instagram post or reel
         * @description Single Instagram post or reel + media URLs. Counts as 1 request against the shared scrape group (500/day); staging media with download_media does not consume extra quota.
         */
        post: operations["scrapeInstagramPost"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/scrape/instagram/post/comments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Scrape Instagram post comments
         * @description Comments on an Instagram post or reel. 1 op.
         */
        post: operations["scrapeInstagramPostComments"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/scrape/instagram/profile": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Scrape Instagram profile
         * @description Public Instagram profile + recent reels. Counts as 1 request against the shared scrape group (500/day); staging media with download_media does not consume extra quota.
         */
        post: operations["scrapeInstagramProfile"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/scrape/instagram/user/posts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Scrape Instagram user posts
         * @description Paginated posts for an Instagram profile. Counts as 1 request against the shared scrape group (500/day); staging media with download_media does not consume extra quota.
         */
        post: operations["scrapeInstagramUserPosts"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/scrape/instagram/user/reels": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Scrape Instagram user reels
         * @description Paginated reels for an Instagram profile. Counts as 1 request against the shared scrape group (500/day); staging media with download_media does not consume extra quota.
         */
        post: operations["scrapeInstagramUserReels"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/scrape/tiktok/profile": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Scrape TikTok profile
         * @description Fetch public TikTok profile data via Scrape Creators. Counts as 1 request against the shared scrape group (500/day); staging media with download_media does not consume extra quota.
         */
        post: operations["scrapeTikTokProfile"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/scrape/tiktok/profile/videos": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Scrape TikTok profile videos
         * @description Paginated videos for a TikTok profile. Counts as 1 request against the shared scrape group (500/day); staging media with download_media does not consume extra quota.
         */
        post: operations["scrapeTikTokProfileVideos"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/scrape/tiktok/search/users": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Scrape TikTok user search
         * @description Search TikTok users by keyword. 1 op.
         */
        post: operations["scrapeTikTokSearchUsers"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/scrape/tiktok/trending": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Scrape TikTok trending feed
         * @description Trending feed by region. Counts as 1 request against the shared scrape group (500/day); staging media with download_media does not consume extra quota.
         */
        post: operations["scrapeTikTokTrending"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/scrape/tiktok/video": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Scrape TikTok video
         * @description Single TikTok video metadata + media URLs. Counts as 1 request against the shared scrape group (500/day); staging media with download_media does not consume extra quota.
         */
        post: operations["scrapeTikTokVideo"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/scrape/tiktok/video/comments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Scrape TikTok video comments
         * @description Comments on a TikTok video. 1 op.
         */
        post: operations["scrapeTikTokVideoComments"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/scrape/tiktok/video/transcript": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Scrape TikTok video transcript
         * @description Spoken transcript for a TikTok video. 1 op.
         */
        post: operations["scrapeTikTokVideoTranscript"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/scrape/twitter/profile": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Scrape X profile
         * @description Public X/Twitter profile + stats. Counts as 1 request against the shared scrape group (500/day); staging media with download_media does not consume extra quota.
         */
        post: operations["scrapeTwitterProfile"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/scrape/twitter/tweet": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Scrape X tweet
         * @description Single tweet + media. Counts as 1 request against the shared scrape group (500/day); staging media with download_media does not consume extra quota.
         */
        post: operations["scrapeTwitterTweet"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/scrape/twitter/tweet/transcript": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Scrape X tweet video transcript
         * @description Transcript of the video in a tweet (when present). 1 op.
         */
        post: operations["scrapeTwitterTweetTranscript"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/scrape/twitter/user-tweets": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Scrape X user tweets
         * @description Recent tweets for a handle. Counts as 1 request against the shared scrape group (500/day); staging media with download_media does not consume extra quota.
         */
        post: operations["scrapeTwitterUserTweets"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/scrape/youtube/channel": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Scrape YouTube channel
         * @description YouTube channel info + stats. Provide handle or channel_id. Counts as 1 request against the shared scrape group (500/day); staging media with download_media does not consume extra quota.
         */
        post: operations["scrapeYouTubeChannel"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/scrape/youtube/channel-videos": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Scrape YouTube channel videos
         * @description Paginated videos for a channel. Provide handle or channel_id. Counts as 1 request against the shared scrape group (500/day); staging media with download_media does not consume extra quota.
         */
        post: operations["scrapeYouTubeChannelVideos"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/scrape/youtube/video": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Scrape YouTube video
         * @description Single YouTube video info, including transcript. Counts as 1 request against the shared scrape group (500/day); staging media with download_media does not consume extra quota.
         */
        post: operations["scrapeYouTubeVideo"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/scrape/youtube/video/comments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Scrape YouTube video comments
         * @description Comments on a YouTube video. 1 op.
         */
        post: operations["scrapeYouTubeVideoComments"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/subscribe": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Create subscription
         * @description Starts a Stripe Checkout session for the flat $99/mo subscription. Returns the hosted checkout `url` and a `claimToken`. After payment, poll GET /v1/credits/status with the session id to retrieve the minted API key. An active subscription is required for all gated intelligence endpoints; calls without one return 403 subscription_required.
         */
        post: operations["createSubscription"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/transcribe": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Transcribe media
         * @description Speech-to-text with word-level timing. Daily limit: 30/day (resets 00:00 UTC).
         */
        post: operations["transcribeMedia"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/upload": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Upload file */
        post: operations["uploadFile"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/upload/url": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Upload from URL */
        post: operations["uploadFromUrl"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/usage": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get daily usage
         * @description Returns remaining rate-limit capacity per endpoint for the caller. Resets daily at 00:00 UTC.
         */
        get: operations["getUsage"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/videos/add": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Add a video from an uploaded asset, direct MP4 URL, or YouTube URL
         * @description Creates or reuses a normalized Vidjutsu video. Provider ingest, downloading, indexing, and storage are implementation details.
         */
        post: operations["addVideo"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/videos/download/instagram": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Import an Instagram video into VidJutsu
         * @description Imports the primary video from an Instagram post or reel into tenant-owned VidJutsu storage. Repeated imports reuse the same immutable asset.
         */
        post: operations["downloadInstagramVideo"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/videos/download/tiktok": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Import a TikTok video into VidJutsu
         * @description Imports the primary video from a TikTok post into tenant-owned VidJutsu storage. Repeated imports reuse the same immutable asset.
         */
        post: operations["downloadTikTokVideo"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/watch": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Watch media
         * @description AI watches a video or image and answers your freeform prompt. Returns structured JSON. Daily limit: 50/day (resets 00:00 UTC).
         */
        post: operations["watchMedia"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        Account: {
            accountId: string;
            clientId: string;
            /** @enum {string} */
            platform: "instagram";
            name: string;
            handle?: string;
            bio?: string;
            pfp?: string;
            niche?: string;
            linkInBio?: string;
            status: components["schemas"]["AccountStatus"];
            tags?: components["schemas"]["Tag"][];
            /** Format: int64 */
            createdAt: number;
        };
        AccountCreateRequest: {
            /** @enum {string} */
            platform: "instagram";
            name: string;
            handle?: string;
            bio?: string;
            pfp?: string;
            niche?: string;
            linkInBio?: string;
            tags?: components["schemas"]["Tag"][];
        };
        AccountCreateResponse: {
            id: string;
            /** @enum {string} */
            status: "draft";
        };
        AccountDeleteResponse: {
            id: string;
            /** @enum {string} */
            status: "deleted";
        };
        AccountListResponse: {
            data: components["schemas"]["Account"][];
        };
        /** @enum {string} */
        AccountStatus: "draft" | "active" | "deleted";
        AccountUpdateRequest: {
            handle?: string;
            name?: string;
            bio?: string;
            pfp?: string;
            niche?: string;
            linkInBio?: string;
            tags?: components["schemas"]["Tag"][];
        };
        AccountUpdateResponse: {
            accountId: string;
            /** @enum {boolean} */
            updated: true;
        };
        AddBrollRequest: {
            clipId: string;
            mode: components["schemas"]["BrollMode"];
            /** @description Optional approved asset IDs. Required when mode is supplied. */
            assetIds?: string[];
            intent?: string;
            dryRun?: boolean;
        };
        AddCaptionsRequest: {
            clipId: string;
            preset?: string;
            language?: string;
            dryRun?: boolean;
        };
        AddVideoRequest: {
            source: components["schemas"]["VideoSource"];
            dryRun?: boolean;
        };
        AgentClaimCompleteRequest: {
            claim_token: string;
            /** @description 6-digit verification code emailed to the principal. */
            code: string;
        };
        AgentClaimCompleteResponse: {
            /** @description Freshly-rotated API key. For anonymous registrations the original `vj_anon_*` key returned at signup is now invalid; agents MUST replace it with this value. */
            credential: string;
            /** @enum {string} */
            credential_type: "api_key";
            /** Format: int64 */
            credential_expires?: number;
            scopes: string[];
        };
        AgentClaimRequest: {
            /** @description Opaque claim_token returned from the initial /v1/auth/agent call. */
            claim_token: string;
            /** @description Email address to send the verification code to. */
            email: string;
        };
        AgentClaimResponse: {
            registration_id: string;
            /** @description Identifier for this claim attempt. */
            claim_attempt_id: string;
            /** @enum {string} */
            status: "initiated";
            /**
             * Format: int64
             * @description Unix epoch ms when this claim attempt expires.
             */
            expires_at: number;
        };
        AgentRevokeResponse: {
            revoked: boolean;
        };
        AgentSignupAnonymousBody: {
            /** @enum {string} */
            type: "anonymous";
            /**
             * @description Requested credential type. Currently only api_key is supported.
             * @enum {string}
             */
            requested_credential_type?: "api_key";
        };
        AgentSignupBody: components["schemas"]["AgentSignupAnonymousBody"] | components["schemas"]["AgentSignupVerifiedEmailBody"];
        AgentSignupResponse: {
            /** @description Server-generated registration id (rgn_...). */
            registration_id: string;
            /**
             * @description How the registration was initiated.
             * @enum {string}
             */
            registration_type: "anonymous" | "email-verification";
            /**
             * @description Credential type returned, when issued immediately. Omitted on flows that require claim_token first.
             * @enum {string}
             */
            credential_type?: "api_key";
            /** @description Live credential (API key) issued by the server, when one is issued immediately. */
            credential?: string;
            /**
             * Format: int64
             * @description Unix epoch ms when the credential expires, or null/undefined for non-expiring keys.
             */
            credential_expires?: number;
            /** @description Scopes the credential is authorized for at issue time. */
            scopes?: string[];
            /** @description Scopes that will be added after the claim flow completes. */
            post_claim_scopes?: string[];
            /** @description URL the agent should direct the principal to in order to complete claim/verification. */
            claim_url?: string;
            /** @description Opaque token used to complete the claim flow. */
            claim_token?: string;
            /**
             * Format: int64
             * @description Unix epoch ms when the claim_token expires.
             */
            claim_token_expires?: number;
        };
        AgentSignupVerifiedEmailBody: {
            /** @enum {string} */
            type: "identity_assertion";
            /** @enum {string} */
            assertion_type: "verified_email";
            /** @description Email address the agent asserts on behalf of the principal. */
            assertion: string;
        };
        AgentTaskAccepted: {
            id: string;
            status: components["schemas"]["AgentTaskStatus"];
            statusUrl: string;
            eventsUrl: string;
        };
        AgentTaskAssetInput: {
            name: string;
            assetId: string;
        };
        AgentTaskEvent: {
            id: string;
            taskId: string;
            /** Format: int32 */
            sequence: number;
            type: components["schemas"]["AgentTaskEventType"];
            data: unknown;
            /** Format: int64 */
            createdAt: number;
        };
        AgentTaskEventPage: {
            taskId: string;
            events: components["schemas"]["AgentTaskEvent"][];
            nextCursor?: string;
            terminal: boolean;
        };
        /** @enum {string} */
        AgentTaskEventType: "task.created" | "agent.started" | "stage.started" | "stage.completed" | "stage.failed" | "checkpoint.created" | "provider.submitted" | "task.waiting" | "task.retrying" | "task.rejected" | "task.completed" | "task.failed" | "task.cancelled";
        AgentTaskInputSource: components["schemas"]["AgentTaskUrlInput"] | components["schemas"]["AgentTaskAssetInput"];
        AgentTaskResult: {
            /** @enum {string} */
            kind: "agent_task";
            /** @enum {string} */
            outcome: "completed" | "rejected";
            finalAssetId?: string;
            /** Format: uri */
            finalUrl?: string;
            summary?: string;
            reasons?: string[];
            /** Format: int64 */
            costMicros?: number;
        };
        /** @enum {string} */
        AgentTaskStatus: "queued" | "running" | "waiting_provider" | "retrying" | "rejected" | "completed" | "failed" | "cancelled";
        AgentTaskUrlInput: {
            name: string;
            /** Format: uri */
            url: string;
        };
        ApiError: {
            error: string;
            message: string;
            setup?: string;
        };
        ApiKeyRecoverRequest: {
            email: string;
        };
        ApiKeyRecoverResponse: {
            message: string;
        };
        ApiKeyRotateResponse: {
            apiKey: string;
            clientId: string;
            message: string;
        };
        ApiKeyStatusResponse: {
            /** @enum {string} */
            status: "pending" | "completed";
            apiKey?: string;
            clientId?: string;
            isNew?: boolean;
        };
        Asset: {
            assetId: string;
            clientId: string;
            name?: string;
            url: string;
            r2Key?: string;
            contentType: string;
            /** Format: int64 */
            size?: number;
            type: components["schemas"]["AssetType"];
            tags?: components["schemas"]["Tag"][];
            metadata?: {
                [key: string]: unknown;
            };
            status: components["schemas"]["AssetStatus"];
            /** Format: int64 */
            createdAt: number;
        };
        AssetCreateRequest: {
            url: string;
            name?: string;
            contentType?: string;
            tags?: components["schemas"]["Tag"][];
            metadata?: {
                [key: string]: unknown;
            };
        };
        AssetCreateResponse: {
            id: string;
            url: string;
            /** @enum {string} */
            status: "active";
        };
        AssetDeleteResponse: {
            id: string;
            /** @enum {string} */
            status: "deleted";
        };
        AssetListResponse: {
            data: components["schemas"]["Asset"][];
        };
        /** @enum {string} */
        AssetStatus: "active" | "deleted";
        /** @enum {string} */
        AssetType: "video" | "image" | "audio" | "other";
        AssetUpdateRequest: {
            name?: string;
            tags?: components["schemas"]["Tag"][];
            metadata?: {
                [key: string]: unknown;
            };
        };
        AssetUpdateResponse: {
            assetId: string;
            /** @enum {boolean} */
            updated: true;
        };
        AssetVideoSource: {
            /** @enum {string} */
            kind: "asset";
            assetId: string;
        };
        BearerAuth: {
            /**
             * @description Http authentication
             * @enum {string}
             */
            type: "http";
            /**
             * @description bearer auth scheme
             * @enum {string}
             */
            scheme: "bearer";
        };
        /** @enum {string} */
        BrollMode: "auto" | "supplied" | "none";
        CharacterResult: {
            /** @enum {string} */
            kind: "character";
            characterId: string;
            identityImageAssetId: string;
        };
        CheckRequest: {
            /** @description VidLang spec JSON to validate */
            spec: {
                [key: string]: unknown;
            };
            /** @description VidLang rules config. All rules off by default — enable explicitly. E.g. { "VL013": true, "VL003": false, "VL011": { "severity": "warning" } } */
            rules: {
                [key: string]: unknown;
            };
        };
        CheckResponse: {
            passed: boolean;
            results: components["schemas"]["CheckResult"][];
        };
        CheckResult: {
            rule: string;
            passed: boolean;
            message: string;
            location?: string;
            severity: string;
        };
        CheckRulesResponse: {
            rules: string[];
        };
        CheckRulesUpdateRequest: {
            rules: string[];
        };
        Clip: {
            clipId: string;
            rootVideoId: string;
            parentClipId?: string;
            transformKind: components["schemas"]["ClipTransformKind"];
            status: components["schemas"]["ClipStatus"];
            /** @enum {string} */
            aspectRatio: "9:16";
            /** Format: double */
            durationSeconds?: number;
            assetId?: string;
            /** Format: uri */
            url?: string;
            /** Format: int64 */
            createdAt: number;
        };
        ClipListResponse: {
            data: components["schemas"]["Clip"][];
        };
        ClipResponse: {
            data: components["schemas"]["Clip"];
        };
        /** @enum {string} */
        ClipStatus: "processing" | "ready" | "failed";
        /** @enum {string} */
        ClipTransformKind: "generated" | "timestamps" | "captions" | "broll";
        CloneCheckEvidence: {
            criterion: string;
            observation: string;
            timestamps: number[];
        };
        CloneCheckRequest: {
            source: components["schemas"]["VideoSource"];
            rubricVersion?: string;
            dryRun?: boolean;
        };
        CloneCheckResult: {
            /** @enum {string} */
            kind: "clone_check";
            checkId: string;
            /** Format: int32 */
            successPercent: number;
            verdict: components["schemas"]["CloneCheckVerdict"];
            evidence: components["schemas"]["CloneCheckEvidence"][];
            failedCriteria: string[];
            recommendedModel: components["schemas"]["VideoCloneModel"];
            rubricVersion: string;
        };
        /** @enum {string} */
        CloneCheckVerdict: "recommended" | "marginal" | "not_recommended";
        CloneStartingImageRequest: {
            source: components["schemas"]["VideoSource"];
            characterId: string;
            dryRun?: boolean;
        };
        CloneVideoRequest: {
            source: components["schemas"]["VideoSource"];
            startingImageAssetId: string;
            model: components["schemas"]["VideoCloneModel"];
            cloneCheckId: string;
            override?: components["schemas"]["LowScoreOverride"];
            dryRun?: boolean;
        };
        CloneVideoResult: {
            /** @enum {string} */
            kind: "clone_video";
            assetId: string;
            /** Format: uri */
            url?: string;
            model: components["schemas"]["VideoCloneModel"];
            cloneCheckId: string;
            /** Format: int32 */
            qaScore?: number;
        };
        ComplianceCheckResponse: {
            /**
             * Format: int32
             * @description Composite risk score 0-100 computed deterministically from violation severities.
             */
            riskScore: number;
            /** @enum {string} */
            verdict: "safe" | "caution" | "high-risk" | "likely-violation";
            violations: components["schemas"]["ComplianceViolation"][];
            /** @enum {string} */
            platform: "youtube" | "tiktok" | "instagram" | "meta-ads" | "ftc";
            /** @description ISO date of the newest active policy snapshot this scan was evaluated against. */
            policySnapshotDate: string;
            /** @description Informational disclaimer. This response is not legal advice. */
            disclaimer: string;
        };
        ComplianceCitation: {
            /** @description Exact quoted clause from the platform's policy page. */
            text: string;
            /** @description URL to the source policy page (may include #anchor). */
            sourceUrl: string;
            /** @description ISO date (YYYY-MM-DD) of the policy snapshot this citation was drawn from. */
            policyVersion: string;
        };
        ComplianceContext: {
            caption?: string;
            hashtags?: string[];
            monetized?: boolean;
        };
        ComplianceEvidence: {
            /**
             * Format: double
             * @description Timestamp (seconds) in the source video where the evidence appears.
             */
            timestamp?: number;
            /** @description Relevant transcript excerpt, if any. */
            transcriptExcerpt?: string;
            /** @description Short description of the visual evidence, if any. */
            visualDescription?: string;
        };
        CompliancePromptRequest: {
            /** @description The text to evaluate — caption, ad copy, draft script, upload description, etc. */
            text: string;
            /** @enum {string} */
            platform: "youtube" | "tiktok" | "instagram" | "meta-ads" | "ftc";
            /**
             * @description Optional label for logs; does not affect rule selection.
             * @enum {string}
             */
            kind?: "caption" | "script" | "ad-copy" | "description" | "other";
            /** @description Optional publication metadata that affects risk (caption, hashtags, monetization intent). */
            context?: components["schemas"]["ComplianceContext"];
        };
        ComplianceVideoRequest: {
            /** @description Public URL of the video to scan. */
            videoUrl: string;
            /** @enum {string} */
            platform: "youtube" | "tiktok" | "instagram" | "meta-ads" | "ftc";
            /**
             * @description Optional content format hint. Inferred from duration when omitted.
             * @enum {string}
             */
            format?: "shortform" | "longform";
            /** @description Optional publication metadata that affects risk (caption, hashtags, monetization intent). */
            context?: components["schemas"]["ComplianceContext"];
        };
        ComplianceViolation: {
            /** @description Stable identifier of the matched rule in our compliance corpus. */
            ruleId: string;
            /** @description Rule category, e.g. monetization, community-guidelines, ad-policy, copyright, minors. */
            category: string;
            /** @enum {string} */
            severity: "low" | "medium" | "high" | "critical";
            /** @description Plain-language reasoning tying the video to the cited rule. Informational, not legal advice. */
            explanation: string;
            citation: components["schemas"]["ComplianceCitation"];
            evidence: components["schemas"]["ComplianceEvidence"];
        };
        CreateAgentTaskRequest: {
            prompt: string;
            inputs?: components["schemas"]["AgentTaskInputSource"][];
        };
        CreateCharacterRequest: {
            prompt: string;
            referenceImageAssetIds?: string[];
            dryRun?: boolean;
        };
        /** @description Per-endpoint daily request limits, keyed by endpoint name (fixed window, resets 00:00 UTC). */
        DailyLimits: {
            [key: string]: number;
        };
        DisclaimerRequest: {
            /** @description URL of the source video */
            videoUrl: string;
            /** @description Disclaimer text. Use \\n for line breaks. Kept fine-print style at the bottom of the frame. */
            text: string;
            /**
             * Format: int32
             * @description Font size in pixels. Defaults to 2.2% of video height (fine-print).
             */
            fontSize?: number;
        };
        DisclaimerResponse: {
            /** @description Disclaimer asset ID */
            id: string;
            /** @description CDN URL of the disclaimed video */
            resultUrl: string;
        };
        DistributionJob: {
            jobId: string;
            operation: components["schemas"]["DistributionJobOperation"];
            status: components["schemas"]["DistributionJobStatus"];
            outputs?: components["schemas"]["JobOutputResource"][];
            error?: components["schemas"]["DistributionJobError"];
            /** Format: int64 */
            createdAt: number;
            /** Format: int64 */
            completedAt?: number;
        };
        DistributionJobError: {
            code: string;
            message: string;
            retryable: boolean;
        };
        /** @enum {string} */
        DistributionJobOperation: "addVideo" | "generateClips" | "addCaptions" | "addBroll" | "schedulePost";
        /** @enum {string} */
        DistributionJobStatus: "queued" | "running" | "completed" | "failed" | "cancelled";
        EditorProject: {
            projectId: string;
            clientId: string;
            name: string;
            /**
             * @description The serializable timeline document (Twick ProjectJSON: tracks, assets,
             *     metadata, version). Stored opaquely; the editor owns its shape.
             */
            project?: {
                [key: string]: unknown;
            };
            tags?: components["schemas"]["Tag"][];
            metadata?: {
                [key: string]: unknown;
            };
            status: components["schemas"]["EditorProjectStatus"];
            /** Format: int64 */
            createdAt: number;
            /** Format: int64 */
            updatedAt: number;
        };
        EditorProjectCreateRequest: {
            name: string;
            project?: {
                [key: string]: unknown;
            };
            tags?: components["schemas"]["Tag"][];
            metadata?: {
                [key: string]: unknown;
            };
        };
        EditorProjectCreateResponse: {
            id: string;
            /** @enum {string} */
            status: "draft";
        };
        EditorProjectDeleteResponse: {
            id: string;
            /** @enum {string} */
            status: "archived";
        };
        EditorProjectListResponse: {
            data: components["schemas"]["EditorProject"][];
        };
        /** @enum {string} */
        EditorProjectStatus: "draft" | "active" | "archived";
        EditorProjectUpdateRequest: {
            name?: string;
            status?: components["schemas"]["EditorProjectStatus"];
            project?: {
                [key: string]: unknown;
            };
            tags?: components["schemas"]["Tag"][];
            metadata?: {
                [key: string]: unknown;
            };
        };
        EditorProjectUpdateResponse: {
            projectId: string;
            /** @enum {boolean} */
            updated: true;
        };
        ExtractAudio: {
            url: string;
            /** Format: double */
            duration: number;
        };
        ExtractFrame: {
            /** Format: int32 */
            index: number;
            url: string;
        };
        ExtractMetadata: {
            /** Format: int32 */
            width: number;
            /** Format: int32 */
            height: number;
            /** Format: double */
            fps: number;
            /** Format: double */
            duration: number;
        };
        ExtractRequest: {
            /** @description URL of the video to extract from */
            mediaUrl: string;
            /** @description Frame indices to extract. Use [0, 75, 150] for specific frames, 'auto' for 3 evenly spaced, or 'last' for the final frame */
            frames?: unknown;
            /** @description Extract audio track as WAV */
            audio?: boolean;
            /** @description Return video metadata (width, height, fps, duration). Defaults to true */
            metadata?: boolean;
        };
        ExtractResponse: {
            frames?: components["schemas"]["ExtractFrame"][];
            audio?: components["schemas"]["ExtractAudio"];
            metadata?: components["schemas"]["ExtractMetadata"];
        };
        GenerateClipsRequest: {
            /** @description Provide source or videoId. Exactly one is required. */
            source?: Omit<components["schemas"]["VideoSource"], "kind">;
            /** @description Existing normalized Vidjutsu video. Provide this or source, not both. */
            videoId?: string;
            /** @enum {string} */
            aspectRatio: "9:16";
            /** Format: int32 */
            count: number;
            /** Format: int32 */
            minDurationSeconds?: number;
            /** Format: int32 */
            maxDurationSeconds?: number;
            intent?: string;
            dryRun?: boolean;
        };
        HttpVideoSource: {
            /** @enum {string} */
            kind: "http";
            /** Format: uri */
            url: string;
        };
        InfoResponse: {
            name: string;
            version: string;
            endpoints: {
                [key: string]: string;
            };
            auth: unknown;
            /** @description Per-endpoint daily request limits (fixed window, resets 00:00 UTC). */
            dailyLimits: components["schemas"]["DailyLimits"];
        };
        JobOutputResource: {
            /** @enum {string} */
            kind: "video" | "clip" | "post" | "image" | "character" | "clone_check";
            id: string;
        };
        LowScoreOverride: {
            /** @enum {boolean} */
            allowLowScore: true;
            reason: string;
        };
        MediaJob: {
            jobId: string;
            parentJobId?: string;
            operation: components["schemas"]["MediaJobOperation"];
            status: components["schemas"]["MediaJobStatus"];
            outputs?: components["schemas"]["JobOutputResource"][];
            result?: components["schemas"]["MediaJobResult"];
            error?: components["schemas"]["MediaJobError"];
            /** Format: int64 */
            createdAt: number;
            /** Format: int64 */
            completedAt?: number;
        };
        MediaJobError: {
            code: string;
            message: string;
            retryable: boolean;
        };
        /** @enum {string} */
        MediaJobOperation: "addVideo" | "generateClips" | "addCaptions" | "addBroll" | "schedulePost" | "cloneCheck" | "createCharacter" | "cloneStartingImage" | "cloneVideo" | "agentTask";
        MediaJobResult: components["schemas"]["CloneCheckResult"] | components["schemas"]["CharacterResult"] | components["schemas"]["StartingImageResult"] | components["schemas"]["CloneVideoResult"] | components["schemas"]["AgentTaskResult"];
        /** @enum {string} */
        MediaJobStatus: "queued" | "running" | "waiting_provider" | "retrying" | "rejected" | "completed" | "failed" | "cancelled";
        OverlayRequest: {
            /** @description URL of the source video */
            videoUrl: string;
            /** @description Overlay text. Use \\n for line breaks. */
            text: string;
            /**
             * @description Vertical text placement
             * @enum {string}
             */
            position?: "top" | "center" | "bottom";
            /**
             * Format: int32
             * @description Font size in pixels. Defaults to 4% of video height.
             */
            fontSize?: number;
            /**
             * Format: int32
             * @description Text outline thickness (0-10). Defaults to 2.
             */
            strokeThickness?: number;
        };
        OverlayResponse: {
            /** @description Overlay asset ID */
            id: string;
            /** @description CDN URL of the overlaid video */
            resultUrl: string;
        };
        Post: {
            postId: string;
            clientId: string;
            accountId?: string;
            videoId?: string;
            mediaUrl?: string;
            caption?: string;
            brief?: unknown;
            status: components["schemas"]["PostStatus"];
            tags?: components["schemas"]["Tag"][];
            /** Format: int64 */
            createdAt: number;
        };
        PostCreateRequest: {
            accountId?: string;
            videoId?: string;
            mediaUrl?: string;
            caption?: string;
            brief?: unknown;
            tags?: components["schemas"]["Tag"][];
        };
        PostCreateResponse: {
            id: string;
            /** @enum {string} */
            status: "draft";
        };
        PostDeleteResponse: {
            id: string;
            /** @enum {string} */
            status: "deleted";
        };
        PostListResponse: {
            data: components["schemas"]["Post"][];
        };
        /** @enum {string} */
        PostStatus: "draft" | "active" | "deleted";
        PostUpdateRequest: {
            caption?: string;
            mediaUrl?: string;
            videoId?: string;
            accountId?: string;
            brief?: unknown;
            tags?: components["schemas"]["Tag"][];
        };
        PostUpdateResponse: {
            postId: string;
            /** @enum {boolean} */
            updated: true;
        };
        PricingResponse: {
            subscription: components["schemas"]["SubscriptionInfo"];
            /**
             * Format: int32
             * @description Maximum managed accounts per subscription.
             */
            maxAccounts: number;
            /** @description Per-endpoint daily request limits (fixed window, resets 00:00 UTC). */
            dailyLimits: components["schemas"]["DailyLimits"];
        };
        Reference: {
            referenceId: string;
            clientId: string;
            url: string;
            platform?: string;
            notes?: string;
            tags?: components["schemas"]["Tag"][];
            metadata?: unknown;
            /** @enum {string} */
            status: "active" | "deleted";
            /** Format: double */
            createdAt: number;
        };
        ReferenceCreateRequest: {
            url: string;
            platform?: string;
            notes?: string;
            tags?: components["schemas"]["Tag"][];
            metadata?: unknown;
        };
        ReferenceCreateResponse: {
            id: string;
            /** @enum {string} */
            status: "active";
        };
        ReferenceDeleteResponse: {
            id: string;
            /** @enum {string} */
            status: "deleted";
        };
        ReferenceListResponse: {
            data: components["schemas"]["Reference"][];
        };
        ReferenceUpdateRequest: {
            url?: string;
            platform?: string;
            notes?: string;
            tags?: components["schemas"]["Tag"][];
            metadata?: unknown;
        };
        ReferenceUpdateResponse: {
            referenceId: string;
            /** @enum {boolean} */
            updated: true;
        };
        ScrapeGoogleAdsRequest: {
            /** @description Company / advertiser name */
            company: string;
            /**
             * @description When true, media URLs in the response are staged through VidJutsu CDN and the response contains ONLY VidJutsu URLs. Defaults to false (raw source URLs returned as-is).
             * @default false
             */
            download_media: boolean;
        };
        ScrapeInstagramPostCommentsRequest: {
            /** @description Instagram post URL */
            url: string;
            /** @description Pagination cursor */
            cursor?: string;
        };
        ScrapeInstagramPostRequest: {
            /** @description Instagram post or reel URL */
            url: string;
            /**
             * @description When true, media URLs in the response are staged through VidJutsu CDN and the response contains ONLY VidJutsu URLs. Defaults to false (raw source URLs returned as-is).
             * @default false
             */
            download_media: boolean;
        };
        ScrapeInstagramProfileRequest: {
            /** @description Instagram username (without @) */
            handle: string;
            /**
             * @description When true, media URLs in the response are staged through VidJutsu CDN and the response contains ONLY VidJutsu URLs. Defaults to false (raw source URLs returned as-is).
             * @default false
             */
            download_media: boolean;
        };
        ScrapeInstagramUserPostsRequest: {
            /** @description Instagram username */
            handle: string;
            /** @description Pagination cursor */
            cursor?: string;
            /**
             * @description When true, media URLs in the response are staged through VidJutsu CDN and the response contains ONLY VidJutsu URLs. Defaults to false (raw source URLs returned as-is).
             * @default false
             */
            download_media: boolean;
        };
        ScrapeInstagramUserReelsRequest: {
            /** @description Instagram username */
            handle: string;
            /** @description Pagination cursor */
            cursor?: string;
            /**
             * @description When true, media URLs in the response are staged through VidJutsu CDN and the response contains ONLY VidJutsu URLs. Defaults to false (raw source URLs returned as-is).
             * @default false
             */
            download_media: boolean;
        };
        ScrapeLinkedInAdsRequest: {
            /** @description Search keyword */
            query: string;
            /**
             * @description When true, media URLs in the response are staged through VidJutsu CDN and the response contains ONLY VidJutsu URLs. Defaults to false (raw source URLs returned as-is).
             * @default false
             */
            download_media: boolean;
        };
        ScrapeMetaAdsRequest: {
            /** @description Search keyword or page name */
            query: string;
            /** @description Two-letter ISO country (default: US) */
            country?: string;
            /**
             * @description When true, media URLs in the response are staged through VidJutsu CDN and the response contains ONLY VidJutsu URLs. Defaults to false (raw source URLs returned as-is).
             * @default false
             */
            download_media: boolean;
        };
        ScrapeRedditAdsRequest: {
            /** @description Search keyword */
            query: string;
            /**
             * @description When true, media URLs in the response are staged through VidJutsu CDN and the response contains ONLY VidJutsu URLs. Defaults to false (raw source URLs returned as-is).
             * @default false
             */
            download_media: boolean;
        };
        ScrapeResponse: {
            /** @description Pass-through response from Scrape Creators. Shape varies per endpoint. When download_media was true, all media URLs are replaced with VidJutsu CDN URLs. */
            data: unknown;
        };
        ScrapeTikTokProfileRequest: {
            /** @description TikTok username (without @) */
            handle: string;
            /** @description Reduce response size by trimming large fields */
            trim?: boolean;
            /**
             * @description When true, media URLs in the response are staged through VidJutsu CDN and the response contains ONLY VidJutsu URLs. Defaults to false (raw source URLs returned as-is).
             * @default false
             */
            download_media: boolean;
        };
        ScrapeTikTokProfileVideosRequest: {
            /** @description TikTok username */
            handle: string;
            /** @description Pagination cursor */
            cursor?: string;
            /**
             * @description When true, media URLs in the response are staged through VidJutsu CDN and the response contains ONLY VidJutsu URLs. Defaults to false (raw source URLs returned as-is).
             * @default false
             */
            download_media: boolean;
        };
        ScrapeTikTokSearchUsersRequest: {
            /** @description Search query */
            query: string;
            /** @description Pagination cursor */
            cursor?: string;
        };
        ScrapeTikTokTrendingRequest: {
            /** @description Two-letter ISO country code (e.g. 'us') */
            country?: string;
            /**
             * @description When true, media URLs in the response are staged through VidJutsu CDN and the response contains ONLY VidJutsu URLs. Defaults to false (raw source URLs returned as-is).
             * @default false
             */
            download_media: boolean;
        };
        ScrapeTikTokVideoCommentsRequest: {
            /** @description TikTok video URL */
            url: string;
            /** @description Pagination cursor */
            cursor?: string;
        };
        ScrapeTikTokVideoRequest: {
            /** @description TikTok video URL */
            url: string;
            /** @description Reduce response size */
            trim?: boolean;
            /**
             * @description When true, media URLs in the response are staged through VidJutsu CDN and the response contains ONLY VidJutsu URLs. Defaults to false (raw source URLs returned as-is).
             * @default false
             */
            download_media: boolean;
        };
        ScrapeTikTokVideoTranscriptRequest: {
            /** @description TikTok video URL */
            url: string;
        };
        ScrapeTwitterProfileRequest: {
            /** @description X username (without @) */
            handle: string;
            /**
             * @description When true, media URLs in the response are staged through VidJutsu CDN and the response contains ONLY VidJutsu URLs. Defaults to false (raw source URLs returned as-is).
             * @default false
             */
            download_media: boolean;
        };
        ScrapeTwitterTweetRequest: {
            /** @description Tweet URL or status URL */
            url: string;
            /** @description Reduce response size */
            trim?: boolean;
            /**
             * @description When true, media URLs in the response are staged through VidJutsu CDN and the response contains ONLY VidJutsu URLs. Defaults to false (raw source URLs returned as-is).
             * @default false
             */
            download_media: boolean;
        };
        ScrapeTwitterTweetTranscriptRequest: {
            /** @description Tweet URL */
            url: string;
        };
        ScrapeTwitterUserTweetsRequest: {
            /** @description X username */
            handle: string;
            /** @description Pagination cursor */
            cursor?: string;
            /** @description Reduce response size */
            trim?: boolean;
            /**
             * @description When true, media URLs in the response are staged through VidJutsu CDN and the response contains ONLY VidJutsu URLs. Defaults to false (raw source URLs returned as-is).
             * @default false
             */
            download_media: boolean;
        };
        ScrapeYouTubeChannelRequest: {
            /** @description Channel handle, e.g. @MrBeast */
            handle?: string;
            /** @description Channel ID, e.g. UC... */
            channel_id?: string;
            /**
             * @description When true, media URLs in the response are staged through VidJutsu CDN and the response contains ONLY VidJutsu URLs. Defaults to false (raw source URLs returned as-is).
             * @default false
             */
            download_media: boolean;
        };
        ScrapeYouTubeChannelVideosRequest: {
            /** @description Channel handle */
            handle?: string;
            /** @description Channel ID */
            channel_id?: string;
            /** @description Pagination cursor */
            cursor?: string;
            /**
             * @description When true, media URLs in the response are staged through VidJutsu CDN and the response contains ONLY VidJutsu URLs. Defaults to false (raw source URLs returned as-is).
             * @default false
             */
            download_media: boolean;
        };
        ScrapeYouTubeVideoCommentsRequest: {
            /** @description YouTube video URL */
            url: string;
            /** @description Pagination cursor */
            cursor?: string;
        };
        ScrapeYouTubeVideoRequest: {
            /** @description YouTube video URL */
            url: string;
            /**
             * @description When true, media URLs in the response are staged through VidJutsu CDN and the response contains ONLY VidJutsu URLs. Defaults to false (raw source URLs returned as-is).
             * @default false
             */
            download_media: boolean;
        };
        SocialVideoDownloadRequest: {
            /** Format: uri */
            url: string;
        };
        SocialVideoDownloadResult: {
            assetId: string;
            /** Format: uri */
            url: string;
            platform: components["schemas"]["SocialVideoPlatform"];
            externalId: string;
            /** Format: uri */
            sourceUrl: string;
            /** @enum {string} */
            contentType: "video/mp4";
            /** Format: int64 */
            size: number;
            sha256: string;
            reused: boolean;
        };
        /** @enum {string} */
        SocialVideoPlatform: "tiktok" | "instagram";
        StartingImageResult: {
            /** @enum {string} */
            kind: "starting_image";
            assetId: string;
            /** Format: uri */
            url?: string;
            characterId: string;
            sourceFingerprint: string;
        };
        SubscriptionCreateRequest: {
            email: string;
        };
        SubscriptionCreateResponse: {
            url: string;
            claimToken: string;
        };
        SubscriptionInfo: {
            /** @description Flat subscription price, e.g. "$99/mo". */
            price: string;
            /** @description Whether an active subscription is required for gated endpoints. */
            required: boolean;
        };
        Tag: {
            key: string;
            value: string;
        };
        TranscribeRequest: {
            /** @description URL of the video or audio to transcribe */
            mediaUrl: string;
            /** @description Language code (e.g. 'en', 'es'). Auto-detected if omitted */
            language?: string;
        };
        TranscribeResponse: {
            transcript: string;
            words: components["schemas"]["TranscribeWord"][];
            language: string;
            /** Format: double */
            duration: number;
        };
        TranscribeWord: {
            word: string;
            /** Format: double */
            start: number;
            /** Format: double */
            end: number;
        };
        UploadResponse: {
            assetId: string;
            url: string;
            key: string;
            /** Format: double */
            size: number;
        };
        UploadUrlRequest: {
            sourceUrl: string;
            contentType?: string;
        };
        UsageResponse: {
            clientId: string;
            usage: {
                [key: string]: components["schemas"]["UsageWindow"];
            };
            resetsAt: string;
        };
        UsageWindow: {
            /** Format: int32 */
            limit: number;
            /** Format: int32 */
            remaining: number;
        };
        VerifyConfirmBody: {
            email: string;
            code: string;
        };
        VerifyConfirmResponse: {
            /** @enum {string} */
            status: "verified";
            apiKey: string;
            clientId: string;
        };
        VerifyRequestBody: {
            email: string;
        };
        VerifyRequestResponse: {
            sent: boolean;
        };
        Video: {
            videoId: string;
            /** @enum {string} */
            sourceKind: "asset" | "http" | "youtube";
            status: components["schemas"]["VideoStatus"];
            title?: string;
            /** Format: double */
            durationSeconds?: number;
            fingerprint?: string;
            /** Format: int64 */
            createdAt: number;
        };
        /** @enum {string} */
        VideoCloneModel: "seedance" | "kling-motion-control";
        VideoResponse: {
            data: components["schemas"]["Video"];
        };
        VideoSource: components["schemas"]["AssetVideoSource"] | components["schemas"]["HttpVideoSource"] | components["schemas"]["YouTubeVideoSource"];
        /** @enum {string} */
        VideoStatus: "processing" | "ready" | "failed";
        WatchRequest: {
            /** @description URL of the media to analyze */
            mediaUrl: string;
            /** @description Freeform prompt — tell AI what to look for */
            prompt: string;
        };
        WatchResponse: {
            /** @description Structured JSON response from AI based on the prompt */
            response: {
                [key: string]: unknown;
            };
        };
        YouTubeVideoSource: {
            /** @enum {string} */
            kind: "youtube";
            /** Format: uri */
            url: string;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    listOrGetAccounts: {
        parameters: {
            query?: {
                id?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The request has succeeded. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Account"] | components["schemas"]["AccountListResponse"];
                };
            };
        };
    };
    updateAccount: {
        parameters: {
            query: {
                id: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AccountUpdateRequest"];
            };
        };
        responses: {
            /** @description The request has succeeded. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AccountUpdateResponse"];
                };
            };
        };
    };
    createAccount: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AccountCreateRequest"];
            };
        };
        responses: {
            /** @description The request has succeeded and a new resource has been created as a result. */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AccountCreateResponse"];
                };
            };
        };
    };
    deleteAccount: {
        parameters: {
            query: {
                id: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The request has succeeded. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AccountDeleteResponse"];
                };
            };
        };
    };
    createAgentTask: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateAgentTaskRequest"];
            };
        };
        responses: {
            /** @description The request has been accepted for processing, but processing has not yet completed. */
            202: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AgentTaskAccepted"];
                };
            };
            /** @description HTTP 403 Forbidden — a valid API key with no active subscription called a gated endpoint. Body is the standard ApiError with error="subscription_required". */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description HTTP 429 Too Many Requests — a per-endpoint daily rate limit was exceeded. The limit window is fixed and resets at 00:00 UTC. Body is the standard ApiError; a Retry-After header carries the seconds until reset. */
            429: {
                headers: {
                    "Retry-After"?: number;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    listAgentTaskEvents: {
        parameters: {
            query: {
                id: string;
                after?: string;
                limit?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The request has succeeded. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AgentTaskEventPage"];
                };
            };
            /** @description HTTP 403 Forbidden — a valid API key with no active subscription called a gated endpoint. Body is the standard ApiError with error="subscription_required". */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    recoverApiKey: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ApiKeyRecoverRequest"];
            };
        };
        responses: {
            /** @description The request has succeeded. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiKeyRecoverResponse"];
                };
            };
        };
    };
    rotateApiKey: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The request has succeeded. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiKeyRotateResponse"];
                };
            };
        };
    };
    listOrGetAssets: {
        parameters: {
            query?: {
                id?: string;
                type?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The request has succeeded. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Asset"] | components["schemas"]["AssetListResponse"];
                };
            };
        };
    };
    updateAsset: {
        parameters: {
            query: {
                id: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AssetUpdateRequest"];
            };
        };
        responses: {
            /** @description The request has succeeded. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AssetUpdateResponse"];
                };
            };
        };
    };
    createAsset: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AssetCreateRequest"];
            };
        };
        responses: {
            /** @description The request has succeeded and a new resource has been created as a result. */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AssetCreateResponse"];
                };
            };
        };
    };
    deleteAsset: {
        parameters: {
            query: {
                id: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The request has succeeded. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AssetDeleteResponse"];
                };
            };
        };
    };
    signupAgent: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AgentSignupBody"];
            };
        };
        responses: {
            /** @description The request has succeeded. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AgentSignupResponse"];
                };
            };
        };
    };
    agentClaim: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AgentClaimRequest"];
            };
        };
        responses: {
            /** @description The request has succeeded. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AgentClaimResponse"];
                };
            };
        };
    };
    agentClaimComplete: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AgentClaimCompleteRequest"];
            };
        };
        responses: {
            /** @description The request has succeeded. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AgentClaimCompleteResponse"];
                };
            };
        };
    };
    agentRevoke: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/logout+jwt": string;
            };
        };
        responses: {
            /** @description The request has succeeded. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AgentRevokeResponse"];
                };
            };
        };
    };
    confirmVerification: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["VerifyConfirmBody"];
            };
        };
        responses: {
            /** @description The request has succeeded. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["VerifyConfirmResponse"];
                };
            };
        };
    };
    requestVerification: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["VerifyRequestBody"];
            };
        };
        responses: {
            /** @description The request has succeeded. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["VerifyRequestResponse"];
                };
            };
        };
    };
    createCharacter: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateCharacterRequest"];
            };
        };
        responses: {
            /** @description The request has been accepted for processing, but processing has not yet completed. */
            202: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MediaJob"];
                };
            };
            /** @description HTTP 403 Forbidden — a valid API key with no active subscription called a gated endpoint. Body is the standard ApiError with error="subscription_required". */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    checkSpec: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CheckRequest"];
            };
        };
        responses: {
            /** @description The request has succeeded. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CheckResponse"];
                };
            };
            /** @description HTTP 403 Forbidden — a valid API key with no active subscription called a gated endpoint. Body is the standard ApiError with error="subscription_required". */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description HTTP 429 Too Many Requests — a per-endpoint daily rate limit was exceeded. The limit window is fixed and resets at 00:00 UTC. Body is the standard ApiError; a Retry-After header carries the seconds until reset. */
            429: {
                headers: {
                    "Retry-After"?: number;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    getCheckRules: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The request has succeeded. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CheckRulesResponse"];
                };
            };
        };
    };
    updateCheckRules: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CheckRulesUpdateRequest"];
            };
        };
        responses: {
            /** @description The request has succeeded. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CheckRulesResponse"];
                };
            };
        };
    };
    addClipBroll: {
        parameters: {
            query?: never;
            header?: {
                "Idempotency-Key"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AddBrollRequest"];
            };
        };
        responses: {
            /** @description The request has been accepted for processing, but processing has not yet completed. */
            202: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DistributionJob"];
                };
            };
            /** @description HTTP 403 Forbidden — a valid API key with no active subscription called a gated endpoint. Body is the standard ApiError with error="subscription_required". */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    addClipCaptions: {
        parameters: {
            query?: never;
            header?: {
                "Idempotency-Key"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AddCaptionsRequest"];
            };
        };
        responses: {
            /** @description The request has been accepted for processing, but processing has not yet completed. */
            202: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DistributionJob"];
                };
            };
            /** @description HTTP 403 Forbidden — a valid API key with no active subscription called a gated endpoint. Body is the standard ApiError with error="subscription_required". */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    generateClips: {
        parameters: {
            query?: never;
            header?: {
                "Idempotency-Key"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["GenerateClipsRequest"];
            };
        };
        responses: {
            /** @description The request has been accepted for processing, but processing has not yet completed. */
            202: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DistributionJob"];
                };
            };
            /** @description HTTP 403 Forbidden — a valid API key with no active subscription called a gated endpoint. Body is the standard ApiError with error="subscription_required". */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    cloneCheck: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CloneCheckRequest"];
            };
        };
        responses: {
            /** @description The request has been accepted for processing, but processing has not yet completed. */
            202: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MediaJob"];
                };
            };
            /** @description HTTP 403 Forbidden — a valid API key with no active subscription called a gated endpoint. Body is the standard ApiError with error="subscription_required". */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    cloneStartingImage: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CloneStartingImageRequest"];
            };
        };
        responses: {
            /** @description The request has been accepted for processing, but processing has not yet completed. */
            202: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MediaJob"];
                };
            };
            /** @description HTTP 403 Forbidden — a valid API key with no active subscription called a gated endpoint. Body is the standard ApiError with error="subscription_required". */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    cloneVideo: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CloneVideoRequest"];
            };
        };
        responses: {
            /** @description The request has been accepted for processing, but processing has not yet completed. */
            202: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MediaJob"];
                };
            };
            /** @description HTTP 403 Forbidden — a valid API key with no active subscription called a gated endpoint. Body is the standard ApiError with error="subscription_required". */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    checkCompliancePrompt: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CompliancePromptRequest"];
            };
        };
        responses: {
            /** @description The request has succeeded. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ComplianceCheckResponse"];
                };
            };
            /** @description HTTP 403 Forbidden — a valid API key with no active subscription called a gated endpoint. Body is the standard ApiError with error="subscription_required". */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description HTTP 429 Too Many Requests — a per-endpoint daily rate limit was exceeded. The limit window is fixed and resets at 00:00 UTC. Body is the standard ApiError; a Retry-After header carries the seconds until reset. */
            429: {
                headers: {
                    "Retry-After"?: number;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    checkComplianceVideo: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ComplianceVideoRequest"];
            };
        };
        responses: {
            /** @description The request has succeeded. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ComplianceCheckResponse"];
                };
            };
            /** @description HTTP 403 Forbidden — a valid API key with no active subscription called a gated endpoint. Body is the standard ApiError with error="subscription_required". */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description HTTP 429 Too Many Requests — a per-endpoint daily rate limit was exceeded. The limit window is fixed and resets at 00:00 UTC. Body is the standard ApiError; a Retry-After header carries the seconds until reset. */
            429: {
                headers: {
                    "Retry-After"?: number;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    getCheckoutStatus: {
        parameters: {
            query: {
                session: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The request has succeeded. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiKeyStatusResponse"];
                };
            };
        };
    };
    createDisclaimer: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["DisclaimerRequest"];
            };
        };
        responses: {
            /** @description The request has succeeded. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DisclaimerResponse"];
                };
            };
            /** @description HTTP 403 Forbidden — a valid API key with no active subscription called a gated endpoint. Body is the standard ApiError with error="subscription_required". */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description HTTP 429 Too Many Requests — a per-endpoint daily rate limit was exceeded. The limit window is fixed and resets at 00:00 UTC. Body is the standard ApiError; a Retry-After header carries the seconds until reset. */
            429: {
                headers: {
                    "Retry-After"?: number;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    listOrGetDistributionClips: {
        parameters: {
            query?: {
                id?: string;
                videoId?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The request has succeeded. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ClipResponse"] | components["schemas"]["ClipListResponse"];
                };
            };
            /** @description HTTP 403 Forbidden — a valid API key with no active subscription called a gated endpoint. Body is the standard ApiError with error="subscription_required". */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    getDistributionJob: {
        parameters: {
            query: {
                id: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The request has succeeded. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DistributionJob"];
                };
            };
            /** @description HTTP 403 Forbidden — a valid API key with no active subscription called a gated endpoint. Body is the standard ApiError with error="subscription_required". */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    extractMedia: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ExtractRequest"];
            };
        };
        responses: {
            /** @description The request has succeeded. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ExtractResponse"];
                };
            };
            /** @description HTTP 403 Forbidden — a valid API key with no active subscription called a gated endpoint. Body is the standard ApiError with error="subscription_required". */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description HTTP 429 Too Many Requests — a per-endpoint daily rate limit was exceeded. The limit window is fixed and resets at 00:00 UTC. Body is the standard ApiError; a Retry-After header carries the seconds until reset. */
            429: {
                headers: {
                    "Retry-After"?: number;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    getInfo: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The request has succeeded. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InfoResponse"];
                };
            };
        };
    };
    getJob: {
        parameters: {
            query: {
                id: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The request has succeeded. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MediaJob"];
                };
            };
            /** @description HTTP 403 Forbidden — a valid API key with no active subscription called a gated endpoint. Body is the standard ApiError with error="subscription_required". */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    createOverlay: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["OverlayRequest"];
            };
        };
        responses: {
            /** @description The request has succeeded. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["OverlayResponse"];
                };
            };
            /** @description HTTP 403 Forbidden — a valid API key with no active subscription called a gated endpoint. Body is the standard ApiError with error="subscription_required". */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description HTTP 429 Too Many Requests — a per-endpoint daily rate limit was exceeded. The limit window is fixed and resets at 00:00 UTC. Body is the standard ApiError; a Retry-After header carries the seconds until reset. */
            429: {
                headers: {
                    "Retry-After"?: number;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    listOrGetPosts: {
        parameters: {
            query?: {
                id?: string;
                accountId?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The request has succeeded. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Post"] | components["schemas"]["PostListResponse"];
                };
            };
        };
    };
    updatePost: {
        parameters: {
            query: {
                id: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PostUpdateRequest"];
            };
        };
        responses: {
            /** @description The request has succeeded. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PostUpdateResponse"];
                };
            };
        };
    };
    createPost: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PostCreateRequest"];
            };
        };
        responses: {
            /** @description The request has succeeded and a new resource has been created as a result. */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PostCreateResponse"];
                };
            };
        };
    };
    deletePost: {
        parameters: {
            query: {
                id: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The request has succeeded. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PostDeleteResponse"];
                };
            };
        };
    };
    getPricing: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The request has succeeded. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PricingResponse"];
                };
            };
        };
    };
    listOrGetEditorProjects: {
        parameters: {
            query?: {
                id?: string;
                status?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The request has succeeded. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EditorProject"] | components["schemas"]["EditorProjectListResponse"];
                };
            };
        };
    };
    updateEditorProject: {
        parameters: {
            query: {
                id: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["EditorProjectUpdateRequest"];
            };
        };
        responses: {
            /** @description The request has succeeded. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EditorProjectUpdateResponse"];
                };
            };
        };
    };
    createEditorProject: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["EditorProjectCreateRequest"];
            };
        };
        responses: {
            /** @description The request has succeeded and a new resource has been created as a result. */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EditorProjectCreateResponse"];
                };
            };
        };
    };
    deleteEditorProject: {
        parameters: {
            query: {
                id: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The request has succeeded. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EditorProjectDeleteResponse"];
                };
            };
        };
    };
    listOrGetReferences: {
        parameters: {
            query?: {
                id?: string;
                platform?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The request has succeeded. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Reference"] | components["schemas"]["ReferenceListResponse"];
                };
            };
        };
    };
    updateReference: {
        parameters: {
            query: {
                id: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ReferenceUpdateRequest"];
            };
        };
        responses: {
            /** @description The request has succeeded. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReferenceUpdateResponse"];
                };
            };
        };
    };
    createReference: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ReferenceCreateRequest"];
            };
        };
        responses: {
            /** @description The request has succeeded and a new resource has been created as a result. */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReferenceCreateResponse"];
                };
            };
        };
    };
    deleteReference: {
        parameters: {
            query: {
                id: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The request has succeeded. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReferenceDeleteResponse"];
                };
            };
        };
    };
    scrapeGoogleAds: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ScrapeGoogleAdsRequest"];
            };
        };
        responses: {
            /** @description The request has succeeded. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ScrapeResponse"];
                };
            };
            /** @description HTTP 403 Forbidden — a valid API key with no active subscription called a gated endpoint. Body is the standard ApiError with error="subscription_required". */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description HTTP 429 Too Many Requests — a per-endpoint daily rate limit was exceeded. The limit window is fixed and resets at 00:00 UTC. Body is the standard ApiError; a Retry-After header carries the seconds until reset. */
            429: {
                headers: {
                    "Retry-After"?: number;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    scrapeLinkedInAds: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ScrapeLinkedInAdsRequest"];
            };
        };
        responses: {
            /** @description The request has succeeded. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ScrapeResponse"];
                };
            };
            /** @description HTTP 403 Forbidden — a valid API key with no active subscription called a gated endpoint. Body is the standard ApiError with error="subscription_required". */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description HTTP 429 Too Many Requests — a per-endpoint daily rate limit was exceeded. The limit window is fixed and resets at 00:00 UTC. Body is the standard ApiError; a Retry-After header carries the seconds until reset. */
            429: {
                headers: {
                    "Retry-After"?: number;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    scrapeMetaAds: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ScrapeMetaAdsRequest"];
            };
        };
        responses: {
            /** @description The request has succeeded. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ScrapeResponse"];
                };
            };
            /** @description HTTP 403 Forbidden — a valid API key with no active subscription called a gated endpoint. Body is the standard ApiError with error="subscription_required". */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description HTTP 429 Too Many Requests — a per-endpoint daily rate limit was exceeded. The limit window is fixed and resets at 00:00 UTC. Body is the standard ApiError; a Retry-After header carries the seconds until reset. */
            429: {
                headers: {
                    "Retry-After"?: number;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    scrapeRedditAds: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ScrapeRedditAdsRequest"];
            };
        };
        responses: {
            /** @description The request has succeeded. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ScrapeResponse"];
                };
            };
            /** @description HTTP 403 Forbidden — a valid API key with no active subscription called a gated endpoint. Body is the standard ApiError with error="subscription_required". */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description HTTP 429 Too Many Requests — a per-endpoint daily rate limit was exceeded. The limit window is fixed and resets at 00:00 UTC. Body is the standard ApiError; a Retry-After header carries the seconds until reset. */
            429: {
                headers: {
                    "Retry-After"?: number;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    scrapeInstagramPost: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ScrapeInstagramPostRequest"];
            };
        };
        responses: {
            /** @description The request has succeeded. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ScrapeResponse"];
                };
            };
            /** @description HTTP 403 Forbidden — a valid API key with no active subscription called a gated endpoint. Body is the standard ApiError with error="subscription_required". */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description HTTP 429 Too Many Requests — a per-endpoint daily rate limit was exceeded. The limit window is fixed and resets at 00:00 UTC. Body is the standard ApiError; a Retry-After header carries the seconds until reset. */
            429: {
                headers: {
                    "Retry-After"?: number;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    scrapeInstagramPostComments: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ScrapeInstagramPostCommentsRequest"];
            };
        };
        responses: {
            /** @description The request has succeeded. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ScrapeResponse"];
                };
            };
            /** @description HTTP 403 Forbidden — a valid API key with no active subscription called a gated endpoint. Body is the standard ApiError with error="subscription_required". */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description HTTP 429 Too Many Requests — a per-endpoint daily rate limit was exceeded. The limit window is fixed and resets at 00:00 UTC. Body is the standard ApiError; a Retry-After header carries the seconds until reset. */
            429: {
                headers: {
                    "Retry-After"?: number;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    scrapeInstagramProfile: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ScrapeInstagramProfileRequest"];
            };
        };
        responses: {
            /** @description The request has succeeded. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ScrapeResponse"];
                };
            };
            /** @description HTTP 403 Forbidden — a valid API key with no active subscription called a gated endpoint. Body is the standard ApiError with error="subscription_required". */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description HTTP 429 Too Many Requests — a per-endpoint daily rate limit was exceeded. The limit window is fixed and resets at 00:00 UTC. Body is the standard ApiError; a Retry-After header carries the seconds until reset. */
            429: {
                headers: {
                    "Retry-After"?: number;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    scrapeInstagramUserPosts: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ScrapeInstagramUserPostsRequest"];
            };
        };
        responses: {
            /** @description The request has succeeded. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ScrapeResponse"];
                };
            };
            /** @description HTTP 403 Forbidden — a valid API key with no active subscription called a gated endpoint. Body is the standard ApiError with error="subscription_required". */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description HTTP 429 Too Many Requests — a per-endpoint daily rate limit was exceeded. The limit window is fixed and resets at 00:00 UTC. Body is the standard ApiError; a Retry-After header carries the seconds until reset. */
            429: {
                headers: {
                    "Retry-After"?: number;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    scrapeInstagramUserReels: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ScrapeInstagramUserReelsRequest"];
            };
        };
        responses: {
            /** @description The request has succeeded. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ScrapeResponse"];
                };
            };
            /** @description HTTP 403 Forbidden — a valid API key with no active subscription called a gated endpoint. Body is the standard ApiError with error="subscription_required". */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description HTTP 429 Too Many Requests — a per-endpoint daily rate limit was exceeded. The limit window is fixed and resets at 00:00 UTC. Body is the standard ApiError; a Retry-After header carries the seconds until reset. */
            429: {
                headers: {
                    "Retry-After"?: number;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    scrapeTikTokProfile: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ScrapeTikTokProfileRequest"];
            };
        };
        responses: {
            /** @description The request has succeeded. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ScrapeResponse"];
                };
            };
            /** @description HTTP 403 Forbidden — a valid API key with no active subscription called a gated endpoint. Body is the standard ApiError with error="subscription_required". */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description HTTP 429 Too Many Requests — a per-endpoint daily rate limit was exceeded. The limit window is fixed and resets at 00:00 UTC. Body is the standard ApiError; a Retry-After header carries the seconds until reset. */
            429: {
                headers: {
                    "Retry-After"?: number;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    scrapeTikTokProfileVideos: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ScrapeTikTokProfileVideosRequest"];
            };
        };
        responses: {
            /** @description The request has succeeded. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ScrapeResponse"];
                };
            };
            /** @description HTTP 403 Forbidden — a valid API key with no active subscription called a gated endpoint. Body is the standard ApiError with error="subscription_required". */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description HTTP 429 Too Many Requests — a per-endpoint daily rate limit was exceeded. The limit window is fixed and resets at 00:00 UTC. Body is the standard ApiError; a Retry-After header carries the seconds until reset. */
            429: {
                headers: {
                    "Retry-After"?: number;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    scrapeTikTokSearchUsers: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ScrapeTikTokSearchUsersRequest"];
            };
        };
        responses: {
            /** @description The request has succeeded. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ScrapeResponse"];
                };
            };
            /** @description HTTP 403 Forbidden — a valid API key with no active subscription called a gated endpoint. Body is the standard ApiError with error="subscription_required". */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description HTTP 429 Too Many Requests — a per-endpoint daily rate limit was exceeded. The limit window is fixed and resets at 00:00 UTC. Body is the standard ApiError; a Retry-After header carries the seconds until reset. */
            429: {
                headers: {
                    "Retry-After"?: number;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    scrapeTikTokTrending: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ScrapeTikTokTrendingRequest"];
            };
        };
        responses: {
            /** @description The request has succeeded. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ScrapeResponse"];
                };
            };
            /** @description HTTP 403 Forbidden — a valid API key with no active subscription called a gated endpoint. Body is the standard ApiError with error="subscription_required". */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description HTTP 429 Too Many Requests — a per-endpoint daily rate limit was exceeded. The limit window is fixed and resets at 00:00 UTC. Body is the standard ApiError; a Retry-After header carries the seconds until reset. */
            429: {
                headers: {
                    "Retry-After"?: number;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    scrapeTikTokVideo: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ScrapeTikTokVideoRequest"];
            };
        };
        responses: {
            /** @description The request has succeeded. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ScrapeResponse"];
                };
            };
            /** @description HTTP 403 Forbidden — a valid API key with no active subscription called a gated endpoint. Body is the standard ApiError with error="subscription_required". */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description HTTP 429 Too Many Requests — a per-endpoint daily rate limit was exceeded. The limit window is fixed and resets at 00:00 UTC. Body is the standard ApiError; a Retry-After header carries the seconds until reset. */
            429: {
                headers: {
                    "Retry-After"?: number;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    scrapeTikTokVideoComments: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ScrapeTikTokVideoCommentsRequest"];
            };
        };
        responses: {
            /** @description The request has succeeded. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ScrapeResponse"];
                };
            };
            /** @description HTTP 403 Forbidden — a valid API key with no active subscription called a gated endpoint. Body is the standard ApiError with error="subscription_required". */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description HTTP 429 Too Many Requests — a per-endpoint daily rate limit was exceeded. The limit window is fixed and resets at 00:00 UTC. Body is the standard ApiError; a Retry-After header carries the seconds until reset. */
            429: {
                headers: {
                    "Retry-After"?: number;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    scrapeTikTokVideoTranscript: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ScrapeTikTokVideoTranscriptRequest"];
            };
        };
        responses: {
            /** @description The request has succeeded. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ScrapeResponse"];
                };
            };
            /** @description HTTP 403 Forbidden — a valid API key with no active subscription called a gated endpoint. Body is the standard ApiError with error="subscription_required". */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description HTTP 429 Too Many Requests — a per-endpoint daily rate limit was exceeded. The limit window is fixed and resets at 00:00 UTC. Body is the standard ApiError; a Retry-After header carries the seconds until reset. */
            429: {
                headers: {
                    "Retry-After"?: number;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    scrapeTwitterProfile: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ScrapeTwitterProfileRequest"];
            };
        };
        responses: {
            /** @description The request has succeeded. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ScrapeResponse"];
                };
            };
            /** @description HTTP 403 Forbidden — a valid API key with no active subscription called a gated endpoint. Body is the standard ApiError with error="subscription_required". */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description HTTP 429 Too Many Requests — a per-endpoint daily rate limit was exceeded. The limit window is fixed and resets at 00:00 UTC. Body is the standard ApiError; a Retry-After header carries the seconds until reset. */
            429: {
                headers: {
                    "Retry-After"?: number;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    scrapeTwitterTweet: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ScrapeTwitterTweetRequest"];
            };
        };
        responses: {
            /** @description The request has succeeded. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ScrapeResponse"];
                };
            };
            /** @description HTTP 403 Forbidden — a valid API key with no active subscription called a gated endpoint. Body is the standard ApiError with error="subscription_required". */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description HTTP 429 Too Many Requests — a per-endpoint daily rate limit was exceeded. The limit window is fixed and resets at 00:00 UTC. Body is the standard ApiError; a Retry-After header carries the seconds until reset. */
            429: {
                headers: {
                    "Retry-After"?: number;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    scrapeTwitterTweetTranscript: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ScrapeTwitterTweetTranscriptRequest"];
            };
        };
        responses: {
            /** @description The request has succeeded. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ScrapeResponse"];
                };
            };
            /** @description HTTP 403 Forbidden — a valid API key with no active subscription called a gated endpoint. Body is the standard ApiError with error="subscription_required". */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description HTTP 429 Too Many Requests — a per-endpoint daily rate limit was exceeded. The limit window is fixed and resets at 00:00 UTC. Body is the standard ApiError; a Retry-After header carries the seconds until reset. */
            429: {
                headers: {
                    "Retry-After"?: number;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    scrapeTwitterUserTweets: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ScrapeTwitterUserTweetsRequest"];
            };
        };
        responses: {
            /** @description The request has succeeded. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ScrapeResponse"];
                };
            };
            /** @description HTTP 403 Forbidden — a valid API key with no active subscription called a gated endpoint. Body is the standard ApiError with error="subscription_required". */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description HTTP 429 Too Many Requests — a per-endpoint daily rate limit was exceeded. The limit window is fixed and resets at 00:00 UTC. Body is the standard ApiError; a Retry-After header carries the seconds until reset. */
            429: {
                headers: {
                    "Retry-After"?: number;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    scrapeYouTubeChannel: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ScrapeYouTubeChannelRequest"];
            };
        };
        responses: {
            /** @description The request has succeeded. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ScrapeResponse"];
                };
            };
            /** @description HTTP 403 Forbidden — a valid API key with no active subscription called a gated endpoint. Body is the standard ApiError with error="subscription_required". */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description HTTP 429 Too Many Requests — a per-endpoint daily rate limit was exceeded. The limit window is fixed and resets at 00:00 UTC. Body is the standard ApiError; a Retry-After header carries the seconds until reset. */
            429: {
                headers: {
                    "Retry-After"?: number;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    scrapeYouTubeChannelVideos: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ScrapeYouTubeChannelVideosRequest"];
            };
        };
        responses: {
            /** @description The request has succeeded. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ScrapeResponse"];
                };
            };
            /** @description HTTP 403 Forbidden — a valid API key with no active subscription called a gated endpoint. Body is the standard ApiError with error="subscription_required". */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description HTTP 429 Too Many Requests — a per-endpoint daily rate limit was exceeded. The limit window is fixed and resets at 00:00 UTC. Body is the standard ApiError; a Retry-After header carries the seconds until reset. */
            429: {
                headers: {
                    "Retry-After"?: number;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    scrapeYouTubeVideo: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ScrapeYouTubeVideoRequest"];
            };
        };
        responses: {
            /** @description The request has succeeded. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ScrapeResponse"];
                };
            };
            /** @description HTTP 403 Forbidden — a valid API key with no active subscription called a gated endpoint. Body is the standard ApiError with error="subscription_required". */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description HTTP 429 Too Many Requests — a per-endpoint daily rate limit was exceeded. The limit window is fixed and resets at 00:00 UTC. Body is the standard ApiError; a Retry-After header carries the seconds until reset. */
            429: {
                headers: {
                    "Retry-After"?: number;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    scrapeYouTubeVideoComments: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ScrapeYouTubeVideoCommentsRequest"];
            };
        };
        responses: {
            /** @description The request has succeeded. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ScrapeResponse"];
                };
            };
            /** @description HTTP 403 Forbidden — a valid API key with no active subscription called a gated endpoint. Body is the standard ApiError with error="subscription_required". */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description HTTP 429 Too Many Requests — a per-endpoint daily rate limit was exceeded. The limit window is fixed and resets at 00:00 UTC. Body is the standard ApiError; a Retry-After header carries the seconds until reset. */
            429: {
                headers: {
                    "Retry-After"?: number;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    createSubscription: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SubscriptionCreateRequest"];
            };
        };
        responses: {
            /** @description The request has succeeded. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SubscriptionCreateResponse"];
                };
            };
        };
    };
    transcribeMedia: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TranscribeRequest"];
            };
        };
        responses: {
            /** @description The request has succeeded. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TranscribeResponse"];
                };
            };
            /** @description HTTP 403 Forbidden — a valid API key with no active subscription called a gated endpoint. Body is the standard ApiError with error="subscription_required". */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description HTTP 429 Too Many Requests — a per-endpoint daily rate limit was exceeded. The limit window is fixed and resets at 00:00 UTC. Body is the standard ApiError; a Retry-After header carries the seconds until reset. */
            429: {
                headers: {
                    "Retry-After"?: number;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    uploadFile: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "*/*": string;
            };
        };
        responses: {
            /** @description The request has succeeded and a new resource has been created as a result. */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UploadResponse"];
                };
            };
            /** @description HTTP 403 Forbidden — a valid API key with no active subscription called a gated endpoint. Body is the standard ApiError with error="subscription_required". */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description HTTP 429 Too Many Requests — a per-endpoint daily rate limit was exceeded. The limit window is fixed and resets at 00:00 UTC. Body is the standard ApiError; a Retry-After header carries the seconds until reset. */
            429: {
                headers: {
                    "Retry-After"?: number;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    uploadFromUrl: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UploadUrlRequest"];
            };
        };
        responses: {
            /** @description The request has succeeded and a new resource has been created as a result. */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UploadResponse"];
                };
            };
            /** @description HTTP 403 Forbidden — a valid API key with no active subscription called a gated endpoint. Body is the standard ApiError with error="subscription_required". */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description HTTP 429 Too Many Requests — a per-endpoint daily rate limit was exceeded. The limit window is fixed and resets at 00:00 UTC. Body is the standard ApiError; a Retry-After header carries the seconds until reset. */
            429: {
                headers: {
                    "Retry-After"?: number;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    getUsage: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The request has succeeded. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UsageResponse"];
                };
            };
        };
    };
    addVideo: {
        parameters: {
            query?: never;
            header?: {
                "Idempotency-Key"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AddVideoRequest"];
            };
        };
        responses: {
            /** @description The request has been accepted for processing, but processing has not yet completed. */
            202: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DistributionJob"];
                };
            };
            /** @description HTTP 403 Forbidden — a valid API key with no active subscription called a gated endpoint. Body is the standard ApiError with error="subscription_required". */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    downloadInstagramVideo: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SocialVideoDownloadRequest"];
            };
        };
        responses: {
            /** @description The request has succeeded. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SocialVideoDownloadResult"];
                };
            };
            /** @description HTTP 403 Forbidden — a valid API key with no active subscription called a gated endpoint. Body is the standard ApiError with error="subscription_required". */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description HTTP 429 Too Many Requests — a per-endpoint daily rate limit was exceeded. The limit window is fixed and resets at 00:00 UTC. Body is the standard ApiError; a Retry-After header carries the seconds until reset. */
            429: {
                headers: {
                    "Retry-After"?: number;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    downloadTikTokVideo: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SocialVideoDownloadRequest"];
            };
        };
        responses: {
            /** @description The request has succeeded. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SocialVideoDownloadResult"];
                };
            };
            /** @description HTTP 403 Forbidden — a valid API key with no active subscription called a gated endpoint. Body is the standard ApiError with error="subscription_required". */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description HTTP 429 Too Many Requests — a per-endpoint daily rate limit was exceeded. The limit window is fixed and resets at 00:00 UTC. Body is the standard ApiError; a Retry-After header carries the seconds until reset. */
            429: {
                headers: {
                    "Retry-After"?: number;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    watchMedia: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["WatchRequest"];
            };
        };
        responses: {
            /** @description The request has succeeded. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["WatchResponse"];
                };
            };
            /** @description HTTP 403 Forbidden — a valid API key with no active subscription called a gated endpoint. Body is the standard ApiError with error="subscription_required". */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description HTTP 429 Too Many Requests — a per-endpoint daily rate limit was exceeded. The limit window is fixed and resets at 00:00 UTC. Body is the standard ApiError; a Retry-After header carries the seconds until reset. */
            429: {
                headers: {
                    "Retry-After"?: number;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
}
