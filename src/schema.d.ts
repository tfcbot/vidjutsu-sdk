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
         * @description Validate a VidLang spec against enabled rules. Rules are off by default — caller must enable at least one. 5 credits.
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
         * @description Load per-client custom rules. 0 credits.
         */
        get: operations["getCheckRules"];
        /**
         * Update check rules
         * @description Save per-client custom rules. 0 credits.
         */
        put: operations["updateCheckRules"];
        post?: never;
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
        /** Check checkout status */
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
         * @description Burns a fine-print disclaimer centered at the bottom of a video using FFmpeg ASS subtitles. Use for FTC-style disclosures like results-not-typical, paid-endorsement, or AI-generated labels. Returns CDN URL of the result. 5 credits.
         */
        post: operations["createDisclaimer"];
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
         * @description Pull frames, audio, and metadata from a video via server-side processing. 5 credits.
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
         * @description Burns text overlay onto a video using FFmpeg ASS subtitles. Supports TikTok-safe zones, configurable font size, stroke thickness, and top/center/bottom positioning. Returns CDN URL of the result. 5 credits.
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
    "/v1/subscribe": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Create subscription */
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
         * @description Speech-to-text with word-level timing. 10 credits.
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
         * @description AI watches a video or image and answers your freeform prompt. Returns structured JSON. 10 credits.
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
            /** @enum {number} */
            creditsCharged: 0;
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
            /** Format: int32 */
            balance?: number;
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
        CreditCosts: {
            /**
             * Format: int32
             * @description Create account (free)
             */
            "accounts.create": number;
            /**
             * Format: int32
             * @description Create post (free)
             */
            "posts.create": number;
            /**
             * Format: int32
             * @description Watch media via Gemini
             */
            watch: number;
            /**
             * Format: int32
             * @description Extract frames/audio/metadata
             */
            extract: number;
            /**
             * Format: int32
             * @description Transcribe speech to text
             */
            transcribe: number;
            /**
             * Format: int32
             * @description Check spec against rules
             */
            check: number;
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
        InfoResponse: {
            name: string;
            version: string;
            endpoints: {
                [key: string]: string;
            };
            auth: unknown;
            credits: components["schemas"]["CreditCosts"];
        };
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
            /** @enum {number} */
            creditsCharged: 0;
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
            pricePerCredit: string;
            /** Format: int32 */
            maxAccounts: number;
            costs: components["schemas"]["CreditCosts"];
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
            /** @enum {number} */
            creditsCharged: 0;
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
        SubscriptionCreateRequest: {
            email: string;
        };
        SubscriptionCreateResponse: {
            url: string;
            claimToken: string;
        };
        SubscriptionInfo: {
            price: string;
            /** Format: int32 */
            includedCredits: number;
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
        };
    };
}
